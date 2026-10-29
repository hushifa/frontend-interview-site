var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>CDN 这类共享缓存会把一个响应存下来，发给之后所有请求同一地址的人。缓存投毒就是攻击者构造一个特殊请求，让 CDN 存下一份被他动过手脚的响应，比如页面里的脚本地址被换成了他的域名，之后所有用户都会加载他的脚本。</p>
<p>问题出在缓存键上。缓存键是 CDN 判断“这两个请求算不算同一个”的依据，通常由方法、主机、路径和查询串组成，请求头默认不在里面。如果源站根据 <code>X-Forwarded-Host</code> 这种不在键里的请求头生成内容，攻击者改一下请求头，缓存却认为是同一个地址，就把恶意版本存下来了。</p>
<p>还有一种反过来的叫缓存欺骗。攻击者诱导用户访问 <code>/account/profile.css</code>，应用把它当成 <code>/account/profile</code> 返回了个人数据，CDN 看到 <code>.css</code> 后缀当静态资源存下来，攻击者再去访问就能拿到。</p>
<p>防护上，资源地址不读请求头；私有响应设 <code>Cache-Control: private</code>，完全不能缓存的再加 <code>no-store</code>；CDN 按源站的缓存头决定，不按扩展名强制缓存；CDN 和源站对 URL 的规范化要一致。</p>
</blockquote>
<h2>投毒是怎么发生的</h2>
<p>先看一段有问题的源站代码，它用请求头拼出脚本地址：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 有问题的写法</span>
<span class="hljs-keyword">const</span> host = req.<span class="hljs-property">headers</span>[<span class="hljs-string">&#x27;x-forwarded-host&#x27;</span>] ?? req.<span class="hljs-property">headers</span>.<span class="hljs-property">host</span>;
res.<span class="hljs-title function_">send</span>(<span class="hljs-string">\`&lt;script src=&quot;https://<span class="hljs-subst">\${host}</span>/app.js&quot;&gt;&lt;/script&gt;\`</span>);
</code></pre></div>
<p>正常请求时，这段代码没毛病。可是攻击者可以自己发一个带 <code>X-Forwarded-Host: evil.example</code> 的请求，源站就返回了加载 <code>evil.example/app.js</code> 的首页。CDN 的缓存键里没有这个请求头，它以为这就是 <code>/</code> 的正常响应，于是存了下来。之后所有访问首页的用户拿到的都是这份，都会加载攻击者的脚本。</p>
<p>改法有三种。最好的是资源地址用配置里的固定域名，根本不读请求头。如果确实要用某个请求头，就把它加进缓存键或者 <code>Vary</code>，并且只接受白名单里的值。另外可以在 CDN 边缘直接剥掉不需要的请求头，让它到不了源站。</p>
<h2>缓存欺骗是怎么发生的</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">https://app.example/account/settings/avatar.png
</code></pre></div>
<p>很多应用的路由比较宽松，会忽略多出来的路径段，于是这个地址返回的其实是账户设置页。可是 CDN 只看到了 <code>.png</code>，按图片缓存了它。攻击者只要诱导一个已登录的用户点一下这个链接，再自己去访问同一个地址，就拿到了那个用户的设置页。</p>
<p>所以应用对不存在的路径要返回 404，不要宽松匹配。个性化的响应设置 <code>Cache-Control: private, no-store</code>，CDN 尊重源站的 <code>Cache-Control</code>，而不是看到扩展名就强制缓存。带 <code>Authorization</code> 或会话 Cookie 的请求默认不缓存。</p>
<h2>为什么不能靠 Vary: Cookie 解决</h2>
<p><code>Vary</code> 告诉缓存“这个请求头不同，响应就不同”，只是声明哪些请求头会改变响应，它不做权限控制。如果写 <code>Vary: Cookie</code>，每个用户的 Cookie 都不一样，缓存几乎就没用了。私人数据正确的做法是标 <code>private</code>，让共享缓存根本不存。</p>
<h2>还有哪些东西容易被误缓存</h2>
<p>错误页和重定向是常被忽略的。一次 500 或者一个指向攻击者域名的 302 被缓存下来，所有人都会受影响。带个人信息的 JSON 接口也一样。还有按 <code>Accept-Language</code> 或设备类型返回不同内容的页面，如果没加 <code>Vary</code>，就会把中文页发给英文用户这样串内容。</p>
<p>另外 CDN 和源站对 URL 的理解要一致，包括大小写、尾斜杠、编码、路径参数。两边理解不同，就可能出现“CDN 认为是 A，源站返回的是 B”。</p>
<h2>怎么验证和应急</h2>
<p>看响应是不是来自共享缓存，可以看 <code>Age</code>、<code>Cache-Status</code> 或厂商自己的缓存头，见<a href="/questions/network-cache-status/">《Cache-Status 响应头能帮助诊断哪些缓存问题？》</a>。测试时给 URL 加一个随机参数，也就是 cache buster，避免把真实缓存污染了。</p>
<p>发现泄露后，先修好源站的头部，再清除 CDN 缓存。顺序不能反，而且已经缓存的副本不会因为源站改了就自动消失，必须手动清。</p>
<h2>常见追问</h2>
<p><strong>缓存投毒和普通的缓存配置错误有什么区别？</strong></p>
<blockquote>
<p>配置错误是被动地串内容，比如没加 <code>Vary</code> 导致语言串了。投毒是攻击者主动构造请求，故意让缓存存下恶意的响应。</p>
</blockquote>
<p><strong>前端能做些什么？</strong></p>
<blockquote>
<p>不要让页面输出依赖没验证过的请求头或者 URL 片段，接口按约定返回正确的缓存头，个人数据的接口明确标上 <code>private</code> 或 <code>no-store</code>。</p>
</blockquote>`};export{e as default};