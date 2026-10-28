var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先确认问题在哪一层：直接请求源站正常、经过 CDN 异常，就是缓存层的问题。</li>
<li>看 <code>Age</code> 判断副本已经缓存多久，看 <code>Cache-Status</code> 或厂商头（如 <code>X-Cache</code>、<code>CF-Cache-Status</code>）判断哪一层命中。</li>
<li>对比 <code>ETag</code> 或 <code>Last-Modified</code> 和源站当前值，确认副本是否是旧版本。</li>
<li>检查缓存键：查询参数、<code>Vary</code> 头、设备类型和语言是否被正确纳入或排除。</li>
<li>修复后按 URL 或标签清除缓存，并保留证据，复盘缓存规则。</li>
</ul>
<h2>排查步骤</h2>
<ol>
<li>复现并记录：完整 URL、时间、地区、响应头。不同地区命中不同的边缘节点，结果可能不同。</li>
<li>绕过浏览器缓存：用无痕窗口或 <code>curl -sI</code>，排除本地缓存。</li>
<li>直连源站：通过源站域名或 <code>curl --resolve</code> 指定 IP 请求，对比响应头和内容。</li>
<li>逐层看缓存信息：每一层的命中状态、<code>Age</code>、新鲜期。</li>
<li>检查源站返回的 <code>Cache-Control</code>：是否被 CDN 规则覆盖，CDN 是否忽略了 <code>private</code>。</li>
<li>检查缓存键和 <code>Vary</code>：内容随语言或登录状态变化，但缓存键没区分，就会串内容。</li>
</ol>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">curl -sI https://www.example.com/app.js | grep -iE &#x27;age|cache|etag|vary|date&#x27;
curl -sI --resolve www.example.com:443:203.0.113.10 https://www.example.com/app.js
</code></pre></div>
<h2>常见原因</h2>
<table><thead><tr><th>现象</th><th>可能原因</th></tr></thead><tbody><tr><td>发版后仍是旧 JS</td><td>HTML 被长期缓存，引用旧哈希；或无哈希文件被长期缓存</td></tr><tr><td>用户看到别人的数据</td><td>个性化响应缺少 <code>private</code>，CDN 按 URL 缓存了</td></tr><tr><td>偶发 502 被缓存</td><td>CDN 缓存了错误响应，负缓存时间过长</td></tr><tr><td>语言或设备版本串了</td><td>缺少 <code>Vary</code>，或缓存键未包含区分维度</td></tr><tr><td>命中率很低</td><td>缓存键包含追踪参数、时间戳，或 <code>Vary: User-Agent</code> 导致碎片化</td></tr></tbody></table>
<p>用户数据串号属于安全事故，原理和防护见《什么是 Web 缓存投毒？如何避免把用户数据缓存给别人？》。</p>
<h2>预防</h2>
<ul>
<li>HTML 用 <code>no-cache</code>，静态资源用哈希文件名加长期缓存。</li>
<li>个性化接口默认 <code>private, no-cache</code>，CDN 规则对带 Cookie 或 <code>Authorization</code> 的请求不缓存。</li>
<li>缓存键白名单只保留影响内容的参数。</li>
<li>错误响应设置很短的缓存时间或不缓存。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>清除 CDN 缓存后用户还是旧的？浏览器本地缓存还在新鲜期，CDN 清除管不到，所以需要哈希文件名。</li>
<li><code>Age</code> 一直是 0？可能每次都回源，也可能该层没有缓存或不输出 <code>Age</code>。</li>
</ul>`};export{e as default};