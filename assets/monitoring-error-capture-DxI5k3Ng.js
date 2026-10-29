var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端错误监控要覆盖三类错误，各有各的入口。脚本运行时抛的错，会以 <code>ErrorEvent</code> 派发到 <code>window</code> 上，用 <code>window.onerror</code> 或 <code>addEventListener(&#x27;error&#x27;)</code> 就能捕获。</p>
<p>Promise 被拒绝了又没人处理，不会触发 <code>error</code>，而是触发 <code>unhandledrejection</code>，拒绝的原因在 <code>event.reason</code> 里。</p>
<p>图片、脚本、样式表加载失败也会触发 <code>error</code> 事件，但它派发在元素上，而且不冒泡，所以全局捕获时必须在 <code>window</code> 上用捕获阶段监听。</p>
<p>还有一个常见坑：脚本放在 CDN 等其他源上时，它抛的错浏览器只给一句 <code>Script error.</code>，行列号是 0，<code>error</code> 是 <code>null</code>。要拿到详情，脚本标签要加 <code>crossorigin</code>，服务端还要返回 <code>Access-Control-Allow-Origin</code>。</p>
</blockquote>
<h2>运行时错误</h2>
<p>先看最常用的 <code>onerror</code> 写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-property">onerror</span> = <span class="hljs-function">(<span class="hljs-params">message, source, lineno, colno, error</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;js&#x27;</span>, message, source, lineno, colno, <span class="hljs-attr">stack</span>: error?.<span class="hljs-property">stack</span> });
};
</code></pre></div>
<p>为什么它能收到五个参数？因为 <code>onerror</code> 是个特例，它是唯一接收多个参数的事件处理属性。换成 <code>addEventListener(&#x27;error&#x27;, handler)</code> 就只收到一个 <code>ErrorEvent</code>，字段分别是 <code>message</code>、<code>filename</code>、<code>lineno</code>、<code>colno</code>、<code>error</code>。</p>
<p><code>onerror</code> 返回 <code>true</code> 可以阻止控制台打印默认报错，但抛错的那段脚本该中止还是中止。</p>
<p>要注意，全局监听只能收到“没人管”的错误。被 <code>try/catch</code> 包住的，或者被框架错误边界吞掉的错误，不会到达全局事件，需要在框架层另外上报，比如 React 的错误边界、Vue 的 <code>app.config.errorHandler</code>。</p>
<h2>Promise 拒绝</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;unhandledrejection&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;promise&#x27;</span>, <span class="hljs-attr">reason</span>: <span class="hljs-title class_">String</span>(event.<span class="hljs-property">reason</span>), <span class="hljs-attr">stack</span>: event.<span class="hljs-property">reason</span>?.<span class="hljs-property">stack</span> });
});
</code></pre></div>
<p>事件对象是 <code>PromiseRejectionEvent</code>，有 <code>promise</code> 和 <code>reason</code> 两个属性。为什么要写 <code>String(event.reason)</code> 和 <code>event.reason?.stack</code>？因为 <code>reason</code> 不一定是 <code>Error</code>，<code>reject(&#x27;超时&#x27;)</code> 传的就是字符串，也可能是普通对象，上报前要做类型判断。</p>
<p>如果一个 Promise 先被拒绝了，后来才挂上处理函数，浏览器会再触发一次 <code>rejectionhandled</code>，可以用来修正“未处理”的统计。调用 <code>preventDefault()</code> 只是取消控制台的默认输出。另外，来自跨域脚本的拒绝不会触发这个事件。</p>
<h2>资源加载失败</h2>
<p>资源错误不冒泡，所以要在 <code>window</code> 上用捕获阶段拦截，第三个参数传 <code>true</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(
  <span class="hljs-string">&#x27;error&#x27;</span>,
  <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (event <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">ErrorEvent</span>) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 运行时错误交给上面的逻辑</span>
    <span class="hljs-keyword">const</span> el = event.<span class="hljs-property">target</span>;
    <span class="hljs-title function_">report</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;resource&#x27;</span>, <span class="hljs-attr">tag</span>: el.<span class="hljs-property">tagName</span>, <span class="hljs-attr">url</span>: el.<span class="hljs-property">src</span> || el.<span class="hljs-property">href</span> });
  },
  <span class="hljs-literal">true</span>, <span class="hljs-comment">// 资源错误不冒泡，只能在捕获阶段拿到</span>
);
</code></pre></div>
<p>为什么开头要判断 <code>ErrorEvent</code>？因为运行时错误也会触发 <code>window</code> 上的 <code>error</code>，捕获阶段两种都会收到。运行时错误是 <code>ErrorEvent</code>，资源错误只是普通的 <code>Event</code>，这样就能分开。</p>
<p>资源错误是普通 <code>Event</code>，所以拿不到 HTTP 状态码。需要状态码或耗时的话，可以结合 Resource Timing 的数据来分析。还要注意，<code>fetch</code> 失败不属于资源错误，它表现为 Promise 拒绝，应该在请求封装层统一处理。</p>
<h2>跨域脚本为什么只剩 Script error.</h2>
<p>脚本放在其他源时，浏览器为了避免跨源信息泄露，会把错误详情屏蔽掉。要拿到详情，需要页面和 CDN 双方配合。页面这边给脚本加 <code>crossorigin</code>：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://cdn.example.com/app.js&quot;</span> <span class="hljs-attr">crossorigin</span>=<span class="hljs-string">&quot;anonymous&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>CDN 那边要返回 <code>Access-Control-Allow-Origin: https://www.example.com</code>，也可以写 <code>*</code>，但 <code>*</code> 不能和 <code>use-credentials</code> 一起用。</p>
<p>这两步缺一不可。如果只加了属性，服务端却没返回这个响应头，脚本会整个加载失败，比拿不到错误详情还糟。CORS 的原理见<a href="/questions/http-cors/">《什么是跨域？CORS 为什么需要服务端配合？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么同一个错误被报了两次？</strong></p>
<blockquote>
<p>通常是 <code>onerror</code> 和 <code>addEventListener(&#x27;error&#x27;)</code> 都注册了，或者框架的错误处理和全局监听都上报了。可以按错误指纹去重。</p>
</blockquote>
<p><strong>压缩后的堆栈怎么看？</strong></p>
<blockquote>
<p>上报原始堆栈，在服务端用 Source Map 还原，详见<a href="/questions/monitoring-source-map/">《线上报错怎样用 Source Map 还原，又不把 map 文件公开？》</a>。</p>
</blockquote>
<p><strong>浏览器扩展注入的脚本报错怎么办？</strong></p>
<blockquote>
<p>按 <code>filename</code> 过滤掉不是本站来源的错误，避免它们触发噪声告警。</p>
</blockquote>`};export{e as default};