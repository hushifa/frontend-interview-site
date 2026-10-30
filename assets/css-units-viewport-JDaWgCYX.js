var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>视口单位是按浏览器可视区域的大小来算的，<code>1vw</code> 是视口宽度的 1%，<code>1vh</code> 是视口高度的 1%。它们和字号、父元素都没有关系。</p>
<p>麻烦出在手机上。手机浏览器的地址栏和工具栏会随滚动收起、展开，视口高度一直在变。所以规范把视口分成三种：<code>svh</code> 按工具栏全部展开时的小视口算，<code>lvh</code> 按全部收起时的大视口算，<code>dvh</code> 跟着工具栏当前的状态实时变化。MDN 写明，目前浏览器里的 <code>vh</code> 都等同于 <code>lvh</code>。</p>
<p>这就解释了老问题：页面刚打开时工具栏是展开的，<code>height: 100vh</code> 却按收起时的高度算，底部就被遮住了。首屏内容必须完整可见时用 <code>100svh</code>；全屏应用的外壳用 <code>100dvh</code>；普通长页面里不要用 <code>dvh</code>，用户一滚动它就变，元素高度跟着跳。</p>
<p>宽度方向也有坑。<code>100vw</code> 按“没有滚动条”来算，桌面上有竖向滚动条时它比页面可用宽度更宽，会多出横向滚动条。要相对父元素就用百分比，要相对组件容器就用 <code>cqi</code> 这类容器查询单位。</p>
</blockquote>
<h2>三种视口高度分别是多少</h2>
<p>手机浏览器的工具栏会随着滚动收起和展开，所以“视口有多高”有三种答案。CSS Values 4 规范的定义是：</p>
<table><thead><tr><th>单位</th><th>按什么算</th><th>会不会变</th></tr></thead><tbody><tr><td><code>svh</code></td><td>工具栏全部展开时的视口，也就是最小的</td><td>只有视口本身改变尺寸时才变</td></tr><tr><td><code>lvh</code></td><td>工具栏全部收起时的视口，也就是最大的</td><td>只有视口本身改变尺寸时才变</td></tr><tr><td><code>dvh</code></td><td>按工具栏当前的状态动态计算</td><td>滚动时工具栏一动就变</td></tr></tbody></table>
<p><code>vh</code> 呢？规范允许浏览器自己决定它按哪种算，MDN 写明目前所有浏览器的 <code>vh</code>、<code>vw</code> 等默认视口单位都等同于 <code>lv*</code> 那一套。宽度方向同理，也有 <code>svw</code>、<code>lvw</code>、<code>dvw</code>，只是手机上工具栏一般只影响高度。</p>
<h2>整屏高度该写哪个</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.hero</span> {
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">100vh</span>;   <span class="hljs-comment">/* 不支持新单位的浏览器用这一行 */</span>
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">100s</span>vh;
}

<span class="hljs-selector-class">.app-shell</span> {
  <span class="hljs-attribute">block-size</span>: <span class="hljs-number">100</span>dvh;
}
</code></pre></div>
<p>首屏区块写 <code>100svh</code>，因为它按工具栏展开时算，用户刚打开页面时就能完整看到。前面那行 <code>100vh</code> 是回退，不认识 <code>svh</code> 的浏览器会丢掉第二条声明，继续用第一条。</p>
<p><code>dvh</code> 适合聊天窗口、地图这种整屏固定、内部自己滚动的应用外壳，工具栏收起时它跟着变高，不会留空白。可是 MDN 也提醒，基于动态视口的单位会让内容在用户滚动时改变尺寸，影响体验，还可能带来性能开销。所以长页面里的普通区块不要用 <code>dvh</code>。</p>
<p><code>lvh</code> 用得少，适合被遮住一点也无所谓的背景、装饰。</p>
<h2>为什么 100vw 会多出横向滚动条</h2>
<p>规范规定，除非根元素的 <code>overflow</code> 设成了 <code>scroll</code> 这类一定出现滚动条的值，视口单位都按“滚动条不存在”来计算。普通页面是 <code>overflow: auto</code>，内容一长出现竖向滚动条，<code>100vw</code> 却还按没有滚动条的宽度算，比页面实际可用的宽度多出一条滚动条宽，于是又多出一个横向滚动条。</p>
<p>所以撑满宽度一般写 <code>width: 100%</code>，而不是 <code>100vw</code>。</p>
<h2>视口单位、百分比和容器查询单位怎么分</h2>
<p>视口单位只看视口。一个 <code>width: 50vw</code> 的元素放进 300px 宽的侧栏里，宽度仍然是视口的一半，会把侧栏撑破。</p>
<p>百分比参照什么，要看是哪个属性。<code>width</code> 参照包含块的宽度；<code>padding</code> 和 <code>margin</code> 也参照包含块的宽度，上下方向也一样；<code>transform: translate()</code> 的百分比参照元素自己的尺寸。</p>
<p>组件要根据自己所在的容器调整尺寸时，用容器查询单位。<code>1cqi</code> 是查询容器行内尺寸的 1%。MDN 说明，找不到合适的查询容器时，它退回到对应方向的小视口单位。</p>
<h2>常见追问</h2>
<p><strong>字号能不能用 vw，让文字跟着屏幕宽度缩放？</strong></p>
<blockquote>
<p>不要只写 <code>vw</code>。用户在浏览器里放大页面时视口宽度不变，纯 <code>vw</code> 的字号就不会变大。一般写成 <code>clamp(1rem, 0.9rem + 0.5vw, 1.25rem)</code>，让中间那部分也包含 <code>rem</code>。<code>rem</code>、<code>em</code> 的区别和换算见<a href="/questions/css-rem-em-vw/">《rem 和 em 有什么区别？各自怎么换算？》</a>。</p>
</blockquote>
<p><strong>设计稿上的 px 怎么换成 vw？</strong></p>
<blockquote>
<p>用 <code>px ÷ 设计稿宽度 × 100</code>。比如 375px 宽的设计稿上 75px 的按钮，写成 <code>75 / 375 × 100 = 20vw</code>。整页按 <code>vw</code> 等比缩放的完整方案见<a href="/questions/mobile-adaptation/">《移动端怎样做屏幕适配？1px 边框为什么看起来变粗了？》</a>。</p>
</blockquote>`};export{e as default};