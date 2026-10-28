var e={answerHtml:`<h2>简答</h2>
<ul>
<li>响应头 <code>Permissions-Policy: camera=(self &quot;https://meet.example&quot;), geolocation=()</code> 声明允许列表，<code>()</code> 表示所有文档都禁止。</li>
<li>跨源 iframe 默认没有大多数强能力，需要嵌入方在 <code>&lt;iframe allow=&quot;camera&quot;&gt;</code> 中委托，同时顶层策略也要允许该来源。</li>
<li>策略只是门槛，之后浏览器仍会要求安全上下文和用户授权（权限弹窗）。</li>
<li>用途：禁用页面不需要的能力，限制第三方 iframe（广告、统计）的权限，减少被滥用的面。</li>
<li>被策略禁用时，相关 API 会直接失败或拒绝，通常不会弹出权限提示。</li>
</ul>
<h2>写法</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Permissions-Policy: camera=(self &quot;https://meet.example&quot;), microphone=(self &quot;https://meet.example&quot;), geolocation=(), payment=()
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 会议组件：委托摄像头和麦克风 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://meet.example/room/42&quot;</span> <span class="hljs-attr">allow</span>=<span class="hljs-string">&quot;camera; microphone&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 广告：不委托任何能力 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://ads.example/slot&quot;</span> <span class="hljs-attr">sandbox</span>=<span class="hljs-string">&quot;allow-scripts&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>
</code></pre></div>
<table><thead><tr><th>写法</th><th>含义</th></tr></thead><tbody><tr><td><code>feature=*</code></td><td>所有来源都可以</td></tr><tr><td><code>feature=(self)</code></td><td>只有本页面的源</td></tr><tr><td><code>feature=(self &quot;https://a.example&quot;)</code></td><td>本源和指定来源</td></tr><tr><td><code>feature=()</code></td><td>全部禁用</td></tr></tbody></table>
<h2>检查与排查</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 当前文档是否被策略允许使用某项能力（部分浏览器提供）</span>
<span class="hljs-variable language_">document</span>.<span class="hljs-property">featurePolicy</span>?.<span class="hljs-title function_">allowsFeature</span>(<span class="hljs-string">&#x27;camera&#x27;</span>);

<span class="hljs-comment">// 用户授权状态</span>
<span class="hljs-keyword">const</span> status = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">permissions</span>.<span class="hljs-title function_">query</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;geolocation&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(status.<span class="hljs-property">state</span>); <span class="hljs-comment">// granted / denied / prompt</span>
</code></pre></div>
<p><code>document.featurePolicy</code> 是旧名称的接口，并非所有浏览器都提供，不要用它做唯一判断。</p>
<p>摄像头打不开时依次检查：</p>
<ol>
<li>页面是否是 HTTPS。</li>
<li>最终响应是否带了预期的 <code>Permissions-Policy</code>（CDN 或代理可能覆盖）。</li>
<li>iframe 的 <code>allow</code> 属性是否包含该能力。</li>
<li>用户是否拒绝过授权，或系统层面禁用了设备。</li>
</ol>
<h2>与其他机制的区别</h2>
<ul>
<li><code>sandbox</code> 控制脚本、表单、导航等通用能力；Permissions Policy 控制具体的设备与浏览器功能，两者常一起用。</li>
<li>CSP 控制资源加载和脚本执行，不管设备能力。</li>
<li>旧的 <code>Feature-Policy</code> 头已被 <code>Permissions-Policy</code> 取代，语法不同。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>能用它强制授予权限吗？不能，它只能限制或委托，最终是否授权由用户决定。</li>
<li>跨源隔离也用它吗？某些能力（如高精度计时、<code>SharedArrayBuffer</code>）还依赖 COOP 和 COEP，不是只靠 Permissions Policy。</li>
</ul>`};export{e as default};