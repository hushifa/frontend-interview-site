var e={answerHtml:`<p>浏览器可以在用户设备上执行合适的文本、图像和音频模型，例如分类、向量生成、部分语音识别或小型生成模型。但“模型能下载”与“能在目标浏览器稳定推理”是不同条件。</p>
<p>需要同时匹配模型格式、算子、精度、运行时后端、设备内存和输入规模。不能把任意云端大模型文件原样放进网页，就期待普通手机获得相同体验。</p>
<h3>运行时负责执行，模型与前后处理仍需匹配</h3>
<p>ONNX Runtime Web 可以执行受支持的 ONNX 模型，Transformers.js 等库提供更多任务、分词器与模型加载集成。选择哪一层，取决于是否需要自己管理张量、输入编码和后处理。</p>
<p>ONNX Runtime Web 使用 InferenceSession.create 创建会话；这是运行时提供的接口，不是浏览器内置 API：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> ort <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;onnxruntime-web&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createModelSession</span>(<span class="hljs-params">modelUrl</span>) {
  <span class="hljs-keyword">return</span> ort.<span class="hljs-property">InferenceSession</span>.<span class="hljs-title function_">create</span>(modelUrl, {
    <span class="hljs-attr">executionProviders</span>: [<span class="hljs-string">&#x27;wasm&#x27;</span>],
  });
}
</code></pre></div>
<p>这是初始化示例，modelUrl 必须指向兼容模型，运行时所需 WASM 文件也要正确部署。之后调用 session.run(feeds)，feeds 的键、张量类型和维度必须与模型输入一致，不能把任意字符串或图片对象直接传进去。</p>
<p>文本通常要经过对应 tokenizer，图像需要按模型要求处理通道顺序、尺寸、数值范围和归一化。输出也可能是 logits、向量或其他张量，需要任务特定解释，不能一律当成最终答案文字。</p>
<h3>WebGPU 与 WASM 不是无条件互换</h3>
<p>使用 WebGPU 要采用对应运行时入口和后端配置，并检查浏览器与适配器能力。API 存在也不保证模型所有算子、精度和形状都能在该后端执行。</p>
<p>WASM 可以作为部分场景的 CPU 路径，但模型兼容性、速度和内存表现可能不同。应实际测试回退模型与运行方式，不能只列一个后端数组就承诺任何失败都能无缝切换。</p>
<p>浏览器内置 AI 能力则可能由平台管理模型与下载，有自己的可用性和 API 约定，也不能与应用自行加载的模型混成一种统一接口。</p>
<h3>首次准备往往比单次推理更显眼</h3>
<p>模型可能包含很大的权重与附属资源，用户要经历下载、缓存、初始化和首次运行。界面应区分这些阶段，显示合理进度与取消入口，而不是长时间保持一个“正在思考”。</p>
<p>会话通常应复用，避免每次输入重新下载和初始化；但应用也要限制同时加载的模型数量，并在不再使用时释放会话、张量和相关资源。</p>
<p>低内存手机可能在加载阶段失败，后台页面也可能被系统回收。需要提供较小模型、云端路径或明确的不支持提示，而不是只在开发机上跑一次就判断可用。</p>
<h3>本地推理不自动等于离线与隐私保证</h3>
<p>输入可以不上传到模型服务，这是潜在优势；但页面遥测、日志、远程图片和其他请求仍可能发送数据。模型下载源也会收到网络请求，必须审查整条数据路径。</p>
<p>离线使用需要模型、运行时和必要资源已缓存，且缓存未被清理。浏览器配额与回收规则仍然存在，不能把一次缓存成功当作永久离线可用。</p>
<p>模型权重与代码可能使用不同许可证，发布前应核对用途与再分发条件。代码库免费开源不代表所有模型都允许相同使用方式。</p>
<p>本地模型输出仍可能错误或包含恶意引用内容。涉及真实账户、工具执行和高风险写操作时，应保留独立的权限与校验边界，不能因为推理在用户机器上就直接信任结果。</p>`};export{e as default};