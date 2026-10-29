var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>内存泄漏是指一个对象已经用不到了，却还被别的东西引用着，垃圾回收没法回收它。不过内存上涨不一定是泄漏，第一次加载字典、建缓存都是正常增长。要看的是同一个“打开再关闭”的流程重复做几遍以后，回收后的内存基线是不是一直往上抬。</p>
<p>定位用 DevTools 的 Memory 面板。初始化完先拍一张堆快照，然后把这个流程重复 N 次，再拍一张，用 Comparison 视图对比，看哪些构造函数的对象数量随 N 增长。</p>
<p>找到可疑对象以后，看它的 Retainers，也就是谁在引用它，沿着这条引用链一路往上找，通常会找到 <code>window</code> 上的监听器、定时器，或者模块级的数组、Map。</p>
<p>要注意，把 DOM 从页面上移除不等于释放了。只要还有长期存在的引用指向它，比如监听器的闭包、缓存，它就变成 Detached 节点继续占着内存。修复后用同一个流程复测，对象数量不再随次数增长就行，不要求内存精确回到原值。</p>
</blockquote>
<h2>一个典型的泄漏</h2>
<p>下面的面板挂载时给 <code>window</code> 加了 resize 监听，卸载时只把面板从页面上移除了：</p>
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
<p>面板从页面上消失了，为什么内存还在？因为 <code>window</code> 一直存在，它上面挂着 <code>onResize</code>，<code>onResize</code> 是个闭包，用到了 <code>panel</code>。这条引用链是 <code>window → onResize → panel</code>，所以 <code>panel</code> 一直可达，回收不掉。每打开关闭一次就多留一个，这就是泄漏。</p>
<p>改法是让监听和组件的生命周期一致。这里用 <code>AbortController</code>，卸载时一次性取消：</p>
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
<h2>哪些东西需要清理</h2>
<p>泄漏的根源几乎都是“注册了，没注销”。下面这些都要在组件卸载时清掉：</p>
<table><thead><tr><th>来源</th><th>清理方式</th></tr></thead><tbody><tr><td><code>window</code>、<code>document</code> 上的监听</td><td><code>removeEventListener</code> 或 <code>AbortSignal</code></td></tr><tr><td><code>setInterval</code>、<code>setTimeout</code></td><td><code>clearInterval</code>、<code>clearTimeout</code></td></tr><tr><td><code>ResizeObserver</code>、<code>IntersectionObserver</code>、<code>MutationObserver</code></td><td><code>disconnect()</code></td></tr><tr><td>事件总线、状态库订阅</td><td>调用返回的取消订阅函数</td></tr><tr><td>模块级 Map、数组缓存</td><td>设置容量上限和淘汰策略</td></tr><tr><td><code>URL.createObjectURL</code></td><td><code>URL.revokeObjectURL</code></td></tr><tr><td>WebSocket、媒体流</td><td><code>close()</code>、<code>track.stop()</code></td></tr></tbody></table>
<p>在框架组件里，这些清理写在 <code>useEffect</code> 的返回函数或者 <code>onUnmounted</code> 里。</p>
<h2>看快照时要注意什么</h2>
<p>快照里每个对象有两个大小。浅大小是对象自己占的大小；保留大小是如果这个对象被回收，总共能释放多少。找泄漏时更该看保留大小，因为一个小对象可能拽着一大片数据。</p>
<p>在类名筛选框里输入 <code>Detached</code>，能找到已经脱离文档的 DOM 节点。它们是线索，但不一定都是泄漏，有的组件是故意缓存起来的。</p>
<p>还有一个坑：控制台里打印过的对象、DevTools 当前选中的元素，也会被留住。所以复测前要清空控制台，否则会把它们误当成泄漏。</p>
<p>如果想知道泄漏的对象是什么时候分配的，可以用 Allocation instrumentation on timeline，它能看到每个时间点分配了哪些至今还活着的对象。</p>
<h2>常见追问</h2>
<p><strong>闭包一定会导致泄漏吗？</strong></p>
<blockquote>
<p>不会。监听器、节点和闭包互相引用也没关系，只要整组都不再可达，垃圾回收能处理循环引用。问题在于有没有长期存在的东西引用着它们，详见<a href="/questions/js-closure/">《什么是闭包？它有哪些实际应用？》</a>。</p>
</blockquote>
<p><strong><code>WeakMap</code> 能解决缓存泄漏吗？</strong></p>
<blockquote>
<p>只适用于以对象为键、希望键被回收时值也跟着回收的场景。它不能替代有容量上限的通用缓存，比如用字符串做键的缓存就用不了 <code>WeakMap</code>。</p>
</blockquote>`};export{e as default};