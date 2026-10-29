var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户打开一个后台页面，Access Token 只有 15 分钟有效期，过期后页面同时发出的三个接口都收到了 401。无感刷新就是：请求层拦下这些 401，用 Refresh Token 换一个新的 Access Token，再把原来的请求重发一遍，用户看不出发生过什么。</p>
<p>难点在并发。三个请求同时 401，如果各自去刷新，就会发三次刷新请求；服务端如果启用了 Refresh Token 轮换，第二次刷新拿的已经是旧令牌，会被拒绝，甚至被当成泄露把整组令牌作废。所以要保证同一时间只有一个刷新请求，其余请求等它完成，再用新 token 重试。</p>
<p>刷新也失败了，说明 Refresh Token 过期或被作废，这时要清掉内存里的登录状态，跳转登录页，并记下当前地址，登录后跳回来。</p>
<p>要注意两个边界。重试只做一次，重试后还是 401 就按未登录处理，否则会死循环；刷新接口自己返回 401 时，不能再触发刷新。</p>
</blockquote>
<h2>什么时候该刷新</h2>
<p>接口返回 401 不一定都是 token 过期，也可能是 token 被篡改、被作废。RFC 6750 定义了 Bearer Token 的错误码，其中 <code>invalid_token</code> 表示令牌“过期、被吊销、格式错误或因其他原因无效”，资源服务器应当返回 401，客户端“可以申请新的 Access Token 并重试请求”。服务端一般会在响应头里写明：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error=&quot;invalid_token&quot;, error_description=&quot;The access token expired&quot;
</code></pre></div>
<p>所以前端的规则可以简单一点：普通接口返回 401，就尝试刷新一次；刷新失败才算真的未登录。403 不同，它表示身份已知但没有权限，刷新也没用，不该进入这套流程。</p>
<h2>并发请求只刷新一次</h2>
<p>关键是把“正在进行的刷新”存成一个 Promise。第一个遇到 401 的请求创建它，后面的请求发现它已经存在，就直接等这同一个 Promise。下面用一个假的 <code>fakeFetch</code> 模拟服务端，可以直接在 Node 里运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 假的服务端：只认最新的 access token，每次刷新都轮换 refresh token</span>
<span class="hljs-keyword">let</span> validAccess = <span class="hljs-string">&#x27;access-1&#x27;</span>;
<span class="hljs-keyword">let</span> validRefresh = <span class="hljs-string">&#x27;refresh-1&#x27;</span>;
<span class="hljs-keyword">let</span> refreshCalls = <span class="hljs-number">0</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fakeFetch</span>(<span class="hljs-params">url, options = {}</span>) {
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(r, <span class="hljs-number">10</span>));
  <span class="hljs-keyword">if</span> (url === <span class="hljs-string">&#x27;/refresh&#x27;</span>) {
    refreshCalls += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (options.<span class="hljs-property">body</span> !== validRefresh) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">401</span> };
    validAccess = <span class="hljs-string">\`access-<span class="hljs-subst">\${refreshCalls + <span class="hljs-number">1</span>}</span>\`</span>;
    validRefresh = <span class="hljs-string">\`refresh-<span class="hljs-subst">\${refreshCalls + <span class="hljs-number">1</span>}</span>\`</span>;
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>, <span class="hljs-attr">json</span>: <span class="hljs-title function_">async</span> () =&gt; ({ <span class="hljs-attr">access</span>: validAccess, <span class="hljs-attr">refresh</span>: validRefresh }) };
  }
  <span class="hljs-keyword">if</span> (options.<span class="hljs-property">token</span> !== validAccess) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">401</span> };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>, <span class="hljs-attr">json</span>: <span class="hljs-title function_">async</span> () =&gt; ({ url }) };
}

<span class="hljs-keyword">let</span> accessToken = <span class="hljs-string">&#x27;access-1&#x27;</span>;
<span class="hljs-keyword">let</span> refreshToken = <span class="hljs-string">&#x27;refresh-1&#x27;</span>;
<span class="hljs-keyword">let</span> refreshing = <span class="hljs-literal">null</span>; <span class="hljs-comment">// 正在进行的刷新，所有 401 请求共用它</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">refreshOnce</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!refreshing) {
    refreshing = <span class="hljs-title function_">fakeFetch</span>(<span class="hljs-string">&#x27;/refresh&#x27;</span>, { <span class="hljs-attr">body</span>: refreshToken })
      .<span class="hljs-title function_">then</span>(<span class="hljs-title function_">async</span> (res) =&gt; {
        <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> !== <span class="hljs-number">200</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;刷新失败，跳转登录&#x27;</span>);
        <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>();
        accessToken = data.<span class="hljs-property">access</span>;
        refreshToken = data.<span class="hljs-property">refresh</span>;
      })
      .<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> {
        refreshing = <span class="hljs-literal">null</span>;
      });
  }
  <span class="hljs-keyword">return</span> refreshing;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">request</span>(<span class="hljs-params">url</span>) {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fakeFetch</span>(url, { <span class="hljs-attr">token</span>: accessToken });
  <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> !== <span class="hljs-number">401</span>) <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">refreshOnce</span>();
  <span class="hljs-keyword">const</span> retry = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fakeFetch</span>(url, { <span class="hljs-attr">token</span>: accessToken });
  <span class="hljs-keyword">return</span> retry.<span class="hljs-title function_">json</span>();
}

validAccess = <span class="hljs-string">&#x27;expired&#x27;</span>; <span class="hljs-comment">// 模拟 access token 过期</span>
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([<span class="hljs-string">&#x27;/a&#x27;</span>, <span class="hljs-string">&#x27;/b&#x27;</span>, <span class="hljs-string">&#x27;/c&#x27;</span>].<span class="hljs-title function_">map</span>(request)).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">results</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(results.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-property">url</span>)); <span class="hljs-comment">// [ &#x27;/a&#x27;, &#x27;/b&#x27;, &#x27;/c&#x27; ]</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(refreshCalls); <span class="hljs-comment">// 1</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(accessToken, refreshToken); <span class="hljs-comment">// access-2 refresh-2</span>
});
</code></pre></div>
<p>三个请求都拿着过期的 token 发出去，都收到 401。第一个调用 <code>refreshOnce()</code> 时 <code>refreshing</code> 是空的，于是发起刷新；另外两个调用时刷新还没回来，拿到的是同一个 Promise。所以 <code>refreshCalls</code> 是 1，三个请求都等到新 token 后重试成功。</p>
<p>为什么要在 <code>finally</code> 里把 <code>refreshing</code> 清空？因为新 token 以后还会过期，下一轮 401 要能重新发起刷新。如果刷新失败，<code>refreshOnce()</code> 返回的 Promise 会被拒绝，所有等待的请求一起失败，这里就是统一跳转登录页的地方。</p>
<p><code>request</code> 里只重试一次，重试结果直接返回。真实项目里，重试后还是 401 应当当成未登录处理，而不是再刷新一轮。还有一种情况：请求发出时用的是旧 token，回来 401 时别的请求已经刷新完了。这时可以比较一下发请求时的 token 和当前 token，不同就直接用新 token 重试，不必再刷新。</p>
<h2>放到 axios 拦截器里</h2>
<p>用 axios 时，逻辑放在响应拦截器里，结构和上面一样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">api.<span class="hljs-property">interceptors</span>.<span class="hljs-property">response</span>.<span class="hljs-title function_">use</span>(<span class="hljs-literal">undefined</span>, <span class="hljs-title function_">async</span> (error) =&gt; {
  <span class="hljs-keyword">const</span> { config, response } = error;
  <span class="hljs-keyword">if</span> (response?.<span class="hljs-property">status</span> !== <span class="hljs-number">401</span> || config.<span class="hljs-property">_retried</span> || config.<span class="hljs-property">url</span> === <span class="hljs-string">&#x27;/auth/refresh&#x27;</span>) {
    <span class="hljs-keyword">throw</span> error;
  }
  config.<span class="hljs-property">_retried</span> = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">refreshOnce</span>();
  } <span class="hljs-keyword">catch</span> (refreshError) {
    <span class="hljs-title function_">redirectToLogin</span>(location.<span class="hljs-property">pathname</span> + location.<span class="hljs-property">search</span>);
    <span class="hljs-keyword">throw</span> refreshError;
  }
  config.<span class="hljs-property">headers</span>.<span class="hljs-property">Authorization</span> = <span class="hljs-string">\`Bearer <span class="hljs-subst">\${getAccessToken()}</span>\`</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">api</span>(config);
});
</code></pre></div>
<p><code>_retried</code> 标记保证每个请求最多重试一次，排除刷新接口本身是为了避免刷新接口 401 时又去刷新。<code>refreshOnce</code> 和上面一样共用一个 Promise。</p>
<h2>Refresh Token 轮换是什么</h2>
<p>Refresh Token 有效期长，泄露了危害更大。RFC 6749 允许授权服务器在刷新时签发新的 Refresh Token，这时客户端“必须丢弃旧的，换成新的”。RFC 9700 更进一步：对浏览器应用这类公共客户端，Refresh Token 必须绑定到发送方，或者使用轮换。</p>
<p>轮换的意思是，每次刷新都发一个新的 Refresh Token，旧的立即作废，但服务端记住它们属于同一组。如果攻击者偷走了 Refresh Token，他和真正的用户总有一方会拿着已经作废的旧令牌来刷新。RFC 9700 说，服务端分不清是谁，但会把这一组里还有效的 Refresh Token 一起吊销，代价是正常用户也要重新登录。</p>
<p>这就是为什么前端必须“只刷新一次”。同一个旧 Refresh Token 被并发提交两次，第二次在服务端看来就和被盗用一样，可能把用户直接踢下线。多个浏览器标签页也会遇到这个问题，可以用 <code>BroadcastChannel</code> 或 Web Locks API 让各标签页协调，只让一个页面刷新。</p>
<p>Token 存放在哪里，见<a href="/questions/security-session-jwt/">《Cookie-Session 和 JWT 登录有什么区别？前端的 Token 应该存在哪里？》</a>。如果 Refresh Token 放在 <code>HttpOnly</code> Cookie 里，前端读不到它，刷新请求只要带上 Cookie，新的 Refresh Token 由服务端通过 <code>Set-Cookie</code> 写回，前端只处理返回的 Access Token。</p>
<h2>常见追问</h2>
<p><strong>能不能在 token 快过期前主动刷新，而不是等 401？</strong></p>
<blockquote>
<p>可以。前端知道 Access Token 的过期时间，就可以提前一两分钟定时刷新，减少用户碰到 401 的次数。但 401 拦截仍然要保留，因为 token 可能被服务端提前作废，电脑休眠时定时器也可能来不及执行。</p>
</blockquote>
<p><strong>刷新时用户正在提交表单，请求会丢吗？</strong></p>
<blockquote>
<p>不会。提交请求收到 401 后会排队等刷新，刷新成功就用原来的配置重发，数据还在。但非幂等请求要确认服务端在 401 时确实没有执行操作，通常鉴权失败会在业务逻辑之前就返回，可以安全重试。</p>
</blockquote>
<p><strong>刷新失败跳登录时，怎样避免几个请求同时跳好几次？</strong></p>
<blockquote>
<p>跳转也放到共享的刷新 Promise 失败那一处统一处理，或者加一个“已经在跳转”的标记。这样不管有多少个请求在等，都只会触发一次跳转。</p>
</blockquote>`};export{e as default};