var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Screen Orientation API 做两件事：读屏幕现在是横的还是竖的，以及请求把方向锁住。用 <code>screen.orientation.type</code> 和 <code>angle</code> 读方向，监听 <code>change</code> 事件知道它变了，读取这部分主流浏览器都支持。</p>
<p>锁定用 <code>screen.orientation.lock()</code>，它返回一个 Promise。可是它的支持很有限，不是 Baseline 特性，通常只有移动设备在全屏模式下才能成功。不满足条件时 Promise 会拒绝，比如 <code>NotSupportedError</code>、<code>SecurityError</code>，所以一定要捕获错误并给出降级。</p>
<p>退出全屏或者不需要锁了，要调用 <code>unlock()</code>，让屏幕重新跟着设备转。</p>
<p>普通页面不要强制锁方向，用响应式布局和方向媒体查询去适配横竖屏就好。</p>
</blockquote>
<h2>怎样读取方向</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">report</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { type, angle } = screen.<span class="hljs-property">orientation</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(type, angle); <span class="hljs-comment">// 例如 &#x27;landscape-primary&#x27; 90</span>
}

screen.<span class="hljs-property">orientation</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, report);
</code></pre></div>
<p>如果只是想横屏时换个布局，用不着 JS，CSS 媒体查询就够了：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">orientation</span>: landscape) {
  <span class="hljs-selector-class">.player</span> { <span class="hljs-attribute">height</span>: <span class="hljs-number">100</span>dvh; }
}
</code></pre></div>
<h2>怎样锁定方向</h2>
<p>下面是一个横屏播放器的写法。先进全屏，再锁方向，失败了就显示提示。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">enterLandscapePlayer</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> element.<span class="hljs-title function_">requestFullscreen</span>();
    <span class="hljs-keyword">await</span> screen.<span class="hljs-property">orientation</span>.<span class="hljs-title function_">lock</span>(<span class="hljs-string">&#x27;landscape&#x27;</span>);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-comment">// 不支持锁定时显示“请横置设备”的提示</span>
    <span class="hljs-title function_">showRotateHint</span>(error.<span class="hljs-property">name</span>);
  }
}

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fullscreenchange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">document</span>.<span class="hljs-property">fullscreenElement</span>) screen.<span class="hljs-property">orientation</span>.<span class="hljs-title function_">unlock</span>();
});
</code></pre></div>
<p>为什么要先进全屏？因为在大多数支持锁定的浏览器里，全屏是锁定的前提。而 <code>requestFullscreen</code> 又要求由用户操作触发，比如点击按钮。</p>
<p>锁定还可能因为别的原因失败。文档不可见，或者页面在一个不允许锁定的 iframe 里（sandbox 缺少 <code>allow-orientation-lock</code>），会抛 <code>SecurityError</code>。锁定请求还没完成时，再次调用 <code>lock()</code> 或者调用 <code>unlock()</code>，前一个 Promise 会以 <code>AbortError</code> 拒绝。</p>
<p>最后监听 <code>fullscreenchange</code>，用户退出全屏时顺手解锁，免得页面一直停在锁定状态。</p>
<h2>不支持锁定时怎么办</h2>
<p><code>lock()</code> 的支持有限。Safari 能读 <code>screen.orientation</code>，但调用 <code>lock()</code> 会失败；桌面浏览器通常也不支持锁定。所以必须准备降级：显示一个“请旋转设备”的提示，或者用 CSS 把容器旋转过来。后一种会影响输入和无障碍，要谨慎用。</p>
<h2>什么时候该锁，什么时候不该锁</h2>
<p>全屏视频、游戏、相机取景这类沉浸式场景，明确需要某个方向，适合锁定。</p>
<p>普通文章、表单、列表页面就不该锁。有的用户因为习惯或者身体原因，只能用某一个方向拿手机。WCAG 1.3.4 也要求内容不限定显示方向，除非这个方向对功能必不可少。</p>
<h2>常见追问</h2>
<p><strong>PWA 能在 Manifest 里固定方向吗？</strong></p>
<blockquote>
<p>可以用 Manifest 的 <code>orientation</code> 字段设置安装后应用的默认方向，不过支持程度同样因平台而异。</p>
</blockquote>
<p><strong>旧的 window.orientation 还能用吗？</strong></p>
<blockquote>
<p>它已经废弃了，应该改用 <code>screen.orientation</code>。</p>
</blockquote>`};export{e as default};