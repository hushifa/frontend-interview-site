var e={answerHtml:`<h2>简答</h2>
<ul>
<li>用户等待的是下载、初始化、预处理、推理、后处理和渲染的总时间。</li>
<li>Worker 主要改善主线程响应，不保证总耗时下降。</li>
<li>GPU 和量化都不会自动让所有设备变快，还要看算子支持和质量影响。</li>
<li>连续输入时优先处理最新任务，用分阶段数据定位真正的瓶颈。</li>
</ul>
<h2>先测完整用户流程</h2>
<p>一次浏览器端推理通常包含模型下载、权重解码、运行时初始化、输入预处理、推理、输出转换和界面渲染。即使核心算子只用 30ms，如果每次输入都重新创建会话、复制几百 MB 数据或重新编译 GPU 管线，用户仍然会等待很久。</p>
<p>性能报告至少要区分：首次可用时间、模型已经就绪后的单次延迟、首个结果时间和完整结果时间。网络缓存、模型缓存、会话复用和运行时内部缓存不是同一种缓存，换设备、清理存储或升级模型后，冷启动成本会重新出现。</p>
<h2>Worker 主要改善主线程响应</h2>
<p>把预处理和推理放进 Worker，目标通常是让输入、滚动和绘制少被长任务阻塞，不保证总耗时一定下降。Worker 启动、消息序列化、结果传回和内存复制都可能增加时间。</p>
<p>大数组可以评估 transferables 或共享缓冲区，但转移后发送方失去那块内存的所有权，不能继续按原对象使用。每次请求创建 Worker、加载模型并立即销毁，也会丢失初始化复用收益；更常见的做法是复用有上限的 Worker，并用队列控制任务。</p>
<h2>GPU 不是把所有工作自动变快</h2>
<p>算子支持、张量形状、精度、驱动和显存会决定运行时能否留在 GPU。部分算子落回 CPU、频繁把中间结果读回、任务太小或 GPU 与页面绘制争用，都可能抵消收益。</p>
<p>应尽量让连续计算的数据留在适合的设备侧，减少不必要往返，但不能只因为数据类型标记为 GPU 就假设复制消失。浏览器中的推理还可能与 Canvas、WebGL 或 WebGPU 绘制争用设备，持续高负载会影响帧率、温度和电量。</p>
<h2>缩小模型要同时看速度和质量</h2>
<p>量化可以减少权重体积和部分内存，但实际速度取决于后端是否有高效支持。模型文件更小，不代表每台设备都更快；量化还可能影响准确率、长文本、边缘输入和生成稳定性。</p>
<p>应使用真实任务样本比较质量、首 Token、总生成时间、内存峰值和下载成本。对生成模型，输入上下文越长会增加预填充和 KV cache，占用；输出越长会增加持续解码。只看每秒 Token 会忽略首结果等待，只看首 Token 又会忽略长回答总时间。</p>
<h2>队列要优先服务最新有效任务</h2>
<p>用户连续输入时，无限并发会增加内存和设备争用。搜索建议、实时摘要等场景通常可以取消或丢弃过期任务：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> running;
<span class="hljs-keyword">let</span> version = <span class="hljs-number">0</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">inferLatest</span>(<span class="hljs-params">input</span>) {
  running?.<span class="hljs-title function_">abort</span>();
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  running = controller;
  <span class="hljs-keyword">const</span> current = ++version;

  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> inferenceWorker.<span class="hljs-title function_">run</span>(input, controller.<span class="hljs-property">signal</span>);
  <span class="hljs-keyword">if</span> (current !== version || controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> result;
}
</code></pre></div>
<p>取消 Promise 不一定能立即停止 GPU 内核；运行时可能只在阶段边界检查信号。界面要允许这段延迟，避免用户以为取消已经释放全部资源。模型会话、输出张量、图像、Worker 和 GPU 对象也要在不再使用时释放，否则越用越慢可能被误认为模型性能下降。</p>
<h2>用阶段数据定位真正瓶颈</h2>
<p>记录下载、初始化、预处理、推理、后处理和渲染各阶段，以及输入规模、设备、后端、内存峰值、主线程长任务和缓存条件。比较同一设备和同一任务，不要拿高端桌面冷启动与低端手机热运行混在一起。</p>
<p>最终优化目标是用户完成任务的等待减少，同时没有用质量下降、流量上升、电量消耗或首屏变慢来交换。WebGPU 和 Worker 是工具，不是完整的性能方案。</p>`};export{e as default};