var e={answerHtml:`<p>页面的 HTML 和 CSS 已经到了，文字却可能还不能立即用设计稿里的字体显示，因为字体文件需要另外下载。浏览器此时面临一个选择：先等字体，还是先用系统字体显示？如果系统字体已经显示，稍后是否再换回来？<code>font-display</code> 就是用来控制这段过程的。</p>
<p>它是 <code>@font-face</code> 里的描述符，不是直接写在 <code>body</code> 上的普通属性，也不会让字体文件下载得更快。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&quot;Article Sans&quot;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&quot;/fonts/article-sans-regular.woff2&quot;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&quot;woff2&quot;</span>);
  <span class="hljs-attribute">font-style</span>: normal;
  <span class="hljs-attribute">font-weight</span>: <span class="hljs-number">400</span>;
  <span class="hljs-attribute">font-display</span>: swap;
}

<span class="hljs-selector-class">.article</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&quot;Article Sans&quot;</span>, system-ui, sans-serif;
  <span class="hljs-attribute">line-height</span>: <span class="hljs-number">1.6</span>;
}
</code></pre></div>
<p>这个例子假设项目确实提供了对应的字体文件，且该文件包含要显示的字符。如果字体没有中文字形，中文仍然会走后续字体回退；<code>font-display</code> 不能补出字体里没有的字。</p>
<h3>把一次字体使用看成三个阶段</h3>
<p>浏览器开始尝试使用尚未就绪的字体时，会进入字体显示时间线。它不是从页面导航开始计时，也不应简单理解成从 CSS 下载完成开始计时。</p>
<ol>
<li><strong>阻塞期</strong>：字体未就绪时，使用不可见的回退字体来布局，文字占位但暂时看不见。字体在这期间加载完成，就能直接使用它显示文字。</li>
<li><strong>交换期</strong>：字体仍未就绪时，显示可见的回退字体；自定义字体在这期间完成加载，可以替换回退字体。</li>
<li><strong>失败期</strong>：对这次显示策略而言不再等待迟到的字体，使用正常回退。进入这个阶段不等于网络请求必然失败，也不意味着字体文件永久不能使用。</li>
</ol>
<p><code>font-display</code> 主要决定前两个阶段有多长。这里的“短”“极短”由浏览器实现决定，不要把某个浏览器的默认毫秒数当成通用标准。</p>
<table><thead><tr><th>值</th><th>等待和替换策略</th><th>主要取舍</th></tr></thead><tbody><tr><td><code>auto</code></td><td>浏览器决定</td><td>应用没有明确指定显示策略</td></tr><tr><td><code>block</code></td><td>短阻塞期，之后允许无限期交换</td><td>可能先看到空白文字，仍可能发生后续替换</td></tr><tr><td><code>swap</code></td><td>极短阻塞期，之后允许无限期交换</td><td>尽早读到文字，但慢网络下仍可能很晚才换字体</td></tr><tr><td><code>fallback</code></td><td>极短阻塞期，加一个短交换期</td><td>给字体有限的替换机会，避免持续等待</td></tr><tr><td><code>optional</code></td><td>极短阻塞期，没有交换期</td><td>可以保留回退字体，本次不保证使用自定义字体</td></tr></tbody></table>
<p><code>optional</code> 不是“永远不加载字体”：缓存命中或加载足够快时仍有机会使用。只是它不承诺等用户看见回退文字后，再把迟来的字体替换上去。</p>
<h3>为什么换成 <code>swap</code> 之后页面会跳</h3>
<p>假设回退字体中，一段文字排成三行；自定义字体的字宽更大，同一段文字变成四行。字体交换时段落变高，下面的按钮、图片一起向下移动，就可能形成布局偏移。</p>
<p>因此“文字尽早可见”和“布局稳定”是两个目标。<code>swap</code> 改善了长时间看不见文字的问题，但它本身并不保证 CLS 更低。固定 <code>line-height</code> 能控制一部分行高差异，却不能消除字宽变化导致的换行。</p>
<p>常见改进包括：选择字形宽度和度量接近的回退字体；对需要的字重和字符做合理子集；在确有收益时调整回退字体的 <code>size-adjust</code>、<code>ascent-override</code>、<code>descent-override</code>、<code>line-gap-override</code>。这些值应根据实际字体测量，不能随便抄一组百分比。正文很多时，直接使用合适的系统字体也是完整的方案。</p>
<h3>preload 要用在什么地方</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span>
  <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span>
  <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/fonts/article-sans-regular.woff2&quot;</span>
  <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;font&quot;</span>
  <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;font/woff2&quot;</span>
  <span class="hljs-attr">crossorigin</span>
/&gt;</span>
</code></pre></div>
<p>字体往往要等 CSS 被发现、解析并使用到它之后才开始请求。对首屏必需的字体，预加载可以提前发现资源。字体请求使用 CORS 模式，因此预加载通常需要写 <code>crossorigin</code>，同源字体也一样，以便与实际字体请求的模式匹配；跨域字体还需要服务端允许对应的跨域读取。</p>
<p>不要一次预加载所有字重和语言分包。用户可能根本不会用到它们，而它们会与关键 CSS、首屏图片争用带宽。<code>preload</code> 只改变资源发现与加载时机，<code>font-display</code> 仍然决定字体晚到时怎么显示，二者不能互相替代。</p>
<p>如果绘制 Canvas 文本或测量布局确实依赖字体，可以使用 CSS Font Loading API，例如 <code>document.fonts.load(&#x27;400 16px &quot;Article Sans&quot;&#x27;, &#x27;示例文字&#x27;)</code>，并处理加载失败。普通正文一般不应通过 JavaScript 隐藏整页直到所有字体就绪；这样容易把已经可读的内容重新变成等待页面。</p>
<p>验证时分别观察冷缓存、慢网络和字体请求失败的情况：文字多久可见，是否发生迟来的替换，替换时有没有换行与位移。还要检查实际使用的是哪款字体，否则字体根本没有匹配到，却可能被误判为“加载优化成功”。</p>`};export{e as default};