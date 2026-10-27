var e={answerHtml:`<h2>“没有违规”到底证明了什么</h2>
<p>axe 这类工具会根据规则检查当前 DOM，例如表单控件是否有可访问名称、ARIA 属性是否组合正确、部分文字和背景的对比度是否足够。它能快速发现重复出现的结构问题，但只能证明“在当前页面状态、当前规则配置下没有检测到这些违规”。</p>
<p>它无法判断“错误提示是否让用户知道怎么修复”“弹窗关闭后焦点应该回到哪里”“一组按钮的文字是否真的容易理解”，也不能完全模拟每种读屏器和浏览器组合。自动化通过不是合规证明，更不是用户体验完成。</p>
<h2>先把页面带到真实状态再扫描</h2>
<p>首页没有弹窗，并不代表弹窗打开、表单报错、列表为空和异步结果出现后没有问题：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { test, expect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-title class_">AxeBuilder</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@axe-core/playwright&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;编辑资料的错误状态可访问&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/profile&#x27;</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;编辑资料&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">const</span> dialog = page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;dialog&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;编辑资料&#x27;</span> });
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(dialog).<span class="hljs-title function_">toBeVisible</span>();

  <span class="hljs-keyword">await</span> dialog.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;保存&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(dialog.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;alert&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();

  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">AxeBuilder</span>({ page }).<span class="hljs-title function_">analyze</span>();
  <span class="hljs-title function_">expect</span>(result.<span class="hljs-property">violations</span>).<span class="hljs-title function_">toEqual</span>([]);
});
</code></pre></div>
<p>扫描前要先等待真实内容、错误消息和字体加载完成。局部扫描可以减少噪声并定位组件问题，整页扫描才能发现文档层级、地标和重复 ID 等问题，两者不能互相替代。被工具标记为“需要人工判断”的项目也要处理，不能为了让报告变绿而关闭规则或排除整个组件。</p>
<h2>键盘测试关注的是完整路径</h2>
<p>用键盘完成打开、填写、提交、处理错误和关闭，而不是只验证 Tab 能移动。检查焦点是否可见、顺序是否符合任务、是否被隐藏元素截获、错误出现后是否能到达，以及关闭弹窗后是否回到触发它的按钮。</p>
<p>模态对话框通常需要限制背景交互和管理焦点，但非模态提示、下拉菜单和组合框采用不同规则。不要把所有浮层都套上同一个焦点陷阱，否则可能让合法的页面导航失效。<code>document.activeElement</code> 断言能验证焦点位置，却不能说明读屏器会如何播报名称和状态。</p>
<h2>语义和文案需要人工判断</h2>
<p>图片有 <code>alt</code> 属性，不代表替代文本正确。商品状态图标可能需要说明“已发货”，装饰线条反而应该用空替代文本。多个按钮都写“点击这里”，或者错误提示只写“失败”，可能通过结构扫描，却无法帮助用户完成任务。</p>
<p>动态结果还要验证是否在合适时机播报，不能每次输入都打断读屏器。表格、树、菜单和组合控件应使用与实际交互匹配的语义，不要为了消除警告随意添加 ARIA。错误的 ARIA 可能比没有 ARIA 更难使用。</p>
<h2>视觉设置和真实辅助技术也要测试</h2>
<p>放大文字、页面缩放、窄视口、高对比和强制颜色模式下，内容和关键操作仍应可访问。截图正常不代表键盘焦点清晰，颜色对比通过也不代表状态只依靠颜色表达。</p>
<p>关键流程要在目标浏览器和常用读屏器组合中实际完成，例如登录、表单校验、弹窗、表格筛选和支付确认。人工测试不需要覆盖每个页面，但应覆盖组件共享的交互模式和最高风险流程。</p>
<h2>把自动化和人工检查放进同一闭环</h2>
<p>自动扫描适合在 CI 中拦截重复的基础问题，键盘脚本适合回归焦点路径，人工辅助技术测试负责语义和任务可完成性。每个已知例外应记录原因、影响范围和修复计划，而不是永久静默。</p>
<p>真正的无障碍结论应同时说明：自动规则覆盖了什么、人工走过哪些流程、哪些浏览器与辅助技术组合已验证、哪些场景仍存在不确定性。这样测试报告才不会把一个绿色数字误读成所有用户都能顺利使用。</p>`};export{e as default};