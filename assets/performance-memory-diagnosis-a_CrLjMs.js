var e={answerHtml:`<h2>简答</h2>
<ul>
<li>内存上涨不一定是泄漏：首次加载字典、缓存属于正常增长。要看重复同一个&quot;打开—关闭&quot;流程后，回收后的基线是否持续抬升。</li>
<li>用 Memory 面板：初始化后拍快照，执行 N 次闭环，再拍快照，用 Comparison 视图看哪些构造函数的数量随 N 增长。</li>
<li>选中可疑对象看 Retainers，沿引用链找到根：通常是 <code>window</code> 上的监听器、定时器或模块级的数组、Map。</li>
<li>移除 DOM 不等于释放：只要有长期存活的引用（监听器闭包、缓存）指向它，节点就成了 Detached 节点继续占用内存。</li>
<li>修复后用同一闭环复测，对象数量不再随次数增长即可，不要求进程内存精确回到原值。</li>
</ul>
<h2>典型泄漏</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">mountPanel</span>(<span class="hljs-params">container</span>) {
  <span class="hljs-keyword">const</span> panel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;section&#x27;</span>);
  container.<span class="hljs-title function_">append</span>(panel);

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">onResize</span> = (<span class="hljs-params"></span>) =&gt; {
    panel.<span class="hljs-property">dataset</span>.<span class="hljs-property">width</span> = <span class="hljs-title class_">String</span>(<span class="hljs-variable language_">window</span>.<span class="hljs-property">innerWidth</span>);
  };
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize);

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> panel.<span class="hljs-title function_">remove</span>(); <span class="hljs-comment">// 忘记移除监听，window 通过闭包一直留住 panel</span>
}
</code></pre></div>
<p>修复：让监听与组件同一生命周期。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">mountPanel</span>(<span class="hljs-params">container</span>) {
  <span class="hljs-keyword">const</span> panel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;section&#x27;</span>);
  container.<span class="hljs-title function_">append</span>(panel);
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(
    <span class="hljs-string">&#x27;resize&#x27;</span>,
    <span class="hljs-function">() =&gt;</span> {
      panel.<span class="hljs-property">dataset</span>.<span class="hljs-property">width</span> = <span class="hljs-title class_">String</span>(<span class="hljs-variable language_">window</span>.<span class="hljs-property">innerWidth</span>);
    },
    { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> },
  );

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    controller.<span class="hljs-title function_">abort</span>(); <span class="hljs-comment">// 一次性移除所有用这个 signal 注册的监听</span>
    panel.<span class="hljs-title function_">remove</span>();
  };
}
</code></pre></div>
<h2>检查清单</h2>
<table><thead><tr><th>来源</th><th>清理方式</th></tr></thead><tbody><tr><td><code>window</code>、<code>document</code> 上的监听</td><td><code>removeEventListener</code> 或 <code>AbortSignal</code></td></tr><tr><td><code>setInterval</code>、<code>setTimeout</code></td><td><code>clearInterval</code>、<code>clearTimeout</code></td></tr><tr><td><code>ResizeObserver</code>、<code>IntersectionObserver</code>、<code>MutationObserver</code></td><td><code>disconnect()</code></td></tr><tr><td>事件总线、状态库订阅</td><td>调用返回的取消订阅函数</td></tr><tr><td>模块级 Map、数组缓存</td><td>设置容量上限和淘汰策略</td></tr><tr><td><code>URL.createObjectURL</code></td><td><code>URL.revokeObjectURL</code></td></tr><tr><td>WebSocket、媒体流</td><td><code>close()</code>、<code>track.stop()</code></td></tr></tbody></table>
<p>框架组件里，这些清理写在 <code>useEffect</code> 的返回函数或 <code>onUnmounted</code> 中。</p>
<h2>快照分析要点</h2>
<ul>
<li>浅大小是对象自身的大小，保留大小是该对象被回收后能释放的总大小。</li>
<li>在类名筛选框输入 <code>Detached</code> 可以找到脱离文档的 DOM 节点，它们是线索，不一定都是泄漏（组件可能有意缓存）。</li>
<li>控制台打印过的对象、DevTools 当前选中的元素也会被保留，复测时清空控制台。</li>
<li>Allocation instrumentation on timeline 可以看到在哪个时间点分配了哪些仍存活的对象。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>闭包一定会导致泄漏吗？不会。监听器、节点和闭包互相引用，但整组都不可达时，垃圾回收能处理循环引用。</li>
<li><code>WeakMap</code> 能解决缓存泄漏吗？只适用于以对象为键、希望键被回收时值也跟着回收的场景，不能替代有容量上限的通用缓存。</li>
</ul>`};export{e as default};