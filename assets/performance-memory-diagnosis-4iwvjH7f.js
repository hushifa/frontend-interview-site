var e={answerHtml:`<p>页面内存变大不一定是泄漏。首次打开编辑器时加载字典、字体和缓存，内存上涨可能合理；真正需要怀疑的是反复执行同一流程后，已经不再需要的对象仍被保留，回收后的基线持续增加。</p>
<p>垃圾回收根据可达性工作，不知道业务上“这个弹窗已经关闭，所以里面的数据没用了”。只要还有可达引用，对象就可能继续存活。</p>
<h3>先构造可重复的操作闭环</h3>
<p>例如打开详情、编辑、关闭，重复十次。先让页面完成必要初始化，再记录基线，执行一组操作后等待异步清理，并在相同条件下比较。若每次只打开不关闭，那只是增加了真实业务状态，不能据此证明泄漏。</p>
<p>性能面板的内存曲线可以帮助看趋势。分配与回收通常形成锯齿，重点是回收后低点是否持续抬升。开发者工具中的主动垃圾回收有助于诊断，但普通应用不能把“强制 GC”当作修复方案。</p>
<p>还应区分 JS 堆、DOM、图片和其他进程资源。JS heap 稳定，不代表解码图片或 GPU 资源没有增长；进程总内存偏高，也不代表全部来自仍存活的 JavaScript 对象。</p>
<h3>用快照找到是谁把对象留住</h3>
<p>在初始化后拍一份堆快照，执行固定次数的打开与关闭，再拍第二份。比较仍增长的构造类型和对象数量，查看浅大小与保留大小，以及 Retainers 中到根的引用路径。</p>
<p>浅大小描述对象自身，保留大小帮助理解该对象间接保留了多少数据，但不能把所有对象的保留大小简单相加，因为引用关系会重叠。</p>
<p>常见路径是：全局对象保留事件监听器，监听器闭包保留组件数据，数据又保留已移除的 DOM。此时只修改 DOM 不够，应切断不该继续存在的监听或其他引用。</p>
<h3>删除 DOM 不等于所有引用都消失</h3>
<p>下面是让监听器与一段 UI 共用生命周期的示例，mountPanel 的返回值应在关闭面板时调用：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">mountPanel</span>(<span class="hljs-params">container</span>) {
  <span class="hljs-keyword">const</span> panel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;section&#x27;</span>);
  container.<span class="hljs-title function_">append</span>(panel);
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">updateWidth</span>(<span class="hljs-params"></span>) {
    panel.<span class="hljs-property">dataset</span>.<span class="hljs-property">viewportWidth</span> = <span class="hljs-title class_">String</span>(<span class="hljs-variable language_">window</span>.<span class="hljs-property">innerWidth</span>);
  }
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, updateWidth, {
    <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
  });
  <span class="hljs-title function_">updateWidth</span>();

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    controller.<span class="hljs-title function_">abort</span>();
    panel.<span class="hljs-title function_">remove</span>();
  };
}
</code></pre></div>
<p>如果只执行 panel.remove，却忘记清理 window 的监听器，window 仍可能通过回调闭包保留 panel。示例利用 AbortSignal 解除监听；也可以使用正确的函数引用调用 removeEventListener。</p>
<p>但不是所有带事件监听的 DOM 都必然泄漏：若节点、监听和闭包形成的整组对象已经不可达，垃圾回收能处理普通循环引用。关键是是否仍有根对象或长期存活对象保留它们，而不是“出现闭包就有问题”。</p>
<p>调用方也不应在全局数组里永久保存已经执行过的清理函数，因为清理函数自身仍可能闭包引用节点。</p>
<h3>Detached 节点是线索，不是自动判决</h3>
<p>堆快照里筛选 Detached 可以找到脱离文档树的节点。它们可能是泄漏，也可能是组件为再次使用而暂存的结构。要结合数量增长、业务生命周期与保留路径判断。</p>
<p>控制台历史输出、临时变量和当前检查的元素也可能延长对象存活，导致调试行为干扰结果。复测时避免把可疑对象持续打印并展开，必要时在干净会话里重复流程。</p>
<p>除了 DOM，还应检查定时器、Observer、订阅、未结束的异步任务、无限增长的 Map/数组、对象 URL 和未释放的媒体资源。缓存需要容量和淘汰策略；换成 WeakMap 只适用于对象键等特定关系，不是所有缓存的通用替代。</p>
<h3>修复后验证同一个闭环</h3>
<p>完成清理后，用相同数据量、操作次数和等待条件重复测试，观察相关对象数量是否回到合理范围，以及多轮之后是否趋于稳定。不要要求进程内存每次都精确回到同一个字节数，运行时可能保留已申请空间供复用。</p>
<p>如果对象最终会释放，但分配速度过高导致频繁 GC，那更接近分配抖动问题，应减少临时对象和重复构造；它与长期不可回收的泄漏有不同修复方向。先确认问题类型，再修改生命周期或数据结构，才能避免靠猜测删代码。</p>`};export{e as default};