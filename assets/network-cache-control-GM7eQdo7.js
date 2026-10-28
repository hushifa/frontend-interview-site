var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>immutable</code>：告诉浏览器新鲜期内内容不会变，刷新页面时也不必重新验证。只用于 URL 带内容哈希的文件。</li>
<li><code>stale-while-revalidate=N</code>：过期后 N 秒内先返回旧副本，同时在后台验证更新，用一次旧数据换掉等待时间。</li>
<li><code>no-store</code>：不允许任何缓存存储响应，用于银行流水、一次性令牌等敏感内容。</li>
<li><code>no-cache</code>：允许存储，但每次使用前都要向服务器验证，适合 HTML 入口。</li>
<li><code>private</code> 只允许浏览器缓存，<code>public</code> 和 <code>s-maxage</code> 面向 CDN 等共享缓存。</li>
</ul>
<h2>典型配置</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http"># /assets/app.3f9a1c.js
Cache-Control: public, max-age=31536000, immutable

# /index.html
Cache-Control: no-cache
ETag: &quot;v42&quot;

# /api/articles（可接受一分钟内的旧数据）
Cache-Control: public, max-age=60, stale-while-revalidate=300

# /api/me
Cache-Control: private, no-cache

# /api/payment-token
Cache-Control: no-store
</code></pre></div>
<h2>选择时问三个问题</h2>
<ol>
<li>内容会不会在同一个 URL 下变化？不会变（哈希文件名）就长期缓存加 <code>immutable</code>；会变就要设计新鲜期或每次验证。</li>
<li>用户能接受多旧的数据？不能接受就 <code>no-cache</code>；能接受几分钟就 <code>max-age</code> 加 <code>stale-while-revalidate</code>。</li>
<li>内容是否因人而异或敏感？因人而异至少要 <code>private</code>，防止 CDN 缓存给别人；敏感到不能落盘就用 <code>no-store</code>。</li>
</ol>
<h2>部署时的坑</h2>
<ul>
<li>HTML 被长期缓存后，用户会一直加载旧入口和旧资源，发版无效。HTML 用 <code>no-cache</code>。</li>
<li>新版本上线后删掉旧的哈希文件，已经打开的旧页面懒加载旧分块时会 404。旧资源应保留一段时间。</li>
<li><code>no-store</code> 会让页面无法进入部分浏览器的往返缓存（bfcache），不要给普通页面滥用。</li>
<li>CDN 可能有自己的缓存规则，会覆盖或忽略源站头部，要在 CDN 侧确认。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>max-age=0</code> 和 <code>no-cache</code> 有区别吗？效果接近，都是立即过期需验证；<code>no-cache</code> 语义更明确。</li>
<li><code>stale-if-error</code> 是什么？源站出错时允许在指定时间内返回旧副本，提高可用性，支持情况因缓存实现而异。</li>
</ul>`};export{e as default};