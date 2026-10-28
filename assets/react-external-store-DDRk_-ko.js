var e={answerHtml:`<h2>简答</h2>
<ul>
<li>签名：<code>useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)</code>。</li>
<li><code>subscribe(callback)</code> 在外部数据变化时调用 <code>callback</code>，并返回取消订阅的函数。</li>
<li><code>getSnapshot()</code> 返回当前数据；React 用 <code>Object.is</code> 比较新旧快照，不同才重新渲染。数据没变却每次返回新对象，会导致无限渲染。</li>
<li>它在并发渲染中保证同一次渲染里所有组件读到同一份快照，避免&quot;撕裂&quot;（同一屏显示新旧两份数据）。</li>
<li><code>getServerSnapshot</code> 用于服务端渲染和 hydration，返回值必须两端一致。</li>
</ul>
<h2>订阅浏览器 API</h2>
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
<p><code>subscribe</code> 定义在组件外部，引用稳定。如果写在组件里，每次渲染都会生成新函数，React 会反复取消并重新订阅。</p>
<h2>一个最小的 store</h2>
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

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> cartStore = <span class="hljs-title function_">createStore</span>({ <span class="hljs-attr">items</span>: [], <span class="hljs-attr">coupon</span>: <span class="hljs-literal">null</span> });

<span class="hljs-comment">// 组件中</span>
<span class="hljs-keyword">const</span> cart = <span class="hljs-title function_">useSyncExternalStore</span>(cartStore.<span class="hljs-property">subscribe</span>, cartStore.<span class="hljs-property">getSnapshot</span>);
</code></pre></div>
<p><code>getSnapshot</code> 直接返回保存的 <code>state</code>，数据没变就是同一个引用。</p>
<h2>快照不能每次新建</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 错误：每次都返回新数组，Object.is 永远为 false</span>
<span class="hljs-keyword">const</span> items = <span class="hljs-title function_">useSyncExternalStore</span>(subscribe, <span class="hljs-function">() =&gt;</span> store.<span class="hljs-title function_">getState</span>().<span class="hljs-property">items</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">i</span>) =&gt;</span> i.<span class="hljs-property">active</span>));
</code></pre></div>
<p>需要派生数据时，在 store 内部缓存派生结果，或者先取稳定的原始快照，再在组件里用 <code>useMemo</code> 计算。</p>
<h2>和 useEffect 订阅的区别</h2>
<p>用 <code>useEffect</code> 订阅后 <code>setState</code>，第一次渲染拿不到数据，而且并发渲染中可能出现撕裂。<code>useSyncExternalStore</code> 在渲染时同步读取快照，更新也以同步优先级处理。Zustand、Redux（react-redux）等库内部都基于它实现。</p>
<h2>常见追问</h2>
<ul>
<li>外部数据变化总会以同步优先级渲染，所以不能和 Transition 配合实现&quot;非阻塞更新&quot;。</li>
<li>只是在 React 内部共享状态，用 state、Context 即可，这个 Hook 主要给库作者和浏览器 API 接入使用。</li>
</ul>`};export{e as default};