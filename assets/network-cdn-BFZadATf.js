var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>网站服务器在北京，广州的用户打开页面，每个文件都要跨半个中国传过来。CDN 就是在各地放一批服务器，存着网站内容的副本，用户访问离自己最近的那台，路短了，自然就快。</p>
<p>它快在三个地方：边缘节点离用户近，往返时间短；用户和节点的连接就近建立，节点到源站常用已经建好的连接；命中缓存时请求根本不用到源站。没命中时，节点去源站取一份、存下来再返回，这叫回源。</p>
<p>前端要做的主要是配好缓存。JS、CSS 文件名带内容哈希，设一年的长缓存，内容变了文件名就变；HTML 文件名不能变，设 <code>no-cache</code> 每次验证，这样发版后用户能马上拿到新 HTML，再由它引用新文件。</p>
<p>要注意缓存键。CDN 默认按完整 URL 区分内容，广告参数会让同一个页面被存成很多份，降低命中率；反过来，内容按登录状态变化却没区分，就会串内容。内容出错时用 CDN 的刷新接口清缓存。</p>
</blockquote>
<h2>请求是怎样被送到最近的节点的</h2>
<p>接入 CDN 时，常见做法是把自己的域名用 CNAME 指向 CDN 提供的域名，比如 <code>www.example.com</code> 指向 <code>example.my-cdn.com</code>。之后用户解析这个域名，由 CDN 来决定把用户导向哪个节点。DNS 解析本身的过程见<a href="/questions/network-dns-resolution/">《DNS 解析的过程是怎样的？》</a>。</p>
<p>用户的请求到了边缘节点，节点先看自己有没有这份内容的新鲜副本。有，就直接返回，叫命中；没有，就去源站取，这叫回源。web.dev 把最常见的填充方式叫 origin pull：某个资源第一次被请求时，CDN 向源站请求并缓存响应，缓存就这样随着访问慢慢建起来。</p>
<p>为什么连不能缓存的接口也建议走 CDN？web.dev 的解释是，用户只需要和附近的节点建立新连接，握手的往返很短；节点到源站这一段走 CDN 自己的网络，往往复用已经建好的长连接。所以就算每次都要回源，通常也比用户直连源站快。</p>
<h2>文件名哈希加长缓存</h2>
<p>CDN 本身是一层共享缓存，遵守 HTTP 缓存规则，所以前端配好响应头，浏览器和 CDN 都能受益。难点在于：缓存时间设长了，发版后用户看到旧内容；设短了，缓存没什么用。</p>
<p>MDN 给出的解法叫 cache busting：文件内容一变就换 URL。构建工具会把内容哈希写进文件名，比如 <code>app.3f9a1c.js</code>，内容不变，名字不变，可以放心缓存很久；内容变了，名字跟着变，就是一个新地址，旧缓存自然用不上。</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http"># app.3f9a1c.js、style.8b2e4d.css 这类带哈希的文件
Cache-Control: max-age=31536000, immutable

# index.html
Cache-Control: no-cache
ETag: &quot;v42&quot;
</code></pre></div>
<p><code>max-age=31536000</code> 是一年。<code>immutable</code> 告诉浏览器这个文件在有效期内不会变，用户刷新时也不必再验证。</p>
<p>HTML 为什么不能这样做？因为它的地址就是网页地址，不能加哈希。MDN 建议 HTML 用 <code>no-cache</code>：可以存，但每次用之前都要问服务器，没变就回 304。这样发版后用户拿到的总是新 HTML，新 HTML 引用的是新文件名。如果 HTML 按登录状态个性化，还要加 <code>private</code>，不让 CDN 这类共享缓存存下来。两层缓存的配合见<a href="/questions/http-cache/">《强缓存与协商缓存如何配合？》</a>。</p>
<p>只想让 CDN 缓存、不想让浏览器缓存太久，可以用 <code>s-maxage</code>。它只对共享缓存生效，在共享缓存里会覆盖 <code>max-age</code>。</p>
<h2>缓存键：CDN 怎么判断是不是同一份内容</h2>
<p>CDN 用来区分内容的依据叫缓存键，默认基本就是 URL，包括查询参数。所以 <code>/list?cat=book&amp;page=2</code> 和 <code>/list?page=2&amp;cat=book</code> 会被存成两份，带了 <code>utm_source</code> 的链接也会单独存一份。web.dev 建议在 CDN 上配置忽略无关参数、对参数排序。下面模拟这条规则，看看几个 URL 最后得到什么缓存键：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ignored = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;utm_source&#x27;</span>, <span class="hljs-string">&#x27;utm_medium&#x27;</span>, <span class="hljs-string">&#x27;referral_id&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">cacheKey</span>(<span class="hljs-params">rawUrl</span>) {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(rawUrl);
  <span class="hljs-keyword">const</span> kept = [...url.<span class="hljs-property">searchParams</span>].<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[name]</span>) =&gt;</span> !ignored.<span class="hljs-title function_">has</span>(name));
  kept.<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">[a], [b]</span>) =&gt;</span> a.<span class="hljs-title function_">localeCompare</span>(b));
  url.<span class="hljs-property">search</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(kept).<span class="hljs-title function_">toString</span>();
  <span class="hljs-keyword">return</span> url.<span class="hljs-title function_">toString</span>();
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">cacheKey</span>(<span class="hljs-string">&#x27;https://cdn.example/list?page=2&amp;cat=book&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">cacheKey</span>(<span class="hljs-string">&#x27;https://cdn.example/list?cat=book&amp;page=2&amp;utm_source=ad&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">cacheKey</span>(<span class="hljs-string">&#x27;https://cdn.example/list?referral_id=x9&#x27;</span>));
<span class="hljs-comment">// https://cdn.example/list?cat=book&amp;page=2</span>
<span class="hljs-comment">// https://cdn.example/list?cat=book&amp;page=2</span>
<span class="hljs-comment">// https://cdn.example/list</span>
</code></pre></div>
<p>前两个 URL 参数顺序不同，第二个还多了广告参数，处理后得到同一个键，会命中同一份缓存。第三个去掉跟踪参数后就是 <code>/list</code> 本身。真正的规则在 CDN 控制台里配置，这段代码只是说明它在做什么。</p>
<p>反方向的错误更危险：内容会随语言、登录状态变化，缓存键却没区分，一个用户的内容就会返回给另一个用户。响应头里的 <code>Vary</code> 告诉缓存还要按哪些请求头区分，比如 <code>Vary: Accept-Language</code>。MDN 提醒不要 <code>Vary: User-Agent</code>，取值太多会让缓存几乎命中不了；个性化内容应该用 <code>Cache-Control: private</code>，而不是靠 <code>Vary: Cookie</code>。相关风险见<a href="/questions/sec-cache-poisoning/">《什么是 Web 缓存投毒？如何避免把用户数据缓存给别人？》</a>。</p>
<h2>刷新和预热</h2>
<p>内容发错了，等它自然过期太慢，这时用刷新（purge），也叫缓存失效：通过 CDN 的接口或控制台，把指定 URL 的缓存从节点上删掉，下次请求就会回源取新内容。web.dev 提到，大规模刷新时常配合缓存标签使用，给一批资源打上同一个标签，一次清掉。</p>
<p>有了文件名哈希，静态文件一般不需要刷新，新版本本来就是新地址。需要刷新的主要是 HTML 和那些地址固定的文件，比如 <code>favicon.ico</code>、<code>manifest.json</code>。</p>
<p>预热是反过来的操作：大促或发版前，让 CDN 提前回源，把指定文件拉到节点上，避免第一批用户都遇到未命中、同时回源压垮源站。预热、刷新的具体接口和生效范围各家 CDN 不一样，以厂商文档为准。缓存出问题时怎么一层层排查，见<a href="/questions/network-cdn-proxy-debug/">《CDN 和反向代理缓存异常应该怎样排查？》</a>。</p>
<h2>常见追问</h2>
<p><strong>静态资源放在单独的 CDN 域名上好吗？</strong></p>
<blockquote>
<p>有代价。新域名要多一次 DNS 解析和建连。web.dev 在讲 LCP 优化时建议，图片最好和 HTML 同源提供，很多 CDN 支持把源站域名的请求代理过去。用单独域名时，至少给它加 <code>preconnect</code>。</p>
</blockquote>
<p><strong>用公共 CDN 上的 jQuery，能和别的网站共享缓存吗？</strong></p>
<blockquote>
<p>不要指望。MDN 的 State Partitioning 说明写到，Firefox 把 HTTP 缓存按顶级站点永久分区，A 站下载过的文件，B 站用不上。公共 CDN 的好处主要剩下减轻自己服务器压力，代价是多了一个第三方依赖，引用时应该加 SRI 校验。</p>
</blockquote>
<p><strong>CDN 能缓存接口吗？</strong></p>
<blockquote>
<p>能缓存的是对所有人都一样的 GET 响应，比如商品列表，可以给一个短的 <code>s-maxage</code>。带用户身份的接口要设 <code>private</code> 或 <code>no-store</code>，不能让 CDN 存。</p>
</blockquote>`};export{e as default};