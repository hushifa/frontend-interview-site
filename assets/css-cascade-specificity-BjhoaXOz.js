var e={answerHtml:`<h2>简答</h2>
<ul>
<li>比较顺序：来源和重要性 → 层叠层 → 优先级 → 作用域远近（<code>@scope</code>）→ 源码顺序。前一步分出胜负就不再往后比。</li>
<li>优先级按 (ID, 类/属性/伪类, 元素/伪元素) 三列逐列比较，十个类也赢不了一个 ID。</li>
<li><code>!important</code> 会反转来源和层的顺序：普通声明里后声明的层胜出，重要声明里先声明的层胜出。</li>
<li>继承只在元素自身没有匹配声明时生效，任何直接命中的声明都比继承值优先。</li>
<li><code>:where()</code> 的优先级为 0，<code>:is()</code>、<code>:not()</code>、<code>:has()</code> 取参数中最高的优先级。</li>
</ul>
<h2>优先级</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-id">#nav</span> <span class="hljs-selector-tag">a</span> { }        <span class="hljs-comment">/* 1-0-1 */</span>
<span class="hljs-selector-class">.menu</span> <span class="hljs-selector-class">.item</span> <span class="hljs-selector-tag">a</span> { } <span class="hljs-comment">/* 0-2-1 */</span>
<span class="hljs-selector-tag">a</span><span class="hljs-selector-pseudo">:hover</span> { }       <span class="hljs-comment">/* 0-1-1 */</span>
<span class="hljs-selector-pseudo">:where</span>(<span class="hljs-selector-class">.menu</span>) <span class="hljs-selector-tag">a</span> { } <span class="hljs-comment">/* 0-0-1 */</span>
</code></pre></div>
<p>内联 <code>style</code> 属性比任何选择器都优先。通配符 <code>*</code> 和组合符不计入优先级。</p>
<h2>层叠层</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> reset, components, utilities;

<span class="hljs-keyword">@layer</span> components {
  <span class="hljs-selector-class">.button</span> { <span class="hljs-attribute">padding</span>: <span class="hljs-number">8px</span> <span class="hljs-number">16px</span>; }
}

<span class="hljs-keyword">@layer</span> utilities {
  <span class="hljs-selector-class">.p-0</span> { <span class="hljs-attribute">padding</span>: <span class="hljs-number">0</span>; }
}
</code></pre></div>
<p>后声明的 <code>utilities</code> 胜出，与选择器优先级无关。未放进任何层的样式优先于所有层里的普通样式。这让组件库样式可以放在低层，业务覆盖不必提高优先级。</p>
<h2>!important 的顺序</h2>
<p>普通声明：用户代理 &lt; 用户 &lt; 作者。重要声明：作者 &lt; 用户 &lt; 用户代理。层也一样反转：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> base, theme;

<span class="hljs-keyword">@layer</span> base {
  <span class="hljs-selector-tag">a</span> { <span class="hljs-attribute">color</span>: red <span class="hljs-meta">!important</span>; }
}

<span class="hljs-keyword">@layer</span> theme {
  <span class="hljs-selector-tag">a</span> { <span class="hljs-attribute">color</span>: blue <span class="hljs-meta">!important</span>; }
}
</code></pre></div>
<p>链接是红色，因为对重要声明来说先声明的 <code>base</code> 层更优先。正在过渡中的属性值优先级最高，动画值高于所有普通声明。</p>
<h2>继承</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> { <span class="hljs-attribute">color</span>: gray; }
<span class="hljs-selector-tag">p</span> { <span class="hljs-attribute">color</span>: black; }
</code></pre></div>
<p><code>.card</code> 里的 <code>&lt;p&gt;</code> 是黑色。<code>p</code> 选择器直接命中元素，父元素的 <code>.card</code> 即使优先级更高，传下来的也只是继承值。<code>color</code>、<code>font</code> 等文本属性默认继承，<code>margin</code>、<code>border</code> 等不继承，可以用 <code>inherit</code> 强制继承。</p>
<h2>排查方法</h2>
<p>在开发者工具的 Styles 面板查看被划掉的声明，以及它是被哪条规则覆盖的。Computed 面板会显示最终值来自哪里。</p>
<h2>常见追问</h2>
<ul>
<li>怎样避免优先级越写越高？用层叠层分配顺序，用 <code>:where()</code> 写低优先级的基础样式，避免 ID 选择器和 <code>!important</code>。</li>
</ul>`};export{e as default};