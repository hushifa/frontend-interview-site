var e={answerHtml:`<h2>简答</h2>
<ul>
<li><strong>Custom Elements</strong>：<code>customElements.define(&#x27;my-tag&#x27;, Class)</code> 注册新标签，提供 <code>connectedCallback</code>、<code>disconnectedCallback</code>、<code>attributeChangedCallback</code> 等生命周期，名称必须包含连字符。</li>
<li><strong>Shadow DOM</strong>：<code>attachShadow({ mode: &#x27;open&#x27; })</code> 创建独立的 DOM 子树，外部样式不会选中内部元素，内部样式也不会泄漏出去。</li>
<li><strong><code>&lt;template&gt;</code></strong>：内容被解析但不渲染、不执行脚本、不加载图片，用 <code>content.cloneNode(true)</code> 复制使用。</li>
<li><strong><code>&lt;slot&gt;</code></strong>：在 Shadow DOM 中留出位置，显示使用者传入的子元素。</li>
<li>组件对外通过属性（attribute）、JavaScript 属性（property）和自定义事件通信。</li>
</ul>
<h2>示例</h2>
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
<h2>样式边界</h2>
<ul>
<li>继承属性（<code>color</code>、<code>font</code>）和 CSS 自定义属性会穿透进 Shadow DOM，这是给组件做主题的主要方式。</li>
<li>外部可以用 <code>::part(button)</code> 修改带 <code>part</code> 属性的内部元素。</li>
<li><code>:host</code> 选中宿主元素，<code>::slotted()</code> 选中插槽中的顶层元素。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>事件怎样传出 Shadow DOM：设置 <code>composed: true</code>；事件跨出边界后，<code>event.target</code> 会被重定向成宿主元素。</li>
<li>和 React、Vue 组件的区别：Web Components 是浏览器原生的，不依赖框架，但没有内置的响应式和模板绑定，通常借助 Lit 这类库编写。</li>
<li>服务端渲染怎么办，见<a href="/questions/api-declarative-shadow-dom/">《Declarative Shadow DOM 适合解决什么问题？》</a>。</li>
</ul>`};export{e as default};