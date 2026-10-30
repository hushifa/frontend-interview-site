var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>workflow 是一整条自动化流程，写在 <code>.github/workflows/</code> 下的一个 YAML 文件里，由 push、pull_request、定时等事件触发。</p>
<p>一个 workflow 里有多个 job，job 默认并行执行，要排先后就用 <code>needs</code>。每个 job 跑在一台独立的 runner 上，runner 就是实际执行的虚拟机或容器，所以 job 之间不共享文件。job 里面是一串按顺序执行的 step，每个 step 运行一条 shell 命令或者调用一个现成的 action，同一个 job 里的 step 共享工作目录。</p>
<p>要在多个 Node 版本或系统上跑同一套测试，用 <code>strategy.matrix</code> 列出取值，GitHub 会为每个组合启动一个 job。</p>
<p>要注意，job 之间传文件要靠产物（artifact）上传和下载，检查跑通了也不等于网站已经部署。缓存与产物的区别和部署阶段的设计见<a href="/questions/git-cicd-pipeline/">《前端 CI/CD 流水线怎样设计？》</a>。</p>
</blockquote>
<h2>一个前端检查流程</h2>
<p>下面的 workflow 有两个 job：<code>check</code> 负责检查和构建，<code>e2e</code> 拿构建结果跑端到端测试。</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml"># .github/workflows/ci.yml
name: 检查与构建
on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run format:check
      - run: npm run check
      - run: npm run build
      - uses: actions/upload-artifact@v7
        with:
          name: dist
          path: dist

  e2e:
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/download-artifact@v8
        with:
          name: dist
          path: dist
      - run: npx playwright test
</code></pre></div>
<p>你可能会奇怪，<code>e2e</code> 为什么又要 <code>checkout</code> 一遍代码？因为它跑在另一台全新的 runner 上，<code>check</code> 那台机器上的文件它一个都看不到。同样的道理，<code>dist</code> 也不能直接用，要靠 <code>check</code> 上传成产物，<code>e2e</code> 再下载下来。</p>
<p><code>needs: check</code> 让 <code>e2e</code> 等 <code>check</code> 成功后再开始。没写 <code>needs</code> 的话，两个 job 会同时启动。</p>
<h2>四个层级的关系</h2>
<table><thead><tr><th>层级</th><th>作用</th><th>隔离性</th></tr></thead><tbody><tr><td>workflow</td><td>定义何时触发、包含哪些 job</td><td>每次触发是一次独立运行</td></tr><tr><td>job</td><td>一组在同一台机器上执行的步骤</td><td>每个 job 一台全新的 runner</td></tr><tr><td>step</td><td>一条命令或一个 action</td><td>同一 job 内共享文件和环境</td></tr><tr><td>runner</td><td>实际执行的机器</td><td>GitHub 托管或自托管</td></tr></tbody></table>
<p>某个 step 失败后，后面的 step 默认跳过，这个 job 失败，依赖它的 job 也不会运行。所以上例里格式检查没过，就不会去构建，也不会跑端到端测试。</p>
<h2>什么事件会触发 workflow</h2>
<p><code>on</code> 决定 workflow 什么时候运行。上例写了两种事件：<code>pull_request</code> 在合并请求创建或更新时触发，<code>push</code> 加上 <code>branches: [main]</code> 只在推送到 main 分支时触发。常见的还有 <code>schedule</code>，用 cron 语法定时运行；<code>workflow_dispatch</code>，在仓库的 Actions 页面上手动点按钮运行。</p>
<p>一次触发对应一次 workflow 运行（run），运行页面上能看到每个 job 和每个 step 的日志。</p>
<h2>矩阵怎样一次跑多个环境</h2>
<p>想同时在 Node 22 和 24 上跑测试，不用复制两个 job，用 <code>strategy.matrix</code> 声明变量的取值，GitHub 会为每个取值组合启动一个独立的 job：</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [22, 24]
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: \${{ matrix.node }}
      - run: npm ci
      - run: npm test
</code></pre></div>
<p>两个系统乘两个版本，一共 4 个 job，默认并行执行。每个 job 里用 <code>\${{ matrix.node }}</code> 读到自己那一组的值。矩阵里某个 job 失败时，默认会取消同一矩阵里其他还在跑的 job，想让它们都跑完可以设置 <code>fail-fast: false</code>。</p>
<h2>和部署流水线的分工</h2>
<p>上面的 workflow 只做检查和构建，没有把产物放到任何网站上，所以检查成功不等于已经部署。缓存和产物该怎样分工、部署凭证怎样管理、检查和部署阶段怎样拆开，见<a href="/questions/git-cicd-pipeline/">《前端 CI/CD 流水线怎样设计？》</a>。</p>
<h2>常见追问</h2>
<p><strong>job 之间怎样传一个字符串值？</strong></p>
<blockquote>
<p>在上游 job 里用 <code>outputs</code> 声明输出，下游 job 通过 <code>needs.&lt;job&gt;.outputs.&lt;name&gt;</code> 读取。传文件要用产物，因为两个 job 不在同一台 runner 上。</p>
</blockquote>
<p><strong>runner 一定是 GitHub 提供的吗？</strong></p>
<blockquote>
<p>不一定。<code>runs-on: ubuntu-latest</code> 用的是 GitHub 托管的 runner，每个 job 一台全新的虚拟机。也可以在自己的机器上安装 runner 程序，注册成自托管 runner，适合需要特殊硬件或内网访问的场景。</p>
</blockquote>`};export{e as default};