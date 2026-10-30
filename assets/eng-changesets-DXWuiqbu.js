var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 Monorepo 里有组件库 <code>ui</code>、工具包 <code>utils</code>，<code>ui</code> 依赖 <code>utils</code>。这周三个人分别改了这两个包，发版时就要回答：每个包升到几？依赖它的包要不要跟着升？更新日志写什么？靠发版的人去翻提交记录，很容易漏。</p>
<p>Changesets 的做法是把这个决定提前到写代码的时候。开发者提 PR 时运行 <code>changeset</code>，选上改了哪些包、每个包是 major、minor 还是 patch，再写一句给使用者看的说明，生成一个 Markdown 文件放进 <code>.changeset</code> 目录，跟代码一起评审。</p>
<p>发版时运行 <code>changeset version</code>，它把所有 changeset 合并：同一个包有多个 changeset，取其中最高的升级类型；更新版本号和 CHANGELOG；包内依赖的版本范围也跟着更新，然后删掉这些 changeset 文件。最后 <code>changeset publish</code> 只发布 npm 上还没有的版本，并打上 <code>包名@版本</code> 格式的 git 标签。</p>
<p>Lerna 的思路是发版时再决定。<code>lerna version</code> 找出上次发版以来改过的包，默认所有包共用 <code>lerna.json</code> 里的一个版本号，也可以切到独立模式，每个包单独选；加 <code>--conventional-commits</code> 可以按提交信息推算版本、生成 CHANGELOG。要注意，两种工具只负责算版本和发包，改动兼不兼容仍是人判断的。</p>
</blockquote>
<h2>changeset 文件长什么样</h2>
<p>运行 <code>npx @changesets/cli init</code> 初始化以后，每次改动后运行 <code>npx @changesets/cli</code>（装在项目里可以直接写 <code>changeset</code>），按提示选包、选升级类型、写说明，会生成这样一个文件：</p>
<div class="not-prose code-block"><div class="code-language">md</div><pre><code class="hljs language-md">---
&quot;utils&quot;: minor
&quot;ui&quot;: patch
---

utils 新增 formatPrice；ui 的价格组件改用它，修复了负数显示错误。
</code></pre></div>
<p>上面的 YAML 写的是哪些包、各升哪一级，下面的正文会原样写进 CHANGELOG。文件名是随机生成的可读名字，避免多人同时提交时冲突，也可以手动改名。</p>
<p>为什么不直接从 git 提交记录里生成？Changesets 官方的解释是，git 提交信息不适合写详细的变更说明，而改动刚做完、提 PR 的时候，是记下“这次改了什么、使用者要怎么改代码”的最好时机。不需要发版的改动，比如只改了文档或测试，可以不写 changeset，官方也不建议因为缺 changeset 就拦住 PR。</p>
<h2>version 怎样合并 changeset、算出新版本</h2>
<p>一个包可能攒了好几个 changeset。官方文档的规则是：合并成一次升级，取其中最高的类型。比如 <code>packageA</code> 在 1.1.1，有两个 minor 和一个 patch，结果升到 1.2.0，而不是升三次。下面用几行代码模拟这个规则：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> rank = { <span class="hljs-attr">patch</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">minor</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">major</span>: <span class="hljs-number">3</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">mergeBumps</span>(<span class="hljs-params">changesets</span>) {
  <span class="hljs-keyword">const</span> result = {};
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> cs <span class="hljs-keyword">of</span> changesets) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [pkg, type] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(cs)) {
      <span class="hljs-keyword">if</span> (!result[pkg] || rank[type] &gt; rank[result[pkg]]) result[pkg] = type;
    }
  }
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">bump</span>(<span class="hljs-params">version, type</span>) {
  <span class="hljs-keyword">const</span> [major, minor, patch] = version.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;.&#x27;</span>).<span class="hljs-title function_">map</span>(<span class="hljs-title class_">Number</span>);
  <span class="hljs-keyword">if</span> (type === <span class="hljs-string">&#x27;major&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${major + <span class="hljs-number">1</span>}</span>.0.0\`</span>;
  <span class="hljs-keyword">if</span> (type === <span class="hljs-string">&#x27;minor&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${major}</span>.<span class="hljs-subst">\${minor + <span class="hljs-number">1</span>}</span>.0\`</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${major}</span>.<span class="hljs-subst">\${minor}</span>.<span class="hljs-subst">\${patch + <span class="hljs-number">1</span>}</span>\`</span>;
}

<span class="hljs-keyword">const</span> pending = [{ <span class="hljs-attr">packageA</span>: <span class="hljs-string">&#x27;minor&#x27;</span> }, { <span class="hljs-attr">packageA</span>: <span class="hljs-string">&#x27;patch&#x27;</span> }, { <span class="hljs-attr">packageA</span>: <span class="hljs-string">&#x27;minor&#x27;</span>, <span class="hljs-attr">packageB</span>: <span class="hljs-string">&#x27;patch&#x27;</span> }];
<span class="hljs-keyword">const</span> merged = <span class="hljs-title function_">mergeBumps</span>(pending);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(merged)); <span class="hljs-comment">// {&quot;packageA&quot;:&quot;minor&quot;,&quot;packageB&quot;:&quot;patch&quot;}</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">bump</span>(<span class="hljs-string">&#x27;1.1.1&#x27;</span>, merged.<span class="hljs-property">packageA</span>)); <span class="hljs-comment">// 1.2.0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">bump</span>(<span class="hljs-string">&#x27;2.0.0&#x27;</span>, merged.<span class="hljs-property">packageB</span>)); <span class="hljs-comment">// 2.0.1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">bump</span>(<span class="hljs-string">&#x27;0.9.3&#x27;</span>, <span class="hljs-string">&#x27;major&#x27;</span>)); <span class="hljs-comment">// 1.0.0</span>
</code></pre></div>
<p><code>packageA</code> 有两个 minor、一个 patch，合并后是 minor，所以从 1.1.1 升到 1.2.0，patch 位归零。为什么只升一次？官方的说法是，这样 changeset 可以放心地不断累积，每个包每次发版只会发一个新版本。</p>
<p>这段代码只演示合并规则。真实的 <code>changeset version</code> 还会处理预发布版本、<code>fixed</code> 和 <code>linked</code> 分组、被忽略的包等情况。</p>
<h2>包内依赖怎样跟着更新</h2>
<p><code>packageB</code> 依赖 <code>packageA</code>，范围是 <code>^1.1.0</code>。如果 <code>packageA</code> 升了 major，变成 2.0.0，这个范围就不再包含新版本。官方的技术决策文档说，生成 changeset 时会检查这种情况：所选的包升级后会让 Monorepo 里别的包的依赖范围失效，就把那些包也加进来，以 patch 升级。官方说明所有因依赖而来的升级都是 patch，如果想表达更大的变化，要给依赖方单独再写一个 changeset。否则开发时 <code>packageB</code> 用的是本地的 <code>packageA</code> 2.0.0，用户安装时却装到 1.x，两边对不上。</p>
<p>依赖范围还在的时候，要不要跟着改，由配置里的 <code>updateInternalDependencies</code> 决定，默认是 <code>&quot;patch&quot;</code>：<code>packageA</code> 和 <code>packageB</code> 都发 patch 时，<code>packageB</code> 里对 <code>packageA</code> 的范围会从 <code>^1.0.0</code> 改成 <code>^1.0.1</code>。设成 <code>&quot;minor&quot;</code> 时，只有 <code>packageA</code> 发 minor 及以上才更新范围。文档特别提醒，只有依赖方本身也在这次发版里，它的依赖范围才会被更新。</p>
<p>有时候几个包希望一起变版本。<code>fixed</code> 让一组包始终保持同一个版本号，组里没改的包也会一起升级、一起发布；<code>linked</code> 只让组里有 changeset 的包按组内最高版本和最高升级类型一起算，没有 changeset 的包不发。比如 <code>fixed: [[&quot;pkg-a&quot;, &quot;pkg-b&quot;]]</code>，<code>pkg-a</code> 发 patch、<code>pkg-b</code> 发 minor，两个包都从 1.0.0 升到 1.1.0。</p>
<h2>怎样发布、怎样在 CI 里自动化</h2>
<p><code>changeset version</code> 改完版本号和 CHANGELOG，要先检查、提交。之后运行 <code>changeset publish</code>，它进入每个包，检查 <code>package.json</code> 里的版本在 npm 上是否已经发布，没发布的才执行 <code>npm publish</code>（或者对应包管理器的发布命令）。它默认给每个包打 <code>pkg-name@X.X.X</code> 格式的 git 标签，要用 <code>git push --follow-tags</code> 推上去。第一次发布作用域包时，要在 <code>.changeset/config.json</code> 里把 <code>access</code> 设成 <code>&quot;public&quot;</code>。</p>
<p>官方推荐用 Changesets GitHub Action 自动化：有 changeset 时，Action 运行 version，并创建或更新一个版本 PR；这个 PR 合并以后，changeset 已被消费，Action 检查到有可发布的包，就去发布。这样发版就变成合并一个 PR。<code>changeset status</code> 在包有改动但没有 changeset 时会以退出码 1 结束，可以用在 CI 里提醒。</p>
<h2>Lerna 怎样做</h2>
<p>Lerna 的版本发布由 <code>lerna version</code> 和 <code>lerna publish</code> 完成。<code>lerna version</code> 找出上次发版以来改过的包，让你选新版本，然后更新 <code>package.json</code>、提交、打标签并推送；<code>lerna publish</code> 在这之上再发布到 npm，<code>lerna publish from-package</code> 则只发布那些 <code>package.json</code> 里的版本还没发到 npm 的包。</p>
<p>Lerna 有两种模式。默认是固定模式，所有包共用 <code>lerna.json</code> 里的 <code>version</code>，发版时改过的包都升到这个新版本，标签是 <code>v1.0.0</code> 这种形式。用 <code>lerna init --independent</code> 或把 <code>version</code> 设成 <code>&quot;independent&quot;</code> 进入独立模式，每次发版会对每个改过的包分别询问升 patch、minor、major 还是自定义版本。</p>
<p>版本号怎么定？默认是交互式选择，发版的人现场决定。加上 <code>--conventional-commits</code> 后，<code>lerna version</code> 会用 conventional-changelog 根据提交信息推算升级类型，并生成 CHANGELOG.md，前提是团队按约定格式写提交信息，比如 <code>feat:</code>、<code>fix:</code>。</p>
<h2>两者怎么选</h2>
<p>两者的核心区别是“谁、在什么时候决定版本”。Changesets 由写代码的人在 PR 里决定，决定和说明都经过评审，适合多人协作、包之间独立发版的仓库。Lerna 由发版的人在发版时决定，或者按提交信息推算，适合希望所有包统一版本号，或者团队已经严格执行提交规范的仓库。</p>
<p>两者都依赖语义化版本的约定。版本号只是发布者的承诺，升级是否真的兼容，仍要靠测试和评审，见<a href="/questions/eng-semver/">《语义化版本号能否保证升级一定安全？》</a>。Monorepo 本身怎样组织工作区和任务编排，见<a href="/questions/eng-monorepo/">《Monorepo 与 npm workspaces 能解决什么问题？》</a>。</p>
<h2>常见追问</h2>
<p><strong>一个 PR 里可以有多个 changeset 吗？</strong></p>
<blockquote>
<p>可以。官方说明 changeset 本来就是设计成可以叠加的。想给不同的包写不同的更新日志，或者一个包里有几处改动想分开列出，都可以各写一个。发版时它们会被合并，每个包仍然只升一次。</p>
</blockquote>
<p><strong>私有包或者应用不发 npm，还需要 Changesets 吗？</strong></p>
<blockquote>
<p>可以只用它管版本号和 CHANGELOG。配置里的 <code>ignore</code> 可以指定不发布的包，即使 changeset 里写了它们，这些 changeset 也会先被跳过，直到把包从 <code>ignore</code> 里移除。只想管版本号不发包时，CI 里只运行 version 不运行 publish 就行。</p>
</blockquote>
<p><strong>怎样发一个测试用的预览版本？</strong></p>
<blockquote>
<p>用快照版本。在单独的分支上运行 <code>changeset version --snapshot preview</code>，版本号会变成 <code>0.0.0-preview-{时间}</code> 这种形式，再用 <code>changeset publish --tag preview</code> 发布。官方特别强调一定要加 <code>--tag</code>，否则它会占用 <code>latest</code>，别人默认安装就装到了快照版本。</p>
</blockquote>`};export{e as default};