var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>不会。Trusted Types 做的事是“把门”，不是“过滤”。在 CSP 里开启 <code>require-trusted-types-for &#x27;script&#x27;</code> 后，给 <code>innerHTML</code>、<code>script.src</code> 这些危险入口传普通字符串会直接抛 <code>TypeError</code>，<code>eval</code> 和 <code>new Function</code> 传入没经过策略处理的字符串也会被拦。</p>
<p>那合法的 HTML 怎么进去？要先交给一个策略，由 <code>trustedTypes.createPolicy</code> 创建。策略生成 <code>TrustedHTML</code> 这类可信类型，入口只认这些值。至于策略里面怎么处理字符串，是应用自己写的，通常调用 DOMPurify 净化。</p>
<p>它的价值是把散落在各处的风险点集中到少数几个策略里，审查时只要盯住这几个地方。<code>trusted-types</code> 指令还能限制允许创建的策略名，防止别的代码随便新建策略。</p>
<p>要注意，原样返回输入的策略没有任何防护作用。另外 MDN 把它标为 Baseline 2026 新近可用，旧浏览器需要降级方案。</p>
</blockquote>
<h2>配置和使用</h2>
<p>先在响应头里开启，并列出允许的策略名：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: require-trusted-types-for &#x27;script&#x27;; trusted-types article-html dompurify
</code></pre></div>
<p>然后在代码里创建策略，所有要写 HTML 的地方都经过它：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> <span class="hljs-title class_">DOMPurify</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;dompurify&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title function_">sanitize</span> = (<span class="hljs-params">input</span>) =&gt;
  <span class="hljs-title class_">DOMPurify</span>.<span class="hljs-title function_">sanitize</span>(input, { <span class="hljs-attr">ALLOWED_TAGS</span>: [<span class="hljs-string">&#x27;p&#x27;</span>, <span class="hljs-string">&#x27;strong&#x27;</span>, <span class="hljs-string">&#x27;em&#x27;</span>, <span class="hljs-string">&#x27;ul&#x27;</span>, <span class="hljs-string">&#x27;li&#x27;</span>, <span class="hljs-string">&#x27;br&#x27;</span>], <span class="hljs-attr">ALLOWED_ATTR</span>: [] });

<span class="hljs-keyword">const</span> policy = <span class="hljs-variable language_">window</span>.<span class="hljs-property">trustedTypes</span>?.<span class="hljs-title function_">createPolicy</span>(<span class="hljs-string">&#x27;article-html&#x27;</span>, { <span class="hljs-attr">createHTML</span>: sanitize });

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">renderArticle</span>(<span class="hljs-params">container, source</span>) {
  container.<span class="hljs-property">innerHTML</span> = policy ? policy.<span class="hljs-title function_">createHTML</span>(source) : <span class="hljs-title function_">sanitize</span>(source);
}
</code></pre></div>
<p>这段代码里，真正把危险标签去掉的是 <code>sanitize</code>，也就是 DOMPurify。Trusted Types 只保证了一件事：除了经过 <code>article-html</code> 这个策略的值，别的字符串都进不了 <code>innerHTML</code>。所以标题问的“会不会自动过滤”，答案就在这里，过滤是策略里的代码做的。</p>
<p>允许列表里为什么还有个 <code>dompurify</code>？这是 DOMPurify 在支持的浏览器里使用的内部策略名，具体要按所用版本的文档核对。</p>
<p>不支持 Trusted Types 的浏览器里，<code>policy</code> 是 <code>undefined</code>，代码仍然走净化函数，只是不再有入口层面的强制。另外，如果只是显示纯文本，直接用 <code>textContent</code> 就行，不需要 HTML 策略。</p>
<h2>default 策略有什么用</h2>
<p>老项目里到处都是 <code>el.innerHTML = str</code>，一开启强制就会报一堆错。这时可以建一个名字叫 <code>default</code> 的策略，代码把普通字符串传给危险入口时，浏览器会自动调用它：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">trustedTypes.<span class="hljs-title function_">createPolicy</span>(<span class="hljs-string">&#x27;default&#x27;</span>, {
  <span class="hljs-title function_">createHTML</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;待改造的 innerHTML 调用&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">sanitize</span>(value);
  },
});
</code></pre></div>
<p>它返回 <code>null</code> 或 <code>undefined</code> 时，赋值会抛错。它只是迁移期的过渡手段，改造完成后应该移除，改成显式调用具名策略。</p>
<h2>迁移步骤</h2>
<ol>
<li>先用 <code>Content-Security-Policy-Report-Only: require-trusted-types-for &#x27;script&#x27;</code> 收集违规，找出所有直接赋值的位置。</li>
<li>能用 <code>textContent</code>、<code>setAttribute</code> 或 DOM API 替代的直接改掉。</li>
<li>剩下必须渲染 HTML 的地方集中到一两个具名策略。</li>
<li>第三方库不兼容时，用 default 策略过渡并记录调用来源。</li>
<li>切换为强制执行。</li>
</ol>
<h2>常见追问</h2>
<p><strong>用 React、Vue 的项目还需要它吗？</strong></p>
<blockquote>
<p>模板插值本身不经过这些入口，风险集中在 <code>dangerouslySetInnerHTML</code>、<code>v-html</code> 和第三方库里。Trusted Types 能把这些地方暴露出来。</p>
</blockquote>
<p><strong>它和 CSP 的 nonce 有什么区别？</strong></p>
<blockquote>
<p>nonce 控制的是哪些脚本能执行，Trusted Types 控制的是哪些数据能进入危险的 DOM 入口。一个管脚本来源，一个管 DOM 写入，两者配合使用。</p>
</blockquote>`};export{e as default};