var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同事提了一个合并请求，流水线自动装依赖、跑 lint、类型检查、单元测试和构建，任何一步失败就不允许合并；合并进主分支后，再自动构建并发布到测试环境，确认没问题后发布到生产。这一整套就是前端的 CI/CD：CI 负责“这份代码能不能合”，CD 负责“合进来的代码怎样安全地上线”。</p>
<p>设计时最重要的是把两段分开。检查阶段会运行别人提交的代码，所以只给只读权限，也不接触部署密钥。部署阶段只在主分支或标签上触发，构建只做一次，把产物传给部署 job，测试环境和生产环境用的是同一份产物。</p>
<p>部署 job 绑定一个 environment，比如 <code>production</code>。在 environment 上配置审批人、等待时间和允许部署的分支，规则通过之前 job 不会开始执行，也拿不到这个环境的密钥。再用 <code>concurrency</code> 让同一环境同一时间只有一次部署在跑。</p>
<p>要注意，缓存只用来加速依赖安装，不能当作部署来源，也不能存敏感数据；云平台凭证尽量用 OIDC 换取短期令牌，而不是长期保存在密钥里。</p>
</blockquote>
<h2>一条流水线分成哪几段</h2>
<p>先看整体结构。下面是一个 GitHub Actions workflow 的骨架，省略了每个 step 的细节，重点看 job 之间的关系：</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist

  deploy:
    if: github.event_name == &#x27;push&#x27;
    needs: check
    runs-on: ubuntu-latest
    environment: production
    concurrency:
      group: deploy-production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - run: ./deploy.sh
</code></pre></div>
<p>合并请求只会跑 <code>check</code>，因为 <code>deploy</code> 上有 <code>if</code> 条件，只在推送到 <code>main</code> 时执行。<code>needs: check</code> 让部署一定排在检查之后，检查失败就不会部署。job、step、runner 的基本关系见<a href="/questions/git-ci/">《GitHub Actions 中 workflow、job、step 和 runner 是什么关系？》</a>。</p>
<p>为什么部署 job 不自己再构建一次？因为构建结果会受依赖版本、环境变量、构建时间影响，重新构建出来的不一定是刚才测过的那份。把检查阶段的产物上传，部署阶段下载后直接发布，才能保证“测的就是发的”。如果有测试环境和生产环境两步，也应该是同一份产物先后发到两个环境，而不是各构建一次。</p>
<h2>缓存和产物不要混用</h2>
<p>GitHub 文档对两者的区分很明确：缓存用于在多次运行之间复用不常变化的文件，比如包管理器下载的依赖，缓存不存在时 job 也必须能重新下载或生成；产物用于保存 job 生成的文件，比如构建结果和日志，在 job 之间传递或在运行结束后查看。</p>
<p>所以 <code>dist</code> 走产物，<code>node_modules</code> 或 npm 下载缓存走缓存。文档还提醒，能读到缓存的运行会原样恢复缓存内容，应该把恢复出来的文件当作不可信输入，缓存里不要放密钥等敏感数据。</p>
<h2>部署门槛放在 environment 上</h2>
<p>environment 是 GitHub 上的一个部署目标，比如 <code>staging</code>、<code>production</code>。可以给它配置保护规则：需要指定的人审批、部署前等待一段时间、只允许特定分支或标签部署。文档说明，job 引用了 environment 时，保护规则全部通过后 job 才会被发送到 runner，并且只有发送到 runner 之后，job 才能读取这个环境的密钥。</p>
<p>这就解决了一个常见问题：生产环境的密钥放在仓库级别时，任何能改 workflow 的分支都可能读到它。放进 <code>production</code> 环境并限制只有 <code>main</code> 能部署，其他分支即使写了引用这个环境的 job，也过不了保护规则。</p>
<h2>两次部署同时进行怎么办</h2>
<p>连续合并两个请求，会触发两次部署。如果两次同时往服务器上传文件，最后线上可能是两份产物混在一起。<code>concurrency</code> 用来解决这个问题：同一个并发组里同一时间最多只有一个 job 或 workflow 在运行，新排队的会进入 <code>pending</code> 状态，并且默认会取消组里已经在等待的那一个，由新的顶替。</p>
<p>如果希望新的部署直接取消正在运行的旧部署，可以加 <code>cancel-in-progress: true</code>。检查流程适合这么做，同一个分支推了新提交，旧的检查就没有意义了。部署流程一般不加，因为中途取消可能留下一半新文件、一半旧文件。</p>
<h2>凭证怎样管理</h2>
<p>部署到云平台需要凭证。传统做法是在云平台创建一个长期有效的访问密钥，再复制到 GitHub 的 secrets 里。GitHub 文档推荐用 OIDC：在云平台上配置对 GitHub 的信任关系，workflow 运行时向云平台申请一个短期访问令牌，GitHub 里就不需要保存长期的云凭证。</p>
<p>无论用哪种方式，都要用 <code>permissions</code> 把默认的 <code>GITHUB_TOKEN</code> 权限降到最低，只给需要的 job 单独加权限。使用 OIDC 时，部署 job 需要 <code>id-token: write</code> 权限。</p>
<h2>上线以后还要做什么</h2>
<p>部署成功只代表文件传上去了。流水线最后通常再访问几个关键页面做冒烟检查，确认首页能打开、主要接口能返回。回滚最快的方式是保留上一份产物，出问题时直接重新发布它，不需要重新构建。发布前怎样检查资源路径和缓存见<a href="/questions/git-static-deploy/">《静态托管发布时为什么要检查资源路径和缓存？》</a>，按比例放量见<a href="/questions/git-canary-release/">《前端怎样做灰度发布和金丝雀发布？出问题怎样回滚？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么合并请求的检查不能接触密钥？</strong></p>
<blockquote>
<p>合并请求里的代码是还没审核过的，它可以改测试脚本、改构建配置，让流水线执行任意命令。如果这时候能读到部署密钥，提交者就能把密钥打印出来或者直接部署。所以检查阶段只读、无密钥，部署放到合并以后，并用 environment 限制分支。</p>
</blockquote>
<p><strong><code>npm ci</code> 和 <code>npm install</code> 在流水线里用哪个？</strong></p>
<blockquote>
<p>用 <code>npm ci</code>。它严格按 lock 文件安装，lock 文件和 package.json 不一致时直接报错，并且会先删除已有的 <code>node_modules</code>，每次装出来的依赖都一样，适合自动化环境。</p>
</blockquote>
<p><strong>测试环境和生产环境配置不同，怎样做到同一份产物？</strong></p>
<blockquote>
<p>把环境差异放到构建产物之外，比如部署时写入一个配置文件，或者页面启动时请求配置接口。如果把接口地址这类值在构建时写死进代码，每个环境就只能各构建一次，“测的就是发的”也就做不到了。</p>
</blockquote>`};export{e as default};