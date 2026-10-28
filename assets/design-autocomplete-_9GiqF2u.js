var e={answerHtml:`<h2>简答</h2>
<ul>
<li>输入防抖：停止输入一段时间（如 200～300ms）后再请求，减少无意义请求；中文输入法组字期间不应触发搜索。</li>
<li>竞态：新请求发出时用 <code>AbortController</code> 取消旧请求，并在结果返回时核对它对应的关键词仍是当前输入，否则丢弃。</li>
<li>缓存：按规范化后的关键词缓存结果，回删时直接命中；缓存要有容量上限和过期时间。</li>
<li>键盘与无障碍：按 combobox 模式实现，DOM 焦点留在输入框，用 <code>aria-activedescendant</code> 指向高亮项，方向键切换、Enter 选中、Escape 关闭。</li>
</ul>
<h2>防抖与输入法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> timer;
input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">isComposing</span>) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 组字中不搜索，compositionend 后再处理</span>
  <span class="hljs-built_in">clearTimeout</span>(timer);
  timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">search</span>(input.<span class="hljs-property">value</span>), <span class="hljs-number">250</span>);
});
</code></pre></div>
<p>防抖的实现见<a href="/questions/alg-debounce/">《怎样实现只在停止调用后执行的防抖函数？》</a>，输入法与竞态的组合处理见<a href="/questions/browser-ime-search/">《中文输入法期间怎样触发搜索？composition 与请求竞态如何一起处理？》</a>。</p>
<h2>竞态与取消</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> controller;
<span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();

<span class="hljs-keyword">const</span> <span class="hljs-title function_">normalize</span> = (<span class="hljs-params">value</span>) =&gt; value.<span class="hljs-title function_">trim</span>().<span class="hljs-title function_">toLowerCase</span>();

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">search</span>(<span class="hljs-params">raw</span>) {
  <span class="hljs-keyword">const</span> keyword = <span class="hljs-title function_">normalize</span>(raw);
  <span class="hljs-keyword">if</span> (!keyword) <span class="hljs-keyword">return</span> <span class="hljs-title function_">render</span>([]);
  <span class="hljs-keyword">if</span> (cache.<span class="hljs-title function_">has</span>(keyword)) <span class="hljs-keyword">return</span> <span class="hljs-title function_">render</span>(cache.<span class="hljs-title function_">get</span>(keyword));

  controller?.<span class="hljs-title function_">abort</span>();
  controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/suggest?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(keyword)}</span>\`</span>, {
      <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
    });
    <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${res.status}</span>\`</span>); <span class="hljs-comment">// 错误响应不进缓存</span>
    <span class="hljs-keyword">const</span> list = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>();
    cache.<span class="hljs-title function_">set</span>(keyword, list);
    <span class="hljs-keyword">if</span> (keyword === <span class="hljs-title function_">normalize</span>(input.<span class="hljs-property">value</span>)) <span class="hljs-title function_">render</span>(list); <span class="hljs-comment">// 只渲染当前关键词的结果</span>
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-title function_">renderError</span>();
  }
}
</code></pre></div>
<p>只靠取消不够：请求可能在 <code>abort()</code> 之前已经返回并进入解析阶段，所以渲染前仍要核对关键词。<code>AbortController</code> 只能让前端不再等待，服务端可能已经处理完请求，见<a href="/questions/api-abort/">《AbortController 能取消什么，不能取消什么？》</a>。</p>
<p>关键词放进 URL 时用 <code>encodeURIComponent</code> 编码；渲染建议项时用文本节点或框架的默认转义，高亮匹配片段也不要拼接 HTML 字符串，避免 XSS。</p>
<h2>缓存</h2>
<ul>
<li>键用规范化后的关键词（去首尾空格、统一大小写），避免同义输入重复请求。</li>
<li>用 <code>Map</code> 按插入顺序淘汰最旧项，设置上限（如 50 条）。</li>
<li>数据会变化的场景给缓存设置过期时间。</li>
</ul>
<h2>键盘与 ARIA</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;city&quot;</span>&gt;</span>城市<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;combobox&quot;</span> <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;city-list&quot;</span>
  <span class="hljs-attr">aria-autocomplete</span>=<span class="hljs-string">&quot;list&quot;</span> <span class="hljs-attr">aria-activedescendant</span>=<span class="hljs-string">&quot;city-opt-2&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-list&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;listbox&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-opt-1&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span>&gt;</span>北京<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-opt-2&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>上海<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<ul>
<li>弹层显示时 <code>aria-expanded=&quot;true&quot;</code>，隐藏时为 <code>false</code>。</li>
<li><code>aria-controls</code> 指向 listbox；<code>aria-autocomplete=&quot;list&quot;</code> 表示建议项与输入内容匹配。</li>
<li>方向键移动高亮时更新 <code>aria-activedescendant</code> 和对应选项的 <code>aria-selected</code>，DOM 焦点不离开输入框，用户可以继续输入。</li>
<li>Enter 接受高亮项，Escape 关闭弹层；不要拦截输入框原有的文本编辑按键。</li>
<li>结果数量变化可以用 <code>aria-live</code> 区域播报，例如&quot;共 5 条建议&quot;。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>鼠标点击选项时为什么输入框先失焦导致弹层关闭？在选项的 <code>mousedown</code> 上 <code>preventDefault()</code> 保持焦点，或延迟处理 <code>blur</code>。</li>
<li>空结果怎么显示？显示&quot;无匹配结果&quot;，并保持 <code>aria-expanded</code> 与实际是否显示弹层一致。</li>
<li>要不要设置最少输入字符数？结果集很大时可以要求至少 1～2 个字符，减少宽泛查询。</li>
</ul>`};export{e as default};