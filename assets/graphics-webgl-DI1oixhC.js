var e={answerHtml:`<p>WebGL 让 JavaScript 组织图形资源和绘制命令，由图形实现执行着色器与光栅化等工作。它能高效处理适合并行的图形计算，但不是把任意 JavaScript 自动搬到 GPU。</p>
<p>画一个三角形时，JavaScript 提供顶点、缓冲区、着色器和状态；GPU 按流水线把几何转换成画布上的颜色。应用仍负责决定画什么、何时更新和如何管理资源。</p>
<h3>顶点着色器和片元着色器各做什么</h3>
<p>顶点着色器处理顶点属性，例如把模型空间位置经过变换得到裁剪空间位置，同时输出颜色、纹理坐标等后续需要的信息。</p>
<p>几何经过裁剪、透视除法和光栅化后形成片元；片元着色器计算候选片元的输出颜色。片元并不总与最终像素一一对应，深度、模板、混合和多重采样等步骤还会影响结果。</p>
<p>以下是一对 WebGL 2 的简单着色器：</p>
<div class="not-prose code-block"><div class="code-language">glsl</div><pre><code class="hljs language-glsl">#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">glsl</div><pre><code class="hljs language-glsl">#version 300 es
precision mediump float;
out vec4 outColor;
void main() {
  outColor = vec4(0.0, 0.4, 1.0, 1.0);
}
</code></pre></div>
<p>顶点位置直接写入 gl_Position；在这里 w 为 1，所以 x、y 为 -1 到 1 的位置对应常见可见范围。片元统一输出蓝色。实际程序还需要创建 WebGL 2 上下文、编译链接、上传顶点并执行 draw 调用，这两段代码本身不会自动出图。</p>
<p>WebGL 1 与 WebGL 2 的 GLSL 版本和接口不同，例如 WebGL 1 常见 attribute 与 gl_FragColor，不能把两套语法直接混用。</p>
<h3>数据与状态都需要正确绑定</h3>
<p>缓冲区保存顶点等数据，attribute 描述如何读取每个顶点，uniform 提供一次绘制中共享的值，纹理提供可采样图像。绘制前需要正确选择程序、绑定资源并设置布局。</p>
<p>黑屏可能来自着色器编译失败、链接失败、顶点布局不对、视口尺寸错误，或者对象在裁剪范围之外。应读取编译与链接日志，并从最小图形逐步增加功能，而不是直接调光照参数碰运气。</p>
<p>Canvas 尺寸变化后，还要设置合适 viewport 并重绘；CSS 展示尺寸与内部绘制缓冲尺寸也不能混淆。</p>
<h3>GPU 加速有数据与同步成本</h3>
<p>如果每帧重新创建缓冲区、上传全部几何或发出大量很小的 draw call，CPU 组织命令的成本可能先成为瓶颈。适合时可复用资源、批处理或实例化，减少重复状态切换。</p>
<p>纹理太大、重叠透明层太多或片元着色器过重，则可能受显存、带宽和填充率限制。提高分辨率会增加片元工作，不能只看对象数量。</p>
<p>readPixels 等读回操作还可能导致同步等待，把 GPU 的并行优势消耗在 CPU 等结果上。频繁读取用于每次鼠标移动的精确拾取，要特别评估成本。</p>
<h3>上下文丢失是必须处理的生命周期</h3>
<p>浏览器可能因资源压力、设备切换或其他原因丢失 WebGL 上下文。应用应处理 webglcontextlost，停止无效绘制；若准备恢复，应按 API 规则阻止默认处理并在恢复事件中重建所需资源。</p>
<p>恢复后不能把旧缓冲区、纹理和程序句柄当成仍然有效。应用需要保留足够的 CPU 数据或重新加载来源，并在正常销毁时释放不再需要的 GPU 对象。</p>
<p>浏览器能取得 WebGL 上下文也不保证所有扩展、精度和纹理尺寸都相同。应查询能力、提供降级或错误体验，且不要假定所有环境一定使用同一种硬件加速路径。</p>
<p>Three.js 等库能封装场景、材质和相机，但仍要理解资源释放、纹理大小和绘制成本。选用 WebGL 的理由应是图形需求和测量收益，而不是“用了 GPU 就一定快”。</p>`};export{e as default};