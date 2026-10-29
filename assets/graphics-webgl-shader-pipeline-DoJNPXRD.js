var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>着色器是跑在 GPU 上的小程序，WebGL 画一个图形要写两段。顶点着色器对每个顶点跑一次，算出它在屏幕上的位置，输出裁剪空间坐标 <code>gl_Position</code>。GPU 再把三角形拆成一个个片元，片元可以先理解成“候选像素”，片元着色器对每个片元跑一次，算出颜色。之后还要经过深度测试和混合，才真正写进画面。</p>
<p>数据有三种入口：顶点属性，每个顶点各不相同，放在缓冲区里；uniform，一次绘制里所有顶点共用，比如矩阵、时间；还有纹理，也就是图片或查找表。</p>
<p>画面不对时，多半是坐标空间没理清。模型、世界、视图、裁剪空间之间的矩阵顺序要写清楚。</p>
<p>还要注意两点。片元着色器的执行次数跟像素数成正比，全屏特效在高分辨率屏上很费。另外 GLSL 的编译和链接错误不会变成 JavaScript 异常，要自己去读 <code>getShaderInfoLog()</code>、<code>getProgramInfoLog()</code>。</p>
</blockquote>
<h2>两段着色器长什么样</h2>
<p>下面是 WebGL 1（GLSL ES 1.00）的写法。先看顶点着色器：</p>
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
<p>再看片元着色器：</p>
<div class="not-prose code-block"><div class="code-language">glsl</div><pre><code class="hljs language-glsl">// 片元着色器
precision mediump float;
varying mediump vec3 v_color;

void main() {
  gl_FragColor = vec4(v_color, 1.0);
}
</code></pre></div>
<p><code>a_position</code>、<code>a_color</code> 是顶点属性，每个顶点一份。<code>u_transform</code> 是 uniform，所有顶点共用。<code>v_color</code> 是从顶点着色器传给片元着色器的值。</p>
<p>可是顶点只有三个，片元却有成百上千个，每个片元的 <code>v_color</code> 从哪来？答案是 GPU 会在三角形内部插值。所以每个片元拿到的，是三个顶点颜色按距离混合的结果。</p>
<p>WebGL 2 用 <code>#version 300 es</code>，把 <code>attribute</code>/<code>varying</code> 换成 <code>in</code>/<code>out</code>。片元输出也要自己声明一个 <code>out vec4</code>，不再用 <code>gl_FragColor</code>。</p>
<h2>完整画一个三角形要哪些步骤</h2>
<p>下面的函数编译着色器、上传顶点、画一个三角形，最后读回画布中心的像素：</p>
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
<p>步骤是：编译两段着色器，链接成一个程序；把三个顶点的坐标上传到缓冲区，告诉 GPU 怎么读；设好颜色和矩阵；最后 <code>drawArrays</code> 画出来。</p>
<p>注意 <code>compile</code> 和链接后的检查。GLSL 写错了，<code>compileShader</code> 不会抛异常，只会把状态标成失败，所以要主动检查，再把日志读出来。</p>
<p>颜色这里没用缓冲区，而是 <code>vertexAttrib3f</code> 设了一个常量，所以三个顶点都是红色。矩阵是单位矩阵，坐标原样输出。三个顶点 (-1, -1)、(1, -1)、(0, 1) 构成的三角形盖住了画布中心，所以 <code>readPixels</code> 读出的中心像素是红色 <code>[255, 0, 0, 255]</code>。</p>
<h2>坐标是怎样一步步变到屏幕上的</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">裁剪坐标 = 投影矩阵 × 视图矩阵 × 模型矩阵 × 模型坐标
</code></pre></div>
<p>模型矩阵把模型放进世界，视图矩阵相当于摆相机，投影矩阵决定透视效果。GPU 拿到裁剪坐标后做透视除法，得到标准化设备坐标，范围是 -1 到 1，再由 viewport 映射成像素。</p>
<p>WebGL 的矩阵按列主序传入，所以要和 JavaScript 端数学库的约定一致，不然矩阵会被转置。调试时可以先用单位矩阵画一个三角形，确认能画出来，再一个个把变换加进去。</p>
<h2>性能和精度要注意什么</h2>
<p>几何数据一次上传到缓冲区，每帧只更新 uniform。不要每帧重建缓冲区，也不要每个小物体都用一个单独的程序。相同材质的对象合并起来画，或者用实例化绘制。</p>
<p><code>mediump</code> 的精度在不同设备上不一样。坐标很大的场景会出现抖动，可以改用 <code>highp</code>，或者让坐标相对于相机来算，让数值变小。</p>
<p>纹理里的颜色多数是 sRGB，参与光照计算之前要先转到线性空间，否则算出来的亮度会偏。</p>
<h2>安全上要注意什么</h2>
<p>不要把用户输入拼进 GLSL 源码里。用户的数据要通过属性、uniform 或纹理传进去。模型和纹理还要限制尺寸，防止把显存耗光。</p>
<p>上下文丢失怎么处理，见<a href="/questions/graphics-webgl/">《什么场景值得用 WebGL？GPU 加速有哪些成本？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么要把位置属性绑定到 0 号？</strong></p>
<blockquote>
<p>在部分 WebGL 1 实现上，0 号属性如果没有启用数组，会走一条慢路径。把最常用的位置属性固定在 0 号，就能避开这个问题。</p>
</blockquote>
<p><strong>透明物体为什么显示错乱？</strong></p>
<blockquote>
<p>因为混合的结果依赖绘制顺序。透明物体通常要从远到近排序再画，并关掉深度写入。</p>
</blockquote>`};export{e as default};