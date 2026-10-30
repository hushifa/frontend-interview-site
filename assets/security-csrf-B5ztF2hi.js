var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户登录着银行网站，又打开了一个恶意网页。那个网页里藏着一个自动提交的表单，目标是银行的转账接口。浏览器提交时会自动带上银行的 Cookie，银行服务端一看会话有效，就把钱转了。这就是 CSRF，跨站请求伪造。</p>
<p>它能成功，是因为服务端只凭 Cookie 认人，而 Cookie 是浏览器自动带的，不管请求是从哪个网站发起的。攻击者读不到你的页面和响应，只能“盲发”请求，所以它针对的是转账、改密码这类修改操作。</p>
<p>防御的思路是让服务端认出请求不是自己页面发的。可以校验 <code>Origin</code> 或 <code>Sec-Fetch-Site</code> 请求头；表单和接口要求带一个攻击者拿不到的 CSRF 令牌；纯接口也可以要求自定义请求头，因为跨站带自定义头要先过 CORS 预检。<code>SameSite=Lax</code> 能挡掉大部分跨站 <code>POST</code>，但 OWASP 把它当作纵深防御，不能单独依赖。</p>
<p>要注意两点。第一，<code>GET</code> 不能改数据，因为 <code>Lax</code> 在顶层 <code>GET</code> 导航时照样带 Cookie。第二，有 XSS 时这些防护基本都会失效，因为恶意脚本就跑在你的页面里，能直接读到令牌再发请求。</p>
</blockquote>
<h2>一次攻击是怎么发生的</h2>
<p>攻击者不需要拿到 Cookie，只要让用户的浏览器替他发请求。下面是恶意网页里的一段 HTML，用户打开页面，表单就自动提交了：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">&quot;https://bank.example/transfer&quot;</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;POST&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;hidden&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;to&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;attacker&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;hidden&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;amount&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;10000&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">script</span>&gt;</span><span class="javascript">
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">forms</span>[<span class="hljs-number">0</span>].<span class="hljs-title function_">submit</span>();
</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>为什么同源策略拦不住它？因为同源策略限制的是“读”，不限制“发”。表单提交是浏览器很早就允许的跨站请求，恶意网页读不到响应，可请求已经到了服务端。如果会话 Cookie 跟着一起发过去，服务端就分不清这是用户自己点的还是别人伪造的。</p>
<p>所以 CSRF 的关键前提有三个：服务端靠浏览器自动带的凭据（Cookie、HTTP 认证）识别用户；接口会修改数据；请求参数攻击者都能猜到。防御就是破坏其中至少一个。</p>
<h2>SameSite 能挡住多少</h2>
<p><code>SameSite</code> 是 Cookie 的属性，决定跨站请求带不带这个 Cookie。按 MDN 的说明，<code>Strict</code> 只在同站请求里带；<code>Lax</code> 在同站请求里带，跨站时只有“顶层导航并且是安全方法（比如 <code>GET</code>）”才带，所以上面那个跨站 <code>POST</code> 表单不会带上 Cookie；<code>None</code> 都带，但必须同时设 <code>Secure</code>。</p>
<p>很多人记得“现在默认是 <code>Lax</code>”，这要说准确。MDN 写的是部分浏览器在没写 <code>SameSite</code> 时按 <code>Lax</code> 处理，并不是所有浏览器；而且作为默认值时用的是放宽版本，Cookie 设置后两分钟内，跨站 <code>POST</code> 仍然会带上。所以要显式写 <code>SameSite=Lax</code>，三个值的细节见<a href="/questions/sec-cookies/">《HttpOnly、Secure 和 SameSite 分别保护什么？》</a>。</p>
<p>就算显式写了，OWASP 也说它在大多数部署里不能代替正式的 CSRF 防御。原因有两个：<code>Lax</code> 在顶层 <code>GET</code> 导航时照样带 Cookie，用 <code>GET</code> 改数据的接口一点也没被保护；<code>SameSite</code> 按“站”判断，<code>a.example.com</code> 和 <code>b.example.com</code> 算同站，某个子域名被攻破，它发来的请求不受限制。</p>
<h2>服务端怎样认出伪造的请求</h2>
<p>最直接的是看请求从哪里来。浏览器发跨站请求时会带上 <code>Origin</code> 头，攻击者的脚本改不了它。支持 Fetch Metadata 的浏览器还会带 <code>Sec-Fetch-Site</code>，值是 <code>same-origin</code>、<code>same-site</code>、<code>cross-site</code> 或 <code>none</code>，OWASP 把它列为 CSRF 防护的主要信号，并要求对不带这个头的旧浏览器回退到校验 <code>Origin</code>。</p>
<p>下面是一个按 OWASP 规则写的校验函数：先看 <code>Sec-Fetch-Site</code>，没有就比对 <code>Origin</code>，<code>Origin</code> 也没有时再比对 <code>Referer</code> 的源，三者都拿不到就拒绝。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">TRUSTED_ORIGIN</span> = <span class="hljs-string">&#x27;https://app.example.com&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isSameOriginRequest</span>(<span class="hljs-params">headers</span>) {
  <span class="hljs-keyword">const</span> site = headers[<span class="hljs-string">&#x27;sec-fetch-site&#x27;</span>];
  <span class="hljs-keyword">if</span> (site) <span class="hljs-keyword">return</span> site === <span class="hljs-string">&#x27;same-origin&#x27;</span>;

  <span class="hljs-keyword">const</span> origin = headers.<span class="hljs-property">origin</span>;
  <span class="hljs-keyword">if</span> (origin) <span class="hljs-keyword">return</span> origin === <span class="hljs-variable constant_">TRUSTED_ORIGIN</span>;

  <span class="hljs-keyword">const</span> referer = headers.<span class="hljs-property">referer</span>;
  <span class="hljs-keyword">if</span> (referer) <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(referer).<span class="hljs-property">origin</span> === <span class="hljs-variable constant_">TRUSTED_ORIGIN</span>;

  <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">isSameOriginRequest</span>({ <span class="hljs-string">&#x27;sec-fetch-site&#x27;</span>: <span class="hljs-string">&#x27;cross-site&#x27;</span> }))); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">isSameOriginRequest</span>({ <span class="hljs-attr">origin</span>: <span class="hljs-string">&#x27;https://app.example.com&#x27;</span> }))); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">isSameOriginRequest</span>({ <span class="hljs-attr">origin</span>: <span class="hljs-string">&#x27;null&#x27;</span> }))); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">isSameOriginRequest</span>({ <span class="hljs-attr">referer</span>: <span class="hljs-string">&#x27;https://app.example.com.attacker.net/x&#x27;</span> }))); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">isSameOriginRequest</span>({}))); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>第三行的 <code>Origin: null</code> 为什么要拒绝？沙箱 iframe、某些重定向发出的请求，<code>Origin</code> 就是字符串 <code>null</code>。OWASP 明确说缺少这些头或值为 <code>null</code> 都不能当作同源的证据，不要把 <code>null</code> 放进白名单。</p>
<p>第四行是用前缀匹配会踩的坑。<code>https://app.example.com.attacker.net</code> 以可信地址开头，可它是攻击者的域名。所以要先解析出完整的源再比较，不能用 <code>startsWith</code>。</p>
<p>最后一行三个头都没有，函数直接拒绝。实际项目里，OWASP 的建议是这时候除非有其他防护（比如有效的 CSRF 令牌）通过，否则拒绝这个修改请求。示例只处理“修改操作”的判断，<code>GET</code> 请求本来就不该改数据，不需要走这一步。</p>
<h2>CSRF 令牌和自定义请求头</h2>
<p>令牌的思路是让请求里带一个攻击者拿不到的值。服务端为每个会话生成一个随机令牌，渲染页面时放进表单的隐藏字段，或者让前端放进请求头；收到修改请求时比对，缺少或不一致就拒绝。这叫同步令牌模式，适合服务端有会话存储的情况。OWASP 还要求这个令牌不要放在 Cookie 里传，也不要出现在 URL 和日志里。</p>
<p>服务端没有会话存储时，可以用签名的 Double Submit Cookie：令牌放在 Cookie 里，前端读出来再放进请求头，服务端比对两者并校验签名，具体做法见<a href="/questions/security-csrf-double-submit/">《Double Submit Cookie 能怎样防御 CSRF？》</a>。</p>
<p>对纯 JSON 接口，还有一个更轻的办法：要求每个修改请求都带一个自定义请求头，比如 <code>X-Requested-With</code>。HTML 表单设不了请求头，跨站的 <code>fetch</code> 带自定义头又会先发 CORS 预检，只要服务端不允许那个源，真正的请求就不会发出去。所以收到带这个头的请求，就能确定它不是跨站表单伪造的。前提是 CORS 配置要严格，带凭据时只允许自己控制的几个源，不要用正则放行所有子域名。</p>
<h2>和 XSS 有什么区别</h2>
<p>两者最大的区别是攻击代码在哪里运行。CSRF 的代码在别的网站上，读不到你的页面和响应，只能借浏览器自动带 Cookie 这一点盲发请求。XSS 是攻击者的脚本跑进了你的页面，以你的源的身份运行，能读页面、读令牌、发任意请求，见<a href="/questions/http-xss/">《XSS 有哪几种？前端怎样防范？》</a>。</p>
<p>所以 OWASP 提醒，XSS 能绕过所有 CSRF 防护。令牌藏在页面里，恶意脚本可以先读出来；请求从你自己的页面发出，<code>Origin</code> 和 <code>Sec-Fetch-Site</code> 也都是同源。防 CSRF 之前，先得把 XSS 堵住。</p>
<h2>常见追问</h2>
<p><strong>用 <code>localStorage</code> 存令牌、放在 <code>Authorization</code> 头里发，还需要防 CSRF 吗？</strong></p>
<blockquote>
<p>这种方式本身不受 CSRF 影响，因为浏览器不会自动带上 <code>localStorage</code> 里的东西，攻击者的网站也读不到它。但只要还有任何接口靠 Cookie 认证，那些接口就仍然要防。而且 <code>localStorage</code> 的令牌一旦遇到 XSS 就会被直接读走，安全问题只是换了地方。</p>
</blockquote>
<p><strong>登录接口需要防 CSRF 吗？</strong></p>
<blockquote>
<p>需要。攻击者可以让你的浏览器用他的账号登录，你之后的操作和输入就都记在他的账号里，这叫登录 CSRF。OWASP 的做法是登录前先建立一个预会话，登录表单也带令牌；登录成功后销毁旧会话、换一个新的，防止会话固定攻击。</p>
</blockquote>
<p><strong>为什么不能用 <code>GET</code> 做修改操作？</strong></p>
<blockquote>
<p>因为 <code>GET</code> 最容易被伪造，一个 <code>&lt;img src&gt;</code> 或一个链接就能发出去，而且 <code>SameSite=Lax</code> 在顶层 <code>GET</code> 导航时会带 Cookie。OWASP 明确要求不要用 <code>GET</code> 改状态；历史接口确实这样做了，也必须同样加上 CSRF 防护。</p>
</blockquote>`};export{e as default};