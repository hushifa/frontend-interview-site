var e={answerHtml:`<h2>简答</h2>
<ul>
<li>渐进增强从最基础的可用版本出发（HTML 内容、原生链接和表单），再在支持的环境中叠加样式和脚本功能。</li>
<li>优雅降级从完整体验出发，为能力不足的环境准备退路。</li>
<li>两者的区别在于设计起点：渐进增强保证核心任务始终可用，优雅降级容易遗漏退路。</li>
<li>用特性检测（<code>&#x27;share&#x27; in navigator</code>、<code>@supports</code>）判断能力，不用浏览器名称或版本号判断。</li>
<li>脚本加载失败、超时或报错也属于&quot;能力不足&quot;，基础功能不应完全依赖 JS 成功执行。</li>
</ul>
<h2>一个搜索表单</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">&quot;/search&quot;</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;get&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;search&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;q&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;search&quot;</span> <span class="hljs-attr">required</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;搜索题目&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>搜索<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
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
<ul>
<li>没有 JS 时，表单正常提交到 <code>/search</code>，服务端或预渲染页面返回结果。</li>
<li>有 JS 时，在当前页面显示结果，体验更好。</li>
<li>JS 执行出错时回退到原生行为，而不是让按钮无响应。</li>
</ul>
<h2>特性检测</h2>
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
<p>检测具体能力而不是浏览器，因为同一个浏览器的不同版本、不同设置（如企业策略禁用某些 API）能力不同。</p>
<h2>增强层破坏基础功能的例子</h2>
<ul>
<li>用 <code>&lt;div onclick&gt;</code> 代替链接实现导航，JS 加载前无法点击，也不能在新标签打开。</li>
<li>客户端渲染全部内容，脚本加载慢或失败时页面空白。</li>
<li>自定义下拉框替换原生 <code>&lt;select&gt;</code>，却没有实现键盘操作。</li>
<li>加载脚本前用 CSS 隐藏内容，脚本失败后内容永远不显示。</li>
</ul>
<h2>对方案选择的影响</h2>
<ul>
<li>内容型网站（文档、博客、电商详情）适合预渲染加渐进增强，首屏和搜索收录都更可靠。</li>
<li>复杂的交互应用（在线编辑器、设计工具）核心功能本身依赖 JS，更适合明确支持的浏览器范围并对不支持的环境给出提示。</li>
<li>新 CSS 和 Web API 先用特性检测包裹，在支持的环境中启用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>SSR 就是渐进增强吗？SSR 提供了基础 HTML，但如果交互（按钮、表单）只在水合后才能工作，水合前仍然不可用，需要配合原生表单和链接。</li>
<li>这样会增加多少成本？主要是坚持使用语义化 HTML 和原生控件，这本身也是无障碍的要求。</li>
</ul>`};export{e as default};