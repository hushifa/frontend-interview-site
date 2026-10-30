var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同一个计数器可以写成两种样子。类组件写 <code>class Counter extends Component</code>，状态放在 <code>this.state</code>，用 <code>this.setState</code> 修改，副作用写在 <code>componentDidMount</code>、<code>componentDidUpdate</code> 这些生命周期方法里。函数组件就是一个返回 JSX 的函数，状态用 <code>useState</code>，副作用用 <code>useEffect</code>。</p>
<p>两者最本质的差别在于怎样拿到 props 和 state。函数组件每渲染一次就执行一次，函数里的 props、state 和事件处理函数都属于这一次渲染，React 文档把它比作快照。类组件只有一个实例，方法里读的是 <code>this.props</code>、<code>this.state</code>，读到的是读取那一刻实例上的值。所以异步回调里，函数组件读到的是创建回调那次渲染的值，类组件读到的可能已经是新值。</p>
<p>React 推荐新代码用函数组件。Hooks 出来的动机就是类组件的几个痛点：逻辑复用要靠高阶组件、Render Props 套很多层；相关的逻辑被拆到不同生命周期里，不相关的逻辑又挤在同一个方法里；还要理解 <code>this</code>、记得绑定事件处理函数。用 Hooks，可以按“订阅”“请求数据”这样的功能拆分逻辑，再抽成自定义 Hook 复用。</p>
<p>要注意，类组件仍然受支持，React 没有移除它的计划，老代码不需要急着重写。另外 <code>getDerivedStateFromError</code>、<code>componentDidCatch</code> 在函数组件里还没有对应写法，错误边界目前仍要写成类组件。</p>
</blockquote>
<h2>写法上的对应关系</h2>
<p>两种写法的生命周期怎样一一对应，见<a href="/questions/react-class-lifecycle/">《React 类组件有哪些生命周期？在函数组件里怎样对应？》</a>。这里只补几个日常写代码时会碰到的差别。</p>
<p>类组件的 <code>setState</code> 传入对象时，会和 <code>this.state</code> 做浅合并，只改传进去的字段。<code>useState</code> 的更新函数是直接替换，state 是对象时要自己展开旧值，写成 <code>setForm({ ...form, name })</code>。</p>
<p>类组件要在构造函数里先调用 <code>super(props)</code>，否则构造函数执行期间 <code>this.props</code> 是 <code>undefined</code>。事件处理函数作为方法传出去时，还要绑定 <code>this</code> 或写成箭头函数类字段。函数组件没有 <code>this</code>，这些问题都不存在。</p>
<p>类组件里要存一个不参与渲染的值，比如定时器 ID，直接挂在实例上，写 <code>this.timer</code>。函数组件里对应的做法是 <code>useRef</code>，旧版 Hooks FAQ 也把 ref 比作类的实例变量，详见<a href="/questions/react-use-ref/">《useRef 有哪些用途？它和 useState 有什么区别？》</a>。</p>
<h2>为什么异步回调里读到的值不一样</h2>
<p>下面用普通 JavaScript 模拟两种组件：类组件每次更新都是同一个实例换上新的 <code>props</code>；函数组件每次渲染都是重新调用函数，拿到一份新的 <code>props</code> 参数。点击“关注”时创建回调，回调稍后才执行，在这之间用户切换到了另一个人。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">ProfileClass</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">props</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span> = props;
  }
  <span class="hljs-title function_">handleClick</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;关注了 &#x27;</span> + <span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span>.<span class="hljs-property">user</span>;
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">ProfileFunction</span>(<span class="hljs-params">props</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;关注了 &#x27;</span> + props.<span class="hljs-property">user</span>;
}

<span class="hljs-keyword">const</span> instance = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ProfileClass</span>({ <span class="hljs-attr">user</span>: <span class="hljs-string">&#x27;小王&#x27;</span> });
<span class="hljs-keyword">const</span> classCallback = instance.<span class="hljs-title function_">handleClick</span>();
<span class="hljs-keyword">const</span> functionCallback = <span class="hljs-title class_">ProfileFunction</span>({ <span class="hljs-attr">user</span>: <span class="hljs-string">&#x27;小王&#x27;</span> });

instance.<span class="hljs-property">props</span> = { <span class="hljs-attr">user</span>: <span class="hljs-string">&#x27;小李&#x27;</span> };
<span class="hljs-title class_">ProfileFunction</span>({ <span class="hljs-attr">user</span>: <span class="hljs-string">&#x27;小李&#x27;</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">classCallback</span>()); <span class="hljs-comment">// 关注了 小李</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">functionCallback</span>()); <span class="hljs-comment">// 关注了 小王</span>
</code></pre></div>
<p>点击时页面上显示的是小王，结果类组件的回调却关注了小李。原因是回调里写的是 <code>this.props.user</code>，执行时才去实例上读，而这时实例的 <code>props</code> 已经换成了新的。</p>
<p>函数组件的回调记住的是那一次调用的 <code>props</code> 参数，第二次渲染是另一次函数调用，有另一份 <code>props</code>，不会影响第一份。这就是 React 文档说的“state 像快照”：一次渲染里的 props、state 和事件处理函数都是用这次渲染的值算出来的。</p>
<p>反过来，函数组件有时又会读到旧值，比如 <code>useEffect</code> 依赖写成 <code>[]</code>，回调就一直看到第一次渲染的值。这是同一个机制的另一面，见<a href="/questions/react-stale-closure/">《React 中的过期闭包为什么会读到旧状态？》</a>。确实需要在异步回调里读最新值时，把值放进 ref，在回调里读 <code>ref.current</code>。</p>
<h2>为什么 React 转向函数组件</h2>
<p>旧版文档在介绍 Hooks 时列了类组件的三个问题。第一，组件之间复用有状态的逻辑很难，只能用高阶组件和 Render Props，DevTools 里会出现一层层包装，这部分对比见<a href="/questions/react-hoc-render-props/">《高阶组件、Render Props 和自定义 Hook 怎样选择？》</a>。</p>
<p>第二，复杂组件难以理解。同一个订阅，建立写在 <code>componentDidMount</code>，清理写在 <code>componentWillUnmount</code>，相关代码被拆开；而 <code>componentDidMount</code> 里可能同时有请求数据和绑定事件，不相关的代码又混在一起。Hooks 允许按功能拆，一个 <code>useEffect</code> 管一件事，建立和清理写在一起。</p>
<p>第三，类本身给人和工具都带来麻烦。人要理解 JavaScript 的 <code>this</code>，记得绑定事件处理函数；文档还提到，类不容易被压缩，热重载也不稳定。</p>
<h2>常见追问</h2>
<p><strong>类组件以后会被移除吗？</strong></p>
<blockquote>
<p>目前没有这个计划。React 文档说类组件仍然受支持，只是不推荐在新代码里使用。旧版文档介绍 Hooks 时也明确说没有移除类组件的计划，建议逐步采用 Hooks，不要大规模重写已有的复杂类组件。</p>
</blockquote>
<p><strong>有哪些事情只能用类组件做？</strong></p>
<blockquote>
<p>错误边界。捕获子组件渲染错误要用 <code>getDerivedStateFromError</code> 和 <code>componentDidCatch</code>，函数组件里还没有对应的 Hook。常见做法是写一个通用的 <code>ErrorBoundary</code> 类组件全局复用，或者用 react-error-boundary 这个库，见<a href="/questions/react-error-suspense/">《Error Boundary 和 Suspense 分别处理什么？》</a>。</p>
</blockquote>
<p><strong>函数组件里怎样实现 shouldComponentUpdate 和 PureComponent 的效果？</strong></p>
<blockquote>
<p>用 <code>memo</code> 包住组件，props 浅比较没有变化时跳过重新渲染。这是性能优化手段，不应该依赖它保证逻辑正确。</p>
</blockquote>`};export{e as default};