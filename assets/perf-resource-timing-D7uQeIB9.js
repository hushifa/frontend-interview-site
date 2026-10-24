var e={answerHtml:`<p>PerformanceResourceTiming 提供单个资源的请求阶段、传输大小等信息。为避免泄露跨源信息，部分细节需要资源响应通过 Timing-Allow-Origin 授权后才能暴露；它与允许跨源读取响应内容的 CORS 用途不同。</p>
<p>transferSize 表示传输大小，encodedBodySize 与 decodedBodySize 分别描述编码后与解码后的响应体大小。不能只看到某个字段为零就认定是缓存命中：隐私限制、资源类型及实际加载路径都需要一起考虑。</p>
<p>持续监测通常使用 PerformanceObserver，单次 getEntriesByType 只读取当时已有记录。还要注意资源时间线缓冲区和采样范围，避免把丢失记录当成没有请求。指标用于定位线索，最终仍需结合网络面板、响应头及实际缓存策略核实。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize">transferSize 的零值与缓存</a>。</p>
<h3>复习提示</h3>
<p>回答时先定义用户感知指标和测量场景，再定位网络、脚本、布局、绘制或内存中的瓶颈。优化前后要使用同一条件对比，避免把单次开发机结果当成真实用户结论。建议用一个最小示例验证“Resource Timing、TAO、资源大小”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};