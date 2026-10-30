var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个表单渲染函数里写着 <code>if (type === &#x27;text&#x27;) ... else if (type === &#x27;select&#x27;) ...</code>，每次产品要加一种字段，都得打开这个函数改一遍，改着改着就把旧字段改坏了。SOLID 讨论的就是怎样组织代码，让改动少、影响小。它是五条原则的首字母：单一职责、开闭、里氏替换、接口隔离、依赖倒置。</p>
<p>其中开闭原则说的是：对扩展开放，对修改关闭。意思是加新功能时，尽量通过新增代码来完成，而不是改已经稳定的代码。上面的表单就可以改成一张注册表，每种字段一个渲染函数，新增字段只要注册一项，渲染函数本身不动。</p>
<p>前端里到处是这个思路。组件留出插槽或者 <code>children</code>，使用方往里放内容，不用改组件源码；webpack、Vite、Babel 都靠插件扩展；请求库用拦截器加功能。其他几条也有对应：一个组件只做一件事是单一职责，组件通过 props 接收依赖而不是直接引用全局单例，接近依赖倒置。</p>
<p>要注意，这些原则是用来降低改动成本的，不是越抽象越好。只有两三种情况、以后也不太会变时，直接写 if-else 更清楚；为了“符合原则”提前加一层层抽象，反而让代码更难读。</p>
</blockquote>
<h2>用注册表实现开闭</h2>
<p>下面的渲染函数不认识任何具体字段，它只负责从注册表里查出渲染函数并调用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 对扩展开放：新增字段类型只往表里注册，不改 renderField</span>
<span class="hljs-keyword">const</span> renderers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">registerField</span>(<span class="hljs-params">type, render</span>) {
  renderers.<span class="hljs-title function_">set</span>(type, render);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">renderField</span>(<span class="hljs-params">field</span>) {
  <span class="hljs-keyword">const</span> render = renderers.<span class="hljs-title function_">get</span>(field.<span class="hljs-property">type</span>);
  <span class="hljs-keyword">if</span> (!render) <span class="hljs-keyword">return</span> <span class="hljs-string">\`[未知字段 <span class="hljs-subst">\${field.type}</span>]\`</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">render</span>(field);
}

<span class="hljs-title function_">registerField</span>(<span class="hljs-string">&#x27;text&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">field</span>) =&gt;</span> <span class="hljs-string">\`&lt;input name=&quot;<span class="hljs-subst">\${field.name}</span>&quot;&gt;\`</span>);
<span class="hljs-title function_">registerField</span>(<span class="hljs-string">&#x27;select&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">field</span>) =&gt;</span> <span class="hljs-string">\`&lt;select name=&quot;<span class="hljs-subst">\${field.name}</span>&quot;&gt;<span class="hljs-subst">\${field.options.length}</span> 项&lt;/select&gt;\`</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">renderField</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;title&#x27;</span> }));    <span class="hljs-comment">// &lt;input name=&quot;title&quot;&gt;</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">renderField</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;date&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;deadline&#x27;</span> })); <span class="hljs-comment">// [未知字段 date]</span>

<span class="hljs-comment">// 后来需求要日期字段：新增一处注册，renderField 一行没动</span>
<span class="hljs-title function_">registerField</span>(<span class="hljs-string">&#x27;date&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">field</span>) =&gt;</span> <span class="hljs-string">\`&lt;input type=&quot;date&quot; name=&quot;<span class="hljs-subst">\${field.name}</span>&quot;&gt;\`</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">renderField</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;date&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;deadline&#x27;</span> })); <span class="hljs-comment">// &lt;input type=&quot;date&quot; name=&quot;deadline&quot;&gt;</span>
</code></pre></div>
<p>第一次渲染 <code>date</code> 时还没有注册，所以返回“未知字段”。注册以后再渲染就正常了，而 <code>renderField</code> 的代码完全没改。</p>
<p>这样做的好处是什么？已经测过、上线的 <code>renderField</code> 不用再动，新增字段的人只需要关心自己那一个渲染函数，不会误伤别的字段。低代码平台的物料注册、表单引擎的自定义控件，用的都是这个思路。</p>
<h2>组件里的开闭原则</h2>
<p>组件同样可以对扩展开放。比如一个卡片组件，如果标题、操作按钮的样式都靠 props 开关控制，每多一种需求就要多一个 props，组件越改越复杂。改成留出插槽，使用方自己决定往里放什么：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Card</span>(<span class="hljs-params">{ title, actions, children }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;card&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">header</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>{title}<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
        {actions}
      <span class="hljs-tag">&lt;/<span class="hljs-name">header</span>&gt;</span>
      {children}
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}

&lt;<span class="hljs-title class_">Card</span> title=<span class="hljs-string">&quot;订单&quot;</span> actions={<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>导出<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>}&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">OrderTable</span> /&gt;</span></span>
&lt;/<span class="hljs-title class_">Card</span>&gt;;
</code></pre></div>
<p>React 里通过 <code>children</code> 和接收 JSX 的 props 实现，Vue 里用 <code>&lt;slot&gt;</code> 和具名插槽。组件提供结构和行为，内容由外部填充，所以新需求通常不用改组件本身。</p>
<h2>其他四条在前端怎样理解</h2>
<p>单一职责是说一个模块只有一个改变的理由。比如一个组件既请求接口、又处理数据、又负责展示，那接口变了、展示变了都要改它。把请求和数据处理抽成 Hook 或组合式函数，组件只管展示，改动就分开了。</p>
<p>里氏替换是说子类型要能替换父类型，调用方不用知道换了。前端里更常见的形式是：几个实现遵守同一个约定，比如本地存储和远程存储都提供 <code>get</code>、<code>set</code>，调用方随便换哪个都能正常工作。如果某个实现偷偷改变了返回值的含义，调用方就会出错。</p>
<p>接口隔离是说不要强迫使用方依赖它用不到的东西。组件 props 也是一样，一个按钮组件要 30 个 props，大多数使用方只用两三个，可以拆成几个更小的组件。</p>
<p>依赖倒置是说高层逻辑依赖抽象，而不是依赖具体实现。比如业务代码接收一个 <code>request</code> 函数作为参数，而不是直接 <code>import</code> 某个请求实例，测试时就可以传入假的 <code>request</code>。</p>
<h2>常见追问</h2>
<p><strong>开闭原则是说代码永远不能改吗？</strong></p>
<blockquote>
<p>不是。它针对的是“新增同类功能时”应该少改已有代码。发现 bug、需求本身变了，该改就改。而且要做到开闭，前提是先找准哪里会变化，抽象放错了地方，扩展起来照样要改代码。</p>
</blockquote>
<p><strong>策略模式和开闭原则有什么关系？</strong></p>
<blockquote>
<p>策略模式就是实现开闭原则的常见手段。把每种算法写成独立的策略，用一张表按名字选择，新增算法只加一项，上面的字段注册表本质上就是策略模式。具体例子见<a href="/questions/pattern-strategy-proxy/">《策略模式和代理模式分别解决什么问题？前端怎样使用？》</a>。</p>
</blockquote>`};export{e as default};