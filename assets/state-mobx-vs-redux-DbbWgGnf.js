var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同样是把一个待办事项标记为完成，MobX 里直接写 <code>todo.finished = true</code>，读过这个 <code>finished</code> 的组件自动更新；Redux 里要 <code>dispatch({ type: &#x27;todos/toggled&#x27;, payload: id })</code>，reducer 根据旧状态返回一个新的待办列表，组件通过 <code>useSelector</code> 发现选出的值变了才重新渲染。</p>
<p>根本区别在于怎样知道“谁需要更新”。MobX 是响应式的：状态被标记为 observable，组件、computed 执行时读到了哪些属性，MobX 就记下它们的依赖，属性改了只通知这些地方，和 Vue 的思路一样。Redux 不追踪读取：状态是不可变的，每次 action 产生一个新的状态对象，订阅者自己比较新旧值的引用，判断有没有变。</p>
<p>这带来不同的取舍。MobX 代码少，可以用类和普通对象建模，更新粒度天然很细；但变化是隐式发生的，哪里改了状态要靠 action 约定和工具去查。Redux 更啰嗦，但每次变化都是一个普通对象，可以记录、序列化、回放，DevTools 能做时间旅行调试，逻辑也容易单独测试。</p>
<p>要注意，MobX 只追踪在被追踪函数同步执行时读到的属性，<code>await</code> 之后或 <code>setTimeout</code> 里读的不算；修改状态的代码最好标成 action。Redux 则要保证 reducer 纯净、不原地修改，现在一般用 Redux Toolkit，它内置的 Immer 允许把不可变更新写成“直接修改”的样子。</p>
</blockquote>
<h2>同一个功能两种写法</h2>
<p>先看 MobX，注意状态是类里的普通属性，修改方法直接改它：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { makeAutoObservable } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;mobx&#x27;</span>;
<span class="hljs-keyword">import</span> { observer } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;mobx-react-lite&#x27;</span>;

<span class="hljs-keyword">class</span> <span class="hljs-title class_">TodoStore</span> {
  todos = [];

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">makeAutoObservable</span>(<span class="hljs-variable language_">this</span>);
  }

  <span class="hljs-keyword">get</span> <span class="hljs-title function_">unfinishedCount</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">todos</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">todo</span>) =&gt;</span> !todo.<span class="hljs-property">finished</span>).<span class="hljs-property">length</span>;
  }

  <span class="hljs-title function_">toggle</span>(<span class="hljs-params">id</span>) {
    <span class="hljs-keyword">const</span> todo = <span class="hljs-variable language_">this</span>.<span class="hljs-property">todos</span>.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> t.<span class="hljs-property">id</span> === id);
    todo.<span class="hljs-property">finished</span> = !todo.<span class="hljs-property">finished</span>;
  }
}

<span class="hljs-keyword">const</span> store = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TodoStore</span>();

<span class="hljs-keyword">const</span> <span class="hljs-title class_">Counter</span> = <span class="hljs-title function_">observer</span>(<span class="hljs-function">() =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>未完成：{store.unfinishedCount}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span></span>);
</code></pre></div>
<p>再看 Redux Toolkit，状态的修改写在 slice 的 reducer 里，组件通过 <code>dispatch</code> 和 <code>useSelector</code> 交互：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createSlice } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@reduxjs/toolkit&#x27;</span>;
<span class="hljs-keyword">import</span> { useDispatch, useSelector } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-redux&#x27;</span>;

<span class="hljs-keyword">const</span> todosSlice = <span class="hljs-title function_">createSlice</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;todos&#x27;</span>,
  <span class="hljs-attr">initialState</span>: [],
  <span class="hljs-attr">reducers</span>: {
    <span class="hljs-title function_">toggled</span>(<span class="hljs-params">state, action</span>) {
      <span class="hljs-keyword">const</span> todo = state.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> t.<span class="hljs-property">id</span> === action.<span class="hljs-property">payload</span>);
      todo.<span class="hljs-property">finished</span> = !todo.<span class="hljs-property">finished</span>;
    },
  },
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> count = <span class="hljs-title function_">useSelector</span>(<span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> state.<span class="hljs-property">todos</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">t</span>) =&gt;</span> !t.<span class="hljs-property">finished</span>).<span class="hljs-property">length</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>未完成：{count}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span></span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">ToggleButton</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> dispatch = <span class="hljs-title function_">useDispatch</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> dispatch(todosSlice.actions.toggled(id))}&gt;切换<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>两段代码都写了 <code>todo.finished = !todo.finished</code>，看起来一样，区别在哪？MobX 里这行代码真的修改了那个对象，MobX 拦截到写入，通知读过它的 <code>unfinishedCount</code> 和 <code>Counter</code>。Redux Toolkit 里的 <code>state</code> 是 Immer 给的草稿，这次“修改”最后会生成一个新的状态树，原来的状态对象没有被改动。</p>
<h2>MobX 怎么知道组件用了什么</h2>
<p>MobX 文档把概念分为三类：状态（state）、修改状态的动作（action）和从状态派生出的东西（derivation）。派生又分两种，computed 是用纯函数从状态算出的值，reaction 是状态变化时自动执行的副作用，最常见的 reaction 就是界面组件。</p>
<p>文档对追踪规则的原话是：MobX 会对被追踪函数执行期间读到的任何 observable 属性做出反应。被追踪函数包括 <code>computed</code> 的表达式、<code>observer</code> 组件的渲染、<code>autorun</code> 等的第一个参数。“执行期间”指同步执行的那段时间，<code>setTimeout</code>、<code>promise.then</code>、<code>await</code> 之后的代码都不算。</p>
<p>所以上面的 <code>Counter</code> 用 <code>observer</code> 包住后，渲染时读了 <code>store.unfinishedCount</code>，这个 computed 又读了 <code>todos</code> 和每个 <code>finished</code>，于是这些都成了依赖。某个 <code>finished</code> 改了，<code>unfinishedCount</code> 重算，结果变了才通知 <code>Counter</code>。文档还特别说明，组件能访问到但实际没读的 observable，改了也不会让它重新渲染。</p>
<p>为什么修改要标成 action？action 会在事务里执行，最外层的 action 结束之前不会运行 reaction，所以中间状态不会被界面看到。MobX 的 <code>enforceActions</code> 配置默认是 <code>&quot;observed&quot;</code>，被观察的状态必须在 action 里修改，否则会警告。异步流程里，每一步修改状态的代码也要用 <code>runInAction</code> 或 <code>flow</code> 包起来，因为 <code>await</code> 之后已经不在原来的 action 里了。</p>
<h2>Redux 怎么知道组件用了什么</h2>
<p>Redux 文档把它概括为三条原则：整个应用的状态存在一个 store 的对象树里；状态是只读的，唯一的改法是 dispatch 一个描述发生了什么的 action；修改由纯函数 reducer 完成。</p>
<p>Redux 本身不知道组件读了什么。每次 dispatch 后，React Redux 让每个 <code>useSelector</code> 重新执行选择函数，用 <code>===</code> 比较这次和上次的结果，不同才让组件重新渲染。所以上面的 <code>Counter</code> 只有在未完成数量真的变了时才更新。也因此，选择函数每次都返回新数组或新对象，会导致组件每次都重新渲染，这时要用 <code>createSelector</code> 缓存派生结果，详见<a href="/questions/state-redux/">《Redux 的单向数据流为什么强调 reducer 的纯粹性？》</a>。</p>
<p>这种显式的方式让每次变化都可追溯。action 是普通对象，可以打日志、序列化、存下来回放；Redux DevTools 能显示状态的变化历史，做时间旅行调试。</p>
<h2>两者放在一起比</h2>
<table><thead><tr><th>方面</th><th>MobX</th><th>Redux（Redux Toolkit）</th></tr></thead><tbody><tr><td>状态形态</td><td>可变的 observable 对象、类</td><td>不可变的单一状态树</td></tr><tr><td>修改方式</td><td>在 action 里直接赋值</td><td>dispatch action，由 reducer 返回新状态</td></tr><tr><td>更新粒度</td><td>自动追踪读到的属性</td><td><code>useSelector</code> 比较选出的值</td></tr><tr><td>派生数据</td><td><code>computed</code>，自动缓存</td><td><code>createSelector</code> 手动声明输入</td></tr><tr><td>调试</td><td>依赖关系可用 <code>getDependencyTree</code> 等工具查看</td><td>DevTools 记录每个 action，可时间旅行</td></tr><tr><td>代码量</td><td>少</td><td>较多，Toolkit 已大幅简化</td></tr></tbody></table>
<h2>怎样选</h2>
<p>团队熟悉面向对象建模、领域模型复杂、对象之间互相引用多，或者希望少写样板代码，MobX 更顺手。团队规模大、需要严格约定所有修改的入口、重视可回放和可测试，或者已经在用 RTK Query 管理服务端数据，Redux Toolkit 更合适。</p>
<p>不管选哪个，服务端数据的请求和缓存都可以交给专门的查询库，状态库只管客户端状态。</p>
<h2>常见追问</h2>
<p><strong>MobX 和 Vue 的响应式是一回事吗？</strong></p>
<blockquote>
<p>思路相同。Vue 文档在讲 signals 时提到，Vue 的 Options API 和 MobX 都基于同样的原理，只是把响应式原语藏在了对象属性后面。都是读的时候收集依赖，写的时候通知更新，computed 也都有缓存。</p>
</blockquote>
<p><strong>MobX 里为什么在 await 之后改状态会有警告？</strong></p>
<blockquote>
<p>因为 action 只包住了同步执行的那一段。<code>await</code> 之后的代码在新的微任务里运行，已经不在 action 里了，而默认配置要求被观察的状态必须在 action 里修改。把 <code>await</code> 之后的修改包进 <code>runInAction</code>，或者把整个函数写成 <code>flow</code> 生成器即可。</p>
</blockquote>
<p><strong>Redux Toolkit 用了 Immer，是不是就和 MobX 一样了？</strong></p>
<blockquote>
<p>不一样。Immer 只是让 reducer 里的写法看起来像直接修改，最终产出的仍是新的不可变状态，更新仍然要经过 dispatch 和 reducer，组件仍靠 <code>useSelector</code> 比较引用。MobX 是真的修改原对象，靠追踪读写来通知更新。</p>
</blockquote>`};export{e as default};