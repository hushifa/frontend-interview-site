var e={answerHtml:`<h2>简答</h2>
<ul>
<li>开启 <code>require-trusted-types-for &#x27;script&#x27;</code> 后，给 <code>innerHTML</code>、<code>script.src</code> 等入口传普通字符串会抛 <code>TypeError</code>；<code>eval</code> 和 <code>new Function</code> 传入未经策略处理的字符串同样会被拦截。</li>
<li>只有策略（<code>trustedTypes.createPolicy</code>）能创建 <code>TrustedHTML</code>、<code>TrustedScript</code>、<code>TrustedScriptURL</code>；策略内部的处理逻辑由应用自己写。</li>
<li>原样返回输入的策略没有任何防护作用，策略中要真正净化或校验。</li>
<li><code>trusted-types</code> 指令限制允许创建的策略名称，防止其他代码随意新建策略。</li>
<li>MDN 将其标为 Baseline 2026 新近可用（2026 年 2 月起），旧浏览器需要降级方案。</li>
</ul>
<h2>配置和使用</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: require-trusted-types-for &#x27;script&#x27;; trusted-types article-html dompurify
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> <span class="hljs-title class_">DOMPurify</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;dompurify&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title function_">sanitize</span> = (<span class="hljs-params">input</span>) =&gt;
  <span class="hljs-title class_">DOMPurify</span>.<span class="hljs-title function_">sanitize</span>(input, { <span class="hljs-attr">ALLOWED_TAGS</span>: [<span class="hljs-string">&#x27;p&#x27;</span>, <span class="hljs-string">&#x27;strong&#x27;</span>, <span class="hljs-string">&#x27;em&#x27;</span>, <span class="hljs-string">&#x27;ul&#x27;</span>, <span class="hljs-string">&#x27;li&#x27;</span>, <span class="hljs-string">&#x27;br&#x27;</span>], <span class="hljs-attr">ALLOWED_ATTR</span>: [] });

<span class="hljs-keyword">const</span> policy = <span class="hljs-variable language_">window</span>.<span class="hljs-property">trustedTypes</span>?.<span class="hljs-title function_">createPolicy</span>(<span class="hljs-string">&#x27;article-html&#x27;</span>, { <span class="hljs-attr">createHTML</span>: sanitize });

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">renderArticle</span>(<span class="hljs-params">container, source</span>) {
  container.<span class="hljs-property">innerHTML</span> = policy ? policy.<span class="hljs-title function_">createHTML</span>(source) : <span class="hljs-title function_">sanitize</span>(source);
}
</code></pre></div>
<ul>
<li>策略名 <code>dompurify</code> 是 DOMPurify 在支持的浏览器中使用的内部策略名，按所用版本的文档核对。</li>
<li>不支持 Trusted Types 时仍走净化函数，但不再有入口强制。</li>
<li>只显示纯文本时直接用 <code>textContent</code>，不需要 HTML 策略。</li>
</ul>
<h2>default 策略</h2>
<p>名为 <code>default</code> 的策略会在代码把普通字符串传给危险入口时被自动调用，适合迁移旧代码：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">trustedTypes.<span class="hljs-title function_">createPolicy</span>(<span class="hljs-string">&#x27;default&#x27;</span>, {
  <span class="hljs-title function_">createHTML</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;待改造的 innerHTML 调用&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">sanitize</span>(value);
  },
});
</code></pre></div>
<p>它返回 <code>null</code> 或 <code>undefined</code> 时赋值会抛错。迁移完成后应移除 default 策略，改为显式调用具名策略。</p>
<h2>迁移步骤</h2>
<ol>
<li>先用 <code>Content-Security-Policy-Report-Only: require-trusted-types-for &#x27;script&#x27;</code> 收集违规，找出所有直接赋值的位置。</li>
<li>能用 <code>textContent</code>、<code>setAttribute</code> 或 DOM API 替代的直接改掉。</li>
<li>剩下必须渲染 HTML 的地方集中到一两个具名策略。</li>
<li>第三方库不兼容时，用 default 策略过渡并记录调用来源。</li>
<li>切换为强制执行。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>框架项目需要吗？React、Vue 的模板插值本身不经过这些入口，风险集中在 <code>dangerouslySetInnerHTML</code>、<code>v-html</code> 和第三方库，Trusted Types 能把它们暴露出来。</li>
<li>和 CSP 的 nonce 有什么区别？nonce 控制脚本能否执行，Trusted Types 控制数据能否进入危险的 DOM 入口，两者配合使用。</li>
</ul>`};export{e as default};