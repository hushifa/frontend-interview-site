var e={answerHtml:`<h2>简答</h2>
<ul>
<li>字体加载分三个阶段：阻塞期（文字不可见）、交换期（显示回退字体，字体到达后替换）、失败期（不再替换）。</li>
<li><code>block</code>：约 3 秒阻塞期加无限交换期；<code>swap</code>：几乎无阻塞，随时替换；<code>fallback</code>：约 100ms 阻塞加约 3 秒交换；<code>optional</code>：约 100ms 阻塞，没有交换期，字体晚到就本次不用。</li>
<li>正文通常用 <code>swap</code> 或 <code>optional</code>，避免长时间看不到文字；图标字体常用 <code>block</code>，避免显示成乱码。</li>
<li>替换字体会改变字宽和行高，导致布局偏移；用 <code>size-adjust</code>、<code>ascent-override</code> 等描述符把回退字体调到接近的度量。</li>
<li>关键字体用 <code>&lt;link rel=&quot;preload&quot; as=&quot;font&quot; crossorigin&gt;</code> 提前请求，<code>crossorigin</code> 不能省。</li>
</ul>
<h2>声明</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&#x27;/fonts/brand.woff2&#x27;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&#x27;woff2&#x27;</span>);
  <span class="hljs-attribute">font-display</span>: swap;
}

<span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand Fallback&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">local</span>(<span class="hljs-string">&#x27;Arial&#x27;</span>);
  size-adjust: <span class="hljs-number">104%</span>;
  ascent-override: <span class="hljs-number">92%</span>;
}

<span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>, <span class="hljs-string">&#x27;Brand Fallback&#x27;</span>, sans-serif;
}
</code></pre></div>
<p>回退字体经过调整后，替换前后每行的字数和高度接近，CLS 会明显下降。具体百分比要根据两种字体的实际度量计算，Next.js 的 <code>next/font</code> 和 Fontaine 等工具可以自动生成。</p>
<h2>怎么选</h2>
<table><thead><tr><th>值</th><th>适合</th></tr></thead><tbody><tr><td><code>swap</code></td><td>品牌字体必须出现，能接受一次替换</td></tr><tr><td><code>optional</code></td><td>首屏稳定优先，字体只在缓存后使用</td></tr><tr><td><code>fallback</code></td><td>介于两者之间</td></tr><tr><td><code>block</code></td><td>图标字体，或回退字体无法表达的内容</td></tr></tbody></table>
<h2>其他减少成本的做法</h2>
<ul>
<li>只提供 WOFF2，按需拆分子集；中文字体体积大，用 <code>unicode-range</code> 分片或只为标题加载。</li>
<li>预加载只给首屏真正用到的一两个字体，过多会和其他关键资源抢带宽。</li>
<li>用 <code>document.fonts.ready</code> 或 <code>FontFace.load()</code> 在需要精确测量文字的场景（例如 Canvas 绘制）等待字体就绪。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么预加载要写 <code>crossorigin</code>？字体请求总是以 CORS 模式发出，预加载不带 <code>crossorigin</code> 会被当成另一个请求，浏览器会重复下载。</li>
</ul>`};export{e as default};