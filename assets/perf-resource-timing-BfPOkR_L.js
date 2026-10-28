var e={answerHtml:`<h2>简答</h2>
<ul>
<li>跨源资源默认不暴露详细时序和大小，需要服务器返回 Timing-Allow-Origin。</li>
<li>TAO 控制性能信息的可见性，CORS 控制响应内容的可读性，两者不同。</li>
<li>transferSize 为 0 表示本地缓存命中或跨源未授权，连接复用只影响连接阶段字段。</li>
<li>要尽早建立观察器，上报前对 URL 脱敏。</li>
</ul>
<h2>能加载不等于能读取网络细节</h2>
<p>页面可以显示跨源图片、执行跨源脚本，但如果脚本能随意读取对方的 DNS、连接和响应时间，就可能推断其他站点的缓存状态和用户访问情况。因此浏览器会隐藏部分跨源 Resource Timing 字段。</p>
<p>一个条目可能仍有 <code>name</code>、<code>startTime</code> 和 <code>duration</code>，但 DNS、连接、请求开始和首字节时间为 0。这不一定表示请求没有经历这些阶段，也可能是跨源细节没有获得授权。</p>
<h2>TAO 和 CORS 解决不同问题</h2>
<p>资源服务器可以返回：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Timing-Allow-Origin: https://app.example.com
</code></pre></div>
<p>它控制页面能否读取受保护的性能细节。<code>Access-Control-Allow-Origin</code> 则主要控制跨源响应内容能否被脚本读取。图片不需要 CORS 也可能显示，但仍没有完整 Timing；fetch 通过了 CORS，也不代表所有计时字段自动开放。</p>
<p>跨源重定向链还可能影响可见字段，不能只检查最终文件的一个响应头就断定整个请求都可测。是否使用 <code>*</code> 要结合资源是否公开、是否涉及敏感路径和监控需求决定。</p>
<h2>大小字段不代表同一种成本</h2>
<table><thead><tr><th>字段</th><th>含义</th></tr></thead><tbody><tr><td><code>transferSize</code></td><td>这次获取的响应头和编码后响应体传输量</td></tr><tr><td><code>encodedBodySize</code></td><td>编码后的响应体大小，例如压缩后的体积</td></tr><tr><td><code>decodedBodySize</code></td><td>解码后的响应体大小</td></tr></tbody></table>
<p><code>decodedBodySize</code> 不是脚本执行后的堆内存，也不是图片解码后的像素内存。几十 KB 的脚本可能在执行时创建大量对象；这些成本要通过其他工具和指标观察。</p>
<p><code>transferSize === 0</code> 通常表示资源来自本地缓存，或跨源资源没有 Timing-Allow-Origin 授权；连接复用只会让 DNS 和连接阶段的耗时为 0，不会让传输大小变成 0。304 重验证仍可能有网络流量，Service Worker 和缓存策略也会改变解释，不能写成“0 就是命中缓存”。</p>
<h2>观察器应尽早建立并限制上报</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeResources</span>(<span class="hljs-params">onResource</span>) {
  <span class="hljs-keyword">if</span> (
    <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">PerformanceObserver</span> === <span class="hljs-string">&#x27;undefined&#x27;</span> ||
    !<span class="hljs-title class_">PerformanceObserver</span>.<span class="hljs-property">supportedEntryTypes</span>?.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;resource&#x27;</span>)
  ) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
      <span class="hljs-title function_">onResource</span>({
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
<p><code>getEntriesByType()</code> 只返回读取时已经存在的条目；用户之后点击触发的请求要用 Observer 监听。性能缓冲区不是无限的，长页面应尽早订阅并处理 buffer 满的情况。回调里只做轻量入队，后续批量、采样上报，不要同步序列化大量记录。</p>
<h2>请求完成不等于功能完成</h2>
<p>脚本下载结束后还要解析、编译和执行；图片下载结束后还要解码、布局和绘制；fetch 完成后还要解析 JSON、更新状态和渲染。用户第一次展开等待两秒，而答案资源只下载了 100ms，瓶颈可能在后续模块、主线程或渲染，而不是网络。</p>
<p>反过来，一条慢资源也未必影响用户。如果它在后台预取或低频页面中加载，优化优先级可能低于一个较小但阻塞首个操作的脚本。应把资源记录和用户任务、LCP、INP 或业务 mark 对齐。</p>
<h2>生产采集要处理隐私和缺失</h2>
<p>资源 URL 可能带查询参数、令牌、租户或用户标识。上报前应使用白名单、去除查询串或脱敏，不能把所有完整 URL 发送到监控平台。还要区分真实为零、缓存、连接复用、跨源不可见和记录丢失。</p>
<p>Resource Timing 提供的是线索，不是自动原因分析。要得出可信结论，需要结合响应头、缓存路径、浏览器网络面板、构建版本和页面实际交互一起验证。</p>`};export{e as default};