var e={answerHtml:`<p>后端把订单接口中的 <code>total</code> 改成 <code>amount</code>，旧版网页立即出现 <code>NaN</code>；移动端还有几周才能审核发布，不能要求所有客户端同一天升级。API 演进的核心是保持已发布客户端的可用性，同时让新能力有明确的协商、监控和退出路径。单纯把路径改成 <code>/v2</code> 只能标记版本，不能解决数据迁移和并行运行问题。</p>
<h2>先定义什么是兼容变更</h2>
<p>对响应来说，增加可选字段通常比删除或改变已有字段安全；改变字段类型、含义、单位、排序、默认过滤和错误状态都可能破坏客户端。对请求来说，服务端忽略未知字段通常有利于前向兼容，但不能假设所有网关、校验器和签名算法都会忽略它们。</p>
<p>以下变化应视为需要评估的破坏性变更：</p>
<ul>
<li>删除字段或让原本必有的字段变成可选；</li>
<li>把字符串改成数字、把金额单位从元改成分；</li>
<li>改变分页游标、排序稳定性或默认页大小；</li>
<li>改变错误码、HTTP 状态或鉴权要求；</li>
<li>让同一个请求在相同输入下返回不同语义。</li>
</ul>
<p>接口契约应说明字段是否必有、可为空、单位、时区、枚举未知值处理和最大长度，而不是只给一个成功 JSON 示例。</p>
<h2>优先使用可演进的字段和能力协商</h2>
<p>新字段应让旧客户端忽略，新客户端在字段缺失时有明确降级。需要改变语义时，可以新增字段或能力，而不是复用旧字段名改变含义。客户端可以通过请求头、查询参数或服务端返回的能力集合选择可用功能，但协商结果不能代替权限检查。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fetchOrders</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/orders&#x27;</span>, {
    <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Accept</span>: <span class="hljs-string">&#x27;application/vnd.example.orders+json;v=2&#x27;</span> },
  });
  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">406</span>) {
    <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>?.<span class="hljs-title function_">cancel</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/orders&#x27;</span>, {
      <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Accept</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
    }).<span class="hljs-title function_">then</span>(assertOk);
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">assertOk</span>(response);
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">assertOk</span>(<span class="hljs-params">response</span>) {
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`订单请求失败：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  <span class="hljs-keyword">return</span> response.<span class="hljs-title function_">json</span>();
}
</code></pre></div>
<p>媒体类型版本只是示意，具体方案要与网关、缓存和服务端框架一致。若响应会因 <code>Accept</code> 变化，缓存层需要正确处理 <code>Vary: Accept</code>；否则不同客户端可能拿到错误表示。不要在客户端无条件重试所有 4xx，只有明确表示“能力不匹配”的情况才应降级。</p>
<p>这里约定 406 表示服务端无法提供请求的响应表示，才改用默认 JSON 再请求一次。415 表示请求内容的格式或编码不受支持，并不是响应版本协商失败，不能通过修改 Accept 自动解决。两者分别对应 RFC 9110 的 15.5.7 和 15.5.16 节。</p>
<p>这个 GET 示例假定两种表示都能由调用方正确解析；若 v1 使用 total 而 v2 使用 amount，应分别校验并映射为统一的业务模型，不能只把响应交给 json() 就宣称完成兼容。安全协议版本也不能静默降级。</p>
<h2>URL 版本、请求头和功能开关各有代价</h2>
<p>路径版本简单直观，适合存在明显资源语义差异的长期版本，但会导致路由、文档、缓存和监控并行维护。请求头或媒体类型可以让同一路径协商表示，却更依赖网关和缓存正确配置。功能开关适合渐进发布一项能力，不适合掩盖已经不兼容的字段契约。</p>
<p>选择方案时要看客户端生命周期、是否有第三方调用者、缓存层能力、审计要求和回滚速度。内部 Web 应用通常可以通过前后端同步发布和兼容窗口减少版本数量；公开 SDK 或长期未更新的客户端则需要更明确的版本策略和弃用周期。</p>
<h2>分页和错误格式也需要演进规则</h2>
<p>偏移分页在数据插入或删除时可能重复或遗漏，游标分页需要保证游标不透明、可过期且与排序规则绑定。改变默认排序或页大小即使没有改字段，也可能改变用户看到的结果。客户端应把 <code>next</code> 游标当作不透明字符串保存，不要解析内部结构。</p>
<p>错误响应应包含稳定的机器可读代码、用户可读消息和可选详情。新增错误代码时旧客户端应进入通用错误分支；不能让客户端依赖完整中文文案判断逻辑。错误详情可能包含敏感信息，生产环境应按权限和环境裁剪。</p>
<h2>弃用需要证据和时间表</h2>
<p>下线旧字段或版本前，应先统计调用方、客户端版本、错误率和关键业务路径。通过响应头、文档和公告通知弃用时间，必要时在服务端返回 <code>Deprecation</code> 或链接到迁移说明。不要只看最新 Web 版本，移动端、桌面客户端、嵌入 WebView 和离线用户可能长期停留在旧版本。</p>
<p>迁移期间可以让新旧字段同时返回，但要明确哪一个是事实来源，并监控旧字段读取量。服务端不能因为前端“应该已经升级”就突然删除字段；达到退出条件后先灰度拒绝，再保留回滚能力。长期兼容层会增加成本，应设定负责人和删除日期。</p>
<h2>缓存、幂等和重试不能被忽略</h2>
<p>接口版本改变响应结构时，CDN、Service Worker 和客户端缓存都可能保留旧表示。缓存键应包含真正影响表示的版本或请求头，并设置清晰的失效策略。写请求如果允许自动重试，必须定义幂等键，避免网络超时后重复创建订单或扣款。错误状态和重试建议也属于契约的一部分。</p>
<h2>安全与测试</h2>
<p>服务端每个版本都要执行认证、对象级授权、输入校验和速率限制；版本号不是权限。开放新字段时检查是否意外暴露内部 ID、租户数据或调试信息。契约测试应验证必填、可选、未知字段、错误码、分页游标和旧客户端样例；集成测试再覆盖缓存、网关、重试和真实部署。</p>
<p>不要只用快照比较完整 JSON：它会把无害的新增字段误判成破坏，也可能漏掉单位和语义变化。更有价值的是验证公共契约、兼容矩阵和迁移期间的真实请求。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://www.rfc-editor.org/rfc/rfc9110.html">RFC 9110 · HTTP Semantics</a></li>
<li><a href="https://www.rfc-editor.org/rfc/rfc9111.html">RFC 9111 · HTTP Caching</a></li>
<li><a href="https://www.rfc-editor.org/rfc/rfc6648.html">RFC 6648 · X- 前缀弃用</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation">MDN · Content negotiation</a></li>
</ul>`};export{e as default};