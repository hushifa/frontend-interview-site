var e={answerHtml:`<h2>简答</h2>
<p>事件处理函数和 Effect 会捕获创建它们那次渲染的 props 和 state，之后状态更新不会改变已创建函数里的值，这就是过期闭包。常见修复方法：用函数式更新 setCount(c =&gt; c + 1)；把读取的值正确写进依赖数组；需要读取最新值但不想重新同步时，用 useEffectEvent；或用 ref 保存最新值。先弄清需要的是旧快照还是最新值，再选择方法。</p>
<p>组件重新渲染，会得到新的状态值并创建新的函数。但一个已经交给定时器、订阅或外部库的旧函数，不会因此自动换成新函数。它仍然沿着创建时的作用域读取变量。</p>
<p>“过期闭包”通常表示这份旧快照已经不符合业务此刻需要的语义，并不是 JavaScript 忘了更新某个变量，也不是 React 的所有状态都没有变化。</p>
<h2>为什么这个计数器停在 1</h2>
<p>下面是故意保留问题的版本：Effect 读取 count，却用空依赖数组长期保存了第一轮回调。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">StaleCounter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    }, <span class="hljs-number">1000</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(timer);
  }, []);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;错误计数&quot;</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span></span>;
}
</code></pre></div>
<p>初始渲染的 count 是 0。计时器保存的回调每次都计算 0+1，所以反复请求替换为 1，而不是根据当前计数继续增加。页面后来显示 1，不会让旧回调里的 count 绑定自动指向另一轮渲染的值。</p>
<p>Hooks 依赖检查通常会指出缺失的 count。这个警告是在提示闭包读取了什么，不应直接禁用规则后把现象归为 React 调度不稳定。</p>
<h2>如果只需要基于前值更新，可以让 React 提供它</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
    }, <span class="hljs-number">1000</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(timer);
  }, []);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;正确计数&quot;</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span></span>;
}
</code></pre></div>
<p>这里回调不再直接读取渲染中的 count，而是把一个纯更新函数交给 React。React 处理更新时传入前值，因此可以连续得到 1、2、3。</p>
<p>这不仅是把函数写法换短了，而是改变了需要读取的数据来源。Effect 仍然必须清理计时器，函数式更新并不会帮它处理资源生命周期。</p>
<p>也可以把 count 放进依赖数组，让每次变化都清理并重建计时器，但这同时改变了计时器重置时机。修复闭包要考虑期望的外部同步行为，不能只看数字能否继续增加。</p>
<h2>updater 只能解决它实际接收到的状态</h2>
<p>如果每次增量还由 step prop 决定，单纯把 count 换成函数式更新，并不会自动让闭包中的 step 也变成最新值：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">SteppedCounter</span>(<span class="hljs-params">{ step }</span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + step);
    }, <span class="hljs-number">1000</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(timer);
  }, [step]);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;步长计数&quot;</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span></span>;
}
</code></pre></div>
<p>step 改变后，这个版本重新建立计时器，符合“计时过程跟着步长配置重新同步”的设计。若业务希望维持同一份计时器，但每次触发时使用最新步长，需要进一步把计时生命周期与非响应式事件逻辑分开，而不是偷偷删掉 step。</p>
<h2>依赖与回调稳定性需要一起理解</h2>
<p>useCallback(fn, []) 并不会让函数体自动读取最新变量，它只是可能保留第一次计算出的函数身份。函数里读了会变化的值，却没有正确依赖，同样会保存旧环境。</p>
<p>memo 的自定义比较函数如果忽略函数 prop 的变化，也可能让子组件继续使用旧回调。旧函数即使源码看起来相同，也可能捕获了不同状态，所以“只比较按钮文字”不足以证明行为相同。</p>
<p>外部订阅或事件监听也有同样问题。同步条件改变时，应移除旧监听并注册新监听；需要在保留订阅的同时读取最新事件数据时，可以按约束使用 Effect Event 等能力。</p>
<h2>ref 不是所有旧值问题的万能修复</h2>
<p>ref 可以保存跨渲染的可变值，但修改 current 不会触发界面更新。把所有 state 再复制到 ref，会产生额外的数据同步规则，也让读者难以看清哪一份值才是显示来源。</p>
<p>如果确实使用 ref 连接外部回调，应明确何时更新它、回调应观察哪一份已提交状态，以及怎样清理。渲染过程中随意读写 ref 来绕过快照，不是所有情况下都安全的通用模式。</p>
<p>对于 Effect 所建立的事件逻辑，支持环境中的 useEffectEvent 可以让调用读取最新值，同时避免把纯事件读取错误地变成重建订阅的原因；它有明确调用范围，不能当成任意按钮回调的替代。</p>
<h2>有些旧快照其实是正确需求</h2>
<p>用户点“发送”时，要提交的是那一刻编辑框里的消息，还是三秒后最新的草稿？定时提示需要描述点击时的计数，还是触发时的计数？这些需求不同，闭包保留旧值不一定是错误。</p>
<p>先写清回调应该使用哪个时刻的数据，再选择机制。否则一味追求“永远最新”，反而可能把用户确认过的内容换成后来编辑的新内容。</p>
<p>请求竞态则是相关但不同的问题：旧请求晚到并覆盖新结果，既可能与旧闭包有关，也涉及任务身份和完成顺序。即使回调能读取最新状态，也不代表它自然知道自己的请求是否仍有权写入，仍需要取消或过期结果检查。</p>`};export{e as default};