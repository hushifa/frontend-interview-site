var e={answerHtml:`<p>PerformanceResourceTiming 提供单个资源的请求阶段、传输大小等信息。为避免泄露跨源信息，部分细节需要资源响应通过 Timing-Allow-Origin 授权后才能暴露；它与允许跨源读取响应内容的 CORS 用途不同。</p>
<p>在“Resource Timing 为什么有些跨源字段是零？”这个问题中，先固定设备、网络、数据量和指标，再只改一个变量比较前后结果；预加载、缓存和虚拟化都可能把成本转移到别的阶段。这里的 Resource Timing、TAO、资源大小 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>性能优化先固定场景和指标，再判断瓶颈属于网络、脚本、布局、绘制、内存还是交互延迟。优化前后要使用相同设备、网络和数据量比较，不能只看开发机上的一次耗时。</p>
<p>transferSize 表示传输大小，encodedBodySize 与 decodedBodySize 分别描述编码后与解码后的响应体大小。不能只看到某个字段为零就认定是缓存命中：隐私限制、资源类型及实际加载路径都需要一起考虑。</p>
<p>持续监测通常使用 PerformanceObserver，单次 getEntriesByType 只读取当时已有记录。还要注意资源时间线缓冲区和采样范围，避免把丢失记录当成没有请求。指标用于定位线索，最终仍需结合网络面板、响应头及实际缓存策略核实。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize">transferSize 的零值与缓存</a>。</p>
<p>每个优化都有成本：预加载会增加流量，缓存会增加失效复杂度，虚拟化会改变测量和无障碍行为。上线后还应观察真实用户数据，确认收益没有转移到另一个阶段。</p>
<p>实际优化时先记录基线，再只改一个变量。若首屏变快但首次展开、滚动或弱网体验变差，说明成本只是被推迟；最终要以用户完成任务的时间判断优化是否成立。</p>`};export{e as default};