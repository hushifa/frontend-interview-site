var e={answerHtml:`<p>WebAssembly 是面向可移植执行的模块格式与运行模型，可以把编译型语言实现的计算逻辑带到浏览器等宿主中。它更常与 JavaScript 协作：JavaScript 负责页面与宿主 API，Wasm 负责适合的计算或已有库。</p>
<p>“能编译为 Wasm”不等于“比 JavaScript 快”，更不等于它自动拥有 DOM、网络和本地文件权限。</p>
<h3>模块通过导入与导出连接宿主</h3>
<p>编译后的模块声明自己需要的 import，以及可供调用的 export。实例化时，JavaScript 提供匹配的宿主函数、内存或其他依赖，之后通过 instance.exports 访问公开能力。</p>
<p>一个常见加载方式是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadModule</span>(<span class="hljs-params">url, imports = {}</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url);
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`Wasm 加载失败：<span class="hljs-subst">\${response.status}</span>\`</span>);
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> <span class="hljs-title class_">WebAssembly</span>.<span class="hljs-title function_">instantiateStreaming</span>(response, imports);
  <span class="hljs-keyword">return</span> result.<span class="hljs-property">instance</span>.<span class="hljs-property">exports</span>;
}
</code></pre></div>
<p>服务器应返回正确的 application/wasm MIME 类型，并满足跨源与 CSP 等部署要求。示例不包含实际 .wasm 文件；导出函数名和参数必须与编译产物一致。</p>
<p>instantiateStreaming 可以在获取数据时进行相应编译处理；若环境或响应类型不适合，可以选择先 arrayBuffer 再 instantiate 的路径，但不应把所有编译或链接错误都吞掉后盲目重试另一种加载方式。</p>
<p>CompileError、LinkError 和 RuntimeError 分别可能指向模块编译、导入链接或运行阶段问题，诊断时应区分，而不是统一提示网络失败。</p>
<h3>字符串和数组跨边界不是免费传递</h3>
<p>常见工具链通过线性内存表示字节、字符串和结构体，JavaScript 使用 TypedArray 读写指定范围，再把地址和长度等信息交给导出函数。</p>
<p>这需要明确编码、布局、对齐和所有权。调用完由谁释放内存，返回指针能保留多久，模块重新分配或增长内存后视图是否仍可用，都应遵循工具链契约。</p>
<p>内存增长可能使原有 ArrayBuffer 视图失效或无法覆盖新范围，应按实际内存模型重新获取视图，不能永久缓存一个 TypedArray 并假设永远正确。更现代的引用类型和工具链可以提供其他互操作能力，但并不意味着所有 JavaScript 对象都能无成本直接共享。</p>
<h3>适合的是足够集中的计算</h3>
<p>图像处理、音视频编解码、压缩、科学计算和已有 C/C++/Rust 库复用，常有明确收益。它们可能在一次调用中完成大量工作，摊薄边界调用和数据复制成本。</p>
<p>如果每处理一个像素就从 JavaScript 调一次 Wasm，再回调 JavaScript 更新一个 DOM 节点，边界往返可能反而昂贵。应尽量批量处理数据，并把输出集中提交给页面。</p>
<p>小型业务判断、DOM 密集交互或已有优化良好的 JavaScript 不一定值得迁移。模块下载、编译、初始化与胶水代码体积也会影响首屏，不能只测热运行的内核耗时。</p>
<h3>Wasm 不自动解决主线程卡顿</h3>
<p>主线程同步调用一个很慢的 Wasm 导出函数，仍然会阻塞主线程。需要隔离耗时计算时，可以把模块放到 Worker，并设计消息、数据转移与取消边界。</p>
<p>线程、SIMD 等能力有各自支持与环境要求。浏览器共享内存相关能力通常还涉及跨源隔离，不是所有服务器部署都能直接使用同一构建产物。</p>
<p>Wasm 运行在宿主提供的安全模型内，不能直接任意扫描用户磁盘。WASI 等接口也不是浏览器默认自动提供的完整操作系统，使用它们需要相应宿主或适配实现。</p>
<h3>选型要包含维护与失败成本</h3>
<p>除了速度，还要评估编译工具链、调试符号、依赖升级、内存问题、错误传播和目标浏览器覆盖。Wasm 不会自动消除源程序里的业务漏洞或资源耗尽风险。</p>
<p>通常让 JavaScript 保持清晰的宿主边界，把真正需要的计算模块化，并准备不支持或加载失败时的合理路径。以真实任务的端到端时间和维护成本决定是否采用，而不是把它当成替换整个前端的语言竞赛。</p>`};export{e as default};