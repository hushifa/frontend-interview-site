var e={answerHtml:`<h2>截图测试到底在验证什么</h2>
<p>DOM 断言可以确认按钮存在、文字正确和接口返回成功，但不容易发现按钮被挤出容器、文字被裁剪、弹层偏移或颜色意外改变。视觉回归把页面渲染结果保存为经过审核的基线，下一次运行时比较差异。</p>
<p>它验证的是像素层表现，不是完整行为。截图没有变化，不代表按钮能点击、焦点顺序正确或请求真的成功；截图发生差异，也不一定是缺陷，可能只是基线环境或字体发生变化。</p>
<h2>先准备稳定且有意义的页面状态</h2>
<p>不要直接拿线上随机数据生成基线。使用固定 fixture、固定时间、固定随机种子和可控图片，并在截图前断言真正的业务内容已经出现：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/fixtures/profile-card&#x27;</span>);
<span class="hljs-keyword">const</span> card = page.<span class="hljs-title function_">getByTestId</span>(<span class="hljs-string">&#x27;profile-card&#x27;</span>);
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(card.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;heading&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;张三&#x27;</span> })).<span class="hljs-title function_">toBeVisible</span>();
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">evaluate</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-property">ready</span>);
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(card).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">&#x27;profile-card.png&#x27;</span>, {
  <span class="hljs-attr">animations</span>: <span class="hljs-string">&#x27;disabled&#x27;</span>,
});
</code></pre></div>
<p>字体就绪不代表图片、Canvas、接口和异步组件都完成。应为这些依赖提供明确的就绪条件，而不是只等待固定的毫秒数。连续两张截图相同也可能只是一个稳定的加载占位，必须先验证目标内容。</p>
<p>测试环境最好使用与 CI 相同的浏览器、操作系统、字体、视口、设备像素比和渲染模式。若需要支持多个平台，就分别维护基线，不要把开发机截图当成所有平台的唯一标准。</p>
<h2>差异应该先判断原因</h2>
<p>截图失败后先查看 diff 和实际截图，区分布局变化、字体变化、动画时序、数据变化和环境变化。不能看到失败就直接执行“更新基线”，否则真实回归会被错误地批准。</p>
<p>时间戳、广告、随机头像和外部内容可以用固定数据替代。确实无法控制且与当前断言无关的区域可以使用 mask，但被遮住的区域内部不再接受比较。遮罩不能用来覆盖错误提示、空白内容或一个本应稳定的组件。</p>
<p>动画测试要单独设计。静态截图通常禁用动画，检查最终布局；需要验证过渡中间帧时，应控制时间线和截图时刻，不能把普通静态配置拿来判断动画质量。</p>
<h2>组件截图和整页截图各自负责什么</h2>
<p>组件截图容易稳定、定位清晰，适合按钮、表单、弹窗和卡片。整页截图适合发现页面间距、全局字体和布局容器变化，但更容易受到无关区域、懒加载和滚动位置影响。高风险页面可以两者结合，而不是所有页面都只拍一张超长图。</p>
<p>全页截图不会自动挂载虚拟列表中没有渲染的行，也不能保证滚动触发的图片已经加载。需要验证打印、导出或完整数据时，应准备专门的静态展示场景。</p>
<h2>基线应该经过审核和版本管理</h2>
<p>第一次生成的截图不是事实，它只是候选基线。提交基线时要说明对应浏览器、视口、数据 fixture 和预期改动。代码审查应同时看到差异图和变更原因，不能让 CI 自动批准所有新截图。</p>
<p>基线应和代码一起版本管理，并在浏览器或字体升级时有计划地重新生成。若只在某台本地机器更新，其他开发者和 CI 可能持续产生无法解释的差异。</p>
<p>视觉回归应与行为、无障碍和性能测试配合。它最擅长发现用户看到的变化，但不能独立证明交互契约、键盘操作、网络错误和内容语义都正确。</p>`};export{e as default};