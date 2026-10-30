var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如运营要自己搭一个活动页：从左边的组件列表把按钮、图片拖到中间画布，在右边面板里改文字和颜色，点发布就上线。做这样的平台，核心是一份描述页面的 JSON，也叫 schema 或协议，所有模块都围绕它工作。</p>
<p>阿里开源的低代码引擎把平台拆成四个模块。入料把现有的组件按物料协议描述出来，说明它叫什么、有哪些属性；编排就是在画布上拖拽、改属性，本质是不断生成符合搭建协议的 schema；渲染按 schema 和注册过的组件画出页面；出码把同一份 schema 转成源码。</p>
<p>为什么要单独定一份协议？引擎文档的说法是，它约束编辑器的输出，同时作为渲染和出码的输入，让这三者解耦、可以各自升级。物料协议也一样，组件只要补一份描述就能接入，不用为搭建平台重写一遍。</p>
<p>要注意几点：节点要有稳定的 id，拖拽移动时保持不变；渲染器只用注册过的组件，没登记的组件名不能当代码执行；schema 里能写表达式和函数，就要有权限和审核，渲染时的安全边界要单独设计。</p>
</blockquote>
<h2>平台由哪几部分组成</h2>
<p>阿里低代码引擎的架构文档把引擎内核分成四个模块，每个模块和协议的关系都很清楚：</p>
<ul>
<li><strong>入料</strong>：把外部物料，比如大量的 npm 组件，按“低代码引擎物料协议规范”描述出来，通过引擎 API 注册后在编辑器里使用。文档强调这里只是增加描述，不是重写组件，所以能最大程度复用已有的组件。</li>
<li><strong>编排</strong>：在编辑器里对物料做布局、增删改、写 JS/CSS 或逻辑编排，本质是不断生成符合“低代码引擎搭建协议规范”的页面描述。</li>
<li><strong>渲染</strong>：把编排生成的页面描述渲染成视图，要处理数据流、生命周期、事件绑定、国际化等。</li>
<li><strong>出码</strong>：把页面描述转换成另一种 DSL 或编程语言的代码。</li>
</ul>
<p>所以这四个模块不直接互相调用，而是通过两份协议衔接：物料协议描述“有哪些积木、每块积木能怎么配”，搭建协议描述“这一页用积木搭成了什么样”。</p>
<h2>物料怎样描述</h2>
<p>物料协议里，一个组件的描述是一份 JSON，主要有三部分：基础信息，包括组件名、标题、描述、包信息等；属性信息，包括参数、说明、类型、默认值；以及能力配置，用来优化编辑体验。</p>
<p>右侧属性面板就是根据这份描述生成的。引擎把编辑属性用的控件叫设置器（Setter），比如字符串属性配一个输入框，颜色属性配一个取色器。组件开发者只写描述，不用为每个组件手写一个配置面板。</p>
<h2>页面协议长什么样</h2>
<p>搭建协议的组件树里，每个节点对应源码里 render 函数返回的一段 JSX，常用字段有：<code>id</code> 是组件唯一标识，由引擎生成，组件移动时要保持不变；<code>componentName</code> 是组件名，首字母大写，要能在 <code>componentsMap</code> 里找到对应的 npm 包；<code>props</code> 是属性；<code>children</code> 是子节点；另外还有 <code>condition</code> 控制是否渲染、<code>loop</code> 控制循环渲染。</p>
<p>属性值可以是普通 JSON，也可以是表达式或函数，用 <code>{ &quot;type&quot;: &quot;JSExpression&quot;, &quot;value&quot;: &quot;this.state.user.name&quot; }</code> 表示变量绑定，用 <code>JSFunction</code> 表示事件处理函数。协议顶层还有 <code>version</code>、<code>componentsMap</code>、<code>componentsTree</code>、<code>i18n</code>、<code>dataSource</code> 等字段。</p>
<p>下面用一个简化版走一遍渲染、拖拽和出码。组件注册表只登记了 <code>Page</code> 和 <code>Button</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面 schema：只描述用哪个组件、传什么属性、子节点是什么。</span>
<span class="hljs-keyword">const</span> schema = {
  <span class="hljs-attr">componentName</span>: <span class="hljs-string">&#x27;Page&#x27;</span>,
  <span class="hljs-attr">props</span>: {},
  <span class="hljs-attr">children</span>: [
    { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;n1&#x27;</span>, <span class="hljs-attr">componentName</span>: <span class="hljs-string">&#x27;Button&#x27;</span>, <span class="hljs-attr">props</span>: { <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;提交&#x27;</span> } },
    { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;n2&#x27;</span>, <span class="hljs-attr">componentName</span>: <span class="hljs-string">&#x27;Script&#x27;</span>, <span class="hljs-attr">props</span>: { <span class="hljs-attr">code</span>: <span class="hljs-string">&#x27;alert(1)&#x27;</span> } },
  ],
};

<span class="hljs-comment">// 物料注册表：画布和渲染器只认这里登记过的组件。</span>
<span class="hljs-keyword">const</span> materials = {
  <span class="hljs-title class_">Page</span>: <span class="hljs-function">(<span class="hljs-params">props, children</span>) =&gt;</span> <span class="hljs-string">\`&lt;main&gt;<span class="hljs-subst">\${children.join(<span class="hljs-string">&#x27;&#x27;</span>)}</span>&lt;/main&gt;\`</span>,
  <span class="hljs-title class_">Button</span>: <span class="hljs-function">(<span class="hljs-params">props</span>) =&gt;</span> <span class="hljs-string">\`&lt;button&gt;<span class="hljs-subst">\${props.text}</span>&lt;/button&gt;\`</span>,
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">const</span> component = materials[node.<span class="hljs-property">componentName</span>];
  <span class="hljs-keyword">if</span> (!component) <span class="hljs-keyword">return</span> <span class="hljs-string">\`&lt;!-- 未注册：<span class="hljs-subst">\${node.componentName}</span> --&gt;\`</span>;
  <span class="hljs-keyword">const</span> children = (node.<span class="hljs-property">children</span> ?? []).<span class="hljs-title function_">map</span>(render);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">component</span>(node.<span class="hljs-property">props</span>, children);
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(schema)); <span class="hljs-comment">// &lt;main&gt;&lt;button&gt;提交&lt;/button&gt;&lt;!-- 未注册：Script --&gt;&lt;/main&gt;</span>

<span class="hljs-comment">// 拖拽移动节点：只改 schema，id 保持不变，再重新渲染。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">moveNode</span>(<span class="hljs-params">tree, id, toIndex</span>) {
  <span class="hljs-keyword">const</span> list = tree.<span class="hljs-property">children</span>;
  <span class="hljs-keyword">const</span> <span class="hljs-keyword">from</span> = list.<span class="hljs-title function_">findIndex</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span> === id);
  <span class="hljs-keyword">const</span> [node] = list.<span class="hljs-title function_">splice</span>(<span class="hljs-keyword">from</span>, <span class="hljs-number">1</span>);
  list.<span class="hljs-title function_">splice</span>(toIndex, <span class="hljs-number">0</span>, node);
}
<span class="hljs-title function_">moveNode</span>(schema, <span class="hljs-string">&#x27;n2&#x27;</span>, <span class="hljs-number">0</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(schema.<span class="hljs-property">children</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">id</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// n2,n1</span>

<span class="hljs-comment">// 出码：同一份 schema 转成源码文本。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">toJsx</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">const</span> children = (node.<span class="hljs-property">children</span> ?? []).<span class="hljs-title function_">map</span>(toJsx).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> props = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(node.<span class="hljs-property">props</span>)
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">[key, value]</span>) =&gt;</span> <span class="hljs-string">\` <span class="hljs-subst">\${key}</span>=<span class="hljs-subst">\${<span class="hljs-built_in">JSON</span>.stringify(value)}</span>\`</span>)
    .<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`&lt;<span class="hljs-subst">\${node.componentName}</span><span class="hljs-subst">\${props}</span>&gt;<span class="hljs-subst">\${children}</span>&lt;/<span class="hljs-subst">\${node.componentName}</span>&gt;\`</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toJsx</span>(schema.<span class="hljs-property">children</span>[<span class="hljs-number">1</span>])); <span class="hljs-comment">// &lt;Button text=&quot;提交&quot;&gt;&lt;/Button&gt;</span>
</code></pre></div>
<p>第一行输出里，<code>Script</code> 没有渲染成任何东西，只留下一条注释。为什么不按名字去找一个全局函数执行？因为 schema 可能来自别人的编辑，渲染器只认注册表里的组件，没登记的名字一律不执行，这条边界在<a href="/questions/architecture-low-code-schema/">《低代码和 Schema 驱动 UI 怎样保持可维护与安全？》</a>里有展开。</p>
<p>拖拽以后，<code>n2</code> 移到了最前面，但两个节点的 id 都没变。选中状态、撤销记录、属性面板都靠 id 找节点，所以协议要求移动时保持 id 不变。</p>
<p>最后的 <code>toJsx</code> 和 <code>render</code> 读的是同一份 schema，只是一个输出页面，一个输出源码。这就是“一份协议、渲染和出码各自实现”的意思。</p>
<h2>画布和拖拽怎样实现</h2>
<p>真实场景里节点有成百上千个，每个都要支持增删改、移动、插入子节点，直接改 JSON 不方便。所以引擎仿照 DOM 设计了节点模型和属性模型，用 <code>node.remove()</code> 这样的接口编排，最后再 <code>export()</code> 出 schema。</p>
<p>画布采用设计态和渲染态的双层架构：设计器和渲染器处在不同的 frame 里，渲染器以单独的 iframe 嵌入。文档给的理由有两个：一是让渲染器有更干净、更接近生产的运行环境，编辑器自己的样式和脚本不会干扰页面；二是方便用户按接口约束替换自己的渲染器。</p>
<p>拖拽方面，引擎在初始化时监听主文档和 iframe 里 <code>contentDocument</code> 的鼠标、键盘、拖拽事件，这些监听区域叫感应区（Sensor）。感应区负责两件事：一是事件对象转换，比如 iframe 内外的坐标换算；二是结合每个节点的描述，判断它能不能作为容器、能不能放进来，算出最终的落点。拖拽本身用 HTML5 拖放还是 Pointer 事件实现，取舍见<a href="/questions/design-drag-sort/">《怎样实现拖拽排序？HTML5 拖放 API 和 Pointer 事件怎么选？》</a>。</p>
<h2>出码模块做什么</h2>
<p>出码的输入是 schema 和出码方案，输出是一棵源码目录树。出码方案指具体的项目框架，引擎文档举的例子是 Rax 和 Ice.js。引擎的出码核心库 <code>@alilc/lowcode-code-generator</code> 支持在 Node 环境运行，也提供在浏览器里运行的 standalone 模式。</p>
<p>为什么需要出码？搭建协议的设计目标之一是“生成标准源码”，明确每个属性和源码的对应关系，生成和手写没有差别的代码。这样搭好的页面可以导出成普通项目，继续用常规方式开发和维护。</p>
<h2>常见追问</h2>
<p><strong>schema 里允许写 JSFunction，安全怎么保证？</strong></p>
<blockquote>
<p>能写函数的人就能在页面里执行任意代码，所以编辑权限本身要严格控制，发布前要审核，修改要留记录。只给运营用的场景，可以不开放函数，只允许选择预先注册好的动作。服务端的校验和权限不能依赖页面配置。</p>
</blockquote>
<p><strong>为什么画布要用 iframe，而不是直接渲染在编辑器页面里？</strong></p>
<blockquote>
<p>引擎文档的理由是给渲染器一个更干净、更接近生产的运行环境，同时方便替换渲染器。放在同一个页面里，编辑器的全局样式和脚本会影响被搭建的页面，所见就不等于所得。代价是拖拽要处理 iframe 内外两套事件和坐标换算。</p>
</blockquote>
<p><strong>协议升级了，旧页面怎么办？</strong></p>
<blockquote>
<p>搭建协议顶层有 <code>version</code> 字段，引擎文档说不同的版本号对应不同的渲染 SDK，保证不同版本的产物都能正常渲染。自己设计时，也要在 schema 里记录版本，升级时写迁移函数把旧数据转成新格式。</p>
</blockquote>`};export{e as default};