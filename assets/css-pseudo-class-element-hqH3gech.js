var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>button:hover</code> 选中的是鼠标悬停时的那个按钮，按钮本身就在文档里，<code>:hover</code> 只是加了一个“处于悬停状态”的条件，这是伪类。<code>p::first-line</code> 选中的是段落的第一行，文档里并没有一个“第一行”元素，这是伪元素。</p>
<p>MDN 的定义是，伪类根据文档树之外的信息来选择元素，比如元素当前的状态；伪元素则用来给元素的某个特定部分设置样式。所以伪类选的还是整个元素，伪元素选的是元素的一部分，或者像 <code>::before</code>、<code>::after</code> 那样生成一个新的盒子。</p>
<p>写法上，伪类用一个冒号，伪元素用两个冒号。为了兼容旧代码，浏览器仍然接受 <code>:before</code>、<code>:after</code>、<code>:first-line</code>、<code>:first-letter</code> 这四个的单冒号写法，新代码统一写双冒号。</p>
<p>要注意两点：伪元素必须写在选择器最后，<code>p::before:hover</code> 是无效的，想要悬停时改变伪元素应写成 <code>p:hover::before</code>；<code>::before</code> 和 <code>::after</code> 必须设置 <code>content</code> 才会生成，而且生成的文字读屏软件不一定能读到，重要信息不要只放在里面。</p>
</blockquote>
<h2>先看两种用法</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* 伪类：选中处于某种状态或位置的元素 */</span>
<span class="hljs-selector-tag">li</span><span class="hljs-selector-pseudo">:nth-child</span>(odd) {
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#f5f5f5</span>;
}
<span class="hljs-selector-tag">a</span><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid currentColor;
}

<span class="hljs-comment">/* 伪元素：选中元素的一部分，或生成新的盒子 */</span>
<span class="hljs-selector-class">.required</span><span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">content</span>: <span class="hljs-string">&#x27;*&#x27;</span>;
  <span class="hljs-attribute">color</span>: red;
}
<span class="hljs-selector-tag">input</span><span class="hljs-selector-pseudo">::placeholder</span> {
  <span class="hljs-attribute">color</span>: <span class="hljs-number">#999</span>;
}
</code></pre></div>
<p><code>li:nth-child(odd)</code> 选中的是奇数位置的 <code>li</code>，<code>a:focus-visible</code> 选中的是浏览器判断需要显示焦点框的链接，典型情况是用键盘 Tab 聚焦，它们都是真实存在的元素，只是多了位置或状态的条件。</p>
<p><code>.required::after</code> 在元素内容的最后生成一个星号盒子，DOM 里并没有这个节点，所以 JavaScript 也选不到它。<code>input::placeholder</code> 选中的是输入框里的占位文字那一部分，同样不是一个独立元素。</p>
<h2>为什么伪元素只能放在最后</h2>
<p>MDN 规定伪元素必须出现在复合选择器的所有其他部分之后，选择器里最后那个元素就是伪元素的“来源元素”。所以 <code>p::first-line</code> 可以，<code>p::first-line &gt; *</code> 无效，因为伪元素不是真实的元素，没有子元素可选。</p>
<p>想在悬停时改变 <code>::before</code>，条件要加在来源元素上，写成 <code>.item:hover::before</code>。用 headless Chrome 实测，<code>CSS.supports(&#x27;selector(p::before:hover)&#x27;)</code> 返回 <code>false</code>，样式表里这条规则被直接丢弃；<code>p:hover::before</code> 能正常解析。</p>
<h2>::before 和 ::after 要注意什么</h2>
<p>MDN 说明，<code>::before</code> 会生成所选元素的第一个子元素，<code>::after</code> 生成最后一个子元素，它们常用来通过 <code>content</code> 加装饰，比如图标、引号。没有 <code>content</code>，这两个伪元素不会生成，这也是 clearfix 里要写 <code>content: &#x27;&#x27;</code> 的原因，见<a href="/questions/css-clear-float/">《清除浮动有哪几种方法？》</a>。</p>
<p>它们不能用在 <code>img</code> 这类替换元素上，因为替换元素的内容来自外部资源，不受文档样式影响。另外 MDN 不建议用 <code>::before</code> 添加有意义的内容，读屏软件不能可靠地读到它。</p>
<h2>常见追问</h2>
<p><strong>:is()、:not()、:has() 是伪类还是伪元素？</strong></p>
<blockquote>
<p>是伪类，而且是带括号参数的函数式伪类。它们最终选中的仍然是完整的元素，只是条件由括号里的选择器决定。<code>:has()</code> 的用法见<a href="/questions/css-has-selector/">《:has() 怎样根据后代或相邻元素设置样式？》</a>。</p>
</blockquote>
<p><strong>伪类和伪元素会影响优先级吗？</strong></p>
<blockquote>
<p>会。伪类和类选择器算同一级，伪元素和元素选择器算同一级。<code>:is()</code>、<code>:not()</code>、<code>:has()</code> 自己不计分，按括号里优先级最高的那个选择器算，<code>:where()</code> 则始终为 0。优先级的完整规则见<a href="/questions/css-cascade-specificity/">《层叠、优先级、继承和 !important 谁先决定样式？》</a>。</p>
</blockquote>`};export{e as default};