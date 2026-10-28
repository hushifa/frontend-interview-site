var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>screen.orientation.type</code> 和 <code>angle</code> 读取当前方向，<code>change</code> 事件监听方向变化，读取功能在主流浏览器中都可用。</li>
<li><code>screen.orientation.lock()</code> 请求锁定方向，返回 Promise；它不是 Baseline 特性，通常只在移动设备的全屏模式下才会成功。</li>
<li>不支持或条件不满足时 Promise 会拒绝（如 <code>NotSupportedError</code>、<code>SecurityError</code>），必须捕获并提供降级。</li>
<li>退出全屏或不再需要时调用 <code>unlock()</code>，让屏幕重新跟随设备旋转。</li>
<li>普通页面用响应式布局和方向媒体查询适配横竖屏，不要强制锁定。</li>
</ul>
<h2>读取方向</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">report</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { type, angle } = screen.<span class="hljs-property">orientation</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(type, angle); <span class="hljs-comment">// 例如 &#x27;landscape-primary&#x27; 90</span>
}

screen.<span class="hljs-property">orientation</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, report);
</code></pre></div>
<p>只需要调整布局时，用 CSS 更简单：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">orientation</span>: landscape) {
  <span class="hljs-selector-class">.player</span> { <span class="hljs-attribute">height</span>: <span class="hljs-number">100</span>dvh; }
}
</code></pre></div>
<h2>锁定方向</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">enterLandscapePlayer</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> element.<span class="hljs-title function_">requestFullscreen</span>();
    <span class="hljs-keyword">await</span> screen.<span class="hljs-property">orientation</span>.<span class="hljs-title function_">lock</span>(<span class="hljs-string">&#x27;landscape&#x27;</span>);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-comment">// 不支持锁定时显示&quot;请横置设备&quot;的提示</span>
    <span class="hljs-title function_">showRotateHint</span>(error.<span class="hljs-property">name</span>);
  }
}

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fullscreenchange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">document</span>.<span class="hljs-property">fullscreenElement</span>) screen.<span class="hljs-property">orientation</span>.<span class="hljs-title function_">unlock</span>();
});
</code></pre></div>
<ul>
<li>先进入全屏再锁定，这是大多数支持的浏览器的前提条件。<code>requestFullscreen</code> 需要由用户手势触发。</li>
<li>文档不可见、处于不允许锁定的 iframe（sandbox 缺少 <code>allow-orientation-lock</code>）时会抛 <code>SecurityError</code>。</li>
<li>锁定请求进行中再次调用 <code>lock()</code> 或调用 <code>unlock()</code>，前一个 Promise 会以 <code>AbortError</code> 拒绝。</li>
<li>用户退出全屏时同时解锁，避免页面停留在锁定状态。</li>
</ul>
<h2>兼容性</h2>
<p><code>lock()</code> 的支持有限。Safari 可以读取 <code>screen.orientation</code>，但调用 <code>lock()</code> 会失败，所以必须有降级方案：显示旋转提示，或用 CSS 旋转容器（会影响输入和无障碍，谨慎使用）。桌面浏览器通常也不支持锁定。</p>
<h2>适用场景</h2>
<ul>
<li>适合：全屏视频、游戏、相机取景等明确需要特定方向的沉浸式场景。</li>
<li>不适合：普通文章、表单、列表页面。用户可能因为习惯或身体原因固定使用某个方向，WCAG 1.3.4 要求内容不限定显示方向，除非方向对功能必不可少。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>PWA 能在 Manifest 中固定方向吗？Manifest 的 <code>orientation</code> 字段可以设置安装后应用的默认方向，支持程度同样因平台而异。</li>
<li>旧的 <code>window.orientation</code> 还能用吗？它已废弃，应改用 <code>screen.orientation</code>。</li>
</ul>`};export{e as default};