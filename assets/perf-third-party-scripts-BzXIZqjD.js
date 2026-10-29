var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>第三方脚本就是统计、广告、客服这类别人家提供的脚本。直接用 <code>&lt;script&gt;</code> 加载进来，它就以我们页面的身份运行，能读写 DOM、发请求、读不是 HttpOnly 的 Cookie，权限和我们自己的代码差不多。</p>
<p>所以风险有三方面。性能上，下载、解析、执行和它之后开的定时器都要占资源，<code>async</code> 和 <code>defer</code> 只是不阻塞 HTML 解析，执行时照样占主线程。安全上，供应商一旦被入侵，就等于我们的页面被注入了代码。隐私上，需要用户同意的分析、广告脚本，必须在同意以后才加载，不能先加载再停止上报。</p>
<p>接入时我会按价值分级：首屏必需的才同步加载或者 <code>defer</code>，其余的等页面加载完、用户交互或者空闲时再加载。权限上用 CSP 限制来源，不需要访问页面的内容放进跨源 iframe。</p>
<p>还要考虑故障。脚本加载失败或者抛错，不能影响核心功能，要有超时、错误隔离和能远程关掉的开关。</p>
</blockquote>
<h2>几种加载方式有什么区别</h2>
<p>先看不同写法对下载和执行时机的影响：</p>
<table><thead><tr><th>写法</th><th>下载</th><th>执行时机</th><th>顺序</th></tr></thead><tbody><tr><td><code>&lt;script&gt;</code></td><td>阻塞解析</td><td>下载完立即执行</td><td>按文档顺序</td></tr><tr><td><code>&lt;script async&gt;</code></td><td>并行</td><td>下载完立即执行</td><td>不保证</td></tr><tr><td><code>&lt;script defer&gt;</code></td><td>并行</td><td>文档解析完成后</td><td>按文档顺序</td></tr><tr><td>动态插入</td><td>并行</td><td>下载完执行</td><td>默认类似 async</td></tr></tbody></table>
<p>可以看到，<code>async</code> 和 <code>defer</code> 改变的只是下载时会不会卡住 HTML 解析。脚本最终还是要在主线程上执行，执行时该占多久还是占多久。所以对不急用的脚本，更有效的办法是推迟加载。</p>
<h2>怎样推迟到空闲时再加载</h2>
<p>下面的函数等页面 <code>load</code> 之后、浏览器空闲时，再插入客服组件的脚本：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面加载完成且浏览器空闲时再加载客服组件</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">loadWhenIdle</span>(<span class="hljs-params">src</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">load</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-keyword">const</span> script = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;script&#x27;</span>);
    script.<span class="hljs-property">src</span> = src;
    script.<span class="hljs-property">async</span> = <span class="hljs-literal">true</span>;
    script.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;客服组件加载失败，不影响主功能&#x27;</span>);
    <span class="hljs-variable language_">document</span>.<span class="hljs-property">head</span>.<span class="hljs-title function_">append</span>(script);
  };
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">schedule</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;requestIdleCallback&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>) <span class="hljs-title function_">requestIdleCallback</span>(load, { <span class="hljs-attr">timeout</span>: <span class="hljs-number">5000</span> });
    <span class="hljs-keyword">else</span> <span class="hljs-built_in">setTimeout</span>(load, <span class="hljs-number">2000</span>);
  };
  <span class="hljs-comment">// load 已经触发过时直接调度，否则永远等不到</span>
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">readyState</span> === <span class="hljs-string">&#x27;complete&#x27;</span>) <span class="hljs-title function_">schedule</span>();
  <span class="hljs-keyword">else</span> <span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;load&#x27;</span>, schedule, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
}
</code></pre></div>
<p>为什么要先判断 <code>document.readyState</code>？因为这个函数可能在 <code>load</code> 事件已经触发以后才被调用，这时再去监听 <code>load</code>，就永远等不到了。</p>
<p><code>requestIdleCallback</code> 的 <code>timeout</code> 是保底，浏览器一直不空闲时，最多等 5 秒也会执行。不支持它的浏览器退回到 <code>setTimeout</code>。</p>
<p>另一种常见做法叫“外观替身”：先放一个静态的客服按钮或者视频封面图，用户点击时才加载真正的脚本或 iframe。用户不点，就一点都不加载。</p>
<h2>怎样限制它的权限</h2>
<p>第一道防线是 CSP，用 <code>script-src</code> 只允许确定的来源加载脚本，见<a href="/questions/sec-csp/">《CSP 的 nonce、hash 与 Report-Only 如何使用？》</a>。</p>
<p>固定版本的文件可以用 SRI 校验内容，也就是在标签上写文件的哈希，内容被改了浏览器就拒绝执行。可是供应商脚本再动态加载的子资源，SRI 管不到。</p>
<p>不需要访问页面的组件，比如广告、外部表单，放进跨源 iframe，配合 <code>sandbox</code>，需要通信时用 <code>postMessage</code>。这样它就拿不到我们页面的 DOM 和 Cookie。</p>
<p>上报给第三方的数据也要用白名单字段，不传完整 URL、表单内容和令牌。</p>
<h2>怎样测量它的影响</h2>
<p>用 Performance 面板录一段，看第三方脚本带来的长任务；Long Animation Frames 的 <code>sourceURL</code> 可以按域名归因。</p>
<p>更直接的办法是对比开启和关闭某个脚本时的 LCP、INP。</p>
<p>还要测故障。用 DevTools 的请求屏蔽功能模拟供应商宕机，确认页面仍然能用。</p>
<h2>常见追问</h2>
<p><strong>用 <code>preconnect</code> 优化第三方加载值得吗？</strong></p>
<blockquote>
<p>只对首屏必需的第三方域名值得。提前建连接本身有成本，用不上的域名提前连了就是浪费。</p>
</blockquote>
<p><strong>脚本延迟加载以后，统计数据变少了，怎么办？</strong></p>
<blockquote>
<p>延迟加载会漏掉那些很早就离开的用户。这是数据完整性和首屏性能之间的取舍，要么接受，要么在服务端补充采集。</p>
</blockquote>`};export{e as default};