var e={answerHtml:`<p>浏览器可以下载模型和运行时，在本地执行一部分文本、图像或音频推理。ONNX Runtime Web 可以使用 WebAssembly、WebGPU 等执行后端，Transformers.js 则提供模型加载和任务接口；但“浏览器能运行模型”不是一个笼统结论，必须同时看模型格式、算子支持、运行时版本和设备能力。</p>
<p>浏览器本地推理的主要收益是减少原始输入上传和部分服务端成本，代价是模型首次下载、内存、耗电和推理延迟都由用户设备承担。模型文件可能很大，手机在下载或推理时也可能被系统回收；因此界面要显示准备进度、失败原因和回退路径，不能在页面加载后长时间无反馈。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> session = <span class="hljs-keyword">await</span> <span class="hljs-title function_">createInferenceSession</span>(modelUrl, {
  <span class="hljs-attr">executionProviders</span>: [<span class="hljs-string">&#x27;webgpu&#x27;</span>, <span class="hljs-string">&#x27;wasm&#x27;</span>],
});
<span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> session.<span class="hljs-title function_">run</span>(input);
</code></pre></div>
<p>上面的代码只是说明执行后端的选择，实际 API 和算子支持要以所用运行时版本为准。WebGPU 不可用时可以回退到 WebAssembly，但速度、内存和支持的模型可能不同；不能把云端大模型原样搬到普通手机浏览器，也不能只在高性能开发机上判断体验。</p>
<p>本地推理也不自动等于隐私或离线。模型下载地址、遥测、页面中的其他请求和浏览器缓存都要单独检查；如果要支持离线，还要明确缓存策略和资源许可。模型许可同样属于发布条件，不能只看代码库是否开源。</p>
<p>模型输出仍是不可信数据。可以在浏览器本地完成分类、摘要或局部识别，但涉及权限、工具调用、敏感数据保存和不可逆操作时，最终校验与授权仍应留在受控服务端。</p>`};export{e as default};