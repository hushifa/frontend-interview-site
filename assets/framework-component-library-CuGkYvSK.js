var e={answerHtml:`<h2>简答</h2>
<p>组件库的 API 一旦发布就很难改，设计时要先定好几件事：受控与非受控模式、样式扩展方式（className、CSS 变量、插槽）、无障碍契约（键盘操作、ARIA、焦点）。用文档和测试固定行为，用语义化版本号标识破坏性变更，并提供迁移指南和 codemod。组件库只放通用交互，业务逻辑留在应用里。</p>
<p>组件库一开始可能只有几个按钮和输入框，随着业务增加，问题会从“能不能复用”变成“升级后会不会破坏行为”。一个组件库的公共 API 不只是 props 类型，还包括默认行为、焦点、表单语义、主题、错误状态、CSS 覆盖方式和版本迁移。</p>
<h2>先把组件行为写成契约</h2>
<p>以按钮为例，至少要明确：<code>type</code> 默认值、loading 时是否禁用、键盘触发、错误如何展示、点击事件何时触发、是否支持链接语义和哪些变体组合。不要用多个互相矛盾的布尔值让消费者猜组合是否合法。</p>
<p>表单字段还要约定 label、帮助文字、错误关联、受控/非受控方式、空值表示和校验时机。组件内部有一份 state 不等于它可以无条件覆盖消费者传入的 value；受控组件应让外部值成为事实来源，并通过稳定事件通知变化。</p>
<h2>样式扩展要有稳定入口</h2>
<p>组件可以使用 CSS Modules、CSS variables、<code>data-*</code> 状态属性或明确的 class API 提供扩展。不要要求业务方依赖内部 DOM 层级、哈希类名或某次实现碰巧生成的选择器，否则每次重构都会成为破坏性变更。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.button</span> {
  <span class="hljs-attr">--button-bg</span>: <span class="hljs-number">#2563eb</span>;
  <span class="hljs-attr">--button-fg</span>: white;
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--button-fg);
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--button-bg);
}

<span class="hljs-selector-class">.button</span><span class="hljs-selector-attr">[data-variant=<span class="hljs-string">&quot;danger&quot;</span>]</span> {
  <span class="hljs-attr">--button-bg</span>: <span class="hljs-number">#b42318</span>;
}

<span class="hljs-selector-class">.button</span><span class="hljs-selector-attr">[data-loading=<span class="hljs-string">&quot;true&quot;</span>]</span> {
  <span class="hljs-attribute">cursor</span>: progress;
}
</code></pre></div>
<p>主题 token 和业务语义应分层。组件库不应知道订单是否允许退款；业务组合也不应通过覆盖内部节点来改变核心交互。样式优先级、<code>@layer</code>、Shadow DOM 和 Portal 的边界要在文档里写清楚。</p>
<h2>无障碍是组件的公共契约</h2>
<p>Button 应优先使用原生 <code>button</code>，Dialog 要处理名称、初始焦点、Escape 和关闭后的焦点恢复，Combobox 要处理输入、活动项和异步结果。组件库不能只把 role 和 aria 属性写上去，就把完整行为转给业务方。</p>
<p>每个复杂组件都应提供键盘路径、错误和 loading 状态的可访问名称，禁止把颜色作为唯一状态。自动化 axe 检查可以发现一部分结构错误，但还要用键盘和读屏器走真实任务；组件的可访问性问题会在所有消费方放大。</p>
<h2>文档和 Story 要覆盖状态，不只是截图</h2>
<p>每个组件的文档应说明何时使用、何时不用、受控方式、错误用法、键盘行为和主题扩展。Story 应覆盖默认、禁用、加载、错误、空数据、长文案、窄屏、暗色和 RTL 等关键状态，并尽量使用真实可操作的示例。</p>
<p>组件测试验证用户行为和公共 DOM 契约，视觉回归检查布局变化，端到端测试覆盖真实表单和路由。只比较快照很容易把错误的焦点、名称和点击行为漏掉；只跑单元测试也不能证明多个组件组合后的层叠和滚动正确。</p>
<h2>发布包要验证真正的消费者入口</h2>
<p>组件库的源码通过不代表 npm 包能用。发布前要检查 ESM/CJS、<code>exports</code>、类型声明、CSS 文件、peerDependencies、样式副作用和 tree shaking。独立创建一个消费者项目，按真实包名导入根入口和公开子路径，运行类型检查、构建和关键组件。</p>
<p>不要把 React/Vue 运行时和宿主打包两份，也不要把组件依赖的 polyfill 或全局样式偷偷注入所有应用。依赖共享、样式导入和浏览器目标要在文档中说明，避免使用者在生产中遇到开发环境没有的行为。</p>
<h2>版本升级要有迁移路径</h2>
<p>删除 props、改变默认按钮 type、修改错误触发时机、调整 CSS token 或改变 ref 行为，都可能是破坏性变更。SemVer 只是发布约定，前提是团队确实按照公共契约识别变更；自动生成版本号不能替代迁移说明。</p>
<p>弃用可以先保留兼容层并发出警告，再在明确版本移除；迁移文档要给出旧写法、新写法和行为差异。组件库还应记录浏览器、框架和辅助技术支持范围，不能因为在 Storybook 中展示成功就承诺所有 WebView 都兼容。</p>
<h2>组件库不能替业务状态和权限做决定</h2>
<p>组件可以提供 loading、错误和禁用显示，但提交是否幂等、用户是否有权限、数据是否保存成功仍由业务和服务端负责。一个 <code>disabled</code> 按钮不能阻止其他标签页或客户端调用接口；组件库也不应把用户数据写进全局 store 或永久缓存。</p>
<p>衡量组件库质量，应看业务是否更容易实现正确的交互、升级是否可预测、失败是否容易定位、无障碍和视觉回归是否持续验证，而不是只看组件数量或 Story 数量。</p>`};export{e as default};