var e={notesHtml:`<p>在浏览器或 Worker 中运行 ONNX 模型，支持 WebAssembly、WebGPU 等执行后端。</p>
<p>模型算子、量化方式、设备内存和数据传输都会影响速度，WebGPU 后端不一定比 WebAssembly 快。上线前分别测量模型下载、初始化和单次推理耗时，并为不支持的设备准备回退。</p>
<p>许可：MIT。</p>`};export{e as default};