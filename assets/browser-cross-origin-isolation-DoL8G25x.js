var e={answerHtml:`<h2>简答</h2>
<ul>
<li>crossOriginIsolated 为 true 需要安全上下文，并同时配置 COOP: same-origin 与 COEP（require-corp 或 credentialless）。</li>
<li>COOP 管顶层窗口之间的关系，COEP 管页面能嵌入哪些跨源资源。</li>
<li>credentialless 让跨源无凭据请求不必声明 CORP，require-corp 则要求资源通过 CORP 或 CORS 授权。</li>
<li>Permissions-Policy 可以禁用相关能力；代码应按 crossOriginIsolated 的实际值决定是否使用共享内存。</li>
</ul>
<p>某些能力允许不同执行上下文共享内存，或提供更精细的时间与资源信息，这也可能扩大侧信道攻击风险。浏览器因此要求页面建立更严格的跨源隔离关系，才向它开放相应能力。</p>
<p><code>window.crossOriginIsolated</code> 是浏览器根据环境计算出的结果，不是设置一个同名变量就能开启的功能开关。它也不表示这个网站没有 XSS 或业务权限问题。</p>
<h2>常见顶层页面需要什么配置</h2>
<p>在安全上下文中，常见组合是在文档的 HTTP 响应上设置：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
</code></pre></div>
<p>支持时，也可以把第二项配置为：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cross-Origin-Embedder-Policy: credentialless
</code></pre></div>
<p>COOP 和 COEP 各自处理不同关系，二者不是互相替代的头。<code>Permissions-Policy</code> 可以禁用该能力：例如配置 <code>cross-origin-isolated=()</code> 后，即使 COOP/COEP 正确，<code>crossOriginIsolated</code> 仍为 false。</p>
<p>正式网站通常使用 HTTPS。localhost 等环境可能作为可信开发上下文，不能因为本地 HTTP 测试可用，就推广到任意公网 HTTP 页面。若页面嵌在 iframe 中，还要核对父子嵌入政策与权限委派，不能只检查 iframe 自己的两个头。</p>
<h2>COOP 管窗口关系，COEP 管嵌入资源</h2>
<p>COOP 影响顶层文档与其他窗口的浏览上下文组关系。<code>same-origin</code> 收紧可保持联系的窗口范围，与不兼容的跨源 opener 或弹窗之间的关系可能被切断。</p>
<p>这也是为什么启用隔离后，OAuth 登录弹窗、支付回调或依赖 <code>window.opener</code> 的老流程可能失效。问题不一定是接口 CORS 错了，而可能是窗口关系已经改变。需要检查完整的打开、跳转和回调过程。</p>
<p>COEP 则约束文档如何嵌入其他源的内容。它并不是给你的页面开放跨域权限，而是要求页面接受更严格的资源加载规则，降低把未经允许的跨源内容放入同一处理环境的风险。</p>
<h2>require-corp 不等于所有资源都必须写 CORP</h2>
<p>在 <code>require-corp</code> 下，同源资源通常可以按相应规则加载。跨源资源要区分请求模式：</p>
<ul>
<li>对 <code>no-cors</code> 模式的跨源请求，资源的 CORP 策略需要明确允许相应嵌入，例如符合条件的 <code>Cross-Origin-Resource-Policy: cross-origin</code>。</li>
<li>对 CORS 模式的请求，可以通过有效的 CORS 授权满足相关要求，不必机械地再给所有响应加同一份 CORP。</li>
</ul>
<p>例如普通跨源图片原先可以显示，启用 require-corp 后可能被阻止；可以让资源服务端返回合适 CORP，或者按需求用 crossorigin 发起 CORS 请求，并让服务端正确返回 CORS 许可。</p>
<p>但 <code>CORP: cross-origin</code> 本身不会让 JavaScript 随意读取响应，也不会自动让绘制后的跨源图片像素可读。嵌入许可与脚本读取许可仍是不同机制。</p>
<h2>credentialless 改变了哪一部分</h2>
<p>credentialless 允许某些 <code>no-cors</code> 跨源资源在没有显式 CORP 许可时加载，但这些跨源 no-cors 请求不携带相应凭据，响应中的 Cookie 设置也会被忽略。</p>
<p>因此它可能让公开图片等资源更容易接入隔离页面，却会改变依赖登录 Cookie 的资源行为。不能认为“换成 credentialless，所有第三方资源都无需改动且功能完全一样”。</p>
<p>其他请求模式仍有自己的要求。使用 CORS 模式请求时，服务器依然需要允许它；credentialless 不会绕过 CORS，也不会把所有 fetch 都自动变成匿名且可读的请求。</p>
<p>选择哪种 COEP，需要先清点真实资源和凭据依赖，而不是单纯看哪个配置能让控制台少报几条错。</p>
<h2>代码中按实际能力决定行为</h2>
<p>下面创建一个用于共享计数的 Int32Array。它明确要求隔离环境，不把普通 ArrayBuffer 伪装成同等的共享实现：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createSharedCounter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!globalThis.<span class="hljs-property">crossOriginIsolated</span> || <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">SharedArrayBuffer</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前环境不支持所需的共享内存能力&#x27;</span>);
  }

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Int32Array</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">SharedArrayBuffer</span>(<span class="hljs-title class_">Int32Array</span>.<span class="hljs-property">BYTES_PER_ELEMENT</span>));
}
</code></pre></div>
<p>这个视图可以通过适用的消息接口交给 Worker，双方访问同一个共享缓冲区。SharedArrayBuffer 不放进普通 transfer 列表；协调并发读写时还要使用 Atomics 等正确同步方式。</p>
<p>隔离成功不代表 <code>counter[0] += 1</code> 就自动变成跨线程原子操作，也不保证所有依赖隔离的实验性接口都已被该浏览器实现。应同时检查所需 API 的具体支持。</p>
<p>不满足条件时，可以选择普通 Worker 消息、复制或转移 ArrayBuffer 等方案，但它们具有不同的数据所有权和同步语义。降级通常需要调整算法或通信方式，不能只替换构造函数名称。</p>
<h2>响应头必须来自实际部署链路</h2>
<p>这些政策需要在合适的 HTTP 响应中生效，不能靠页面脚本或普通 meta 标签补成完整的 COOP/COEP 隔离。只配置 Report-Only 也不等于实际开启隔离。</p>
<p>CDN、反向代理和静态托管平台是否允许配置响应头，是落地前提；本地开发服务器有这些头，不代表上线后的 HTML 也有。重定向、缓存旧响应或错误页还可能走不同配置，应检查浏览器真正收到的最终文档响应。</p>
<p>可以先观察 <code>isSecureContext</code> 与 <code>crossOriginIsolated</code>，再核对响应头、权限策略及控制台中的资源拦截原因。一个标志为 false 时，不应不断尝试创建共享内存来“碰运气”。</p>
<p>上线前还需要检查模块脚本、图片、字体、iframe、Worker 和跨源弹窗的完整流程。跨源隔离是部署与资源生态共同满足的条件，不只是前端多写两行代码。</p>`};export{e as default};