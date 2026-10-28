var e={answerHtml:`<h2>简答</h2>
<ul>
<li>transferControlToOffscreen 要在获取绘图上下文之前调用。</li>
<li>转移后在 Worker 中绘制，可以减轻主线程的绘制压力。</li>
<li>Worker 读不到 DOM，画布尺寸需要由页面通过消息告知。</li>
<li>转移的只是绘制责任；帧和图像资源要管理生命周期，降级路径要在转移前设计。</li>
</ul>
<p>OffscreenCanvas 把画布绘制与页面 DOM 元素解耦，可以在 Worker 中执行部分绘制与数据处理，减少主线程需要亲自完成的工作。它不是自动让所有图形运算变快，也不意味着画布必须看不见。</p>
<p>已有 HTML canvas 可以把控制权转成 OffscreenCanvas，再交给 Worker；也可以创建独立 OffscreenCanvas，用于离屏处理或生成图像。</p>
<h2>在获取上下文之前决定是否转移</h2>
<p>主线程示例假设页面有一个尚未调用 getContext 的 canvas，并存在相应 Worker 文件：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
canvas.<span class="hljs-property">width</span> = <span class="hljs-number">600</span>;
canvas.<span class="hljs-property">height</span> = <span class="hljs-number">300</span>;
canvas.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">&#x27;300px&#x27;</span>;
canvas.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">&#x27;150px&#x27;</span>;

<span class="hljs-keyword">const</span> offscreen = canvas.<span class="hljs-title function_">transferControlToOffscreen</span>();
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-string">&#x27;/draw-worker.js&#x27;</span>);
worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">canvas</span>: offscreen }, [offscreen]);
</code></pre></div>
<p>transferControlToOffscreen 不能用于已经建立上下文的同一个 HTML canvas，也不能对它重复转移。实际应用应先做能力判断再选择路径，不能先试着 getContext(&#x27;2d&#x27;)，失败后才想转移。</p>
<p>postMessage 的第二个数组声明转移所有权。转移后主线程不能继续把同一 OffscreenCanvas 当作自己的可用绘图对象，绘制权应由 Worker 统一管理。</p>
<h2>Worker 不读取 DOM，尺寸由页面告知</h2>
<p>下面是 draw-worker.js 的内容：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> canvas = event.<span class="hljs-property">data</span>.<span class="hljs-property">canvas</span>;
  <span class="hljs-keyword">const</span> context = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
  <span class="hljs-keyword">if</span> (!context) {
    <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;无法创建绘图上下文&#x27;</span> });
    <span class="hljs-keyword">return</span>;
  }
  context.<span class="hljs-title function_">setTransform</span>(<span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>);
  context.<span class="hljs-property">fillStyle</span> = <span class="hljs-string">&#x27;royalblue&#x27;</span>;
  context.<span class="hljs-title function_">fillRect</span>(<span class="hljs-number">10</span>, <span class="hljs-number">10</span>, <span class="hljs-number">80</span>, <span class="hljs-number">40</span>);
  <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ready&#x27;</span> });
});
</code></pre></div>
<p>示例用两倍内部尺寸与缩放保持清晰，实际应按当前尺寸和合适的 DPR 计算。这个 Worker 只处理一次初始化绘制，不是一套支持任意消息的完整渲染器。</p>
<p>Worker 没有 document，也不能自己用 getBoundingClientRect 测量元素。主线程需要把 resize、指针或其他业务状态整理后发送过去；调整内部画布尺寸会重置绘制状态，需要重新设置并重画。</p>
<h2>转移的是绘制责任，不是整个页面</h2>
<p>主线程仍负责布局、事件接收和最终页面协作，GPU 工作与合成也不会因此消失。若瓶颈是 GPU 填充率或纹理过大，把 JavaScript 命令移到 Worker 不一定改善总帧率。</p>
<p>频繁传大对象、每个 pointermove 都复制整份场景，也可能把成本转移到消息序列化。应使用增量状态、批量或帧级合并，并明确数据版本，防止旧计算覆盖新视图。</p>
<p>适合转移的是能相对独立运行的绘制或计算；如果每一步都要同步查询 DOM，线程间通信反而可能增加复杂度。</p>
<h2>帧与图像资源也有生命周期</h2>
<p>Worker 动画调度需要确认目标环境和上下文支持，不应简单靠无限零延时计时器狂画。页面不可见时也应按需求暂停或降频，避免后台耗电。</p>
<p>通过 transferToImageBitmap 等方式输出帧时，要明确 ImageBitmap 的消费、转移与释放，不能每帧创建新对象却无限保留。像素读回和复制仍有成本，不能把 OffscreenCanvas 当作零拷贝保证。</p>
<p>关闭组件时应停止生产消息与动画，按需通知 Worker 清理，再终止它。终止 Worker 不能假设其 finally 一定执行；重要外部状态不要只依赖终止时的隐式清理。</p>
<h2>降级路径要在转移前设计</h2>
<p>API 名称存在不保证所需上下文、字体、图像或 Worker 能力全部符合要求。应处理初始化失败，并在不支持时保留主线程 Canvas 或静态预览等路径。</p>
<p>已经转移的 HTML canvas 不能靠再次 getContext 简单恢复为原来的主线程画布；失败回退可能需要创建新的元素。提前明确所有权与恢复流程，比出错后到处尝试重建上下文更可靠。</p>
<p>验证应覆盖初始化、缩放、尺寸变化、快速输入、Worker 异常与销毁。真实渲染收益需要在目标设备测量，成功收到 ready 消息只证明这一段绘制流程运行过。</p>`};export{e as default};