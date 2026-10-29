var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>公司有 React 写的官网、Vue 写的后台，还有一个 jQuery 老系统，三边都要用同一套按钮和弹窗。做成 React 组件，Vue 和老系统用不了；做成 Web Components，也就是注册一个 <code>&lt;ui-button&gt;</code> 这样的原生标签，三边都能直接写进 HTML。这是两者最根本的区别：Web Components 是浏览器标准，框架组件只在自己的框架里运行。</p>
<p>可浏览器只给了底层能力：定义标签和生命周期、用 Shadow DOM 隔离样式、用 slot 放子内容。框架组件有的声明式模板、响应式状态、组件间的逻辑复用、高效的服务端渲染，Web Components 都没有，状态变了得自己去改 DOM。所以 Vue 官方把两者看作互补的技术，而不是替代关系。</p>
<p>两者的数据传递方式也不一样。HTML 属性只能是字符串，复杂数据要通过 DOM 属性传；组件向外通知靠派发 <code>CustomEvent</code>，而不是传回调函数。React 19、Vue 3 都已经能正确处理这两件事。</p>
<p>要注意的是，原生 slot 是立即求值的，没法实现 Vue 作用域插槽那样的组合方式；样式随 Shadow DOM 一起打包，SSR 时会重复输出。所以常见做法是，跨框架共享的基础组件用 Web Components，应用内部的业务组件仍用框架组件。</p>
</blockquote>
<h2>能力上差在哪里</h2>
<p>Custom Elements、Shadow DOM、template 各自做什么，以及怎样写一个完整的按钮组件，见<a href="/questions/api-web-components/">《Custom Elements、Shadow DOM 和 template 分别负责什么？》</a>。这里只比较它和框架组件。</p>
<p>Vue 官方文档“Web Components vs. Vue Components”一节讲得很清楚：两者都能定义可复用组件、传数据、发事件、管理生命周期，功能有重叠；但 Web Components 的 API 比较底层，真正做应用还需要平台没有提供的几样东西：</p>
<ul>
<li>声明式、高效的模板系统；</li>
<li>响应式状态管理，方便在组件间抽取和复用逻辑；</li>
<li>高效的服务端渲染和客户端 hydration。</li>
</ul>
<p>文档还解释了 SSR 这一点：原生 Custom Elements 做 SSR，通常要在 Node.js 里模拟 DOM 再把改过的 DOM 序列化出来；而 Vue SSR 尽量编译成字符串拼接，效率高得多。</p>
<p>当然也可以自己在 Custom Elements 之上把这些补齐，Vue 文档的看法是，那就等于长期维护一个自研框架。所以写 Web Components 时，通常会借助 Lit 这类库，或者用 Vue 的 <code>defineCustomElement</code> 把 Vue 组件包装成原生标签。</p>
<table><thead><tr><th>方面</th><th>Web Components</th><th>React / Vue 组件</th></tr></thead><tbody><tr><td>运行范围</td><td>任何框架、纯 HTML</td><td>只在对应框架里</td></tr><tr><td>模板</td><td>自己操作 DOM，或用 template 克隆</td><td>JSX、模板语法，声明式</td></tr><tr><td>状态更新</td><td>自己监听属性、手动更新 DOM</td><td>响应式或重新渲染，框架负责更新 DOM</td></tr><tr><td>样式隔离</td><td>Shadow DOM 原生隔离</td><td>CSS Modules、scoped CSS 等约定</td></tr><tr><td>向外通知</td><td><code>dispatchEvent(new CustomEvent(...))</code></td><td>回调 props、<code>emit</code></td></tr><tr><td>组合</td><td>原生 slot，立即求值</td><td>children、作用域插槽、render props</td></tr><tr><td>SSR</td><td>需要声明式 Shadow DOM 等方案</td><td>框架内置</td></tr></tbody></table>
<h2>数据和事件怎样跨过边界</h2>
<p>HTML 属性（attribute）只能是字符串，写在标签上；DOM 属性（property）是元素对象上的字段，可以是任意 JavaScript 值。框架往自定义元素上传数据时，必须决定用哪一种。</p>
<p>React 文档的说明是：默认情况下，JSX 里绑定的值作为 attribute 传入，非字符串会被序列化，<code>value={[1,2,3]}</code> 会变成字符串 <code>&quot;1,2,3&quot;</code>；但如果这个属性名在元素构造时就出现在类实例上，React 会把它当作 property，直接传入原始值。事件方面，自定义元素通常派发 <code>CustomEvent</code>，在 JSX 里可以用 <code>on</code> 前缀监听。</p>
<p>Vue 3 的做法类似：给自定义元素设置 prop 时，用 <code>in</code> 运算符检查元素上有没有这个 DOM 属性，有就优先当作 property 设置；遇到元素没有正确定义属性的少数情况，可以用 <code>.prop</code> 修饰符强制。另外 Vue 默认会先把不认识的标签当作 Vue 组件去解析，要用 <code>compilerOptions.isCustomElement</code> 告诉它哪些是自定义元素，否则开发环境会报“无法解析组件”的警告。</p>
<p>事件要传出 Shadow DOM，也有一个细节。MDN 说明，浏览器派发的 click 这类 UI 事件都是 composed 的，能跨过 Shadow DOM 边界；可自己 <code>new CustomEvent()</code> 时默认不是，要同时设置 <code>bubbles: true</code> 和 <code>composed: true</code>，外面的框架才能在宿主元素上监听到。</p>
<h2>有哪些限制是框架组件没有的</h2>
<p>Vue 文档专门列了两点。第一，原生 slot 是立即求值的：插进去的内容不管组件要不要显示，都已经创建好了，接收方没法控制什么时候、是否渲染它，也就做不出 Vue 作用域插槽这种“组件把数据交给插槽内容来渲染”的组合方式。</p>
<p>第二，带 Shadow DOM 样式的自定义元素，目前要把 CSS 嵌在 JavaScript 里，在运行时注入 shadow root；SSR 时每个实例的样式还会在 HTML 里重复出现。Vue 单文件组件则可以把 scoped 样式提取成普通 CSS 文件。</p>
<h2>什么时候用哪个</h2>
<p>适合用 Web Components 的场景，是“使用方的技术栈不受你控制”：跨多个框架共享的设计系统基础组件，要嵌入第三方网站的小部件，比如客服按钮、支付组件，以及微前端里需要隔离样式的边界。组件库怎样设计才稳定，见<a href="/questions/framework-component-library/">《前端组件库怎样设计才能让业务方稳定使用？》</a>。</p>
<p>应用内部的页面和业务组件，状态多、组合复杂、要 SSR，用框架组件更省事。两者可以共存：React 或 Vue 应用里直接使用 Web Components 写的基础组件。</p>
<h2>常见追问</h2>
<p><strong>Web Components 能做到“一次编写，永不过时”吗？</strong></p>
<blockquote>
<p>Vue 文档认为这个看法过于简单。浏览器标准本身确实稳定，但要做成应用，就得在它上面补模板、状态和 SSR，不管是自己写还是用基于 Custom Elements 的框架，都要接受这些方案自己的演进和变化。</p>
</blockquote>
<p><strong>Shadow DOM 里的样式完全改不了吗？</strong></p>
<blockquote>
<p>不是。继承属性（比如 <code>color</code>、<code>font</code>）和 CSS 自定义属性会穿透进去，组件作者还可以用 <code>part</code> 属性暴露内部元素，让外部用 <code>::part()</code> 修改。</p>
</blockquote>
<p><strong>React 以前为什么不太适合用 Web Components？</strong></p>
<blockquote>
<p>React 19 的发布博客解释过：以前的版本把不认识的 props 当作 attribute 而不是 property，所以复杂数据要用 ref 手动设置。React 19 起完整支持自定义元素，客户端渲染时，和元素实例上属性同名的 props 按 property 赋值，其余按 attribute；服务端渲染时，字符串、数字、<code>true</code> 这类原始值输出成 attribute，对象、函数和 <code>false</code> 则省略。</p>
</blockquote>`};export{e as default};