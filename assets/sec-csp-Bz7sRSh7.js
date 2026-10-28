var e={answerHtml:`<h2>简答</h2>
<ul>
<li>CSP 是 XSS 的第二道防线：即使攻击者注入了 <code>&lt;script&gt;</code>，没有被策略授权也不会执行。</li>
<li>nonce：服务端每次响应生成一个随机值，同时写进响应头和合法的 <code>&lt;script nonce&gt;</code>，攻击者猜不到。</li>
<li>hash：对固定内联脚本的内容算 SHA-256，适合静态站点。</li>
<li><code>&#x27;strict-dynamic&#x27;</code>：已授权的脚本动态创建的脚本也被信任，此时 <code>&#x27;self&#x27;</code> 和主机白名单会被忽略。</li>
<li><code>Content-Security-Policy-Report-Only</code> 只报告不拦截，用于上线前验证，报告配置见<a href="/questions/security-csp-reporting/">《CSP Report-Only 和违规报告怎样用于安全治理？》</a>。</li>
</ul>
<h2>推荐的严格策略</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy:
  script-src &#x27;nonce-R4nd0m&#x27; &#x27;strict-dynamic&#x27;;
  object-src &#x27;none&#x27;;
  base-uri &#x27;none&#x27;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">nonce</span>=<span class="hljs-string">&quot;R4nd0m&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/assets/app.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<ul>
<li>nonce 用密码学安全的随机数生成，每次响应都不同。不能写死在静态 HTML 里，也不能给拼接进来的用户 HTML 统一补 nonce，那会连攻击脚本一起授权。</li>
<li><code>object-src &#x27;none&#x27;</code> 禁用插件，<code>base-uri &#x27;none&#x27;</code> 防止注入 <code>&lt;base&gt;</code> 改写相对脚本地址。</li>
<li>基于主机白名单的策略（<code>script-src https://cdn.example</code>）容易被白名单域名上的 JSONP 或旧版库绕过，更推荐 nonce 或 hash。</li>
</ul>
<h2>hash</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createHash } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

<span class="hljs-keyword">const</span> source = <span class="hljs-string">&#x27;console.log(&quot;页面初始化&quot;);&#x27;</span>;
<span class="hljs-keyword">const</span> digest = <span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>).<span class="hljs-title function_">update</span>(source, <span class="hljs-string">&#x27;utf8&#x27;</span>).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;base64&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`script-src &#x27;sha256-<span class="hljs-subst">\${digest}</span>&#x27;\`</span>);
</code></pre></div>
<p>摘要针对 <code>&lt;script&gt;</code> 标签之间的确切内容，空格或换行变化都会改变摘要，要按最终产物计算。</p>
<h2>迁移时常见的阻碍</h2>
<ul>
<li>内联事件属性（<code>onclick=&quot;...&quot;</code>）不受 nonce 授权，改为 <code>addEventListener</code>。</li>
<li><code>eval</code>、<code>new Function</code> 需要 <code>&#x27;unsafe-eval&#x27;</code>，应尽量移除这类依赖。</li>
<li><code>&#x27;unsafe-inline&#x27;</code> 会让 CSP 对脚本注入几乎失效；同时存在 nonce 或 hash 时，支持的浏览器会忽略 <code>&#x27;unsafe-inline&#x27;</code>。</li>
<li>第三方脚本加载的子脚本：配合 <code>&#x27;strict-dynamic&#x27;</code> 处理。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>CSP 能放在 <code>&lt;meta&gt;</code> 里吗？大部分指令可以，但 <code>frame-ancestors</code>、<code>sandbox</code>、报告相关配置和 Report-Only 只能用响应头。</li>
<li>多个 CSP 头怎么生效？都会生效，资源必须同时满足所有策略，结果只会更严格。</li>
<li>DOM 型 XSS 怎么进一步约束？见<a href="/questions/sec-trusted-types/">《Trusted Types 会自动过滤所有危险 HTML 吗？》</a>。</li>
</ul>`};export{e as default};