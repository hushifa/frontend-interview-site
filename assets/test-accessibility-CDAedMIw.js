var e={answerHtml:`<p>自动化工具可以发现很多可规则化的问题，例如表单缺少名称、部分 ARIA 使用错误和某些颜色对比不足。但它很难判断“这段说明是否能让用户理解”“错误后应该把焦点放在哪里”以及实际读屏操作是否顺畅。</p>
<p>所以扫描通过的准确含义是：在当前页面状态、当前工具规则与配置下，没有发现所报告的违规。它不是完整无障碍体验或合规性的证明。</p>
<h3>页面状态决定扫描看到了什么</h3>
<p>首页初始状态没有弹窗，不代表弹窗打开后也没有问题。表单错误、折叠菜单、加载结果和禁用状态都可能形成新的可访问性风险。</p>
<p>下面是假设有“编辑资料”弹窗的 Playwright 用例，需要安装 @axe-core/playwright 并配置实际测试站点：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { expect, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-title class_">AxeBuilder</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@axe-core/playwright&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;编辑弹窗打开后没有自动检测到的违规&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/profile&#x27;</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;编辑资料&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;dialog&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;编辑资料&#x27;</span> })).<span class="hljs-title function_">toBeVisible</span>();

  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">AxeBuilder</span>({ page }).<span class="hljs-title function_">analyze</span>();
  <span class="hljs-title function_">expect</span>(result.<span class="hljs-property">violations</span>).<span class="hljs-title function_">toEqual</span>([]);
});
</code></pre></div>
<p>测试先进入目标状态再扫描。若只限定扫描某个组件，会减少无关噪声，但可能漏掉整个文档层面的结构问题，所以局部与整页检查应有明确分工。</p>
<p>工具结果里需要人工复核的项目也不应被忽略。为了清零而禁用规则或排除复杂区域，只会缩小检测范围，不会让用户更容易使用。</p>
<h3>键盘测试要验证完整操作路径</h3>
<p>不使用鼠标完成打开弹窗、移动焦点、提交、处理错误和关闭。检查焦点是否可见，是否进入合理控件，是否被挡在视口外，关闭后是否返回合理位置。</p>
<p>弹窗通常还需要限制背景交互，防止 Tab 跑到不可见的背景按钮；但非模态弹层与模态弹窗并不采用完全相同规则。应按组件模式验证，而不是所有浮层都强行套一个焦点陷阱。</p>
<p>自动化可以模拟键盘并检查 document.activeElement，但这仍不能完整替代实际辅助技术体验。焦点放对了，不代表用户听到的名称、状态和操作说明也正确。</p>
<h3>名称存在不代表名称准确</h3>
<p>图片有 alt 属性，工具可能不再报告“缺少替代文本”，但 alt=&quot;图片&quot; 对理解订单状态帮助很小。反过来，纯装饰图可能应该使用空替代文本，避免给用户增加噪声。</p>
<p>类似地，多个按钮都叫“点击这里”、错误提示只写“失败”，可能满足某些结构规则却难以完成任务。需要结合上下文判断说明是否清楚、内容是否重复、动态结果是否在合适时机播报。</p>
<h3>真实体验还包括缩放和视觉设置</h3>
<p>检查文本放大与页面缩放后是否丢失内容，窄视口下能否访问关键操作，高对比或强制颜色模式下控件是否仍可辨认。截图看着正常，不代表键盘焦点或状态变化对用户清晰。</p>
<p>对动态通知，确认读屏能适时感知而不会反复打断；对复杂表格和组合控件，确认角色、层级和操作方式符合用户预期。不同浏览器与辅助技术组合可能存在差异，应覆盖目标用户常用组合。</p>
<p>有效做法是把自动扫描放进日常回归，用键盘和人工辅助技术检查验证关键流程，并持续吸收真实用户反馈。自动化擅长快速拦住重复出现的基础错误，人工判断负责它看不到的语义和体验。</p>`};export{e as default};