var e={answerHtml:`<h2>为什么需要新的 Cookie 访问方式</h2>
<p><code>document.cookie</code> 看起来只是一个字符串，但每次读取都要把当前作用域可见的 Cookie 拼接出来。Cookie 较多、页面频繁读取，或者代码在滚动和输入事件中反复访问它时，同步调用可能阻塞主线程。它还不方便监听其他代码对 Cookie 的修改，组件往往只能定时读取。</p>
<p>Cookie Store API 提供 Promise 形式的 <code>get</code>、<code>set</code>、<code>delete</code>，并支持 change 事件。它改善的是访问方式和代码组织，不会改变 Cookie 的安全模型，也不会让前端获得读取 HttpOnly Cookie 的权限。</p>
<h2>先封装，再让业务使用</h2>
<p>不要让每个组件自己拼接 Cookie 字符串。应该集中定义名称、路径和生命周期，并为不支持新 API 的浏览器保留降级：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> themeCookie = {
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;theme&#x27;</span>,
  <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/&#x27;</span>,
  <span class="hljs-attr">sameSite</span>: <span class="hljs-string">&#x27;lax&#x27;</span>,
  <span class="hljs-attr">maxAge</span>: <span class="hljs-number">60</span> * <span class="hljs-number">60</span> * <span class="hljs-number">24</span> * <span class="hljs-number">365</span>,
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">readLegacyCookie</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-keyword">const</span> prefix = <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(name)}</span>=\`</span>;
  <span class="hljs-keyword">const</span> item = <span class="hljs-variable language_">document</span>.<span class="hljs-property">cookie</span>
    .<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;; &#x27;</span>)
    .<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">part</span>) =&gt;</span> part.<span class="hljs-title function_">startsWith</span>(prefix));
  <span class="hljs-keyword">return</span> item ? <span class="hljs-built_in">decodeURIComponent</span>(item.<span class="hljs-title function_">slice</span>(prefix.<span class="hljs-property">length</span>)) : <span class="hljs-literal">null</span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getTheme</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (globalThis.<span class="hljs-property">cookieStore</span>) {
    <span class="hljs-keyword">const</span> cookie = <span class="hljs-keyword">await</span> cookieStore.<span class="hljs-title function_">get</span>(themeCookie.<span class="hljs-property">name</span>);
    <span class="hljs-keyword">return</span> cookie?.<span class="hljs-property">value</span> ?? <span class="hljs-string">&#x27;system&#x27;</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">readLegacyCookie</span>(themeCookie.<span class="hljs-property">name</span>) ?? <span class="hljs-string">&#x27;system&#x27;</span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">setTheme</span>(<span class="hljs-params">theme</span>) {
  <span class="hljs-keyword">const</span> value = theme === <span class="hljs-string">&#x27;light&#x27;</span> || theme === <span class="hljs-string">&#x27;dark&#x27;</span> ? theme : <span class="hljs-string">&#x27;system&#x27;</span>;
  <span class="hljs-keyword">if</span> (globalThis.<span class="hljs-property">cookieStore</span>) {
    <span class="hljs-keyword">await</span> cookieStore.<span class="hljs-title function_">set</span>({ ...themeCookie, value });
    <span class="hljs-keyword">return</span>;
  }
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">cookie</span> = <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(themeCookie.name)}</span>=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(value)}</span>; Path=/; Max-Age=<span class="hljs-subst">\${themeCookie.maxAge}</span>; SameSite=Lax\`</span>;
}
</code></pre></div>
<p>封装层负责编码、默认值和降级，组件只关心 <code>getTheme()</code> 和 <code>setTheme()</code>。这样以后更换存储方式、调整过期时间或修复 Cookie 属性时，不需要搜索整个项目里的字符串拼接代码。</p>
<h2>Cookie 的作用域决定谁能看到它</h2>
<p>Cookie 是否可读，取决于名称、域名、路径、协议和浏览器的存储策略。设置在 <code>/account</code> 路径下的 Cookie，在 <code>/</code> 页面不一定可见；使用不同 Domain 或子域名也会影响发送范围。删除时必须使用与原 Cookie 匹配的 <code>name</code>、<code>path</code> 和 <code>domain</code>，否则你以为删除成功，旧 Cookie 可能仍然存在。</p>
<p>同名 Cookie 在不同路径下可以同时存在。服务端收到请求时可能看到多个同名值，前端只删除其中一个会导致登录状态或配置表现不一致。修改 Cookie 规则时，应先盘点线上已有的路径和域名，再设计迁移策略。</p>
<h2>身份认证不能交给可读 Cookie</h2>
<p>登录会话通常应该由服务端设置 <code>HttpOnly</code>、<code>Secure</code> 和合适的 <code>SameSite</code> Cookie。<code>HttpOnly</code> 可以阻止 JavaScript 读取会话值，即使使用 Cookie Store API 也一样。这样能降低 XSS 直接窃取会话令牌的风险。</p>
<p>前端可以读取一个非敏感的 <code>session_hint</code> 来决定是否提前展示加载状态，但最终身份必须由服务端根据会话 Cookie 判断。不能因为前端读不到 HttpOnly Cookie 就把令牌复制到 localStorage 或普通 Cookie 中。CSRF 防护、权限校验、会话失效和刷新策略仍然是服务端责任。</p>
<h2>监听变化时要区分自己和其他上下文</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">watchTheme</span>(<span class="hljs-params">onChange</span>) {
  <span class="hljs-keyword">if</span> (!globalThis.<span class="hljs-property">cookieStore</span>) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">handler</span> = (<span class="hljs-params">event</span>) =&gt; {
    <span class="hljs-keyword">const</span> changed = event.<span class="hljs-property">changed</span>.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">cookie</span>) =&gt;</span> cookie.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;theme&#x27;</span>);
    <span class="hljs-keyword">const</span> deleted = event.<span class="hljs-property">deleted</span>.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">cookie</span>) =&gt;</span> cookie.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;theme&#x27;</span>);
    <span class="hljs-keyword">if</span> (changed) <span class="hljs-title function_">onChange</span>(changed.<span class="hljs-property">value</span>);
    <span class="hljs-keyword">if</span> (deleted) <span class="hljs-title function_">onChange</span>(<span class="hljs-string">&#x27;system&#x27;</span>);
  };

  cookieStore.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, handler);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> cookieStore.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, handler);
}
</code></pre></div>
<p>组件挂载时注册监听，卸载时必须移除，否则页面长时间运行后会累积回调。自己调用 <code>setTheme</code> 后不要等待 change 事件才更新当前组件，应立即更新本地状态；监听主要用于响应其他代码或其他上下文的变化。</p>
<p>监听事件也不是跨站同步协议。它不能监听别的域名，也不能保证所有嵌入场景下的存储分区都相同。需要跨标签页传递复杂状态时，应使用 BroadcastChannel 或重新读取共享数据，而不是把 Cookie change 当成消息队列。</p>
<h2>服务端渲染和缓存会改变设计</h2>
<p>如果服务端根据 Cookie 输出主题、语言或用户信息，客户端监听 Cookie 变化不会自动改变已经生成的 HTML。变化后需要重新请求数据或刷新相关区域。包含用户身份的响应还要正确设置缓存策略，避免 CDN 把一个用户的内容提供给另一个用户。</p>
<p>主题和语言这类非敏感偏好可以在首屏早期读取，以减少闪烁；登录状态则应让服务端决定，客户端只负责展示加载中、已登录或未登录等状态。不要为了让客户端更方便而暴露认证凭据。</p>
<h2>异步访问仍然需要处理并发</h2>
<p>两个请求同时刷新会话时，不能让它们各自写入不同 Cookie，再由最后完成的请求覆盖前一个结果。请求层应合并刷新任务，并在登出后拒绝旧请求写回状态。<code>cookieStore.set()</code> 成功只表示浏览器接受了设置，不代表服务器已经处理了业务，也不代表下一次请求一定已经完成。</p>
<p>测试时需要覆盖新 API 不存在、HTTPS 与 HTTP、过期和删除、不同 Path、HttpOnly 不可读、多个请求并发刷新以及页面重新打开等情况。Cookie Store 是更好的访问接口，但它不会替你解决认证协议、并发控制和安全问题。</p>`};export{e as default};