var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同样是点击按钮让计数加 1，Vue 里改的是 <code>count.value</code>，Vue 记得哪些组件在渲染时读过它，只让这些组件更新；React 里调用的是 <code>setCount</code>，React 会重新执行这个组件函数，默认还会把它下面的子组件也重新渲染一遍，再比较出要改的 DOM。</p>
<p>这个差别来自两者追踪变化的方式。Vue 用 Proxy 和 getter/setter 在读写时记录依赖，属于“知道谁用了什么”；React 不追踪读取，状态变了就从这个组件往下重新计算，属于“重新算一遍再比较”。所以 React 里常要用 <code>memo</code>、<code>useMemo</code> 跳过子组件，或者交给 React Compiler；Vue 里这类手动优化少一些。</p>
<p>写法上，Vue 推荐单文件组件和模板，编译器能分析模板里哪些部分是静态的；React 用 JSX，界面就是 JavaScript 表达式，灵活但编译器能做的静态分析少。生态上，Vue 有官方的 Vue Router、Pinia；React 官方只管核心库，路由、状态管理由社区方案承担，新项目文档推荐从 Next.js、React Router 这类框架起步。</p>
<p>选择时不要比较语法好坏，两者都能做大型应用。先看团队熟悉哪个、关键依赖支持哪个、需要的渲染和部署方式有没有成熟方案，再用一条真实业务流程做原型验证。</p>
</blockquote>
<h2>一次更新各自做了什么</h2>
<p>先看同一个计数器，注意两边“改状态”的写法：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;

const count = ref(0)
&lt;/script&gt;

&lt;template&gt;
  &lt;button @click=&quot;count++&quot;&gt;{{ count }}&lt;/button&gt;
  &lt;HeavyList /&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setCount(count + 1)}&gt;{count}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">HeavyList</span> /&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>点击按钮后，<code>HeavyList</code> 会不会重新渲染？Vue 里不会，React 里默认会。</p>
<p>Vue 的每个组件实例在渲染时是一个响应式 effect，渲染函数读到 <code>count</code> 就把自己登记为它的依赖。<code>count</code> 改了，Vue 只重新执行登记过的那个渲染 effect。<code>HeavyList</code> 没有读 <code>count</code>，它的 props 也没变，所以不用更新。</p>
<p>React 不记录读取。<code>setCount</code> 让 <code>Counter</code> 重新渲染，React 文档说明这个过程是递归的：组件返回了别的组件，就接着渲染那个组件，直到没有更深的组件为止。所以 <code>HeavyList</code> 也会被调用一次，虽然最后 DOM 可能没有任何变化。想跳过它，可以用 <code>memo</code> 包起来，让它在 props 不变时不重新渲染；启用 React Compiler 后，编译器会在构建时自动加上这类缓存。</p>
<h2>模板和 JSX 的差别在哪</h2>
<p>Vue 的模板会被编译成渲染函数。因为编译器能看到整份模板，它会给动态节点打上标记（patch flag），说明这个节点只有 class 会变还是只有文本会变；还会把动态节点收集到一个扁平数组里，更新时只遍历它们，静态部分直接跳过。Vue 文档把这称为“编译器提示的虚拟 DOM”。</p>
<p>JSX 只是 <code>React.createElement</code> 一类调用的语法糖，任何 JavaScript 表达式都可以写进去，所以写法更自由，比如用 <code>map</code> 和三元表达式随意组合。代价是 React 运行时拿不到“哪些部分永远不变”的信息，要靠比较新旧虚拟 DOM 找出变化。Vue 也支持写渲染函数和 JSX，只是官方说大多数场景模板就够用。</p>
<h2>状态和数据流有什么不同</h2>
<p>两者都是单向数据流：父组件通过 props 往下传，子组件通过事件或回调通知父组件。差别在于状态本身。</p>
<p>Vue 的状态是可变的响应式对象，直接 <code>state.list.push(item)</code> 就能触发更新。React 的状态要当作不可变的值，更新数组得写 <code>setList([...list, item])</code>，因为 React 用 <code>Object.is</code> 比较新旧值决定是否更新，原地修改后引用没变，就可能不会重新渲染。</p>
<p>这也影响了状态库的风格。Vue 官方推荐的 Pinia 直接修改 store 里的状态；React 生态里的 Redux 要求 reducer 不修改原状态、返回新对象，Redux Toolkit 借助 Immer 才允许写成“直接修改”的样子。</p>
<h2>怎样选</h2>
<p>可以按下面几件事排除：</p>
<ol>
<li>团队经验：已有成员熟悉哪一个，迁移成本有多大。</li>
<li>关键依赖：要用的组件库、图表、编辑器、跨端方案支持哪一个。比如要用 React Native 做原生应用，选 React 更顺。</li>
<li>渲染与部署：需要 SSR 或静态生成时，React 这边常见的是 Next.js、React Router 框架模式，Vue 这边是 Nuxt，看哪一个满足部署环境。</li>
<li>原型验证：挑一条真实的复杂流程，两边各写一版，比较开发效率和维护成本。</li>
</ol>
<p>更完整的约束清单见<a href="/questions/framework-selection/">《选择前端框架时应该先比较哪些约束？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Vue 是不是一定比 React 快？</strong></p>
<blockquote>
<p>不能这样说。Vue 默认能少做一些不必要的组件渲染，React 可以用 <code>memo</code> 或 React Compiler 达到类似效果。真实应用的性能更多取决于数据量、列表怎样渲染、请求怎样组织，要用性能工具实际测量，不要拿基准测试排名做决定。</p>
</blockquote>
<p><strong>React Hooks 和 Vue 组合式 API 看起来很像，区别在哪？</strong></p>
<blockquote>
<p>组合式 API 的 <code>setup</code> 只在组件创建时执行一次，里面的 <code>ref</code>、<code>computed</code> 一直存在，所以没有调用顺序的限制，也不会读到旧闭包。React 组件函数每次渲染都重新执行，Hooks 靠调用顺序对应状态，所以不能写在条件分支里，Effect 还要正确声明依赖。</p>
</blockquote>
<p><strong>Vue 里需要 memo 这类优化吗？</strong></p>
<blockquote>
<p>需要的场景少，但不是没有。Vue 提供 <code>v-once</code>、<code>v-memo</code>、<code>shallowRef</code>、<code>markRaw</code> 处理大列表、大对象这类情况，详见<a href="/questions/vue-vmemo-shallowref/">《v-once、v-memo、shallowRef 和 markRaw 分别在什么时候用？》</a>。</p>
</blockquote>`};export{e as default};