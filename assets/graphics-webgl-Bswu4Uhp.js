var e={answerHtml:`<h2>简答</h2>
<ul>
<li>适合 WebGL：上万个散点或点云、地图瓦片、粒子、三维场景、实时图像滤镜。</li>
<li>不必用 WebGL：几百个节点的图表、表单动画、普通界面，用 SVG、Canvas 2D 或 CSS 更简单，也更容易做无障碍。</li>
<li>先确认瓶颈在绘制。如果慢在数据处理或布局，换成 WebGL 也不会变快。</li>
<li>GPU 不是免费的：每帧重建缓冲区、大量小 draw call 会让 CPU 先成为瓶颈；<code>readPixels</code> 会让 CPU 等待 GPU。</li>
<li>要处理上下文丢失：监听 <code>webglcontextlost</code> 并调用 <code>preventDefault()</code>，浏览器才会恢复上下文，恢复后重建全部 GPU 资源。</li>
</ul>
<h2>选型三问</h2>
<ol>
<li><strong>瓶颈是不是绘制？</strong> 用性能面板看时间花在脚本、布局还是绘制上。</li>
<li><strong>团队能不能维护 GPU 代码？</strong> 着色器、矩阵、资源释放都需要专门知识。维护不了就用 Three.js、deck.gl、PixiJS 等高层库。</li>
<li><strong>目标设备支不支持？</strong> WebGL 2 已普遍可用，但扩展、精度、最大纹理尺寸因设备而异，要查询能力并准备降级。</li>
</ol>
<p>需要通用计算（例如在 GPU 上跑推理或物理模拟）时，再评估 WebGPU。</p>
<h2>性能成本在哪里</h2>
<table><thead><tr><th>瓶颈</th><th>表现</th><th>处理方式</th></tr></thead><tbody><tr><td>CPU 提交</td><td>draw call 太多、每帧重新上传几何</td><td>合并批次、实例化绘制、复用缓冲区</td></tr><tr><td>片元填充</td><td>全屏特效、多层透明、分辨率高</td><td>降低渲染分辨率、减少重叠绘制</td></tr><tr><td>显存与带宽</td><td>纹理太大或太多</td><td>压缩纹理、限制尺寸、及时删除</td></tr><tr><td>同步等待</td><td>每帧 <code>readPixels</code> 做拾取</td><td>改用颜色拾取缓冲按需读取，或在 CPU 端做空间索引</td></tr></tbody></table>
<h2>上下文丢失</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">canvas.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;webglcontextlost&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">preventDefault</span>(); <span class="hljs-comment">// 不调用就不会触发 webglcontextrestored</span>
  <span class="hljs-title function_">stopRenderLoop</span>();
});

canvas.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;webglcontextrestored&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">createResources</span>(); <span class="hljs-comment">// 重新编译着色器、创建缓冲区和纹理</span>
  <span class="hljs-title function_">startRenderLoop</span>();
});
</code></pre></div>
<p>业务数据要保存在 JavaScript 里，GPU 上的缓冲区和纹理只是副本，上下文丢失后它们全部失效。</p>
<p>着色器怎样工作、怎样完成一次绘制，见&quot;WebGL 着色器如何工作？如何避免把 GPU 当成黑盒？&quot;。</p>
<h2>常见追问</h2>
<ul>
<li><strong>WebGL 和 Canvas 2D 都画在 canvas 上，区别是什么？</strong> Canvas 2D 是即时绘图 API，浏览器负责光栅化；WebGL 让你自己写着色器、管理 GPU 资源，控制力更强，代码量也大得多。</li>
<li><strong>用了 Three.js 还需要懂 WebGL 吗？</strong> 需要了解基本成本：纹理大小、draw call 数量、透明排序和资源释放，否则照样会卡或泄漏显存。</li>
</ul>`};export{e as default};