var e={answerHtml:`<p>假设页面把一段未经处理的用户评论当成 HTML 插入，其中混入了攻击脚本。浏览器默认无法判断“这是开发者写的脚本，还是攻击者塞进来的脚本”。CSP 为浏览器增加一份执行和加载规则：不符合规则的脚本，即使出现在页面里，也不能直接执行。</p>
<p>nonce 和 hash 都是在回答“哪些脚本被明确许可”，但许可的依据不同：nonce 看本次响应赋予的随机标记，hash 看脚本内容是否与预先批准的内容一致。</p>
<h3>nonce 必须随 HTML 响应生成</h3>
<p>下面是响应头与 HTML 的对应关系，<code>本次随机值</code> 只是占位符，不能照抄作为生产值：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: script-src &#x27;nonce-本次随机值&#x27;; object-src &#x27;none&#x27;; base-uri &#x27;none&#x27;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">nonce</span>=<span class="hljs-string">&quot;本次随机值&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/assets/app.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>浏览器把脚本元素上的 nonce 与策略中的值比较，匹配才许可执行。服务端应使用密码学安全的随机数生成器，为每次响应生成不可预测的值；同一份文档中需要授权的脚本可以共享这个值。</p>
<p>nonce 不是长期密码：合法页面能看到它，关键是攻击者无法提前猜到另一次响应里的值。不能把固定 nonce 写进静态 HTML，也不能在拼接用户 HTML 后，给所有 script 元素自动补 nonce——那会连攻击脚本一起授权。</p>
<p>使用 CDN 缓存时，响应头和 HTML 中的 nonce 必须保持一致，同时避免把同一固定 nonce 长期复用。完全静态的网站通常更适合构建时生成 hash，而不是假装每次请求都生成了 nonce。</p>
<h3>hash 把许可绑定到具体代码</h3>
<p>对于一段固定的内联脚本，可以计算其内容的 SHA-256，再把 Base64 结果写进策略。例如要批准的代码只有：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span>&gt;</span><span class="javascript"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&quot;页面初始化&quot;</span>);</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>在 Node.js 中计算摘要：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createHash } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

<span class="hljs-keyword">const</span> source = <span class="hljs-string">&#x27;console.log(&quot;页面初始化&quot;);&#x27;</span>;
<span class="hljs-keyword">const</span> digest = <span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>).<span class="hljs-title function_">update</span>(source, <span class="hljs-string">&#x27;utf8&#x27;</span>).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;base64&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`script-src &#x27;sha256-<span class="hljs-subst">\${digest}</span>&#x27;\`</span>);
</code></pre></div>
<p>摘要的输入是 script 标签之间的确切内容，不包含标签本身。空格、换行或压缩结果变化都可能改变摘要，因此应根据最终生成的 HTML 计算，不能对源文件算完后再改写代码。</p>
<p>这段示例针对内联脚本。外部脚本的 CSP hash 授权还涉及 <code>integrity</code> 等要求，不能简单把文件摘要放进响应头就认为所有浏览器都会按预期执行。<code>onclick</code> 之类的内联事件属性也不是普通 script 元素，优先改为 <code>addEventListener</code>，不要为了兼容旧写法直接放开所有内联执行。</p>
<h3>strict-dynamic 解决的是后续加载的信任传递</h3>
<p>当经过 nonce 或 hash 授权的入口脚本通过代码创建其他脚本时，<code>&#x27;strict-dynamic&#x27;</code> 可以把信任传递给这些动态加载的脚本。它适合存在加载器的应用，但也意味着入口脚本必须可靠：如果它把攻击者提供的 URL 当作脚本地址加载，CSP 不会替你判断这次业务决策是否正确。</p>
<p>在支持该关键字的浏览器中，使用它后不能仍按普通主机白名单的直觉理解整个 script-src；<code>&#x27;self&#x27;</code> 等来源表达式会被忽略。部署前应按实际入口和加载链验证，而不是机械拼接多个“看起来安全”的关键字。</p>
<h3>Report-Only 用来观察，不用来拦截</h3>
<p>准备上线新策略时，可以先发送：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy-Report-Only: script-src &#x27;self&#x27;; object-src &#x27;none&#x27;; base-uri &#x27;none&#x27;; report-to csp
Reporting-Endpoints: csp=&quot;https://reports.example.com/csp&quot;
</code></pre></div>
<p>这里的报告地址是示例，需要替换为实际可接收报告的服务。浏览器按兼容性和报告机制发送违规信息，开发者工具也能帮助定位违规；<strong>Report-Only 本身不会阻止这些脚本运行</strong>。它不能通过 meta 标签启用。</p>
<p>发现违规后，应区分正常业务依赖、浏览器扩展和真实异常。先修正必要的加载方式，再将策略切换为正式的 Content-Security-Policy。正式策略和 Report-Only 可以同时存在：前者执行拦截，后者观察下一版规则。</p>
<p>CSP 也不只包含 script-src。图片、接口连接、样式等有各自指令；上面的片段并非一份完整站点配置。最终策略需要匹配真实资源清单，同时保留输出编码、安全 DOM API 和依赖治理。CSP 能增加攻击难度，不能把本来危险的数据处理方式变安全。</p>`};export{e as default};