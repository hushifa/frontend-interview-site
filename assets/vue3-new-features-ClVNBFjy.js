var e={answerHtml:`<blockquote>
<p>本题讲两个版本“有什么不同、为什么这样改”。项目具体怎么一步步升级，见<a href="/questions/vue2-migration/">《Vue 2 项目如何迁移到 Vue 3？》</a>。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>拿同一个搜索页对比：Vue 2 里关键词写在 <code>data</code>、搜索函数写在 <code>methods</code>，模板只能有一个根元素，弹窗要挂到 <code>body</code> 下得自己写 DOM 操作；Vue 3 可以用 <code>&lt;script setup&gt;</code> 和 <code>ref</code>、<code>computed</code> 把搜索逻辑写在一起，模板可以有多个根节点，弹窗用 <code>&lt;Teleport to=&quot;body&quot;&gt;</code> 一行解决。这些就是写法层面最直观的变化。</p>
<p>底层有两处大改。响应式从 <code>Object.defineProperty</code> 换成了 <code>Proxy</code>，新增属性、按下标改数组、<code>Map</code> 和 <code>Set</code> 都能被检测到。编译器在编译模板时就标出哪些节点是动态的、哪些是静态的，更新时只比较动态的部分。</p>
<p>工程上，Vue 3 用 TypeScript 重写，类型推导更好；全局 API 从 <code>new Vue()</code> 改成 <code>createApp()</code> 创建应用实例，<code>nextTick</code> 这类全局 API 改成具名导出，没用到的会被打包工具摇掉。</p>
<p>要注意一些写法被移除了：filters 改用方法或计算属性，<code>$on</code>、<code>$off</code>、<code>$once</code> 没有了，事件总线要换成第三方库，<code>v-on</code> 的 <code>.native</code> 修饰符也去掉了，靠 <code>emits</code> 选项区分组件事件和原生事件。Vue 3 不支持 IE11，Vue 2 已于 2023 年 12 月 31 日停止维护。</p>
</blockquote>
<h2>写组件的方式：Composition API</h2>
<p>迁移指南列出的新特性里排第一的是 Composition API 和 <code>&lt;script setup&gt;</code>。Vue 文档的定义是，它允许用导入的函数来编写组件，而不是声明一个个选项。主要好处是能把逻辑抽成组合式函数复用，解决了 mixin 来源不清、命名冲突等问题。</p>
<p>Options API 并没有被移除，Vue 3 里仍然可以用，两者底层是同一套系统。迁移指南还注明，Composition API 和 <code>&lt;script setup&gt;</code> 也被移植到了 Vue 2.7。两者的对比见<a href="/questions/vue-options-composition/">《Options API 和 Composition API 有什么区别？Vue 组件的 data 为什么必须是函数？》</a>。</p>
<h2>响应式：从 defineProperty 到 Proxy</h2>
<p>Vue 文档在讲响应式原理时说，Vue 2 受浏览器支持的限制，只能使用 getter/setter；Vue 3 对 <code>reactive</code> 对象使用 <code>Proxy</code>，对 <code>ref</code> 使用 getter/setter。</p>
<p>为什么要换？<code>defineProperty</code> 只能给已经存在的属性装上拦截，所以 Vue 2 里直接给对象加属性、用下标改数组都检测不到，要用 <code>Vue.set</code>；初始化时还要把整个 <code>data</code> 递归走一遍。<code>Proxy</code> 代理的是整个对象，属性的增删、<code>in</code> 判断、集合类型的操作都能拦截，Vue 2 里那些“改了视图不更新”的限制大多不存在了。两种实现的细节见<a href="/questions/vue2-vs-vue3-reactivity/">《defineProperty 和 Proxy 实现的响应式有什么区别？》</a>。</p>
<p>代价是放弃旧浏览器。Vue 官方 FAQ 说 Vue 3 使用了旧浏览器里无法 polyfill 的 ES2016 特性，不支持 IE11。</p>
<h2>渲染：编译器帮虚拟 DOM 省事</h2>
<p>纯运行时的虚拟 DOM 不知道新旧两棵树哪里会变，只能整棵遍历、逐个比较属性。Vue 3 的文档把自己的做法称为“编译器指导的虚拟 DOM”：Vue 同时控制编译器和运行时，编译模板时就能做静态分析，把结果写进渲染函数。</p>
<p>文档列出了几项具体手段。完全静态的节点会被缓存，更新时直接跳过。动态节点带上补丁标记，比如只有 <code>class</code> 是动态的，就只比较 <code>class</code>。模板里结构稳定的一块叫作 block，它把内部所有动态节点收集成一个扁平数组，更新时只遍历这个数组，文档称之为树结构打平。这些优化怎样在生成代码里体现，见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
<h2>新的内置能力：Fragment、Teleport、Suspense</h2>
<p>Vue 2 的组件模板只能有一个根元素，多写一个会发警告，经常要多包一层 <code>div</code>。Vue 3 正式支持多根节点组件，迁移指南称为 Fragments。多根节点时，没有声明为 props 的属性不知道该落到哪个根节点上，需要用 <code>v-bind=&quot;$attrs&quot;</code> 明确指定。</p>
<p><code>&lt;Teleport&gt;</code> 可以把组件模板的一部分“传送”到组件 DOM 层级之外的节点上，<code>to</code> 接收一个选择器或 DOM 节点。模态框、全局提示就是典型场景：逻辑上属于当前组件，DOM 上要挂到 <code>body</code> 下，才不受父元素的 <code>overflow</code>、<code>z-index</code> 影响。</p>
<p><code>&lt;Suspense&gt;</code> 用来协调组件树里的异步依赖，在多个嵌套的异步组件都加载完之前显示加载状态。要注意，Vue 文档目前仍把它标为实验性功能，API 可能变化。两者的使用边界见<a href="/questions/vue-keepalive-teleport/">《KeepAlive 与 Teleport 有哪些使用边界？》</a>和<a href="/questions/vue-suspense/">《Vue Suspense 适合处理什么异步组件边界？》</a>。</p>
<h2>工程层面：TypeScript 与全局 API</h2>
<p>Vue 文档说 Vue 3 本身就是用 TypeScript 编写的，提供一等的 TypeScript 支持。Composition API 基于普通的变量和函数，类型可以自然推导；而 Options API 设计于 2013 年，当时没有考虑类型推导，要靠复杂的类型体操才能让 <code>this</code> 有正确的类型。</p>
<p>全局 API 也改了。Vue 2 里 <code>Vue.use</code>、<code>Vue.component</code>、<code>Vue.mixin</code> 都直接改全局的 <code>Vue</code>，同一页面上的多个应用、多个测试用例会互相污染。Vue 3 用 <code>createApp()</code> 返回一个应用实例，插件、组件、指令都注册在这个实例上：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// Vue 2</span>
<span class="hljs-keyword">import</span> <span class="hljs-title class_">Vue</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;
<span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">use</span>(router);
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Vue</span>({ <span class="hljs-attr">render</span>: <span class="hljs-function">(<span class="hljs-params">h</span>) =&gt;</span> <span class="hljs-title function_">h</span>(<span class="hljs-title class_">App</span>) }).$mount(<span class="hljs-string">&#x27;#app&#x27;</span>);

<span class="hljs-comment">// Vue 3</span>
<span class="hljs-keyword">import</span> { createApp, nextTick } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;
<span class="hljs-title function_">createApp</span>(<span class="hljs-title class_">App</span>).<span class="hljs-title function_">use</span>(router).<span class="hljs-title function_">mount</span>(<span class="hljs-string">&#x27;#app&#x27;</span>);
</code></pre></div>
<p>另一处变化是 <code>nextTick</code> 这类全局 API 改成了具名导出。Vue 2 里它们都挂在 <code>Vue</code> 对象上，打包工具无法判断用没用到，只能全部打包进去。Vue 3 改成按需导入，打包工具支持 tree-shaking 时，没用到的 API 会从最终产物里去掉。</p>
<h2>被移除的写法</h2>
<p>迁移指南的破坏性变更列表很长，面试中常被问到的是下面这几项：</p>
<ul>
<li><strong>filters</strong>：模板里的 <code>{{ price | currency }}</code> 不再支持。迁移指南的理由是它要求一套自定义语法，打破了“花括号里就是 JavaScript”的约定，建议改用方法调用或计算属性。</li>
<li><strong><code>$on</code>、<code>$off</code>、<code>$once</code></strong>：组件实例不再实现事件发射器接口，所以 <code>new Vue()</code> 当事件总线的写法失效了。需要事件总线时，迁移指南推荐 mitt 这类第三方库，同时也说明，大多数情况下不鼓励用全局事件总线做组件通信，更适合用 props、emit、provide/inject 或状态管理。</li>
<li><strong><code>.native</code> 修饰符</strong>：Vue 3 新增了 <code>emits</code> 选项，子组件声明自己会触发哪些事件；没有声明的监听器会被当作原生事件绑到子组件的根元素上（除非设置了 <code>inheritAttrs: false</code>），所以不再需要 <code>.native</code>。</li>
<li><strong>组件 <code>v-model</code> 重做</strong>：默认的 prop 和事件名变成 <code>modelValue</code> 和 <code>update:modelValue</code>，支持多个 <code>v-model</code>，替代了 <code>.sync</code>。</li>
</ul>
<p>此外还有 <code>$listeners</code> 合并进 <code>$attrs</code>、<code>$children</code> 移除、<code>beforeDestroy</code>/<code>destroyed</code> 改名为 <code>beforeUnmount</code>/<code>unmounted</code> 等。组件通信相关的改动，见<a href="/questions/vue2-communication/">《Vue 2 有哪些组件通信方式？哪些写法在 Vue 3 中被移除或改变？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Vue 3 一定比 Vue 2 快吗？</strong></p>
<blockquote>
<p>一般场景下更新更省事，因为编译器标出了动态节点，运行时不用整棵比较；没用到的全局 API 也能被摇掉，包更小。但这不等于每个页面都会变快，瓶颈在数据量、请求或业务逻辑时，换版本解决不了，要具体测量。</p>
</blockquote>
<p><strong>Vue 3 里还能用 Options API 吗？</strong></p>
<blockquote>
<p>能。Options API 没有被废弃，Vue 文档说它是在 Composition API 之上实现的，两者可以在同一个项目里混用。只是复杂逻辑的复用、TypeScript 支持这两方面，Composition API 更有优势。</p>
</blockquote>
<p><strong>为什么 Vue 3 不支持 IE11？</strong></p>
<blockquote>
<p>Vue 官方 FAQ 的说法是，Vue 3 用到了旧浏览器里无法 polyfill 的现代 JavaScript 特性，基于 <code>Proxy</code> 的响应式就是其中最核心的一项。必须支持 IE11 的项目只能留在 Vue 2；迁移指南提到，在 Vue 2 停止维护前来不及升级的项目，可以了解 Extended LTS。</p>
</blockquote>`};export{e as default};