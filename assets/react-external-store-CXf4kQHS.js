var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>有些数据不在 React 里，比如浏览器是否在线、一个自己写的全局 store。<code>useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)</code> 就是把这种外部数据接进组件的官方方式。<code>subscribe</code> 负责在数据变化时通知 React，<code>getSnapshot</code> 负责返回当前的数据，这个值叫快照。</p>
<p>React 收到通知后，会再调一次 <code>getSnapshot</code>，用 <code>Object.is</code> 跟上一次比较，不同才重新渲染。所以数据没变时，<code>getSnapshot</code> 必须返回同一个引用。如果每次都返回一个新对象，React 每次都认为变了，就会无限渲染。</p>
<p>它比用 <code>useEffect</code> 订阅好在两点：渲染时同步读数据，第一次渲染就有值；并发渲染时保证同一次渲染里所有组件读到同一份快照，不会出现一屏上新旧数据混着显示的“撕裂”。Zustand、react-redux 内部都用它。</p>
<p>要注意，<code>subscribe</code> 要定义在组件外面保持引用稳定；服务端渲染要提供 <code>getServerSnapshot</code>，返回值两端要一致。</p>
</blockquote>
<h2>先接一个浏览器 API</h2>
<p>下面把 <code>navigator.onLine</code> 接进 React，网络断开或恢复时组件自动更新。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useSyncExternalStore } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">callback</span>) {
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;online&#x27;</span>, callback);
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;offline&#x27;</span>, callback);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;online&#x27;</span>, callback);
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;offline&#x27;</span>, callback);
  };
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useOnlineStatus</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">useSyncExternalStore</span>(
    subscribe,
    <span class="hljs-function">() =&gt;</span> navigator.<span class="hljs-property">onLine</span>,
    <span class="hljs-function">() =&gt;</span> <span class="hljs-literal">true</span>, <span class="hljs-comment">// 服务端假定在线</span>
  );
}
</code></pre></div>
<p><code>subscribe</code> 收到 React 给的 <code>callback</code>，在网络状态变化时调用它，并返回一个取消订阅的函数。<code>getSnapshot</code> 返回布尔值，布尔值没变 <code>Object.is</code> 就相等，天然稳定。</p>
<p>为什么 <code>subscribe</code> 写在组件外面？如果写在组件里，每次渲染都是一个新函数，React 会以为订阅方式变了，反复取消再重新订阅。</p>
<h2>数据没变却返回新对象会怎样</h2>
<p>下面这个最小 store 模拟 React 的判断逻辑，可以直接用 node 运行，看看两种 <code>getSnapshot</code> 的区别。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createStore</span>(<span class="hljs-params">initial</span>) {
  <span class="hljs-keyword">let</span> state = initial;
  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">getSnapshot</span>: <span class="hljs-function">() =&gt;</span> state,
    <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">listener</span>) {
      listeners.<span class="hljs-title function_">add</span>(listener);
      <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> listeners.<span class="hljs-title function_">delete</span>(listener);
    },
    <span class="hljs-title function_">setState</span>(<span class="hljs-params">update</span>) {
      state = { ...state, ...update }; <span class="hljs-comment">// 生成新对象，引用变化才会触发更新</span>
      listeners.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">l</span>) =&gt;</span> <span class="hljs-title function_">l</span>());
    },
  };
}

<span class="hljs-keyword">const</span> store = <span class="hljs-title function_">createStore</span>({ <span class="hljs-attr">items</span>: [{ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">active</span>: <span class="hljs-literal">true</span> }] });

<span class="hljs-keyword">const</span> <span class="hljs-title function_">stable</span> = (<span class="hljs-params"></span>) =&gt; store.<span class="hljs-title function_">getSnapshot</span>();
<span class="hljs-keyword">const</span> <span class="hljs-title function_">unstable</span> = (<span class="hljs-params"></span>) =&gt; store.<span class="hljs-title function_">getSnapshot</span>().<span class="hljs-property">items</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">i</span>) =&gt;</span> i.<span class="hljs-property">active</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-title function_">stable</span>(), <span class="hljs-title function_">stable</span>()));     <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-title function_">unstable</span>(), <span class="hljs-title function_">unstable</span>())); <span class="hljs-comment">// false</span>

<span class="hljs-keyword">const</span> before = <span class="hljs-title function_">stable</span>();
store.<span class="hljs-title function_">subscribe</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;通知：数据变了&#x27;</span>));
store.<span class="hljs-title function_">setState</span>({ <span class="hljs-attr">coupon</span>: <span class="hljs-string">&#x27;A&#x27;</span> });               <span class="hljs-comment">// 通知：数据变了</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(before, <span class="hljs-title function_">stable</span>()));      <span class="hljs-comment">// false</span>
</code></pre></div>
<p>在组件里，把 store 的两个方法交给 Hook 即可：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> snapshot = <span class="hljs-title function_">useSyncExternalStore</span>(store.<span class="hljs-property">subscribe</span>, store.<span class="hljs-property">getSnapshot</span>);
</code></pre></div>
<p><code>stable</code> 直接返回保存的 <code>state</code>，只要没调 <code>setState</code>，两次读到的就是同一个对象。<code>unstable</code> 每次都跑一遍 <code>filter</code>，内容一样，但每次都是新数组，<code>Object.is</code> 永远是 <code>false</code>。</p>
<p>放进 React 里，这就意味着 React 每次检查都发现“变了”，于是重新渲染，渲染时又读到一个新数组，又认为变了，最后就是无限循环，React 会报错。</p>
<p>反过来，<code>setState</code> 里要生成新对象并通知订阅者。引用变了，React 才知道该更新；引用没变，React 就跳过。如果直接改 <code>state.coupon = &#x27;A&#x27;</code>，引用没变，组件就不会更新。</p>
<h2>需要派生数据怎么办</h2>
<p>上面的 <code>filter</code> 是很常见的需求。改法有两种：在 store 内部把派生结果缓存起来，原始数据不变就返回同一个结果；或者先用 <code>useSyncExternalStore</code> 取到稳定的原始快照，再在组件里用 <code>useMemo</code> 计算。</p>
<p>下面两段写在组件里，不能单独运行：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 错误：每次都返回新数组，Object.is 永远为 false</span>
<span class="hljs-keyword">const</span> items = <span class="hljs-title function_">useSyncExternalStore</span>(subscribe, <span class="hljs-function">() =&gt;</span> store.<span class="hljs-title function_">getState</span>().<span class="hljs-property">items</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">i</span>) =&gt;</span> i.<span class="hljs-property">active</span>));
</code></pre></div>
<h2>和用 useEffect 订阅有什么区别</h2>
<p>用 <code>useEffect</code> 订阅再 <code>setState</code>，第一次渲染时还拿不到数据，要等 Effect 跑完再渲染一次。而且在并发渲染中，React 可能渲染到一半暂停，这期间外部数据变了，前后组件就读到不同的值，出现撕裂。</p>
<p><code>useSyncExternalStore</code> 在渲染时同步读取快照，外部数据的更新也以同步优先级处理，所以没有这些问题。</p>
<h2>常见追问</h2>
<p><strong>能和 Transition 配合，让外部数据的更新不阻塞输入吗？</strong></p>
<blockquote>
<p>不能。外部数据变化总是以同步优先级渲染，没法标成 Transition。</p>
</blockquote>
<p><strong>平时写业务需要用它吗？</strong></p>
<blockquote>
<p>一般不用。只是在 React 内部共享状态，用 state 和 Context 就够了。这个 Hook 主要给状态库作者，以及接入浏览器 API 时使用。</p>
</blockquote>`};export{e as default};