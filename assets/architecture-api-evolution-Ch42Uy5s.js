var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端发布了新版本，用户浏览器里开着的旧页面、手机上没升级的旧 App 还会存在很久。所以 API 不能只照顾最新的前端，必须同时服务新旧客户端。</p>
<p>改动分两类。新增可选字段、新增接口、新增枚举值，一般是兼容的，前提是客户端能忽略不认识的值。删除或重命名字段、改字段类型或含义、新增必填参数，就是不兼容的，要走新版本或分阶段迁移。</p>
<p>迁移的顺序是：先加新的，再双写或双读，然后迁移客户端，确认没人用旧的了再删。</p>
<p>废弃要提前通知。可以用 <code>Deprecation</code>、<code>Sunset</code> 响应头加文档告诉调用方，同时用日志统计旧接口还有多少调用量。</p>
</blockquote>
<h2>客户端为什么也要容错</h2>
<p>服务端加了一个新的订单状态，旧客户端不认识它，会怎么样？看下面这段：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">STATUS_TEXT</span> = { <span class="hljs-attr">paid</span>: <span class="hljs-string">&#x27;已支付&#x27;</span>, <span class="hljs-attr">pending</span>: <span class="hljs-string">&#x27;待支付&#x27;</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">statusText</span>(<span class="hljs-params">order</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-variable constant_">STATUS_TEXT</span>[order.<span class="hljs-property">status</span>] ?? <span class="hljs-string">&#x27;处理中&#x27;</span>; <span class="hljs-comment">// 未知状态不崩溃</span>
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">statusText</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;paid&#x27;</span> })); <span class="hljs-comment">// 已支付</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">statusText</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;refunding&#x27;</span> })); <span class="hljs-comment">// 处理中</span>
</code></pre></div>
<p><code>refunding</code> 是后来新增的状态，映射表里没有，查出来是 <code>undefined</code>，于是走 <code>??</code> 后面的默认文案。如果这里写成没查到就抛错，或者直接拿 <code>undefined</code> 去渲染，旧版本就可能白屏。</p>
<p>服务端加了新状态、客户端没有兜底，是“兼容改动把旧版本搞崩”最常见的原因。所以客户端要做到三点：忽略不认识的字段，不要用严格校验拒绝多余属性；未知的枚举值走默认分支；只依赖文档承诺的字段，不依赖字段顺序或文档没写的行为。</p>
<h2>不兼容的改动怎样分阶段迁移</h2>
<p>举个例子，要把 <code>name</code> 拆成 <code>firstName</code> 和 <code>lastName</code>。</p>
<ol>
<li>服务端同时返回 <code>name</code> 和两个新字段，写接口两种格式都接受。</li>
<li>发布新版前端，读写都改用新字段。</li>
<li>观察日志，等到还在发送或依赖 <code>name</code> 的客户端比例足够低。</li>
<li>返回 <code>Deprecation</code> 头并发文档通知，到了约定时间再删掉 <code>name</code>。</li>
</ol>
<p>第 3 步在移动端可能要等好几个月，因为没法强制所有用户升级 App，有时要配合最低版本强制更新。</p>
<h2>要不要加版本号</h2>
<table><thead><tr><th>方式</th><th>适用场景</th></tr></thead><tbody><tr><td>不加版本，只做兼容改动</td><td>大部分日常演进</td></tr><tr><td>URL 版本（<code>/v2/orders</code>）</td><td>大范围不兼容改动，新旧并存</td></tr><tr><td>请求头或媒体类型版本</td><td>同一资源多种表示，路径保持稳定</td></tr><tr><td>能力协商（客户端声明支持的功能）</td><td>客户端版本差异大，按能力返回不同数据</td></tr></tbody></table>
<p>版本越多，要维护和测试的组合就越多。所以优先靠兼容改动解决问题，尽量不开新版本。</p>
<h2>错误格式和分页也要考虑演进</h2>
<p>错误响应用统一的结构，比如 RFC 9457 定义的 Problem Details，包含 <code>type</code>、<code>title</code>、<code>status</code>、<code>detail</code> 这几个字段。这样以后新增错误类型，旧客户端不认识 <code>type</code>，也能按 <code>status</code> 兜底处理。</p>
<p>分页从偏移量改成游标时，旧参数要保留一段时间。游标对客户端来说应该是一个看不懂内容的字符串，客户端只负责原样传回去。这样服务端以后换实现，客户端不受影响。</p>
<h2>缓存和灰度发布</h2>
<p>响应结构变了以后，CDN 或浏览器里缓存的旧响应可能和新前端混在一起用。要么在 URL 或请求头里区分版本，要么让新前端也能处理旧格式的响应。</p>
<p>发布顺序上，服务端先发兼容版本，再灰度发布前端。前端要回滚时，服务端必须仍然支持旧前端的请求，否则回滚本身就会出问题。</p>
<h2>怎样通知调用方接口要废弃</h2>
<p>RFC 9745 定义了 <code>Deprecation</code> 响应头，RFC 8594 定义了 <code>Sunset</code> 响应头，可以再配合 <code>Link</code> 头指向迁移文档。前端或 SDK 在开发环境读到这些头，就打印警告提醒开发者。</p>
<h2>常见追问</h2>
<p><strong>GraphQL 怎样演进？</strong></p>
<blockquote>
<p>通常不做版本。需要变化时新增字段，用 <code>@deprecated</code> 标注旧字段，再通过查询日志确认没人用了才删除。</p>
</blockquote>
<p><strong>前后端同时发布，能避免这些问题吗？</strong></p>
<blockquote>
<p>不能。用户浏览器里已经打开的旧页面、CDN 里的缓存，都还会存在一段时间，新旧版本总会同时在线。</p>
</blockquote>`};export{e as default};