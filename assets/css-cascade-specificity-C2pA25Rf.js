var e={answerHtml:`<p>“ID 比 class 优先，后写的覆盖先写的”只说中了 CSS 的一部分。浏览器为<strong>某个元素的某个属性</strong>决定值时，需要先找出适用的声明，再按层叠规则排序。选择器权重只在前面的比较仍然打平时起作用。</p>
<p>比如同一个按钮的颜色来自组件库、业务样式和行内样式，浏览器会分别处理它的 <code>color</code>、<code>background</code> 等属性，并不是一次挑中某个选择器后，就让整个规则块覆盖其他规则块。</p>
<h3>先比较声明的身份，再比较选择器</h3>
<p>先排除不匹配当前元素、媒体条件不成立等不适用的规则。随后，来源与重要性的大致优先顺序如下，越靠下越高：</p>
<table><thead><tr><th>层级</th><th>声明或正在生效的值</th></tr></thead><tbody><tr><td>1</td><td>浏览器默认样式中的普通声明</td></tr><tr><td>2</td><td>用户样式中的普通声明</td></tr><tr><td>3</td><td>网站作者的普通声明</td></tr><tr><td>4</td><td>CSS 关键帧动画产生的值</td></tr><tr><td>5</td><td>网站作者的 <code>!important</code> 声明</td></tr><tr><td>6</td><td>用户样式的 <code>!important</code> 声明</td></tr><tr><td>7</td><td>浏览器样式的 <code>!important</code> 声明</td></tr><tr><td>8</td><td>正在进行的 CSS 过渡产生的值</td></tr></tbody></table>
<p>“用户样式”指用户为阅读体验设置的样式，例如通过浏览器相关功能或扩展应用的样式，不是网站代码里切换主题的 class。用户的重要声明可以压过网站的重要声明，这使用户仍有机会强制使用适合自己的文字颜色等设置。</p>
<p>表中动画、过渡指它们正在为该属性产生的值，不代表声明了 <code>transition</code>，这个属性就永远拥有最高优先级。</p>
<p>在同一来源与重要性中，还要处理 <code>@layer</code>、行内样式等因素。条件都相同时，才比较选择器特异性；仍相同则比较 <code>@scope</code> 的作用域接近程度，最后才是源码出现顺序。没有使用作用域规则时，通常不必额外考虑作用域接近程度。</p>
<h3>为什么 class 能盖过 ID</h3>
<p>下面两条规则都命中 <code>&lt;button id=&quot;save&quot; class=&quot;button&quot;&gt;保存&lt;/button&gt;</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> vendor, app;

<span class="hljs-keyword">@layer</span> vendor {
  <span class="hljs-selector-id">#save</span> {
    <span class="hljs-attribute">color</span>: red;
  }
}

<span class="hljs-keyword">@layer</span> app {
  <span class="hljs-selector-class">.button</span> {
    <span class="hljs-attribute">color</span>: blue;
  }
}
</code></pre></div>
<p>按钮是蓝色。两个声明都是作者的普通声明，但 <code>app</code> 层晚于 <code>vendor</code> 层，先在层的比较中获胜，不需要再让 ID 与 class 比大小。</p>
<p>对于同一来源的普通声明，后声明的层高于先声明的层，不在任何层里的普通样式又高于层内普通样式。对于 <code>!important</code> 声明，层的顺序会反过来：早声明的层优先，层内的重要声明也高于未分层的重要声明。因此不能把普通声明的层顺序直接套在 <code>!important</code> 上。</p>
<p>行内普通样式高于作者样式表里的普通声明，但可以被作者样式表的 <code>!important</code> 覆盖。行内 <code>!important</code> 又高于作者样式表中的重要声明，不过仍然不能压过用户或浏览器的重要声明以及正在生效的过渡值。</p>
<h3>选择器特异性怎么比较</h3>
<p>通常把特异性写成三列：ID 数量、类/属性/伪类数量、类型/伪元素数量，<strong>从左往右逐列比较，不是十进制加权求和</strong>。再多的 class 也不会自动“进位”成一个 ID。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-id">#app</span> <span class="hljs-selector-class">.button</span> { <span class="hljs-attribute">color</span>: red; }       <span class="hljs-comment">/* 1-1-0 */</span>
<span class="hljs-selector-class">.panel</span> <span class="hljs-selector-class">.toolbar</span> <span class="hljs-selector-tag">button</span> { <span class="hljs-attribute">color</span>: blue; } <span class="hljs-comment">/* 0-2-1 */</span>
</code></pre></div>
<p>假设其他层叠条件相同，第一条获胜。组合符 <code>&gt;</code>、<code>+</code>、空格不会增加特异性。</p>
<p><code>:where(...)</code> 以及它的参数整体贡献为零，适合写容易被业务覆盖的默认样式。<code>:is()</code>、<code>:not()</code>、<code>:has()</code> 自身不再额外算一个普通伪类，其贡献取参数列表中特异性最高的选择器。例如 <code>.button:is(.primary, #save)</code> 的特异性是 <code>1-1-0</code>，即便某个元素只是通过 <code>.primary</code> 分支匹配，也不能忽略参数里的 <code>#save</code>。</p>
<h3>继承为什么不参与“父子权重大战”</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;page&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;label&quot;</span>&gt;</span>保存成功<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-id">#page</span> { <span class="hljs-attribute">color</span>: red <span class="hljs-meta">!important</span>; }
<span class="hljs-selector-class">.label</span> { <span class="hljs-attribute">color</span>: blue; }
</code></pre></div>
<p>文字仍然是蓝色。父级的声明在为父级决定颜色，子级的声明在为子级决定颜色，两者没有直接竞争。继承传递的是父级的计算值，而不是它的选择器特异性或 <code>!important</code> 身份。</p>
<p>删掉 <code>.label</code> 的颜色声明后，<code>color</code> 这种默认继承的属性会从父级得到红色。像 <code>margin</code> 这种默认不继承的属性，缺少声明时通常使用初始值，而不是复制父级的外边距。</p>
<p>另外，显式写 <code>color: inherit</code> 会要求继承；<code>initial</code> 要求初始值；<code>unset</code> 对可继承属性按 <code>inherit</code> 处理，对不可继承属性按 <code>initial</code> 处理。所以“有自己的声明就绝不继承”也不准确，声明本身就可能要求继承。</p>
<p>遇到样式不生效，先在 DevTools 找到具体属性，看声明是没匹配、被哪一层覆盖，还是值来自继承。确认这些后再改选择器。直接叠加 ID 或 <code>!important</code>，可能只是把问题推给下一次覆盖。</p>`};export{e as default};