var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前 CSS 只能从父元素往下选，没法说“包含图片的卡片”。<code>:has()</code> 补上了这个能力，<code>.card:has(img)</code> 选中的是里面有图片的 <code>.card</code>，样式加在卡片上，不是加在图片上。</p>
<p>括号里写的是相对于当前元素的选择器。<code>:has(&gt; img)</code> 只看直接子元素，<code>:has(+ .error)</code> 看紧挨在后面的兄弟元素。所以它不光能选父元素，还能选前面的兄弟。</p>
<p>以前这类需求要用 JavaScript 给父元素加类名，比如整组表单字段在输入无效时变红，现在一条选择器就够了。</p>
<p>要注意几点：它的优先级取括号里最高的那个，写 <code>:has(#id)</code> 就会带上 ID 级优先级；<code>:has()</code> 不能嵌套，伪元素也不能放进参数。主流浏览器都已经支持，可以直接用。</p>
</blockquote>
<h2>常见用法</h2>
<p>下面几条都是以前必须靠 JavaScript 加类名才能做到的：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* 含图片的卡片改为左右布局 */</span>
<span class="hljs-selector-class">.card</span><span class="hljs-selector-pseudo">:has</span>(&gt; <span class="hljs-selector-tag">img</span>) {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">120px</span> <span class="hljs-number">1</span>fr;
}

<span class="hljs-comment">/* 字段无效时高亮整组 */</span>
<span class="hljs-selector-class">.field</span><span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-tag">input</span><span class="hljs-selector-pseudo">:user-invalid</span>) {
  <span class="hljs-attribute">border-color</span>: crimson;
}

<span class="hljs-comment">/* 后面紧跟说明文字的标题减小间距 */</span>
<span class="hljs-selector-tag">h2</span><span class="hljs-selector-pseudo">:has</span>(+ <span class="hljs-selector-class">.subtitle</span>) {
  <span class="hljs-attribute">margin-block-end</span>: <span class="hljs-number">4px</span>;
}

<span class="hljs-comment">/* 打开对话框时禁止页面滚动 */</span>
<span class="hljs-selector-tag">html</span><span class="hljs-selector-pseudo">:has</span>(dialog<span class="hljs-selector-attr">[open]</span>) {
  <span class="hljs-attribute">overflow</span>: hidden;
}
</code></pre></div>
<p>第三条值得多看一眼。<code>h2:has(+ .subtitle)</code> 选中的是 <code>h2</code>，条件是它后面紧跟着 <code>.subtitle</code>。以前的 <code>+</code> 选择器只能选后面那个，现在可以反过来选前面那个。</p>
<h2>多个条件怎么组合</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* 同时包含两者 */</span>
<span class="hljs-selector-class">.item</span><span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-class">.badge</span>)<span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-class">.price</span>) { }

<span class="hljs-comment">/* 包含任意一个 */</span>
<span class="hljs-selector-class">.item</span><span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-class">.badge</span>, <span class="hljs-selector-class">.price</span>) { }

<span class="hljs-comment">/* 不包含 */</span>
<span class="hljs-selector-class">.item</span><span class="hljs-selector-pseudo">:not</span>(<span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-tag">img</span>)) { }
</code></pre></div>
<p>连写两个 <code>:has()</code> 是“并且”，括号里用逗号分开是“或者”，外面套 <code>:not()</code> 是“不包含”。</p>
<h2>会不会很慢</h2>
<p>浏览器为 <code>:has()</code> 专门做了优化，常见写法没有明显的性能问题。</p>
<p>要小心的是范围太大的写法，比如 <code>body:has(.x)</code> 或 <code>:has(*)</code>。页面上任何地方的 DOM 变化，都可能让浏览器重新检查一大片元素。所以前面的元素尽量写具体，比如 <code>.field:has(...)</code>，而不是 <code>body:has(...)</code>。</p>
<h2>常见追问</h2>
<p><strong><code>:has()</code> 和 <code>:focus-within</code> 有什么区别？</strong></p>
<blockquote>
<p><code>:focus-within</code> 只能判断后代里有没有元素获得焦点。<code>:has(:focus-visible)</code> 能判断更具体的状态，比如只在键盘聚焦时生效，而且 <code>:has()</code> 还能用在兄弟关系上。</p>
</blockquote>`};export{e as default};