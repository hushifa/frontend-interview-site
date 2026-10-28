var e={answerHtml:`<h2>简答</h2>
<p>useTransition 把某些状态更新标记为可中断的低优先级更新，让输入等紧急操作先响应，并提供 isPending 表示是否在进行中。useDeferredValue 在你拿不到 setter、只拿到值时使用，返回该值的滞后版本。它们调整的是 React 渲染调度，不会对请求防抖，也无法打断一段长时间运行的同步 JavaScript。重计算的子组件还要配合 memo，才能真正跳过渲染。</p>
<p>输入框需要立即显示用户刚输入的字符，但几千行搜索结果可以稍后更新。如果把所有工作都当作同样紧急，昂贵结果区的重新计算就可能拖慢输入反馈。</p>
<p>useTransition 与 useDeferredValue 用来表达这种优先级差异。它们不是让任务固定等几百毫秒，也不是自动把计算移到 Worker，而是让 React 在适当边界优先处理更紧急的工作。</p>
<h2>能控制状态更新的位置，可以使用 Transition</h2>
<p>useTransition 返回 isPending 和 startTransition。把更新放进 startTransition 的 Action 中，可以标记它们的过渡语义，并通过 isPending 显示相关等待状态。</p>
<p>startTransition 的回调会被调用，并不意味着里面每一句 JavaScript 都被推迟执行。如果先在回调里同步计算很久，再调用 setter，前面那段计算仍然可能占住主线程。</p>
<p>普通快速状态更新未必需要 Transition。应该将它用于允许暂时保留旧界面、又不希望阻塞更紧急交互的工作，而不是给每一个 setState 都套一层。</p>
<h2>只有输入值可用时，可以让结果区读取延迟版本</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { memo, useDeferredValue, useState, useTransition } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> topics = [<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;CSS&#x27;</span>, <span class="hljs-string">&#x27;JavaScript&#x27;</span>, <span class="hljs-string">&#x27;React&#x27;</span>, <span class="hljs-string">&#x27;TypeScript&#x27;</span>];

<span class="hljs-keyword">const</span> <span class="hljs-title class_">Results</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">Results</span>(<span class="hljs-params">{ query }</span>) {
  <span class="hljs-keyword">const</span> matches = topics.<span class="hljs-title function_">filter</span>(<span class="hljs-function"><span class="hljs-params">topic</span> =&gt;</span> topic.<span class="hljs-title function_">toLowerCase</span>().<span class="hljs-title function_">includes</span>(query.<span class="hljs-title function_">toLowerCase</span>()));
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>{matches.map(topic =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{topic}</span>&gt;</span>{topic}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>)}<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>;
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">SearchDemo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [query, setQuery] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> deferredQuery = <span class="hljs-title function_">useDeferredValue</span>(query);
  <span class="hljs-keyword">const</span> isStale = query !== deferredQuery;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>搜索<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{query}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setQuery(event.target.value)} /&gt;<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>{isStale ? &#x27;正在更新结果&#x27; : &#x27;结果已更新&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">aria-busy</span>=<span class="hljs-string">{isStale}</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">opacity:</span> <span class="hljs-attr">isStale</span> ? <span class="hljs-attr">0.6</span> <span class="hljs-attr">:</span> <span class="hljs-attr">1</span> }}&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">Results</span> <span class="hljs-attr">query</span>=<span class="hljs-string">{deferredQuery}</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>输入框直接使用 query，及时接收用户输入；结果区使用 deferredQuery，允许在新的结果尚未提交时暂时显示旧查询对应的内容。isStale 提示用户这份结果还没有追上输入，避免把旧结果误认成最新结果。</p>
<p>数据刻意很小，只用于展示组织方式，不能据此证明需要优化或观察到明显 pending。实际昂贵内容应放在合适的子组件边界，memo 或对应编译优化可以帮助它在紧急渲染中收到相同延迟值时跳过不必要计算。</p>
<p>如果先在父组件执行一个很慢的筛选，再把筛选结果交给 useDeferredValue，昂贵工作已经发生，不能期待延迟返回值把刚才的成本消除。</p>
<h2>延迟没有固定时长，也不是请求防抖</h2>
<p>useDeferredValue 不定义一个固定的 300ms 等待窗口。React 可以尽快尝试后台渲染，并让新的紧急输入打断工作；如果计算本来就很快，差异可能几乎看不见。</p>
<p>默认首次渲染通常使用传入值，后续更新才体现滞后机制；提供初始值等扩展用法应按所用版本理解。不要把它当成每次加载都固定慢一拍的工具。</p>
<p>它也不会自动减少网络请求数量。每次输入是否发请求、是否缓存、是否取消旧请求，需要请求层设计。debounce 控制触发频率，Transition 调整 React 更新调度，二者解决的问题不同。</p>
<h2>异步 Action 与 await 后的更新要明确</h2>
<p>下面沿用前面的导入，用本地延迟观察 pending 与最终更新，不包含网络请求：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">AsyncIncrement</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> [isPending, startTransition] = <span class="hljs-title function_">useTransition</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">startTransition</span>(<span class="hljs-title function_">async</span> () =&gt; {
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">300</span>));
      <span class="hljs-title function_">startTransition</span>(<span class="hljs-function">() =&gt;</span> {
        <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
      });
    });
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;计数&quot;</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{isPending}</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{increment}</span>&gt;</span>
        {isPending ? &#x27;处理中&#x27; : &#x27;延迟加一&#x27;}
      <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>当前 React 的异步 Action 可以参与 pending 跟踪，但在 await 之后需要作为 Transition 处理的状态更新，仍要按文档用 startTransition 标记。示例第二层调用不代表重新等待一次，只标记最终状态更新。</p>
<p>它也不是一个自动排队的业务请求系统。多个异步动作可能按不同顺序完成，旧响应是否还能写入状态，需要请求身份、取消或合适的 Action 状态机制处理。同一个 useTransition 发起的多个 Transition 共用一个 isPending：只要还有一项没完成，它就是 true，分不出是哪一项在等待。需要逐项显示状态时，要按请求 ID 自己维护。</p>
<h2>受控输入本身不应该被延迟</h2>
<p>直接控制文本框的状态应保持及时更新，否则用户可能看到输入回退、光标跳动或无法连续编辑。可以延后结果区、预览或其他昂贵内容，不应把同一受控 value 的 setter 当作可随意延后的工作。</p>
<p>用户正在输入时，React 的并发渲染也不是任意抢占式线程。如果某个组件函数内部执行一个很长、不可中断的同步循环，它仍可能阻塞。需要进一步减少计算、拆分任务、虚拟化或使用 Worker，而不是只增加 Transition 标记。</p>
<h2>与 Suspense 配合时，要表达旧内容的含义</h2>
<p>过渡更新中遇到支持 Suspense 的等待，React 可以在适用条件下保留已显示内容，减少突然切换成大块 loading 的打断。首次加载或新的边界身份等情形仍可能显示 fallback，不能把这理解成“用了 Transition 就再也没有加载界面”。</p>
<p>旧内容应配合清楚的更新反馈，特别是查询条件已经改变时。若数据涉及强一致性要求，也要评估继续展示旧内容是否符合业务，而不是只追求少闪一下。</p>
<p>最后，用真实设备和输入流程测量响应延迟。把某个结果显示得更晚不必然更快，真正的目标是让重要交互先得到反馈，同时保持新旧内容关系清楚、请求结果正确。</p>
<p>补充参考：<a href="https://react.dev/reference/react/useDeferredValue">React · useDeferredValue</a>。</p>`};export{e as default};