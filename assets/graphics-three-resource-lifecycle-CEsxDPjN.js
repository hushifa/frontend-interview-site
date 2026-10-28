var e={answerHtml:`<p>产品详情页打开三维预览，关闭后删掉 canvas，再打开另一个商品。几次切换后内存越来越高：DOM 已移除，但动画循环仍在调用 render，几何体和纹理的 GPU 资源也没有释放。浏览器垃圾回收与 Three.js 资源生命周期不是一回事。</p>
<p>本文按 Three.js r180 官方资源释放说明编写。示例适用于安装对应版本 three 的浏览器模块项目，需要可用的 WebGL2；不是把题库网站改成三维应用，也不承诺所有设备都支持。</p>
<h2>移除、释放、断开引用分别解决什么</h2>
<p>scene.remove(mesh) 让对象不再参与该场景的遍历，但不会自动 dispose 它的 geometry、material 和 texture。因为这些对象可能被其他 mesh 共用，渲染器无法替业务决定是否还能使用。</p>
<p>geometry.dispose() 释放关联的 GPU 缓冲；material.dispose() 通知释放材质相关资源，但不会递归释放纹理。texture.dispose() 要单独调用。若纹理由 ImageBitmap 提供，还需在确定没有其他消费者时调用 bitmap.close() 释放相应 CPU 侧资源。</p>
<p>最后，JavaScript 数组、缓存、组件状态和闭包中的引用也应移除。dispose 并不意味着对象变量变成 null，更不意味着动画回调、ResizeObserver 或 DOM 监听器自动停止。</p>
<h2>一个独占资源的完整挂载例子</h2>
<p>假设容器由页面提供明确高度，例如 style=&quot;height: 320px&quot;。把函数放入浏览器模块，调用 <code>const cleanup = mountPreview(container)</code>，路由卸载时调用 cleanup。这个场景只有一个立方体，没有共享模型或外部资源，因而所有资源都由这次挂载独占。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> <span class="hljs-variable constant_">THREE</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;three&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">mountPreview</span>(<span class="hljs-params">container</span>) {
  <span class="hljs-keyword">const</span> renderer = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">WebGLRenderer</span>({ <span class="hljs-attr">antialias</span>: <span class="hljs-literal">true</span> });
  renderer.<span class="hljs-title function_">setPixelRatio</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-variable language_">window</span>.<span class="hljs-property">devicePixelRatio</span> || <span class="hljs-number">1</span>, <span class="hljs-number">2</span>));
  renderer.<span class="hljs-property">domElement</span>.<span class="hljs-property">style</span>.<span class="hljs-property">display</span> = <span class="hljs-string">&#x27;block&#x27;</span>;
  container.<span class="hljs-title function_">append</span>(renderer.<span class="hljs-property">domElement</span>);

  <span class="hljs-keyword">const</span> scene = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">Scene</span>();
  <span class="hljs-keyword">const</span> camera = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">PerspectiveCamera</span>(<span class="hljs-number">45</span>, <span class="hljs-number">1</span>, <span class="hljs-number">0.1</span>, <span class="hljs-number">100</span>);
  camera.<span class="hljs-property">position</span>.<span class="hljs-property">z</span> = <span class="hljs-number">4</span>;
  <span class="hljs-keyword">const</span> geometry = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">BoxGeometry</span>(<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-number">1</span>);
  <span class="hljs-keyword">const</span> material = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">MeshNormalMaterial</span>();
  <span class="hljs-keyword">const</span> cube = <span class="hljs-keyword">new</span> <span class="hljs-variable constant_">THREE</span>.<span class="hljs-title class_">Mesh</span>(geometry, material);
  scene.<span class="hljs-title function_">add</span>(cube);

  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">resize</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> width = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">1</span>, container.<span class="hljs-property">clientWidth</span>);
    <span class="hljs-keyword">const</span> height = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">1</span>, container.<span class="hljs-property">clientHeight</span>);
    renderer.<span class="hljs-title function_">setSize</span>(width, height);
    camera.<span class="hljs-property">aspect</span> = width / height;
    camera.<span class="hljs-title function_">updateProjectionMatrix</span>();
  }
  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(resize);
  observer.<span class="hljs-title function_">observe</span>(container);
  <span class="hljs-title function_">resize</span>();

  renderer.<span class="hljs-title function_">setAnimationLoop</span>(<span class="hljs-function">(<span class="hljs-params">time</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
    cube.<span class="hljs-property">rotation</span>.<span class="hljs-property">y</span> = time * <span class="hljs-number">0.0005</span>;
    renderer.<span class="hljs-title function_">render</span>(scene, camera);
  });

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">cleanup</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
    disposed = <span class="hljs-literal">true</span>;
    renderer.<span class="hljs-title function_">setAnimationLoop</span>(<span class="hljs-literal">null</span>);
    observer.<span class="hljs-title function_">disconnect</span>();
    scene.<span class="hljs-title function_">remove</span>(cube);
    geometry.<span class="hljs-title function_">dispose</span>();
    material.<span class="hljs-title function_">dispose</span>();
    renderer.<span class="hljs-title function_">dispose</span>();
    renderer.<span class="hljs-property">domElement</span>.<span class="hljs-title function_">remove</span>();
  };
}
</code></pre></div>
<p>顺序先停止生产新帧和回调，再释放被回调使用的资源。disposed 使重复清理安全，也保护已经排队的尺寸回调。宿主调用 cleanup 后还应删除保存它的引用，否则闭包仍保留相关 JavaScript 对象。</p>
<p>创建 WebGLRenderer 可能失败，宿主需捕获异常并显示静态产品图或说明。示例聚焦正常挂载后的资源生命周期，没有实现初始化中途异常的逐项回滚。实际组件若还创建控制器、后处理目标或加载器，应让每一步成功创建的资源都登记到清理范围。</p>
<h2>为什么不能遍历场景后无条件 dispose 所有东西</h2>
<p>两个商品可能共享同一张环境贴图，多个 mesh 可能共享一个材质。关闭 A 时直接 dispose 共享资源，会让仍在显示的 B 重新上传或编译资源，产生卡顿。更合理的方式是明确所有者：页面独占资源由页面清理，共享资源由资源管理层在最后一个消费者释放后处理。</p>
<p>同一个对象在遍历中出现多次，可以用 Set 去重；但 Set 只解决重复调用，不证明所有权。scene.environment、后处理 render target、控制器监听器和动画 mixer 也不一定包含在 mesh.material 的遍历路径里，要按所用类的文档分别管理。</p>
<h2>异步加载结束时页面可能已经离开</h2>
<p>用户切走后 glTF 请求仍可能完成。仅取消页面 render 不会让返回的模型自动释放。加载流程应记录所属页面或请求代次，完成时先检查是否仍被需要；过期结果不要加入场景，而应交给资源所有者释放。如果加载器支持取消就调用取消，但仍保留迟到结果检查。</p>
<p>不要声称所有 Three.js loader 都接受同一个 AbortSignal。文件、纹理与解码 Worker 的取消能力需逐一确认。对用户模型限制文件大小、纹理尺寸和解码资源，并控制外部资源来源；跨源加载与 CORS 也要由资源服务器配合。</p>
<h2>怎样判断修复有效</h2>
<p>固定同一个模型，重复挂载、渲染、卸载，观察 JS 堆快照及 renderer.info 中的几何体、纹理和程序统计。比较多轮操作后的稳定基线，不要求所有数字归零：Three.js 官方说明部分内部缓存会复用，并可能在场景清理后仍显示。</p>
<p>renderer.info 不是显存字节精确计量器。纹理尺寸、像素比和后处理目标都会增加实际资源成本；devicePixelRatio 翻倍可能使画布像素数约为四倍。真实 GPU、移动设备和上下文丢失行为需要另外验证，单元测试只能验证清理调用和生命周期协议。</p>
<p>静态预览可考虑按需渲染而不是永久动画循环；大量页面共享一个 renderer 时，页面卸载只释放页面拥有的资源，不能把宿主 renderer 一并销毁。选择策略应从资源所有权和实际交互出发。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://github.com/mrdoob/three.js/blob/r180/manual/en/how-to-dispose-of-objects.html">Three.js r180 · 资源释放说明</a></li>
<li><a href="https://threejs.org/docs/#WebGLRenderer">Three.js · WebGLRenderer</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap/close">MDN · ImageBitmap.close</a></li>
</ul>`};export{e as default};