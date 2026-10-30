var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>CSP 是服务端通过响应头告诉浏览器“哪些脚本可以执行”。它是 XSS 的第二道防线：就算攻击者成功往页面里塞了一个 <code>&lt;script&gt;</code>，只要它没被策略授权，浏览器就不执行。</p>
<p>授权脚本常用两种办法。nonce 是服务端每次响应都随机生成一个值，同时写进响应头和合法的 <code>&lt;script nonce&gt;</code> 上，攻击者猜不到这个值。hash 是对固定的内联脚本内容算 SHA-256，适合静态站点。再加上 <code>&#x27;strict-dynamic&#x27;</code>，已授权的脚本动态加载的脚本也会被信任。</p>
<p>只写域名白名单的策略容易被白名单域名上的 JSONP 或旧库绕过，所以推荐以 nonce 或 hash 为主，再用 <code>object-src &#x27;none&#x27;</code> 和 <code>base-uri &#x27;none&#x27;</code> 补上插件和 <code>&lt;base&gt;</code> 注入的漏洞。</p>
<p>要注意，nonce 必须每次响应都不同，不能写死在静态 HTML 里。另外 <code>&#x27;unsafe-inline&#x27;</code> 会让 CSP 对脚本注入几乎失效。</p>
</blockquote>
<h2>推荐的严格策略</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy:
  script-src &#x27;nonce-R4nd0m&#x27; &#x27;strict-dynamic&#x27;;
  object-src &#x27;none&#x27;;
  base-uri &#x27;none&#x27;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">nonce</span>=<span class="hljs-string">&quot;R4nd0m&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/assets/app.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>浏览器看到这个 <code>&lt;script&gt;</code> 上的 nonce 和响应头里的一致，才会执行它。攻击者注入的脚本拿不到这个值，所以跑不起来。</p>
<p>那么 nonce 为什么一定要每次响应都换？因为它的安全性全靠“攻击者猜不到”。所以要用密码学安全的随机数生成，不能写死在静态 HTML 里。也不能给拼进来的用户 HTML 统一补上 nonce，那等于把攻击脚本一起授权了。</p>
<p>另外两条指令是堵漏洞用的。<code>object-src &#x27;none&#x27;</code> 禁用插件。<code>base-uri &#x27;none&#x27;</code> 防止攻击者注入一个 <code>&lt;base&gt;</code> 标签，把页面上所有相对路径的脚本地址改到他的服务器上。</p>
<p><code>&#x27;strict-dynamic&#x27;</code> 解决的是“授权脚本又加载了别的脚本”的问题。打包工具和第三方 SDK 经常动态创建 <code>&lt;script&gt;</code>，有了它，这些脚本自动继承信任。代价是此时 <code>&#x27;self&#x27;</code> 和主机白名单会被忽略，信任只从 nonce 或 hash 开始传递。</p>
<h2>为什么不推荐只写域名白名单</h2>
<p><code>script-src https://cdn.example</code> 这种写法看起来很直观，但很容易被绕过。白名单里的域名上只要有一个 JSONP 接口或者一个旧版本的库，攻击者就能借它执行任意代码。所以更推荐 nonce 或 hash。</p>
<h2>hash 怎么算</h2>
<p>下面用 Node 算一段内联脚本的摘要，同时演示多一个换行会怎样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createHash } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

<span class="hljs-keyword">const</span> source = <span class="hljs-string">&#x27;console.log(&quot;页面初始化&quot;);&#x27;</span>;
<span class="hljs-keyword">const</span> digest = <span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>).<span class="hljs-title function_">update</span>(source, <span class="hljs-string">&#x27;utf8&#x27;</span>).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;base64&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`script-src &#x27;sha256-<span class="hljs-subst">\${digest}</span>&#x27;\`</span>);
<span class="hljs-comment">// script-src &#x27;sha256-wCEOeq5cgVDdzNa52AZZico2gWU77+6TJCQcYBtcW0Q=&#x27;</span>

<span class="hljs-keyword">const</span> withNewline = <span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>).<span class="hljs-title function_">update</span>(<span class="hljs-string">\`<span class="hljs-subst">\${source}</span>\\n\`</span>, <span class="hljs-string">&#x27;utf8&#x27;</span>).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;base64&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(withNewline === digest); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>只多了一个换行，摘要就完全变了。因为摘要针对的是 <code>&lt;script&gt;</code> 标签之间的确切内容，空格和换行都算在内。所以要按最终的构建产物计算，格式化工具改了一下缩进，策略就会失效。</p>
<h2>迁移时常见的阻碍</h2>
<p>老项目上 CSP，最常遇到的是内联事件属性，比如 <code>onclick=&quot;...&quot;</code>。nonce 授权不了它，要改成 <code>addEventListener</code>。其次是 <code>eval</code> 和 <code>new Function</code>，它们需要 <code>&#x27;unsafe-eval&#x27;</code>，应该尽量把这类依赖去掉。</p>
<p>有人会想干脆加个 <code>&#x27;unsafe-inline&#x27;</code> 了事，可是这样 CSP 对脚本注入就几乎没用了。好在同时写了 nonce 或 hash 时，支持的浏览器会忽略 <code>&#x27;unsafe-inline&#x27;</code>，所以它可以作为旧浏览器的兼容项留着。第三方脚本再加载子脚本的情况，配合 <code>&#x27;strict-dynamic&#x27;</code> 处理。</p>
<p>策略写好后怎样先观察再强制执行、怎样收集和处理违规报告，见<a href="/questions/security-csp-reporting/">《CSP Report-Only 和违规报告怎样用于安全治理？》</a>。</p>
<h2>常见追问</h2>
<p><strong>CSP 能放在 <code>&lt;meta&gt;</code> 里吗？</strong></p>
<blockquote>
<p>大部分指令可以。但 <code>frame-ancestors</code>、<code>sandbox</code>、报告相关的配置和 Report-Only 只能用响应头。</p>
</blockquote>
<p><strong>同时有多个 CSP 头时怎么生效？</strong></p>
<blockquote>
<p>每个都生效，资源必须同时满足所有策略。所以多加一个头只会更严格，不会放宽。</p>
</blockquote>
<p><strong>DOM 型 XSS 能怎么进一步约束？</strong></p>
<blockquote>
<p>可以用 Trusted Types 限制数据进入 <code>innerHTML</code> 这类危险入口，见<a href="/questions/sec-trusted-types/">《Trusted Types 会自动过滤所有危险 HTML 吗？》</a>。</p>
</blockquote>`};export{e as default};