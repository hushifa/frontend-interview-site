var e={answerHtml:`<p>移动端输入框获得焦点后，浏览器通常会滚动或调整可见区域，让用户看到输入位置。但固定底栏、多层滚动容器和全屏布局可能打乱这个过程，导致输入框可见而“发送”按钮藏在键盘后面。</p>
<p>解决前先分清布局视口和视觉视口。布局视口参与页面排版，视觉视口表示用户当前实际看到的页面区域；缩放、平移和键盘都可能让两者不同。</p>
<h3>不同策略下，被缩小的对象不同</h3>
<p>键盘可能只缩小视觉视口，也可能连布局视口一起缩小，或者直接覆盖内容。支持相应配置的浏览器可通过 viewport 的 interactive-widget 指定意图：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1, interactive-widget=resizes-content&quot;</span> /&gt;</span>
</code></pre></div>
<p>resizes-content 请求键盘影响布局视口；resizes-visual 主要影响视觉视口；overlays-content 表示覆盖而不做相同的视口缩小。支持度和平台默认行为需要实测，不能把一个 meta 值当成所有移动浏览器统一行为的保证。</p>
<p>如果页面已有 viewport 配置，应合并所需项，而不是添加多个互相冲突的 viewport 标签。</p>
<h3>100dvh 不是自动避开所有键盘</h3>
<p>dvh、svh、lvh 主要帮助表达动态、小和大视口尺寸，能改善地址栏展开收起等布局问题。但键盘是否改变这些单位对应的布局尺寸，还取决于视口策略与浏览器实现。</p>
<p>因此把 100vh 全部换成 100dvh 后，仍可能有底栏被遮挡。应观察实际布局和可视区域，而不是继续叠加固定高度补丁。</p>
<h3>VisualViewport 提供的是可见区域信息</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeVisibleArea</span>(<span class="hljs-params">onChange</span>) {
  <span class="hljs-keyword">const</span> viewport = <span class="hljs-variable language_">window</span>.<span class="hljs-property">visualViewport</span>;
  <span class="hljs-keyword">if</span> (!viewport) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">let</span> frame = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">report</span> = (<span class="hljs-params"></span>) =&gt; {
    frame = <span class="hljs-literal">null</span>;
    <span class="hljs-title function_">onChange</span>({
      <span class="hljs-attr">top</span>: viewport.<span class="hljs-property">offsetTop</span>,
      <span class="hljs-attr">left</span>: viewport.<span class="hljs-property">offsetLeft</span>,
      <span class="hljs-attr">width</span>: viewport.<span class="hljs-property">width</span>,
      <span class="hljs-attr">height</span>: viewport.<span class="hljs-property">height</span>,
      <span class="hljs-attr">scale</span>: viewport.<span class="hljs-property">scale</span>,
    });
  };
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">schedule</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-keyword">if</span> (frame === <span class="hljs-literal">null</span>) frame = <span class="hljs-title function_">requestAnimationFrame</span>(report);
  };

  viewport.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, schedule);
  viewport.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;scroll&#x27;</span>, schedule);
  <span class="hljs-title function_">report</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    viewport.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, schedule);
    viewport.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;scroll&#x27;</span>, schedule);
    <span class="hljs-keyword">if</span> (frame !== <span class="hljs-literal">null</span>) <span class="hljs-title function_">cancelAnimationFrame</span>(frame);
  };
}
</code></pre></div>
<p>示例在可见区域变化时汇总信息，并用动画帧合并连续通知；它不是一个直接移动底栏的完整方案。实际布局需要结合容器坐标系，不能把 offsetTop 无条件加到已经使用其他偏移的元素上。</p>
<p>VisualViewport 变化也可能由缩放或平移造成，所以“高度少了 300 像素”不能直接等同于键盘高度。即使当前有输入焦点，也不应把所有 resize 都解释为键盘展开，例如设备旋转也会改变区域。</p>
<h3>优先让正常滚动完成输入任务</h3>
<p>表单应有明确的主滚动容器和足够的滚动空间，避免多层 overflow 与固定高度互相争夺滚动。浏览器正常聚焦滚动已经足够时，不必每次 focus 再强制 scrollTo。</p>
<p>必要时可以对输入项使用合理的 scroll-margin，或在布局稳定后调用 scrollIntoView，但要检查它是否移动了错误的祖先容器。持续在 resize 回调里滚回某位置，可能与键盘动画和用户手势产生拉扯。</p>
<p>输入框、错误提示和提交操作要一起考虑。只保证光标露出来，但错误提示与提交按钮永远不可达，用户仍无法完成任务。</p>
<h3>覆盖式键盘需要更主动的布局管理</h3>
<p>部分环境提供 VirtualKeyboard API，可以选择覆盖模式并读取键盘几何变化，但支持范围有限。主动采用 overlaysContent 等行为后，应用承担更多避让责任，不能先关闭浏览器默认调整，再忘记实现降级。</p>
<p>键盘候选栏、输入法切换、浮动键盘和外接键盘都可能改变情况。安全区域也不是键盘高度，重复加入所有推测偏移容易产生巨大空白或双重滚动。</p>
<p>验证应包括输入、切换字段、键盘收起、旋转、页面缩放和返回页面后的焦点状态，并在目标真实设备与 WebView 中检查。桌面模拟 resize 可以验证回调清理与布局算法，但不能证明实际键盘动画和输入法体验正确。</p>`};export{e as default};