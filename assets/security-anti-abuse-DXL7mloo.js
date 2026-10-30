var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如登录接口被人用脚本拿泄露的账号密码批量尝试，或者短信验证码接口被反复调用。防刷就是让服务端识别并拦住这类自动化请求，同时不影响正常用户。</p>
<p>拦截必须放在服务端，因为前端代码和请求都在攻击者手里，脚本可以完全不经过页面直接调接口。OWASP 也提醒，设备指纹、JavaScript 挑战这类客户端防御可能被伪造或绕过，要有其他层兜底。</p>
<p>服务端常见的几层是：限流，单位时间请求过多时返回 429，可以带 <code>Retry-After</code> 告诉客户端多久后再试；登录失败次数按账号计数并锁定一段时间；请求看起来可疑时再要求验证码或多因素认证。OWASP 认为多因素认证是应对撞库最有效的手段。</p>
<p>前端负责配合：按钮防重复点击、收到 429 时按 <code>Retry-After</code> 提示和等待、在服务端要求时展示验证码、登录失败只提示“用户名或密码错误”。要注意验证码不是万能的，OWASP 写明存在破解验证码的工具和服务。</p>
</blockquote>
<h2>为什么拦截只能在服务端做</h2>
<p>前端写的任何检查，比如“60 秒内只能点一次发送验证码”，只是对正常使用页面的人生效。攻击者用脚本直接请求接口，根本不会运行页面上的代码。所以前端的限制只能算体验优化，真正的次数统计和拒绝都要在服务端完成。</p>
<p>OWASP 撞库防护速查表专门讲了这一点：设备指纹或 JavaScript 挑战这类客户端防御可能被伪造或绕过，需要设计其他层防御，在某一层失效时仍然能挡住攻击。</p>
<h2>服务端通常有哪几层</h2>
<p>第一层是限流。OWASP 拒绝服务速查表的定义是控制进出服务器或组件的流量速率，可以在基础设施层做，也可以在应用层做，依据可以是 IP、IP 黑名单、地理位置等。超过限制时，服务端返回 429 Too Many Requests，MDN 说明这个状态码表示客户端在给定时间内发了太多请求，响应里可以带 <code>Retry-After</code> 头，告诉客户端多久以后再请求。</p>
<p>只按 IP 限制不够。OWASP 写明，封 IP 能挡住不太复杂的攻击，但很容易绕过，不应该作为唯一或主要的防御，更有效的是根据攻击的不同特征分级响应、组合多种手段。</p>
<p>第二层是针对登录的账号锁定。OWASP 认证速查表建议，失败次数要和账号本身关联，而不是和来源 IP 关联，否则攻击者换很多个 IP 就能继续尝试。锁定策略要定三个数：多少次失败后锁定、在多长时间窗口内统计、锁定多久。</p>
<p>第三层是验证码和多因素认证。OWASP 说要求用户解验证码能帮助识别自动化请求、减缓撞库，但验证码并不完美，存在能以较高成功率破解它的工具或服务。为了兼顾体验，可以只在请求被判定为可疑或高风险时才要求验证码。多因素认证被 OWASP 称为应对大部分密码类攻击最好的防御，也可以只在可疑登录时要求第二因素。</p>
<h2>前端负责哪些配合</h2>
<p>最直接的是防重复点击，提交后禁用按钮、请求结束再恢复，具体做法见<a href="/questions/design-prevent-duplicate/">《前端怎样防止重复提交和接口重复请求？》</a>。这减少的是正常用户误操作产生的重复请求，挡不住脚本。</p>
<p>收到 429 时要正确处理。下面的函数根据 <code>Retry-After</code> 算出等待的秒数，这个头的值可以是秒数，也可以是 HTTP 日期，示例只处理秒数的情况：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">waitSeconds</span>(<span class="hljs-params">status, retryAfter</span>) {
  <span class="hljs-keyword">if</span> (status !== <span class="hljs-number">429</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> seconds = <span class="hljs-title class_">Number</span>(retryAfter);
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(seconds) &amp;&amp; seconds &gt; <span class="hljs-number">0</span> ? seconds : <span class="hljs-number">60</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">waitSeconds</span>(<span class="hljs-number">200</span>, <span class="hljs-literal">null</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">waitSeconds</span>(<span class="hljs-number">429</span>, <span class="hljs-string">&#x27;30&#x27;</span>)); <span class="hljs-comment">// 30</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">waitSeconds</span>(<span class="hljs-number">429</span>, <span class="hljs-literal">null</span>)); <span class="hljs-comment">// 60</span>
</code></pre></div>
<p>没有 <code>Retry-After</code> 时用一个默认等待时间，这里写 60 秒只用于演示。拿到秒数后，前端可以在按钮上显示倒计时，而不是让用户反复点、或者自动重试把服务端压得更重。</p>
<p>验证码由服务端决定什么时候要。常见流程是服务端判断请求可疑，返回需要验证的错误码，前端弹出验证码组件，用户通过后把验证结果随请求再提交一次，服务端校验这个结果。前端不能自己判断“验证通过了”就放行。</p>
<p>错误提示保持通用。OWASP 要求登录、重置密码、找回密码等功能无论账号是否存在都返回通用的提示，避免攻击者通过提示差异枚举出哪些用户名存在。</p>
<h2>常见追问</h2>
<p><strong>为什么登录失败次数要按账号统计，而不是按 IP？</strong></p>
<blockquote>
<p>按 IP 统计的话，攻击者换一批 IP 就能继续对同一个账号尝试。OWASP 认证速查表要求把失败计数和账号关联，这样无论请求从多少个 IP 发出，同一个账号失败多了都会被锁定。</p>
</blockquote>
<p><strong>有了验证码是不是就不用限流了？</strong></p>
<blockquote>
<p>不是。OWASP 写明验证码存在破解工具和服务，它只能减缓自动化攻击。限流、账号锁定、多因素认证要一起用，某一层被绕过时还有其他层。</p>
</blockquote>`};export{e as default};