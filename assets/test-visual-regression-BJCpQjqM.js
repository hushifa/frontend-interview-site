var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>视觉回归测试就是给页面拍一张标准照，叫基线，以后每次运行都重新截图，和基线逐像素比较。Playwright 里写 <code>await expect(page).toHaveScreenshot()</code>，第一次运行没有基线，测试会失败并把当前截图存成基线，人工确认后再提交。</p>
<p>截图最怕的是无意义的差异。不同系统、浏览器版本、字体和显卡渲染出来都不一样，所以基线文件名里带着浏览器和平台，比如 <code>landing-chromium-linux.png</code>，而且应该在固定的 CI 环境里生成和比较，比如官方 Docker 镜像。</p>
<p>页面上的动态内容也要处理。截图默认会禁用动画、隐藏光标；时间、随机数据、广告这类东西，用 <code>mask</code> 遮住，或者先把数据固定下来。剩下的细微噪声再交给容差：<code>threshold</code> 管单个像素的颜色差多少算一样，默认 0.2；<code>maxDiffPixels</code> 和 <code>maxDiffPixelRatio</code> 管允许多少像素不同。</p>
<p>界面是有意改的，就用 <code>npx playwright test --update-snapshots</code> 更新基线，并且在代码评审里看一眼新图。</p>
</blockquote>
<h2>一个稳定的截图测试长什么样</h2>
<p>下面这个测试在截图前先固定了时间和接口数据，又遮住了在线客服窗口：</p>
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
<p>页面上显示的时间每次运行都不同，接口返回的价格也可能变，不处理的话每次截图都会有差异。所以先用 <code>page.clock</code> 把时间固定，用 <code>page.route</code> 返回固定的数据，再等标题出现，确认页面已经渲染好。</p>
<p>截图本身也有一层保护。<code>toHaveScreenshot</code> 会等页面连续两次截图一致后才去比较，这样就不容易截到渲染一半的样子。</p>
<h2>三个容差怎样选</h2>
<table><thead><tr><th>选项</th><th>含义</th><th>适合</th></tr></thead><tbody><tr><td><code>threshold</code></td><td>单个像素的颜色差异容忍度，0 最严格，1 最宽松</td><td>抗锯齿、渐变的细微色差</td></tr><tr><td><code>maxDiffPixels</code></td><td>允许不同的像素个数</td><td>小组件，少量像素噪声</td></tr><tr><td><code>maxDiffPixelRatio</code></td><td>允许不同的像素比例（0–1）</td><td>整页截图，尺寸不固定</td></tr></tbody></table>
<p>容差不是越大越好。设得太宽，按钮少了 1px 边框这种真实问题也会被放过去。正确的顺序是先通过固定环境和数据把噪声消掉，最后再用尽量小的容差兜底。全局默认值可以写在 <code>playwright.config.ts</code> 的 <code>expect.toHaveScreenshot</code> 里。</p>
<h2>还有哪些地方会让截图不稳定</h2>
<p>字体是一个大来源，系统字体在不同机器上不一样，所以用本地托管的 Web 字体。时间用 <code>page.clock</code> 固定，数据用 <code>page.route</code> 返回固定响应。视口大小要固定，必要时用 <code>stylePath</code> 注入只在截图时生效的样式，把滚动条或 iframe 隐藏掉。页面里有图片的话，等图片加载完再截图。</p>
<h2>组件也能单独截图</h2>
<p>整页截图能看到整体布局，组件截图更快，失败时也更容易看出是哪里坏了：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;dialog&#x27;</span>)).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">&#x27;confirm-dialog.png&#x27;</span>);
</code></pre></div>
<p>如果用 Storybook 管理组件状态，每个 story 固定了一组 props 和数据，本身就相当于一个视觉用例。Storybook 官方的像素比较依赖 Chromatic 云服务；不用云服务的话，可以让 Playwright 逐个打开 story 的独立 iframe 页面截图：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { expect, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;

<span class="hljs-keyword">const</span> stories = [<span class="hljs-string">&#x27;datepicker--closed&#x27;</span>, <span class="hljs-string">&#x27;datepicker--open&#x27;</span>, <span class="hljs-string">&#x27;datepicker--invalid&#x27;</span>];

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> id <span class="hljs-keyword">of</span> stories) {
  <span class="hljs-title function_">test</span>(<span class="hljs-string">\`视觉：<span class="hljs-subst">\${id}</span>\`</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
    <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">\`/iframe.html?id=<span class="hljs-subst">\${id}</span>&amp;viewMode=story\`</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">locator</span>(<span class="hljs-string">&#x27;#storybook-root&#x27;</span>)).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">\`<span class="hljs-subst">\${id}</span>.png\`</span>);
  });
}
</code></pre></div>
<p>story ID 是 Storybook 按标题和导出名生成的，以实际构建出来的 <code>index.json</code> 为准。直接从这个文件读列表，新增状态后也不会忘记登记。状态不用穷举，按风险挑：关闭、展开、错误、禁用、长文案、窄容器，这几种比所有组合都截一遍更有价值。</p>
<h2>基线图片怎样管理</h2>
<p>基线是绑定运行环境的。它要在 CI 用的同一个容器镜像里生成，开发者本机生成的图和 CI 不一致，提交上去只会让 CI 失败。</p>
<p>浏览器或字体升级时，会出现一大批合理的差异。这种基线更新要单独提交一次，不要和业务改动混在一起。平时更新基线，也只更新本次明确改过的组件状态，不要顺手把其他失败一起接受了；提交说明里写清改了哪些状态、主题和视口。</p>
<p>第一次生成的基线同样要人工确认，因为工具只是记下当前长什么样，不知道设计对不对。组件或状态删掉时，旧基线也一起删掉。</p>
<h2>常见追问</h2>
<p><strong>截图测试失败了，怎么看？</strong></p>
<blockquote>
<p>打开 HTML 报告，里面会把期望图、实际图和差异图并排放着。先判断这是有意的修改、环境噪声，还是真的回归了，再决定是更新基线还是去修代码。</p>
</blockquote>`};export{e as default};