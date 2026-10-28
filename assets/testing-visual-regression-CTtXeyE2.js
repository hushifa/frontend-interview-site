var e={answerHtml:`<h2>简答</h2>
<ul>
<li>组件级视觉测试按状态单独渲染和截图，失败时能直接定位到组件和状态。</li>
<li>用例来自组件状态清单，一个 story 固定一组 props 和数据。</li>
<li>固定日期等输入，避免基线随时间变化。</li>
<li>状态按风险选取，不穷举所有组合。</li>
</ul>
<p>页面级截图一次覆盖很多组件，任何一处变化都会让整张图失败，定位成本高。组件级视觉测试把每个关键状态单独渲染、单独截图，失败时能直接看出是哪个组件的哪个状态变了。页面级截图稳定化和阈值选择见“视觉回归测试如何减少无意义的截图差异？”，这里只讲组件用例和基线管理。</p>
<h2>用例来自组件状态清单</h2>
<p>先为组件列出需要守住的外观状态，再让每个状态可以独立渲染。Storybook 的 story 就是这种形式：一个 story 固定一组 props 和数据，等于一个视觉用例。</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-comment">// DatePicker.stories.tsx</span>
<span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">Meta</span>, <span class="hljs-title class_">StoryObj</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@storybook/react-vite&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">DatePicker</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./DatePicker&#x27;</span>;

<span class="hljs-keyword">const</span> meta = { <span class="hljs-attr">component</span>: <span class="hljs-title class_">DatePicker</span> } <span class="hljs-keyword">satisfies</span> <span class="hljs-title class_">Meta</span>&lt;<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">DatePicker</span>&gt;;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> meta;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Story</span> = <span class="hljs-title class_">StoryObj</span>&lt;<span class="hljs-keyword">typeof</span> meta&gt;;

<span class="hljs-comment">// 固定日期，避免“今天”让基线每天变化</span>
<span class="hljs-keyword">const</span> today = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-string">&#x27;2026-01-15T00:00:00Z&#x27;</span>);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title class_">Closed</span>: <span class="hljs-title class_">Story</span> = { <span class="hljs-attr">args</span>: { today } };
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title class_">Open</span>: <span class="hljs-title class_">Story</span> = { <span class="hljs-attr">args</span>: { today, <span class="hljs-attr">defaultOpen</span>: <span class="hljs-literal">true</span> } };
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title class_">Invalid</span>: <span class="hljs-title class_">Story</span> = { <span class="hljs-attr">args</span>: { today, <span class="hljs-attr">error</span>: <span class="hljs-string">&#x27;日期不能早于今天&#x27;</span> } };
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title class_">LongLabel</span>: <span class="hljs-title class_">Story</span> = {
  <span class="hljs-attr">args</span>: { today, <span class="hljs-attr">label</span>: <span class="hljs-string">&#x27;预计送达日期（以快递实际签收时间为准）&#x27;</span> },
};
</code></pre></div>
<p>状态选取看风险：关闭、展开、错误、禁用、长文案和窄容器通常比穷举所有日期更有价值。暗色主题、RTL 是否进入矩阵，由产品支持范围决定。</p>
<h2>截图可以用开源工具完成</h2>
<p>Storybook 官方的像素比较能力依赖 Chromatic 云服务。不使用云服务时，可以让 Playwright 逐个打开 story 的独立 iframe 页面截图：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { expect, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;

<span class="hljs-keyword">const</span> stories = [<span class="hljs-string">&#x27;datepicker--closed&#x27;</span>, <span class="hljs-string">&#x27;datepicker--open&#x27;</span>, <span class="hljs-string">&#x27;datepicker--invalid&#x27;</span>];

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> id <span class="hljs-keyword">of</span> stories) {
  <span class="hljs-title function_">test</span>(<span class="hljs-string">\`视觉：<span class="hljs-subst">\${id}</span>\`</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
    <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">\`/iframe.html?id=<span class="hljs-subst">\${id}</span>&amp;viewMode=story\`</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">locator</span>(<span class="hljs-string">&#x27;#storybook-root&#x27;</span>)).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">\`<span class="hljs-subst">\${id}</span>.png\`</span>);
  });
}
</code></pre></div>
<p>截图范围限定在组件根节点，页面其他区域的变化不会干扰结果。story ID 列表也可以从 Storybook 构建出的 <code>index.json</code> 读取，避免新增状态后忘记登记。</p>
<h2>基线归属要和运行环境绑定</h2>
<p>同一个组件在不同浏览器、操作系统和字体下渲染结果不同。基线应按项目或平台分开存放，并固定生成基线的环境，通常是 CI 使用的同一个容器镜像。开发者本机生成的基线和 CI 不一致，会造成持续的假失败。</p>
<p>浏览器或字体升级会带来大量合理差异，应单独安排一次受控的基线更新，不要和业务改动混在同一个提交里。</p>
<h2>更新基线需要评审</h2>
<p>更新基线等于修改“预期外观”，应和代码一起评审：</p>
<ul>
<li>只更新本次明确改动的组件状态，不顺手接受其他失败；</li>
<li>提交说明写清改了哪些状态、主题和视口；</li>
<li>第一次生成的基线也要人工确认，工具只记录当前外观，不知道设计是否正确；</li>
<li>删除组件或状态时同步删除旧基线，避免仓库保留没人运行的图片。</li>
</ul>
<h2>组件级和页面级怎样分工</h2>
<p>组件级视觉测试适合守住设计系统和通用组件的外观，用例小、定位快。它看不到组件组合后的间距、页面布局和真实数据下的换行，这些仍需要少量关键页面截图来覆盖。两层都只证明“外观与基线一致”，可访问性、交互和业务正确性还要靠对应的测试。</p>`};export{e as default};