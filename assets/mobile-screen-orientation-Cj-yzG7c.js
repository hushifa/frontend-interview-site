var e={answerHtml:`<h2>先区分布局方向和设备方向</h2>
<p>CSS 的 <code>(orientation: landscape)</code> 根据视口宽高判断，适合决定两列还是单列布局。<code>screen.orientation.type</code> 和 <code>angle</code> 描述设备屏幕方向，适合读取或请求方向锁定。分屏、浏览器工具栏、键盘和可调整窗口可能改变视口比例，却不一定让设备物理旋转。</p>
<p>自然方向也因设备而异，不能固定认为角度 0 就是手机竖屏。布局应优先使用容器查询、视口和实际可用空间；只有功能本身依赖横竖屏时，才考虑 Orientation API。</p>
<h2>读取方向时要订阅变化并清理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">watchOrientation</span>(<span class="hljs-params">onChange</span>) {
  <span class="hljs-keyword">const</span> orientation = screen.<span class="hljs-property">orientation</span>;
  <span class="hljs-keyword">if</span> (!orientation) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">report</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">onChange</span>({
    <span class="hljs-attr">type</span>: orientation.<span class="hljs-property">type</span>,
    <span class="hljs-attr">angle</span>: orientation.<span class="hljs-property">angle</span>,
  });

  orientation.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, report);
  <span class="hljs-title function_">report</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> orientation.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, report);
}
</code></pre></div>
<p>初次报告当前值，组件销毁时移除监听。方向变化时，游戏画布、视频控件和布局尺寸可能都需要重新计算，但不要把每个变化都当成一次完整页面重载。输入框、滚动位置和用户正在编辑的内容应保留。</p>
<h2><code>lock()</code> 是受条件限制的请求</h2>
<p>方向锁定通常只适合用户主动进入的全屏游戏或沉浸式播放器。某些浏览器要求文档已经全屏，且必须在用户手势触发的调用链中执行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">enterLandscape</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!screen.<span class="hljs-property">orientation</span>?.<span class="hljs-property">lock</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">document</span>.<span class="hljs-property">fullscreenElement</span>) {
      <span class="hljs-keyword">await</span> <span class="hljs-variable language_">document</span>.<span class="hljs-property">documentElement</span>.<span class="hljs-title function_">requestFullscreen</span>();
    }
    <span class="hljs-keyword">await</span> screen.<span class="hljs-property">orientation</span>.<span class="hljs-title function_">lock</span>(<span class="hljs-string">&#x27;landscape&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;方向锁定失败&#x27;</span>, error);
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
}
</code></pre></div>
<p>即使 API 存在，平台策略、权限、沙箱、文档状态和显示模式也可能拒绝请求。不能把 <code>lock()</code> 成功当成所有设备都会横屏，也不能把失败当成程序异常而阻塞核心功能。进入全屏和锁定是两个 Promise，任一步失败都要决定是否退出已进入的全屏并给出可理解的提示。</p>
<h2><code>unlock()</code> 不等于马上转回原方向</h2>
<p>解锁只是撤销应用设置的限制，让系统和浏览器重新决定方向，不保证设备立即旋转或回到调用前的角度。退出游戏时应释放自己拥有的锁定；如果多个模块共享方向控制，需要由拥有者统一管理，不能一个组件卸载就解除另一个功能仍在使用的锁。</p>
<p>页面进入后台、全屏被系统打断或用户主动退出时，也要清理监听、停止渲染循环和恢复 UI。迟到的锁定结果不能覆盖已经退出的状态。</p>
<h2>降级不能把用户挡在页面外</h2>
<p>锁定失败时，游戏可以提示“建议横屏”，但应仍然可退出、可滚动或以适配布局运行。普通表单、阅读页和后台系统不应显示无法关闭的“请旋转设备”遮罩，只因为 CSS 还没有适配好。</p>
<p>强制方向可能影响键盘、放大文字、读屏和单手操作。只有方向本身是功能要求时才值得牺牲自由旋转；否则应优先改进响应式布局。</p>
<p>测试要覆盖真实移动设备、自动旋转关闭、全屏进入和退出、前后台切换、横竖屏连续变化、独立 PWA 和嵌入 iframe。桌面窗口拖动只能验证布局，不能证明移动平台会允许方向锁定。</p>`};export{e as default};