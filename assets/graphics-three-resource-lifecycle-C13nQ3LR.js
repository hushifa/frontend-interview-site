var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 3D 预览页，进进出出几次，内存就一直涨。原因是删掉 canvas 并不会停掉 <code>setAnimationLoop</code>，也不会释放 GPU 上的资源，它们都还活着。</p>
<p><code>scene.remove(mesh)</code> 也只是让这个对象不再被画出来。几何体、材质、纹理要分别调用 <code>geometry.dispose()</code>、<code>material.dispose()</code>、<code>texture.dispose()</code>。而且 <code>material.dispose()</code> 不会顺带释放它用到的纹理。</p>
<p>清理要按顺序来：先停动画循环和监听，再释放资源，最后 <code>renderer.dispose()</code> 并移除 canvas。</p>
<p>要注意共享的资源。多个对象共用的材质和纹理，不能被某一个页面直接释放，要由资源管理层在最后一个使用者离开时再释放。修完以后，重复挂载、卸载几轮，看 JS 堆和 <code>renderer.info</code> 能不能回到稳定水平，不要求全部归零。</p>
</blockquote>
<h2>写一个能清理干净的预览组件</h2>
<p>下面的函数挂载一个旋转的立方体，并返回一个 <code>cleanup</code> 函数。重点看 <code>cleanup</code> 里的顺序。</p>
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
<p>为什么要先停动画循环？因为循环每一帧都在用这些资源。先释放资源、循环还在跑，下一帧可能又把资源用上，或者访问已经释放的东西。</p>
<p><code>disposed</code> 标记保证 <code>cleanup</code> 调多次也只清理一次。页面卸载时调用 <code>cleanup</code>，之后把对它的引用也丢掉。</p>
<p>如果还用了 OrbitControls、后处理、动画混合器，它们各自也有 <code>dispose()</code>，或者有需要移除的监听器，要一起清理。</p>
<h2>共享的资源怎么释放</h2>
<p>两个商品页可能共用同一张环境贴图。关掉 A 页时如果直接把它释放了，B 页就得重新上传这张纹理，画面会卡一下。</p>
<p>所以共享资源要用引用计数来管：谁要用就加一，谁不用就减一，减到 0 才真正释放。</p>
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
<p>还有一些资源不在 mesh 的遍历路径里，比如 <code>scene.environment</code>、后处理用的渲染目标。遍历场景释放时找不到它们，要单独管理。</p>
<h2>页面都关了，模型才加载完怎么办</h2>
<p>用户离开页面以后，glTF 的请求还可能完成，回调照样会执行。所以加载完成时，先看页面是不是已经清理过了。已经清理了，就直接释放刚返回的资源，不要再加进场景：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">loader.<span class="hljs-title function_">load</span>(url, <span class="hljs-function">(<span class="hljs-params">gltf</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (disposed) {
    <span class="hljs-title function_">disposeObject</span>(gltf.<span class="hljs-property">scene</span>); <span class="hljs-comment">// 遍历并释放这份模型独占的资源</span>
    <span class="hljs-keyword">return</span>;
  }
  scene.<span class="hljs-title function_">add</span>(gltf.<span class="hljs-property">scene</span>);
});
</code></pre></div>
<h2>怎样确认真的修好了</h2>
<p>用同一个模型重复挂载、卸载十几轮，对比前后的 JS 堆快照。</p>
<p>再看 <code>renderer.info.memory</code> 里 geometries、textures 的数量是否稳定。Three.js 内部有缓存，所以有些数字不会归零，只要不随轮数增长就行。</p>
<p>要注意，<code>renderer.info</code> 给的不是显存的字节数。像素比翻倍时，画布的像素数大约变成四倍，显存会明显增加，这在 <code>renderer.info</code> 里是看不出来的。</p>
<h2>常见追问</h2>
<p><strong>只显示静态模型，需要一直跑动画循环吗？</strong></p>
<blockquote>
<p>不需要。可以只在相机移动或模型变化时调用一次 <code>render()</code>，这样省电，也省 GPU。</p>
</blockquote>
<p><strong>多个页面共用一个 renderer 怎么办？</strong></p>
<blockquote>
<p>页面卸载时只释放自己的资源。renderer 由宿主来管理，不能被某个页面销毁。</p>
</blockquote>`};export{e as default};