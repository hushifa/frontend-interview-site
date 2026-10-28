var e={answerHtml:`<h2>简答</h2>
<p>React 按调用顺序把每个 Hook 和它的状态对应起来，所以 Hook 只能在组件或自定义 Hook 的顶层调用，不能放进条件、循环或提前 return 之后。条件逻辑应放在 Hook 内部，或拆成不同组件。自定义 Hook 复用的是逻辑，每次调用都有独立状态。例外是 use，它可以在条件里调用。</p>
<p>函数组件每次渲染都会重新执行，但 React 需要知道这一轮的第一个 useState 对应上一轮哪一份状态，第二个 useEffect 又对应哪一段同步关系。稳定的 Hook 调用结构使这种关联可以被维护。</p>
<p>如果某一轮跳过一个 Hook，后面的调用位置可能整体改变，React 就无法按原关系解释这些状态。因此 useState、useEffect 等常规 Hook 不能放进随渲染改变的条件、循环或提前返回之后。</p>
<h2>顶层指调用结构，不是只能写在文件最前面</h2>
<p>可以在 Hook 前计算普通局部值，也可以在自定义 Hook 中继续调用其他 Hook。关键是不要让常规 Hook 的调用随着分支、循环次数或嵌套回调而改变。</p>
<p>事件处理器、普通工具函数、useMemo 回调和 Effect 回调也不是可以随意调用新 Hook 的位置。事件中可以调用已经取得的状态 setter，但不能等用户点击后才调用 useState 创建一份组件状态。</p>
<p>如果列表有多个需要状态的项目，应渲染多个子组件，让每个组件维护自己的 Hook 结构，而不是在父组件的 map 中直接循环调用 useState。</p>
<h2>有条件的外部工作，放到 Effect 内判断</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">EscapeHint</span>(<span class="hljs-params">{ enabled }</span>) {
  <span class="hljs-keyword">const</span> [pressed, setPressed] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (!enabled) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">function</span> <span class="hljs-title function_">onKeyDown</span>(<span class="hljs-params">event</span>) {
      <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;Escape&#x27;</span>) <span class="hljs-title function_">setPressed</span>(<span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> value + <span class="hljs-number">1</span>);
    }
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;keydown&#x27;</span>, onKeyDown);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;keydown&#x27;</span>, onKeyDown);
  }, [enabled]);

  <span class="hljs-keyword">if</span> (!enabled) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;Escape 次数&quot;</span>&gt;</span>{pressed}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span></span>;
}
</code></pre></div>
<p>enabled 为 false 时，useState 和 useEffect 仍按同样的结构被调用，只是 Effect 不建立监听，组件不输出界面。enabled 变为 false 后，上一轮已经建立的监听也会被清理。</p>
<p>这不同于把整个 useEffect 包在 <code>if (enabled)</code> 里面。条件控制的是是否建立那份外部关系，而不是 React 是否能看到这个 Hook 的位置。</p>
<p>如果设计上希望禁用时把整个状态实例也销毁，可以由父组件决定是否渲染 EscapeHint。重新挂载时状态重新开始，这是组件生命周期选择，而不是有条件调用 Hook。</p>
<h2>自定义 Hook 封装逻辑，不自动共享状态</h2>
<p>下面继续使用前面的 useState 导入：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">useCounter</span>(<span class="hljs-params">initialValue = <span class="hljs-number">0</span></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(initialValue);
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> value + <span class="hljs-number">1</span>);
  }
  <span class="hljs-keyword">return</span> { count, increment };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params">{ label }</span>) {
  <span class="hljs-keyword">const</span> { count, increment } = <span class="hljs-title function_">useCounter</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{increment}</span>&gt;</span>{label}：{count}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Counters</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Counter</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;甲&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Counter</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;乙&quot;</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>两个 Counter 都调用 useCounter，但各自拥有一份状态。点击甲不会自动增加乙；共享的是逻辑代码，不是某个模块级计数器。</p>
<p>如果真的需要共享同一份状态，可以提升到共同祖先，再通过 props、Context 或合适的外部 store 提供。不能因为 Hook 名字相同，就把它当成单例服务。</p>
<p>自定义 Hook 也受同样的调用规则约束。给普通函数加一个 use 前缀，不会让它在 React 之外合法使用组件状态，只是帮助代码表达用途并让相关 lint 工具识别规则。</p>
<h2>提前返回为何特别容易踩坑</h2>
<p>一个组件第一次发现数据缺失就提前返回，第二次数据到达后才继续执行 useState，这也改变了调用结构。不是只有显式写在 if 花括号里面的 Hook 才算有条件调用。</p>
<p>可以把需要调用的 Hook 放到提前返回前，并在内部处理缺失数据；也可以把有数据时才需要的完整逻辑拆成一个子组件，由父组件控制是否挂载。选择取决于状态应该保留还是重置。</p>
<p>组件和 Hook 的定义也应保持稳定。每次渲染临时定义一个新的组件类型，可能让 React 把它视为新的身份，导致状态反复重置；不能只检查 Hook 出现的位置，还要考虑承载它的组件身份。</p>
<h2>use API 是明确的例外，不是规则废除</h2>
<p>React 的 use API 有不同约束，可以在某些条件和循环中读取资源，但仍必须处于 React 允许的组件或 Hook 上下文，也不能用 try/catch 随意包住其读取流程。处理等待与错误需要 Suspense 和错误边界机制。</p>
<p>这个例外不能推广到 useState、useEffect、useMemo 等其他 Hook。判断一个 API 的规则，应阅读对应文档，而不是看到它以 use 开头就推断所有行为完全相同。</p>
<h2>稳定顺序只是正确使用 Hook 的一部分</h2>
<p>保持调用位置正确，不代表依赖数组、闭包和清理逻辑就一定正确。Effect 可能漏依赖，回调可能读取旧快照，订阅也可能没有解除。这些需要另外的规则和测试。</p>
<p>建议使用官方维护的 Hooks lint 规则，并理解诊断为何出现，而不是大面积禁用检查。重构时把状态来源、条件工作与组件生命周期分清楚，通常就不需要通过动态选择 Hook 或绕过 lint 来维持行为。</p>
<p>补充参考：<a href="https://react.dev/reference/react/use">React · use</a>。</p>`};export{e as default};