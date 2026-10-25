var e={answerHtml:`<p>页面铺满手机屏幕后，内容可能进入刘海、圆角或底部手势区域。背景延伸到这些位置通常没问题，但“提交”按钮和文字不能因此被遮挡或难以点击。</p>
<p>安全区域适配就是把背景覆盖范围与重要内容可用范围分开：背景可以铺满，内容根据浏览器提供的安全边距向内避让。</p>
<h3>先明确页面是否采用边缘到边缘布局</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1, viewport-fit=cover&quot;</span> /&gt;</span>
</code></pre></div>
<p>viewport-fit=cover 允许页面覆盖设备显示区域，随后应使用安全区域变量保护重要内容。它不是“自动帮所有元素加好 padding”。不需要边缘到边缘设计时，也不必为了追求全屏而强行开启。</p>
<p>不要通过禁用缩放来解决布局溢出。安全区域和用户缩放是不同问题，表单和正文仍应允许用户正常放大。</p>
<h3>将设计间距与安全边距组合</h3>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.bottom-actions</span> {
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">12px</span> <span class="hljs-number">16px</span>;
  <span class="hljs-attribute">padding-bottom</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-number">12px</span> + <span class="hljs-built_in">env</span>(safe-area-inset-bottom, <span class="hljs-number">0px</span>));
  <span class="hljs-attribute">padding-left</span>: <span class="hljs-built_in">max</span>(<span class="hljs-number">16px</span>, <span class="hljs-built_in">env</span>(safe-area-inset-left, <span class="hljs-number">0px</span>));
  <span class="hljs-attribute">padding-right</span>: <span class="hljs-built_in">max</span>(<span class="hljs-number">16px</span>, <span class="hljs-built_in">env</span>(safe-area-inset-right, <span class="hljs-number">0px</span>));
  <span class="hljs-attribute">background</span>: white;
}
</code></pre></div>
<p>底部使用相加，表示安全边距之外还保留 12 像素设计间距；左右使用 max，表示至少满足设计间距和安全边距两者中更大的一个。这两种写法表达不同意图，没有一个能不加思考地适用于所有方向。</p>
<p>env 的 fallback 在环境变量不存在时生效；若浏览器提供的值是 0，就使用 0，而不是因为“没有刘海”再触发 fallback。前面的普通 padding 也提供基础布局，避免在不支持相关表达式时完全丢失间距。</p>
<p>安全区域变量按屏幕物理边缘命名，不应简单把 left/right 替换成逻辑方向。RTL 改变阅读方向，不会把设备刘海搬到另一边。</p>
<h3>固定底栏还会覆盖正文</h3>
<p>给底栏自己加 padding 只能保护栏内按钮，不能自动给正文留空间。如果底栏 position: fixed 脱离文档流，正文最后几行仍可能被整个底栏盖住。</p>
<p>可以让页面使用正常流中的布局，或者给滚动内容预留底栏实际占用高度，包含安全边距。若按钮换行、字体放大或工具栏内容变化，高度不能继续假定为一个固定常量；必要时通过测量更新预留量。</p>
<p>也不要让父容器和底栏同时重复加入同一份安全边距，造成底部空白翻倍。应明确由哪一层负责哪一侧的避让。</p>
<h3>安全区域不是固定的机型数字</h3>
<p>横竖屏、浏览器显示模式、独立 PWA 和系统 UI 都可能影响环境值。把某款手机的 34 像素写死，可能在另一种状态下留白过多，或完全没有避开遮挡。</p>
<p>通常让 CSS 直接使用 env，随环境更新，比在启动时读取一次后永久保存更合理。横屏尤其要检查左右边缘，而不只关注底部。</p>
<h3>键盘需要另外判断</h3>
<p>safe-area-inset-bottom 不是所有浏览器通用的键盘高度接口。键盘出现时，浏览器可能调整视觉视口、布局视口或采用覆盖模式，行为还与平台配置有关。</p>
<p>如果页面已经因键盘收缩了可用高度，又额外把推测键盘高度和安全边距全部加进去，可能出现双重避让。应先确认当前视口策略，再决定需要哪一层补偿。</p>
<p>验证时检查真实设备的纵向、横向、浏览器和独立显示模式，观察按钮点击区域、正文末尾与背景延伸。桌面窄屏可以检查基本响应式布局，但不能证明设备安全区域和系统手势体验已经正确。</p>`};export{e as default};