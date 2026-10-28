var e={answerHtml:`<h2>简答</h2>
<ul>
<li>自动化检查能发现缺失 alt、对比度不足、无名称按钮、ARIA 属性错误等，但无法判断名称是否有意义、焦点顺序是否合理、播报是否及时。</li>
<li>在 CI 中用 axe（例如 <code>@axe-core/playwright</code>）扫描关键页面的主要状态，防止明显问题回归。</li>
<li>人工验收至少覆盖：只用键盘完成流程、读屏走一遍、放大到 200% 和 400%、开启减少动态效果。</li>
<li>读屏组合各有差异，常用的是 Windows 上 NVDA + Chrome/Firefox、macOS 和 iOS 上 VoiceOver + Safari、Android 上 TalkBack + Chrome。</li>
<li>每个问题要记下环境、操作步骤、实际播报和期望结果，便于修复后复测。</li>
</ul>
<h2>自动化扫描</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { test, expect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-title class_">AxeBuilder</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@axe-core/playwright&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;设置页没有可自动检测的无障碍问题&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/settings&#x27;</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;高级选项&#x27;</span> }).<span class="hljs-title function_">click</span>();

  <span class="hljs-keyword">const</span> results = <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">AxeBuilder</span>({ page })
    .<span class="hljs-title function_">withTags</span>([<span class="hljs-string">&#x27;wcag2a&#x27;</span>, <span class="hljs-string">&#x27;wcag2aa&#x27;</span>, <span class="hljs-string">&#x27;wcag22aa&#x27;</span>])
    .<span class="hljs-title function_">analyze</span>();

  <span class="hljs-title function_">expect</span>(results.<span class="hljs-property">violations</span>).<span class="hljs-title function_">toEqual</span>([]);
});
</code></pre></div>
<p>先打开弹窗、展开面板，再扫描，否则只检查了默认状态。确实需要暂时忽略的规则，写明原因和负责人，不要整体关闭。</p>
<h2>人工检查清单</h2>
<p><strong>键盘</strong></p>
<ul>
<li>Tab 顺序和视觉顺序一致，所有操作都能用键盘完成。</li>
<li>焦点始终可见，不被固定头部遮挡（WCAG 2.4.11）。</li>
<li>弹窗打开时焦点进入，关闭后回到触发按钮。</li>
</ul>
<p><strong>读屏</strong></p>
<ul>
<li>按标题和地标导航能理解页面结构。</li>
<li>每个控件读出名称、角色和状态，例如“通知，开关，已打开”。</li>
<li>加载完成、保存成功、校验错误能被播报。</li>
</ul>
<p><strong>视觉</strong></p>
<ul>
<li>放大到 400% 时内容不需要横向滚动就能阅读（WCAG 1.4.10）。</li>
<li>增大文字间距后内容不重叠、不截断（WCAG 1.4.12）。</li>
<li>开启减少动态效果后没有大幅移动的动画。</li>
</ul>
<h2>什么时候找真实用户</h2>
<p>自己用读屏和长期依赖读屏的用户差别很大。核心流程（注册、支付）发布前，邀请使用辅助技术的用户参与测试，能发现清单覆盖不到的问题。</p>
<h2>常见追问</h2>
<ul>
<li>axe 报告零问题就算符合 WCAG 吗？不算。自动化能覆盖的成功准则有限，符合性需要人工评估，结论要写明测试范围和环境。</li>
</ul>`};export{e as default};