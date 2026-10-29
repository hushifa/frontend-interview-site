var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>网页用了自定义字体，字体文件还没下载完时，文字怎么显示？浏览器把这段时间分成三个阶段：阻塞期，文字先隐藏；交换期，先用回退字体显示，字体到了再换上；失败期，字体再到也不换了。<code>font-display</code> 就是调这几个阶段的长短。</p>
<p><code>block</code> 是约 3 秒阻塞，交换期无限长；<code>swap</code> 几乎不阻塞，字体什么时候到都换；<code>fallback</code> 是约 100ms 阻塞加约 3 秒交换；<code>optional</code> 是约 100ms 阻塞，没有交换期，字体晚到这次就不用了。</p>
<p>正文一般用 <code>swap</code> 或 <code>optional</code>，别让用户长时间看不到字。图标字体常用 <code>block</code>，因为用回退字体显示会是一堆乱码。</p>
<p>要注意，换字体会让字宽和行高变化，页面会跳。可以用 <code>size-adjust</code>、<code>ascent-override</code> 把回退字体调到接近的尺寸。关键字体用 <code>&lt;link rel=&quot;preload&quot; as=&quot;font&quot; crossorigin&gt;</code> 提前请求，<code>crossorigin</code> 不能省。</p>
</blockquote>
<h2>一个完整的声明</h2>
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
<p>第一段声明品牌字体，用 <code>swap</code>。第二段做了一个“调整过的 Arial”当回退字体。</p>
<p>为什么要专门调回退字体？因为 <code>swap</code> 下用户先看到的是回退字体，品牌字体到了再换。两种字体字宽不同，换的时候每行的字数和高度会变，下面的内容整体往下跳，这在性能指标里叫布局偏移（CLS）。把 Arial 放大 4%、调整上行高度后，它和品牌字体排出来的效果接近，换字体时几乎不跳。</p>
<p>具体的百分比要根据两种字体的实际尺寸来算。Next.js 的 <code>next/font</code> 和 Fontaine 这类工具可以自动生成。</p>
<h2>四个值怎么选</h2>
<p>品牌字体一定要出现，能接受换一次，用 <code>swap</code>。</p>
<p>首屏稳定最重要，字体只在有缓存时用，用 <code>optional</code>。第一次访问可能看到的是回退字体，下次有缓存了才是品牌字体。</p>
<p><code>fallback</code> 介于两者之间。</p>
<p>图标字体，或者回退字体根本表达不了的内容，用 <code>block</code>。</p>
<h2>还有哪些办法降低字体的成本</h2>
<p>字体只提供 WOFF2 格式，按需拆子集。中文字体体积很大，可以用 <code>unicode-range</code> 分片，或者只给标题加载。</p>
<p>预加载只给首屏真正用到的一两个字体。预加载太多，会跟其他关键资源抢带宽。</p>
<p>有些场景要精确量文字尺寸，比如在 Canvas 上画字。这时用 <code>document.fonts.ready</code> 或者 <code>FontFace.load()</code>，等字体准备好再画。</p>
<h2>常见追问</h2>
<p><strong>为什么预加载字体一定要写 <code>crossorigin</code>？</strong></p>
<blockquote>
<p>字体请求总是用 CORS 模式发出的，哪怕是同源字体。预加载不写 <code>crossorigin</code>，就是一个非 CORS 请求，跟后面真正用字体时的请求对不上，浏览器会再下载一次。</p>
</blockquote>`};export{e as default};