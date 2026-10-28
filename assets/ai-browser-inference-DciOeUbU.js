var e={answerHtml:`<h2>简答</h2>
<ul>
<li>浏览器可以运行适合设备的小模型，但模型格式、算子、精度、后端和内存必须同时满足。</li>
<li>运行时、tokenizer 和前后处理要配套，输入输出契约必须一致。</li>
<li>WebGPU 和 WASM 是不同的执行路径，前者吞吐可能更高，后者兼容性更广。</li>
<li>首次加载通常是最长的等待；本地推理不自动等于离线或绝对隐私。</li>
</ul>
<h2>先判断模型是否适合设备</h2>
<p>浏览器可以运行分类、向量生成、部分语音识别和小型生成模型，但“文件能下载”不等于“目标设备能稳定推理”。模型格式、算子、精度、运行时后端、显存/内存和输入大小必须同时满足。</p>
<p>云端大模型的权重、上下文和服务端工具不能原样搬进普通手机。浏览器端更适合隐私敏感的小任务、离线辅助和低延迟预处理，复杂推理仍可能需要云端或混合方案。</p>
<h2>运行时、模型和前后处理必须配套</h2>
<p>ONNX Runtime Web 等运行时负责执行兼容的模型；Transformers.js 等库还封装了任务、tokenizer 和模型加载。无论使用哪一层，输入输出契约都必须匹配：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> ort <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;onnxruntime-web&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createSession</span>(<span class="hljs-params">modelUrl</span>) {
  <span class="hljs-keyword">return</span> ort.<span class="hljs-property">InferenceSession</span>.<span class="hljs-title function_">create</span>(modelUrl, {
    <span class="hljs-attr">executionProviders</span>: [<span class="hljs-string">&#x27;wasm&#x27;</span>],
  });
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">classify</span>(<span class="hljs-params">session, pixels</span>) {
  <span class="hljs-keyword">const</span> input = <span class="hljs-keyword">new</span> ort.<span class="hljs-title class_">Tensor</span>(<span class="hljs-string">&#x27;float32&#x27;</span>, pixels, [<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-number">224</span>, <span class="hljs-number">224</span>]);
  <span class="hljs-keyword">const</span> outputs = <span class="hljs-keyword">await</span> session.<span class="hljs-title function_">run</span>({ <span class="hljs-attr">images</span>: input });
  <span class="hljs-keyword">return</span> outputs.<span class="hljs-property">logits</span>;
}
</code></pre></div>
<p>示例中的输入名、类型、尺寸和预处理都来自具体模型，不能把字符串、图片对象或任意数组直接传进去。文本需要对应 tokenizer；图像要处理通道顺序、尺寸、归一化；输出可能是 logits、向量或 token，需要按任务解释，不能统一当成答案文本。</p>
<h2>WebGPU 和 WASM 是不同执行路径</h2>
<p>WebGPU 可能提供更高吞吐，但要求浏览器、适配器、设备、算子和精度都支持。WASM 是 CPU 路径，兼容性可能更广，却不一定在大模型上更快。某些算子会回退到 CPU，频繁在 CPU 和 GPU 之间读回也可能抵消优势。</p>
<p>不要因为 <code>navigator.gpu</code> 存在就承诺模型可用，也不要把一个后端失败简单替换成另一个就认为语义和性能相同。能力检测应结合真实模型样本、设备内存、初始化时间和推理质量。</p>
<h2>首次加载通常是最大等待</h2>
<p>模型权重和 tokenizer 可能很大，用户要经历下载、缓存、运行时初始化和首次编译。界面应区分下载、准备、推理、失败和取消，不能一直显示“正在思考”。会话通常应复用，避免每次输入重新初始化；同时限制同时加载的模型数量，释放不再使用的 session、张量和 Worker 资源。</p>
<p>低内存手机可能在加载阶段失败，后台页面也可能被系统回收。应提供小模型、云端路径或明确不支持提示，而不是只在高端开发机上测一次。</p>
<h2>本地推理不自动等于离线和隐私</h2>
<p>输入不上传模型服务是一个潜在优势，但遥测、远程图片、模型下载源和其他接口仍可能产生网络请求。真正离线需要模型、运行时和所有资源都已缓存；浏览器配额和回收仍可能让下次启动重新下载。</p>
<p>模型权重与运行时代码还要分别核对许可证和再分发条件。开源库免费不代表模型可以任意商用。模型输出也可能错误、包含恶意链接或建议，涉及账户、工具和高风险写操作时仍要由独立权限与业务校验把关。</p>
<p>验收应覆盖目标浏览器、设备内存、首次下载、缓存清理、后台恢复、WASM 回退、WebGPU 失败和输入异常，并同时观察质量、延迟、耗电和包体积。</p>`};export{e as default};