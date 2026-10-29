var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>workflow 是一整条自动化流程，写在 <code>.github/workflows/</code> 下的一个 YAML 文件里，由 push、pull_request、定时等事件触发。</p>
<p>一个 workflow 里有多个 job，job 默认并行执行，要排先后就用 <code>needs</code>。每个 job 跑在一台独立的 runner 上，runner 就是实际执行的虚拟机或容器，所以 job 之间不共享文件。job 里面是一串按顺序执行的 step，每个 step 运行一条 shell 命令或者调用一个现成的 action，同一个 job 里的 step 共享工作目录。</p>
<p>数据传递要分清缓存和产物。缓存用来让依赖安装更快，产物（artifact）用来在 job 之间或者流水线结束后传递构建结果。</p>
<p>还要注意，检查流程跑通了，不等于网站已经部署。部署要另外的步骤或 workflow。</p>
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
<h2>缓存和产物有什么区别</h2>
<p>缓存是为了快。<code>setup-node</code> 的 <code>cache: npm</code> 按锁文件的哈希缓存 npm 的下载目录，下次命中了，安装就快很多。但是缓存可能失效或被清掉，流程不能依赖它一定存在。</p>
<p>产物是为了传结果。<code>upload-artifact</code> 把构建结果保存下来，后面的 job 可以下载，也可以在运行页面上手动下载。上例中 <code>e2e</code> 直接用 <code>check</code> 构建出的 <code>dist</code>，避免重复构建。</p>
<h2>检查成功为什么不等于已部署</h2>
<p>这个 workflow 只做检查和构建，产物在运行结束后按保留期过期，没有被放到任何网站上。部署需要单独的步骤或 workflow，比如推送到托管仓库、上传到对象存储，或者用 GitHub Pages 的部署 action，通常还会配置环境（environment）审批和单独的权限。</p>
<h2>权限和安全要注意什么</h2>
<p>用 <code>permissions</code> 把默认的 <code>GITHUB_TOKEN</code> 权限降到最低，只在确实需要时才给写权限，上例就只给了 <code>contents: read</code>。</p>
<p>来自 fork 的 pull_request 默认拿不到仓库的 secrets。不要为了方便改用 <code>pull_request_target</code> 去运行不可信的代码，那样外部代码就能接触到 secrets。</p>
<p>第三方 action 可以固定到提交哈希，防止有人把标签改指到恶意代码上。</p>
<h2>常见追问</h2>
<p><strong>怎样同时在多个 Node 版本上测试？</strong></p>
<blockquote>
<p>用 <code>strategy.matrix</code> 声明版本列表，GitHub 会为每个组合启动一个 job。</p>
</blockquote>
<p><strong>job 之间怎样传一个字符串值？</strong></p>
<blockquote>
<p>在上游 job 里用 <code>outputs</code> 声明输出，下游 job 通过 <code>needs.&lt;job&gt;.outputs.&lt;name&gt;</code> 读取。</p>
</blockquote>`};export{e as default};