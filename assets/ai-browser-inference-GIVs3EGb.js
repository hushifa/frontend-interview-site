var e={answerHtml:`<p>浏览器可以下载合适的模型与运行时，在本地执行文本、图像或音频等推理任务。ONNX Runtime Web 提供 WebAssembly、WebGPU 等执行方式；Transformers.js 则提供模型与任务接口。是否可用取决于具体模型、算子、运行时版本和设备能力。</p>
<p>浏览器端运行可能减少向云端发送原始输入的需求，但不代表应用自动具备完整隐私或离线保证。模型下载、遥测、外部资源以及其他业务请求仍需检查；离线使用还要求所需资源已可用，不能保证浏览器缓存永不被清理。</p>
<p>首次模型下载、内存、耗电和推理延迟都可能影响体验。应明确下载进度、失败提示和回退路径，并检查模型许可。适合小型模型或隐私敏感的局部任务，不应假定任意云端大模型都能原样搬到普通手机浏览器。</p>
<p>补充参考：<a href="https://raw.githubusercontent.com/huggingface/transformers.js/main/README.md">Transformers.js · 官方说明</a>。</p>`};export{e as default};