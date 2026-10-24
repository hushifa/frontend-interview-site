var e={answerHtml:`<p>总耗时包含模型下载、加载初始化、数据预处理、推理和结果后处理。首次运行与后续运行也可能不同。只看模型核心推理耗时，会漏掉下载、内存分配和 CPU/GPU 之间的数据复制成本。</p>
<p>Worker 可以把部分重计算移出主线程，提高界面响应，但不保证模型本身算得更快。WebGPU 是否更合适也取决于模型与设备，部分算子和特性存在支持限制。ONNX Runtime Web 的 WASM 多线程还依赖跨源隔离等环境条件。</p>
<p>量化可以降低部分模型的体积和资源需求，但实际速度与质量应按任务验证。工程上应选择合适模型、控制会话生命周期，并衡量缓存和数据传输开销。监测首个可用结果、完整任务时长、内存及交互响应，不用单一跑分替代用户体验。</p>
<p>补充参考：<a href="https://raw.githubusercontent.com/huggingface/transformers.js/main/README.md">Transformers.js · 官方说明</a>。</p>`};export{e as default};