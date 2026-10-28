var e={answerHtml:`<h2>简答</h2>
<ul>
<li>性能：下载、解析、执行和之后的定时器都占资源，<code>async</code> 和 <code>defer</code> 只避免阻塞 HTML 解析，执行时仍占主线程。</li>
<li>安全：以页面源身份执行的脚本权限与自己的代码相近，供应商被入侵就等于页面被注入。</li>
<li>隐私：需要用户同意的分析、广告脚本，必须在同意后才加载，不能先加载再停止上报。</li>
<li>时机：按价值分级，首屏必需的才同步或 <code>defer</code>，其余在页面加载完成、用户交互或空闲时加载。</li>
<li>故障：脚本加载失败或抛错不能影响核心功能，要有超时、错误隔离和可远程关闭的开关。</li>
</ul>
<h2>加载方式</h2>
<table><thead><tr><th>写法</th><th>下载</th><th>执行时机</th><th>顺序</th></tr></thead><tbody><tr><td><code>&lt;script&gt;</code></td><td>阻塞解析</td><td>下载完立即执行</td><td>按文档顺序</td></tr><tr><td><code>&lt;script async&gt;</code></td><td>并行</td><td>下载完立即执行</td><td>不保证</td></tr><tr><td><code>&lt;script defer&gt;</code></td><td>并行</td><td>文档解析完成后</td><td>按文档顺序</td></tr><tr><td>动态插入</td><td>并行</td><td>下载完执行</td><td>默认类似 async</td></tr></tbody></table>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面加载完成且浏览器空闲时再加载客服组件</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">loadWhenIdle</span>(<span class="hljs-params">src</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">load</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-keyword">const</span> script = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;script&#x27;</span>);
    script.<span class="hljs-property">src</span> = src;
    script.<span class="hljs-property">async</span> = <span class="hljs-literal">true</span>;
    script.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;客服组件加载失败，不影响主功能&#x27;</span>);
    <span class="hljs-variable language_">document</span>.<span class="hljs-property">head</span>.<span class="hljs-title function_">append</span>(script);
  };
  <span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;load&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;requestIdleCallback&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>) <span class="hljs-title function_">requestIdleCallback</span>(load, { <span class="hljs-attr">timeout</span>: <span class="hljs-number">5000</span> });
    <span class="hljs-keyword">else</span> <span class="hljs-built_in">setTimeout</span>(load, <span class="hljs-number">2000</span>);
  }, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
}
</code></pre></div>
<p>也可以用&quot;外观替身&quot;：先显示一个静态的客服按钮或视频封面，用户点击时才加载真正的脚本或 iframe。</p>
<h2>限制权限</h2>
<ul>
<li>CSP 的 <code>script-src</code> 只允许确定的来源，见《CSP 的 nonce、hash 与 Report-Only 如何使用？》。</li>
<li>固定版本的文件用 SRI 校验内容；供应商动态加载的子资源无法被 SRI 覆盖。</li>
<li>不需要访问页面的组件（广告、外部表单）放进跨源 iframe，配合 <code>sandbox</code> 和 <code>postMessage</code> 通信。</li>
<li>上报给第三方的数据用白名单字段，不传完整 URL、表单内容和令牌。</li>
</ul>
<h2>测量</h2>
<ul>
<li>Performance 面板录制，查看第三方脚本带来的长任务；Long Animation Frames 的 <code>sourceURL</code> 可以按域名归因。</li>
<li>对比开启和关闭某个脚本时的 LCP、INP。</li>
<li>用 DevTools 的请求屏蔽功能模拟供应商宕机，确认页面仍可用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>用 <code>preconnect</code> 优化第三方加载值得吗？只对首屏必需的第三方域名值得，其余会浪费连接。</li>
<li>为什么脚本延迟后统计数据少了？延迟加载会漏掉早期离开的用户，要在数据完整性和首屏性能之间权衡，或在服务端补充采集。</li>
</ul>`};export{e as default};