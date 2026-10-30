var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>虚拟 DOM 就是用普通对象描述界面。<code>h(&#x27;li&#x27;, { className: &#x27;item&#x27; }, &#x27;苹果&#x27;)</code> 返回 <code>{ type: &#x27;li&#x27;, props: { className: &#x27;item&#x27; }, children: [&#x27;苹果&#x27;] }</code>，这一步不碰真实 DOM。Vue 的 <code>h()</code>、React 的 <code>createElement</code> 做的都是这件事。</p>
<p><code>h</code> 里要整理子节点。子节点可能是 <code>items.map(...)</code> 返回的数组，要摊平；条件渲染会留下 <code>false</code>、<code>null</code>，要去掉。React 文档写明，<code>null</code>、<code>undefined</code>、<code>true</code>、<code>false</code> 都是空节点。</p>
<p><code>render</code> 是递归：遇到字符串或数字，用 <code>document.createTextNode</code> 建文本节点；遇到元素，用 <code>document.createElement</code> 建元素，再按属性名分别处理，<code>className</code> 写成 <code>class</code> 特性，<code>style</code> 对象逐项赋值，<code>on</code> 开头的函数注册成事件监听，其他写成普通特性；最后把子节点逐个建好再 <code>appendChild</code> 进去。</p>
<p>要注意，这只是首次挂载。数据变了以后，真正的框架不会整棵重建，而是对比新旧虚拟 DOM 只改变化的部分，那是 diff 要解决的问题。另外文本要用 <code>createTextNode</code>，不要拼成 HTML 字符串再赋给 <code>innerHTML</code>，否则用户输入里的标签会被当成 HTML 解析。</p>
</blockquote>
<h2>手写 h 和 render</h2>
<p><code>render</code> 不直接用全局的 <code>document</code>，而是把它当参数传进来。这样同一份代码在浏览器里传真实的 <code>document</code>，在 Node.js 里可以传一个只实现了几个方法的模拟对象，方便运行验证。看最后一个 <code>li</code> 的三个子节点是怎么来的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">h</span>(<span class="hljs-params">type, props, ...children</span>) {
  <span class="hljs-keyword">return</span> {
    type,
    <span class="hljs-attr">props</span>: props ?? {},
    <span class="hljs-comment">// 子节点可能是嵌套数组（比如 map 的结果），也可能是字符串和数字，统一摊平后再处理。</span>
    <span class="hljs-attr">children</span>: children
      .<span class="hljs-title function_">flat</span>(<span class="hljs-title class_">Infinity</span>)
      .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">child</span>) =&gt;</span> child !== <span class="hljs-literal">null</span> &amp;&amp; child !== <span class="hljs-literal">undefined</span> &amp;&amp; child !== <span class="hljs-literal">false</span> &amp;&amp; child !== <span class="hljs-literal">true</span>),
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">vnode, container, doc</span>) {
  container.<span class="hljs-title function_">appendChild</span>(<span class="hljs-title function_">createDom</span>(vnode, doc));
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createDom</span>(<span class="hljs-params">vnode, doc</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> vnode === <span class="hljs-string">&#x27;string&#x27;</span> || <span class="hljs-keyword">typeof</span> vnode === <span class="hljs-string">&#x27;number&#x27;</span>) {
    <span class="hljs-keyword">return</span> doc.<span class="hljs-title function_">createTextNode</span>(<span class="hljs-title class_">String</span>(vnode));
  }
  <span class="hljs-keyword">const</span> el = doc.<span class="hljs-title function_">createElement</span>(vnode.<span class="hljs-property">type</span>);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [key, value] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(vnode.<span class="hljs-property">props</span>)) {
    <span class="hljs-keyword">if</span> (key.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;on&#x27;</span>) &amp;&amp; <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;function&#x27;</span>) {
      el.<span class="hljs-title function_">addEventListener</span>(key.<span class="hljs-title function_">slice</span>(<span class="hljs-number">2</span>).<span class="hljs-title function_">toLowerCase</span>(), value);
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;className&#x27;</span>) {
      el.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;class&#x27;</span>, value);
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;style&#x27;</span> &amp;&amp; <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span>) {
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, v] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(value)) el.<span class="hljs-property">style</span>[name] = v;
    } <span class="hljs-keyword">else</span> {
      el.<span class="hljs-title function_">setAttribute</span>(key, <span class="hljs-title class_">String</span>(value));
    }
  }
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> child <span class="hljs-keyword">of</span> vnode.<span class="hljs-property">children</span>) el.<span class="hljs-title function_">appendChild</span>(<span class="hljs-title function_">createDom</span>(child, doc));
  <span class="hljs-keyword">return</span> el;
}

<span class="hljs-comment">// 用来演示的极简 document，只实现 render 用到的几个方法。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createFakeDocument</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">createElement</span>(<span class="hljs-params">tagName</span>) {
    <span class="hljs-keyword">return</span> {
      tagName,
      <span class="hljs-attr">attributes</span>: {},
      <span class="hljs-attr">style</span>: {},
      <span class="hljs-attr">childNodes</span>: [],
      <span class="hljs-attr">listeners</span>: {},
      <span class="hljs-title function_">setAttribute</span>(<span class="hljs-params">name, value</span>) { <span class="hljs-variable language_">this</span>.<span class="hljs-property">attributes</span>[name] = value; },
      <span class="hljs-title function_">appendChild</span>(<span class="hljs-params">child</span>) { <span class="hljs-variable language_">this</span>.<span class="hljs-property">childNodes</span>.<span class="hljs-title function_">push</span>(child); <span class="hljs-keyword">return</span> child; },
      <span class="hljs-title function_">addEventListener</span>(<span class="hljs-params">type, fn</span>) { <span class="hljs-variable language_">this</span>.<span class="hljs-property">listeners</span>[type] = fn; },
    };
  }
  <span class="hljs-keyword">return</span> {
    createElement,
    <span class="hljs-attr">createTextNode</span>: <span class="hljs-function">(<span class="hljs-params">text</span>) =&gt;</span> ({ <span class="hljs-attr">nodeType</span>: <span class="hljs-number">3</span>, <span class="hljs-attr">textContent</span>: text }),
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toHtml</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">if</span> (node.<span class="hljs-property">nodeType</span> === <span class="hljs-number">3</span>) <span class="hljs-keyword">return</span> node.<span class="hljs-property">textContent</span>;
  <span class="hljs-keyword">const</span> attrs = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(node.<span class="hljs-property">attributes</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[k, v]</span>) =&gt;</span> <span class="hljs-string">\` <span class="hljs-subst">\${k}</span>=&quot;<span class="hljs-subst">\${v}</span>&quot;\`</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> style = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(node.<span class="hljs-property">style</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[k, v]</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${k}</span>:<span class="hljs-subst">\${v}</span>\`</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;;&#x27;</span>);
  <span class="hljs-keyword">const</span> styleAttr = style ? <span class="hljs-string">\` style=&quot;<span class="hljs-subst">\${style}</span>&quot;\`</span> : <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`&lt;<span class="hljs-subst">\${node.tagName}</span><span class="hljs-subst">\${attrs}</span><span class="hljs-subst">\${styleAttr}</span>&gt;<span class="hljs-subst">\${node.childNodes.map(toHtml).join(<span class="hljs-string">&#x27;&#x27;</span>)}</span>&lt;/<span class="hljs-subst">\${node.tagName}</span>&gt;\`</span>;
}

<span class="hljs-keyword">const</span> doc = <span class="hljs-title function_">createFakeDocument</span>();
<span class="hljs-keyword">const</span> root = doc.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;div&#x27;</span>);
<span class="hljs-keyword">let</span> clicks = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> items = [<span class="hljs-string">&#x27;苹果&#x27;</span>, <span class="hljs-string">&#x27;香蕉&#x27;</span>];

<span class="hljs-keyword">const</span> vnode = <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;ul&#x27;</span>, { <span class="hljs-attr">className</span>: <span class="hljs-string">&#x27;list&#x27;</span>, <span class="hljs-attr">style</span>: { <span class="hljs-attr">color</span>: <span class="hljs-string">&#x27;red&#x27;</span> } },
  items.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;li&#x27;</span>, <span class="hljs-literal">null</span>, item)),
  <span class="hljs-literal">false</span>,
  <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;li&#x27;</span>, { <span class="hljs-attr">onClick</span>: <span class="hljs-function">() =&gt;</span> { clicks += <span class="hljs-number">1</span>; } }, <span class="hljs-string">&#x27;共 &#x27;</span>, items.<span class="hljs-property">length</span>, <span class="hljs-string">&#x27; 项&#x27;</span>),
);

<span class="hljs-title function_">render</span>(vnode, root, doc);
<span class="hljs-keyword">const</span> ul = root.<span class="hljs-property">childNodes</span>[<span class="hljs-number">0</span>];

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toHtml</span>(ul)); <span class="hljs-comment">// &lt;ul class=&quot;list&quot; style=&quot;color:red&quot;&gt;&lt;li&gt;苹果&lt;/li&gt;&lt;li&gt;香蕉&lt;/li&gt;&lt;li&gt;共 2 项&lt;/li&gt;&lt;/ul&gt;</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ul.<span class="hljs-property">childNodes</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ul.<span class="hljs-property">childNodes</span>[<span class="hljs-number">2</span>].<span class="hljs-property">childNodes</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
ul.<span class="hljs-property">childNodes</span>[<span class="hljs-number">2</span>].<span class="hljs-property">listeners</span>.<span class="hljs-title function_">click</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(clicks); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>先看 <code>h</code> 的结果。<code>items.map(...)</code> 返回的是数组，它整个作为 <code>h(&#x27;ul&#x27;, ...)</code> 的一个子节点传进来，<code>flat(Infinity)</code> 把它摊平成两个 <code>li</code>。<code>false</code> 来自条件渲染的写法，比如 <code>isEmpty &amp;&amp; h(&#x27;p&#x27;, null, &#x27;暂无&#x27;)</code>，条件不成立时留下的就是 <code>false</code>，被过滤掉了。所以 <code>ul</code> 最后只有 3 个子节点。</p>
<p>最后一个 <code>li</code> 有 3 个子节点，因为 <code>&#x27;共 &#x27;</code>、<code>2</code>、<code>&#x27; 项&#x27;</code> 是三个参数，各自建了一个文本节点。数字 <code>2</code> 在 <code>createDom</code> 里先转成字符串，再交给 <code>createTextNode</code>。浏览器把相邻的文本节点显示在一起，所以页面上看到的是“共 2 项”。</p>
<p>为什么 <code>true</code> 也要过滤？因为 React 把 <code>null</code>、<code>undefined</code>、<code>true</code>、<code>false</code> 都当作空节点，不渲染出任何东西，这里也照这个规则。注意数字 <code>0</code> 不在其中，<code>count &amp;&amp; h(...)</code> 在 <code>count</code> 为 0 时会渲染出一个“0”。</p>
<h2>属性为什么要分几种处理</h2>
<p><code>props</code> 里的东西不全是 HTML 特性，混在一起直接 <code>setAttribute</code> 会出问题。</p>
<p><code>className</code> 是 JavaScript 这一侧的名字，因为 <code>class</code> 是保留字，对应的 HTML 特性叫 <code>class</code>，所以要换名字再写。<code>style</code> 传的是对象，<code>setAttribute(&#x27;style&#x27;, obj)</code> 只会得到 <code>&quot;[object Object]&quot;</code>，要逐项写到元素的 <code>style</code> 上；MDN 说明 <code>element.style</code> 读写的是元素的行内样式。<code>onClick</code> 是函数，写成特性没有意义，要去掉 <code>on</code> 前缀、转成小写，用 <code>addEventListener(&#x27;click&#x27;, fn)</code> 注册。</p>
<p>这只是最常见的几类。真实框架还要处理 <code>value</code>、<code>checked</code> 这类应该设置 DOM 属性而不是 HTML 特性的情况，以及 <code>key</code>、<code>ref</code> 这类根本不该出现在 DOM 上的特殊属性。React 文档写明，<code>key</code> 和 <code>ref</code> 不会出现在 <code>element.props</code> 上。</p>
<h2>为什么不拼 HTML 字符串</h2>
<p>也可以让 <code>render</code> 输出 HTML 字符串，再赋给 <code>container.innerHTML</code>，服务端渲染就是这样输出的。可是这样一来，文本里的 <code>&lt;</code>、<code>&amp;</code> 都必须先转义，漏一个地方，用户输入的 <code>&lt;img onerror=...&gt;</code> 就会被浏览器当成标签执行。用 <code>createTextNode</code> 建文本节点，内容始终是纯文本，不会被解析成 HTML。</p>
<p>另外字符串没法携带事件函数，拼完以后还得再找到元素去绑定事件。直接建 DOM 节点时，可以在创建的同时注册监听。</p>
<h2>数据变了以后怎么办</h2>
<p>上面的 <code>render</code> 每次都从头建一棵新的 DOM 树。数据一变就整棵重建，代价大，原来节点上的状态也跟着没了。框架的做法是保留上一次的虚拟 DOM，生成新的以后两边对比，只把差异应用到真实 DOM 上。React 的做法见<a href="/questions/react-diff/">《React 的 diff 算法怎样处理单节点和多节点？key 起什么作用？和 Vue 有什么不同？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>h</code> 要把 <code>props</code> 为 <code>null</code> 的情况变成空对象？</strong></p>
<blockquote>
<p>不写属性时通常传 <code>null</code>，后面遍历属性时就不用每次判断。React 文档写明，<code>createElement</code> 的 <code>props</code> 传 <code>null</code> 和传空对象效果一样。</p>
</blockquote>
<p><strong>怎样支持函数组件？</strong></p>
<blockquote>
<p>在 <code>createDom</code> 里多判断一种情况：<code>vnode.type</code> 是函数时，就用 <code>{ ...vnode.props, children: vnode.children }</code> 调用它，拿到它返回的虚拟 DOM，再对返回值递归调用 <code>createDom</code>。组件本身不对应任何真实节点，只负责产出下一层的描述。加上状态以后的写法见<a href="/questions/react-mini-react/">《怎样写一个 mini React（createElement、render、useState）？》</a>。</p>
</blockquote>`};export{e as default};