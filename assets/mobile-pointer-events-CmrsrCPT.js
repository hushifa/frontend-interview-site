var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前做拖动，要同时监听 <code>mousedown</code> 和 <code>touchstart</code> 两套事件。Pointer Events 把鼠标、手指和触控笔统一成一套：<code>pointerdown</code>、<code>pointermove</code>、<code>pointerup</code>、<code>pointercancel</code>，写一遍就够了。</p>
<p>每个接触点都有自己的 <code>pointerId</code>，多根手指时按 ID 区分；<code>pointerType</code> 告诉你是 <code>mouse</code>、<code>touch</code> 还是 <code>pen</code>。</p>
<p>做拖动时常用 <code>setPointerCapture</code>，意思是把这根指针“抓住”，之后它的事件都发给当前元素，手指移出元素也不会断。</p>
<p>要注意的是，触摸时浏览器可能把手势拿去滚动或缩放，并发一个 <code>pointercancel</code>，代码要处理这个取消。哪些手势留给页面，要用 CSS 的 <code>touch-action</code> 提前说好。普通按钮继续用 click 就行。</p>
</blockquote>
<h2>为什么不再分开监听</h2>
<p>旧做法要同时监听 <code>touchstart</code> 和 <code>mousedown</code>。可是手指点完以后，浏览器还会补发一组模拟的鼠标事件，所以还得想办法防止同一个操作执行两次。</p>
<p>Pointer Events 把这些合成一套模型，就没有这个麻烦了。触控笔的压力 <code>pressure</code>、倾斜角度 <code>tiltX</code> 这些信息，也放在同一个事件对象里。</p>
<h2>写一个拖动滑块</h2>
<p>下面的滑块只跟踪第一个按下的指针。重点看 <code>pointerdown</code> 里的捕获，和最后三个结束事件。</p>
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
<p><code>activeId</code> 已经有值时，别的手指按下来会被忽略，所以第二根手指不会打乱拖动。<code>event.button !== 0</code> 用来过滤鼠标右键。</p>
<p>捕获以后，就算指针移出了 <code>handle</code>，<code>pointermove</code> 和 <code>pointerup</code> 还是发给它。<code>pointerup</code> 之后浏览器会自动释放捕获。</p>
<p>结束为什么要监听三个事件？因为拖动不一定是正常松手结束的。浏览器接管手势会发 <code>pointercancel</code>，捕获丢了会发 <code>lostpointercapture</code>，这些情况都要把状态清掉。</p>
<p>滑块要接管所有触摸移动，所以设成 <code>touch-action: none</code>。</p>
<h2>touch-action 是怎么分工的</h2>
<p><code>touch-action</code> 告诉浏览器：在这个元素上，哪些手势你来处理，剩下的交给页面。</p>
<table><thead><tr><th>值</th><th>浏览器保留的手势</th></tr></thead><tbody><tr><td><code>auto</code></td><td>全部（默认）</td></tr><tr><td><code>pan-y</code></td><td>只有纵向滚动，横向移动和双指缩放交给页面</td></tr><tr><td><code>pan-y pinch-zoom</code></td><td>纵向滚动和双指缩放，横向移动交给页面</td></tr><tr><td><code>none</code></td><td>都不保留，页面处理所有触摸</td></tr></tbody></table>
<p>它必须在手势开始前就设好。在 <code>pointerdown</code> 里调用 <code>preventDefault()</code> 是阻止不了滚动的。另外只禁用真正需要的手势，禁多了用户就没法滚动或缩放页面。和滚动方向冲突的处理见<a href="/questions/mobile-gestures/">《移动端手势交互怎样避免和页面滚动冲突？》</a>。</p>
<h2>别忘了键盘和读屏</h2>
<p>拖动只是一种输入方式。滑块还应该支持方向键调值，并使用原生的 <code>&lt;input type=&quot;range&quot;&gt;</code> 或正确的 ARIA 角色，这样读屏用户也能操作。</p>
<h2>常见追问</h2>
<p><strong>为什么拖动时偶尔会突然停住？</strong></p>
<blockquote>
<p>多半是浏览器开始滚动了，发了 <code>pointercancel</code>，之后就不会再有 move 事件。先检查元素上的 <code>touch-action</code> 有没有设对。</p>
</blockquote>
<p><strong>pointerleave 和捕获有什么关系？</strong></p>
<blockquote>
<p>捕获期间，事件都派发给捕获它的元素，指针移出去也不会触发 <code>pointerleave</code>，要等释放捕获以后才会。所以拖动不会因为手指移出元素而中断。</p>
</blockquote>`};export{e as default};