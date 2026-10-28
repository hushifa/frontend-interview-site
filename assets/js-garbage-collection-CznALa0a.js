var e={answerHtml:`<h2>简答</h2>
<ul>
<li>引擎回收从根对象出发不可达的对象，可达但不再需要的对象不会被回收。</li>
<li>常见泄漏来自未移除的监听器、未清理的定时器、不断增长的缓存，以及闭包持有的大对象。</li>
<li>WeakMap、WeakRef 只在键或目标不可达时允许回收，不能保证回收时机。</li>
<li>排查泄漏用堆快照比较对象数量和引用路径。</li>
</ul>
<p>垃圾回收器知道的是一个对象是否仍可能通过引用关系被程序访问，不知道产品经理认为“这个页面已经关闭，这些数据应该没用了”。如果全局缓存或监听器还持有它，垃圾回收器继续保留它，反而是在正确执行语言语义。</p>
<p>因此很多内存泄漏不是“垃圾回收器忘了回收垃圾”，而是业务上已经无用的数据，在引用图中仍然有存活路径。</p>
<h2>可达性比“有没有循环引用”更重要</h2>
<p>现代 JavaScript 引擎主要基于可达性进行垃圾回收：从运行环境的根引用出发，沿仍有效的引用关系标记可达对象，再回收不再可达的对象。实际实现还可能使用分代、增量、并发等技术，但判断业务泄漏时，先看引用路径最有帮助。</p>
<p>两个对象互相引用，并不必然造成泄漏。如果外部没有任何有效路径再到达这两个对象，现代追踪式垃圾回收仍然可以回收整个环。反过来，没有循环也照样能泄漏：一个一直增长的全局数组，足以把每次访问页面产生的数据永久保留下来。</p>
<p>把一个局部变量设为 null，也只切断这一条引用，不会顺便删除数组、闭包或 DOM 关联里保存的其他引用。</p>
<h2>一条计时器和监听链可以保留整个面板</h2>
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
<p>假设 panel 后来从文档中移除了，计时器仍然持有更新回调，回调仍可访问 panel；如果 button 还活着，它上的监听器也可能继续保留相关状态。单独调用 panel.remove() 不能代替 dispose。</p>
<p>返回清理函数，让创建资源的地方同时定义怎样结束它。在组件卸载、视图替换或当前任务完成时调用同一个 dispose，才能切断这些无用的活跃回调入口。</p>
<p>这并不承诺所有引用立刻消失：调用方若继续保存 panel、闭包或清理函数本身，也可能仍存在引用关系。清理监听和计时器解决的是生命周期路径，真正回收还取决于整体可达性与 GC 调度。</p>
<h2>常见泄漏来源不只有事件监听</h2>
<p>无上限的 Map 缓存、不断累积的日志数组、没有清空的历史快照、长期订阅回调、未关闭的通信对象，都可能让对象比需要的时间活得更久。一个小闭包如果可访问大列表，也可能间接保留大量数据。</p>
<p>脱离文档的 DOM 节点需要结合引用路径判断。节点和它自己的监听器互相引用，不代表这个孤立子图必然泄漏；若有活跃的全局对象、定时器、其他 DOM 节点等继续到达它，才是需要重点检查的保留路径。</p>
<p>开发工具本身也可能暂时保留观察过的对象，例如控制台结果或被选中的节点。诊断时要避免把调试行为制造的引用，误当成生产代码一定存在的泄漏。</p>
<h2>怎样用堆快照定位，而不是只看任务管理器</h2>
<p>先选择一个可重复操作，例如进入页面、打开预览、关闭预览、退出页面。重复若干次后比较快照，看同类对象是否持续累积，而不只看一次操作后的内存峰值。</p>
<p>Shallow size 描述对象自身占用，retained size 帮助估计该对象保留的整体内存影响。更关键的是查看到 GC 根的保留路径，找出到底是哪一个缓存、回调或容器还在引用它。</p>
<p>“关闭后内存没有立刻降回初始值”不必然等于泄漏。引擎可能保留已申请的堆空间以便复用，GC 也不保证马上运行；同时图片解码、GPU 资源、ArrayBuffer 等占用未必完整体现在同一份 JavaScript 堆数字中。</p>
<p>更可信的证据是：在相同操作与合理稳定条件下，对象数量或保留内存持续增长，并能找到本应结束却还活着的引用链。修复后再重复同一流程，确认增长趋势与引用路径发生了预期变化。</p>
<h2>WeakMap、WeakRef 解决的是特定问题</h2>
<p>WeakMap 适合把元数据附着到对象生命周期上，让弱键关联本身不单独阻止键回收。但如果键还放在一个全局数组里，改用 WeakMap 也不会消除那条强引用。</p>
<p>WeakRef 允许在对象仍存活时尝试取得它，但不能要求对象在某个时刻一定存在或一定被回收。需要可靠保留的数据不能只交给弱引用；需要严格上限的缓存，也不能只赌 GC 会及时清掉内容。</p>
<p>FinalizationRegistry 的清理回调时间不确定，甚至可能没有机会执行。它不适合承担必须及时发生的退订、关闭连接、归还锁或保存用户数据。正确性不能依赖“下一次 GC 一定会帮忙完成某个业务动作”。</p>
<h2>资源释放与内存回收不是一回事</h2>
<p>对象占用的 JavaScript 内存可以由 GC 管理，但它代表的文件、读流、事件订阅或外部任务，往往有自己的生命周期。主动清理可以立即停止副作用，解除宿主资源占用，而不必等到对象彻底不可达。</p>
<p>常见做法包括明确的 dispose、AbortController、try/finally，以及环境支持时的 using/await using。资源由谁创建、谁负责关闭、重复清理是否安全，应在接口中说明。</p>
<p>性能优化也不只是“每次都设 null”。有些引用在作用域结束后自然消失，无需额外操作；真正需要治理的是无界缓存、持续存活的回调和不清楚的资源所有权。沿引用链解决问题，比背一份固定的泄漏现象清单更可靠。</p>`};export{e as default};