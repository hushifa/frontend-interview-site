var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在 <code>https://shop.example/order?id=123&amp;token=abc</code> 页面点了一个外部链接，浏览器会在请求里带上 <code>Referer</code> 头，告诉对方“我是从哪个页面来的”。<code>Referrer-Policy</code> 就是用来控制这个头里带多少信息的。</p>
<p>之所以要控制，是因为地址里常常有隐私数据，比如订单号、搜索词、甚至令牌。完整地址发给第三方，就等于把这些数据泄露了出去。</p>
<p>现在浏览器的默认策略是 <code>strict-origin-when-cross-origin</code>：同源请求带完整地址，跨源请求只带源，比如 <code>https://shop.example/</code>，从 HTTPS 页面请求 HTTP 地址时不带。需要更严格可以设成 <code>no-referrer</code> 或 <code>same-origin</code>。设置方式有响应头、<code>&lt;meta name=&quot;referrer&quot;&gt;</code>、元素上的 <code>referrerpolicy</code> 属性，链接还能用 <code>rel=&quot;noreferrer&quot;</code>。</p>
<p>要注意，<code>unsafe-url</code> 会把完整地址发给任何目标，包括 HTTP 网站，MDN 明确提醒要慎用。另外不要拿 <code>Referer</code> 做安全校验，它可能被策略去掉。</p>
</blockquote>
<h2>Referer 里会带什么</h2>
<p><code>Referer</code> 头的名字本身就是 referrer 的拼写错误，规范沿用了下来，而控制它的 <code>Referrer-Policy</code> 拼对了。按 MDN 的说明，<code>Referer</code> 最多包含源、路径和查询字符串，不会包含 <code>#section</code> 这样的片段，也不会包含 <code>username:password</code> 这类用户信息。</p>
<p>所以真正可能泄露的是路径和查询字符串。比如重置密码页面的地址带着令牌，页面上又引用了第三方统计脚本，要是 <code>Referer</code> 发了完整地址，第三方服务器的日志里就会记下这个令牌。</p>
<h2>各个取值是什么意思</h2>
<p>规范定义了八个取值，区别在于“同源还是跨源”和“安全等级有没有降低”。安全等级降低指从 HTTPS 页面请求 HTTP 地址。</p>
<ul>
<li><code>no-referrer</code>：任何请求都不发 <code>Referer</code>。</li>
<li><code>no-referrer-when-downgrade</code>：安全等级不降低时发完整地址，降到 HTTP 时不发。</li>
<li><code>origin</code>：任何请求都只发源，比如 <code>https://example.com/</code>。</li>
<li><code>origin-when-cross-origin</code>：同源发完整地址，跨源和降级时只发源。</li>
<li><code>same-origin</code>：同源发完整地址，跨源不发。</li>
<li><code>strict-origin</code>：安全等级不变时只发源，降级时不发。</li>
<li><code>strict-origin-when-cross-origin</code>：同源发完整地址；跨源且安全等级不变时只发源；降级时不发。</li>
<li><code>unsafe-url</code>：任何请求都发完整地址，不管安全不安全。</li>
</ul>
<p>默认值是 <code>strict-origin-when-cross-origin</code>。没有指定策略，或者指定的值无效时，都用它。MDN 提到，这是 2020 年 11 月规范修订后的默认值，以前的默认值是 <code>no-referrer-when-downgrade</code>，那时跨源请求也会带完整地址。</p>
<p>用 MDN 的例子看一下默认策略：</p>
<table><thead><tr><th>当前页面</th><th>请求目标</th><th>发出的 Referer</th></tr></thead><tbody><tr><td><code>https://example.com/page</code></td><td><code>https://example.com/otherpage</code></td><td><code>https://example.com/page</code></td></tr><tr><td><code>https://example.com/page</code></td><td><code>https://mozilla.org</code></td><td><code>https://example.com/</code></td></tr><tr><td><code>https://example.com/page</code></td><td><code>http://example.com</code></td><td>不发</td></tr></tbody></table>
<p>第三行可能让人意外，明明是同一个域名，为什么不发？因为 <code>http://example.com</code> 和 <code>https://example.com</code> 协议不同，不是同源；而且从 HTTPS 到 HTTP 是降级，默认策略在降级时不发。</p>
<p>另外，W3C 规范规定，完整地址序列化后超过 4096 个字符时，浏览器会改为只发源。</p>
<h2>怎样设置</h2>
<p>最常用的是在 HTML 响应上加响应头，整个文档都按它来：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Referrer-Policy: strict-origin-when-cross-origin
</code></pre></div>
<p>响应头还能写多个值作为兜底，浏览器用最后一个它支持的值。下面这行在不支持 <code>strict-origin-when-cross-origin</code> 的旧浏览器里会退到 <code>no-referrer</code>：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Referrer-Policy: no-referrer, strict-origin-when-cross-origin
</code></pre></div>
<p>没法改响应头时，可以在页面里用 <code>&lt;meta&gt;</code> 设置整个文档的策略，也可以在单个元素上用 <code>referrerpolicy</code> 属性覆盖：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;referrer&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;no-referrer&quot;</span> /&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://partner.example&quot;</span> <span class="hljs-attr">referrerpolicy</span>=<span class="hljs-string">&quot;origin&quot;</span>&gt;</span>合作方<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://cdn.example/a.png&quot;</span> <span class="hljs-attr">referrerpolicy</span>=<span class="hljs-string">&quot;no-referrer&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;&quot;</span> /&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://partner.example&quot;</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;noreferrer&quot;</span>&gt;</span>合作方<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
</code></pre></div>
<p><code>referrerpolicy</code> 属性可以用在 <code>&lt;a&gt;</code>、<code>&lt;area&gt;</code>、<code>&lt;img&gt;</code>、<code>&lt;iframe&gt;</code>、<code>&lt;script&gt;</code>、<code>&lt;link&gt;</code> 上，只能写一个值，多个值兜底只有响应头支持。<code>rel=&quot;noreferrer&quot;</code> 可以用在 <code>a</code>、<code>area</code>、<code>link</code> 上。有个容易写错的地方：<code>rel</code> 里的 <code>noreferrer</code> 没有连字符，<code>&lt;meta&gt;</code> 里的 <code>no-referrer</code> 有连字符。</p>
<p>用 <code>fetch</code> 发请求时，可以通过 <code>referrerPolicy</code> 选项单独指定，取值和语义跟响应头一样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;https://api.partner.example/track&#x27;</span>, { <span class="hljs-attr">referrerPolicy</span>: <span class="hljs-string">&#x27;no-referrer&#x27;</span> });
</code></pre></div>
<p>CSS 里引用的资源也遵循策略。MDN 说明，外部样式表里的资源默认用 <code>strict-origin-when-cross-origin</code>，样式表自己的响应带了 <code>Referrer-Policy</code> 头就按那个；<code>&lt;style&gt;</code> 元素和 <code>style</code> 属性里的资源用所在文档的策略。</p>
<h2>常见追问</h2>
<p><strong>能不能用 Referer 防 CSRF？</strong></p>
<blockquote>
<p>不能把它当唯一手段。<code>Referer</code> 会被 <code>no-referrer</code> 等策略去掉，服务器看到没有这个头时无法判断请求来源。防 CSRF 应该用 SameSite Cookie、CSRF 令牌这类机制，<code>Referer</code> 或 <code>Origin</code> 只能作为辅助检查。</p>
</blockquote>
<p><strong>设置成 no-referrer 有什么副作用？</strong></p>
<blockquote>
<p>同源请求也不发 <code>Referer</code> 了，依赖它的功能会受影响，比如统计站内的来源页面、某些按来源做防盗链的图片服务。如果只是想不泄露给第三方，<code>same-origin</code> 更合适，它在站内仍然发完整地址，跨源才不发。</p>
</blockquote>
<p><strong>为什么默认值从 no-referrer-when-downgrade 改了？</strong></p>
<blockquote>
<p>旧默认值只在降级到 HTTP 时不发，HTTPS 网站之间的跨源请求都会带完整地址，路径和查询字符串里的数据很容易泄露给第三方。新默认值跨源只发源，在保留“从哪个网站来”这个信息的同时，把路径和参数藏了起来。</p>
</blockquote>`};export{e as default};