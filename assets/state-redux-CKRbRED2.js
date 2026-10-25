var e={answerHtml:`<p>当很多组件共享状态时，如果每个组件都能直接改任意对象，就很难回答“这项数据为什么变了”。Redux 把更新集中为一条路径：发出 action，reducer 依据旧状态计算新状态，订阅者读取新的结果。</p>
<p>reducer 的纯粹性让这一步可以被独立理解：相同的 state 和 action 应得到相同结果，计算过程中不修改外部世界，也不破坏旧状态。这样记录一次 action 后，才能更可靠地测试、追踪和重现状态变化。</p>
<h2>Action 是描述，reducer 决定状态怎样变化</h2>
<p>Action 通常是带 type 的普通对象，必要时包含 payload。它描述发生了什么或应用接受了什么意图，不应该把一整个不可观察的后台流程藏进 reducer。</p>
<p>reducer 可以进行判断和数据转换，但不应该在其中发请求、启动计时器、读写浏览器存储，或根据当前时间、随机数生成不确定结果。如果更新需要一个时间或随机 ID，可以在生成 action 时确定，再把结果作为数据交给 reducer。</p>
<p>这里的纯粹不意味着逻辑只能有一行，而是输入与输出关系明确、副作用在相应层处理。</p>
<h2>Redux Toolkit 为什么允许“看起来直接修改”的代码</h2>
<p>现代 Redux 通常使用 Redux Toolkit。下面创建一个收藏 slice，并通过工厂创建应用 store：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { configureStore, createSlice } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@reduxjs/toolkit&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> bookmarksSlice = <span class="hljs-title function_">createSlice</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;bookmarks&#x27;</span>,
  <span class="hljs-attr">initialState</span>: { <span class="hljs-attr">ids</span>: [] },
  <span class="hljs-attr">reducers</span>: {
    <span class="hljs-title function_">toggled</span>(<span class="hljs-params">state, action</span>) {
      <span class="hljs-keyword">const</span> id = action.<span class="hljs-property">payload</span>;
      <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> id !== <span class="hljs-string">&#x27;string&#x27;</span> || id.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;题目 ID 不能为空&#x27;</span>);
      }
      <span class="hljs-keyword">const</span> index = state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">indexOf</span>(id);
      <span class="hljs-keyword">if</span> (index === -<span class="hljs-number">1</span>) state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(id);
      <span class="hljs-keyword">else</span> state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">splice</span>(index, <span class="hljs-number">1</span>);
    },
    <span class="hljs-title function_">cleared</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">ids</span>: [] };
    },
  },
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> { toggled, cleared } = bookmarksSlice.<span class="hljs-property">actions</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title function_">createAppStore</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">configureStore</span>({
  <span class="hljs-attr">reducer</span>: { <span class="hljs-attr">bookmarks</span>: bookmarksSlice.<span class="hljs-property">reducer</span> },
});
</code></pre></div>
<p>createSlice 的这些 reducer 由 Immer 包装，state 是可以记录修改的草稿。push 和 splice 会被用于产生不可变的新状态，不等于修改了调用者持有的旧状态对象。</p>
<p>cleared 则选择直接返回新的状态。通常一条处理路径应选择修改草稿或返回替代值，不要又修改草稿又返回另一个结果。例如把 push 的返回长度作为箭头函数的隐式返回值，可能意外与草稿修改冲突。</p>
<p>这种写法依赖 Toolkit/Immer 的包装。普通 reducer 中直接修改原对象，或拿到 store.getState() 的结果后在外部修改，都不会因为项目使用 Redux 就自动变成正确操作。</p>
<h2>为什么不可变更新不只是风格问题</h2>
<p>保留旧状态有助于比较前后变化、测试和调试。订阅与 selector 也常通过引用判断是否需要重新计算或更新；原地改了同一个对象，可能让这些判断失去依据。</p>
<p>正确的不可变更新不等于每次深拷贝整棵状态树。没有改变的部分可以保留引用，改变的路径产生新引用。Immer 帮助维护这种结构共享，但对象结构和更新范围仍会影响成本。</p>
<p>也不要把外部 payload 对象当成可以随便修改的自有草稿。应用应明确对象所有权，避免状态更新顺便改变了调用者或其他模块持有的数据。</p>
<h2>异步请求放在哪里</h2>
<p>可以通过 thunk、listener middleware 或相应的数据查询工具协调副作用，再 dispatch 请求开始、成功或失败等 action。reducer 负责把这些事实映射成状态，而不是自己等待网络。</p>
<p>同样需要处理过期请求、取消和重复提交。Redux 统一了写入路径，但不会自动判断某个成功 action 是否已经落后于用户最新的搜索意图，可以在状态里记录当前请求身份并检查。</p>
<p>store.dispatch 默认处理普通 action；使用中间件后支持的输入和返回值由中间件约定。不能把普通 action 的 dispatch 返回值一概当成服务器确认完成的 Promise。</p>
<h2>派生值与请求缓存不必手工复制</h2>
<p>收藏数量可以从 ids.length 取得，不必再保存一个 count 字段，然后要求每个 reducer 同时维护它。组件可以通过 selector 读取所需部分，复杂计算再考虑合理的记忆化。</p>
<p>React 组件通常使用 React-Redux 的绑定读取和订阅状态，而不是自己每次调用 getState 后期待界面自动更新。若 selector 每次都返回新的对象，也要考虑引用比较与更新范围，不能因为 reducer 是纯函数就认为渲染已经最优。</p>
<p>服务端数据缓存还有去重、失效、刷新、订阅和重新获取等需求。RTK Query 等工具可以承担这一层，不必把每个接口都复制成一组手工维护的全局字段；它与本地 UI 状态管理又不是完全相同的问题。</p>
<h2>可记录不等于任何东西都适合塞进状态</h2>
<p>普通可序列化数据更容易被记录、持久化和调试。DOM 节点、函数、Promise、AbortController 等运行资源通常不适合放在通用状态里；时间可以按业务需要保存为明确的数据形式，而不是依赖一个不断变化的外部对象。</p>
<p>回放 reducer 也不等于回放或撤销所有外部副作用。已经提交的请求、写入和支付不能靠 DevTools 回到旧状态就被取消，业务仍需要自己的幂等和恢复机制。</p>
<p>浏览器应用通常为当前应用创建一个 store；SSR 则要管理每个请求的实例与公开初始状态，避免用户数据串用。是否需要 Redux，最终取决于共享状态与更新流程是否值得采用这些约束，而不是所有项目都必须有一个全局 store。</p>`};export{e as default};