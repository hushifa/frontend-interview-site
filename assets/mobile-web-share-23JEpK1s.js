var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Web Share API 把标题、文字、链接或文件交给系统分享面板，由用户选择目标。</li>
<li>页面不能指定分享对象，Promise 成功也不代表对方已收到。</li>
<li>需要安全上下文和临时用户激活，应在点击时直接调用。</li>
<li>能力检测后仍要处理错误，并提供复制链接等备用方案。</li>
</ul>
<p>Web Share API 让网页把标题、文字、链接或支持的文件交给系统分享面板，由用户选择目标应用。它不要求网页为每个社交平台维护一套跳转地址，但可用性仍取决于浏览器、系统与分享数据类型。</p>
<p>页面不能指定用户必须分享到哪个联系人，也不能把分享 Promise 成功当作“对方已经收到并阅读”。不同平台完成 Promise 的时机也可能不同。</p>
<h2>从用户点击直接触发</h2>
<p>navigator.share 通常要求安全上下文、临时用户激活，并受 web-share Permissions Policy 等条件限制。页面加载后自动调用，或先等待一个很慢的请求再调用，都可能因缺少有效激活而失败。</p>
<p>因此最好先准备好分享数据，用户点击后直接调用。文件生成较慢时，可先完成生成，再提供一个明确的“分享文件”按钮，而不是假设用户激活能无限保留。</p>
<h2>能力检测之后仍需处理错误</h2>
<p>下面约定 title 和 url 已由应用准备，url 是适合公开分享的地址；showFallback 用来展示可复制链接等界面，不自动执行剪贴板操作：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindShareButton</span>(<span class="hljs-params">button, { title, url, showFallback }</span>) {
  <span class="hljs-keyword">let</span> sharing = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">if</span> (sharing) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> data = { title, url };
    <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-property">share</span> || (navigator.<span class="hljs-property">canShare</span> &amp;&amp; !navigator.<span class="hljs-title function_">canShare</span>(data))) {
      <span class="hljs-title function_">showFallback</span>(url);
      <span class="hljs-keyword">return</span>;
    }

    sharing = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">await</span> navigator.<span class="hljs-title function_">share</span>(data);
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (error?.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-title function_">showFallback</span>(url);
    } <span class="hljs-keyword">finally</span> {
      sharing = <span class="hljs-literal">false</span>;
    }
  }, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}
</code></pre></div>
<p>sharing 防止系统面板未结束时重复发起。AbortError 可能表示用户取消，也可能没有可用目标，不能简单当作严重错误并不断弹窗重试。</p>
<p>移除监听只阻止之后的点击处理，不保证取消已经打开的系统面板。若组件在分享期间卸载，回调还可能继续完成，真实应用应避免对已销毁界面执行更新。</p>
<h2>复制链接也是有条件的能力</h2>
<p>navigator.clipboard.writeText 也可能要求安全上下文和相应授权。分享失败后再异步自动复制，原来的用户激活可能已经失效，而且用户取消分享不一定代表希望复制。</p>
<p>更稳妥的降级是展示链接和明确的“复制”按钮，让用户重新触发；复制失败时仍提供可选中的文本。二维码适合跨设备使用，但也应保证链接可见并有适当替代说明。</p>
<h2>文件分享要检查实际文件集合</h2>
<p>有 navigator.share 不代表支持 files。分享文件前可使用 <code>navigator.canShare({ files })</code> 检查当前集合，文件类型和大小仍可能受平台或目标应用限制。</p>
<p>canShare 返回 true 只表示数据在当前实现下可被接受，不保证用户最终选到目标，也不保证传输成功。无论检测结果如何，share 的拒绝都要处理。文件名、MIME 类型和内容应与实际文件一致，不要仅改后缀期待支持。</p>
<h2>分享地址需要独立审核</h2>
<p>location.href 可能包含一次性令牌、内部筛选状态或私人标识，不应不加判断地分享出去。通常由应用生成公开的规范链接，并确保接收者有权限看到相应内容。</p>
<p>分享出去的链接也应能独立打开，而不是依赖当前页面内存中的临时状态。若内容本身需要授权，应让接收者走正常认证流程，而不是把当前用户凭证附在 URL 中。</p>
<p>验收应覆盖支持和不支持的浏览器、取消、无目标、文件不支持、重复点击以及从目标应用返回。测试替身能验证分支和回调，但系统面板、分享目标与最终交接体验仍需要真实设备检查。</p>`};export{e as default};