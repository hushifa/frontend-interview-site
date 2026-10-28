var e={answerHtml:`<h2>简答</h2>
<ul>
<li>文档响应头要有 <code>Cross-Origin-Opener-Policy: same-origin</code>。</li>
<li>同时要有 <code>Cross-Origin-Embedder-Policy: require-corp</code> 或 <code>credentialless</code>。</li>
<li>Permissions-Policy 没有禁用 <code>cross-origin-isolated</code>。COOP 和 COEP 头只在安全上下文（HTTPS 或 localhost）下生效。</li>
<li>满足后可以使用 <code>SharedArrayBuffer</code>、<code>performance.measureUserAgentSpecificMemory()</code>，<code>performance.now()</code> 的精度也更高。</li>
</ul>
<h2>两个头各管什么</h2>
<p><strong>COOP（Cross-Origin-Opener-Policy）</strong>：<code>same-origin</code> 让本页和跨源窗口不在同一个浏览上下文组里。跨源的 <code>window.open</code> 打开者或被打开者拿到的 <code>window.opener</code> 为 <code>null</code>，攻击页面就无法通过窗口引用和本页共享进程。</p>
<p><strong>COEP（Cross-Origin-Embedder-Policy）</strong>：限制页面能加载哪些跨源子资源。</p>
<ul>
<li><code>require-corp</code>：跨源资源必须带 <code>Cross-Origin-Resource-Policy: cross-origin</code>，或通过 CORS 加载（<code>crossorigin</code> 属性），否则被阻止。</li>
<li><code>credentialless</code>：跨源的 no-cors 请求不带 Cookie 等凭据，资源不需要额外的头。第三方资源不受控时更容易落地。</li>
</ul>
<h2>配置示例</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (crossOriginIsolated) {
  <span class="hljs-keyword">const</span> shared = <span class="hljs-keyword">new</span> <span class="hljs-title class_">SharedArrayBuffer</span>(<span class="hljs-number">1024</span>);
  worker.<span class="hljs-title function_">postMessage</span>(shared);
} <span class="hljs-keyword">else</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;页面未处于跨源隔离状态，回退到普通 ArrayBuffer&#x27;</span>);
}
</code></pre></div>
<h2>落地时的问题</h2>
<ul>
<li><strong>第三方登录弹窗和支付弹窗</strong>：COOP <code>same-origin</code> 会切断与跨源弹窗的 <code>window.opener</code> 通信。可以把登录页放在不需要隔离的页面上，或者改用重定向流程。</li>
<li><strong>第三方图片、脚本、iframe</strong>：<code>require-corp</code> 下没有 CORP 头的资源会被阻止，可以改用 <code>credentialless</code>，或给资源加 <code>crossorigin</code> 并由对方返回 CORS 头。</li>
<li><strong>iframe 嵌入</strong>：被嵌入的跨源 iframe 本身也要满足 COEP 的要求。</li>
<li><strong>上线前</strong>：先用 <code>Cross-Origin-Embedder-Policy-Report-Only</code> 收集会被阻止的资源。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么需要隔离才能用 SharedArrayBuffer：共享内存能做出高精度计时器，配合 Spectre 类侧信道读取同进程数据，隔离保证进程里没有跨源的敏感数据。</li>
<li>Permissions-Policy 可以禁用这项能力：即使两个头都正确，<code>cross-origin-isolated</code> 被禁用时结果仍是 <code>false</code>。</li>
</ul>`};export{e as default};