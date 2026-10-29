var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>搜索联想就是用户一边打字，下面一边弹出建议。看着简单，要处理的问题有四个。</p>
<p>第一是请求太多。每敲一个字都请求一次很浪费，所以要防抖，等用户停下来 200 到 300 毫秒再请求。中文输入法正在拼字的时候，也不应该触发搜索。</p>
<p>第二是竞态，也就是旧请求比新请求晚回来，把新结果盖掉。新请求发出时用 <code>AbortController</code> 取消旧的，结果回来时还要再核对一下，它对应的关键词是不是当前输入框里的，不是就丢掉。第三是缓存，按规范化后的关键词缓存结果，用户回删时直接命中，缓存要有容量上限和过期时间。</p>
<p>第四是键盘和无障碍，要按 WAI-ARIA 的 combobox 模式来做。要注意 DOM 焦点一直留在输入框里，用 <code>aria-activedescendant</code> 指向当前高亮的那一项，方向键切换、Enter 选中、Escape 关闭。</p>
</blockquote>
<h2>防抖时为什么要管输入法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> timer;
input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">isComposing</span>) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 组字中不搜索，compositionend 后再处理</span>
  <span class="hljs-built_in">clearTimeout</span>(timer);
  timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">search</span>(input.<span class="hljs-property">value</span>), <span class="hljs-number">250</span>);
});
</code></pre></div>
<p>每次输入都先清掉上一个定时器，再重新等 250 毫秒，所以只有用户停下来，<code>search</code> 才会真的执行。</p>
<p>那 <code>isComposing</code> 是干什么的？用拼音输入法打“北京”时，输入框里会先出现 <code>bei</code> <code>beij</code> 这些拼音，这个阶段叫组字。这时候去搜索拼音毫无意义，所以直接跳过，等 <code>compositionend</code> 也就是选完字以后再处理。</p>
<p>防抖本身的实现见<a href="/questions/alg-debounce/">《怎样实现只在停止调用后执行的防抖函数？》</a>，输入法和竞态放在一起怎么处理，见<a href="/questions/browser-ime-search/">《中文输入法期间怎样触发搜索？composition 与请求竞态如何一起处理？》</a>。</p>
<h2>只取消旧请求为什么还不够</h2>
<p>下面是搜索函数，包含了取消、缓存和关键词核对：</p>
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
<p>既然每次都 <code>abort()</code> 了旧请求，渲染前为什么还要比较 <code>keyword</code> 和当前输入？因为请求可能在 <code>abort()</code> 之前就已经返回、正在解析了，这时候取消已经来不及。所以渲染之前要再核对一次，确认这份结果对应的还是用户现在输入的词。</p>
<p>还要知道，<code>AbortController</code> 只是让前端不再等这个请求，服务端可能已经处理完了，详见<a href="/questions/api-abort/">《AbortController 能取消什么，不能取消什么？》</a>。</p>
<p>安全上也有两点。关键词放进 URL 时要用 <code>encodeURIComponent</code> 编码。渲染建议项时用文本节点或框架默认的转义，就算要高亮匹配的片段，也不要拼 HTML 字符串，否则会有 XSS 风险。</p>
<h2>缓存要注意什么</h2>
<p>缓存的键用规范化后的关键词，也就是去掉首尾空格、统一大小写，这样“ React ”和“react”不会各请求一次。</p>
<p>缓存不能无限长大。<code>Map</code> 会记住插入顺序，可以设个上限，比如 50 条，超了就删最早插入的那条。如果建议数据会变，还要给缓存设过期时间。</p>
<h2>键盘和 ARIA 怎么做</h2>
<p>combobox 是 ARIA 里“输入框加弹出列表”这种组件的名字。结构大致是这样：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;city&quot;</span>&gt;</span>城市<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;combobox&quot;</span> <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;city-list&quot;</span>
  <span class="hljs-attr">aria-autocomplete</span>=<span class="hljs-string">&quot;list&quot;</span> <span class="hljs-attr">aria-activedescendant</span>=<span class="hljs-string">&quot;city-opt-2&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-list&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;listbox&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-opt-1&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span>&gt;</span>北京<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-opt-2&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>上海<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p>弹层显示时 <code>aria-expanded</code> 是 <code>true</code>，隐藏时是 <code>false</code>。<code>aria-controls</code> 指向弹出的 listbox，<code>aria-autocomplete=&quot;list&quot;</code> 告诉读屏软件，下面的建议是根据输入内容匹配出来的。</p>
<p>为什么焦点要留在输入框，而不是移到选项上？因为用户高亮了一项以后，可能还想继续打字。所以方向键移动时，只更新 <code>aria-activedescendant</code> 和对应选项的 <code>aria-selected</code>，读屏软件会把高亮项读出来，DOM 焦点却不离开输入框。</p>
<p>Enter 接受高亮项，Escape 关闭弹层。输入框原有的文本编辑按键不要拦截。结果数量变了，可以用 <code>aria-live</code> 区域播报，比如“共 5 条建议”。</p>
<h2>常见追问</h2>
<p><strong>鼠标点选项时，为什么输入框先失焦，弹层就关了？</strong></p>
<blockquote>
<p>因为点击时先触发了输入框的 <code>blur</code>，弹层收起来，点击就落空了。可以在选项的 <code>mousedown</code> 上调用 <code>preventDefault()</code> 保住焦点，或者延迟处理 <code>blur</code>。</p>
</blockquote>
<p><strong>没有结果时怎么显示？</strong></p>
<blockquote>
<p>显示“无匹配结果”，同时让 <code>aria-expanded</code> 和弹层实际显示与否保持一致。</p>
</blockquote>
<p><strong>要不要设置最少输入字符数？</strong></p>
<blockquote>
<p>结果集很大时可以要求至少输入 1 到 2 个字符，减少太宽泛的查询。</p>
</blockquote>`};export{e as default};