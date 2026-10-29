var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>无障碍验收分两部分：工具扫一遍，再由人实际用一遍。axe 这类工具能发现缺失 alt、对比度不足、按钮没有名称、ARIA 属性写错等问题，但它判断不了名称有没有意义、焦点顺序合不合理、播报是否及时。</p>
<p>所以在 CI 里用 axe（例如 <code>@axe-core/playwright</code>）扫描关键页面的主要状态，防止明显问题回归。人工验收至少要做四件事：只用键盘完成流程，用读屏走一遍，放大到 200% 和 400%，开启减少动态效果。</p>
<p>读屏器和浏览器的组合各有差异。常用的是 Windows 上 NVDA 配 Chrome 或 Firefox，macOS 和 iOS 上 VoiceOver 配 Safari，Android 上 TalkBack 配 Chrome。</p>
<p>每发现一个问题，都要记下环境、操作步骤、实际播报和期望结果，修复以后才能照着复测。</p>
</blockquote>
<h2>自动化扫描怎么写</h2>
<p>下面用 Playwright 打开设置页，展开一个面板，再交给 axe 扫描。</p>
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
<p>为什么要先点“高级选项”？因为 axe 只检查当前页面上有的东西。不打开弹窗、不展开面板就扫，查到的只是默认状态。确实需要暂时忽略某条规则时，写明原因和负责人，不要整体关掉。</p>
<p>扫描范围也有讲究。用 <code>.include()</code> 只扫某个组件，噪声少、定位快；可是标题层级、地标、重复 ID 这类问题，只有扫整页才看得出来。所以两种扫描不能互相代替。</p>
<p>还要看 <code>results.incomplete</code>。这里放的是工具没法自动下结论的项，比如部分对比度检查，同样要人去确认。</p>
<h2>工具通过了，为什么还不够</h2>
<p>工具只看结构，不懂内容。有 <code>alt</code> 不代表替代文本写对了，链接文字写成“点击这里”、错误提示只写“失败”，扫描也看不出它们没用。</p>
<p>反过来，也不要为了消掉警告随手加 ARIA。角色或状态写错了，可能比不加 ARIA 还难用。</p>
<h2>人工要检查什么</h2>
<p>键盘这一项，要确认 Tab 顺序和视觉顺序一致，所有操作都能用键盘完成；焦点一直看得见，不被固定头部挡住（WCAG 2.4.11）；弹窗打开时焦点进去，关闭后回到触发按钮。还要注意，只有模态对话框需要把焦点限制在里面，非模态提示、下拉菜单和组合框各有自己的键盘规则，不要统一套上焦点陷阱。</p>
<p>读屏这一项，要确认按标题和地标跳转能看懂页面结构；每个控件都读出名称、角色和状态，比如“通知，开关，已打开”；加载完成、保存成功、校验出错时都能听到播报。</p>
<p>视觉这一项，要确认放大到 400% 时不用横向滚动也能阅读（WCAG 1.4.10）；加大文字间距后内容不重叠、不截断（WCAG 1.4.12）；开启减少动态效果后，没有大幅移动的动画。</p>
<h2>什么时候找真实用户</h2>
<p>开发者自己用读屏，和长期靠读屏上网的用户，熟练程度差别很大。注册、支付这类核心流程发布前，邀请使用辅助技术的用户一起测试，能发现清单覆盖不到的问题。</p>
<h2>常见追问</h2>
<p><strong>axe 报告零问题，就算符合 WCAG 了吗？</strong></p>
<blockquote>
<p>不算。自动化能覆盖的成功准则有限，是否符合要靠人工评估。下结论时还要写明测试了哪些页面、用的什么环境。</p>
</blockquote>`};export{e as default};