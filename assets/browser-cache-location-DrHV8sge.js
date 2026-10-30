var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>第二次打开一个页面，图片和脚本很快就出来了，因为浏览器从本地缓存里拿了。HTTP 缓存规范 RFC 9111 把浏览器里的这份缓存叫私有缓存，只给当前用户用；至于放在内存还是磁盘，规范没有规定，由浏览器自己决定。</p>
<p>查找顺序在 Fetch 规范里写得清楚。请求先交给 Service Worker，它可以直接返回响应；它不处理，才去查 HTTP 缓存，缓存新鲜就直接用，过期了就带条件请求问服务器；缓存里没有，才真正走网络。HTTP 缓存还按顶级站点分区，不同网站嵌入同一个资源，各存各的。</p>
<p>除了 HTTP 缓存，还有几种容易混淆的“缓存”。HTML 规范给每个文档维护一张可用图片列表，同一张图片在页面里重复使用时可以不再走请求；Service Worker 的 Cache API 由脚本管理，不看 HTTP 缓存头；bfcache 存的是整个页面的快照。</p>
<p>要注意，网上常说的“先查 memory cache 再查 disk cache”、“什么资源放内存”这些说法，规范里没有依据，属于浏览器的实现细节。调试时以 DevTools 的 Network 面板为准，需要模拟首次访问就勾选 Disable cache。</p>
</blockquote>
<h2>规范对“放在哪里”说了什么</h2>
<p>RFC 9111 把缓存分成两类。共享缓存给多个用户共用，通常部署在代理、CDN 这类中间节点上；私有缓存只给一个用户用，通常是用户代理的一部分，浏览器的 HTTP 缓存就属于这一类。所以带个人信息的响应要写 <code>Cache-Control: private</code>，让它只进浏览器缓存，不进共享缓存。</p>
<p>可是 RFC 9111 没有规定私有缓存的存储介质。它唯一提到内存和磁盘的地方在 <code>no-store</code> 指令：缓存不能有意把内容写进非易失存储，还要尽快从易失存储里清掉。换句话说，<code>no-store</code> 的要求是“别存下来”，而“存的话放哪儿”留给了实现。</p>
<p>所以面试时被问到 memory cache 和 disk cache 怎么分工，可以说清楚：这是 Chromium 等浏览器的实现，它们在 DevTools 里会标出响应来自哪里，但具体规则没有写进规范，也会随版本变化，不能当成标准行为背下来。</p>
<h2>一个请求按什么顺序找缓存</h2>
<p>Fetch 规范的 HTTP fetch 步骤定下了顺序。以页面里一个普通的 <code>fetch(&#x27;/api/list&#x27;)</code> 为例：</p>
<ol>
<li>如果这个请求受 Service Worker 控制，先交给 Service Worker 的 <code>fetch</code> 事件处理。它调用 <code>respondWith</code> 给了响应，就直接用这个响应，后面的 HTTP 缓存和网络都不碰。</li>
<li>Service Worker 没有给出响应，或者页面没有 Service Worker，就进入 HTTP-network-or-cache fetch，先确定这次请求用哪个 HTTP 缓存分区。</li>
<li>在分区里找存储的响应。还新鲜就直接用；过期了就带上 <code>If-None-Match</code> 这类条件头去问服务器，服务器回 304 就继续用旧的。</li>
<li>缓存里没有可用的响应，才发真正的网络请求，拿到可缓存的响应后再存进 HTTP 缓存。</li>
</ol>
<p>第 1 步要特别注意。Service Worker 里的 <code>fetch()</code> 本身也是一次请求，它同样会经过 HTTP 缓存。所以 Service Worker 返回的内容旧，不一定是 Cache API 没更新，也可能是它请求时命中了 HTTP 缓存。缓存更新的坑见<a href="/questions/mobile-serviceworker/">《Service Worker 的安装、激活与缓存更新有哪些坑？》</a>。</p>
<p>第 3 步怎么判断新鲜、怎么协商，见<a href="/questions/http-cache/">《强缓存与协商缓存如何配合？》</a>。</p>
<h2>为什么同一个资源会被缓存好几份</h2>
<p>Fetch 规范规定，HTTP 缓存分区由请求所在环境的顶级站点决定。比如 <code>a.com</code> 和 <code>b.com</code> 都嵌入了 <code>cdn.example/lib.js</code>，它们用的是两个分区，<code>a.com</code> 加载过的副本，<code>b.com</code> 用不上。规范还允许在顶级站点之外再加一个由实现决定的键，Chrome 的做法是再加上当前框架的站点。Chrome 的文章解释了原因：共用缓存时，一个网站能通过某个资源是否已被缓存，推测用户有没有访问过别的网站，缓存还能被用来存跨站追踪的标识。</p>
<p>所以“用公共 CDN 上的库，用户在别的网站缓存过就不用下载了”这个老说法，在按站点分区的浏览器里已经不成立了。</p>
<h2>页面还能控制哪些缓存行为</h2>
<p><code>fetch</code> 的 <code>cache</code> 选项可以改变这一次请求怎样使用 HTTP 缓存。下面的代码分别跳过缓存读取和强制使用缓存：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 不读缓存，直接请求服务器，但拿到响应后会更新缓存</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/config&#x27;</span>, { <span class="hljs-attr">cache</span>: <span class="hljs-string">&#x27;reload&#x27;</span> });

<span class="hljs-comment">// 有缓存就用，不管过没过期；没有才请求</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/config&#x27;</span>, { <span class="hljs-attr">cache</span>: <span class="hljs-string">&#x27;force-cache&#x27;</span> });
</code></pre></div>
<p>MDN 列出了全部取值。默认值 <code>default</code> 就是上面第 3 步的流程；<code>no-store</code> 既不读也不写缓存；<code>reload</code> 不读缓存但会写；<code>no-cache</code> 有缓存也一定先协商；<code>force-cache</code> 有缓存就用；<code>only-if-cached</code> 只查缓存，没有就返回错误，而且只能在 <code>same-origin</code> 模式下用。</p>
<p>这些选项只影响 HTTP 缓存。Service Worker 的 Cache API 是另一回事，MDN 说明它不看 HTTP 缓存头，条目不会自动过期，什么时候更新、删除都由脚本决定。</p>
<h2>还有哪些“缓存”不属于 HTTP 缓存</h2>
<p>HTML 规范给每个文档维护一张可用图片列表，按图片地址和 CORS 模式区分。同一张图片在页面里出现多次，浏览器可以直接用列表里的结果，不再走请求。浏览器可以随时清掉列表里的条目，比如为了省内存，也要按 <code>Cache-Control</code> 等缓存语义移除条目。</p>
<p>bfcache 缓存的是整个页面，点后退时直接恢复页面快照，跟 HTTP 缓存是两套机制，见<a href="/questions/browser-bfcache/">《bfcache 与 HTTP 缓存有什么区别？》</a>。</p>
<h2>调试时怎样看缓存</h2>
<p>Chrome DevTools 的 Network 面板里，Size 列可以看出响应是不是从缓存来的。勾选 Disable cache 会在 DevTools 打开期间禁用浏览器缓存，用来模拟首次访问的用户。</p>
<p>有时请求的 Headers 标签显示 <code>Provisional headers are shown</code>，Chrome 文档给出的原因之一是：请求没有走网络，而是从本地缓存返回的，缓存不保存原始请求头。这时禁用缓存再刷新，就能看到完整的请求头。</p>
<h2>常见追问</h2>
<p><strong>怎样确认一个问题是不是缓存造成的？</strong></p>
<blockquote>
<p>在 Chrome DevTools 的 Network 面板勾选 Disable cache 再刷新，或者长按刷新按钮选“清空缓存并硬性重新加载”，让所有资源都走网络。问题消失了，再看出问题时各个响应的 Size 列和响应头，找出是哪一层缓存返回了旧内容。</p>
</blockquote>
<p><strong>Cache-Control: no-store 能保证内容不留在用户电脑上吗？</strong></p>
<blockquote>
<p>只能要求遵守规范的缓存不存。RFC 9111 写明 <code>no-store</code> 不是保证隐私的可靠手段，有问题的缓存可能不遵守，网络上的其他环节也可能被窃听。敏感数据还要靠 HTTPS 和服务器端的访问控制。</p>
</blockquote>
<p><strong>Service Worker 和 HTTP 缓存都有内容时，用哪个？</strong></p>
<blockquote>
<p>看 Service Worker 怎么写。按 Fetch 规范，受控页面的请求先交给 Service Worker，它从 Cache API 里拿出响应返回，HTTP 缓存就不参与；它调用 <code>fetch()</code> 去请求，这次请求才会查 HTTP 缓存。</p>
</blockquote>`};export{e as default};