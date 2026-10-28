var e={answerHtml:`<h2>简答</h2>
<ul>
<li>WebAssembly（Wasm）是紧凑的二进制格式，由浏览器编译成机器码执行，性能稳定，适合大量数值计算。</li>
<li>它运行在和 JavaScript 相同的沙箱里，遵守同样的安全限制。</li>
<li>Wasm 不能直接访问 DOM 和大多数 Web API，需要通过 JavaScript 胶水代码调用。</li>
<li>适合：图像和视频处理、音频编解码、压缩、加密、游戏引擎、CAD、把已有的 C++ 或 Rust 库移植到网页。</li>
<li>不适合：普通的界面逻辑和频繁操作 DOM 的代码，跨边界调用和数据复制的开销会抵消收益。</li>
</ul>
<h2>加载</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { instance } = <span class="hljs-keyword">await</span> <span class="hljs-title class_">WebAssembly</span>.<span class="hljs-title function_">instantiateStreaming</span>(<span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/image.wasm&#x27;</span>), {
  <span class="hljs-attr">env</span>: { <span class="hljs-attr">log</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value) },
});

<span class="hljs-keyword">const</span> result = instance.<span class="hljs-property">exports</span>.<span class="hljs-title function_">blur</span>(ptr, width, height);
</code></pre></div>
<ul>
<li><code>instantiateStreaming</code> 边下载边编译，服务端要返回 <code>Content-Type: application/wasm</code>。</li>
<li>第二个参数是导入对象，Wasm 通过它调用 JavaScript 提供的函数。</li>
</ul>
<h2>数据传递</h2>
<p>Wasm 函数参数只能是数字。传图片这类数据时：</p>
<ol>
<li>Wasm 暴露一块线性内存（<code>WebAssembly.Memory</code>），JavaScript 用 <code>Uint8Array</code> 视图写入。</li>
<li>把数据所在的偏移量（指针）和长度作为数字传给 Wasm 函数。</li>
<li>Wasm 在内存中处理完，JavaScript 再从内存读出结果。</li>
</ol>
<p>所以收益来自&quot;一次传入大量数据、在 Wasm 里做很多计算&quot;，而不是频繁调用小函数。Rust 的 <code>wasm-bindgen</code>、C++ 的 Emscripten 会生成这些胶水代码。</p>
<h2>和 Worker 一起使用</h2>
<p>Wasm 默认在主线程执行，长时间计算同样会卡住页面。重计算应放到 Web Worker 中运行；多线程 Wasm 依赖 <code>SharedArrayBuffer</code>，需要页面处于跨源隔离状态。</p>
<h2>常见追问</h2>
<ul>
<li>Wasm 一定比 JavaScript 快吗：不一定。JIT 优化后的 JavaScript 在很多场景已经很快，Wasm 的优势在启动后的性能稳定和无需 GC 的数值计算。</li>
<li>WasmGC：让 Kotlin、Dart 等带垃圾回收的语言可以编译到 Wasm 而不用自带 GC，主流浏览器已支持。</li>
</ul>`};export{e as default};