var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>渐进增强是先做一个最基础、最朴素也能用的版本，比如纯 HTML 的内容、原生的链接和表单，然后在支持的环境里再叠加样式和脚本功能。优雅降级反过来，先做完整体验，再给能力不够的环境准备退路。</p>
<p>两者的区别在出发点。渐进增强从核心任务出发，所以核心任务始终可用；优雅降级从完整体验出发，退路是后补的，容易漏掉。</p>
<p>判断环境支不支持某个功能，要用特性检测，也就是直接检查这个能力在不在，比如 <code>&#x27;share&#x27; in navigator</code>、CSS 的 <code>@supports</code>，而不是看浏览器名字和版本号。</p>
<p>要注意，“能力不足”不只是浏览器老。脚本加载失败、超时、运行报错，也是能力不足。所以基础功能不应该完全依赖 JS 成功执行。</p>
</blockquote>
<h2>一个搜索表单怎样做渐进增强</h2>
<p>先写一个不需要任何脚本就能用的表单：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">&quot;/search&quot;</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;get&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;search&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;q&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;search&quot;</span> <span class="hljs-attr">required</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;搜索题目&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>搜索<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<p>再用脚本把它增强成在当前页显示结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> form = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#search&#x27;</span>);
form.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;submit&#x27;</span>, <span class="hljs-title function_">async</span> (event) =&gt; {
  event.<span class="hljs-title function_">preventDefault</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">showResultsInline</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">FormData</span>(form).<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>));
  } <span class="hljs-keyword">catch</span> {
    form.<span class="hljs-title function_">submit</span>(); <span class="hljs-comment">// 增强失败时回到原生提交</span>
  }
});
</code></pre></div>
<p>没有 JS 时，表单照常提交到 <code>/search</code>，由服务端或预渲染页面返回结果。有 JS 时，结果直接显示在当前页，体验更好。</p>
<p>那 JS 执行出错怎么办？<code>catch</code> 里调用 <code>form.submit()</code>，回到原生提交。这样最坏情况也就是退回到没有脚本的体验，而不是用户点了按钮毫无反应。</p>
<h2>为什么检测能力，不检测浏览器</h2>
<p>下面两段分别在 JS 和 CSS 里做特性检测：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;share&#x27;</span> <span class="hljs-keyword">in</span> navigator) {
  shareButton.<span class="hljs-property">hidden</span> = <span class="hljs-literal">false</span>;
} <span class="hljs-keyword">else</span> {
  copyLinkButton.<span class="hljs-property">hidden</span> = <span class="hljs-literal">false</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> { <span class="hljs-attribute">display</span>: block; }

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">display</span>: <span class="hljs-attribute">grid</span>) {
  <span class="hljs-selector-class">.layout</span> { <span class="hljs-attribute">display</span>: grid; <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">1</span>fr <span class="hljs-number">3</span>fr; }
}
</code></pre></div>
<p>支持分享 API 就显示“分享”按钮，不支持就显示“复制链接”。支持 Grid 就用两栏布局，不支持就保持普通的块布局。</p>
<p>为什么不直接判断“是不是 Chrome 某某版本”？因为同一个浏览器，不同版本、不同设置的能力并不一样，比如企业策略可能禁用了某些 API。直接检查能力本身，才是准确的。</p>
<h2>增强层反而破坏基础功能的情况</h2>
<p>增强的本意是让体验更好，可写得不好会把原本能用的东西弄坏。常见的几种：</p>
<ul>
<li>用 <code>&lt;div onclick&gt;</code> 代替链接做导航。JS 加载前点不了，也没法在新标签页打开。</li>
<li>所有内容都靠客户端渲染。脚本加载慢或失败时，页面就是一片空白。</li>
<li>用自定义下拉框替换原生 <code>&lt;select&gt;</code>，却没实现键盘操作。</li>
<li>加载脚本前先用 CSS 把内容隐藏起来。脚本一失败，内容就永远不显示了。</li>
</ul>
<p>这些问题的共同点是，增强层替换掉了原生能力，却没把原生能力的全部行为补回来。</p>
<h2>对方案选择有什么影响</h2>
<p>内容型网站，比如文档、博客、电商详情页，适合预渲染加渐进增强。首屏不依赖脚本，搜索引擎收录也更可靠。</p>
<p>复杂的交互应用，比如在线编辑器、设计工具，核心功能本身就离不开 JS。这时更现实的做法是明确支持哪些浏览器，对不支持的环境给出提示。</p>
<p>新的 CSS 特性和 Web API，先用特性检测包起来，只在支持的环境里启用。</p>
<h2>常见追问</h2>
<p><strong>SSR 就是渐进增强吗？</strong></p>
<blockquote>
<p>不完全是。SSR 提供了基础 HTML，内容能先显示出来。但如果按钮、表单这些交互要等水合完成才能工作，那水合之前它们还是不可用的。要做到渐进增强，还得配合原生表单和链接。</p>
</blockquote>
<p><strong>这样做会增加多少成本？</strong></p>
<blockquote>
<p>主要成本是坚持用语义化 HTML 和原生控件。而这本身也是无障碍的要求，并不算额外的负担。</p>
</blockquote>`};export{e as default};