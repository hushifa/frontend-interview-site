var e={answerHtml:`<h2>简答</h2>
<p>useEffect 用来把组件与外部系统同步，例如订阅、计时器、网络连接。依赖数组要列出 Effect 读取的所有响应式值，由 lint 规则检查，不能靠删依赖控制执行次数。清理函数会在下一次执行前和卸载时运行，开发模式的 StrictMode 会额外执行一次挂载和清理来暴露遗漏。能在渲染中计算或在事件里处理的逻辑，不应放进 Effect。</p>
<p>Effect 最适合描述一种持续关系：组件显示期间需要订阅事件、运行计时器、连接某个房间，或让外部对象与当前 props 保持一致。依赖变了，就结束旧关系、按新值建立新关系；组件离开时，则不应再保留原来的工作。</p>
<p>这比把它记成“挂载时运行一段代码”更准确，因为同一个组件在存活期间也可能多次重新同步。</p>
<h2>依赖决定这一轮同步使用的值</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">TickCounter</span>(<span class="hljs-params">{ intervalMs = <span class="hljs-number">1000</span> }</span>) {
  <span class="hljs-keyword">const</span> [ticks, setTicks] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(intervalMs) || intervalMs &lt;= <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">setTicks</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
    }, intervalMs);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(timer);
  }, [intervalMs]);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;计时次数&quot;</span>&gt;</span>{ticks}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span></span>;
}
</code></pre></div>
<p>intervalMs 是 Effect 读取的响应式 prop，所以出现在依赖中。它改变后，React 先清除上一轮的计时器，再按新的周期设置计时器；卸载时也会清除。</p>
<p>ticks 没有被这段 Effect 直接读取。回调用函数式更新，根据 React 提供的前值计算下一值，因此不需要每次 ticks 变化就重建计时器。若改成直接使用 <code>setTicks(ticks + 1)</code>，就需要重新分析闭包与依赖，不能仍然假装这段代码与 ticks 无关。</p>
<p>这里的计时器也不承诺精确时间，后台节流或主线程繁忙仍会影响回调时机；例子的目的，是展示资源怎样随依赖建立和清理。</p>
<h2>三种依赖写法表达不同的重新同步条件</h2>
<p>省略依赖数组，Effect 会在组件提交后重新执行。传入空数组，表示这段逻辑没有需要追踪变化的响应式依赖，不表示整个应用生命周期绝对只执行一次。传入 <code>[a, b]</code>，则通过 Object.is 比较各项与上一次的值，决定是否重新同步。</p>
<p>依赖需要包含 Effect 使用的 props、state，以及组件内创建且被它读取的相关函数或对象。依赖数组应有固定结构，不能根据分支随意改变长度。</p>
<p>setter 等稳定值在符合规则时不需要额外引入不必要依赖。反过来，ref.current 的变化不会触发渲染，把它塞进数组也不会让 React 自动观察任意 ref 修改。</p>
<h2>依赖不是想运行几次就随意填写的开关</h2>
<p>如果每次渲染都创建一个 options 对象，再把它作为依赖，即使字段内容相同，引用也可能每次不同，从而触发重新同步。应先检查能否在 Effect 内构造该对象，或只依赖真正影响外部同步的原始值。</p>
<p>若只是根据当前数组筛选列表，通常直接在渲染中计算；若是用户点击提交才应发送的操作，通常放在事件处理器。它们不应该为了“放副作用的习惯”都搬到 Effect，再靠删除依赖阻止循环。</p>
<p>需要读取最新值但不让那部分逻辑成为重新同步条件时，可以根据 React 版本与约束评估 Effect Event 等工具；它不是逃避所有依赖检查的通用漏洞。</p>
<h2>请求需要同时考虑取消与过期结果</h2>
<p>以下组件沿用前面的 useEffect、useState 导入，读取一个应返回字符串 name 的接口：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">UserName</span>(<span class="hljs-params">{ url }</span>) {
  <span class="hljs-keyword">const</span> [result, setResult] = <span class="hljs-title function_">useState</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span> });

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
    <span class="hljs-keyword">let</span> active = <span class="hljs-literal">true</span>;
    <span class="hljs-title function_">setResult</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span> });

    <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">load</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
        <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
        <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
        <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> data?.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;name 字段不合法&#x27;</span>);
        <span class="hljs-keyword">if</span> (active) <span class="hljs-title function_">setResult</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span>, <span class="hljs-attr">name</span>: data.<span class="hljs-property">name</span> });
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-keyword">if</span> (!active) <span class="hljs-keyword">return</span>;
        <span class="hljs-title function_">setResult</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-attr">message</span>: error <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Error</span> ? error.<span class="hljs-property">message</span> : <span class="hljs-string">&#x27;加载失败&#x27;</span> });
      }
    }

    <span class="hljs-title function_">load</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
      active = <span class="hljs-literal">false</span>;
      controller.<span class="hljs-title function_">abort</span>();
    };
  }, [url]);

  <span class="hljs-keyword">if</span> (result.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;loading&#x27;</span>) <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>加载中<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
  <span class="hljs-keyword">if</span> (result.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;error&#x27;</span>) <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>{result.message}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{result.name}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}
</code></pre></div>
<p>url 改变后，旧清理把旧任务标记为不再有效，并请求取消。即使某个已经完成的步骤或不支持取消的后续工作仍然返回，active 检查也避免它写入这一轮组件结果。</p>
<p>AbortController 用于与支持信号的操作协作，过期标记用于阻止旧结果生效，二者不是完全相同的保证。浏览器请求取消也不意味着服务器已经回滚操作，因此不能把这个模式随意套在需要事务保证的写入上。</p>
<p>Effect 回调本身不要直接写成 async，因为 async 返回 Promise，而 React 需要的是清理函数或不返回清理。把异步函数定义并调用在内部，才能明确返回同步建立的清理入口。</p>
<h2>清理应与设置相匹配，而不是无条件“恢复一切”</h2>
<p>设置了哪个计时器就清除哪个，注册了哪个监听就移除同一个引用，打开了哪个连接就关闭那一轮连接。清理使用的是上一轮 Effect 捕获的值，这恰好使它能结束旧资源，而不误关新一轮。</p>
<p>开发环境 Strict Mode 会在相关场景额外运行设置、清理、再设置，帮助发现遗漏。不要用一个“已经运行过”的 ref 直接挡掉后续设置，否则可能把应恢复的同步也跳过。应该让设置与清理能正确配对。</p>
<h2>Effect、浏览器绘制和服务端要分开看</h2>
<p>useEffect 在提交之后运行，但不保证永远在浏览器已经绘制之后才执行。交互触发的更新等情况可能采用不同调度；需要在绘制前测量和修正视觉布局时，可以考虑 useLayoutEffect，同时注意它会阻塞绘制。</p>
<p>Effect 不在服务端渲染时执行。仅在 Effect 中获取数据会影响首屏数据、重复请求、缓存和竞态处理，真实应用可以优先使用框架加载机制或成熟数据请求方案，而不是在每个组件复制一套请求 Effect。</p>
<p>判断一个 Effect 是否合理，可以问：它在与哪个外部系统同步，哪些值变化时关系需要重建，上一轮关系怎样结束。能把这三点说清楚，依赖数组和清理函数通常就不再像需要猜测的特殊语法。</p>`};export{e as default};