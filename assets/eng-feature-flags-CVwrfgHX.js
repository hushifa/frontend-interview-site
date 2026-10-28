var e={answerHtml:`<p>一个新结算流程需要先让内部员工试用，再逐步开放给真实用户。直接发布代码会让所有用户同时看到新逻辑，出问题时只能回滚整次发布。功能开关可以把“代码已经发布”和“用户是否启用”分开，但它也会引入配置一致性、缓存、审计和过期清理问题。</p>
<h2>先分清三类判断</h2>
<ul>
<li><strong>功能开关</strong>：控制一段功能是否启用，通常用于发布、回滚或逐步迁移。</li>
<li><strong>权限判断</strong>：决定当前身份是否有权执行某个动作，必须由服务端强制执行。</li>
<li><strong>实验分流</strong>：按稳定的用户或设备分组比较不同方案，需要记录分组、曝光和结果。</li>
</ul>
<p>把三者混成一个 <code>if (flag)</code> 会导致错误设计。隐藏一个按钮不是授权，前端开关关闭也不能阻止用户直接调用接口；实验分组也不应随每次刷新随机变化，否则数据无法解释。</p>
<h2>开关值必须有来源、版本和默认策略</h2>
<p>前端启动时可以从服务端获取公开配置，也可以由服务端在 HTML 中注入初始快照。配置至少需要包含开关键、值、版本、过期时间和适用范围。读取失败时应为每个开关定义安全默认值：支付、权限和数据迁移相关功能通常默认关闭，已经稳定且不影响数据一致性的展示功能可以按业务选择默认开启。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">FlagSnapshot</span> = {
  <span class="hljs-attr">version</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">expiresAt</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">values</span>: <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">boolean</span>&gt;;
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isEnabled</span>(<span class="hljs-params"><span class="hljs-attr">snapshot</span>: <span class="hljs-title class_">FlagSnapshot</span> | <span class="hljs-literal">null</span>, <span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>, now = <span class="hljs-title class_">Date</span>.now()</span>): <span class="hljs-built_in">boolean</span> {
  <span class="hljs-keyword">if</span> (!snapshot) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> expiresAt = <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">parse</span>(snapshot.<span class="hljs-property">expiresAt</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(now) || !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(expiresAt) || expiresAt &lt;= now) {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(snapshot.<span class="hljs-property">values</span>, key) &amp;&amp; snapshot.<span class="hljs-property">values</span>[key] === <span class="hljs-literal">true</span>;
}
</code></pre></div>
<p>配置只是客户端体验依据，不能替代服务端校验。服务端执行写操作时必须基于自己的配置和权限判断重新决定；前后端配置版本不一致时，应返回明确的能力错误或走兼容协议，而不是让前端猜测。</p>
<p>示例假定配置已经通过运行时结构校验，TypeScript 类型不能验证网络 JSON。入口需检查 version、expiresAt 和 values 的实际类型，并约定带时区的 ISO 时间格式。无效日期会得到 NaN，而 NaN 与当前时间比较不会返回 true，所以必须显式拒绝非有限值，不能只写“过期时间小于现在”。Object.hasOwn 避免把原型上的属性当成有效开关；旧运行环境可用 Object.prototype.hasOwnProperty.call 替代。</p>
<p>now 参数便于测试过期边界，但客户端时钟可以不准确或被修改。这只是显示策略，服务端必须独立校验真正的权限和能力；不能依赖本地过期判断保证紧急关闭及时生效。</p>
<h2>灰度分组要稳定且可审计</h2>
<p>按用户 ID、租户 ID 或设备 ID 做哈希分桶，可以让同一用户在多次访问中保持一致。分桶输入必须避免直接使用邮箱、手机号等敏感信息，必要时使用服务端生成的不可逆标识。用户切换账号、跨设备访问和匿名用户都要定义行为，否则一个人可能在不同设备看到不同流程。</p>
<p>实验分流应记录曝光事件，而不是只记录最终转化；用户在没有真正看到新界面时，不应计入实验样本。分组规则、比例、开始结束时间和指标口径要可追溯，临时手动改比例也要留下审计记录。</p>
<h2>配置更新和缓存要考虑延迟</h2>
<p>功能配置可能被浏览器、Service Worker、CDN 或应用内存缓存。紧急关闭开关时，如果客户端继续使用旧快照，风险窗口会被拉长。可以设置较短的配置 TTL、在关键操作前向服务端确认，或者由服务端在响应中返回当前能力版本。不能为了实时性让每个组件都自行请求配置，这会造成竞态和大量请求。</p>
<p>开关读取应集中在一个配置服务中，组件只依赖稳定的 <code>isEnabled</code> 或能力对象。配置刷新时要保证快照原子替换，避免同一次渲染中一半组件看到旧值、一半看到新值。对正在进行的表单、支付或编辑任务，开关变化不应中途切换协议；应在任务开始时固定版本，完成后再应用新配置。</p>
<h2>删除开关是发布流程的一部分</h2>
<p>临时开关长期存在会产生组合爆炸：两个开关有四种路径，多个开关会让测试和排查迅速失控。每个开关都应记录负责人、用途、创建日期、预期删除日期、默认值和影响范围。功能稳定后先把旧路径监控一段时间，再删除开关、配置和测试；不能只把开关值永久设为 <code>true</code>。</p>
<p>删除前要确认历史客户端不会继续请求旧配置键，服务端接口仍能兼容正在运行的旧版本。移动端和小程序审核周期较长，尤其要保留跨版本兼容窗口，不能按 Web 的即时发布假设处理。</p>
<h2>与错误恢复和安全边界结合</h2>
<p>开关服务本身不可用时，应用应使用本地快照或安全默认值，并在监控中标记“配置降级”，不能静默地把所有用户切到未知路径。紧急关闭应有权限控制、双人审核或至少审计日志，避免配置后台成为新的高权限攻击面。</p>
<p>服务端返回的能力集合可以帮助前端避免展示不可用入口，但关键动作仍要处理服务端拒绝、版本冲突和重试。前端日志应记录开关版本和路径名称，避免记录用户敏感数据；排查时才能知道用户实际走的是哪条逻辑。</p>
<h2>常见误区和选型</h2>
<ul>
<li>用前端开关保护接口：任何人都能修改前端代码或直接发请求，权限必须在服务端。</li>
<li>每次刷新随机分组：会污染实验数据，也让用户体验不稳定。</li>
<li>把配置写死在构建产物：紧急关闭需要重新构建和发布，失去开关价值。</li>
<li>不设置过期时间：临时路径变成永久分支，维护成本持续增加。</li>
<li>用一个布尔值表达复杂能力：需要地区、租户、版本和权限时应返回明确的能力对象和原因。</li>
</ul>
<p>小团队可以用版本化 JSON 配置和服务端审计实现简单开关；高风险、多租户或需要实验分析的系统再引入专门的开关服务。无论采用哪种工具，都要把默认策略、缓存延迟、回滚路径和删除责任写进发布流程。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://martinfowler.com/articles/feature-toggles.html">Martin Fowler · Feature Toggles</a></li>
<li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html">OWASP · Authorization Cheat Sheet</a></li>
<li><a href="https://www.w3.org/TR/trace-context/">W3C · Trace Context</a></li>
</ul>`};export{e as default};