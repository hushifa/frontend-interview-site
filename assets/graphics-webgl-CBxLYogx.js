var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>WebGL 让页面直接用 GPU 画图。GPU 擅长同时处理一大批同样的活，所以上万个散点或点云、地图瓦片、粒子、三维场景、实时图像滤镜，适合用 WebGL。</p>
<p>几百个节点的图表、表单动画、普通界面就不必了，用 SVG、Canvas 2D 或 CSS 更简单，也更好做无障碍。而且要先确认慢的是绘制。如果慢在数据处理或布局，换成 WebGL 也快不起来。</p>
<p>GPU 也不是白用的。每帧重建缓冲区、大量很小的 draw call，会让 CPU 先成为瓶颈；<code>readPixels</code> 会让 CPU 停下来等 GPU。</p>
<p>还要处理上下文丢失。监听 <code>webglcontextlost</code> 并调用 <code>preventDefault()</code>，浏览器才会恢复上下文，恢复后要把所有 GPU 资源重建一遍。</p>
</blockquote>
<h2>选型前先问三个问题</h2>
<p>第一，瓶颈是不是绘制？用性能面板看看，时间是花在脚本、布局还是绘制上。</p>
<p>第二，团队能不能维护 GPU 代码？着色器、矩阵、资源释放都要专门的知识。维护不了，就用 Three.js、deck.gl、PixiJS 这类高层库。</p>
<p>第三，目标设备支不支持？WebGL 2 已经普遍可用，可是扩展、精度、最大纹理尺寸因设备而异，所以要先查询能力，并准备降级。</p>
<p>如果要做通用计算，比如在 GPU 上跑推理或物理模拟，再去评估 WebGPU。</p>
<h2>性能成本花在哪里</h2>
<p>先解释 draw call：JS 每让 GPU 画一次，就是一次 draw call。每次提交都有 CPU 开销，次数多了，GPU 还没忙起来，CPU 已经忙不过来了。</p>
<table><thead><tr><th>瓶颈</th><th>表现</th><th>处理方式</th></tr></thead><tbody><tr><td>CPU 提交</td><td>draw call 太多、每帧重新上传几何</td><td>合并批次、实例化绘制、复用缓冲区</td></tr><tr><td>片元填充</td><td>全屏特效、多层透明、分辨率高</td><td>降低渲染分辨率、减少重叠绘制</td></tr><tr><td>显存与带宽</td><td>纹理太大或太多</td><td>压缩纹理、限制尺寸、及时删除</td></tr><tr><td>同步等待</td><td>每帧 <code>readPixels</code> 做拾取</td><td>改用颜色拾取缓冲按需读取，或在 CPU 端做空间索引</td></tr></tbody></table>
<p>最后一行为什么慢？GPU 本来是和 CPU 并行工作的，CPU 提交完命令就去干别的。<code>readPixels</code> 要求马上拿到结果，CPU 只能等 GPU 把前面的活都做完，并行就被打断了。</p>
<h2>上下文丢失怎么处理</h2>
<p>显卡驱动重置、系统回收资源时，WebGL 上下文可能会丢失，画布上的东西全没了。处理方式是这样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">canvas.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;webglcontextlost&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">preventDefault</span>(); <span class="hljs-comment">// 不调用就不会触发 webglcontextrestored</span>
  <span class="hljs-title function_">stopRenderLoop</span>();
});

canvas.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;webglcontextrestored&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">createResources</span>(); <span class="hljs-comment">// 重新编译着色器、创建缓冲区和纹理</span>
  <span class="hljs-title function_">startRenderLoop</span>();
});
</code></pre></div>
<p>丢失时必须调用 <code>preventDefault()</code>，告诉浏览器“我会自己恢复”，否则 <code>webglcontextrestored</code> 根本不会触发。恢复后，着色器、缓冲区、纹理都要重新创建。</p>
<p>所以业务数据要保存在 JavaScript 里。GPU 上的缓冲区和纹理只是副本，上下文一丢就全部失效，只能从 JS 这边重新上传。</p>
<p>着色器怎样工作、怎样完成一次绘制，见<a href="/questions/graphics-webgl-shader-pipeline/">《WebGL 着色器如何工作？如何避免把 GPU 当成黑盒？》</a>。</p>
<h2>常见追问</h2>
<p><strong>WebGL 和 Canvas 2D 都画在 canvas 上，区别是什么？</strong></p>
<blockquote>
<p>Canvas 2D 是即时绘图 API，你说画个矩形，浏览器负责把它变成像素。WebGL 要你自己写着色器、管理 GPU 资源，控制力更强，代码量也大得多。</p>
</blockquote>
<p><strong>用了 Three.js 还需要懂 WebGL 吗？</strong></p>
<blockquote>
<p>需要了解基本的成本：纹理多大、draw call 有多少、透明物体怎么排序、资源怎么释放。不然照样会卡，或者泄漏显存。</p>
</blockquote>`};export{e as default};