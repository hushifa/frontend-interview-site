var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>await expect(page).toHaveScreenshot()</code> 首次运行时没有基线，测试会失败并写入当前截图作为基线，人工确认后再提交；之后每次与基线逐像素比较；基线文件名包含浏览器和平台，例如 <code>landing-chromium-linux.png</code>。</li>
<li>不同系统、浏览器版本、字体和显卡的渲染都有差异，基线应在固定的 CI 环境（例如官方 Docker 镜像）中生成和比较。</li>
<li>截图默认禁用动画（<code>animations: &#x27;disabled&#x27;</code>）并隐藏光标；时间、随机数据、广告等用 <code>mask</code> 遮住，或固定数据后再截图。</li>
<li><code>threshold</code>（默认 0.2）是单个像素允许的颜色差异，<code>maxDiffPixels</code> 和 <code>maxDiffPixelRatio</code> 是允许不同的像素数量或比例。</li>
<li>有意的界面变化用 <code>npx playwright test --update-snapshots</code> 更新基线，并在代码评审中检查新图。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { test, expect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;价格页&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-property">clock</span>.<span class="hljs-title function_">setFixedTime</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-01T10:00:00&#x27;</span>));
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/plans&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">route</span>) =&gt;</span>
    route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;fixtures/plans.json&#x27;</span> }),
  );
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/pricing&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;heading&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;选择套餐&#x27;</span> })).<span class="hljs-title function_">toBeVisible</span>();

  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">&#x27;pricing.png&#x27;</span>, {
    <span class="hljs-attr">fullPage</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">mask</span>: [page.<span class="hljs-title function_">getByTestId</span>(<span class="hljs-string">&#x27;live-chat&#x27;</span>)],
    <span class="hljs-attr">maxDiffPixelRatio</span>: <span class="hljs-number">0.01</span>,
  });
});
</code></pre></div>
<p><code>toHaveScreenshot</code> 会等待页面连续两次截图一致后再比较，可以减少截到渲染中间状态的情况。</p>
<h2>三个容差怎样选</h2>
<table><thead><tr><th>选项</th><th>含义</th><th>适合</th></tr></thead><tbody><tr><td><code>threshold</code></td><td>单个像素的颜色差异容忍度，0 最严格，1 最宽松</td><td>抗锯齿、渐变的细微色差</td></tr><tr><td><code>maxDiffPixels</code></td><td>允许不同的像素个数</td><td>小组件，少量像素噪声</td></tr><tr><td><code>maxDiffPixelRatio</code></td><td>允许不同的像素比例（0–1）</td><td>整页截图，尺寸不固定</td></tr></tbody></table>
<p>容差设得太大会漏掉真实问题，比如按钮少了 1px 边框。先通过固定环境和数据消除噪声，再用最小的容差。全局默认值可以在 <code>playwright.config.ts</code> 的 <code>expect.toHaveScreenshot</code> 中设置。</p>
<h2>让截图稳定</h2>
<ul>
<li>字体：使用本地托管的 Web 字体，避免系统字体差异。</li>
<li>时间：用 <code>page.clock</code> 固定时间。</li>
<li>数据：用 <code>page.route</code> 返回固定响应。</li>
<li>布局：固定视口大小，必要时用 <code>stylePath</code> 注入只在截图时生效的样式，隐藏滚动条或 iframe。</li>
<li>图片：等待图片加载完成后再截图。</li>
</ul>
<h2>组件级截图</h2>
<p>页面截图覆盖整体布局，组件截图更快、失败更容易定位：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;dialog&#x27;</span>)).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">&#x27;confirm-dialog.png&#x27;</span>);
</code></pre></div>
<p>用 Storybook 管理组件状态时，每个 story 固定一组 props 和数据，相当于一个视觉用例。Storybook 官方的像素比较依赖 Chromatic 云服务；不用云服务时，可以让 Playwright 逐个打开 story 的独立 iframe 页面截图：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { expect, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;

<span class="hljs-keyword">const</span> stories = [<span class="hljs-string">&#x27;datepicker--closed&#x27;</span>, <span class="hljs-string">&#x27;datepicker--open&#x27;</span>, <span class="hljs-string">&#x27;datepicker--invalid&#x27;</span>];

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> id <span class="hljs-keyword">of</span> stories) {
  <span class="hljs-title function_">test</span>(<span class="hljs-string">\`视觉：<span class="hljs-subst">\${id}</span>\`</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
    <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">\`/iframe.html?id=<span class="hljs-subst">\${id}</span>&amp;viewMode=story\`</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">locator</span>(<span class="hljs-string">&#x27;#storybook-root&#x27;</span>)).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">\`<span class="hljs-subst">\${id}</span>.png\`</span>);
  });
}
</code></pre></div>
<p>story ID 由 Storybook 按标题和导出名生成，以实际构建出的 <code>index.json</code> 为准；从这个文件读取列表，也能避免新增状态后忘记登记。状态按风险选取：关闭、展开、错误、禁用、长文案和窄容器，比穷举所有组合更有价值。</p>
<h2>基线管理</h2>
<ul>
<li>基线绑定运行环境，固定在 CI 使用的同一个容器镜像中生成，开发者本机生成的图片和 CI 不一致。</li>
<li>浏览器或字体升级会带来大量合理差异，单独提交一次基线更新，不和业务改动混在一起。</li>
<li>只更新本次明确改动的组件状态，不顺手接受其他失败；提交说明写清改了哪些状态、主题和视口。</li>
<li>第一次生成的基线也要人工确认，工具只记录当前外观，不知道设计是否正确。</li>
<li>删除组件或状态时同步删除旧基线。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>截图测试失败了怎么看？打开 HTML 报告，会并排显示期望图、实际图和差异图。先判断是有意修改、环境噪声还是真实回归，再决定更新基线还是修代码。</li>
</ul>`};export{e as default};