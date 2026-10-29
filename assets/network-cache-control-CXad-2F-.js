var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>选指令其实就是回答一个问题：这份响应能放心用多久。</p>
<p>文件名带内容哈希的 JS、CSS，内容永远不会变，就给很长的 <code>max-age</code> 加 <code>immutable</code>。<code>immutable</code> 告诉浏览器，在新鲜期内连刷新页面都不用去验证。HTML 入口会变，用 <code>no-cache</code>，意思是可以存，但每次用之前都要问服务器。</p>
<p>能接受一点旧数据的接口，可以加 <code>stale-while-revalidate=N</code>：过期后 N 秒内先把旧副本给用户，同时在后台去更新，用一次旧数据换掉等待时间。</p>
<p>银行流水、一次性令牌这种敏感内容，用 <code>no-store</code>，任何缓存都不许存。另外，<code>private</code> 表示只能存在用户浏览器里，<code>public</code> 和 <code>s-maxage</code> 是给 CDN 这类共享缓存看的。</p>
</blockquote>
<h2>一套典型配置</h2>
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
<p><code>/api/articles</code> 这一条可以这样读：60 秒内直接用缓存；过期后的 300 秒内，先返回旧副本，同时后台去拿新的；再往后就得等新响应了。<code>/api/me</code> 是每个人不一样的数据，所以加 <code>private</code>，不让 CDN 存。</p>
<h2>选的时候问自己三个问题</h2>
<p>第一，同一个 URL 下内容会不会变？文件名带哈希就不会变，长期缓存加 <code>immutable</code>。会变的话，就要设计新鲜期，或者每次都验证。</p>
<p>第二，用户能接受多旧的数据？一点都不能接受，就用 <code>no-cache</code>；能接受几分钟，就 <code>max-age</code> 加 <code>stale-while-revalidate</code>。</p>
<p>第三，内容是不是因人而异，或者很敏感？因人而异至少要加 <code>private</code>，防止 CDN 把一个人的数据缓存给别人。敏感到连硬盘都不能落，就用 <code>no-store</code>。</p>
<h2>部署时容易踩的坑</h2>
<p>最常见的是 HTML 被长期缓存。用户一直拿着旧 HTML，它引用的也是旧资源，发版就等于没发。所以 HTML 用 <code>no-cache</code>。</p>
<p>第二个是删旧文件删得太早。新版本上线后，有人还开着旧页面，旧页面懒加载时请求的是旧的哈希分块，文件已经删了就会 404。旧资源应该再保留一段时间。</p>
<p>第三个是滥用 <code>no-store</code>。它会让页面进不了部分浏览器的往返缓存（bfcache），前进后退都要重新加载，普通页面别随便加。</p>
<p>还有，CDN 可能有自己的缓存规则，会覆盖或忽略源站的头，要去 CDN 那边确认。</p>
<h2>常见追问</h2>
<p><strong><code>max-age=0</code> 和 <code>no-cache</code> 有区别吗？</strong></p>
<blockquote>
<p>效果接近，都是一拿到就过期、用之前要验证。<code>no-cache</code> 的意思表达得更明确。</p>
</blockquote>
<p><strong><code>stale-if-error</code> 是什么？</strong></p>
<blockquote>
<p>源站出错时，允许在指定时间内返回旧副本，提高可用性。支不支持要看具体的缓存实现。</p>
</blockquote>`};export{e as default};