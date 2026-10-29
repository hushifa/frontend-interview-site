var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>不能替代，它们是配合关系。WebAssembly（简称 Wasm）是一种紧凑的二进制格式，浏览器把它编译成机器码执行，性能稳定，适合大量数值计算。它和 JavaScript 跑在同一个沙箱里，安全限制也一样。</p>
<p>它的短板是不能直接访问 DOM 和大多数 Web API，要通过 JavaScript 胶水代码去调用。而且 JavaScript 和 Wasm 之间互相调用、复制数据都有开销。</p>
<p>所以它适合“计算重、和页面交互少”的活：图像视频处理、音频编解码、压缩、加密、游戏引擎、CAD，以及把现成的 C++ 或 Rust 库移植到网页。普通界面逻辑、频繁操作 DOM 的代码不适合，跨边界的开销会把收益吃掉。</p>
<p>还要注意，Wasm 默认也在主线程跑，长时间计算一样会卡页面，要放进 Worker。它也不一定比 JavaScript 快。</p>
</blockquote>
<h2>加载一个 Wasm 模块</h2>
<p>下面加载一个图片处理模块，并给它提供一个打印日志的函数。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { instance } = <span class="hljs-keyword">await</span> <span class="hljs-title class_">WebAssembly</span>.<span class="hljs-title function_">instantiateStreaming</span>(<span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/image.wasm&#x27;</span>), {
  <span class="hljs-attr">env</span>: { <span class="hljs-attr">log</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value) },
});

<span class="hljs-keyword">const</span> result = instance.<span class="hljs-property">exports</span>.<span class="hljs-title function_">blur</span>(ptr, width, height);
</code></pre></div>
<p><code>instantiateStreaming</code> 边下载边编译，不用等整个文件下完。但服务端要返回 <code>Content-Type: application/wasm</code>，否则会失败。</p>
<p>第二个参数叫导入对象，是 JavaScript 交给 Wasm 的函数。Wasm 自己调不了 <code>console.log</code>，要通过这里的 <code>env.log</code> 调回 JavaScript。反过来，Wasm 导出的函数在 <code>instance.exports</code> 上。</p>
<h2>一张图片怎么传给 Wasm</h2>
<p>Wasm 函数的参数和返回值以数值为主：<code>i32</code>、<code>f32</code>、<code>f64</code> 对应 JavaScript 的 Number，<code>i64</code> 对应 BigInt。<code>externref</code> 可以原样传递 JavaScript 引用，但 Wasm 读不了它内部的结构。所以没法把一个图片对象直接塞进去。</p>
<p>做法是共用一块内存。这块内存叫线性内存（<code>WebAssembly.Memory</code>），可以理解成一个大字节数组：</p>
<ol>
<li>JavaScript 用 <code>Uint8Array</code> 视图把图片像素写进这块内存。</li>
<li>把数据所在的位置（偏移量，也就是指针）和长度，作为数字传给 Wasm 函数。</li>
<li>Wasm 在内存里处理完，JavaScript 再从同一块内存里读出结果。</li>
</ol>
<p>所以收益来自“一次传进大量数据，在 Wasm 里做很多计算”。如果频繁调用小函数，每次都要跨边界，开销反而大。这些胶水代码一般不用手写，Rust 的 <code>wasm-bindgen</code>、C++ 的 Emscripten 会自动生成。</p>
<h2>为什么还要配合 Worker</h2>
<p>Wasm 默认在主线程执行。一段计算跑 2 秒，页面就卡 2 秒，和 JavaScript 没区别。所以重计算要放到 Web Worker 里。</p>
<p>多线程 Wasm 依赖 <code>SharedArrayBuffer</code>，这要求页面处于跨源隔离状态。</p>
<h2>常见追问</h2>
<p><strong>Wasm 一定比 JavaScript 快吗？</strong></p>
<blockquote>
<p>不一定。JIT 优化后的 JavaScript 在很多场景已经很快了。Wasm 的优势在于性能稳定，不用等 JIT 预热，以及不需要 GC 的数值计算。</p>
</blockquote>
<p><strong>WasmGC 是什么？</strong></p>
<blockquote>
<p>它让 Kotlin、Dart 这类带垃圾回收的语言能编译成 Wasm，直接用浏览器的垃圾回收，不用把自己的 GC 打包进去。主流浏览器已经支持。</p>
</blockquote>`};export{e as default};