var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>MCP 是 AI 应用和外部能力之间的一套协议。外部服务叫 Server，它提供工具、资源和提示；AI 应用叫 Host，Host 里面的 Client 负责去发现和调用这些能力。</p>
<p>模型提出的工具调用只是一个建议。哪些工具能让模型看到、执行前要不要授权、要不要请用户确认，都是 Host 说了算。</p>
<p>2026-07-28 版规范有几个大变化：去掉了 <code>initialize</code> 握手和 <code>Mcp-Session-Id</code>，每个请求自己在 <code>_meta</code> 里带上协议版本和客户端能力，Server 必须实现 <code>server/discover</code>。Streamable HTTP 的 <code>Last-Event-ID</code> 续传也删了，流断开以后，客户端要用新的请求 ID 重新发请求。</p>
<p>授权方面，远程 Server 走 OAuth，客户端注册推荐用 Client ID Metadata Documents，动态客户端注册（DCR）已经标为弃用。</p>
</blockquote>
<h2>三个角色分别是谁</h2>
<p>Host 是用户直接使用的 AI 应用，比如 IDE、桌面助手，或者网页聊天背后的服务端。它管着模型、界面，以及多个 Client。</p>
<p>Client 是 Host 里面的一个连接对象，一个 Client 对应一个 Server，负责和它通信。</p>
<p>Server 是提供能力的一方。它可以是本机上的一个进程，通过标准输入输出通信，也就是 stdio；也可以是远程服务，通过 Streamable HTTP 通信。</p>
<p>一次工具调用大致是这样走的：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">用户任务 → Host 选出允许的工具 → 模型提出 tools/call 参数
        → Host 校验参数、确认权限、必要时请用户批准
        → Client 发送请求 → Server 执行 → Host 检查结果并更新界面
</code></pre></div>
<p>可以看到，模型只出现在中间一步，它只负责提出参数。前面选工具、后面校验和执行，都在 Host 手里。</p>
<p>Server 提供的三种能力要分清楚：工具是去执行操作的；资源是提供给模型看的上下文数据；提示是可以复用的输入模板。还要注意，资源内容和工具返回结果里的文字都是数据，里面可能藏着提示词注入，Host 要按不可信内容处理。</p>
<h2>2026-07-28 版改了什么</h2>
<p>这一版最大的方向是“无状态”：每个请求自己带齐需要的信息，不再依赖之前建立的会话。具体对比如下：</p>
<table><thead><tr><th>方面</th><th>2025 年各版本</th><th>2026-07-28 版</th></tr></thead><tbody><tr><td>连接建立</td><td><code>initialize</code> 握手协商版本与能力</td><td>无握手；每个请求的 <code>_meta</code> 携带 <code>io.modelcontextprotocol/protocolVersion</code> 和 <code>clientCapabilities</code></td></tr><tr><td>能力发现</td><td>握手返回</td><td>Server 必须实现 <code>server/discover</code>，Client 可先调用它选版本</td></tr><tr><td>会话</td><td><code>Mcp-Session-Id</code> 头</td><td>移除；跨调用状态由 Server 生成的句柄作为普通参数传递</td></tr><tr><td>服务端通知</td><td>GET 长连接、<code>resources/subscribe</code></td><td>统一用 <code>subscriptions/listen</code></td></tr><tr><td>断线续传</td><td><code>Last-Event-ID</code> 重放</td><td>移除；流断开即丢失该请求，客户端用新请求 ID 重试</td></tr><tr><td>Server 向客户端索取输入</td><td>Server 发起 <code>sampling/createMessage</code>、<code>elicitation/create</code> 等请求</td><td>多轮请求模式：结果返回 <code>resultType: &quot;input_required&quot;</code>，客户端补充 <code>inputResponses</code> 后重试原请求</td></tr></tbody></table>
<p>还有几处小变化。<code>ping</code> 和 <code>logging/setLevel</code> 被移除了，日志级别改成每个请求在 <code>_meta</code> 里用 <code>io.modelcontextprotocol/logLevel</code> 指定。所有结果都新增了一个必填字段 <code>resultType</code>，取值是 <code>&quot;complete&quot;</code> 或 <code>&quot;input_required&quot;</code>。Sampling、Roots 和 Logging 这几个功能被标为弃用，旧的 HTTP+SSE 传输方式也是弃用状态，新实现应该直接接 Streamable HTTP。</p>
<h2>授权怎么做，浏览器能不能直接当 Host</h2>
<p>远程 Server 的授权基于 OAuth。2026-07-28 版要求客户端校验授权响应里的 <code>iss</code>，也就是“这个授权是谁签发的”；凭据要按签发方分开保存，换了授权服务器就要重新注册。客户端注册推荐用 Client ID Metadata Documents，DCR 只是为了兼容才保留。</p>
<p>浏览器页面能直接当 Host 吗？一般不行。网页启动不了本地进程，长期令牌放在前端也不安全。常见做法是让后端或者桌面应用来当 Host，网页只负责展示调用状态、收集用户确认。</p>
<h2>界面上要展示哪些状态</h2>
<p>出错要分清是哪一层的错。连接失败、能力发现失败、协议版本不匹配（<code>UnsupportedProtocolVersionError</code>），这些是“根本没调到”；工具执行失败是“调到了但没成功”。两者要分开显示。</p>
<p>工具调用本身分成待确认、执行中、成功、失败、结果未知。为什么会有“结果未知”？因为响应流断了的时候，Server 可能已经执行完了，客户端只是没收到结果。新版又去掉了断线续传，所以有副作用的工具，要靠业务自己的幂等键，避免重试时又执行一遍。</p>
<p>如果结果是 <code>input_required</code>，说明 Server 需要用户补充信息，界面要能收集输入，再带着它重试原来的请求。</p>
<h2>常见追问</h2>
<p><strong>接入 MCP 以后，模型就能访问用户的全部数据了吗？</strong></p>
<blockquote>
<p>不能。模型只看得到 Host 放进上下文的工具描述和工具结果。真正执行时，还要受 Host 和 Server 两边的权限限制。</p>
</blockquote>
<p><strong>工具注解里写了“只读”，可以不用确认吗？</strong></p>
<blockquote>
<p>注解是 Server 自己写的，只能拿来辅助展示，不能当成安全依据。要不要确认，由 Host 按自己的策略决定。</p>
</blockquote>`};export{e as default};