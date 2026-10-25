var e={answerHtml:`<p>PerformanceResourceTiming 记录图片、脚本、样式和 fetch 等资源的加载信息。页面能加载某个跨源资源，不代表浏览器愿意把它的所有网络细节交给页面脚本，否则可能泄露其他来源的缓存状态和请求行为。</p>
<p>因此，一些跨源条目虽然有 name、startTime、duration 等信息，DNS、连接、请求开始和响应开始等受保护字段却可能是 0。这不一定是资源没有经过这些阶段，而可能是细节未获授权。</p>
<h3>Timing-Allow-Origin 与 CORS 不是同一个开关</h3>
<p>资源服务器可以在响应中声明：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Timing-Allow-Origin: https://app.example.com
</code></pre></div>
<p>它允许指定页面来源读取受保护的计时细节。适合公开暴露计时的资源也可以按需求使用星号，但应考虑隐私影响和具体资源性质。</p>
<p>Access-Control-Allow-Origin 主要控制跨源响应是否可被脚本读取；Timing-Allow-Origin 控制性能细节的暴露。图片可能不用 CORS 就能显示，却缺少完整 Timing；fetch 可能已经通过 CORS，也仍需要 TAO 才能读取相应计时字段。</p>
<p>跨源重定向链还可能影响哪些信息可见，不能只检查最终文件的一个响应头就断言所有阶段都应该暴露。</p>
<h3>三种大小字段分别量什么</h3>
<table><thead><tr><th>字段</th><th>主要含义</th></tr></thead><tbody><tr><td>transferSize</td><td>获取资源时记录的传输大小，包含相应响应头开销和编码后的响应体</td></tr><tr><td>encodedBodySize</td><td>移除内容编码前的响应体大小，例如 gzip 压缩后的体积</td></tr><tr><td>decodedBodySize</td><td>移除内容编码后的响应体大小</td></tr></tbody></table>
<p>decodedBodySize 不是 JavaScript 执行后的堆内存，也不是图片解码后的像素内存。一个几十 KB 的压缩脚本，执行后可能创建大量对象，这些不能从该字段直接推算。</p>
<p>当 transferSize 为 0，而 decodedBodySize 大于 0 且字段可见时，通常可以作为本地缓存命中的线索。但跨源隐私限制也可能让多个字段都为 0，所以不能写成 <code>transferSize === 0</code> 就一定命中缓存。</p>
<p>缓存重验证也不等于完全没有网络流量：304 等路径可能只传输少量响应信息，却复用缓存中的主体。Service Worker、缓存策略和浏览器实现还会影响数据解释，最终应结合网络面板核对。</p>
<h3>持续监听，而不是只读取一次快照</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeResourceTiming</span>(<span class="hljs-params">onEntry</span>) {
  <span class="hljs-keyword">if</span> (
    <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">PerformanceObserver</span> === <span class="hljs-string">&#x27;undefined&#x27;</span> ||
    !<span class="hljs-title class_">PerformanceObserver</span>.<span class="hljs-property">supportedEntryTypes</span>.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;resource&#x27;</span>)
  ) {
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  }

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
      <span class="hljs-title function_">onEntry</span>({
        <span class="hljs-attr">name</span>: entry.<span class="hljs-property">name</span>,
        <span class="hljs-attr">initiatorType</span>: entry.<span class="hljs-property">initiatorType</span>,
        <span class="hljs-attr">duration</span>: entry.<span class="hljs-property">duration</span>,
        <span class="hljs-attr">transferSize</span>: entry.<span class="hljs-property">transferSize</span>,
        <span class="hljs-attr">encodedBodySize</span>: entry.<span class="hljs-property">encodedBodySize</span>,
        <span class="hljs-attr">decodedBodySize</span>: entry.<span class="hljs-property">decodedBodySize</span>,
      });
    }
  });
  observer.<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;resource&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>getEntriesByType(&#x27;resource&#x27;) 只读取当时已有记录，后续点击才发起的请求不会自动追加到你保存的数组。Observer 可以收到新条目，buffered 还可以取得相应缓冲中已有的记录。</p>
<p>缓冲不是无限的，已经丢失的历史记录不会因 buffered 恢复。长页面应尽早订阅，并根据需要管理资源时间线容量和 resource timing buffer full 事件；上报本身也要做采样、批量和限流，不能在回调里执行大量同步工作。</p>
<h3>资源结束不代表功能完成</h3>
<p>脚本的请求 duration 不包含它后续全部解析、编译和执行成本；图片下载结束也不等于已经完成解码和绘制；fetch 的网络结束不代表页面已完成 JSON 处理与状态更新。</p>
<p>例如首次展开用了两秒，而答案文件只下载了 100 毫秒，应继续检查后续依赖加载、解析与渲染。反过来，只有一条很慢的资源记录，也要确认它是否真的在用户任务的关键路径上。</p>
<p>资源 URL 可能包含查询参数、访问令牌或用户标识，示例返回 name 是为了本地分析。生产上报前应做白名单、去查询参数或必要脱敏，不能把所有完整 URL 直接发送到监控平台。</p>
<p>使用这些记录时要区分“真实为零”“连接复用”“缓存”“尚不可见”和“记录缺失”。指标提供线索，可靠结论需要实际响应头、缓存路径及页面行为共同支持。</p>`};export{e as default};