var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Pointer Events 用同一组事件（<code>pointerdown</code>、<code>pointermove</code>、<code>pointerup</code>、<code>pointercancel</code>）处理鼠标、触摸和触控笔，不必分别监听 mouse 和 touch 事件。</li>
<li>每个接触点有独立的 <code>pointerId</code>，多指操作时按 ID 区分；<code>pointerType</code> 区分 <code>mouse</code>、<code>touch</code>、<code>pen</code>。</li>
<li><code>setPointerCapture</code> 让后续事件都发给当前元素，手指移出元素范围也不会丢失拖动。</li>
<li>触摸时浏览器可能接管手势（滚动、缩放）并发送 <code>pointercancel</code>，交互必须处理取消；用 CSS <code>touch-action</code> 告诉浏览器哪些手势留给页面。</li>
<li>原有的 click 事件仍然会触发，按钮类交互继续用 click 即可。</li>
</ul>
<h2>为什么不再分开监听</h2>
<p>旧做法同时监听 <code>touchstart</code> 和 <code>mousedown</code>，还要防止触摸后浏览器补发的模拟鼠标事件导致重复执行。Pointer Events 把这些统一成一套模型，触控笔的压力（<code>pressure</code>）、倾斜角度（<code>tiltX</code>）等信息也放在同一个事件对象里。</p>
<h2>一个拖动滑块</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">makeDraggable</span>(<span class="hljs-params">handle, onMove</span>) {
  <span class="hljs-keyword">let</span> activeId = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> startX = <span class="hljs-number">0</span>;

  handle.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (activeId !== <span class="hljs-literal">null</span> || event.<span class="hljs-property">button</span> !== <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    activeId = event.<span class="hljs-property">pointerId</span>;
    startX = event.<span class="hljs-property">clientX</span>;
    handle.<span class="hljs-title function_">setPointerCapture</span>(event.<span class="hljs-property">pointerId</span>);
  });

  handle.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">pointerId</span> !== activeId) <span class="hljs-keyword">return</span>;
    <span class="hljs-title function_">onMove</span>(event.<span class="hljs-property">clientX</span> - startX);
  });

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">end</span> = (<span class="hljs-params">event</span>) =&gt; {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">pointerId</span> !== activeId) <span class="hljs-keyword">return</span>;
    activeId = <span class="hljs-literal">null</span>;
  };
  handle.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerup&#x27;</span>, end);
  handle.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointercancel&#x27;</span>, end);
  handle.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;lostpointercapture&#x27;</span>, end);
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.handle</span> { <span class="hljs-attribute">touch-action</span>: none; }
</code></pre></div>
<ul>
<li>只跟踪第一个按下的指针，其他手指的事件被忽略。</li>
<li><code>event.button !== 0</code> 过滤掉鼠标右键。</li>
<li>捕获后即使指针移出 <code>handle</code>，<code>pointermove</code> 和 <code>pointerup</code> 仍发给它；<code>pointerup</code> 后浏览器自动释放捕获。</li>
<li>滑块需要接管所有触摸移动，所以设为 <code>touch-action: none</code>。</li>
</ul>
<h2>touch-action</h2>
<table><thead><tr><th>值</th><th>浏览器保留的手势</th></tr></thead><tbody><tr><td><code>auto</code></td><td>全部（默认）</td></tr><tr><td><code>pan-y</code></td><td>只有纵向滚动，横向移动和双指缩放交给页面</td></tr><tr><td><code>pan-y pinch-zoom</code></td><td>纵向滚动和双指缩放，横向移动交给页面</td></tr><tr><td><code>none</code></td><td>都不保留，页面处理所有触摸</td></tr></tbody></table>
<p><code>touch-action</code> 必须在手势开始前就设置好，在 <code>pointerdown</code> 里调用 <code>preventDefault()</code> 不能阻止滚动。只禁用真正需要的手势，否则用户无法滚动或缩放页面。和滚动方向冲突的手势处理见<a href="/questions/mobile-gestures/">《移动端手势交互怎样避免和页面滚动冲突？》</a>。</p>
<h2>键盘和无障碍</h2>
<p>拖动只是一种输入方式。滑块应同时支持方向键调整值，并使用原生 <code>&lt;input type=&quot;range&quot;&gt;</code> 或正确的 ARIA 角色，读屏用户才能操作。</p>
<h2>常见追问</h2>
<ul>
<li>为什么拖动时偶尔会停住？浏览器开始滚动并发送了 <code>pointercancel</code>，检查 <code>touch-action</code> 是否设置正确。</li>
<li><code>pointerleave</code> 和捕获有什么关系？捕获期间事件都派发给捕获元素，指针移出它的范围也不会触发 <code>pointerleave</code>，直到释放捕获；拖动因此不会中断。</li>
</ul>`};export{e as default};