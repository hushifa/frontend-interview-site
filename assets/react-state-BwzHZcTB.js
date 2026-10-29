var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件每次渲染，<code>useState</code> 返回的都是这一次的状态值。事件处理器里读到的 <code>count</code>，就是这次渲染的那个值，可以把它理解成一张快照。</p>
<p>调用 <code>setCount</code> 并不会改这个变量，它只是把一个更新排进队列，请求 React 再渲染一次。新的值要到下一次渲染才拿得到，所以当前函数里的 <code>count</code> 还是旧的。</p>
<p>这也解释了为什么 <code>setCount(count + 1)</code> 连写三次只加 1：三次用的都是同一张快照。要基于前一个值累加，就传函数 <code>setCount(c =&gt; c + 1)</code>，React 会把上一步的结果传给下一步。</p>
<p>另外，React 18 起所有更新默认自动批处理，同一个事件里的多次 setter 只触发一次渲染，包括 Promise、<code>setTimeout</code> 和原生事件回调里的更新。</p>
</blockquote>
<h2>先看三个按钮</h2>
<p>下面三个按钮分别演示直接传值、传函数和两者混用：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">replaceThreeTimes</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 仍是本次渲染的值，例如 0</span>
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">incrementThreeTimes</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">replaceThenIncrement</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">5</span>);
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{replaceThreeTimes}</span>&gt;</span>+1（三次替换）<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{incrementThreeTimes}</span>&gt;</span>+3（三次函数更新）<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{replaceThenIncrement}</span>&gt;</span>+6<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>从 0 开始点第一个按钮，结果是 1，而且 <code>console.log</code> 打印的还是 0。因为这次渲染里 <code>count</code> 就是 0，三次都算出 <code>0 + 1</code>，队列里是三次“替换成 1”。</p>
<p>点第二个按钮结果是 3。传进去的是函数，React 处理队列时把上一步的结果交给下一步：0 变 1，1 变 2，2 变 3。</p>
<p>点第三个按钮结果是 6。先“替换成 5”，再对 5 执行“加 1”。</p>
<h2>用纯 JavaScript 模拟这个队列</h2>
<p>React 处理队列的方式，可以用几行代码模拟出来，用 node 运行就能看到同样的结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">processQueue</span>(<span class="hljs-params">base, queue</span>) {
  <span class="hljs-keyword">return</span> queue.<span class="hljs-title function_">reduce</span>(
    <span class="hljs-function">(<span class="hljs-params">state, update</span>) =&gt;</span> (<span class="hljs-keyword">typeof</span> update === <span class="hljs-string">&#x27;function&#x27;</span> ? <span class="hljs-title function_">update</span>(state) : update),
    base,
  );
}

<span class="hljs-keyword">const</span> count = <span class="hljs-number">0</span>; <span class="hljs-comment">// 这次渲染的快照</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">processQueue</span>(count, [count + <span class="hljs-number">1</span>, count + <span class="hljs-number">1</span>, count + <span class="hljs-number">1</span>])); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">processQueue</span>(count, [<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>, <span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>, <span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>])); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">processQueue</span>(count, [count + <span class="hljs-number">5</span>, <span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-number">1</span>])); <span class="hljs-comment">// 6</span>
</code></pre></div>
<p>直接传值时，值在放进队列之前就已经算好了，用的都是快照里的 0。传函数时，函数要等 React 处理队列时才执行，拿到的是上一步的结果。区别就在于“什么时候算”。</p>
<h2>批处理是什么</h2>
<p>批处理就是 React 把同一个事件里的多次 setter 攒在一起，最后只渲染一次。上面每个按钮都调了好几次 setter，但每次点击只渲染一次。</p>
<p>React 18 之前，只有 React 事件处理器里会这样做。React 18 用 <code>createRoot</code> 以后，<code>setTimeout</code>、Promise 回调和原生事件里的更新也会自动批处理。</p>
<p>因为 setter 只是排队，它也不返回 Promise，<code>await setCount(x)</code> 等不到新状态。想在更新后读 DOM，把逻辑放进 Effect。极少数必须马上刷新的场景可以用 <code>flushSync</code>，但当前函数里的局部变量依然是旧快照。</p>
<h2>更新函数要保持纯</h2>
<p><code>c =&gt; c + 1</code> 只应该根据参数算出下一个状态。开发环境的严格模式会把更新函数调用两次，来暴露里面的副作用。所以不要在里面发请求、改外部变量，或者写日志当作业务依据。</p>
<h2>常见追问</h2>
<p><strong>想马上用到更新后的值怎么办？</strong></p>
<blockquote>
<p>自己先算出来再用：<code>const next = count + 1; setCount(next); send(next);</code>。不要指望 setter 之后读 <code>count</code>。</p>
</blockquote>
<p><strong>对象类型的 state 怎么更新？</strong></p>
<blockquote>
<p>要创建新对象，比如 <code>setForm({ ...form, name })</code>。如果原地改了对象再把同一个引用传给 setter，React 认为没变，不会重新渲染。</p>
</blockquote>`};export{e as default};