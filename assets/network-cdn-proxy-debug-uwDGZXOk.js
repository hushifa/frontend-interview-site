var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>排查的第一步是定位问题在哪一层。直接请求源站是正常的，经过 CDN 就不对，那问题就在缓存层。</p>
<p>定位到缓存层以后，看几个头。<code>Age</code> 说明副本已经缓存了多久；<code>Cache-Status</code> 或者厂商自己的头，比如 <code>X-Cache</code>、<code>CF-Cache-Status</code>，说明是哪一层命中的。再拿 <code>ETag</code> 或 <code>Last-Modified</code> 和源站当前的值对比，就知道副本是不是旧版本。</p>
<p>很多问题出在缓存键上。缓存键就是缓存用来区分“这是不是同一份内容”的依据。查询参数、<code>Vary</code> 头、设备类型、语言有没有被正确算进去或排除掉，都要检查。</p>
<p>修好以后，按 URL 或标签清除缓存，同时保留证据，回头复盘缓存规则。</p>
</blockquote>
<h2>一步步怎么查</h2>
<p>第一步，复现并记下现场：完整 URL、时间、地区、响应头。不同地区会命中不同的边缘节点，结果可能不一样，所以地区很重要。</p>
<p>第二步，排除浏览器本地缓存。用无痕窗口，或者直接用 <code>curl -sI</code>。</p>
<p>第三步，直连源站。用源站域名，或者用 <code>curl --resolve</code> 指定源站 IP，对比响应头和内容。</p>
<p>第四步，逐层看缓存信息，包括每一层的命中状态、<code>Age</code> 和新鲜期。</p>
<p>第五步，检查源站返回的 <code>Cache-Control</code>。看它有没有被 CDN 规则覆盖，CDN 是不是忽略了 <code>private</code>。</p>
<p>第六步，检查缓存键和 <code>Vary</code>。内容会随语言或登录状态变化，缓存键却没区分，就会串内容。</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">curl -sI https://www.example.com/app.js | grep -iE &#x27;age|cache|etag|vary|date&#x27;
curl -sI --resolve www.example.com:443:203.0.113.10 https://www.example.com/app.js
</code></pre></div>
<p>第一条走正常的 DNS，经过 CDN；第二条把域名强行解析到源站 IP，绕开 CDN。两条的响应头一对比，差别就出来了。</p>
<h2>常见的现象和原因</h2>
<table><thead><tr><th>现象</th><th>可能原因</th></tr></thead><tbody><tr><td>发版后仍是旧 JS</td><td>HTML 被长期缓存，引用旧哈希；或无哈希文件被长期缓存</td></tr><tr><td>用户看到别人的数据</td><td>个性化响应缺少 <code>private</code>，CDN 按 URL 缓存了</td></tr><tr><td>偶发 502 被缓存</td><td>CDN 缓存了错误响应，负缓存时间过长</td></tr><tr><td>语言或设备版本串了</td><td>缺少 <code>Vary</code>，或缓存键未包含区分维度</td></tr><tr><td>命中率很低</td><td>缓存键包含追踪参数、时间戳，或 <code>Vary: User-Agent</code> 导致碎片化</td></tr></tbody></table>
<p>表里的“负缓存”指的是把错误响应也缓存起来。偶尔一次 502 被存了很久，所有用户就都看到 502。</p>
<p><code>Vary: User-Agent</code> 为什么会让命中率变低？因为 User-Agent 的取值成千上万，每种都单独存一份，几乎不会有两个用户命中同一份。</p>
<p>用户看到别人的数据属于安全事故，原理和防护见<a href="/questions/sec-cache-poisoning/">《什么是 Web 缓存投毒？如何避免把用户数据缓存给别人？》</a>。</p>
<h2>怎样提前预防</h2>
<p>HTML 用 <code>no-cache</code>，静态资源用哈希文件名加长期缓存，这样发版不会卡在旧版本上。</p>
<p>个性化接口默认用 <code>private, no-cache</code>。CDN 规则里，带 Cookie 或 <code>Authorization</code> 的请求一律不缓存。</p>
<p>缓存键用白名单，只保留真正影响内容的参数。错误响应设很短的缓存时间，或者干脆不缓存。</p>
<h2>常见追问</h2>
<p><strong>清除了 CDN 缓存，用户还是旧的？</strong></p>
<blockquote>
<p>用户浏览器里的本地缓存还在新鲜期，CDN 清除管不到它。所以资源要用哈希文件名，换内容就换 URL。</p>
</blockquote>
<p><strong><code>Age</code> 一直是 0？</strong></p>
<blockquote>
<p>可能每次都回源了，也可能这一层根本没缓存，或者它不输出 <code>Age</code>。</p>
</blockquote>`};export{e as default};