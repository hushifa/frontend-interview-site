var e={answerHtml:`<h2>简答</h2>
<ul>
<li>删除 canvas 不会停止 <code>setAnimationLoop</code>，也不会释放 GPU 资源，所以多次进出页面后内存持续上涨。</li>
<li><code>scene.remove(mesh)</code> 只让对象不再被渲染。<code>geometry.dispose()</code>、<code>material.dispose()</code>、<code>texture.dispose()</code> 要分别调用；<code>material.dispose()</code> 不会顺带释放它用到的纹理。</li>
<li>清理顺序：先停动画循环和监听，再释放资源，最后 <code>renderer.dispose()</code> 并移除 canvas。</li>
<li>多个对象共享的材质和纹理不能被某个页面直接释放，由资源管理层在最后一个使用者离开时释放。</li>
<li>验证方法：重复挂载、卸载多轮，观察 JS 堆和 <code>renderer.info</code> 是否回到稳定水平，不要求全部归零。</li>
</ul>
<h2>一个可清理的预览组件</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> <span class="hljs-variable constant_">THREE</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;three&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">mountPreview</span>(<span class="hljs-params">container</span>) {
  <span class="hljs-keyword">const</span> renderer = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">WebGLRenderer</span>({ <span class="hljs-attr">antialias</span>: <span class="hljs-literal">true</span> });
  renderer.<span class="hljs-title function_">setPixelRatio</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-variable language_">window</span>.<span class="hljs-property">devicePixelRatio</span>, <span class="hljs-number">2</span>));
  container.<span class="hljs-title function_">append</span>(renderer.<span class="hljs-property">domElement</span>);

  <span class="hljs-keyword">const</span> scene = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">Scene</span>();
  <span class="hljs-keyword">const</span> camera = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">PerspectiveCamera</span>(<span class="hljs-number">45</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0.1</span>, <span class="hljs-number">100</span>);
  camera.<span class="hljs-property">position</span>.<span class="hljs-property">z</span> = <span class="hljs-number">4</span>;

  <span class="hljs-keyword">const</span> geometry = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">BoxGeometry</span>(<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>);
  <span class="hljs-keyword">const</span> material = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">MeshNormalMaterial</span>();
  <span class="hljs-keyword">const</span> cube = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">Mesh</span>(geometry, material);
  scene.<span class="hljs-title function_">add</span>(cube);

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> width = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">1</span>, container.<span class="hljs-property">clientWidth</span>);
    <span class="hljs-keyword">const</span> height = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">1</span>, container.<span class="hljs-property">clientHeight</span>);
    renderer.<span class="hljs-title function_">setSize</span>(width, height);
    camera.<span class="hljs-property">aspect</span> = width / height;
    camera.<span class="hljs-title function_">updateProjectionMatrix</span>();
  });
  observer.<span class="hljs-title function_">observe</span>(container);

  renderer.<span class="hljs-title function_">setAnimationLoop</span>(<span class="hljs-function">(<span class="hljs-params">time</span>) =&gt;</span> {
    cube.<span class="hljs-property">rotation</span>.<span class="hljs-property">y</span> = time * <span class="hljs-number">0.0005</span>;
    renderer.<span class="hljs-title function_">render</span>(scene, camera);
  });

  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">cleanup</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
    disposed = <span class="hljs-literal">true</span>;
    renderer.<span class="hljs-title function_">setAnimationLoop</span>(<span class="hljs-literal">null</span>); <span class="hljs-comment">// 先停止产生新帧</span>
    observer.<span class="hljs-title function_">disconnect</span>();
    scene.<span class="hljs-title function_">remove</span>(cube);
    geometry.<span class="hljs-title function_">dispose</span>();
    material.<span class="hljs-title function_">dispose</span>();
    renderer.<span class="hljs-title function_">dispose</span>();
    renderer.<span class="hljs-property">domElement</span>.<span class="hljs-title function_">remove</span>();
  };
}
</code></pre></div>
<p>页面卸载时调用返回的 <code>cleanup</code>，之后丢掉对它的引用。如果还用了 OrbitControls、后处理、动画混合器，它们各自也有 <code>dispose()</code> 或需要移除的监听器。</p>
<h2>共享资源</h2>
<p>两个商品页可能共用同一张环境贴图。关闭 A 时直接释放它，B 就要重新上传纹理、出现卡顿。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>(); <span class="hljs-comment">// url -&gt; { texture, refs }</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">acquireTexture</span>(<span class="hljs-params">url, loader</span>) {
  <span class="hljs-keyword">let</span> entry = cache.<span class="hljs-title function_">get</span>(url);
  <span class="hljs-keyword">if</span> (!entry) {
    entry = { <span class="hljs-attr">texture</span>: loader.<span class="hljs-title function_">load</span>(url), <span class="hljs-attr">refs</span>: <span class="hljs-number">0</span> };
    cache.<span class="hljs-title function_">set</span>(url, entry);
  }
  entry.<span class="hljs-property">refs</span>++;
  <span class="hljs-keyword">return</span> entry.<span class="hljs-property">texture</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">releaseTexture</span>(<span class="hljs-params">url</span>) {
  <span class="hljs-keyword">const</span> entry = cache.<span class="hljs-title function_">get</span>(url);
  <span class="hljs-keyword">if</span> (entry &amp;&amp; --entry.<span class="hljs-property">refs</span> === <span class="hljs-number">0</span>) {
    entry.<span class="hljs-property">texture</span>.<span class="hljs-title function_">dispose</span>();
    cache.<span class="hljs-title function_">delete</span>(url);
  }
}
</code></pre></div>
<p><code>scene.environment</code>、后处理的渲染目标不在 mesh 的遍历路径里，要单独管理。</p>
<h2>异步加载</h2>
<p>用户离开页面后，glTF 请求仍可能完成。加载完成时先检查页面是否已经清理，已清理就直接释放返回的资源，不要加进场景。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">loader.<span class="hljs-title function_">load</span>(url, <span class="hljs-function">(<span class="hljs-params">gltf</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (disposed) {
    <span class="hljs-title function_">disposeObject</span>(gltf.<span class="hljs-property">scene</span>); <span class="hljs-comment">// 遍历并释放这份模型独占的资源</span>
    <span class="hljs-keyword">return</span>;
  }
  scene.<span class="hljs-title function_">add</span>(gltf.<span class="hljs-property">scene</span>);
});
</code></pre></div>
<h2>怎样确认修复有效</h2>
<ul>
<li>用同一个模型重复挂载、卸载十几轮，比较 JS 堆快照。</li>
<li>看 <code>renderer.info.memory</code> 里的 geometries、textures 数量是否稳定。Three.js 内部有缓存，部分数字不会归零。</li>
<li><code>renderer.info</code> 不是显存字节数。像素比翻倍，画布像素数约变为四倍，显存会明显增加。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>只显示静态模型，需要一直跑动画循环吗？</strong> 不需要。可以只在相机移动或模型变化时调用 <code>render()</code>，省电也省 GPU。</li>
<li><strong>多个页面共用一个 renderer 怎么办？</strong> 页面卸载时只释放自己的资源，renderer 由宿主管理，不要被某个页面销毁。</li>
</ul>`};export{e as default};