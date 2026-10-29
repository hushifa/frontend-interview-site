var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如 <code>shop.example</code> 的页面里嵌了一个 <code>pay.widget</code> 的 iframe，对用户来说当前网站是 <code>shop.example</code>，所以 <code>pay.widget</code> 的 Cookie 就是第三方 Cookie，这种场景叫第三方上下文。</p>
<p>在第三方上下文里发 Cookie，前提是设 <code>SameSite=None; Secure</code>。可是浏览器的隐私策略还可能拦下来：Chrome 默认允许，用户可以屏蔽；Firefox 默认把第三方 Cookie 按顶层站点分区；Safari 默认阻止。</p>
<p><code>Partitioned</code> 这个属性，也就是 CHIPS，让 Cookie 按顶层站点分开存。<code>pay.widget</code> 嵌在 <code>shop.example</code> 里和嵌在 <code>blog.example</code> 里，拿到的是两份互不相通的 Cookie，没法跨站追踪，但在同一个网站里可以保持状态。</p>
<p>要注意，分区 Cookie 解决不了跨站共享登录态。那种情况要用 Storage Access API 请求授权，或者用 FedCM 做联合登录。</p>
</blockquote>
<h2>分区 Cookie 怎么写</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-widget=abc; Secure; Path=/; SameSite=None; Partitioned
</code></pre></div>
<p><code>Partitioned</code> 必须和 <code>Secure</code> 一起用。推荐加 <code>__Host-</code> 前缀，把 Cookie 绑定到主机名。</p>
<p>分区的依据叫分区键，就是顶层站点，也就是协议加可注册域名。可以理解成浏览器给每个顶层网站单独准备了一个 Cookie 罐子。同一个组件到了不同网站，用的是不同的罐子，所以无法跨站追踪；在同一个网站里多次访问，用的是同一个罐子，所以能保持会话。</p>
<h2>什么场景用什么方案</h2>
<table><thead><tr><th>场景</th><th>方案</th></tr></thead><tbody><tr><td>嵌入式客服、地图、评论，每个网站各自维护会话</td><td><code>Partitioned</code></td></tr><tr><td>嵌入的支付页需要用户在支付平台的已有登录态</td><td>Storage Access API</td></tr><tr><td>第三方账号登录</td><td>FedCM 或顶层跳转登录</td></tr><tr><td>跨站追踪用户</td><td>浏览器正在逐步限制，不要依赖</td></tr></tbody></table>
<p>区分的关键是：组件要不要认出“这是我在别的网站见过的同一个用户”。不需要，就用分区 Cookie；需要，就得走用户授权。</p>
<h2>Storage Access API 怎么用</h2>
<p>嵌入的 iframe 想拿到自己平时的、不分区的 Cookie，可以向用户请求授权：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 在嵌入的 iframe 内，由用户手势触发</span>
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-keyword">await</span> <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">hasStorageAccess</span>())) {
    <span class="hljs-keyword">await</span> <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">requestStorageAccess</span>();
  }
  <span class="hljs-comment">// 获得授权后，请求会带上非分区的第三方 Cookie</span>
});
</code></pre></div>
<p>为什么要放在点击事件里？因为浏览器要求这个请求由用户手势触发。浏览器可能弹出提示，也可能根据用户和这个站点的交互历史自动决定。所以调用可能失败，要准备降级方案，比如打开一个顶层窗口完成操作。</p>
<h2>迁移时怎么检查</h2>
<ol>
<li>找出所有设置了 <code>SameSite=None</code> 的 Cookie，它们就是依赖第三方上下文的部分。</li>
<li>在屏蔽第三方 Cookie 的浏览器设置下测试嵌入功能。</li>
<li>按场景选择 <code>Partitioned</code>、Storage Access API、FedCM，或者改成在顶层页面完成操作。</li>
<li>Cookie 缺失时给出可用的降级体验，不要静默失败。</li>
</ol>
<h2>常见追问</h2>
<p><strong>分区 Cookie 和 SameSite 能一起用吗？</strong></p>
<blockquote>
<p>能，而且通常就配 <code>SameSite=None</code>。分区 Cookie 本来就是给第三方上下文用的，不设 <code>None</code> 跨站请求就不带它了。</p>
</blockquote>
<p><strong>Chrome 以后会不会默认屏蔽第三方 Cookie？</strong></p>
<blockquote>
<p>目前 Chrome 默认允许，只在无痕模式或用户设置时屏蔽。可是不要依赖这一点，其他浏览器已经默认限制了，用户也随时可以关掉。</p>
</blockquote>`};export{e as default};