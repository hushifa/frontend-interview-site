var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>想在页面里用 <code>SharedArrayBuffer</code>，先得让 <code>crossOriginIsolated</code> 变成 <code>true</code>，也就是让页面处于“跨源隔离”状态。条件是文档响应同时带两个头：<code>Cross-Origin-Opener-Policy: same-origin</code>，和 <code>Cross-Origin-Embedder-Policy: require-corp</code> 或 <code>credentialless</code>。另外 Permissions-Policy 不能禁用 <code>cross-origin-isolated</code>，而且这两个头只在 HTTPS 或 localhost 下生效。</p>
<p>为什么要这么麻烦？因为共享内存能做出很精确的计时器，配合 Spectre 这类侧信道攻击，能读到同一进程里的其他数据。隔离就是保证进程里没有别的源的敏感数据。</p>
<p>满足条件后，除了 <code>SharedArrayBuffer</code>，还能用 <code>performance.measureUserAgentSpecificMemory()</code>，<code>performance.now()</code> 的精度也会更高。</p>
<p>落地时要注意副作用：COOP 会切断和跨源弹窗的联系，第三方登录、支付弹窗可能失效；COEP 会挡住没有授权的第三方资源。</p>
</blockquote>
<h2>两个头各管什么</h2>
<p>COOP 管的是窗口关系。设成 <code>same-origin</code> 以后，本页和跨源窗口不会再放在同一个浏览上下文组里。通俗点说，本页用 <code>window.open</code> 打开一个跨源页面，或者被跨源页面打开，对方拿到的 <code>window.opener</code> 都是 <code>null</code>。攻击页面拿不到本页的窗口引用，就没法和本页共享进程。</p>
<p>COEP 管的是页面能嵌入哪些跨源资源。它有两个可选值。<code>require-corp</code> 比较严：跨源资源要么带 <code>Cross-Origin-Resource-Policy: cross-origin</code> 头，要么通过 CORS 加载（标签上加 <code>crossorigin</code>），否则就被挡住。<code>credentialless</code> 宽松一些：跨源的 no-cors 请求不带 Cookie 等凭据，资源不需要额外的头。第三方资源不归你管的时候，<code>credentialless</code> 更容易落地。</p>
<h2>配置好以后怎么用</h2>
<p>响应头这样写：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
</code></pre></div>
<p>代码里先检查再用，不满足就退回普通的 <code>ArrayBuffer</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (crossOriginIsolated) {
  <span class="hljs-keyword">const</span> shared = <span class="hljs-keyword">new</span> <span class="hljs-title class_">SharedArrayBuffer</span>(<span class="hljs-number">1024</span>);
  worker.<span class="hljs-title function_">postMessage</span>(shared);
} <span class="hljs-keyword">else</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;页面未处于跨源隔离状态，回退到普通 ArrayBuffer&#x27;</span>);
}
</code></pre></div>
<p>为什么要检查？因为头配错一个、或者被 Permissions-Policy 禁用，<code>crossOriginIsolated</code> 就是 <code>false</code>。即使两个头都正确，<code>cross-origin-isolated</code> 被禁用时结果仍然是 <code>false</code>。</p>
<h2>上线时会碰到哪些问题</h2>
<p>最常见的是第三方登录和支付弹窗。它们靠 <code>window.opener</code> 把结果传回来，COOP <code>same-origin</code> 一开，这条路就断了。办法是把登录放在不需要隔离的页面上，或者改用重定向流程。</p>
<p>第二个是第三方图片、脚本、iframe 被挡。<code>require-corp</code> 下，没有 CORP 头的资源都加载不了。可以改用 <code>credentialless</code>，或者给资源加 <code>crossorigin</code>，让对方返回 CORS 头。嵌入的跨源 iframe 本身也要满足 COEP 的要求。</p>
<p>为了不在上线时才发现问题，可以先发 <code>Cross-Origin-Embedder-Policy-Report-Only</code>，它只报告会被挡住的资源，不真的挡。</p>
<h2>常见追问</h2>
<p><strong>为什么要跨源隔离才能用 SharedArrayBuffer？</strong></p>
<blockquote>
<p>共享内存可以做出高精度计时器，配合 Spectre 类侧信道攻击，能读到同一进程里的其他数据。跨源隔离保证进程里没有别的源的敏感数据，浏览器才敢开放这个能力。</p>
</blockquote>
<p><strong>两个头都配对了，crossOriginIsolated 还是 false，可能是什么原因？</strong></p>
<blockquote>
<p>先看是不是 HTTPS 或 localhost，这两个头只在安全上下文里生效。再看 Permissions-Policy 有没有禁用 <code>cross-origin-isolated</code>，被禁用时结果也是 <code>false</code>。</p>
</blockquote>`};export{e as default};