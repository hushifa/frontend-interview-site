var e={answerHtml:`<p>函数组件执行时，useState 返回这一轮渲染使用的状态值。事件处理器是在这一轮中创建的，因此也能访问这一份快照。调用 setter 是请求 React 用新状态继续渲染，不会把当前函数作用域里的 count 变量原地改掉。</p>
<p>所以 setter 后立即读取 count 仍然得到旧值，首先是快照与闭包语义，而不只是一个模糊的“setState 是异步的”。</p>
<h3>三次替换和三次累加不是同一种更新</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">replaceThreeTimes</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;本次处理器看到的值：&#x27;</span>, count);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">incrementThreeTimes</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">replaceThenIncrement</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">5</span>);
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;计数&quot;</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{replaceThreeTimes}</span>&gt;</span>三次替换更新<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{incrementThreeTimes}</span>&gt;</span>三次函数更新<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{replaceThenIncrement}</span>&gt;</span>替换后递增<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>初始 count 为 0 时，第一种写法三次都先用同一快照算出 1，再把“替换为 1”排进队列，因此最终是 1，处理器里的日志仍然是 0。</p>
<p>函数式更新排入的是三个计算过程。React 处理时把前一次结果交给下一次，得到 0→1→2→3。如果在前面已经加到 1 后再点这个按钮，则从 1 连续更新到 4，而不是重新从 0 开始。</p>
<p>第三种写法说明队列中可以混合替换与更新：先替换成当前快照加 5，再对队列中的结果加 1。初始为 0 时最终为 6；不是因为写了函数式更新，其他替换操作就会被忽略。</p>
<h3>批处理减少重复工作，不改变快照含义</h3>
<p>React 会在相应边界批处理状态更新，避免同一个交互过程中每调用一次 setter 就立刻完整更新页面。现代 React 在许多异步回调场景中也支持自动批处理，不能继续把它简单限定为旧版本的某一种事件处理器。</p>
<p>但批处理不是把所有用户交互无限合并。React 需要在合理边界保证后续交互看到一致状态，具体调度还受更新优先级等影响。不要依赖 setter 后“过某个固定毫秒就更新”这种猜测。</p>
<p>setter 不返回一个表示渲染完成的 Promise，因此 await setCount(...) 不是等待新状态提交的通用方式。即使用某些强制刷新机制让 DOM 提前更新，当前处理器捕获的局部 count 也不会变成另一次渲染的变量。</p>
<h3>更新函数必须是纯计算</h3>
<p><code>current =&gt; current + 1</code> 应该只根据输入计算下一状态，不应在里面发请求、写日志作为业务依据、修改外部对象或产生一次性副作用。</p>
<p>React 可能为检查纯度或调度需要再次调用相应计算。尤其开发环境的 Strict Mode 会暴露不纯更新，因此不能把“这个 updater 只会执行一次”当成业务保证。</p>
<p>如果一次点击需要发送请求，应在事件处理器或合适的同步机制中完成，状态 updater 只计算状态。需要同时维护多个严格相关的字段时，可以考虑统一对象状态或 reducer，让一次更新表达完整关系。</p>
<h3>延迟回调也会保留创建时的状态</h3>
<p>在当前处理器里注册一个定时器，回调若直接读取 count，通常仍然读取创建它的这轮快照。后来页面重新渲染，不会自动替已经保存的旧函数更换作用域。</p>
<p>如果目标是“无论之前值是什么，再加 1”，函数式更新可以让 React 把处理队列时的前值交进来。如果目标是访问某项最新外部状态，则需要根据用途选择正确依赖、重新建立回调、Effect Event 或 ref 等机制，而不是认为函数式更新能自动读取所有最新变量。</p>
<p>ref 更新不会触发重新渲染，适合保存不直接决定 UI 的可变信息；不能为了读取方便就把所有本应驱动显示的状态都放进 ref。</p>
<h3>对象状态还要注意身份与更新方式</h3>
<p>useState 的 setter 采用新的状态值，不会像某些旧式类组件 setState 用法那样自动浅合并对象。要保留未改字段，应显式构造完整下一状态。</p>
<p>直接修改旧对象后再把同一引用传回去，可能因为 Object.is 等比较被视为没有新的状态变化，也会破坏已有快照与共享数据的预期。通常应复制实际修改路径，保留未变部分的引用，而不是每次深拷贝所有内容。</p>
<p>如果只是根据 props 和 state 算一个显示值，例如筛选后的列表或数量，优先在渲染中推导。再额外存一份并用 Effect 同步，会增加状态不一致的机会，也让“为什么这次还是旧值”更难分析。</p>
<p>理解快照之后，问题可以分成三步：当前函数拿到哪一轮状态，队列中放的是替换值还是计算函数，React 何时把计算结果提交给界面。这样比用一句“异步更新”概括所有现象更精确。</p>
<p>补充参考：<a href="https://react.dev/learn/queueing-a-series-of-state-updates">React · Queueing a Series of State Updates</a>。</p>`};export{e as default};