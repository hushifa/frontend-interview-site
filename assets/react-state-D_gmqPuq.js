var e={answerHtml:`<h2>简答</h2>
<ul>
<li>组件每次渲染时，<code>useState</code> 返回这一轮的状态值，事件处理器捕获的也是这一份快照。</li>
<li>调用 setter 是把更新排进队列、请求重新渲染，当前函数里的 <code>count</code> 变量不会变。</li>
<li><code>setCount(count + 1)</code> 连写三次只加 1；要基于前值累加，用 <code>setCount(c =&gt; c + 1)</code>。</li>
<li>React 18 起所有更新默认自动批处理，包括 Promise、setTimeout 和原生事件回调里的更新。</li>
</ul>
<h2>快照与队列</h2>
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
<p>从 0 开始：</p>
<ul>
<li><code>replaceThreeTimes</code> 三次都用快照 0 算出 1，队列里是&quot;替换为 1&quot;三次，结果为 1。</li>
<li><code>incrementThreeTimes</code> 排入三个函数，React 依次把上一步结果传给下一步：0→1→2→3。</li>
<li><code>replaceThenIncrement</code> 先替换为 5，再对 5 加 1，结果为 6。</li>
</ul>
<h2>批处理</h2>
<p>批处理把同一个事件里的多次 setter 合并成一次渲染。React 18 之前只有 React 事件处理器里会批处理，React 18 的 <code>createRoot</code> 下，<code>setTimeout</code>、Promise 回调和原生事件里的更新也会自动批处理。</p>
<p>setter 不返回 Promise，<code>await setCount(x)</code> 等不到新状态。需要在更新后读 DOM，应把逻辑放进 Effect；极少数必须同步刷新的场景可以用 <code>flushSync</code>，但当前处理器里的局部变量仍是旧快照。</p>
<h2>更新函数要纯</h2>
<p><code>c =&gt; c + 1</code> 只能根据参数计算下一状态。开发环境的严格模式会调用两次更新函数来暴露副作用，所以不要在里面发请求、修改外部变量或写日志当作业务依据。</p>
<h2>常见追问</h2>
<ul>
<li>想拿到更新后的值？直接用计算出的新值：<code>const next = count + 1; setCount(next); send(next);</code>。</li>
<li>对象状态怎么更新？创建新对象：<code>setForm({ ...form, name })</code>，原地修改后再 set 同一个引用不会触发渲染。</li>
</ul>`};export{e as default};