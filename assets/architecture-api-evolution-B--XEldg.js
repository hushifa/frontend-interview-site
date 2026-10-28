var e={answerHtml:`<h2>简答</h2>
<ul>
<li>前端发布后，旧版本页面和移动端 App 会长期存在，API 必须同时服务新旧客户端。</li>
<li>兼容的改动：新增可选字段、新增接口、新增枚举值（前提是客户端能忽略未知值）。</li>
<li>不兼容的改动：删除或重命名字段、改变字段类型或含义、新增必填参数，需要新版本或分阶段迁移。</li>
<li>迁移按&quot;先加新、双写或双读、迁移客户端、确认无人使用后再删旧&quot;的顺序进行。</li>
<li>用 <code>Deprecation</code>、<code>Sunset</code> 响应头和文档提前通知废弃，并通过日志统计旧接口的调用量。</li>
</ul>
<h2>客户端也要容错</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">STATUS_TEXT</span> = { <span class="hljs-attr">paid</span>: <span class="hljs-string">&#x27;已支付&#x27;</span>, <span class="hljs-attr">pending</span>: <span class="hljs-string">&#x27;待支付&#x27;</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">statusText</span>(<span class="hljs-params">order</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-variable constant_">STATUS_TEXT</span>[order.<span class="hljs-property">status</span>] ?? <span class="hljs-string">&#x27;处理中&#x27;</span>; <span class="hljs-comment">// 未知状态不崩溃</span>
}
</code></pre></div>
<ul>
<li>忽略不认识的字段，不要用严格模式拒绝多余属性。</li>
<li>未知的枚举值走默认分支，而不是抛错或白屏。</li>
<li>只依赖文档承诺的字段，不依赖字段顺序或未文档化的行为。</li>
</ul>
<p>服务端加了新状态而客户端没有兜底，是最常见的&quot;兼容改动导致旧版本崩溃&quot;。</p>
<h2>分阶段迁移示例</h2>
<p>把 <code>name</code> 拆成 <code>firstName</code> 和 <code>lastName</code>：</p>
<ol>
<li>服务端同时返回 <code>name</code> 和两个新字段，写接口同时接受两种格式。</li>
<li>发布新版前端，读写都改用新字段。</li>
<li>观察日志，直到仍在发送或依赖 <code>name</code> 的客户端比例足够低。</li>
<li>返回 <code>Deprecation</code> 头和文档通知，到达约定时间后删除 <code>name</code>。</li>
</ol>
<p>移动端 App 无法强制所有用户升级，第 3 步可能需要几个月，或者配合最低版本强制更新。</p>
<h2>版本策略</h2>
<table><thead><tr><th>方式</th><th>适用场景</th></tr></thead><tbody><tr><td>不加版本，只做兼容改动</td><td>大部分日常演进</td></tr><tr><td>URL 版本（<code>/v2/orders</code>）</td><td>大范围不兼容改动，新旧并存</td></tr><tr><td>请求头或媒体类型版本</td><td>同一资源多种表示，路径保持稳定</td></tr><tr><td>能力协商（客户端声明支持的功能）</td><td>客户端版本差异大，按能力返回不同数据</td></tr></tbody></table>
<p>版本越多，维护和测试成本越高，所以优先通过兼容改动避免新版本。</p>
<h2>错误格式和分页</h2>
<ul>
<li>错误响应使用统一结构，例如 RFC 9457 定义的 Problem Details（<code>type</code>、<code>title</code>、<code>status</code>、<code>detail</code>），新增错误类型时客户端可以按 <code>status</code> 兜底处理。</li>
<li>分页从偏移量改成游标时，旧参数保留一段时间；游标对客户端应是不透明字符串，便于服务端以后修改实现。</li>
</ul>
<h2>缓存与灰度</h2>
<ul>
<li>响应结构变化后，CDN 或浏览器中缓存的旧响应可能和新前端混用，要么在 URL 或请求头中区分版本，要么让新前端兼容旧响应。</li>
<li>服务端先发布兼容版本，再灰度发布前端；回滚前端时，服务端必须仍支持旧前端的请求。</li>
</ul>
<h2>废弃通知</h2>
<p>RFC 9745 定义了 <code>Deprecation</code> 响应头，RFC 8594 定义了 <code>Sunset</code> 响应头，可以配合 <code>Link</code> 头指向迁移文档。前端或 SDK 在开发环境中读取这些头并打印警告。</p>
<h2>常见追问</h2>
<ul>
<li>GraphQL 怎样演进？通常不做版本，新增字段，用 <code>@deprecated</code> 标注旧字段，并通过查询日志确认无人使用后删除。</li>
<li>前后端同时发布能避免这些问题吗？不能，用户浏览器中打开的旧页面和 CDN 缓存仍会持续一段时间。</li>
</ul>`};export{e as default};