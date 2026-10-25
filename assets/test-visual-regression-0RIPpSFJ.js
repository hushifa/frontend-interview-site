var e={answerHtml:`<p>视觉回归把当前界面截图与审核过的基线比较，帮助发现普通 DOM 断言不容易捕捉的问题：按钮挤出容器、文字被裁剪、弹层错位或颜色意外变化。</p>
<p>但截图是渲染结果，既受应用代码影响，也受字体、浏览器、系统和数据影响。减少无意义差异的第一步是稳定这些输入，不是直接调大容忍阈值。</p>
<h3>等待明确的页面状态再截图</h3>
<p>假设测试页面提供固定数据的用户卡片，以下片段运行在已有 Playwright 用例中：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/fixtures/profile-card&#x27;</span>);
<span class="hljs-keyword">const</span> card = page.<span class="hljs-title function_">getByTestId</span>(<span class="hljs-string">&#x27;profile-card&#x27;</span>);
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(card.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;heading&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;张三&#x27;</span> })).<span class="hljs-title function_">toBeVisible</span>();
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">evaluate</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-property">ready</span>);
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(card).<span class="hljs-title function_">toHaveScreenshot</span>(<span class="hljs-string">&#x27;profile-card.png&#x27;</span>, {
  <span class="hljs-attr">animations</span>: <span class="hljs-string">&#x27;disabled&#x27;</span>,
});
</code></pre></div>
<p>固定数据的 fixture 页面用于控制场景，不能拿任意线上数据直接套这个基线。等待字体就绪可以减少字体替换造成的差异，但它不代表所有图片、Canvas 或业务请求都已完成；这些仍要有相应就绪条件。</p>
<p>toHaveScreenshot 会等待截图达到相应稳定比较条件，但“连续两张图相同”也可能只是一个稳定的加载占位。必须先断言真正目标内容出现，再进行像素比较。</p>
<h3>先固定影响渲染的环境</h3>
<p>视口和设备像素比会影响排版与输出尺寸；系统和字体版本会影响字形与抗锯齿；浏览器版本、运行模式及渲染环境也可能产生不同结果。</p>
<p>基线应尽量在与 CI 相同的环境中生成。如果需要覆盖多个浏览器或平台，建立明确的项目和对应基线，不要把某台开发机的截图当成所有平台都必须逐像素一致的标准。</p>
<p>时间、随机数和接口数据同样要控制。日期控件的“今天”、轮播位置或头像加载失败都可能改变图像。优先在测试输入层固定条件，而不是事后遮住整个组件。</p>
<h3>动态区域可以屏蔽，但要知道损失了什么</h3>
<p>时间戳、外部广告或无法控制的用户头像可以使用 mask 等机制排除，但被遮罩区域内部的颜色、内容和细节也不再接受比较。遮罩不是把数据变正确，只是声明这部分不由当前像素断言覆盖。</p>
<p>如果要测头像布局，最好提供固定测试图片；如果要测时钟样式，固定时间更合适。只有与当前目标无关的动态内容才适合屏蔽，不能为了让测试通过遮住报错区域。</p>
<p>动画禁用也有具体行为：有限动画可能被推进到结束状态，无限动画可能被取消并在之后恢复。需要验证动画中间帧时，应设计专门的控制方式，而不是沿用普通静态截图设置。</p>
<h3>截图范围决定发现什么问题</h3>
<p>组件截图通常更稳定，失败更容易定位；整页截图能发现组件间距和整体布局回归，却更容易受无关区域影响。可以按风险组合使用，而不是只给每个页面生成一张超长图。</p>
<p>全页截图还可能触发滚动和懒加载相关差异。虚拟列表根本没有挂载的行，不会因为 fullPage 就自动全部出现；需要专门的展示或导出场景。</p>
<p>截图相同不代表按钮可点击、请求成功或焦点正确。视觉测试负责发现表现差异，行为断言和无障碍测试负责其他契约。稳定的输入让差异更可信，但最终仍需判断它是预期改版还是回归。</p>`};export{e as default};