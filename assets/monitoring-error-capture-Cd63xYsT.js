var e={answerHtml:`<h2>简答</h2>
<ul>
<li>运行时脚本错误会以 <code>ErrorEvent</code> 派发到 <code>window</code>，可用 <code>window.onerror</code> 或 <code>addEventListener(&#x27;error&#x27;)</code> 捕获。</li>
<li>未处理的 Promise 拒绝不触发 <code>error</code>，而是触发 <code>unhandledrejection</code>，原因在 <code>event.reason</code> 中。</li>
<li><code>&lt;img&gt;</code>、<code>&lt;script&gt;</code>、<code>&lt;link&gt;</code> 加载失败的 <code>error</code> 事件派发在元素上且不冒泡，全局捕获必须在 <code>window</code> 上使用捕获阶段监听。</li>
<li>跨域脚本抛错时浏览器只给出 <code>Script error.</code>，行列号为 0、<code>error</code> 为 <code>null</code>；要拿到详情，脚本标签需加 <code>crossorigin</code>，服务端需返回 <code>Access-Control-Allow-Origin</code>。</li>
</ul>
<h2>运行时错误</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-property">onerror</span> = <span class="hljs-function">(<span class="hljs-params">message, source, lineno, colno, error</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;js&#x27;</span>, message, source, lineno, colno, <span class="hljs-attr">stack</span>: error?.<span class="hljs-property">stack</span> });
};
</code></pre></div>
<p><code>onerror</code> 是唯一接收多个参数的事件处理属性；<code>addEventListener(&#x27;error&#x27;, handler)</code> 则只收到一个 <code>ErrorEvent</code>，字段为 <code>message</code>、<code>filename</code>、<code>lineno</code>、<code>colno</code>、<code>error</code>。<code>onerror</code> 返回 <code>true</code> 会取消默认的控制台报错，但抛错的脚本依然中止。</p>
<p><code>try/catch</code> 包住的错误、框架自身的错误边界吞掉的错误不会到达全局事件，需要在框架层（如 React 错误边界、Vue 的 <code>app.config.errorHandler</code>）另行上报。</p>
<h2>Promise 拒绝</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;unhandledrejection&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-title function_">report</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;promise&#x27;</span>, <span class="hljs-attr">reason</span>: <span class="hljs-title class_">String</span>(event.<span class="hljs-property">reason</span>), <span class="hljs-attr">stack</span>: event.<span class="hljs-property">reason</span>?.<span class="hljs-property">stack</span> });
});
</code></pre></div>
<p>事件类型是 <code>PromiseRejectionEvent</code>，含 <code>promise</code> 和 <code>reason</code>。拒绝之后才挂上处理函数时会触发 <code>rejectionhandled</code>，可用于修正&quot;未处理&quot;的统计。调用 <code>preventDefault()</code> 只是取消控制台的默认输出。来自跨域脚本的拒绝不会触发该事件。</p>
<p><code>reason</code> 不一定是 <code>Error</code>，可能是字符串或普通对象，上报前要做类型判断。</p>
<h2>资源加载失败</h2>
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
<p>资源错误是普通 <code>Event</code>，拿不到 HTTP 状态码。需要状态码或耗时时，可结合 Resource Timing 数据分析。<code>fetch</code> 失败不属于资源错误，它表现为 Promise 拒绝，应在请求封装层统一处理。</p>
<h2>跨域 Script error.</h2>
<p>脚本放在 CDN 等其他源时，浏览器为避免跨源信息泄露会屏蔽错误详情。解决需要双方配合：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://cdn.example.com/app.js&quot;</span> <span class="hljs-attr">crossorigin</span>=<span class="hljs-string">&quot;anonymous&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>CDN 响应头返回 <code>Access-Control-Allow-Origin: https://www.example.com</code>（或 <code>*</code>，但不能与 <code>use-credentials</code> 同用）。只加属性而服务端不返回该响应头时，脚本会整体加载失败，比拿不到详情更糟。CORS 的原理见<a href="/questions/http-cors/">《什么是跨域？CORS 为什么需要服务端配合？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>为什么同一个错误被报了两次？<code>onerror</code> 和 <code>addEventListener(&#x27;error&#x27;)</code> 同时注册，或框架错误处理与全局监听都上报了；按错误指纹去重。</li>
<li>压缩后的堆栈怎么看？上报原始堆栈，在服务端用 Source Map 还原，见<a href="/questions/monitoring-source-map/">《线上报错怎样用 Source Map 还原，又不把 map 文件公开？》</a>。</li>
<li>浏览器扩展注入的脚本报错怎么办？按 <code>filename</code> 过滤非本站来源，避免噪声告警。</li>
</ul>`};export{e as default};