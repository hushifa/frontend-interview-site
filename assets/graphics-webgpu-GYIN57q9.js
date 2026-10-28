var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebGL 是基于 OpenGL ES 的状态机式图形接口；WebGPU 提前显式描述管线、资源和绑定，再录制命令一次性提交，并支持通用计算。</li>
<li>着色器用 WGSL 编写，不能复用 GLSL 源码。</li>
<li>获取流程：检查 <code>navigator.gpu</code> → <code>requestAdapter()</code>（可能返回 <code>null</code>）→ <code>requestDevice()</code>（可能失败）。</li>
<li>MDN 将 WebGPU 标为 Limited availability（不是 Baseline），整个 API 只在 HTTPS 等安全上下文可用。要做特性检测并准备 WebGL 或 CPU 回退。</li>
<li><code>requestAdapter({ featureLevel: &#x27;compatibility&#x27; })</code> 申请兼容模式，可以运行在 OpenGL ES 3.1、Direct3D 11 等较旧后端上，代价是功能和限制更少。</li>
</ul>
<h2>获取设备</h2>
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
<p>需要可选功能或更高限制时，先检查 <code>adapter.features</code> 和 <code>adapter.limits</code>，再在 <code>requestDevice()</code> 里申请，申请不支持的项会失败。</p>
<h2>计算管线示例</h2>
<div class="not-prose code-block"><div class="code-language">wgsl</div><pre><code class="hljs language-wgsl">@group(0) @binding(0) var&lt;storage, read_write&gt; values: array&lt;f32&gt;;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3&lt;u32&gt;) {
  if (id.x &lt; arrayLength(&amp;values)) {
    values[id.x] = values[id.x] * 2.0;
  }
}
</code></pre></div>
<p>N 个元素需要调度 <code>Math.ceil(N / 64)</code> 个工作组，边界判断防止最后一组越界。完整应用还要创建带正确 <code>usage</code> 的缓冲区、绑定组和计算管线，然后 <code>dispatchWorkgroups</code> 并提交。</p>
<h2>和 WebGL 的主要区别</h2>
<table><thead><tr><th></th><th>WebGL</th><th>WebGPU</th></tr></thead><tbody><tr><td>编程模型</td><td>全局状态机，边设状态边绘制</td><td>预先创建管线，录制命令后提交</td></tr><tr><td>计算</td><td>只能借渲染管线模拟</td><td>原生计算管线</td></tr><tr><td>着色器</td><td>GLSL</td><td>WGSL</td></tr><tr><td>错误</td><td><code>getError()</code> 轮询</td><td>错误作用域、<code>uncapturederror</code> 事件</td></tr><tr><td>支持面</td><td>几乎所有浏览器</td><td>仍有主流浏览器不支持</td></tr></tbody></table>
<h2>读回结果</h2>
<p><code>queue.submit()</code> 只表示提交了工作，不代表执行完毕。读回数据要把结果复制到带 <code>MAP_READ</code> 用途的缓冲区，再 <code>await buffer.mapAsync(GPUMapMode.READ)</code>。数据量很小、需要频繁读回时，上传和下载的开销可能超过 GPU 计算本身，CPU 反而更快。</p>
<h2>是否迁移</h2>
<ul>
<li>现有 WebGL 应用运行良好、需要覆盖所有用户时，不必为了新接口重写。</li>
<li>需要 GPU 计算（推理、物理模拟、大规模数据处理），或者渲染瓶颈在 CPU 提交开销上时，WebGPU 收益更明显。</li>
<li>Three.js、Babylon.js 等库已提供 WebGPU 渲染器，并能在不支持时回退 WebGL，是更稳妥的接入方式。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>怎样判断当前是否运行在兼容模式？</strong> 检查 <code>device.features.has(&#x27;core-features-and-limits&#x27;)</code>，返回 <code>false</code> 表示兼容模式。</li>
<li><strong>JavaScript 对象可以直接传给 WGSL 结构体吗？</strong> 不行。要按 WGSL 的对齐规则写入 <code>ArrayBuffer</code>，字段偏移和填充都要算对。</li>
</ul>`};export{e as default};