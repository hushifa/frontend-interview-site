var e={answerHtml:`<h2>简答</h2>
<ul>
<li>现代引擎使用标记清除：从全局对象、调用栈等根出发标记所有可达对象，未被标记的被回收。</li>
<li>两个对象互相引用但从根不可达时会被回收，循环引用不是泄漏原因。</li>
<li>泄漏是&quot;可达但不再需要&quot;：未移除的事件监听器、未清除的定时器、只增不减的 <code>Map</code> 缓存、未取消的订阅、全局变量。</li>
<li><code>WeakMap</code> 和 <code>WeakRef</code> 不阻止目标被回收，但回收时机不确定；<code>FinalizationRegistry</code> 的回调可能不执行。</li>
<li>排查方法：重复同一操作，比较 DevTools 堆快照中对象数量的增长，并查看到 GC 根的保留路径。</li>
</ul>
<h2>监听器与定时器</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">attachPreview</span>(<span class="hljs-params">button, panel</span>) {
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onClick</span>(<span class="hljs-params"></span>) {
    panel.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;预览已更新&#x27;</span>;
  }

  button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onClick);
  <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
    panel.<span class="hljs-property">dataset</span>.<span class="hljs-property">checkedAt</span> = <span class="hljs-title class_">String</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>());
  }, <span class="hljs-number">1000</span>);

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">dispose</span>(<span class="hljs-params"></span>) {
    button.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onClick);
    <span class="hljs-built_in">clearInterval</span>(timer);
  };
}
</code></pre></div>
<p><code>panel</code> 从页面移除后，定时器回调仍引用它，定时器又被浏览器持有，所以 <code>panel</code> 一直可达。创建资源的函数返回 <code>dispose</code>，在组件卸载时调用。</p>
<p>也可以用 <code>AbortController</code> 一次移除多个监听器：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onClick, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
controller.<span class="hljs-title function_">abort</span>(); <span class="hljs-comment">// 两个监听器同时移除</span>
</code></pre></div>
<h2>其他常见来源</h2>
<ul>
<li>缓存没有容量上限：用 LRU 或 <code>WeakMap</code>（键是对象时）。</li>
<li>被移出 DOM 的节点仍被 JS 变量或数组引用（DevTools 中显示为 Detached）。</li>
<li>闭包持有不必要的大对象：闭包只保留它实际引用的变量，但同一作用域内的多个闭包可能共享环境。</li>
<li>控制台 <code>console.log</code> 打印的对象会被 DevTools 保留，排查时关闭控制台或清空。</li>
</ul>
<h2>排查流程</h2>
<ol>
<li>在 Chrome DevTools 的 Memory 面板拍一次堆快照。</li>
<li>重复执行怀疑泄漏的操作（打开再关闭弹窗）若干次，再拍快照。</li>
<li>选择 Comparison 视图，按 <code># Delta</code> 排序，找数量持续增长的构造函数。</li>
<li>选中对象查看 Retainers，沿保留路径找到本应断开的引用。</li>
</ol>
<p><code>Retained size</code> 是释放该对象后能回收的总内存，比 <code>Shallow size</code> 更能反映影响。内存没有立刻回落不一定是泄漏，引擎会保留已申请的堆以复用；判断依据是相同操作下对象数持续增长。</p>
<h2>弱引用</h2>
<ul>
<li><code>WeakMap</code>：把元数据附加在对象上，对象被回收后条目自动消失。</li>
<li><code>WeakRef</code>：<code>deref()</code> 可能返回 <code>undefined</code>，用于可以丢失的缓存。</li>
<li><code>FinalizationRegistry</code>：回收后的回调时间不确定，不能用于关闭连接、取消订阅等必须执行的清理。</li>
</ul>
<p>文件句柄、网络连接、订阅这类外部资源要显式释放，GC 只管内存。</p>
<h2>常见追问</h2>
<ul>
<li>React 中怎样避免？在 <code>useEffect</code> 返回清理函数；异步请求结束时组件已卸载，用 <code>AbortController</code> 取消。</li>
<li>引用计数为什么被淘汰？无法回收循环引用。</li>
</ul>`};export{e as default};