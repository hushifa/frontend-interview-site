var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>capture: true</code> 让监听器在捕获阶段触发，默认在冒泡阶段。</li>
<li><code>once: true</code> 让监听器执行一次后自动移除。</li>
<li><code>passive: true</code> 声明监听器不会调用 <code>preventDefault()</code>，浏览器可以不等它执行完就开始滚动。</li>
<li><code>signal</code> 接收一个 <code>AbortSignal</code>，<code>abort()</code> 后监听器被移除，适合一次清理一组监听器。</li>
</ul>
<h2>事件传播的三个阶段</h2>
<ol>
<li>捕获阶段：从 <code>window</code> 向下传到目标的父元素。</li>
<li>目标阶段：到达目标元素。</li>
<li>冒泡阶段：从目标向上传回 <code>window</code>。</li>
</ol>
<p><code>removeEventListener</code> 必须传入相同的函数和相同的 <code>capture</code> 值才能移除，<code>once</code>、<code>passive</code> 不参与匹配。</p>
<h2>passive</h2>
<p><code>touchstart</code>、<code>touchmove</code>、<code>wheel</code> 的监听器可能调用 <code>preventDefault()</code> 阻止滚动，浏览器原本要等监听器执行完才能决定是否滚动。声明 <code>passive: true</code> 后滚动可以立即开始。</p>
<p>DOM 规范规定：在 <code>window</code>、<code>document</code>、<code>documentElement</code> 或 <code>body</code> 上注册 <code>touchstart</code>、<code>touchmove</code>、<code>wheel</code>、<code>mousewheel</code> 时，<code>passive</code> 默认为 <code>true</code>。此时调用 <code>preventDefault()</code> 会被忽略，需要阻止滚动时要显式写 <code>passive: false</code>。</p>
<h2>signal 统一清理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindDrag</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> { signal } = controller;

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, onDown, { signal });
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, onMove, { signal, <span class="hljs-attr">passive</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerup&#x27;</span>, onUp, { signal });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}
</code></pre></div>
<p>组件卸载时调用返回的函数，三个监听器一起移除，不需要保留每个函数的引用。传入已经 abort 的 signal 时，监听器不会被注册。</p>
<h2>常见追问</h2>
<ul>
<li><code>stopPropagation()</code> 和 <code>stopImmediatePropagation()</code>：前者阻止事件继续传到其他元素，后者还会阻止同一元素上后续的监听器。</li>
<li><code>preventDefault()</code> 和 <code>stopPropagation()</code> 互不影响：一个取消默认行为，一个停止传播。</li>
</ul>`};export{e as default};