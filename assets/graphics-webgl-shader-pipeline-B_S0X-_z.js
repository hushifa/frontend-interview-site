var e={answerHtml:`<h2>简答</h2>
<ul>
<li>顶点着色器输出裁剪空间中的 gl_Position，片元着色器计算片元颜色，之后还要经过深度测试和混合。</li>
<li>多数渲染错误来自坐标空间和矩阵顺序没有约定清楚。</li>
<li>顶点属性、uniform 和纹理的更新成本不同，状态切换和批次会影响性能。</li>
<li>全屏效果会让片元阶段随分辨率放大；还要明确精度，并在上下文丢失后重建资源。</li>
</ul>
<p>地图、粒子和三维产品预览中，CPU 逐个计算顶点和颜色很快会成为瓶颈。WebGL 把一部分计算交给 GPU，但 GPU 只执行着色器程序，不能直接理解业务对象。要写出可靠的效果，必须先理解顶点如何从模型坐标走到屏幕、片元如何决定最终颜色，以及数据传输和状态切换为什么会影响性能。</p>
<h2>顶点着色器和片元着色器职责不同</h2>
<p>顶点着色器处理顶点属性，最重要的输出是裁剪空间中的 <code>gl_Position</code>；片元着色器计算片元输出，随后还受深度测试、混合等阶段影响，并不直接决定屏幕最终像素。普通平滑浮点 varying 会进行透视校正插值，不能一律当作屏幕坐标上的简单线性插值。法线插值后也通常需要重新归一化。</p>
<div class="not-prose code-block"><div class="code-language">glsl</div><pre><code class="hljs language-glsl">// 顶点着色器：把模型坐标转换到裁剪空间，并传递颜色
attribute vec2 a_position;
attribute vec3 a_color;
uniform mat3 u_transform;
varying mediump vec3 v_color;

void main() {
  vec3 position = u_transform * vec3(a_position, 1.0);
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_color = a_color;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">glsl</div><pre><code class="hljs language-glsl">// 片元着色器：插值后的颜色会用于每个片元
precision mediump float;
varying mediump vec3 v_color;

void main() {
  gl_FragColor = vec4(v_color, 1.0);
}
</code></pre></div>
<p>示例使用 WebGL 1 的 <code>attribute</code>、<code>uniform</code> 和 <code>varying</code> 语法；WebGL 2 使用 GLSL ES 3.00 时应改用 <code>in</code>、<code>out</code> 和 <code>#version 300 es</code>。不能把两种版本的语法混用。着色器编译和链接失败时，必须读取 <code>getShaderInfoLog()</code> 与 <code>getProgramInfoLog()</code>，不能只检查 JavaScript 是否抛错。</p>
<p>两端显式声明同名 varying 的相同精度，避免依赖顶点与片元阶段不同的默认精度。此处 mat3 示例只用于二维仿射变换，输出 w 固定为 1；若要表达三维透视，应使用相应 mat4 变换并保留齐次 w，不能把透视结果的 w 丢掉。</p>
<p>WebGL 2 中将 varying 改成 in/out 还不够：片元输出需声明自己的 out vec4，替代 GLSL ES 1.00 中的 gl_FragColor。示例是两段着色器源码，仍需宿主创建上下文、上传属性与矩阵、链接程序并发起绘制，不能直接粘贴进页面就显示三角形。</p>
<h2>把两段源码接到一次真正的绘制</h2>
<p>页面准备 <code>&lt;canvas id=&quot;preview&quot; width=&quot;128&quot; height=&quot;128&quot;&gt;&lt;/canvas&gt;</code>，将前面两段 GLSL 分别保存为 vertexSource 和 fragmentSource 字符串，再运行下面的宿主代码。它只画一个三角形，使用单位矩阵；不加载外部图片或模型。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">drawTriangle</span>(<span class="hljs-params">canvas, vertexSource, fragmentSource</span>) {
  <span class="hljs-keyword">const</span> gl = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;webgl&#x27;</span>);
  <span class="hljs-keyword">if</span> (!gl) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前环境无法创建 WebGL 上下文&#x27;</span>);
  <span class="hljs-keyword">const</span> shaders = [];
  <span class="hljs-keyword">const</span> program = gl.<span class="hljs-title function_">createProgram</span>();
  <span class="hljs-keyword">const</span> buffer = gl.<span class="hljs-title function_">createBuffer</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">if</span> (!program || !buffer) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;无法分配绘制资源&#x27;</span>);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [type, source] <span class="hljs-keyword">of</span> [
      [gl.<span class="hljs-property">VERTEX_SHADER</span>, vertexSource],
      [gl.<span class="hljs-property">FRAGMENT_SHADER</span>, fragmentSource],
    ]) {
      <span class="hljs-keyword">const</span> shader = gl.<span class="hljs-title function_">createShader</span>(type);
      <span class="hljs-keyword">if</span> (!shader) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;无法创建着色器&#x27;</span>);
      shaders.<span class="hljs-title function_">push</span>(shader);
      gl.<span class="hljs-title function_">shaderSource</span>(shader, source);
      gl.<span class="hljs-title function_">compileShader</span>(shader);
      <span class="hljs-keyword">if</span> (!gl.<span class="hljs-title function_">getShaderParameter</span>(shader, gl.<span class="hljs-property">COMPILE_STATUS</span>)) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(gl.<span class="hljs-title function_">getShaderInfoLog</span>(shader) || <span class="hljs-string">&#x27;编译失败&#x27;</span>);
      }
      gl.<span class="hljs-title function_">attachShader</span>(program, shader);
    }
    <span class="hljs-comment">// WebGL 1 中 attribute 0 未启用数组时，部分实现会走慢路径甚至不绘制；链接前把位置固定到 0</span>
    gl.<span class="hljs-title function_">bindAttribLocation</span>(program, <span class="hljs-number">0</span>, <span class="hljs-string">&#x27;a_position&#x27;</span>);
    gl.<span class="hljs-title function_">linkProgram</span>(program);
    <span class="hljs-keyword">if</span> (!gl.<span class="hljs-title function_">getProgramParameter</span>(program, gl.<span class="hljs-property">LINK_STATUS</span>)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(gl.<span class="hljs-title function_">getProgramInfoLog</span>(program) || <span class="hljs-string">&#x27;链接失败&#x27;</span>);
    }
    gl.<span class="hljs-title function_">useProgram</span>(program);
    gl.<span class="hljs-title function_">bindBuffer</span>(gl.<span class="hljs-property">ARRAY_BUFFER</span>, buffer);
    gl.<span class="hljs-title function_">bufferData</span>(gl.<span class="hljs-property">ARRAY_BUFFER</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Float32Array</span>([-<span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]), gl.<span class="hljs-property">STATIC_DRAW</span>);
    <span class="hljs-keyword">const</span> position = gl.<span class="hljs-title function_">getAttribLocation</span>(program, <span class="hljs-string">&#x27;a_position&#x27;</span>);
    <span class="hljs-keyword">const</span> color = gl.<span class="hljs-title function_">getAttribLocation</span>(program, <span class="hljs-string">&#x27;a_color&#x27;</span>);
    <span class="hljs-keyword">const</span> transform = gl.<span class="hljs-title function_">getUniformLocation</span>(program, <span class="hljs-string">&#x27;u_transform&#x27;</span>);
    <span class="hljs-keyword">if</span> (position &lt; <span class="hljs-number">0</span> || color &lt; <span class="hljs-number">0</span> || transform === <span class="hljs-literal">null</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;着色器接口不匹配&#x27;</span>);
    gl.<span class="hljs-title function_">enableVertexAttribArray</span>(position);
    gl.<span class="hljs-title function_">vertexAttribPointer</span>(position, <span class="hljs-number">2</span>, gl.<span class="hljs-property">FLOAT</span>, <span class="hljs-literal">false</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>);
    <span class="hljs-comment">// 不启用颜色数组，使用所有顶点共享的常量属性。</span>
    gl.<span class="hljs-title function_">disableVertexAttribArray</span>(color);
    gl.<span class="hljs-title function_">vertexAttrib3f</span>(color, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>);
    gl.<span class="hljs-title function_">uniformMatrix3fv</span>(transform, <span class="hljs-literal">false</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Float32Array</span>([<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">1</span>]));
    gl.<span class="hljs-title function_">viewport</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0</span>, canvas.<span class="hljs-property">width</span>, canvas.<span class="hljs-property">height</span>);
    gl.<span class="hljs-title function_">drawArrays</span>(gl.<span class="hljs-property">TRIANGLES</span>, <span class="hljs-number">0</span>, <span class="hljs-number">3</span>);
    <span class="hljs-keyword">const</span> pixel = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">4</span>);
    gl.<span class="hljs-title function_">readPixels</span>(<span class="hljs-number">64</span>, <span class="hljs-number">64</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>, gl.<span class="hljs-property">RGBA</span>, gl.<span class="hljs-property">UNSIGNED_BYTE</span>, pixel);
    <span class="hljs-keyword">if</span> (gl.<span class="hljs-title function_">getError</span>() !== gl.<span class="hljs-property">NO_ERROR</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;绘制或像素读取失败&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(pixel);
  } <span class="hljs-keyword">finally</span> {
    gl.<span class="hljs-title function_">useProgram</span>(<span class="hljs-literal">null</span>);
    gl.<span class="hljs-title function_">deleteBuffer</span>(buffer);
    gl.<span class="hljs-title function_">deleteProgram</span>(program);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> shader <span class="hljs-keyword">of</span> shaders) gl.<span class="hljs-title function_">deleteShader</span>(shader);
  }
}
</code></pre></div>
<p>对指定的 128×128 画布，中心位于三角形内部，返回值应为 <code>[255, 0, 0, 255]</code>。readPixels 只用于这个验证案例，它可能迫使 GPU 工作同步完成，不应每帧用于生产性能统计。该函数假定新建、独占的画布上下文，没有替外部渲染器保存或恢复全部 WebGL 状态。</p>
<h2>坐标空间错误通常比公式错误更常见</h2>
<p>业务坐标可能是米、像素或经纬度；模型坐标描述物体本身；世界坐标描述场景中的位置；视图坐标相对于摄像机；裁剪空间经过透视除法后才进入标准化设备坐标，最后由视口变换到屏幕像素。矩阵相乘顺序和坐标空间必须明确，否则物体可能翻转、缩放异常或在摄像机移动时漂移。</p>
<p>一个常见链路是：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">裁剪坐标 = 投影矩阵 × 视图矩阵 × 模型矩阵 × 模型坐标
</code></pre></div>
<p>矩阵在 GLSL 中的布局、列主序约定和 JavaScript 端库的乘法顺序必须一致。不要看到结果“差不多”就忽略约定，换摄像机、非均匀缩放或导入外部模型后错误会暴露。调试时可以先使用单位矩阵和简单三角形，再逐步加入摄像机、模型和投影变换。</p>
<h2><code>uniform</code>、顶点属性和纹理的更新成本不同</h2>
<p>顶点属性通常存放大量几何数据，适合放在缓冲区中批量上传；<code>uniform</code> 适合一批绘制共享的矩阵、颜色或时间；纹理适合图片、查找表和结构化采样数据。每次改变着色器程序、纹理或混合状态都可能造成额外状态切换，切换顺序和绘制批次会影响性能。</p>
<p>不要在每个顶点都通过 JavaScript 调用更新数据，也不要为每个小物体创建一个独立程序。可以合并相同材质和纹理的对象，使用实例化绘制或把变化数据放进合适的缓冲区。优化前先测量 CPU 提交时间、GPU 时间和显存占用；减少 JavaScript 调用不一定能解决片元阶段过重的问题。</p>
<h2>片元阶段可能被屏幕分辨率放大</h2>
<p>顶点数量少不代表渲染一定快。全屏后处理、透明叠加、复杂纹理采样和高阶光照会让片元着色器在大量像素上执行。移动设备通常更容易受填充率、带宽和发热限制。可以降低渲染分辨率、减少过度绘制、合并后处理阶段或按设备能力选择效果，但不能只通过降低顶点数解决片元瓶颈。</p>
<p>透明对象的绘制顺序、深度测试和混合状态也会影响结果。透明像素通常需要排序或采用近似策略；深度写入和混合配置错误会出现遮挡、边缘发黑或颜色叠加异常。每种材质都应明确是否写入深度、使用何种混合方程以及是否需要双面绘制。</p>
<h2>精度和颜色空间需要明确</h2>
<p>片元着色器中的 <code>mediump</code> 在不同设备上可能拥有不同的精度范围，适合普通颜色但不一定适合大世界坐标、深度计算或高动态范围效果。可以使用 <code>highp</code>，但要先检查目标平台支持情况并评估性能。大坐标场景还可能遇到浮点精度导致抖动，应采用相对坐标、分块或摄像机相对原点。</p>
<p>纹理颜色、显示器颜色空间和混合运算的约定也要统一。把 sRGB 颜色直接当线性值参与光照会导致亮度不正确；纹理加载、采样、帧缓冲和最终呈现应遵循所用渲染库和 WebGL 版本的颜色空间设置。不要把“看起来偏亮”简单归因于 CSS 透明度。</p>
<h2>WebGL 上下文丢失必须可恢复</h2>
<p>浏览器或系统可能回收 GPU 资源，触发 <code>webglcontextlost</code>。纹理、缓冲区和程序对象不能假设永久有效；应用应监听上下文丢失并阻止无意义的绘制，在 <code>webglcontextrestored</code> 后重新创建资源。高层库通常提供恢复策略，但业务代码仍要避免把只存在 GPU 的状态当作唯一数据源。</p>
<p>安全上不要把不可信字符串直接拼进 GLSL。着色器应作为构建产物或受信任模板管理，用户数据通过属性、uniform 或纹理传入；否则既可能造成编译失败，也会把输入扩大为代码注入面。纹理和模型资源还要限制尺寸、格式和总显存，防止恶意资源造成拒绝服务。</p>
<h2>何时使用 Three.js 等高层库</h2>
<p>Three.js、Babylon.js 等库负责场景图、材质、资源加载和兼容性细节，适合产品开发和复杂交互；直接写 WebGL 适合学习管线、实现特殊渲染器或严格控制资源。使用高层库并不意味着不需要理解着色器：材质参数、颜色空间、透明排序、实例化和资源释放仍会影响结果。若只需要二维图表或简单动画，Canvas 2D 或 SVG 可能更易维护。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context">MDN · Getting started with shaders</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices">MDN · WebGL best practices</a></li>
<li><a href="https://registry.khronos.org/webgl/specs/latest/1.0/">Khronos · WebGL Specification</a></li>
<li><a href="https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html">WebGL Fundamentals · Shaders</a></li>
</ul>`};export{e as default};