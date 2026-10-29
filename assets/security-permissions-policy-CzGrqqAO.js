var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面里嵌了广告、统计、视频会议各种第三方 iframe，你不希望广告能调摄像头。Permissions Policy 就是用响应头声明：哪些来源有资格用哪些能力。比如 <code>Permissions-Policy: camera=(self &quot;https://meet.example&quot;), geolocation=()</code>，摄像头只给本站和会议组件，定位谁都不给，<code>()</code> 表示所有文档都禁止。</p>
<p>跨源 iframe 默认没有大多数强能力，要两边都同意才行。顶层页面的策略要允许这个来源，嵌入时还要在 <code>&lt;iframe allow=&quot;camera&quot;&gt;</code> 里把能力委托给它。</p>
<p>它的用途是关掉页面用不到的能力，限制第三方 iframe 的权限，减少被滥用的可能。被策略禁用时，相关的 API 会直接失败或拒绝，通常不会弹权限提示。</p>
<p>要注意，策略只是一道门槛，过了门槛浏览器还会要求安全上下文，并弹窗让用户授权。它只能限制或委托，不能替用户授予权限。</p>
</blockquote>
<h2>怎么写</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Permissions-Policy: camera=(self &quot;https://meet.example&quot;), microphone=(self &quot;https://meet.example&quot;), geolocation=(), payment=()
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 会议组件：委托摄像头和麦克风 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://meet.example/room/42&quot;</span> <span class="hljs-attr">allow</span>=<span class="hljs-string">&quot;camera; microphone&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 广告：不委托任何能力 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://ads.example/slot&quot;</span> <span class="hljs-attr">sandbox</span>=<span class="hljs-string">&quot;allow-scripts&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>
</code></pre></div>
<p>会议组件能用摄像头，是因为响应头允许了 <code>https://meet.example</code>，同时 iframe 的 <code>allow</code> 里写了 <code>camera</code>，两个条件都满足。广告 iframe 两个条件都不满足，所以调摄像头会直接失败。</p>
<p>允许列表的几种写法：</p>
<table><thead><tr><th>写法</th><th>含义</th></tr></thead><tbody><tr><td><code>feature=*</code></td><td>所有来源都可以</td></tr><tr><td><code>feature=(self)</code></td><td>只有本页面的源</td></tr><tr><td><code>feature=(self &quot;https://a.example&quot;)</code></td><td>本源和指定来源</td></tr><tr><td><code>feature=()</code></td><td>全部禁用</td></tr></tbody></table>
<h2>怎么检查和排查</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 当前文档是否被策略允许使用某项能力（部分浏览器提供）</span>
<span class="hljs-variable language_">document</span>.<span class="hljs-property">featurePolicy</span>?.<span class="hljs-title function_">allowsFeature</span>(<span class="hljs-string">&#x27;camera&#x27;</span>);

<span class="hljs-comment">// 用户授权状态</span>
<span class="hljs-keyword">const</span> status = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">permissions</span>.<span class="hljs-title function_">query</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;geolocation&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(status.<span class="hljs-property">state</span>); <span class="hljs-comment">// granted / denied / prompt</span>
</code></pre></div>
<p>这两行查的是两件不同的事。第一行问“策略允不允许”，第二行问“用户同没同意”。<code>document.featurePolicy</code> 是旧名字下的接口，不是所有浏览器都有，不要拿它当唯一的判断依据。</p>
<p>摄像头打不开时，按顺序检查：</p>
<ol>
<li>页面是否是 HTTPS。</li>
<li>最终响应是否带了预期的 <code>Permissions-Policy</code>（CDN 或代理可能覆盖）。</li>
<li>iframe 的 <code>allow</code> 属性是否包含该能力。</li>
<li>用户是否拒绝过授权，或系统层面禁用了设备。</li>
</ol>
<h2>和其他机制有什么区别</h2>
<p><code>sandbox</code> 控制的是脚本、表单、导航这些通用能力，Permissions Policy 控制的是摄像头、定位这类具体的设备和浏览器功能，两者经常一起用，就像上面的广告 iframe。CSP 管资源加载和脚本执行，不管设备能力。旧的 <code>Feature-Policy</code> 头已经被 <code>Permissions-Policy</code> 取代了，两者语法不同，不能直接照抄。</p>
<h2>常见追问</h2>
<p><strong>能用它强制给页面授予权限吗？</strong></p>
<blockquote>
<p>不能。它只能限制或者委托，最终给不给权限由用户决定。</p>
</blockquote>
<p><strong>跨源隔离也是靠它吗？</strong></p>
<blockquote>
<p>不全是。像高精度计时、<code>SharedArrayBuffer</code> 这些能力还依赖 COOP 和 COEP，不是只靠 Permissions Policy 就能打开。</p>
</blockquote>`};export{e as default};