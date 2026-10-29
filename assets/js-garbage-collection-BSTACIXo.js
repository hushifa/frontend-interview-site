var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>垃圾回收器判断一个对象能不能回收，看的是还能不能找到它。从全局对象、调用栈这些“根”出发，顺着引用一路标记，能走到的就留着，走不到的就回收，这叫标记清除。</p>
<p>所以两个对象互相引用，只要从根走不到它们，照样会被回收，循环引用不是泄漏的原因。</p>
<p>真正的泄漏是“还能找到，但业务上已经不需要了”。最常见的有：没移除的事件监听器、没清除的定时器、只增不减的 <code>Map</code> 缓存、没取消的订阅，还有挂在全局变量上的数据。垃圾回收器没法知道你不再需要它们。</p>
<p>排查时，在 DevTools 里重复同一个操作，比较前后两次堆快照里对象数量的变化，再沿着保留路径找出是谁还引用着它。<code>WeakMap</code> 和 <code>WeakRef</code> 不会阻止对象被回收，但回收时机不确定，<code>FinalizationRegistry</code> 的回调甚至可能不执行，不能用来做必须完成的清理。</p>
</blockquote>
<h2>为什么移除了元素，内存还是没释放</h2>
<p>下面的函数给按钮加点击监听，再开一个每秒更新面板的定时器。</p>
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
<p>假设后来 <code>panel</code> 从页面上移除了，看起来它已经没用了，可它占的内存不会释放。</p>
<p>原因是定时器回调里用到了 <code>panel</code>，而定时器由浏览器持有，每秒还要执行。顺着“浏览器 → 定时器 → 回调 → <code>panel</code>”这条路，<code>panel</code> 依然能被找到，垃圾回收器就不会回收它。</p>
<p>改法是谁创建资源，谁负责提供清理办法。这个函数返回一个 <code>dispose</code>，里面移除监听、清掉定时器，组件卸载时调用它，引用断开，<code>panel</code> 才能被回收。</p>
<p>监听器多的时候，也可以用 <code>AbortController</code> 一次全部移除：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onClick, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
controller.<span class="hljs-title function_">abort</span>(); <span class="hljs-comment">// 两个监听器同时移除</span>
</code></pre></div>
<h2>还有哪些常见的泄漏来源</h2>
<p>缓存是一个。一个只往里加、从不删除的 <code>Map</code>，会越来越大。可以给它设容量上限，比如用 LRU 淘汰最久没用的；如果缓存的键是对象，也可以改用 <code>WeakMap</code>。</p>
<p>被移出 DOM 的节点也是一个。节点从页面上删了，但如果某个 JS 变量或数组还引用着它，它就留在内存里，DevTools 里会显示为 Detached。</p>
<p>闭包也可能拖住大对象。闭包只保留它实际用到的变量，但同一个作用域里的多个闭包可能共用一份环境，其中一个用到了大对象，其他闭包活着时也可能让它释放不掉。</p>
<p>最后是排查本身。用 <code>console.log</code> 打印过的对象，DevTools 会一直保留着，以便你在控制台里展开查看。排查泄漏时要关掉控制台或者清空它，免得干扰结果。</p>
<h2>怎样用堆快照排查</h2>
<p>堆快照就是某一时刻内存里所有对象的清单。排查步骤如下：</p>
<ol>
<li>在 Chrome DevTools 的 Memory 面板拍一次堆快照。</li>
<li>重复执行怀疑泄漏的操作若干次，比如打开再关闭弹窗，然后再拍一次。</li>
<li>选择 Comparison 视图，按 <code># Delta</code> 排序，找出数量一直在涨的构造函数。</li>
<li>选中这些对象查看 Retainers，沿着保留路径找到本应断开却没断开的引用。</li>
</ol>
<p>看大小时，<code>Retained size</code> 表示释放这个对象后总共能回收多少内存，比只算对象自身的 <code>Shallow size</code> 更能说明问题。</p>
<p>还要注意，内存占用没有马上回落，不一定就是泄漏。引擎会保留已经申请到的堆空间留着复用。判断标准是：同样的操作重复做，对象数量持续增长。</p>
<h2>弱引用能解决什么</h2>
<p>弱引用就是“引用着，但不阻止它被回收”。<code>WeakMap</code> 适合给对象附加元数据，对象被回收后，对应的条目自动消失。<code>WeakRef</code> 的 <code>deref()</code> 可能返回 <code>undefined</code>，因为对象可能已经被回收了，所以只适合做丢了也没关系的缓存。<code>FinalizationRegistry</code> 能在对象被回收后执行回调，但时间不确定，甚至可能不执行，不能用来关闭连接、取消订阅这类必须完成的清理。</p>
<p>要记住，文件句柄、网络连接、订阅这些外部资源必须显式释放，垃圾回收只管内存。</p>
<h2>常见追问</h2>
<p><strong>React 里怎样避免这类泄漏？</strong></p>
<blockquote>
<p>在 <code>useEffect</code> 里返回清理函数，把监听、定时器、订阅在里面清掉。异步请求可能在组件卸载后才回来，用 <code>AbortController</code> 在清理函数里取消它。</p>
</blockquote>
<p><strong>引用计数为什么被淘汰了？</strong></p>
<blockquote>
<p>引用计数是记录每个对象被引用了几次，降到 0 就回收。它的问题是处理不了循环引用：两个对象互相引用，计数永远不为 0，就永远回收不掉。</p>
</blockquote>`};export{e as default};