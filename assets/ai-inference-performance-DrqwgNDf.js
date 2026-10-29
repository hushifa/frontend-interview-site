var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>因为用户等的不只是推理。从下载模型、初始化、预处理，到推理、后处理、渲染，每一段都要时间，瓶颈经常不在推理本身。所以第一步是分阶段计时。</p>
<p>Worker 解决的是主线程被堵住的问题，它不会让计算变快，消息传递和数据拷贝反而会多花一点时间。大数组可以用 Transferable 直接转交过去，避免复制。WebGPU 也只加速它支持的运算，碰到不支持的运算回退到 CPU、中间结果频繁从显卡读回来、任务太小，都可能让它比 WASM 还慢。</p>
<p>量化能把模型变小，但会不会变快，要看后端对这种精度支不支持，质量也可能下降，要拿真实样本验证。</p>
<p>用户连续输入时，只保留最新的任务，旧任务取消或丢弃，不然任务会排队、互相抢设备。</p>
</blockquote>
<h2>慢在哪里，先对照现象</h2>
<table><thead><tr><th>现象</th><th>常见原因</th></tr></thead><tbody><tr><td>每次推理都慢</td><td>每次都重新创建会话或 Worker</td></tr><tr><td>首次特别慢、之后正常</td><td>权重下载和 GPU 着色器编译，属于冷启动成本</td></tr><tr><td>推理快但界面卡</td><td>后处理或大量 DOM 更新在主线程</td></tr><tr><td>GPU 比 CPU 还慢</td><td>算子回退、张量在 CPU 和 GPU 之间来回复制、批量太小</td></tr><tr><td>越用越慢</td><td>张量、会话、图像对象没有释放</td></tr></tbody></table>
<p>表里的“算子”指模型里的基本运算，比如矩阵乘法；“张量”是传给模型的多维数组。</p>
<p>如果是生成文字的模型，还要分开看两个指标。第一个字出来要多久，主要看输入有多长，因为模型要先把整段输入处理一遍，这一步叫预填充。总共要多久，还要看输出多长，因为后面是一个 token 一个 token 地生成，这一步叫解码。只看“每秒多少 token”，会忽略用户等第一个字的那段时间。</p>
<h2>连续输入时只处理最新的任务</h2>
<p>用户每敲一个字就推理一次，旧任务还没算完新任务就来了，结果一个个排队，越来越慢。下面的写法每来一个新任务就取消上一个：</p>
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
<p>取消以后，计算会立刻停下来吗？通常不会。运行时一般只在阶段之间检查取消信号，已经交给 GPU 的计算会跑完。所以资源不会马上释放，但界面不用等它，返回 <code>null</code> 直接忽略就行。</p>
<h2>Worker 传数据时要注意拷贝</h2>
<p><code>postMessage</code> 默认会把数据复制一份传给 Worker。图片像素这类大数组，复制一次就要不少时间。可以把它作为第二个参数传进去，直接转移所有权：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 主线程：转移 ArrayBuffer 的所有权，避免复制</span>
worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">pixels</span>: buffer }, [buffer]);
<span class="hljs-comment">// 之后 buffer.byteLength 变为 0，主线程不能再使用它</span>
</code></pre></div>
<p>转移以后，主线程这边的 <code>buffer</code> 就空了，不能再用。</p>
<p>Worker 和模型会话都应该一直留着复用，不要用一次建一次。并发用一个有上限的队列来控制。</p>
<h2>怎么确认优化真的有效</h2>
<p>要在同一台设备、同样的缓存条件下，对比各阶段的耗时，同时记下内存峰值、主线程长任务和输出质量。拿高端台式机已经热起来的数据，去推断低端手机第一次打开的表现，结论通常不成立。</p>
<h2>常见追问</h2>
<p><strong>SharedArrayBuffer 能用来共享张量吗？</strong></p>
<blockquote>
<p>可以，这样主线程和 Worker 能直接读写同一块内存，不用复制。但页面要开启跨源隔离，也就是配置 COOP 和 COEP 两个响应头，而且读写同步要自己处理。</p>
</blockquote>
<p><strong>GPU 能同时渲染页面和推理吗？</strong></p>
<blockquote>
<p>可以，但它们抢的是同一块显卡。推理负载高的时候，页面动画的帧率可能会下降。</p>
</blockquote>`};export{e as default};