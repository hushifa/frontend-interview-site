var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>WebGL 是一个状态机：你设好一堆全局状态，然后画，边设边画。WebGPU 换了做法，先把管线、资源和绑定提前描述清楚，再把命令录下来一次性提交。它还能做通用计算，不只是画图。着色器语言也换成了 WGSL，GLSL 的代码不能直接拿来用。</p>
<p>用之前要一步步拿设备：先看 <code>navigator.gpu</code> 在不在，再 <code>requestAdapter()</code>，它可能返回 <code>null</code>；最后 <code>requestDevice()</code>，它也可能失败。</p>
<p>支持面要特别注意。MDN 把 WebGPU 标为 Limited availability，不是 Baseline，而且整个 API 只在 HTTPS 这类安全上下文里能用。所以要做特性检测，准备好 WebGL 或 CPU 的回退。</p>
<p>如果想覆盖更旧的设备，可以用 <code>requestAdapter({ featureLevel: &#x27;compatibility&#x27; })</code> 申请兼容模式。它能跑在 OpenGL ES 3.1、Direct3D 11 这些较旧的后端上，代价是功能和限制更少。</p>
</blockquote>
<h2>怎样拿到 GPU 设备</h2>
<p>下面的函数把每一步可能失败的地方都处理了，拿不到就返回 <code>null</code>，让调用方去走回退：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">initGPU</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-property">gpu</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>; <span class="hljs-comment">// 不支持或不是安全上下文</span>
  <span class="hljs-keyword">const</span> adapter = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">gpu</span>.<span class="hljs-title function_">requestAdapter</span>();
  <span class="hljs-keyword">if</span> (!adapter) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>; <span class="hljs-comment">// 没有可用的 GPU 适配器</span>
  <span class="hljs-keyword">const</span> device = <span class="hljs-keyword">await</span> adapter.<span class="hljs-title function_">requestDevice</span>();
  device.<span class="hljs-property">lost</span>.<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">info</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;GPU 设备丢失&#x27;</span>, info.<span class="hljs-property">reason</span>);
    <span class="hljs-comment">// 停止使用旧资源，按需重新初始化</span>
  });
  <span class="hljs-keyword">return</span> device;
}
</code></pre></div>
<p>adapter 可以理解成“一块可用的 GPU”，device 是你和它之间的连接，之后所有资源都从 device 创建。</p>
<p><code>device.lost</code> 是一个 Promise，设备丢失时会 resolve，比如驱动重置。这时旧资源都不能用了，要停下来，按需重新初始化。</p>
<p>如果要用可选功能或更高的限制，先查 <code>adapter.features</code> 和 <code>adapter.limits</code>，再在 <code>requestDevice()</code> 里申请。申请了不支持的项，<code>requestDevice()</code> 会失败。</p>
<h2>计算管线长什么样</h2>
<p>下面这段 WGSL 把数组里每个数乘 2：</p>
<div class="not-prose code-block"><div class="code-language">wgsl</div><pre><code class="hljs language-wgsl">@group(0) @binding(0) var&lt;storage, read_write&gt; values: array&lt;f32&gt;;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3&lt;u32&gt;) {
  if (id.x &lt; arrayLength(&amp;values)) {
    values[id.x] = values[id.x] * 2.0;
  }
}
</code></pre></div>
<p>GPU 是成组地跑这个函数的，<code>@workgroup_size(64)</code> 表示一组 64 个。所以 N 个元素要调度 <code>Math.ceil(N / 64)</code> 个工作组。</p>
<p>为什么要判断 <code>id.x &lt; arrayLength(&amp;values)</code>？因为向上取整以后，最后一组可能多出几个，这个判断防止它们越界。</p>
<p>完整的应用还要创建带正确 <code>usage</code> 的缓冲区、绑定组和计算管线，然后调用 <code>dispatchWorkgroups</code> 并提交。</p>
<h2>和 WebGL 的主要区别</h2>
<table><thead><tr><th></th><th>WebGL</th><th>WebGPU</th></tr></thead><tbody><tr><td>编程模型</td><td>全局状态机，边设状态边绘制</td><td>预先创建管线，录制命令后提交</td></tr><tr><td>计算</td><td>只能借渲染管线模拟</td><td>原生计算管线</td></tr><tr><td>着色器</td><td>GLSL</td><td>WGSL</td></tr><tr><td>错误</td><td><code>getError()</code> 轮询</td><td>错误作用域、<code>uncapturederror</code> 事件</td></tr><tr><td>支持面</td><td>几乎所有浏览器</td><td>仍有主流浏览器不支持</td></tr></tbody></table>
<h2>怎样把计算结果读回来</h2>
<p><code>queue.submit()</code> 只表示工作提交了，不代表已经执行完。要读回数据，得把结果复制到一个带 <code>MAP_READ</code> 用途的缓冲区，再 <code>await buffer.mapAsync(GPUMapMode.READ)</code>。</p>
<p>所以 GPU 计算不一定更快。数据量很小、又要频繁读回时，上传和下载的开销可能比计算本身还大，这时直接用 CPU 反而更快。</p>
<h2>要不要从 WebGL 迁移</h2>
<p>现有的 WebGL 应用跑得好好的、又要覆盖所有用户，就没必要为了新接口重写。</p>
<p>要做 GPU 计算，比如推理、物理模拟、大规模数据处理，或者渲染的瓶颈在 CPU 提交开销上，WebGPU 的收益就比较明显。</p>
<p>Three.js、Babylon.js 这些库已经提供了 WebGPU 渲染器，不支持时还能回退到 WebGL，用它们接入更稳妥。</p>
<h2>常见追问</h2>
<p><strong>怎样判断当前是不是兼容模式？</strong></p>
<blockquote>
<p>检查 <code>device.features.has(&#x27;core-features-and-limits&#x27;)</code>，返回 <code>false</code> 就表示是兼容模式。</p>
</blockquote>
<p><strong>JavaScript 对象能直接传给 WGSL 结构体吗？</strong></p>
<blockquote>
<p>不行。要按 WGSL 的对齐规则写进 <code>ArrayBuffer</code>，每个字段的偏移和填充都要算对。</p>
</blockquote>`};export{e as default};