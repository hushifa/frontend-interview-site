var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先分阶段计时：下载、初始化、预处理、推理、后处理、渲染。瓶颈常常不在推理本身。</li>
<li>Worker 解决的是主线程卡顿，消息传递和数据拷贝还会增加少量总耗时。大数组用 Transferable 转移所有权可以避免拷贝。</li>
<li>WebGPU 只加速它支持的算子。算子回退 CPU、中间结果频繁读回、任务太小，都可能让它比 WASM 还慢。</li>
<li>量化缩小体积，但速度取决于后端是否高效支持该精度，还可能降低质量，要用真实样本验证。</li>
<li>连续输入时只保留最新任务，过期任务取消或丢弃，避免排队和设备争用。</li>
</ul>
<h2>常见的慢在哪里</h2>
<table><thead><tr><th>现象</th><th>常见原因</th></tr></thead><tbody><tr><td>每次推理都慢</td><td>每次都重新创建会话或 Worker</td></tr><tr><td>首次特别慢、之后正常</td><td>权重下载和 GPU 着色器编译，属于冷启动成本</td></tr><tr><td>推理快但界面卡</td><td>后处理或大量 DOM 更新在主线程</td></tr><tr><td>GPU 比 CPU 还慢</td><td>算子回退、张量在 CPU 和 GPU 之间来回复制、批量太小</td></tr><tr><td>越用越慢</td><td>张量、会话、图像对象没有释放</td></tr></tbody></table>
<p>生成模型还要分开看两个指标：首 token 时间主要由输入长度决定（预填充），总时间还取决于输出长度（逐 token 解码）。只看每秒 token 数会忽略首字等待。</p>
<h2>只处理最新任务</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> current = <span class="hljs-literal">null</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">inferLatest</span>(<span class="hljs-params">input</span>) {
  current?.<span class="hljs-title function_">abort</span>();
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  current = controller;

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> inferenceWorker.<span class="hljs-title function_">run</span>(input, controller.<span class="hljs-property">signal</span>);
    <span class="hljs-keyword">return</span> controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span> ? <span class="hljs-literal">null</span> : result;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>; <span class="hljs-comment">// 被新任务取代，不算错误</span>
    <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>运行时通常只在阶段之间检查取消信号，已经提交给 GPU 的计算会跑完。所以取消后资源不会立刻释放，界面不必等待它。</p>
<h2>Worker 与数据传递</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 主线程：转移 ArrayBuffer 的所有权，避免复制</span>
worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">pixels</span>: buffer }, [buffer]);
<span class="hljs-comment">// 之后 buffer.byteLength 变为 0，主线程不能再使用它</span>
</code></pre></div>
<p>Worker 和会话都应常驻复用，用有上限的队列控制并发。</p>
<h2>验证优化是否有效</h2>
<p>在同一台设备、同样的缓存条件下对比各阶段耗时，同时记录内存峰值、主线程长任务和输出质量。用高端桌面机的热启动数据去推断低端手机的冷启动表现，结论通常不成立。</p>
<h2>常见追问</h2>
<ul>
<li><strong>SharedArrayBuffer 能用来共享张量吗？</strong> 可以，但页面要启用跨源隔离（COOP 和 COEP），并且自己处理读写同步。</li>
<li><strong>能不能让 GPU 同时渲染页面和推理？</strong> 可以，但会争用同一块 GPU，推理负载高时动画帧率可能下降。</li>
</ul>`};export{e as default};