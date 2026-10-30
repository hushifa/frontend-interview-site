var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做一个秒表，点“开始”时 <code>setInterval</code>，点“停止”时要 <code>clearInterval</code>，那个定时器 ID 存在哪里？存在普通变量里，下次渲染函数重新执行就丢了；存在 state 里，又会白白多渲染一次。这时就用 <code>useRef</code>。</p>
<p><code>useRef(initialValue)</code> 返回一个 <code>{ current: initialValue }</code> 对象，组件存在多久，它就一直是同一个对象。你可以随时改 <code>current</code>，但 React 不知道你改了，所以不会重新渲染。这就是它和 <code>useState</code> 最大的区别：state 一改就触发渲染，而且每次渲染拿到的是一份不变的快照；ref 是可变的，改了立刻生效，但界面不会跟着变。</p>
<p>所以 ref 适合保存不影响显示的值，比如定时器 ID、上一次的值，还有通过 <code>ref</code> 属性拿到的 DOM 节点，用来聚焦、滚动、测量。要显示在页面上的数据，应该用 state。</p>
<p>要注意，渲染期间不要读写 <code>ref.current</code>，只有 <code>if (ref.current === null)</code> 这种只在首次执行的初始化例外，否则组件的行为就难以预测。另外在 React 19 里，函数组件可以把 <code>ref</code> 当作普通 prop 接收，不再需要 <code>forwardRef</code>。</p>
</blockquote>
<h2>用 ref 保存定时器 ID</h2>
<p>下面的秒表要显示经过的时间，所以 <code>startTime</code> 和 <code>now</code> 放在 state 里；定时器 ID 不显示，放在 ref 里。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useRef, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Stopwatch</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [startTime, setStartTime] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> [now, setNow] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> intervalRef = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleStart</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setStartTime</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>());
    <span class="hljs-title function_">setNow</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>());
    <span class="hljs-built_in">clearInterval</span>(intervalRef.<span class="hljs-property">current</span>);
    intervalRef.<span class="hljs-property">current</span> = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setNow</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>()), <span class="hljs-number">10</span>);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleStop</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">clearInterval</span>(intervalRef.<span class="hljs-property">current</span>);
  }

  <span class="hljs-keyword">const</span> secondsPassed = startTime != <span class="hljs-literal">null</span> &amp;&amp; now != <span class="hljs-literal">null</span> ? (now - startTime) / <span class="hljs-number">1000</span> : <span class="hljs-number">0</span>;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>已经过 {secondsPassed.toFixed(3)} 秒<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{handleStart}</span>&gt;</span>开始<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{handleStop}</span>&gt;</span>停止<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>为什么 ID 不能放在普通变量 <code>let intervalId</code> 里？因为每次 <code>setNow</code> 都会让组件重新渲染，函数从头执行一遍，<code>let</code> 声明的变量又回到初始值，<code>handleStop</code> 拿到的就不是当初那个 ID 了。ref 对象由 React 保存，每次渲染返回的都是同一个，所以 <code>handleStop</code> 能读到 <code>handleStart</code> 写进去的值。</p>
<p>为什么不放进 state？可以，但没必要。ID 不显示在页面上，存进 state 每次开始都会多触发一次渲染。react.dev 的说法是：一个值需要保存，但不影响渲染逻辑，就选 ref。</p>
<h2>ref 和 state 到底差在哪</h2>
<p>用 state 时，<code>setCount(count + 1)</code> 之后紧接着读 <code>count</code>，读到的还是旧值，因为这次渲染的 <code>count</code> 是一份快照，新值要等下一次渲染才有，详见<a href="/questions/react-state/">《为什么调用 setState 后，当前变量还是旧值？》</a>。ref 不一样，在事件处理器里写 <code>ref.current = 5</code>，下一行读到的就是 5。</p>
<p>可是反过来，正因为 React 不知道 ref 什么时候变了，改 ref 不会更新界面。如果把计数器的数字存在 ref 里，点按钮时 <code>current</code> 确实在加，页面上的数字却一直不动。所以判断标准很简单：要显示的用 state，不显示、只在事件或 Effect 里用的用 ref。</p>
<h2>为什么渲染期间不能读写 ref.current</h2>
<p>React 要求组件是纯函数，同样的 props 和 state 应该渲染出同样的结果。如果在渲染时读 <code>ref.current</code> 并用它决定显示内容，结果就取决于一个 React 不知道何时变化的值；在渲染时写它，严格模式下组件函数会被调用两次，副作用也会发生两次。所以 react.dev 规定，渲染期间不要读也不要写 <code>ref.current</code>，读写应该放在事件处理器或 Effect 里。</p>
<p>唯一的例外是惰性初始化，比如只想创建一次的播放器对象：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Video</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> playerRef = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">if</span> (playerRef.<span class="hljs-property">current</span> === <span class="hljs-literal">null</span>) {
    playerRef.<span class="hljs-property">current</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">VideoPlayer</span>();
  }
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<p>这样写是允许的，因为条件只在第一次渲染时成立，结果每次都一样。为什么不直接写 <code>useRef(new VideoPlayer())</code>？因为初始值虽然只在第一次被用到，可是 <code>new VideoPlayer()</code> 这个表达式每次渲染都会执行，白白创建对象。</p>
<h2>用 ref 操作 DOM，以及 React 19 的 ref prop</h2>
<p>把 ref 对象传给 JSX 元素的 <code>ref</code> 属性，React 会在创建 DOM 节点后把节点放进 <code>current</code>，之后就能在事件里调用 <code>inputRef.current.focus()</code>。</p>
<p>自己写的组件默认不会把内部 DOM 暴露出去。在 React 19 里，函数组件可以直接从 props 里取出 <code>ref</code>，再转交给内部的元素：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">MyInput</span>(<span class="hljs-params">{ label, ref, ...otherProps }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
      {label}
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> {<span class="hljs-attr">...otherProps</span>} <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Form</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> inputRef = <span class="hljs-title function_">useRef</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">MyInput</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;姓名&quot;</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{inputRef}</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> inputRef.current.focus()}&gt;聚焦<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>以前要用 <code>forwardRef</code> 包一层才能接收 ref。react.dev 写明，React 19 里 <code>forwardRef</code> 已不再必要，以后的版本会将它废弃。至于 ref 回调、<code>useLayoutEffect</code> 里测量 DOM，见<a href="/questions/react-ref-layout-effect/">《useRef、useEffect 和 useLayoutEffect 有什么差别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样拿到上一次渲染时的值？</strong></p>
<blockquote>
<p>常见写法是在 Effect 里把当前值写进 ref，下一次渲染后就能在 Effect 或事件里读到上一次的值。但不要在渲染时读这个 ref 去显示内容；只是想根据旧值算新显示的话，react.dev 建议用一个 state 记住上一次的 prop，在渲染时比较。</p>
</blockquote>
<p><strong>改了 <code>ref.current</code>，为什么页面没变？</strong></p>
<blockquote>
<p>因为改 ref 不会触发重新渲染，React 也不知道它变了。要让界面更新，这个值应该放进 state。</p>
</blockquote>
<p><strong>严格模式下 ref 会被创建两次吗？</strong></p>
<blockquote>
<p>会。开发环境的严格模式会把组件函数调用两次，每个 ref 对象也会创建两次，其中一份被丢弃。组件是纯函数时这不影响结果，生产环境也不会这样。</p>
</blockquote>`};export{e as default};