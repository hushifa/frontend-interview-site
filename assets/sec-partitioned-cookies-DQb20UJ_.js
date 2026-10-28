var e={answerHtml:`<h2>简答</h2>
<ul>
<li>第三方上下文：<code>shop.example</code> 嵌入了 <code>pay.widget</code> 的 iframe，<code>pay.widget</code> 的 Cookie 就是第三方 Cookie。</li>
<li><code>SameSite=None; Secure</code> 是在第三方上下文中发送 Cookie 的前提，但浏览器的隐私策略可能仍然阻止。</li>
<li>浏览器现状：Chrome 默认允许，用户可以屏蔽；Firefox 默认把第三方 Cookie 按顶层站点分区；Safari 默认阻止。</li>
<li><code>Partitioned</code> 属性让 Cookie 按&quot;顶层站点&quot;分区：<code>pay.widget</code> 嵌在 <code>shop.example</code> 和嵌在 <code>blog.example</code> 里时是两份互不相通的 Cookie。</li>
<li>需要跨站共享登录态时，用 Storage Access API 请求授权，或用 FedCM 做联合登录。</li>
</ul>
<h2>分区 Cookie 写法</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-widget=abc; Secure; Path=/; SameSite=None; Partitioned
</code></pre></div>
<ul>
<li>必须有 <code>Secure</code>。</li>
<li>推荐 <code>__Host-</code> 前缀，把 Cookie 绑定到主机名。</li>
<li>分区键是顶层站点（scheme 加可注册域名）。同一个组件在不同网站里得到不同的 Cookie 罐，无法跨站追踪，同一顶层站点内的多次访问可以保持状态。</li>
</ul>
<h2>适合与不适合</h2>
<table><thead><tr><th>场景</th><th>方案</th></tr></thead><tbody><tr><td>嵌入式客服、地图、评论，每个网站各自维护会话</td><td><code>Partitioned</code></td></tr><tr><td>嵌入的支付页需要用户在支付平台的已有登录态</td><td>Storage Access API</td></tr><tr><td>第三方账号登录</td><td>FedCM 或顶层跳转登录</td></tr><tr><td>跨站追踪用户</td><td>浏览器正在逐步限制，不要依赖</td></tr></tbody></table>
<h2>Storage Access API</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 在嵌入的 iframe 内，由用户手势触发</span>
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-keyword">await</span> <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">hasStorageAccess</span>())) {
    <span class="hljs-keyword">await</span> <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">requestStorageAccess</span>();
  }
  <span class="hljs-comment">// 获得授权后，请求会带上非分区的第三方 Cookie</span>
});
</code></pre></div>
<p>浏览器可能弹出提示或根据用户与该站点的交互历史自动决定，调用失败时要有降级方案，例如打开顶层窗口完成操作。</p>
<h2>迁移检查</h2>
<ol>
<li>找出所有设置了 <code>SameSite=None</code> 的 Cookie，它们就是依赖第三方上下文的部分。</li>
<li>在屏蔽第三方 Cookie 的浏览器设置下测试嵌入功能。</li>
<li>按场景选择 <code>Partitioned</code>、Storage Access API、FedCM，或改为顶层页面完成操作。</li>
<li>Cookie 缺失时给出可用的降级体验，而不是静默失败。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>分区 Cookie 和 SameSite 能一起用吗？能，分区 Cookie 通常就设 <code>SameSite=None</code>，因为它就是给第三方上下文用的。</li>
<li>Chrome 会不会再默认屏蔽第三方 Cookie？目前 Chrome 默认允许，只在无痕模式或用户设置时屏蔽。不要依赖这一点：其他浏览器已默认限制，用户也可以随时关闭。</li>
</ul>`};export{e as default};