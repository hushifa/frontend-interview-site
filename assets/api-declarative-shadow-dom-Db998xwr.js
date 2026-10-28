var e={answerHtml:`<h2>简答</h2>
<ul>
<li>传统 Shadow DOM 只能在 JavaScript 里用 <code>attachShadow()</code> 创建，服务端渲染的 HTML 在脚本执行前没有组件样式和结构。</li>
<li>声明式写法：在宿主元素里放 <code>&lt;template shadowrootmode=&quot;open&quot;&gt;</code>，HTML 解析器直接把模板内容附加成 Shadow Root。</li>
<li>组件脚本加载后，应先读取 <code>this.shadowRoot</code>（closed 模式用 <code>ElementInternals.shadowRoot</code>）复用已有的根，没有时才调用 <code>attachShadow()</code>。</li>
<li><code>innerHTML</code> 不处理 <code>shadowrootmode</code>，动态插入要用 <code>setHTMLUnsafe()</code> 或 <code>Document.parseHTMLUnsafe()</code>。</li>
<li>主流浏览器都已支持 <code>shadowrootmode</code>，旧的 <code>shadowroot</code> 属性已废弃。</li>
</ul>
<h2>HTML</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">user-card</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">template</span> <span class="hljs-attr">shadowrootmode</span>=<span class="hljs-string">&quot;open&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">style</span>&gt;</span><span class="css">
      <span class="hljs-selector-pseudo">:host</span> { <span class="hljs-attribute">display</span>: block; <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#ddd</span>; <span class="hljs-attribute">padding</span>: <span class="hljs-number">12px</span>; }
    </span><span class="hljs-tag">&lt;/<span class="hljs-name">style</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">strong</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;name&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">slot</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;name&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">slot</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">strong</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>关注<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">template</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">slot</span>=<span class="hljs-string">&quot;name&quot;</span>&gt;</span>张三<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">user-card</span>&gt;</span>
</code></pre></div>
<p>页面在 JavaScript 加载前就显示带样式的卡片，插槽内容也已经投影进去。</p>
<h2>组件升级</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">UserCard</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">HTMLElement</span> {
  #internals = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachInternals</span>();

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">super</span>();
    <span class="hljs-keyword">const</span> root = <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-property">shadowRoot</span> ?? <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachShadow</span>({ <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;open&#x27;</span> });
    <span class="hljs-keyword">if</span> (!root.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;.name&#x27;</span>)) {
      root.<span class="hljs-property">innerHTML</span> = <span class="hljs-string">&#x27;&lt;strong class=&quot;name&quot;&gt;&lt;slot name=&quot;name&quot;&gt;&lt;/slot&gt;&lt;/strong&gt;&lt;button type=&quot;button&quot;&gt;关注&lt;/button&gt;&#x27;</span>;
    }
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">button</span> = root.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;button&#x27;</span>);
  }

  <span class="hljs-title function_">connectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">button</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">follow</span>());
  }
}

customElements.<span class="hljs-title function_">define</span>(<span class="hljs-string">&#x27;user-card&#x27;</span>, <span class="hljs-title class_">UserCard</span>);
</code></pre></div>
<ul>
<li>已有声明式根时，<code>attachShadow()</code> 不会报错，而是清空这个根的所有内容再返回它，服务端渲染的结构就丢了。所以要先判断。</li>
<li>页面上客户端新建的 <code>user-card</code> 没有声明式根，走 <code>attachShadow()</code> 分支，自己生成内容。</li>
</ul>
<h2>适用场景</h2>
<ul>
<li>需要服务端渲染、在意首屏和 SEO 的 Web Component。</li>
<li>设计系统组件同时供多种框架使用，并要求无 JavaScript 时也有基本展示。</li>
</ul>
<h2>注意事项</h2>
<ul>
<li>每个组件实例都要把 <code>&lt;style&gt;</code> 写进模板，HTML 体积会增加；可以在升级后改用 <code>adoptedStyleSheets</code> 共享样式。</li>
<li>声明式根里的事件监听仍要等脚本执行后才绑定，按钮在此之前点击无效。</li>
<li><code>shadowrootdelegatesfocus</code> 和 <code>shadowrootclonable</code> 属性分别对应 <code>attachShadow()</code> 的 <code>delegatesFocus</code> 和 <code>clonable</code> 选项。</li>
</ul>`};export{e as default};