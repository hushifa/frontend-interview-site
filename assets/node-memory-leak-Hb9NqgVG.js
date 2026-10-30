var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>典型现象是服务内存几天里一直往上涨，涨到上限后进程崩溃、被进程管理器重启，重启时一部分请求失败，负载均衡返回 502。Node.js 是有垃圾回收的语言，泄漏的原因是有引用一直拿着对象不放，垃圾回收器没法回收它们。</p>
<p>排查分两步。先用监控或 <code>process.memoryUsage()</code> 确认 <code>heapUsed</code> 持续上涨、不回落，而不是正常的波动。然后拿堆快照：本地用 <code>--inspect</code> 启动，在 Chrome DevTools 的 Memory 面板里拍；线上可以用 <code>--heapsnapshot-signal=SIGUSR2</code> 启动，需要时发信号让进程写出快照，或者在代码里调用 <code>v8.writeHeapSnapshot()</code>。</p>
<p>找泄漏的方法是对比。先跑一会儿怀疑泄漏的功能，拍一张，再继续跑一段时间，拍第二张，在 DevTools 里切到 Comparison 视图，看哪类对象数量一直在增加，再顺着引用链找到是谁拿着它们。常见的元凶是没有上限的缓存、没移除的事件监听、没清掉的定时器，以及挂在模块级变量或全局对象上越积越多的数据。</p>
<p>要注意，拍快照时主线程会停住，可能超过一分钟，生成快照还可能让堆占用翻倍，内存不够时进程会直接崩溃。所以线上拍快照要选一个崩了也不影响可用性的实例，<code>--inspect</code> 也不能绑定到公网地址。</p>
</blockquote>
<h2>先确认是不是真的泄漏</h2>
<p>Node.js 官方诊断指南描述的泄漏现象是：内存持续增长，可能很快，也可能慢到几天甚至几周，最后进程崩溃重启；同时垃圾回收越来越频繁，CPU 升高、响应变慢。</p>
<p>内存涨一下不等于泄漏。处理一批大请求时堆会变大，垃圾回收后会落回来；泄漏是在负载差不多的情况下，回收后的底线还一路抬高。观察时可以定期记录 <code>process.memoryUsage()</code>，它返回 <code>rss</code>、<code>heapTotal</code>、<code>heapUsed</code>、<code>external</code>、<code>arrayBuffers</code> 几个数。<code>heapUsed</code> 一直涨说明是 JavaScript 对象没释放；<code>heapUsed</code> 平稳而 <code>rss</code> 或 <code>external</code> 一直涨，问题可能在 Buffer 或原生模块这类堆外内存。</p>
<h2>怎样拿到堆快照</h2>
<p>官方指南列了四种方式。</p>
<ol>
<li>用 <code>--inspect</code> 启动进程，在 Chrome 里打开 <code>chrome://inspect</code> 连上去，在 Memory 面板拍快照。适合本地复现。</li>
<li>用 <code>--heapsnapshot-signal=SIGUSR2</code> 启动，之后执行 <code>kill -USR2 进程号</code>，进程会在当前目录写出 <code>.heapsnapshot</code> 文件。适合线上，不用重启也不用连调试器。</li>
<li>在代码里调用 <code>node:v8</code> 的 <code>writeHeapSnapshot()</code>。官方建议通过信号或一个内部的 HTTP 接口触发，并且这个接口不能对外暴露。</li>
<li>通过 Inspector 协议从进程外发 <code>HeapProfiler.takeHeapSnapshot</code> 命令。</li>
</ol>
<p>另外还有 <code>--heapsnapshot-near-heap-limit=次数</code>，在堆快到上限时自动写快照，用来抓“快崩溃那一刻”的现场。</p>
<p>为什么 <code>--inspect</code> 不能随手开在线上？因为它默认监听 <code>127.0.0.1:9229</code>，如果绑定到 <code>0.0.0.0</code> 这类公网地址，外部主机连上调试端口就能执行任意代码，官方文档专门写了这条安全警告。</p>
<h2>怎样从快照里找到泄漏</h2>
<p>单看一张快照，很难分清哪些对象是正常的。官方指南给的方法是对比两张快照，并且尽量让差异干净：</p>
<ol>
<li>等进程启动完成，先把怀疑泄漏的功能用几次，让正常的初次分配发生完。</li>
<li>拍第一张快照。</li>
<li>只反复使用这个功能一段时间，中间不要跑别的。</li>
<li>拍第二张快照。</li>
<li>在 DevTools 的 Memory 面板先加载旧的，再加载新的，选中新的，把视图从 Summary 切到 Comparison。</li>
<li>找增量大的对象类型，在下方面板查看是谁引用着它们。</li>
</ol>
<p>最后一步最关键。知道“多了一万个某对象”还不够，要沿着引用链往上看，找到是哪个 Map、哪个事件监听数组、哪个闭包一直拿着它们，那才是要改的地方。</p>
<h2>常见的泄漏原因</h2>
<p>下面是一个典型例子：用 Map 做缓存，键是请求参数，没有上限。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getUser</span>(<span class="hljs-params">id</span>) {
  <span class="hljs-keyword">if</span> (!cache.<span class="hljs-title function_">has</span>(id)) cache.<span class="hljs-title function_">set</span>(id, { id, <span class="hljs-attr">loadedAt</span>: id });
  <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(id);
}

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">10000</span>; i++) <span class="hljs-title function_">getUser</span>(i);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-property">size</span>); <span class="hljs-comment">// 10000</span>
</code></pre></div>
<p>请求参数五花八门时，缓存只进不出，每个用过的 <code>id</code> 都永久留在内存里。改法是给缓存设上限或过期时间，例如超过上限时删掉最早放进去的键：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> limit = <span class="hljs-number">100</span>;
<span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getUser</span>(<span class="hljs-params">id</span>) {
  <span class="hljs-keyword">if</span> (!cache.<span class="hljs-title function_">has</span>(id)) {
    cache.<span class="hljs-title function_">set</span>(id, { id });
    <span class="hljs-keyword">if</span> (cache.<span class="hljs-property">size</span> &gt; limit) cache.<span class="hljs-title function_">delete</span>(cache.<span class="hljs-title function_">keys</span>().<span class="hljs-title function_">next</span>().<span class="hljs-property">value</span>);
  }
  <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(id);
}

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">10000</span>; i++) <span class="hljs-title function_">getUser</span>(i);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-property">size</span>); <span class="hljs-comment">// 100</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">has</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>Map</code> 按插入顺序迭代，所以 <code>cache.keys().next().value</code> 拿到的是最早插入的键，删掉它就能把大小控制在上限内。</p>
<p>其他常见原因和缓存是同一个道理，都是“长期存在的东西引用了短期数据”：</p>
<ul>
<li>每个请求都给一个全局的 EventEmitter 加监听，却不移除。Node.js 会在同一事件的监听器超过 10 个时打印 <code>MaxListenersExceededWarning</code>，这个警告往往就是线索，见<a href="/questions/node-event-emitter/">《Node.js 的 EventEmitter 有哪些需要注意的地方？》</a>。</li>
<li><code>setInterval</code> 没有清除，回调闭包里引用的数据就一直释放不掉，见<a href="/questions/js-closure/">《什么是闭包？它有哪些实际应用？》</a>。</li>
<li>把请求相关的数据放进模块级数组或全局对象，比如为了统计把每个请求对象 push 进一个数组。</li>
</ul>
<p>浏览器里的排查思路基本相同，见<a href="/questions/performance-memory-diagnosis/">《前端内存泄漏应该怎样定位？》</a>。</p>
<h2>常见追问</h2>
<p><strong>内存不够时连快照都拍不出来怎么办？</strong></p>
<blockquote>
<p>官方指南提醒，快照在内存里生成，可能让堆占用翻倍。可以先用 <code>--max-old-space-size</code> 给进程更多堆空间，或者在测试环境用较小的堆复现，配合 <code>--heapsnapshot-near-heap-limit</code> 在接近上限时自动写快照。</p>
</blockquote>
<p><strong>为什么不直接调大内存上限？</strong></p>
<blockquote>
<p>那只是让崩溃来得晚一点。泄漏的对象始终被引用，堆再大也会被慢慢占满，而且堆越大，每次垃圾回收的工作量越大，响应会更慢。</p>
</blockquote>`};export{e as default};