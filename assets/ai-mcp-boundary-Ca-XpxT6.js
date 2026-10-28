var e={answerHtml:`<h2>简答</h2>
<ul>
<li>MCP 是宿主应用与外部能力之间的协议：Server 暴露工具、资源和提示，Host 里的 Client 发现并调用它们。</li>
<li>模型的工具调用只是建议。Host 决定哪些工具进入上下文，并在执行前做授权和用户确认。</li>
<li>2026-07-28 版去掉了 <code>initialize</code> 握手和 <code>Mcp-Session-Id</code>，每个请求在 <code>_meta</code> 里带协议版本和客户端能力，Server 必须实现 <code>server/discover</code>。</li>
<li>同一版本删除了 Streamable HTTP 的 <code>Last-Event-ID</code> 续传：响应流断开后，客户端要用新的请求 ID 重新发起请求。</li>
<li>远程 Server 走 OAuth 授权，客户端注册改推 Client ID Metadata Documents，动态客户端注册（DCR）已标为弃用。</li>
</ul>
<h2>三个角色</h2>
<ul>
<li><strong>Host</strong>：用户直接使用的 AI 应用，例如 IDE、桌面助手或网页聊天后端。它管理模型、界面和多个 Client。</li>
<li><strong>Client</strong>：Host 内部与某个 Server 通信的连接对象。</li>
<li><strong>Server</strong>：提供能力的一方，可以是本机进程（stdio），也可以是远程服务（Streamable HTTP）。</li>
</ul>
<p>一次调用的链路：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">用户任务 → Host 选出允许的工具 → 模型提出 tools/call 参数
        → Host 校验参数、确认权限、必要时请用户批准
        → Client 发送请求 → Server 执行 → Host 检查结果并更新界面
</code></pre></div>
<p>工具、资源和提示是三种不同能力。工具执行操作；资源提供上下文数据；提示是可复用的输入模板。资源和工具结果里的文字都是数据，可能含有提示词注入，Host 按不可信内容处理。</p>
<h2>2026-07-28 版的主要变化</h2>
<table><thead><tr><th>方面</th><th>2025 年各版本</th><th>2026-07-28 版</th></tr></thead><tbody><tr><td>连接建立</td><td><code>initialize</code> 握手协商版本与能力</td><td>无握手；每个请求的 <code>_meta</code> 携带 <code>io.modelcontextprotocol/protocolVersion</code> 和 <code>clientCapabilities</code></td></tr><tr><td>能力发现</td><td>握手返回</td><td>Server 必须实现 <code>server/discover</code>，Client 可先调用它选版本</td></tr><tr><td>会话</td><td><code>Mcp-Session-Id</code> 头</td><td>移除；跨调用状态由 Server 生成的句柄作为普通参数传递</td></tr><tr><td>服务端通知</td><td>GET 长连接、<code>resources/subscribe</code></td><td>统一用 <code>subscriptions/listen</code></td></tr><tr><td>断线续传</td><td><code>Last-Event-ID</code> 重放</td><td>移除；流断开即丢失该请求，客户端用新请求 ID 重试</td></tr><tr><td>Server 向客户端索取输入</td><td>Server 发起 <code>sampling/createMessage</code>、<code>elicitation/create</code> 等请求</td><td>多轮请求模式：结果返回 <code>resultType: &quot;input_required&quot;</code>，客户端补充 <code>inputResponses</code> 后重试原请求</td></tr></tbody></table>
<p>这一版还移除了 <code>ping</code>、<code>logging/setLevel</code>，日志级别改为每个请求在 <code>_meta</code> 里用 <code>io.modelcontextprotocol/logLevel</code> 指定；所有结果新增必填字段 <code>resultType</code>（<code>&quot;complete&quot;</code> 或 <code>&quot;input_required&quot;</code>）。Sampling、Roots 和 Logging 功能被标为弃用，旧的 HTTP+SSE 传输也处于弃用状态。新实现应直接接入 Streamable HTTP。</p>
<h2>授权与浏览器边界</h2>
<p>远程 Server 的授权基于 OAuth。2026-07-28 版要求客户端校验授权响应里的 <code>iss</code>，按签发方保存凭据、换授权服务器时重新注册；客户端注册推荐 Client ID Metadata Documents，DCR 只为兼容保留。</p>
<p>浏览器页面不能启动本地进程，长期令牌也不适合放在前端。常见做法是由后端或桌面宿主充当 Host，网页只负责展示调用状态和收集用户确认。</p>
<h2>界面要展示的状态</h2>
<ul>
<li>连接或发现失败、协议版本不匹配（<code>UnsupportedProtocolVersionError</code>）要和工具执行失败分开显示。</li>
<li>工具调用分为待确认、执行中、成功、失败、结果未知。响应流中断时 Server 可能已经执行完毕，有副作用的工具要靠业务幂等键避免重复执行。</li>
<li><code>input_required</code> 表示 Server 需要用户补充信息，界面要能收集输入并重试原请求。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>接入 MCP 后模型就能访问用户的全部数据吗？</strong> 不能。模型只看到 Host 放进上下文的工具描述和结果，执行仍受 Host 和 Server 两侧权限限制。</li>
<li><strong>工具注解里写了&quot;只读&quot;，可以免确认吗？</strong> 注解来自 Server，只能辅助展示。是否需要确认由 Host 根据自身策略决定。</li>
</ul>`};export{e as default};