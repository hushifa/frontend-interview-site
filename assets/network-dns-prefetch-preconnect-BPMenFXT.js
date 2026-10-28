var e={answerHtml:`<h2>简答</h2>
<ul>
<li>dns-prefetch 只提前解析域名，适合“可能会访问”的来源。</li>
<li>preconnect 提前完成 DNS、TCP、TLS，只给确定马上会用的少数来源。</li>
<li>preload 提前获取当前页面确定要用的具体文件，as、type、crossorigin 要与实际使用一致。</li>
<li>提示要针对瀑布中真实的发现晚或连接晚问题，添加后对比请求开始时间和 LCP。</li>
</ul>
<p>页面要显示一款自定义字体，浏览器可能先下载 HTML，再下载样式表，读到 <code>@font-face</code>，最后才知道字体文件在哪。即使字体很小，前面的发现和连接准备也可能让文字等很久。</p>
<p>资源提示是在浏览器自然发现之前，提前告诉它一些已经确定的信息。选择哪种提示，取决于你现在知道的是“可能用这个域名”“马上会连接这个来源”，还是“当前页面确定需要这个具体文件”。</p>
<table><thead><tr><th>提示</th><th>提前做的事情</th><th>不会自动完成的事情</th></tr></thead><tbody><tr><td><code>dns-prefetch</code></td><td>尝试提前解析域名</td><td>不建立完整连接，不下载资源</td></tr><tr><td><code>preconnect</code></td><td>尝试提前完成连接准备，包括适用的 DNS、传输与安全握手</td><td>不下载具体文件</td></tr><tr><td><code>preload</code></td><td>提前获取一个指定资源，供当前页面后续使用</td><td>不自动应用样式或执行脚本</td></tr></tbody></table>
<p>三者都是浏览器可以结合自身策略处理的提示，不能保证每次都执行，也不意味着可以绕过 CORS、CSP 或网络限制。</p>
<h2>只确定可能访问哪个域名：dns-prefetch</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;dns-prefetch&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;//images.example.com&quot;</span> /&gt;</span>
</code></pre></div>
<p>它让浏览器有机会提前把域名解析成可连接的地址。后面真正请求图片时，可能节省 DNS 等待，但连接建立、TLS 握手和文件传输仍要进行。</p>
<p>它适合访问概率较高、但还不值得马上建立连接的外部域名。已经有 DNS 缓存时收益会减小；页面根本不访问这个域名时，查询就是额外工作。预解析也可能产生提前的外部网络活动，因此仍应与网站的隐私和第三方加载策略一致。</p>
<h2>确定很快要访问哪个来源：preconnect</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preconnect&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://fonts.example.com&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
</code></pre></div>
<p>这会尝试把连接准备也提前。HTTP/1.1、HTTP/2 的 HTTPS 常涉及 DNS、TCP 和 TLS；HTTP/3 的传输建立方式不同，因此不要把所有预连接都画成固定的 TCP 三次握手。</p>
<p><code>href</code> 主要表达目标来源，不需要把每个字体文件路径都写进去。对字体这样的匿名 CORS 请求，<code>crossorigin</code> 应与实际使用方式匹配，以提高预连接被后续请求复用的机会。来源、凭据模式和浏览器连接管理都会影响复用，不能理解成“有一条到这个域名的连接，就必然能供所有请求使用”。</p>
<p>预连接要有数量和时机上的克制。连接本身消耗资源，太早建立却迟迟不用可能被关闭；同时预连接二十个第三方来源，还可能和真正关键的请求竞争。已经用于加载当前文档的同源连接通常不需要再提示一遍。</p>
<p>如果第三方 URL 必须等登录或用户授权后才能使用，也不应为了性能就擅自提前连接。</p>
<h2>已经知道马上要用哪个文件：preload</h2>
<p>对于藏在 CSS 里的关键字体，可以直接在 HTML 头部声明：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span>
  <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span>
  <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/fonts/body.woff2&quot;</span>
  <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;font&quot;</span>
  <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;font/woff2&quot;</span>
  <span class="hljs-attr">crossorigin</span>
/&gt;</span>
</code></pre></div>
<p>浏览器拿到这段 HTML 时就能开始获取字体，不必等样式表解析后再发现它。这里仍然需要真正的 <code>@font-face</code> 规则和使用该字体的内容；预加载不会自动把页面的字体改掉。</p>
<p><code>as</code> 表示资源用途，影响请求目的、优先级、安全策略和复用判断；不能为了“让浏览器下载”就把字体写成 <code>as=&quot;script&quot;</code>。<code>type</code> 提供媒体类型提示，浏览器可据支持情况决定是否获取。字体以 CORS 模式请求，所以即使字体与页面同源，预加载也应保留 <code>crossorigin</code>，匹配实际字体请求。</p>
<p>预加载的 URL、请求模式和凭据模式要与后续消费匹配。比如预加载的是 <code>/font.woff2?v=1</code>，实际 CSS 用 <code>/font.woff2?v=2</code>，就是两个不同地址；或者一边匿名请求，一边要求携带跨源凭据，也可能无法复用。控制台提示“预加载资源未使用”时，应优先检查这些差异，而不是继续添加更多 preload。</p>
<h2>图片和模块需要用合适的声明</h2>
<p>响应式图片不要只预加载一个固定大图，却让后续 <code>&lt;img&gt;</code> 选择另一个尺寸。可以把相同的候选和尺寸规则同时用于预加载和图片：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span>
  <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span>
  <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;image&quot;</span>
  <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/hero-960.webp&quot;</span>
  <span class="hljs-attr">imagesrcset</span>=<span class="hljs-string">&quot;/hero-480.webp 480w, /hero-960.webp 960w&quot;</span>
  <span class="hljs-attr">imagesizes</span>=<span class="hljs-string">&quot;(max-width: 600px) 100vw, 960px&quot;</span>
/&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero-960.webp&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero-480.webp 480w, /hero-960.webp 960w&quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(max-width: 600px) 100vw, 960px&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;960&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;540&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;课程内容预览&quot;</span>
/&gt;</span>
</code></pre></div>
<p>这是展示匹配关系的例子。如果 <code>&lt;img&gt;</code> 本来就在 HTML 开头、浏览器很早就能发现它，额外 preload 未必有明显收益。不同格式的同一张图也不要把 AVIF、WebP、JPEG 全部 preload，否则浏览器可能下载多个支持的版本，最终却只显示其中一个。</p>
<p>JavaScript 模块通常使用 <code>rel=&quot;modulepreload&quot;</code>，让浏览器按模块语义获取和准备模块。它与普通 <code>preload as=&quot;script&quot;</code> 不是完全等价的替代品；实际执行仍需要模块入口或 import。现代构建工具可能已生成相应声明，应先检查构建产物，避免手动重复添加。</p>
<h2>怎样判断提示真的帮到了页面</h2>
<p>先看请求瀑布：关键资源是否因为“发现得晚”或“连接准备晚”而等待。再只针对少量明确的瓶颈添加提示，比较请求开始时间、重复下载、首屏 LCP，以及其他关键请求有没有被推迟。</p>
<p>冷缓存与热缓存应分开测量，避免把已有连接和缓存命中误当成提示的效果。<code>preload</code> 主要服务当前页面即将使用的资源；为未来可能访问的页面准备资源，属于另一类预取决策。把整个站点资源全部 preload，只会把本来不必要的传输提前到首屏。</p>`};export{e as default};