var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>.card:has(img)</code> 选中包含图片的 <code>.card</code>，样式作用在 <code>.card</code> 上，而不是图片上。</li>
<li>参数是相对选择器：<code>:has(&gt; img)</code> 只看直接子元素，<code>:has(+ .error)</code> 看紧跟的兄弟元素。</li>
<li>优先级取参数里最高的那个，<code>:has(#id)</code> 会带来 ID 级优先级。</li>
<li>不能嵌套 <code>:has()</code>，伪元素也不能作为参数。</li>
<li><code>:has()</code> 已被主流浏览器支持，可以直接使用。</li>
</ul>
<h2>常见用法</h2>
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
<p>以前这些都需要 JavaScript 给父元素加类名。</p>
<h2>条件组合</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* 同时包含两者 */</span>
<span class="hljs-selector-class">.item</span><span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-class">.badge</span>)<span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-class">.price</span>) { }

<span class="hljs-comment">/* 包含任意一个 */</span>
<span class="hljs-selector-class">.item</span><span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-class">.badge</span>, <span class="hljs-selector-class">.price</span>) { }

<span class="hljs-comment">/* 不包含 */</span>
<span class="hljs-selector-class">.item</span><span class="hljs-selector-pseudo">:not</span>(<span class="hljs-selector-pseudo">:has</span>(<span class="hljs-selector-tag">img</span>)) { }
</code></pre></div>
<h2>性能</h2>
<p>浏览器为 <code>:has()</code> 做了专门的失效优化，常见写法没有明显问题。范围过大的写法，例如 <code>body:has(.x)</code> 或 <code>:has(*)</code>，会让任意 DOM 变化都可能触发大范围重新匹配，尽量把锚点写得具体。</p>
<h2>常见追问</h2>
<ul>
<li><code>:has()</code> 和 <code>:focus-within</code> 有什么区别？<code>:focus-within</code> 只判断后代是否获得焦点；<code>:has(:focus-visible)</code> 能判断更具体的状态，也能用于兄弟关系。</li>
</ul>`};export{e as default};