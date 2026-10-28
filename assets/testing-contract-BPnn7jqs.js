var e={answerHtml:`<p>前端测试用一个固定 JSON Mock 验证成功页面，可能一直通过；真实后端却把 <code>userName</code> 改成了 <code>name</code>，或者错误响应从对象变成了 HTML。Mock 只证明前端能处理这份假数据，不能证明前后端对接口契约的理解仍然一致。</p>
<p>契约测试的目标是验证消费者和提供者共同依赖的协议：请求方法、路径、参数、请求体、响应状态、字段结构、错误格式和必要的头。它关注接口边界，不负责证明整个业务流程或数据库逻辑正确。</p>
<h2>先明确谁拥有契约</h2>
<p>团队可以从 OpenAPI 文档、JSON Schema、消费者声明或服务端实现中产生契约。关键不是把某个 YAML 文件叫作“契约”，而是明确它由谁维护、哪些变更需要评审、如何验证真实服务和前端使用的一致性。</p>
<p>一个接口至少应描述成功和失败，而不是只写 200 的理想响应：</p>
<div class="not-prose code-block"><div class="code-language">yaml</div><pre><code class="hljs language-yaml">openapi: 3.1.0
info:
  title: 用户资料接口
  version: 1.0.0
paths:
  /api/profile:
    get:
      responses:
        &#x27;200&#x27;:
          description: 返回当前用户的公开资料
          content:
            application/json:
              schema:
                type: object
                required: [id, displayName]
                properties:
                  id: { type: string }
                  displayName: { type: string }
        &#x27;401&#x27;:
          description: 缺少有效登录会话
          content:
            application/json:
              schema:
                $ref: &#x27;#/components/schemas/Problem&#x27;
components:
  schemas:
    Problem:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          enum: [UNAUTHENTICATED]
        message:
          type: string
</code></pre></div>
<p>这个最小 OpenAPI 3.1 文档补齐了响应 description 和引用的 Problem 定义，但没有配置实际服务器或认证方案。它表达字段和状态的协议，不证明服务器已经正确实现，也不证明浏览器一定能访问。真正的测试还要把文档与客户端调用和实际服务连接起来。</p>
<p>例如消费者用测试会话请求 GET /api/profile，提供者验证应检查实际响应是 200、媒体类型为 JSON、id 与 displayName 为字符串；无会话时检查 401 和 UNAUTHENTICATED 错误结构。还要反向让消费者处理提供者约定的这两种数据。仅把一份手写样例放进 Schema 校验器，通过后仍不能证明真实路由返回它。</p>
<h2>Schema 校验和契约测试不是完全同义</h2>
<p>Schema 测试可以检查一个响应是否符合结构、类型、枚举和必填字段；它很适合在服务端单元或集成测试中验证序列化结果，也可以让前端在开发或运行时解析外部数据。</p>
<p>契约测试还要确认消费者实际发出的请求满足提供者约定，并覆盖消费者真正依赖的错误状态、查询参数和内容类型。一个“符合 JSON Schema 的对象”不一定代表 URL、权限、分页头或业务错误行为正确。</p>
<p>前端运行时仍应把网络响应当作 <code>unknown</code> 或通过成熟 schema 工具解析。TypeScript 接口、OpenAPI 生成的类型和代码生成客户端都不能替代服务器返回数据的真实性验证；它们解决的是开发时契约表达和调用体验。</p>
<h2>Mock、集成和端到端各自证明什么</h2>
<table><thead><tr><th>测试方式</th><th>主要证明</th><th>不能单独证明</th></tr></thead><tbody><tr><td>前端 Mock</td><td>UI 对受控成功、空结果和错误分支的处理</td><td>真实服务是否按同一契约返回</td></tr><tr><td>契约测试</td><td>消费者与提供者的请求/响应约定兼容</td><td>完整业务流程、真实数据和性能</td></tr><tr><td>服务集成测试</td><td>服务端路由、权限、序列化与依赖协作</td><td>所有真实浏览器交互</td></tr><tr><td>端到端测试</td><td>关键用户流程在接近真实环境中可完成</td><td>所有输入组合和全部接口分支</td></tr></tbody></table>
<p>因此，Playwright <code>route.fulfill()</code> 适合稳定验证前端分支，但不能替代契约测试。可以让 Mock 数据从同一 Schema 或生成器产生，减少漂移；仍需在 CI 或发布流程中对真实服务运行契约验证。</p>
<h2>兼容性要看消费者真实使用的字段</h2>
<p>提供者新增可选字段通常对旧消费者兼容；删除必填字段、改变类型、收紧枚举、修改错误状态或改变分页含义则可能破坏消费者。把所有字段都标为可选来让测试通过，会让契约失去约束力。</p>
<p>消费者也可能依赖文档没有写出的行为，例如 404 表示空结果、错误对象中存在 <code>code</code>、响应必须支持某种排序。应把真正需要稳定的行为写进契约，而不是靠测试偶然读取一个字段。</p>
<p>请求体和响应体的额外字段策略也要明确：未知字段是允许、忽略还是拒绝？不同语言和校验库的默认行为可能不同。前端如果只使用部分字段，不代表服务端可以随意删除其他消费者依赖的字段。</p>
<h2>错误和权限是契约的一部分</h2>
<p>401、403、404、409、422 和 429 不能在所有接口中都映射成同一句“请求失败”。前端需要知道哪些状态可以重试、哪些需要重新登录、哪些要展示字段错误或冲突界面；服务端要保证错误结构在这些路径上可解析。</p>
<p>认证方式、Cookie/Authorization、CORS、CSRF、分页游标和 <code>Retry-After</code> 等头也可能属于契约。只校验 JSON 字段，却不检查请求头和状态码，无法覆盖真实跨源和失败流程。</p>
<p>契约测试中的凭据应使用测试账号或替身，不能把生产令牌写入 OpenAPI 示例、录制文件和 CI 日志。真实响应里的个人数据也要脱敏，不能为了重现一个字段把完整用户资料提交到仓库。</p>
<h2>版本和发布流程需要可回滚</h2>
<p>服务端先发布新字段、再让前端使用，是常见的向后兼容策略；前端先删除旧字段依赖，再发布后端变更，也可以降低回滚风险。破坏性变化需要版本化、兼容窗口或迁移计划，不能只在主分支一次性替换。</p>
<p>契约检查应在 Pull Request、服务发布和前端构建的适当阶段执行，并能说明是消费者不满足、提供者不满足还是文档本身不完整。发布成功后仍应观察真实请求错误率和解析失败，测试通过不等于线上所有代理、缓存和旧客户端都已经升级。</p>
<p>一套可靠的契约测试让“接口改了会影响谁”变得可见：Schema 负责表达结构，消费者测试负责表达真正依赖，提供者测试负责验证实现，端到端测试负责验证关键用户流程。把这几层混成一个 Mock 或一个绿色数字，反而会隐藏接口演进风险。</p>`};export{e as default};