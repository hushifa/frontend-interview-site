var e={answerHtml:`<h2>简答</h2>
<p>Error Boundary 捕获后代在渲染、生命周期中抛出的错误并显示备用界面，但捕获不到事件处理函数和普通异步回调里的错误。Suspense 在后代挂起（读取未完成的 Promise、懒加载组件）时显示 fallback。两者通常搭配：Suspense 处理“还在等”，Error Boundary 处理“失败了”。边界放多大，决定失败或等待时影响的界面范围。</p>
<p>一个区域正在等待模块加载，和它已经抛出错误，应该给用户不同反馈。Suspense 处理支持其机制的等待，Error Boundary 处理 React 流程中的错误；没有记录则通常是一个正常业务状态，不应该自动变成这两者中的任何一种。</p>
<p>它们都可以提供 fallback，但触发原因和恢复方式不同。</p>
<h2>Error Boundary 捕获后代错误并替换这部分界面</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Component</span>, <span class="hljs-title class_">Suspense</span>, lazy, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">class</span> <span class="hljs-title class_">ErrorBoundary</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">Component</span> {
  state = { <span class="hljs-attr">failed</span>: <span class="hljs-literal">false</span> };

  <span class="hljs-keyword">static</span> <span class="hljs-title function_">getDerivedStateFromError</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">failed</span>: <span class="hljs-literal">true</span> };
  }

  <span class="hljs-title function_">componentDidCatch</span>(<span class="hljs-params">error</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;内容渲染失败：&#x27;</span>, error);
  }

  <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">state</span>.<span class="hljs-property">failed</span>) {
      <span class="hljs-keyword">return</span> (
        <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>这部分内容暂时无法显示。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{this.props.onRetry}</span>&gt;</span>重试<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
      );
    }
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span>.<span class="hljs-property">children</span>;
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Content</span>(<span class="hljs-params">{ broken }</span>) {
  <span class="hljs-keyword">if</span> (broken) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;演示渲染错误&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>内容正常显示<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ErrorDemo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [broken, setBroken] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-keyword">const</span> [attempt, setAttempt] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">retry</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">setBroken</span>(<span class="hljs-literal">false</span>);
    <span class="hljs-title function_">setAttempt</span>(<span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> value + <span class="hljs-number">1</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setBroken(true)}&gt;触发渲染错误<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ErrorBoundary</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{attempt}</span> <span class="hljs-attr">onRetry</span>=<span class="hljs-string">{retry}</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">Content</span> <span class="hljs-attr">broken</span>=<span class="hljs-string">{broken}</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">ErrorBoundary</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>点击按钮只是更新 broken，真正的异常在下一次 Content 渲染时抛出，边界因此显示自己的回退。getDerivedStateFromError 负责决定回退状态，componentDidCatch 可以记录诊断信息。</p>
<p>这里重试先把错误原因修正为 false，再更换边界身份使其重建。如果只清空边界状态，却继续传入必然抛错的 broken=true，下一次仍然会失败。</p>
<p>实际项目不必都通过 key 重置，也可以使用库提供的 reset 机制或自行设计状态恢复，但都需要明确是否清理旧子树、如何处理用户未保存内容。</p>
<h2>哪些错误不会被普通边界自动接住</h2>
<p>边界可以处理后代渲染及 React 管理的相关生命周期错误，但不负责捕获任意普通事件处理器或独立 setTimeout 回调里的异常，也不能捕获它自己的回退界面内部再发生的错误。</p>
<p>事件提交、普通 Promise 和计时器工作仍需在对应调用边界处理。现代 React 的 Action、useTransition 中的错误或 useActionState 抛错可以按其专门路径进入 Error Boundary，所以也不能反过来概括成“所有异步错误都绝不会到边界”。</p>
<p>判断时应看任务有没有连接到 React 支持的错误流程，而不是只看函数前面有没有 async。意外的代码错误与可预期的字段校验失败，也应使用不同的产品反馈。</p>
<h2>Suspense 不会自动观察所有请求</h2>
<p>下面沿用前面的导入，用本地延迟模拟 lazy 模块变得可用，便于观察加载回退：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title class_">DelayedPanel</span> = <span class="hljs-title function_">lazy</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">resolve</span>({ <span class="hljs-attr">default</span>: <span class="hljs-keyword">function</span> <span class="hljs-title function_">Panel</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>面板已就绪<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>; } });
  }, <span class="hljs-number">300</span>);
}));

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">LoadingDemo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>正在准备面板<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">DelayedPanel</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>lazy 等待一个带有 default 组件的模块结果，未就绪时由附近的 Suspense 显示 fallback。真实的代码分割常采用动态 import，而不是本例中的模拟模块对象。</p>
<p>模块就绪后 React 再尝试渲染内容。lazy 声明应保持在合适的模块级等稳定位置，不要每次父组件渲染都重新创建一个新的 lazy 组件身份。</p>
<p>普通 useEffect 中启动的 fetch 不会因为外面包了 Suspense，就自动让边界显示加载状态。Effect 在提交之后执行，普通请求没有参与渲染阶段的等待协议。应使用框架集成、lazy、use 读取合适资源等支持方式，而不是随意把所有 Promise 当成同一种机制。</p>
<h2>加载失败通常需要两个边界协作</h2>
<p>模块或支持的资源等待期间使用 Suspense；最终失败时，需要 Error Boundary 告诉用户这部分内容出了问题。可以在一个可独立理解的区域外放错误边界，再在内部安排加载边界。</p>
<p>只放 Suspense，不能保证所有错误都显示成它的 loading；只放 Error Boundary，也不会自然替你设计等待中的界面。</p>
<p>lazy 会缓存加载过程与结果，加载失败后仅仅重新渲染或改一个外部 key，不一定重新发起模块加载。重试可能需要框架支持、重新建立合适资源或刷新页面，必须结合失败原因设计，不能给一个实际上无效的按钮随便写上“重试”。</p>
<h2>边界范围应该与用户理解的内容区域对应</h2>
<p>把整页都包在一个大加载边界里，一个小图表等待也可能替换整页；把每个小文本都拆成独立边界，又可能出现大量零碎占位和跳动。</p>
<p>通常按用户可以独立阅读、独立失败或独立等待的区域组织，例如主内容、侧栏推荐或独立面板。错误边界也应让未失败区域尽量继续工作，并提供回到安全位置的入口。</p>
<p>如果已经显示的内容在更新时再次等待，Transition 或延迟值在适用条件下可以帮助保留旧内容，而不是立即切回 fallback。但首次显示、新边界身份和其他情形仍有不同规则，应明确“旧内容正在更新”的状态。</p>
<h2>服务端流程不是普通客户端边界的直接复制</h2>
<p>经典的客户端 Error Boundary 并不在服务端渲染时以同样方式捕获并恢复所有错误。流式服务端渲染和框架可以借助 Suspense 的回退、客户端重试等机制处理部分服务端失败，但需要遵循具体渲染协议。</p>
<p>不能只在浏览器里验证一个错误按钮，就认定服务器首屏失败、hydration 或资源缓存失效都已经处理。相反，服务端曾使用某个加载回退，也不必然意味着客户端最终无法成功显示内容。</p>
<h2>回退界面本身也需要可用</h2>
<p>加载提示应说明当前在等什么，错误提示应提供可执行的下一步，普通空结果则应说明确实没有内容。必要时处理焦点、读屏提示与恢复后的上下文，而不只是把整个区域替换成一行技术堆栈。</p>
<p>日志需要保留版本与操作上下文，但不要直接向用户展示内部敏感数据。边界的价值是限制失败影响并支持恢复，不是把异常静默吞掉，让页面表面上没有白屏却失去真实功能。</p>
<p>补充参考：<a href="https://react.dev/reference/react/Component">React · Component / Error Boundaries</a>。</p>`};export{e as default};