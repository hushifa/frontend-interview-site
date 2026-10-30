var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>最常被问到的是日期。后端返回 <code>&#x27;2026-10-30 12:30&#x27;</code>，直接 <code>new Date()</code> 在有的浏览器里能用，换个浏览器就是 Invalid Date。原因是规范只保证 <code>2026-10-30T12:30</code> 这种带 <code>T</code> 的格式，中间用空格的写法属于非标准格式，怎么解析由浏览器自己决定。稳妥的办法是自己拆出年月日时分，再用 <code>new Date(年, 月 - 1, 日, 时, 分)</code> 构造。</p>
<p>第二类是点击。早期移动浏览器在 <code>touchend</code> 之后要等大约 300 毫秒才发 <code>click</code>，因为要看用户是不是在双击缩放。现在页面写了 <code>&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width&quot;&gt;</code>，Chrome 32 起和 iOS 9.3 起都不再等。这个延迟还会引出点击穿透：在 <code>touchend</code> 里关掉遮罩，稍后补发的 <code>click</code> 落到了遮罩下面的元素上。</p>
<p>第三类是滚动穿透：弹窗里的列表滚到底，再往下滑，后面的页面跟着滚了。这叫滚动链，可以给弹窗的滚动容器写 <code>overscroll-behavior: contain</code> 截住。</p>
<p>最后是输入框被键盘挡住，要按可视视口去调整布局。这些问题的表现和机型、浏览器版本有关，结论一定要在 iOS 和 Android 真机上验证。</p>
</blockquote>
<h2>为什么同一个日期字符串有的手机能解析，有的不行</h2>
<p>ECMAScript 只规定了一种必须支持的日期时间格式，就是 <code>toISOString()</code> 输出的那种，例如 <code>2026-10-30T12:30:00</code>。MDN 写得很明确：带时间时，中间的 <code>T</code> 是必需的；不符合这个格式的字符串，引擎可以按任意方式解析，包括时区怎么算。所以 <code>&#x27;2026-10-30 12:30&#x27;</code>、<code>&#x27;2026/10/30&#x27;</code> 这类写法能不能解析、解析成哪个时刻，各个浏览器可以不一样，解析失败就得到 Invalid Date，<code>getTime()</code> 返回 <code>NaN</code>。</p>
<p>即使用了标准格式，还有一个时区的坑：只有日期、没写时区时按 UTC 解释，带了时间、没写时区时按本地时间解释。MDN 说这是一个历史上的规范错误，为了兼容已有网页没法改。下面两行是同一个时刻，因为纯日期被当成了 UTC 零点：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;2019-01-01&#x27;</span>)); <span class="hljs-comment">// 1546300800000</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;2019-01-01T00:00:00Z&#x27;</span>)); <span class="hljs-comment">// 1546300800000</span>
</code></pre></div>
<p>所以最省心的做法是不要把非标准字符串交给 <code>Date</code> 去猜。下面自己拆出各个数字，用多参数的 <code>Date</code> 构造函数创建本地时间，这条路径在所有环境里行为一致：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseLocalDateTime</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">const</span> [datePart, timePart = <span class="hljs-string">&#x27;00:00&#x27;</span>] = text.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27; &#x27;</span>);
  <span class="hljs-keyword">const</span> [year, month, day] = datePart.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;-&#x27;</span>).<span class="hljs-title function_">map</span>(<span class="hljs-title class_">Number</span>);
  <span class="hljs-keyword">const</span> [hour, minute, second = <span class="hljs-number">0</span>] = timePart.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;:&#x27;</span>).<span class="hljs-title function_">map</span>(<span class="hljs-title class_">Number</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(year, month - <span class="hljs-number">1</span>, day, hour, minute, second);
}

<span class="hljs-keyword">const</span> time = <span class="hljs-title function_">parseLocalDateTime</span>(<span class="hljs-string">&#x27;2026-10-30 12:30&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(time.<span class="hljs-title function_">getFullYear</span>()); <span class="hljs-comment">// 2026</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(time.<span class="hljs-title function_">getMonth</span>() + <span class="hljs-number">1</span>); <span class="hljs-comment">// 10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(time.<span class="hljs-title function_">getHours</span>()); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p>读者可能会问月份为什么要减 1。<code>Date</code> 构造函数的月份从 0 开始，0 表示一月，所以传进去要减 1，读出来要加 1。另外，如果字符串表示的是服务器所在时区或 UTC 的时间，就不能当本地时间构造，最好让后端直接返回带时区的 ISO 字符串或时间戳。</p>
<h2>300ms 点击延迟是怎么来的，现在还有吗</h2>
<p>手机浏览器支持“双击放大文字”。用户点了一下，浏览器不知道第二下会不会马上跟来，只好在 <code>touchend</code> 之后等一会儿再发 <code>click</code>。Chrome 的文章说这段等待大约 300 到 350 毫秒，WebKit 的文章给出的是 350 毫秒。</p>
<p>后来浏览器的思路是：页面已经针对手机适配了，就不需要双击放大。Chrome 32 起，只要页面写了 <code>width=device-width</code> 的 viewport，就去掉这段延迟，同时保留双指缩放；WebKit 在 iOS 9.3 做了类似的修改，禁止缩放的页面同样不再延迟。如果没法改 viewport，可以给元素写 <code>touch-action: manipulation</code>，它只允许平移和双指缩放，关掉了双击缩放，浏览器也就不用等了。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1&quot;</span>&gt;</span>
</code></pre></div>
<p>所以今天遇到“点击慢半拍”，先检查 viewport 有没有写对，而不是急着引入 FastClick 这类旧库。Chrome 的文章也提到，给所有元素绑 <code>touchstart</code> 监听会拖慢滚动。</p>
<h2>点击穿透是怎么发生的</h2>
<p>点击穿透和上面的延迟是同一个来源。MDN 说明，只有一个触点时，浏览器通常会在触摸事件之后补发模拟的鼠标事件和 <code>click</code>。假设遮罩层在 <code>touchend</code> 里就把自己隐藏了，等浏览器补发 <code>click</code> 时，手指位置下面已经换成了遮罩后面的按钮或链接，于是它被意外点中了。</p>
<p>改法有两种。第一种是统一用 <code>click</code> 处理关闭，这样关闭和点击是同一个事件，不会再多出一个。第二种是确实要在触摸事件里处理时，调用 <code>event.preventDefault()</code>，MDN 说明这样能阻止浏览器补发模拟的鼠标事件。同时处理鼠标和触摸的交互，MDN 建议改用 Pointer Events，见<a href="/questions/mobile-pointer-events/">《Pointer Events 为什么适合统一鼠标、触摸和触控笔交互？》</a>。</p>
<h2>弹窗里滚动，为什么后面的页面也跟着滚</h2>
<p>MDN 把这种现象叫作滚动链：内层滚动容器滚到边界以后，继续滑动会交给外层容器，于是背景页面开始滚。<code>overscroll-behavior</code> 就是用来控制这一点的，<code>contain</code> 表示滚动不传到容器外面，但容器自己还会有回弹效果；<code>none</code> 连回弹也一起去掉。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.dialog-body</span> {
  <span class="hljs-attribute">overflow</span>: auto;
  <span class="hljs-attribute">overscroll-behavior</span>: contain;
}
</code></pre></div>
<p>还有一个容易漏掉的情况：弹窗内容不够长、根本不能滚动时，MDN 说这样的容器始终被视为处在滚动边界上，滑动会直接交给外层。MDN 给出的做法是让遮罩成为 <code>overflow: hidden</code> 的滚动容器，同时设置 <code>overscroll-behavior: contain</code>，这样打开弹窗时背景就不会滚。MDN 目前把 <code>overscroll-behavior</code> 标为尚未进入 Baseline，所以目标浏览器的支持情况要查兼容表并真机测试。</p>
<p>横滑卡片和页面纵向滚动抢手势是另一类问题，见<a href="/questions/mobile-gestures/">《移动端手势交互怎样避免和页面滚动冲突？》</a>。</p>
<h2>输入框被键盘挡住怎么办</h2>
<p>键盘弹出时，多数移动浏览器只缩小可视视口，布局视口不变，固定在底部的元素就落到键盘下面。处理方法是监听 <code>visualViewport</code> 的变化，或者用 <code>interactive-widget</code>、VirtualKeyboard API，细节和各方案的支持范围见<a href="/questions/mobile-virtual-keyboard/">《移动端虚拟键盘出现时怎样避免布局被遮挡？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>new Date(&#x27;2026-10-30&#x27;)</code> 在国内用户的手机上显示成早上 8 点？</strong></p>
<blockquote>
<p>因为只有日期、没有时区的标准格式按 UTC 零点解释。北京时间比 UTC 快 8 小时，换成本地时间显示就是早上 8 点。想要本地零点，要么写成带时间的 <code>2026-10-30T00:00</code>，要么用 <code>new Date(2026, 9, 30)</code>。</p>
</blockquote>
<p><strong>现在还需要 FastClick 吗？</strong></p>
<blockquote>
<p>一般不需要。Chrome 32 起和 iOS 9.3 起，写了 <code>width=device-width</code> viewport 的页面已经没有点击延迟。FastClick 靠给元素绑 <code>touchstart</code> 实现，Chrome 的文章提到这类监听会影响滚动性能，所以先检查 viewport 配置。</p>
</blockquote>
<p><strong><code>overscroll-behavior</code> 的 <code>contain</code> 和 <code>none</code> 怎么选？</strong></p>
<blockquote>
<p>两者都能阻止滚动传到外层。区别在回弹：<code>contain</code> 保留容器自己的回弹效果，<code>none</code> 连回弹也去掉。弹窗一般用 <code>contain</code> 就够了，需要完全禁止边缘回弹时才用 <code>none</code>。</p>
</blockquote>`};export{e as default};