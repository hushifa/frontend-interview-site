var e={answerHtml:`<h2>简答</h2>
<ul>
<li>插件系统的核心是一份可演进的宿主与插件契约。</li>
<li>宿主只提供受限上下文，不把 window、根组件或内部 store 交给插件。</li>
<li>激活、停用、重载和销毁要有明确顺序，插件创建的资源都要能回收。</li>
<li>插件返回值要经过版本化和校验。</li>
</ul>
<p>编辑器、后台系统和低代码平台常需要让不同团队增加面板、命令或数据源。直接让插件读取宿主的全局对象，短期接入很快，长期却会出现版本耦合、权限失控、卸载不干净和一个插件拖垮整个页面的问题。</p>
<p>插件系统的核心不是“动态 import 一个文件”，而是定义一份可演进的宿主与插件契约：插件能做什么、何时初始化、如何清理、失败时影响多大，以及不同版本怎样共存。</p>
<h2>先设计最小契约和生命周期</h2>
<p>一个插件入口可以接收宿主提供的受限上下文，并返回清理函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">activate</span>(<span class="hljs-params">context</span>) {
  <span class="hljs-keyword">const</span> disposeCommand = context.<span class="hljs-property">commands</span>.<span class="hljs-title function_">register</span>(<span class="hljs-string">&#x27;notes.open&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    context.<span class="hljs-property">ui</span>.<span class="hljs-title function_">openPanel</span>({ <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;笔记&#x27;</span>, <span class="hljs-attr">content</span>: <span class="hljs-string">&#x27;插件内容&#x27;</span> });
  });

  context.<span class="hljs-property">subscriptions</span>.<span class="hljs-title function_">add</span>(disposeCommand);
  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">deactivate</span>(<span class="hljs-params"></span>) {
      <span class="hljs-comment">// 释放插件自己创建的外部资源。</span>
    },
  };
}
</code></pre></div>
<p>示例中的 <code>commands</code>、<code>ui</code> 和 <code>subscriptions</code> 是宿主定义的能力，不应把完整的 <code>window</code>、根组件实例或内部 store 直接传给插件。激活、停用、重新加载和宿主销毁都要有明确顺序；插件注册的监听器、计时器、Worker、连接和 DOM 必须能被回收。</p>
<p>插件返回的对象也应经过版本化和校验。不能因为模块成功导出 <code>activate</code> 就相信它返回的任意字段；错误的插件应在激活阶段被拒绝，并提供可诊断的错误信息。</p>
<p>初始化不是原子操作：插件可能先注册命令，再加载数据失败。即使 activate 没有成功返回，宿主也应清理该次激活已经登记的资源。下面给出只处理同步清理函数的资源作用域，先登记后续需要撤销的动作，失败和正常停用均调用 dispose：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createScope</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> closed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> cleanups = [];
  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">add</span>(<span class="hljs-params">cleanup</span>) {
      <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> cleanup !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;清理项必须为函数&#x27;</span>);
      <span class="hljs-keyword">if</span> (closed) <span class="hljs-title function_">cleanup</span>();
      <span class="hljs-keyword">else</span> cleanups.<span class="hljs-title function_">push</span>(cleanup);
    },
    <span class="hljs-title function_">dispose</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">if</span> (closed) <span class="hljs-keyword">return</span>;
      closed = <span class="hljs-literal">true</span>;
      <span class="hljs-keyword">const</span> errors = [];
      <span class="hljs-comment">// 后创建的资源可能依赖早先的资源，按逆序释放。</span>
      <span class="hljs-keyword">while</span> (cleanups.<span class="hljs-property">length</span>) {
        <span class="hljs-keyword">try</span> { cleanups.<span class="hljs-title function_">pop</span>()(); }
        <span class="hljs-keyword">catch</span> (error) { errors.<span class="hljs-title function_">push</span>(error); }
      }
      <span class="hljs-keyword">if</span> (errors.<span class="hljs-property">length</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">AggregateError</span>(errors, <span class="hljs-string">&#x27;插件资源清理失败&#x27;</span>);
    },
  };
}
</code></pre></div>
<p>清理时先标记 closed，使重入和重复调用不会再次释放；单个清理失败后仍尝试其余清理，最后再报告错误。关闭后才登记的迟到资源会立即清理，不能留在已经失效的作用域里。宿主需要分别记录原始激活错误和清理错误，避免清理异常覆盖真正的初始化原因。</p>
<p>这个作用域不等待异步清理。若支持异步 deactivate，应另外定义 Promise、截止时间和失败报告协议，不可把 async 函数塞入本例后以为已经等待完成。资源也必须及时登记：创建后未登记就抛错，宿主无法凭空知道该释放什么。</p>
<h2>能力注入比全局对象更容易治理</h2>
<p>宿主应向插件注入最小能力，而不是让插件自行调用所有浏览器 API。文件读写、网络请求、用户数据、命令执行和设置修改都应通过显式能力入口，并根据插件权限决定是否提供。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> context = {
  <span class="hljs-attr">api</span>: {
    <span class="hljs-attr">readDocument</span>: <span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> documentStore.<span class="hljs-title function_">readForPlugin</span>(pluginId, id),
  },
  <span class="hljs-attr">log</span>: <span class="hljs-title function_">createScopedLogger</span>(pluginId),
  <span class="hljs-attr">commands</span>: <span class="hljs-title function_">createCommandRegistry</span>(pluginId, grantedPermissions),
};
</code></pre></div>
<p>权限检查不能只在插件 UI 中隐藏按钮。宿主提供的能力函数和服务端接口仍要验证插件身份、当前用户和资源权限。插件 ID 只是路由和审计信息，不是用户授权凭据。</p>
<p>如果插件可以加载远程 URL、执行脚本或读取任意文件，风险会显著扩大。要限制来源、内容安全策略、网络目标、资源大小和执行时间；不可信扩展应评估 iframe sandbox、独立 origin 或 Worker 等隔离方案。</p>
<h2>同进程插件和隔离插件的代价不同</h2>
<p>同进程 JavaScript 插件可以直接使用宿主提供的对象，交互简单、性能好，但插件异常可能影响宿主，且普通 JS 没有真正的安全隔离。限制 API 只能减少误用，不等于防住恶意代码。</p>
<p>iframe 可以提供文档和部分来源隔离，但要设计消息协议、焦点、尺寸、认证和性能；sandbox 的允许项需要最小化，同源且同时开放脚本和来源时要特别谨慎。Worker 适合计算和消息通信，但不能直接操作 DOM。</p>
<p>跨边界通信使用版本化消息和结构化数据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> message = {
  <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>,
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;panel:resize&#x27;</span>,
  <span class="hljs-attr">payload</span>: { <span class="hljs-attr">height</span>: <span class="hljs-number">480</span> },
};
</code></pre></div>
<p>接收端应检查来源、窗口、版本、字段类型和操作范围。不要把消息中的字符串交给 <code>eval</code> 或 <code>innerHTML</code>，也不要把收到的“支付成功”当成服务端事实。</p>
<h2>版本兼容要写进契约</h2>
<p>插件依赖的宿主 API 可能随着应用升级变化。宿主可以提供 API 版本、能力检测和弃用周期；插件应声明支持的范围，激活时发现能力不满足就显示清楚的兼容错误，而不是在运行中随机崩溃。</p>
<p>共享 React、Vue 或其他运行时也要定义版本策略。强制所有插件使用同一个实例可以减少体积，但升级需要协调；每个插件携带自己的运行时可能增加体积和多份单例状态。依赖共享不是免费的性能优化，要用真实构建和版本组合验证。</p>
<p>插件配置、消息和返回值要有 schema。新增可选字段通常更容易兼容，删除必填字段、改变事件语义和修改错误结构则需要迁移。不要让插件直接依赖宿主的私有 DOM、内部 class 或未声明的 store 字段。</p>
<h2>一个插件失败不应拖垮整个应用</h2>
<p>插件加载、初始化、运行时和停用都可能失败。宿主要区分加载中、不可用、初始化失败和运行时错误，给用户禁用、重试、查看日志或卸载入口。错误边界不一定能捕获远程脚本加载失败、资源超时和所有异步任务。</p>
<p>插件创建的资源应有作用域清单，宿主销毁插件时统一调用 dispose；但强制终止 Worker 或 iframe 不会撤销已经发送到服务器的副作用。写操作仍需要幂等、权限和状态查询。</p>
<p>日志应包含插件 ID、版本、宿主版本、操作关联 ID 和错误阶段，同时过滤用户内容、令牌和敏感响应。插件异常不能通过把所有错误吞掉来“保护主应用”，否则问题会变成静默的数据丢失。</p>
<h2>发布和回滚需要考虑插件版本组合</h2>
<p>插件远程清单、宿主入口和资源缓存可能形成多种版本组合。发布新宿主前要验证旧插件仍能工作，发布新插件前要确认旧宿主的能力；哈希资源和版本窗口能帮助旧页面恢复，但不能无限保留所有旧产物。</p>
<p>插件清单应可验证来源和完整性，必要时签名或通过受控仓库发布。把任意用户提交的 JavaScript 直接当插件执行，相当于授予它宿主权限，不能只靠文件扩展名或名称判断安全。</p>
<p>选型时先问插件是否真的需要独立团队和运行时扩展。如果只是在同一应用复用几个组件，清晰的模块契约或 monorepo 通常更简单；只有独立交付、第三方扩展或长期演进收益足以覆盖权限、版本、监控和隔离成本时，才值得建立插件平台。</p>`};export{e as default};