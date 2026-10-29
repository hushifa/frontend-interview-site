var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>想写一个 <code>&lt;app-button&gt;</code>，在 React、Vue 和普通页面里都能用，就要靠浏览器原生的 Web Components。它由几样东西配合完成。</p>
<p>Custom Elements 负责“定义新标签”。<code>customElements.define(&#x27;app-button&#x27;, Class)</code> 注册以后，浏览器就认识这个标签，还会在它插入、移除、属性变化时调用 <code>connectedCallback</code>、<code>disconnectedCallback</code>、<code>attributeChangedCallback</code>。名字必须带连字符。</p>
<p>Shadow DOM 负责“隔离”。<code>attachShadow({ mode: &#x27;open&#x27; })</code> 给元素造一棵独立的 DOM 子树，外面的样式选不中里面的元素，里面的样式也漏不出去。<code>&lt;template&gt;</code> 负责“存模板”，内容会被解析，但不渲染、不执行脚本、不加载图片，用的时候 <code>content.cloneNode(true)</code> 复制一份。<code>&lt;slot&gt;</code> 在 Shadow DOM 里留个位置，显示使用者传进来的子元素。</p>
<p>组件和外界通过 attribute、JavaScript 属性和自定义事件通信。要注意事件想传出 Shadow DOM，得设置 <code>composed: true</code>。</p>
</blockquote>
<h2>写一个按钮组件</h2>
<p>下面把三样东西放在一起：template 存结构和样式，Shadow DOM 隔离，Custom Elements 注册标签。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> template = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;template&#x27;</span>);
template.<span class="hljs-property">innerHTML</span> = <span class="hljs-string">\`
  &lt;style&gt;
    :host { display: inline-flex; gap: 4px; }
    :host([variant=&#x27;danger&#x27;]) button { background: crimson; color: white; }
  &lt;/style&gt;
  &lt;button part=&quot;button&quot;&gt;&lt;slot&gt;&lt;/slot&gt;&lt;/button&gt;
\`</span>;

<span class="hljs-keyword">class</span> <span class="hljs-title class_">AppButton</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">HTMLElement</span> {
  <span class="hljs-keyword">static</span> observedAttributes = [<span class="hljs-string">&#x27;disabled&#x27;</span>];

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">super</span>();
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachShadow</span>({ <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;open&#x27;</span> }).<span class="hljs-title function_">append</span>(template.<span class="hljs-property">content</span>.<span class="hljs-title function_">cloneNode</span>(<span class="hljs-literal">true</span>));
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">button</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-property">shadowRoot</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;button&#x27;</span>);
  }

  <span class="hljs-title function_">attributeChangedCallback</span>(<span class="hljs-params">name, oldValue, newValue</span>) {
    <span class="hljs-keyword">if</span> (name === <span class="hljs-string">&#x27;disabled&#x27;</span>) <span class="hljs-variable language_">this</span>.<span class="hljs-property">button</span>.<span class="hljs-property">disabled</span> = newValue !== <span class="hljs-literal">null</span>;
  }

  <span class="hljs-title function_">connectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">button</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-variable language_">this</span>.#onClick);
  }

  <span class="hljs-title function_">disconnectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">button</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-variable language_">this</span>.#onClick);
  }

  #onClick = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">dispatchEvent</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">CustomEvent</span>(<span class="hljs-string">&#x27;app-click&#x27;</span>, { <span class="hljs-attr">bubbles</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">composed</span>: <span class="hljs-literal">true</span> }));
  };
}

customElements.<span class="hljs-title function_">define</span>(<span class="hljs-string">&#x27;app-button&#x27;</span>, <span class="hljs-title class_">AppButton</span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">app-button</span> <span class="hljs-attr">variant</span>=<span class="hljs-string">&quot;danger&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">app-button</span>&gt;</span>
</code></pre></div>
<p>“删除”两个字是怎么显示到按钮里的？它是 <code>app-button</code> 的子元素，Shadow DOM 里的 <code>&lt;slot&gt;</code> 留了位置，就把它显示在 <code>&lt;button&gt;</code> 里面。</p>
<p>为什么 template 只创建一次？因为它是模板，每个实例 <code>cloneNode(true)</code> 复制一份就行，不用每次都重新解析 HTML。</p>
<p><code>observedAttributes</code> 列出要监听的属性，只有列出来的属性变化时才会调用 <code>attributeChangedCallback</code>。属性被移除时 <code>newValue</code> 是 <code>null</code>，所以用 <code>newValue !== null</code> 判断是否禁用。</p>
<h2>样式隔离了，主题怎么改</h2>
<p>Shadow DOM 挡住了外部的选择器，但不是什么都挡。<code>color</code>、<code>font</code> 这类继承属性，以及 CSS 自定义属性（<code>--xxx</code>），都会穿透进来。所以给组件做主题，主要靠 CSS 自定义属性。</p>
<p>如果想让外部直接改某个内部元素，就给它加 <code>part</code> 属性，外部用 <code>::part(button)</code> 选中。组件内部写样式时，<code>:host</code> 选中宿主元素本身，<code>::slotted()</code> 选中插槽里的顶层元素。</p>
<h2>常见追问</h2>
<p><strong>事件怎样传出 Shadow DOM？</strong></p>
<blockquote>
<p>派发事件时设置 <code>composed: true</code>，事件才能跨出 Shadow DOM 边界。跨出去以后，外面看到的 <code>event.target</code> 会被重定向成宿主元素，看不到内部的按钮。</p>
</blockquote>
<p><strong>和 React、Vue 组件有什么区别？</strong></p>
<blockquote>
<p>Web Components 是浏览器原生的，不依赖任何框架。但它没有内置的响应式和模板绑定，状态变了要自己更新 DOM，所以通常会借助 Lit 这类库来写。</p>
</blockquote>
<p><strong>服务端渲染怎么办？</strong></p>
<blockquote>
<p>用声明式 Shadow DOM，把 Shadow Root 直接写进 HTML，见<a href="/questions/api-declarative-shadow-dom/">《Declarative Shadow DOM 适合解决什么问题？》</a>。</p>
</blockquote>`};export{e as default};