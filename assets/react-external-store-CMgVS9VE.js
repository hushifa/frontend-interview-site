var e={answerHtml:`<h2>简答</h2>
<p>useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) 用来安全订阅 React 之外的数据源，避免并发渲染时出现画面撕裂。getSnapshot 在数据未变时必须返回同一个引用，否则会无限重渲染。subscribe 要稳定，并返回取消订阅函数。SSR 时用 getServerSnapshot 提供与服务端一致的初始值。</p>
<p>有些状态不由某个 React 组件持有，例如已有的外部状态库、浏览器提供的在线状态，或者另一个系统维护的数据。React 需要既知道“现在是什么”，又知道“以后什么时候可能变了”。</p>
<p>useSyncExternalStore 通过 getSnapshot 读取当前快照，通过 subscribe 接收变化通知，并把这些读取与 React 的渲染一致性检查衔接起来。它不是让外部对象自动变成 useState，也不负责定义 store 自己的更新规则。</p>
<h2>一个有稳定快照的简单 store</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useSyncExternalStore } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createCounterStore</span>(<span class="hljs-params">initialCount = <span class="hljs-number">0</span></span>) {
  <span class="hljs-keyword">const</span> initialSnapshot = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ <span class="hljs-attr">count</span>: initialCount });
  <span class="hljs-keyword">let</span> snapshot = initialSnapshot;
  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">publish</span>(<span class="hljs-params">nextCount</span>) {
    <span class="hljs-keyword">if</span> (nextCount === snapshot.<span class="hljs-property">count</span>) <span class="hljs-keyword">return</span>;
    snapshot = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ <span class="hljs-attr">count</span>: nextCount });
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> listener <span class="hljs-keyword">of</span> listeners) <span class="hljs-title function_">listener</span>();
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">listener</span>) {
      listeners.<span class="hljs-title function_">add</span>(listener);
      <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> listeners.<span class="hljs-title function_">delete</span>(listener);
    },
    <span class="hljs-title function_">getSnapshot</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">return</span> snapshot;
    },
    <span class="hljs-title function_">getServerSnapshot</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">return</span> initialSnapshot;
    },
    <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
      <span class="hljs-title function_">publish</span>(snapshot.<span class="hljs-property">count</span> + <span class="hljs-number">1</span>);
    },
  };
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> counterStore = <span class="hljs-title function_">createCounterStore</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params">{ label }</span>) {
  <span class="hljs-keyword">const</span> snapshot = <span class="hljs-title function_">useSyncExternalStore</span>(
    counterStore.<span class="hljs-property">subscribe</span>,
    counterStore.<span class="hljs-property">getSnapshot</span>,
    counterStore.<span class="hljs-property">getServerSnapshot</span>,
  );
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{label}：{snapshot.count}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ExternalCounters</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Counter</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;甲&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Counter</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;乙&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> counterStore.increment()}&gt;增加<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>两个 Counter 读取同一个外部 store，增加后都得到新计数。snapshot 只在 count 真的变化时新建，数据没变时 getSnapshot 总是返回同一个对象，React 据此判断无需重新渲染。</p>
<h2>通知表示可能变了，快照才提供实际值</h2>
<p>subscribe 接收一个由 React 提供的回调，数据变化时调用它。React 再读取 getSnapshot，并使用 Object.is 等规则判断是否需要处理新的快照。</p>
<p>不能只改数据而不通知，也不能通知后 getSnapshot 仍然返回一个已经被原地修改的旧对象。后者的引用没有变化，React 难以按协议识别新版本，而且先前渲染拿到的快照也被破坏。</p>
<p>订阅必须返回取消函数。组件离开或订阅关系改变时，React 才能移除对应监听。store 本身的值是否继续存活，则由 store 的所有权决定；卸载所有组件不等于这个模块级 store 一定重置。</p>
<h2>为什么每次 getSnapshot 都新建对象会出问题</h2>
<p>如果 getSnapshot 写成 <code>return { count }</code>，即使 count 没变，两次读取也得到两个不相同的对象。React 可能把它们视为持续出现的新版本，引发重复更新或提示快照结果应缓存。</p>
<p>useSyncExternalStore 会为了订阅和渲染一致性多次读取快照，getSnapshot 因此应是便宜、无副作用且可重复的读取，不应在里面发请求、更新 store 或递增一个版本号。</p>
<p>对于可变数据源，可以根据它的真实版本号或更新事件生成并缓存不可变快照；数据没有变化就返回缓存。不能只在外层给一个每次变的结果套 useMemo，就假定已经修好订阅协议。</p>
<h2>subscribe 的函数身份也需要稳定</h2>
<p>示例中的 subscribe 在创建 store 时建立，不会随着组件每次渲染重新生成。若在组件函数里每次创建一个新的订阅函数，React 可能需要重新订阅，即使底层数据源没有变化。</p>
<p>真正的数据源或频道发生变化时，重新订阅是合理的；只是为了包装同一个稳定来源而不断变更函数身份，则可能造成额外工作。可将稳定实现放到组件外，或根据真实依赖组织回调。</p>
<p>这里的方法使用闭包保存数据，不依赖调用时的 this，因此直接传给 Hook 仍能工作。对依赖实例 this 的第三方 store 方法，需要按接口正确绑定，而不是随手拆出来传递。</p>
<h2>为什么不只用 Effect 订阅再 setState</h2>
<p>手写方案需要处理渲染读取与订阅建立之间的数据变化、并发渲染时的快照一致性、重订阅和服务端初始值等问题。只写一个 Effect 注册监听，并不自动覆盖这些边界。</p>
<p>useSyncExternalStore 是 React 为这类外部订阅提供的协调接口。它能按渲染流程重新检查快照，但仍依赖 store 正确通知、正确缓存和正确清理，并不会替一个错误的数据源恢复一致性。</p>
<h2>服务端与 hydration 需要同一份初始语义</h2>
<p>getServerSnapshot 用于服务端渲染及客户端 hydration 的初始阶段，应提供与服务端输出一致的数据。跨服务器和浏览器不可能共享同一个 JavaScript 对象身份，关键是传递一致的初始数据，并在各自环境内保持需要的稳定读取。</p>
<p>示例的初始计数固定为 0，所以初始快照容易保持一致。真实用户数据应由服务端按请求创建 store，并把安全序列化后的初始数据交给客户端。不要把用户专属状态放进服务端模块级单例，让不同请求意外共用。</p>
<p>缺少适用的 getServerSnapshot 时，也不能随意把只能在浏览器读取的 API 直接放进服务端路径。应选择合适的客户端边界或定义可匹配的初始表示。</p>
<h2>细粒度选择与 Transition 还有额外约束</h2>
<p>如果组件只需要一个数值，可以让所使用的快照读取返回稳定的那个数值，或采用库提供的 selector 支持。若选择结果每次都是新对象，仍然需要保持缓存与相等语义；第三个参数是服务端快照函数，不是 selector 参数。</p>
<p>外部 store 的变更也不能仅靠在外面包 startTransition 就一概变成非阻塞更新。React 在非阻塞更新提交前会检查相关快照，若发现版本变化，可能按阻塞方式重新处理以保持一致。</p>
<p>对于由 React 自己管理的普通局部状态，useState 或 useReducer 通常更简单。只有确实存在 React 外部的数据所有者时，再用这个协议把订阅边界连接起来，而不是为了看起来更架构化把所有状态都搬到模块变量。</p>`};export{e as default};