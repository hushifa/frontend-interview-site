var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>键盘用户打开一个网站，每个页面顶部都有几十个导航链接，想看正文就得一路按 Tab 穿过去。Skip link 就是放在页面最前面的一个“跳到主内容”链接，按一次 Tab 聚焦到它，回车后焦点直接落到主内容。</p>
<p>这对应 WCAG 2.4.1 绕过区块，是 A 级要求：在多个页面重复出现的内容块，比如导航、页头、广告，要有办法跳过。官方列出的充分技术里，第一个就是在每页顶部加一个直达主内容的链接；用 ARIA 地标或者标题标出各个区域，也属于充分技术。</p>
<p>实现上，链接写成 <code>&lt;a href=&quot;#main&quot;&gt;跳到主内容&lt;/a&gt;</code>，放在 <code>&lt;body&gt;</code> 里第一个可聚焦的位置。W3C 建议它一直可见；只在获得焦点时显示也符合要求，所以常见写法是平时移出视口，<code>:focus</code> 时移回来。目标元素加 <code>tabindex=&quot;-1&quot;</code>，让它能被聚焦，但不会进入 Tab 顺序。</p>
<p>单页应用要多考虑一步。切换路由时页面不会重新加载，焦点可能还停在刚点的那个链接上，读屏用户也不知道页面已经换了。所以导航完成后，要更新 <code>document.title</code>，再把焦点移到新内容的 <code>&lt;h1&gt;</code> 或主区域上，同样给它加 <code>tabindex=&quot;-1&quot;</code>。</p>
</blockquote>
<h2>一个 skip link 怎样写</h2>
<p>下面是最小的写法。链接是 <code>&lt;body&gt;</code> 里第一个可聚焦元素，目标是 <code>&lt;main&gt;</code>：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">body</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;skip-link&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;#main&quot;</span>&gt;</span>跳到主内容<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">header</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">nav</span>&gt;</span><span class="hljs-comment">&lt;!-- 很多导航链接 --&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">nav</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">header</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">main</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;main&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>订单列表<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">body</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.skip-link</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">left</span>: <span class="hljs-number">8px</span>;
  <span class="hljs-attribute">top</span>: -<span class="hljs-number">40px</span>;
}

<span class="hljs-selector-class">.skip-link</span><span class="hljs-selector-pseudo">:focus</span> {
  <span class="hljs-attribute">top</span>: <span class="hljs-number">8px</span>;
}
</code></pre></div>
<p>读者可能会问，为什么不直接 <code>display: none</code>，聚焦时再显示？因为 HTML 规范要求可聚焦的元素必须正在被渲染，<code>display: none</code> 的元素没有被渲染，不能获得焦点，用户按 Tab 根本到不了它；MDN 也说明它会被移出无障碍树。把它移出视口，元素仍然可以聚焦，聚焦时再移回来就看得见了。</p>
<p>W3C 的 G1 技术建议这个链接最好一直可见，因为切换设备用户、屏幕放大用户、语音控制用户都能从中受益；不过 2.4.1 本身只要求它在获得键盘焦点时可见。</p>
<p><code>&lt;main&gt;</code> 上的 <code>tabindex=&quot;-1&quot;</code> 是为了让它能被聚焦。MDN 的说明是，负值的 <code>tabindex</code> 表示元素不能通过 Tab 顺序到达，但可以用 <code>focus()</code> 方法聚焦。所以它不会在 Tab 顺序里多出一个停留点。不要用正数 <code>tabindex</code> 把链接排到前面，MDN 明确建议只用 0 和 -1，正数会打乱键盘用户的操作顺序。</p>
<h2>怎样验收</h2>
<p>G1 的测试步骤可以直接拿来用：页面上第一个可聚焦的控件是一个链接；链接文字说明它通向主内容；链接一直可见，或者获得键盘焦点时可见；激活链接后，焦点移到主内容；之后键盘焦点停留在主内容里，再按 Tab 会到达主内容里的下一个可交互元素。</p>
<p>这几步可以放进整页的键盘验收里一起做，见<a href="/questions/a11y-keyboard/">《怎样验证一个页面可以只用键盘操作？》</a>。</p>
<h2>SPA 切换路由后焦点放到哪里</h2>
<p>传统多页网站点链接后整页重新加载，焦点回到页面开头，读屏软件会读出新页面。单页应用只是替换了一部分 DOM，这些都不会自动发生。焦点可能停在被点击的导航链接上，甚至停在一个已经被删掉的元素上。</p>
<p>常见的做法是在路由切换完成后做两件事：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">onRouteChange</span>(<span class="hljs-params">title</span>) {
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = title;
  <span class="hljs-keyword">const</span> heading = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;main h1&#x27;</span>);
  heading?.<span class="hljs-title function_">focus</span>();
}
</code></pre></div>
<p>前提是这个 <code>&lt;h1&gt;</code> 也带 <code>tabindex=&quot;-1&quot;</code>，否则普通的标题元素不能被脚本聚焦。焦点落在标题上，读屏软件会读出新页面的标题，键盘用户接着按 Tab 就从新内容开始。路由层面还要处理哪些事，比如滚动位置和数据加载，见<a href="/questions/state-router/">《前端路由除切换组件外还需要管理什么？》</a>。</p>
<p>聚焦标题之外，也可以用 <code>aria-live</code> 区域播报“已进入订单列表”，见<a href="/questions/a11y-live-region/">《aria-live 怎样用于动态状态播报？》</a>。两种方式可以一起用，但聚焦解决的是“下一步从哪里开始操作”，播报只解决“知道页面变了”。</p>
<h2>常见追问</h2>
<p><strong>页面已经用了 <code>&lt;main&gt;</code>、<code>&lt;nav&gt;</code> 这些地标，还需要 skip link 吗？</strong></p>
<blockquote>
<p>从 2.4.1 的角度看，ARIA 地标和标题都属于官方列出的充分技术，读屏用户可以按地标或标题跳转。但没有读屏软件的键盘用户用不了这些快捷方式，所以很多网站两者都做。</p>
</blockquote>
<p><strong>导航在页面底部，也要加 skip link 吗？</strong></p>
<blockquote>
<p>不一定。官方理解文档的说明是，2.4.1 关心的是在到达主内容之前要穿过的重复内容；导航放在页面底部时，可能就不需要跳过链接。</p>
</blockquote>
<p><strong><code>tabindex=&quot;-1&quot;</code> 能加到任意元素上吗？</strong></p>
<blockquote>
<p>能加，但目的要明确。它适合“需要被脚本聚焦、但不该出现在 Tab 顺序里”的元素，比如主内容容器、新页面标题、出错时要聚焦的提示。不要用它或者 <code>tabindex=&quot;0&quot;</code> 把 <code>&lt;div&gt;</code> 伪装成按钮，MDN 建议直接用 <code>&lt;button&gt;</code>、<code>&lt;a&gt;</code> 这类原生交互元素。</p>
</blockquote>`};export{e as default};