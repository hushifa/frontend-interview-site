var e={answerHtml:`<h2>简答</h2>
<ul>
<li>workflow 是 <code>.github/workflows/</code> 下的一个 YAML 文件，由事件（push、pull_request、定时等）触发。</li>
<li>一个 workflow 包含多个 job，job 默认并行执行，用 <code>needs</code> 声明先后顺序。</li>
<li>每个 job 在独立的 runner（虚拟机或容器）上运行，job 之间不共享文件系统。</li>
<li>job 由一系列 step 顺序组成，step 可以运行 shell 命令或调用现成的 action，同一 job 内的 step 共享工作目录。</li>
<li>缓存用于加速依赖安装，产物（artifact）用于在 job 之间或流水线结束后传递构建结果，两者用途不同。</li>
</ul>
<h2>一个前端检查流程</h2>
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
<h2>层级关系</h2>
<table><thead><tr><th>层级</th><th>作用</th><th>隔离性</th></tr></thead><tbody><tr><td>workflow</td><td>定义何时触发、包含哪些 job</td><td>每次触发是一次独立运行</td></tr><tr><td>job</td><td>一组在同一台机器上执行的步骤</td><td>每个 job 一台全新的 runner</td></tr><tr><td>step</td><td>一条命令或一个 action</td><td>同一 job 内共享文件和环境</td></tr><tr><td>runner</td><td>实际执行的机器</td><td>GitHub 托管或自托管</td></tr></tbody></table>
<p>某个 step 失败，后续 step 默认跳过，job 失败；依赖它的 job 也不会运行。</p>
<h2>缓存和产物</h2>
<ul>
<li><strong>缓存</strong>：<code>setup-node</code> 的 <code>cache: npm</code> 按锁文件哈希缓存 npm 下载目录，命中后安装更快。缓存可能失效或被清除，流程不能依赖它一定存在。</li>
<li><strong>产物</strong>：<code>upload-artifact</code> 保存构建结果，供后续 job 下载，或在运行页面上手动下载。上例中 e2e job 直接使用 check job 构建出的 <code>dist</code>，避免重复构建。</li>
</ul>
<h2>检查成功不等于已部署</h2>
<p>这个 workflow 只做检查和构建，产物在运行结束后按保留期过期。部署需要单独的步骤或 workflow，例如推送到托管仓库、上传到对象存储，或使用 GitHub Pages 的部署 action，通常还会配置环境（environment）审批和单独的权限。</p>
<h2>权限与安全</h2>
<ul>
<li>用 <code>permissions</code> 把默认的 <code>GITHUB_TOKEN</code> 权限降到最低，只在需要时授予写权限。</li>
<li>来自 fork 的 pull_request 默认拿不到仓库 secrets，不要为了方便改用 <code>pull_request_target</code> 去运行不可信代码。</li>
<li>第三方 action 可以固定到提交哈希，防止标签被改指向恶意代码。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样同时在多个 Node 版本上测试？用 <code>strategy.matrix</code> 声明版本列表，GitHub 会为每个组合启动一个 job。</li>
<li>job 之间怎么传递一个字符串值？用 <code>outputs</code> 声明输出，下游 job 通过 <code>needs.&lt;job&gt;.outputs.&lt;name&gt;</code> 读取。</li>
</ul>`};export{e as default};