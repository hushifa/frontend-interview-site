var e={answerHtml:`<p>Screen Orientation API 可以读取当前屏幕方向，并在允许的环境中请求方向锁定。它不是 CSS 布局开关：请求横屏不会自动把不合适的页面排版修好，浏览器也可能拒绝锁定。</p>
<p>最常见的合理场景是全屏游戏或沉浸式内容需要特定方向。普通表单和阅读页面通常应先做好响应式布局，而不是强迫用户旋转设备。</p>
<h3>屏幕方向与视口宽高不是同一件事</h3>
<p>screen.orientation.type 可能是 portrait-primary、landscape-primary 等值；angle 表示相对于设备自然方向的旋转角度。不同设备的自然方向可能不同，不能固定认为 0 度一定是手机竖屏。</p>
<p>CSS 的 <code>(orientation: landscape)</code> 则基于视口宽高关系，适合决定布局。在分屏、窗口变化或键盘影响下，视口比例可能变化，而物理屏幕并未按同样方式旋转。</p>
<p>因此“根据空间调整两列布局”优先看实际容器或视口尺寸，“读取或请求屏幕方向”才使用此 API。</p>
<h3>监听变化时保留清理逻辑</h3>
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
<p>初次报告当前值，再订阅变化，避免用户不旋转时界面一直没有状态。组件卸载后应移除监听。不能只读取启动时的方向，然后假设应用整个生命周期都不改变。</p>
<h3>lock 是请求，必须处理失败</h3>
<p>通常从用户明确点击的操作开始，在目标平台要求时先进入全屏，再调用 <code>screen.orientation.lock(&#x27;landscape&#x27;)</code>。它返回 Promise，可能因不支持、文档状态、沙箱限制或平台策略拒绝。</p>
<p>即使存在 screen.orientation，也不代表 lock 一定可用；即使存在 lock，也不代表当前页面满足调用条件。全屏、安装后的显示模式及不同移动系统的支持情况都可能不同，应做能力检测并处理 Promise 失败。</p>
<p>若为了锁定专门进入全屏，锁定失败后应决定是否恢复原显示模式，不要留下用户不理解的半完成状态。多个请求或退出操作交错时，也要避免迟到结果覆盖当前界面提示。</p>
<h3>unlock 不会强制设备转回原角度</h3>
<p>unlock 解除应用设置的锁定，让浏览器和系统恢复相应策略，不等于立即旋转设备，也不保证回到锁定前的方向。用户系统的自动旋转设置和当前设备姿态仍然参与结果。</p>
<p>离开需要锁定的功能时，应释放自己拥有的锁定，必要时退出自己开启的全屏。多个功能共用方向控制时要有明确所有权，不能任意组件卸载就解锁另一个仍在使用的功能。</p>
<h3>降级应该仍然可完成任务</h3>
<p>锁定失败时可以提示更合适的方向，但内容仍应可滚动、可缩放、可退出。不要显示一个无法关闭的“请横屏”遮罩，把正常支持的功能完全挡住。</p>
<p>无障碍设计通常不应把展示或操作限制在单一方向，除非该方向确实是功能本质要求。仅因为布局没适配好，不是强制方向的理由。</p>
<p>测试需要真实设备上的用户点击、全屏进入退出、系统旋转设置、前后台切换和不同容器环境。桌面修改窗口比例可以验证响应式布局，但不能证明移动平台允许方向锁定。</p>`};export{e as default};