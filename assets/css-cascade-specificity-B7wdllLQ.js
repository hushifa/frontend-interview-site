var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同一个元素的同一个属性被好几条规则设置时，浏览器要决定听谁的，这个过程叫层叠。它按固定顺序比：来源和重要性、层叠层、选择器优先级、<code>@scope</code> 的作用域远近，最后是书写顺序。前面一步分出胜负，后面就不比了。</p>
<p>优先级按三列算：ID 个数、类和属性和伪类个数、元素和伪元素个数，从左往右逐列比。所以十个类也赢不了一个 ID。<code>:where()</code> 的优先级是 0，<code>:is()</code>、<code>:not()</code>、<code>:has()</code> 取参数里最高的那个。</p>
<p><code>!important</code> 会把顺序反过来。普通声明里后声明的层赢，加了 <code>!important</code> 后先声明的层赢，来源的顺序也一样反过来。</p>
<p>继承是最弱的。只有元素自己没有被任何规则直接设置这个属性时，才用从父元素继承来的值，父元素选择器的优先级再高也带不下来。</p>
</blockquote>
<h2>优先级怎么算</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-id">#nav</span> <span class="hljs-selector-tag">a</span> { }        <span class="hljs-comment">/* 1-0-1 */</span>
<span class="hljs-selector-class">.menu</span> <span class="hljs-selector-class">.item</span> <span class="hljs-selector-tag">a</span> { } <span class="hljs-comment">/* 0-2-1 */</span>
<span class="hljs-selector-tag">a</span><span class="hljs-selector-pseudo">:hover</span> { }       <span class="hljs-comment">/* 0-1-1 */</span>
<span class="hljs-selector-pseudo">:where</span>(<span class="hljs-selector-class">.menu</span>) <span class="hljs-selector-tag">a</span> { } <span class="hljs-comment">/* 0-0-1 */</span>
</code></pre></div>
<p>注释里的三个数字就是三列。比较时先比第一列，<code>#nav a</code> 有一个 ID，直接赢过另外三条，不管它们有多少个类。第一列相同再比第二列，以此类推。</p>
<p><code>:where(.menu) a</code> 里虽然写了类，但 <code>:where()</code> 不计优先级，所以只剩一个元素选择器。</p>
<p>还有几条规则：写在元素 <code>style</code> 属性上的内联样式，比任何选择器都优先。通配符 <code>*</code> 和 <code>&gt;</code>、空格这些组合符不计入优先级。</p>
<h2>层叠层为什么能无视优先级</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> reset, components, utilities;

<span class="hljs-keyword">@layer</span> components {
  <span class="hljs-selector-class">.button</span> { <span class="hljs-attribute">padding</span>: <span class="hljs-number">8px</span> <span class="hljs-number">16px</span>; }
}

<span class="hljs-keyword">@layer</span> utilities {
  <span class="hljs-selector-class">.p-0</span> { <span class="hljs-attribute">padding</span>: <span class="hljs-number">0</span>; }
}
</code></pre></div>
<p>元素同时有 <code>button</code> 和 <code>p-0</code> 两个类，最后 <code>padding</code> 是 0。这里两个选择器优先级一样，可是就算把 <code>.button</code> 写成 <code>#app .button</code>，结果还是 0。</p>
<p>原因是层叠层比优先级先比较。第一行声明了层的顺序，后声明的 <code>utilities</code> 赢，选择器优先级根本轮不到比较。没有放进任何层的样式，比所有层里的普通样式都优先。</p>
<p>这样组件库的样式可以放在低的层里，业务代码想覆盖时不用再拼命提高选择器优先级。</p>
<h2>加了 !important 为什么顺序反过来</h2>
<p>普通声明的来源顺序是：浏览器默认样式 &lt; 用户样式 &lt; 作者样式，作者就是写网页的人。加了 <code>!important</code> 后变成：作者 &lt; 用户 &lt; 浏览器默认。这样设计是为了让用户能用重要声明盖过网页，比如为了可读性强制放大字号。</p>
<p>层也一样会反过来，看下面的例子：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> base, theme;

<span class="hljs-keyword">@layer</span> base {
  <span class="hljs-selector-tag">a</span> { <span class="hljs-attribute">color</span>: red <span class="hljs-meta">!important</span>; }
}

<span class="hljs-keyword">@layer</span> theme {
  <span class="hljs-selector-tag">a</span> { <span class="hljs-attribute">color</span>: blue <span class="hljs-meta">!important</span>; }
}
</code></pre></div>
<p>链接是红色。按普通声明，后声明的 <code>theme</code> 应该赢，但两条都是重要声明，顺序反转，先声明的 <code>base</code> 层更优先。</p>
<p>另外，正在进行过渡的属性值优先级最高，动画的值则高于所有普通声明。</p>
<h2>父元素优先级更高，为什么子元素不听它的</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> { <span class="hljs-attribute">color</span>: gray; }
<span class="hljs-selector-tag">p</span> { <span class="hljs-attribute">color</span>: black; }
</code></pre></div>
<p><code>.card</code> 里的 <code>&lt;p&gt;</code> 是黑色。很多人会觉得 <code>.card</code> 是类选择器，优先级比 <code>p</code> 高，应该是灰色。</p>
<p>可是 <code>.card</code> 选中的是父元素，灰色传到 <code>&lt;p&gt;</code> 上是继承来的值。<code>p</code> 选择器直接选中了这个元素，直接命中的声明总是比继承值优先，不用比优先级。</p>
<p><code>color</code>、<code>font</code> 这类文字属性默认会继承，<code>margin</code>、<code>border</code> 这类默认不继承。想让不继承的属性继承，可以写 <code>inherit</code>。</p>
<h2>样式不生效时怎么查</h2>
<p>打开开发者工具的 Styles 面板，被覆盖的声明会被划掉，可以看到是哪条规则盖过了它。Computed 面板会显示每个属性的最终值，以及它来自哪条规则。</p>
<h2>常见追问</h2>
<p><strong>怎样避免选择器优先级越写越高？</strong></p>
<blockquote>
<p>用层叠层安排各部分样式的先后，后面的层天然能覆盖前面的。基础样式用 <code>:where()</code> 写成零优先级，方便别人覆盖。尽量不用 ID 选择器和 <code>!important</code>。</p>
</blockquote>`};export{e as default};