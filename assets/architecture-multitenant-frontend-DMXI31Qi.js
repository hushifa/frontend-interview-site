var e={answerHtml:`<h2>简答</h2>
<ul>
<li>多租户前端要保证每次请求、缓存、权限判断和界面状态都属于当前租户。</li>
<li>租户上下文要有唯一来源和明确的生命周期。</li>
<li>路由里的租户标识只用于选择上下文，不能作为授权证明。</li>
<li>切换租户时重新确认授权，缓存键要包含租户。</li>
</ul>
<p>一个 SaaS 管理后台允许同一用户加入多个组织。用户从组织 A 切换到组织 B 后，页面标题变了，列表却短暂显示了 A 的数据；刷新后又因为缓存键没有包含组织而显示错误结果。多租户前端的难点不是多一个 <code>tenantId</code> 字段，而是保证每一次请求、缓存、权限判断和界面状态都明确属于当前租户。</p>
<h2>租户上下文要有唯一来源和生命周期</h2>
<p>登录用户可能属于多个租户，当前租户可以来自服务端会话、用户选择或受信任的路由参数。路由中的租户标识只用于选择上下文，不能作为授权证明。应用启动时应向服务端获取用户可访问的租户列表和当前租户，切换租户时重新确认授权，并让所有依赖租户的数据进入新的上下文。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">TenantContext</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">version</span>: <span class="hljs-built_in">string</span>;
};

<span class="hljs-keyword">let</span> <span class="hljs-attr">currentContext</span>: <span class="hljs-title class_">TenantContext</span> | <span class="hljs-literal">null</span> = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">let</span> contextEpoch = <span class="hljs-number">0</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">setTenantContext</span>(<span class="hljs-params"><span class="hljs-attr">next</span>: <span class="hljs-title class_">TenantContext</span> | <span class="hljs-literal">null</span></span>) {
  contextEpoch += <span class="hljs-number">1</span>;
  currentContext = next ? <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ ...next }) : <span class="hljs-literal">null</span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getTenantContext</span>(<span class="hljs-params"></span>): <span class="hljs-title class_">TenantContext</span> {
  <span class="hljs-keyword">if</span> (!currentContext) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;尚未选择租户&#x27;</span>);
  <span class="hljs-keyword">return</span> currentContext;
}
</code></pre></div>
<p>示例只展示内存中的上下文。生产应用仍要处理刷新、登出、多个标签页和服务端会话失效。不要把租户上下文散落在各个组件自己的状态里，否则切换时很容易出现一部分请求仍使用旧租户。</p>
<h2>请求层必须显式携带租户边界</h2>
<p>服务端应从认证会话和请求上下文中确定租户，并再次检查用户是否属于该租户。前端可以发送租户 ID 作为请求上下文，但不能让服务端只相信这个值。涉及跨租户管理员的场景，也要把“当前操作租户”和“管理员身份”分别建模并记录审计。</p>
<p>请求客户端应在发送前读取当前上下文，并在响应返回时确认请求没有过期：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">requestForTenant</span>(<span class="hljs-params">path, options = {}</span>) {
  <span class="hljs-keyword">const</span> tenant = <span class="hljs-title function_">getTenantContext</span>();
  <span class="hljs-keyword">const</span> epoch = contextEpoch;
  <span class="hljs-keyword">const</span> headers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Headers</span>(options.<span class="hljs-property">headers</span>);
  headers.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;X-Tenant-Id&#x27;</span>, tenant.<span class="hljs-property">id</span>);
  headers.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;X-Tenant-Version&#x27;</span>, tenant.<span class="hljs-property">version</span>);
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(path, {
    ...options,
    headers,
  });
  <span class="hljs-keyword">if</span> (epoch !== contextEpoch) {
    <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>?.<span class="hljs-title function_">cancel</span>();
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;租户已切换，丢弃旧响应&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">409</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;租户上下文已变化，请重新加载&#x27;</span>);
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`请求失败：HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">if</span> (epoch !== contextEpoch) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;解析期间租户已切换，丢弃旧响应&#x27;</span>);
  <span class="hljs-keyword">return</span> data;
}
</code></pre></div>
<p>这里的请求头只是示意协议，实际项目可使用路径、Cookie 或标准授权上下文。不要把长期令牌或敏感租户信息放进可被分享的 URL；服务端仍必须在每个资源访问点执行对象级授权。</p>
<p>两段示例放在同一客户端模块中使用。每次设置上下文都会递增本地 epoch，因此 A → B → A 时，即使租户 ID 和服务端 version 又变回原值，第一次 A 的请求仍被识别为过期。正文解析也是异步过程，所以读取 JSON 后还要检查一次。Headers 构造器支持对象、键值对数组和 Headers 实例，不能用对象展开代替这些输入的正确合并。</p>
<p>这里约定该端点的 409 表示上下文版本冲突；通用 HTTP 409 还可能表示其他业务冲突，实际接口应结合机器错误码区分。调用方应将过期响应当作已作废任务处理，不能覆盖新租户的错误提示。该模块是浏览器端示例；SSR 服务不能把它的模块级变量作为所有用户共享的租户状态。</p>
<h2>缓存键必须包含所有影响结果的维度</h2>
<p>查询缓存、浏览器缓存、Service Worker 和 CDN 都可能保存租户数据。缓存键至少要区分租户、用户权限范围、请求参数和必要的语言/版本；公共缓存不能保存带用户或租户数据的响应。切换租户时，不能只清空当前页面数组，还要使请求缓存、分页游标、预取结果和离线数据失效。</p>
<p>如果使用客户端查询库，应把租户 ID 放进查询键，并在上下文变化时取消旧请求：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> queryKey = [<span class="hljs-string">&#x27;projects&#x27;</span>, tenantId, filters];
</code></pre></div>
<p>查询键是一种客户端一致性措施，不是安全边界。服务端响应仍应包含租户版本或资源范围，便于调试和检测错误配置；日志和监控中也要记录经过脱敏的租户标识，才能定位串租户问题。</p>
<h2>切换租户要避免旧请求覆盖新状态</h2>
<p>切换过程中可能有多个请求同时返回。可以使用 AbortController、请求序号或上下文版本丢弃旧响应。切换界面应先进入加载状态，清空或遮蔽旧租户的敏感数据，确认新租户上下文后再显示内容。不要让用户在短暂过渡阶段继续编辑旧租户数据。</p>
<h2>主题和功能配置也属于租户数据</h2>
<p>品牌色、Logo、功能开关、字段配置和自定义域名常按租户变化。主题 token 应经过白名单和对比度校验，不能把租户输入直接拼进 CSS、HTML 或脚本。功能开关可以控制展示，但权限和接口能力仍由服务端决定。配置加载失败时应使用安全默认值，并显示配置不可用状态，而不是静默沿用另一个租户的配置。</p>
<h2>路由和文件访问不能泄露租户信息</h2>
<p>路由可以包含租户 slug 以便分享，但必须在进入页面时校验当前用户是否有权访问。下载链接、图片地址和导出任务也要绑定租户和用户权限；不能因为前端隐藏了入口就认为文件安全。使用对象存储预签名 URL 时，服务端应按当前租户生成短期、单对象权限的 URL。</p>
<p>例如 <code>/tenants/A/projects/123</code> 中的租户和项目 ID 都来自请求，服务器必须确认项目 123 属于允许访问的租户，以及当前身份拥有该项目的操作权限。把项目 ID 换成 UUID 只能降低猜测概率，不能替代对象级授权。查询时尽量从当前授权范围内查找对象，不能先按全局 ID 取出，再只检查“用户已登录”。</p>
<h2>多标签页和离线数据要单独设计</h2>
<p>一个标签页切换租户后，其他标签页可能仍持有旧上下文。可以通过 BroadcastChannel 发送“租户已切换”事件，让其他标签页暂停请求并要求重新确认；消息内容不要包含敏感业务数据。离线缓存应按租户和用户隔离，并在登出、撤销成员资格或租户切换时清理，不能把 IndexedDB 的全局表当作天然隔离。</p>
<h2>如何测试串租户问题</h2>
<p>测试应使用至少两个权限不同、数据明显不同的租户，覆盖：</p>
<ul>
<li>首次加载、刷新、切换和浏览器后退；</li>
<li>慢请求返回顺序与取消失败；</li>
<li>查询缓存、分页、预取和 Service Worker；</li>
<li>多标签页同时操作；</li>
<li>无权访问、成员被移除和会话过期；</li>
<li>导出、下载、上传和实时订阅。</li>
</ul>
<p>服务端集成测试要验证同一资源 ID 在不同租户下不能互相访问；前端测试只能验证状态清理和错误展示，不能证明真正的授权隔离。日志和错误上报也要防止把一个租户的名称或数据带到另一个租户的公共分析事件中。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html">OWASP · Authorization Cheat Sheet</a></li>
<li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html">OWASP · Insecure Direct Object Reference Prevention</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API">MDN · Broadcast Channel API</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control">MDN · Cache-Control</a></li>
</ul>`};export{e as default};