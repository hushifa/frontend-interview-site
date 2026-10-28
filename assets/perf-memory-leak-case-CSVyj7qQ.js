var e={answerHtml:`<p>用户在后台系统中打开和关闭几十次抽屉后，页面越来越卡，任务管理器显示内存持续上涨。单看 JavaScript 代码很难判断是浏览器缓存、正常的堆增长，还是已经无法访问的 DOM 仍被某个引用保留。内存诊断要关注“对象为什么还活着”，而不是只看某一刻的总 MB 数。</p>
<h2>先区分增长、峰值和泄漏</h2>
<p>图片解码、缓存、JIT 编译和浏览器内部资源可能让内存短暂上升；垃圾回收后如果能回到相近基线，不一定是泄漏。更有价值的信号是：重复同一操作后，每轮 GC 后的基线持续上移，且对象数量和保留大小不断增加。</p>
<p>在 DevTools Memory 面板中，可以对同一页面执行“打开抽屉—关闭—等待—手动 GC”的固定流程，比较多次堆快照或使用 Allocation instrumentation on timeline。必须先固定数据、关闭无关标签和扩展，并记录浏览器版本；不同引擎的回收时机不能直接横向比较。</p>
<h2>detached DOM 是常见线索</h2>
<p>节点从文档树移除后，如果仍被 JavaScript 对象、闭包、事件监听器或第三方库保存，就会形成 detached DOM。快照中看到 detached 节点不等于一定泄漏，还要沿 Retainers/保留路径找到真正的根引用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">mountPanel</span>(<span class="hljs-params">container</span>) {
  <span class="hljs-keyword">const</span> panel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;section&#x27;</span>);
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">onResize</span> = (<span class="hljs-params"></span>) =&gt; {
    panel.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">window</span>.innerHeight}</span>px\`</span>;
  };
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize);
  container.<span class="hljs-title function_">append</span>(panel);

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, onResize);
    panel.<span class="hljs-title function_">remove</span>();
  };
}
</code></pre></div>
<p>如果只调用 <code>panel.remove()</code> 而不移除监听器，<code>window</code> 仍然持有 <code>onResize</code>，闭包又持有 <code>panel</code>，节点就可能继续存活。清理函数必须在组件卸载、路由离开或任务取消时调用；匿名函数不能在之后用同一个引用移除。</p>
<h2>定时器、观察器和订阅也需要生命周期</h2>
<p><code>setInterval</code>、未取消的 <code>requestAnimationFrame</code>、ResizeObserver、MutationObserver、WebSocket、BroadcastChannel 和第三方事件总线都可能保留回调。每个创建动作都应有对应的清理动作，并让清理具有幂等性。使用 AbortSignal 可以把多个 DOM 事件和请求绑定到同一个生命周期：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindSearchInput</span>(<span class="hljs-params">input, onChange</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, onChange, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}
</code></pre></div>
<p>AbortController 能清理支持 signal 的接口，但不能自动终止所有第三方订阅或释放任意资源。清理失败应记录诊断信息，不要假设组件框架卸载后所有异步任务都会自动停止。</p>
<h2>闭包和缓存的保留路径</h2>
<p>闭包本身不是泄漏；只有当闭包仍被活跃对象引用，且它捕获了不再需要的大对象时才会造成问题。常见根引用包括全局数组、单例缓存、未清理的 Promise 回调、事件系统和 Worker 消息监听器。缓存要有明确的大小、TTL 或淘汰策略，不能因为“只是内存缓存”就无限增长。</p>
<p>弱引用（如 <code>WeakMap</code>、<code>WeakRef</code>）只能解决特定的对象关联问题，不能用来掩盖缺少生命周期设计。<code>WeakRef</code> 的回收时机不可预测，不适合作为业务状态、缓存一致性或资源释放信号。</p>
<h2>用快照比较“谁增加了”</h2>
<p>诊断时关注：</p>
<ul>
<li>重复操作后某类对象数量是否按轮次增长；</li>
<li>Retainers 是否指向 <code>window</code>、事件监听器、定时器或缓存；</li>
<li>shallow size 和 retained size 哪一个在增长；</li>
<li>旧组件实例是否仍被框架或第三方库引用；</li>
<li>ArrayBuffer、图片、Worker 和原生资源是否在 JS 堆外增长。</li>
</ul>
<p>JS 堆快照看不到所有浏览器和 GPU 内存。Canvas、WebGL 纹理、音视频解码和文件句柄还要使用对应 API 的释放方法和浏览器任务管理工具验证。不要只因为堆快照稳定就宣布整个页面没有资源泄漏。</p>
<h2>修复后要验证回收，而不是只看代码</h2>
<p>修复后重复相同操作，等待多个垃圾回收周期并比较基线。自动化测试可以检查卸载后监听器和定时器数量，端到端测试则应覆盖真实路由切换、后台恢复和网络断开。性能回归结果应记录设备、浏览器、操作次数和采样方法，避免把一次 GC 时机差异误判为修复成功。</p>
<h2>常见误区</h2>
<ul>
<li>看到内存上涨就判定泄漏：应比较 GC 后基线和保留路径。</li>
<li>只删除 DOM 节点：事件、观察器、定时器和闭包仍可能持有它。</li>
<li>给所有缓存换成 WeakMap：弱引用不能替代容量和过期策略。</li>
<li>只看 JS 堆：GPU、图片、Worker 和原生资源可能在堆外增长。</li>
<li>只在开发模式检查：生产构建、Source Map 和第三方脚本可能改变保留关系。</li>
</ul>
<h2>参考资料</h2>
<ul>
<li><a href="https://developer.chrome.com/docs/devtools/memory-problems/">Chrome DevTools · Fix memory problems</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management">MDN · Memory management</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#signal">MDN · EventTarget.addEventListener signal</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap">MDN · WeakMap</a></li>
</ul>`};export{e as default};