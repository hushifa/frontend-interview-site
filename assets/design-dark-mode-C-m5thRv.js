var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户把手机系统切成深色，打开你的网站，页面也自动变成深色；页面右上角还有个开关，可以手动在浅色、深色、跟随系统之间切换。这就是暗黑模式要做的事。</p>
<p>做法是把所有颜色写成 CSS 变量，在根元素上挂一个 <code>data-theme</code> 属性，浅色和深色各定义一套变量值，切换主题只改这个属性。默认用 <code>prefers-color-scheme</code> 媒体查询跟随系统；用户手动选过，就把选择存进 <code>localStorage</code>，以后优先用它。</p>
<p>只改自己的颜色还不够。滚动条、输入框、复选框这些是浏览器画的，要用 <code>color-scheme</code> 属性告诉浏览器“这里是深色”，它们才会跟着变。</p>
<p>最容易出的问题是闪烁：页面先按浅色画出来，脚本跑完才切到深色，用户看到一下白光。解决办法是在 <code>&lt;head&gt;</code> 里放一小段同步脚本，在页面渲染之前就把 <code>data-theme</code> 设好。</p>
</blockquote>
<h2>颜色为什么要写成变量</h2>
<p>如果颜色直接写在各个组件里，加一套深色就要把每个组件都改一遍。写成变量以后，组件只引用“背景色”“正文色”这样的名字，具体值集中在一处定义。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attribute">color-scheme</span>: light;
  <span class="hljs-attr">--bg</span>: <span class="hljs-number">#ffffff</span>;
  <span class="hljs-attr">--text</span>: <span class="hljs-number">#1f2328</span>;
  <span class="hljs-attr">--border</span>: <span class="hljs-number">#d0d7de</span>;
}

<span class="hljs-selector-pseudo">:root</span><span class="hljs-selector-attr">[data-theme=<span class="hljs-string">&#x27;dark&#x27;</span>]</span> {
  <span class="hljs-attribute">color-scheme</span>: dark;
  <span class="hljs-attr">--bg</span>: <span class="hljs-number">#0d1117</span>;
  <span class="hljs-attr">--text</span>: <span class="hljs-number">#e6edf3</span>;
  <span class="hljs-attr">--border</span>: <span class="hljs-number">#30363d</span>;
}

<span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--bg);
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--text);
}
</code></pre></div>
<p>切换主题时，只要把 <code>&lt;html&gt;</code> 上的 <code>data-theme</code> 改成 <code>dark</code>，所有用到这些变量的地方都会重新计算。变量命名建议按用途起名（<code>--bg</code>、<code>--text</code>），不要按颜色起名（<code>--white</code>），否则深色主题里 <code>--white</code> 的值是黑色，读代码的人会糊涂。变量怎样组织成分层的设计 token，见<a href="/questions/architecture-design-tokens/">《设计 token 为什么比散落的颜色变量更适合大型前端项目？》</a>。</p>
<h2>color-scheme 管的是哪部分</h2>
<p>MDN 列出了 <code>color-scheme</code> 影响的内容：画布表面（页面底色）、滚动条和其他交互界面的默认颜色、表单控件的默认颜色、拼写检查下划线这类浏览器提供的界面。MDN 也写明，其余元素的颜色要作者自己用 <code>prefers-color-scheme</code> 处理。</p>
<p>所以 <code>color-scheme</code> 和 CSS 变量是分工关系：变量管你自己写的颜色，<code>color-scheme</code> 管浏览器画的部分。只写变量不写 <code>color-scheme</code>，深色页面里会出现白底的下拉框和亮色滚动条。</p>
<p>如果网站只跟随系统、不提供手动开关，可以在 <code>:root</code> 上写 <code>color-scheme: light dark</code>，再配合 <code>light-dark()</code> 函数直接写两种颜色，例如 <code>color: light-dark(#1f2328, #e6edf3)</code>。MDN 说明这个函数按当前生效的 color-scheme 返回第一个或第二个值，不需要再写媒体查询。</p>
<h2>怎样跟随系统，又允许用户手动选</h2>
<p>用户的选择有三种：浅色、深色、跟随系统。存储时只存前两种，跟随系统就删掉存储。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> media = <span class="hljs-title function_">matchMedia</span>(<span class="hljs-string">&#x27;(prefers-color-scheme: dark)&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">applyTheme</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> saved = <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">getItem</span>(<span class="hljs-string">&#x27;theme&#x27;</span>); <span class="hljs-comment">// &#x27;light&#x27; | &#x27;dark&#x27; | null</span>
  <span class="hljs-keyword">const</span> theme = saved ?? (media.<span class="hljs-property">matches</span> ? <span class="hljs-string">&#x27;dark&#x27;</span> : <span class="hljs-string">&#x27;light&#x27;</span>);
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">documentElement</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">theme</span> = theme;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">setTheme</span>(<span class="hljs-params">choice</span>) {
  <span class="hljs-keyword">if</span> (choice === <span class="hljs-string">&#x27;system&#x27;</span>) <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">removeItem</span>(<span class="hljs-string">&#x27;theme&#x27;</span>);
  <span class="hljs-keyword">else</span> <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">setItem</span>(<span class="hljs-string">&#x27;theme&#x27;</span>, choice);
  <span class="hljs-title function_">applyTheme</span>();
}

<span class="hljs-comment">// 系统主题变化时，只有“跟随系统”的用户需要跟着变</span>
media.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, applyTheme);
</code></pre></div>
<p><code>matchMedia</code> 返回的对象有 <code>matches</code> 表示当前是否匹配，还能监听 <code>change</code> 事件。用户在系统设置里切换深浅色，页面不刷新也能跟着变。因为 <code>applyTheme</code> 里先看 <code>localStorage</code>，手动选过的用户不受系统变化影响。</p>
<h2>刷新时为什么会闪一下白</h2>
<p>如果上面这段代码放在打包后的 JS 里，执行顺序是：浏览器解析 HTML、应用 CSS、画出浅色页面，然后下载并执行 JS，才把主题改成深色。中间那一下浅色就是闪烁。</p>
<p>改法是把“读取选择、设置属性”这一小段直接内联在 <code>&lt;head&gt;</code> 里，放在样式表之前或紧挨着它。内联的同步脚本会阻塞解析，执行完才继续，所以第一次绘制时 <code>data-theme</code> 已经是正确的值。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">head</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">script</span>&gt;</span><span class="javascript">
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> saved = <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">getItem</span>(<span class="hljs-string">&#x27;theme&#x27;</span>);
      <span class="hljs-keyword">const</span> dark = saved ? saved === <span class="hljs-string">&#x27;dark&#x27;</span> : <span class="hljs-title function_">matchMedia</span>(<span class="hljs-string">&#x27;(prefers-color-scheme: dark)&#x27;</span>).<span class="hljs-property">matches</span>;
      <span class="hljs-variable language_">document</span>.<span class="hljs-property">documentElement</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">theme</span> = dark ? <span class="hljs-string">&#x27;dark&#x27;</span> : <span class="hljs-string">&#x27;light&#x27;</span>;
    } <span class="hljs-keyword">catch</span> {}
  </span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;stylesheet&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/app.css&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">head</span>&gt;</span>
</code></pre></div>
<p><code>try</code> 是因为某些隐私模式或禁用存储的环境里访问 <code>localStorage</code> 会抛错，抛错时就退回 CSS 的默认主题。这段脚本要尽量短，它阻塞的是首屏。</p>
<p>服务端渲染时还有一种做法：把用户选择存在 Cookie 里，服务端输出 HTML 时直接写好 <code>data-theme</code>，连这段脚本都不需要。但“跟随系统”的用户服务端不知道系统设置，仍然需要脚本或 <code>light-dark()</code> 兜底。</p>
<h2>常见追问</h2>
<p><strong>图片和图标在深色下怎么处理？</strong></p>
<blockquote>
<p>SVG 图标用 <code>currentColor</code> 填色，会自动跟着文字颜色变。截图、插画这类位图，可以用 <code>&lt;picture&gt;</code> 里带 <code>media=&quot;(prefers-color-scheme: dark)&quot;</code> 的 <code>&lt;source&gt;</code> 换一张深色版本；不过它只看系统设置，用户手动切换时要靠 JS 或 CSS 选择器来换。</p>
</blockquote>
<p><strong>切换主题时，颜色过渡动画要不要加？</strong></p>
<blockquote>
<p>可以给背景和文字颜色加很短的过渡，但不要对所有元素加 <code>transition: all</code>，切换时大量元素同时动画会卡。还要尊重 <code>prefers-reduced-motion</code>，用户要求减少动画时去掉过渡。</p>
</blockquote>
<p><strong>深色模式就是把颜色反转吗？</strong></p>
<blockquote>
<p>不是。直接用 <code>filter: invert()</code> 反转，图片和品牌色都会变怪。深色主题要重新挑颜色：背景用深灰而不是纯黑，文字不用纯白，饱和度高的颜色适当调低，并且重新检查对比度是否达标。</p>
</blockquote>`};export{e as default};