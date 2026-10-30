var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>setHTML()</code> 是浏览器内置的安全版 <code>innerHTML</code>。<code>el.setHTML(userHtml)</code> 会把 HTML 解析进元素，同时删掉不允许的标签和属性，<code>&lt;script&gt;</code> 这类东西进不去。</p>
<p>和 DOMPurify 最大的区别在两点。第一，<code>setHTML()</code> 有一条兜底规则：不管传什么配置，<code>&lt;script&gt;</code>、<code>&lt;iframe&gt;</code>、<code>&lt;object&gt;</code>、<code>&lt;embed&gt;</code>、<code>&lt;frame&gt;</code>、<code>&lt;use&gt;</code> 和 <code>onclick</code> 这类事件属性都会被删掉，配置写错也不会放出 XSS。第二，DOMPurify 是一个 JavaScript 库，默认返回净化后的字符串，再由你赋给 <code>innerHTML</code>；<code>setHTML()</code> 是浏览器原生方法，净化和插入一步完成。</p>
<p>它适合富文本评论、Markdown 转出的 HTML 这类必须渲染用户 HTML 的场景，用 <code>elements</code>、<code>attributes</code> 这些配置限定允许的内容。</p>
<p>现状要说清楚：MDN 标为有限可用，按兼容数据，Chrome 146、Firefox 148 起支持，Safari 还没有实现。所以现在的做法是像 MDN 示例那样检测 <code>&#x27;Sanitizer&#x27; in window</code>，不支持时退回 DOMPurify。</p>
</blockquote>
<h2>setHTML() 怎么用</h2>
<p>最简单的用法是不传配置，直接替换 <code>innerHTML</code>。MDN 给的例子是这样的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> untrustedString = <span class="hljs-string">&#x27;abc &lt;script&gt;alert(1)&lt;&#x27;</span> + <span class="hljs-string">&#x27;/script&gt; def&#x27;</span>;
someElement.<span class="hljs-title function_">setHTML</span>(untrustedString);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(someElement.<span class="hljs-property">innerHTML</span>); <span class="hljs-comment">// abc def</span>
</code></pre></div>
<p>不传配置时用的是<strong>默认配置</strong>。它比“去掉 XSS”还要严，MDN 写明默认配置会删掉可能用于点击劫持、伪装的元素，也会删掉注释和 <code>data-*</code> 属性。</p>
<p>需要精确控制时，传一个 <code>sanitizer</code> 选项。下面是一个白名单配置，只允许几个排版标签，<code>&lt;b&gt;</code> 去掉标签但保留里面的文字：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> sanitizer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Sanitizer</span>({
  <span class="hljs-attr">elements</span>: [<span class="hljs-string">&#x27;p&#x27;</span>, <span class="hljs-string">&#x27;strong&#x27;</span>, <span class="hljs-string">&#x27;em&#x27;</span>, <span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;ul&#x27;</span>, <span class="hljs-string">&#x27;li&#x27;</span>],
  <span class="hljs-attr">replaceWithChildrenElements</span>: [<span class="hljs-string">&#x27;b&#x27;</span>],
  <span class="hljs-attr">attributes</span>: [<span class="hljs-string">&#x27;href&#x27;</span>],
});
comment.<span class="hljs-title function_">setHTML</span>(userHtml, { sanitizer });
</code></pre></div>
<p>配置分两种写法。白名单用 <code>elements</code>、<code>attributes</code>，没列出的全删；黑名单用 <code>removeElements</code>、<code>removeAttributes</code>，没列出的全留。同一类不能两种混用，比如同时写 <code>elements</code> 和 <code>removeElements</code>，<code>setHTML()</code> 会抛 <code>TypeError</code>。MDN 认为白名单更安全。</p>
<h2>为什么说配置写错也不会放出 XSS</h2>
<p>这是 <code>setHTML()</code> 的核心设计。看下面这个配置，故意把 <code>script</code> 写进了白名单：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> sanitizer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Sanitizer</span>({ <span class="hljs-attr">elements</span>: [<span class="hljs-string">&#x27;div&#x27;</span>, <span class="hljs-string">&#x27;p&#x27;</span>, <span class="hljs-string">&#x27;button&#x27;</span>, <span class="hljs-string">&#x27;script&#x27;</span>] });
target.<span class="hljs-title function_">setHTML</span>(unsanitizedString, { sanitizer });
</code></pre></div>
<p>结果 <code>&lt;script&gt;</code> 还是被删了。MDN 说明 <code>setHTML()</code> 总会去掉 XSS 不安全的元素和属性，即使配置允许它们。DOMPurify 没有这条写死的兜底，安全性取决于你传的选项。</p>
<p>那确实要保留某个危险属性怎么办？要换成 <code>setHTMLUnsafe()</code>，它按配置原样执行，不做兜底，不传配置时和 <code>innerHTML</code> 差不多。名字里带 Unsafe，就是为了让审查代码的人一眼看到风险点。</p>
<h2>和 DOMPurify、Trusted Types 怎样配合</h2>
<p>DOMPurify 默认输出字符串，开启 <code>RETURN_TRUSTED_TYPE</code> 时会尝试返回 <code>TrustedHTML</code>。它的优势是兼容面广，README 写明支持 Safari 10+、Firefox、Chrome、Edge 等现代浏览器。</p>
<p>和 Trusted Types 的关系是这样的：开启 Trusted Types 后，<code>innerHTML</code> 只收 <code>TrustedHTML</code>，所以 DOMPurify 要放在策略里使用，见<a href="/questions/sec-trusted-types/">《Trusted Types 会自动过滤所有危险 HTML 吗？》</a>。<code>setHTML()</code> 不经过 Trusted Types，因为它一定会去掉 XSS 内容，MDN 说这类调用没有需要审查的东西。<code>setHTMLUnsafe()</code> 则仍受 Trusted Types 约束。</p>
<p>MDN 也说，用安全方法时一般不需要 DOMPurify。但考虑到 Safari 还不支持，现在比较稳妥的写法是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;Sanitizer&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>) {
  container.<span class="hljs-title function_">setHTML</span>(userHtml);
} <span class="hljs-keyword">else</span> {
  container.<span class="hljs-property">innerHTML</span> = <span class="hljs-title class_">DOMPurify</span>.<span class="hljs-title function_">sanitize</span>(userHtml);
}
</code></pre></div>
<p>不管用哪种，净化只是一层防护。显示纯文本时用 <code>textContent</code>，链接协议限制、CSP 等其他措施见<a href="/questions/http-xss/">《XSS 有哪几种？前端怎样防范？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Chrome 很早就有 Sanitizer API，为什么现在才说能用？</strong></p>
<blockquote>
<p>兼容数据里注明，Chrome 105 到 118 支持过一个规范差别很大的旧版本。现在的 <code>setHTML()</code> 定义在 WHATWG HTML 标准里，兼容数据记的支持起点是 Chrome 146，所以早年文章里的写法不能照搬，要以 MDN 当前文档为准。</p>
</blockquote>
<p><strong>有没有只解析不插入的办法？</strong></p>
<blockquote>
<p>有，<code>Document.parseHTML()</code>。它按同样的规则净化，然后返回一个新的 <code>Document</code>，适合先检查结果再决定怎么用。对应的不安全版本是 <code>Document.parseHTMLUnsafe()</code>。</p>
</blockquote>
<p><strong>同一份配置反复用，传对象和传 Sanitizer 有区别吗？</strong></p>
<blockquote>
<p>MDN 说重复使用时，<code>Sanitizer</code> 实例预计比每次传配置对象更高效。另外 <code>Sanitizer</code> 的方法如 <code>allowElement()</code>、<code>removeElement()</code> 会保证配置始终合法。</p>
</blockquote>`};export{e as default};