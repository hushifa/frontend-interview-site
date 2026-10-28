var e={answerHtml:`<h2>简答</h2>
<ul>
<li>顶点着色器对每个顶点运行，输出裁剪空间坐标 <code>gl_Position</code>；片元着色器对光栅化出的每个片元运行，输出颜色，之后经过深度测试和混合才写入画面。</li>
<li>数据有三种入口：顶点属性（每个顶点不同，放在缓冲区里）、uniform（一次绘制共享，如矩阵、时间）、纹理（图片或查找表）。</li>
<li>多数显示错误来自坐标空间约定不清：模型、世界、视图、裁剪空间之间的矩阵顺序要写明。</li>
<li>片元着色器的执行次数随像素数增长，全屏特效在高分辨率屏幕上开销很大。</li>
<li>编译和链接失败要读 <code>getShaderInfoLog()</code>、<code>getProgramInfoLog()</code>，GLSL 错误不会以 JavaScript 异常的形式出现。</li>
</ul>
<h2>两段着色器</h2>
<p>WebGL 1（GLSL ES 1.00）写法：</p>
<div class="not-prose code-block"><div class="code-language">glsl</div><pre><code class="hljs language-glsl">// 顶点着色器
attribute vec2 a_position;
attribute vec3 a_color;
uniform mat3 u_transform;
varying mediump vec3 v_color;

void main() {
  vec3 p = u_transform * vec3(a_position, 1.0);
  gl_Position = vec4(p.xy, 0.0, 1.0);
  v_color = a_color;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">glsl</div><pre><code class="hljs language-glsl">// 片元着色器
precision mediump float;
varying mediump vec3 v_color;

void main() {
  gl_FragColor = vec4(v_color, 1.0);
}
</code></pre></div>
<p><code>v_color</code> 在三角形内部插值，所以每个片元拿到的是三个顶点颜色的混合值。WebGL 2 使用 <code>#version 300 es</code>，把 <code>attribute</code>/<code>varying</code> 改成 <code>in</code>/<code>out</code>，片元输出要自己声明 <code>out vec4</code>，不再用 <code>gl_FragColor</code>。</p>
<h2>完成一次绘制</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">compile</span>(<span class="hljs-params">gl, type, source</span>) {
  <span class="hljs-keyword">const</span> shader = gl.<span class="hljs-title function_">createShader</span>(type);
  gl.<span class="hljs-title function_">shaderSource</span>(shader, source);
  gl.<span class="hljs-title function_">compileShader</span>(shader);
  <span class="hljs-keyword">if</span> (!gl.<span class="hljs-title function_">getShaderParameter</span>(shader, gl.<span class="hljs-property">COMPILE_STATUS</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(gl.<span class="hljs-title function_">getShaderInfoLog</span>(shader));
  }
  <span class="hljs-keyword">return</span> shader;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">drawTriangle</span>(<span class="hljs-params">canvas, vertexSource, fragmentSource</span>) {
  <span class="hljs-keyword">const</span> gl = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;webgl&#x27;</span>);
  <span class="hljs-keyword">if</span> (!gl) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;无法创建 WebGL 上下文&#x27;</span>);

  <span class="hljs-keyword">const</span> program = gl.<span class="hljs-title function_">createProgram</span>();
  gl.<span class="hljs-title function_">attachShader</span>(program, <span class="hljs-title function_">compile</span>(gl, gl.<span class="hljs-property">VERTEX_SHADER</span>, vertexSource));
  gl.<span class="hljs-title function_">attachShader</span>(program, <span class="hljs-title function_">compile</span>(gl, gl.<span class="hljs-property">FRAGMENT_SHADER</span>, fragmentSource));
  gl.<span class="hljs-title function_">bindAttribLocation</span>(program, <span class="hljs-number">0</span>, <span class="hljs-string">&#x27;a_position&#x27;</span>); <span class="hljs-comment">// 让位置属性占用 0 号位置</span>
  gl.<span class="hljs-title function_">linkProgram</span>(program);
  <span class="hljs-keyword">if</span> (!gl.<span class="hljs-title function_">getProgramParameter</span>(program, gl.<span class="hljs-property">LINK_STATUS</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(gl.<span class="hljs-title function_">getProgramInfoLog</span>(program));
  }
  gl.<span class="hljs-title function_">useProgram</span>(program);

  <span class="hljs-keyword">const</span> buffer = gl.<span class="hljs-title function_">createBuffer</span>();
  gl.<span class="hljs-title function_">bindBuffer</span>(gl.<span class="hljs-property">ARRAY_BUFFER</span>, buffer);
  gl.<span class="hljs-title function_">bufferData</span>(gl.<span class="hljs-property">ARRAY_BUFFER</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Float32Array</span>([-<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]), gl.<span class="hljs-property">STATIC_DRAW</span>);
  gl.<span class="hljs-title function_">enableVertexAttribArray</span>(<span class="hljs-number">0</span>);
  gl.<span class="hljs-title function_">vertexAttribPointer</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>, gl.<span class="hljs-property">FLOAT</span>, <span class="hljs-literal">false</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>);

  <span class="hljs-keyword">const</span> color = gl.<span class="hljs-title function_">getAttribLocation</span>(program, <span class="hljs-string">&#x27;a_color&#x27;</span>);
  gl.<span class="hljs-title function_">vertexAttrib3f</span>(color, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>); <span class="hljs-comment">// 不启用数组时，所有顶点共用这个常量值</span>
  gl.<span class="hljs-title function_">uniformMatrix3fv</span>(gl.<span class="hljs-title function_">getUniformLocation</span>(program, <span class="hljs-string">&#x27;u_transform&#x27;</span>), <span class="hljs-literal">false</span>,
    <span class="hljs-keyword">new</span> <span class="hljs-title class_">Float32Array</span>([<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]));

  gl.<span class="hljs-title function_">viewport</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, canvas.<span class="hljs-property">width</span>, canvas.<span class="hljs-property">height</span>);
  gl.<span class="hljs-title function_">drawArrays</span>(gl.<span class="hljs-property">TRIANGLES</span>, <span class="hljs-number">0</span>, <span class="hljs-number">3</span>);

  <span class="hljs-keyword">const</span> pixel = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">4</span>);
  gl.<span class="hljs-title function_">readPixels</span>(canvas.<span class="hljs-property">width</span> / <span class="hljs-number">2</span>, canvas.<span class="hljs-property">height</span> / <span class="hljs-number">2</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, gl.<span class="hljs-property">RGBA</span>, gl.<span class="hljs-property">UNSIGNED_BYTE</span>, pixel);
  <span class="hljs-keyword">return</span> pixel;
}
</code></pre></div>
<p>画布中心落在三角形内，<code>readPixels</code> 读出的像素是红色 <code>[255, 0, 0, 255]</code>。</p>
<h2>坐标空间</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">裁剪坐标 = 投影矩阵 × 视图矩阵 × 模型矩阵 × 模型坐标
</code></pre></div>
<p>GPU 对裁剪坐标做透视除法得到标准化设备坐标（-1 到 1），再由 viewport 映射到像素。WebGL 的矩阵按列主序传入，和 JavaScript 端数学库的约定要一致。调试时先用单位矩阵画一个三角形，再逐个加入变换。</p>
<h2>性能与精度</h2>
<ul>
<li>几何数据一次上传到缓冲区，每帧只更新 uniform。不要每帧重建缓冲区，也不要每个小物体用一个程序。</li>
<li>相同材质的对象合并绘制，或使用实例化绘制。</li>
<li><code>mediump</code> 的精度在不同设备上不同，大坐标场景会出现抖动，可以改用 <code>highp</code> 或让坐标相对摄像机。</li>
<li>纹理颜色多为 sRGB，参与光照计算前要转换到线性空间，否则亮度会偏。</li>
</ul>
<h2>安全</h2>
<p>不要把用户输入拼接进 GLSL 源码。用户数据通过属性、uniform 或纹理传入，模型和纹理要限制尺寸，防止耗尽显存。</p>
<p>上下文丢失的处理见<a href="/questions/graphics-webgl/">《什么场景值得用 WebGL？GPU 加速有哪些成本？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li><strong>为什么要把位置属性绑定到 0 号？</strong> 在部分 WebGL 1 实现上，0 号属性没有启用数组会走慢路径，把最常用的属性固定在 0 号可以避免。</li>
<li><strong>透明物体为什么显示错乱？</strong> 混合依赖绘制顺序，透明物体通常要从远到近排序，并关闭深度写入。</li>
</ul>`};export{e as default};