var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebGPU 先通过 requestAdapter 和 requestDevice 获取设备，适配器可能为空，设备申请也可能失败。</li>
<li>渲染和计算使用不同的管线，管线状态要提前显式描述。</li>
<li>GPUBuffer 的 usage、数据布局和对齐都有明确规则，JS 对象布局不能直接当作 WGSL 结构体。</li>
<li>成熟的 WebGL 应用是否迁移，要看设备覆盖、库支持和计算需求。</li>
</ul>
<p>WebGL 主要围绕图形绘制提供接口，WebGPU 则使用更现代、显式的 GPU 编程模型，既支持渲染管线，也提供计算管线。它适合需要更精细资源控制或通用并行计算的场景，但不是把 WebGL 函数改个名字就能迁移。</p>
<p>两者都不能让普通 JavaScript 函数自动在 GPU 执行。WebGPU 使用 WGSL 等相应着色器代码，应用负责准备数据、管线、绑定与命令。</p>
<h2>从 adapter 到 device，再提交工作</h2>
<p>应用通常先检查安全上下文中的 navigator.gpu，再 requestAdapter 获取可用适配器，随后 requestDevice 创建逻辑设备。适配器可能为空，设备申请也可能失败，不能用非空断言掩盖这些情况。</p>
<p>设备提供缓冲区、纹理、着色器模块和管线等资源。应用通过 command encoder 记录命令，在相应 pass 中设置管线与资源绑定，结束编码后提交到 queue。</p>
<p>queue.submit 表示提交工作，不代表 GPU 已经全部执行完毕。如果立即需要 CPU 读取结果，还要通过合法的复制、映射和同步流程获得数据，不能直接读取显存里的变量。</p>
<h2>渲染和计算使用不同管线</h2>
<p>渲染管线通常包含顶点与片元阶段，还显式描述顶点格式、颜色目标、深度和混合等状态。提前定义管线有助于浏览器验证和准备工作，避免把所有状态都拖到每次绘制才决定。</p>
<p>计算管线使用 compute shader，对工作组内的调用执行通用并行任务。一个最小概念示例是把一组浮点数乘二：</p>
<div class="not-prose code-block"><div class="code-language">wgsl</div><pre><code class="hljs language-wgsl">@group(0) @binding(0) var&lt;storage, read_write&gt; values: array&lt;f32&gt;;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3&lt;u32&gt;) {
  if (id.x &lt; arrayLength(&amp;values)) {
    values[id.x] = values[id.x] * 2.0;
  }
}
</code></pre></div>
<p>若有 N 个元素，一维调度通常需要覆盖 <code>ceil(N / 64)</code> 个工作组，并用边界判断避免末组越界。这里每个调用只写自己的元素，不涉及不同调用抢写同一位置。</p>
<p>代码只是 shader，不是完整可运行应用；还要创建具有正确 usage 的缓冲区、绑定布局、计算管线并提交 dispatch。工作组大小也需要符合设备限制，不能把示例值当作所有算法的最优配置。</p>
<h2>资源约束比“有一个数组”更明确</h2>
<p>GPUBuffer 的 usage 决定它可用于存储、复制、映射等操作；数据布局、对齐和绑定范围也必须符合规则。JavaScript 对象的内存布局不能直接当作 WGSL 结构体布局。</p>
<p>常见结果读回流程是将 GPU 工作缓冲复制到合适的读回缓冲，再映射到 CPU。上传和读回都会花时间，若每次只计算几个数却来回传输，可能比直接在 CPU 做还慢。</p>
<p>共享数据还要遵守 GPU 的同步与内存模型。工作组内屏障不等于全设备任意工作组都已同步，不能把单线程循环的先后关系直接套进并行 shader。</p>
<h2>能力检测和错误处理都不能省</h2>
<p>需要某项 optional feature 或更高 limit 时，应先检查适配器提供什么，再申请真正需要的能力；请求不支持的条件会失败。API 存在不等于目标格式、容量和性能都满足业务要求。</p>
<p>设备丢失通过 device.lost 等机制通知，应用应停止使用旧设备资源，并根据场景重新初始化或显示降级。验证错误可以结合错误作用域、未捕获错误事件及着色器编译信息定位，不能只在 requestDevice 外层放一个 catch 就结束。</p>
<p>用完的大缓冲和纹理需要管理生命周期，尤其是长时间运行的编辑器或推理任务。提交后仍在使用的资源与可立即销毁的资源，也应按 API 语义处理。</p>
<h2>是否迁移取决于实际需求</h2>
<p>成熟 WebGL 应用不必只因 WebGPU 更新就重写。应评估浏览器和设备覆盖、库支持、渲染特性、计算需求，以及团队维护底层资源模型的成本。</p>
<p>对矩阵、图像或大量独立元素运算，WebGPU 可能有收益；对小任务、频繁读回或复杂串行控制，CPU 可能更合适。比较端到端耗时，包括初始化、上传、计算与下载，而不是只展示一个 GPU 内核执行时间。</p>`};export{e as default};