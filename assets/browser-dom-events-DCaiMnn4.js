var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>addEventListener</code> 的第三个参数可以传一个对象，常用的有四个选项。<code>capture: true</code> 让监听器在捕获阶段触发，默认是在冒泡阶段。<code>once: true</code> 让监听器执行一次就自动移除。</p>
<p><code>passive: true</code> 是告诉浏览器“我不会调用 <code>preventDefault()</code>”。这样浏览器处理滚动时不用等监听器跑完，滚动可以马上开始，页面更流畅。</p>
<p><code>signal</code> 接收一个 <code>AbortSignal</code>，调用 <code>abort()</code> 以后，用这个 signal 注册的监听器都会被移除，适合组件卸载时一次清理一组监听器。</p>
<p>要注意，在 <code>window</code>、<code>document</code> 这些对象上注册 <code>touchstart</code>、<code>touchmove</code>、<code>wheel</code> 时，<code>passive</code> 默认就是 <code>true</code>，想阻止滚动得显式写 <code>passive: false</code>。</p>
</blockquote>
<h2>事件是怎么传的</h2>
<p>点击一个按钮，事件会走三段路。先是捕获阶段，从 <code>window</code> 一层层往下传到按钮的父元素。然后是目标阶段，到达按钮本身。最后是冒泡阶段，从按钮一层层往上传回 <code>window</code>。</p>
<p>默认情况下监听器在冒泡阶段触发。加了 <code>capture: true</code>，就改成在往下传的路上触发，所以外层元素能比里层先拿到事件。</p>
<p>移除监听器时有个细节：<code>removeEventListener</code> 要传入同一个函数和同样的 <code>capture</code> 值才能移除。<code>once</code>、<code>passive</code> 不参与匹配，写不写都一样。</p>
<h2>passive 为什么能让滚动更流畅</h2>
<p><code>touchstart</code>、<code>touchmove</code>、<code>wheel</code> 的监听器里可能会调用 <code>preventDefault()</code> 来阻止滚动。浏览器不知道你会不会这么做，所以只能等监听器执行完，才能决定滚不滚。监听器一慢，滚动就卡。</p>
<p>声明 <code>passive: true</code>，等于提前承诺不会阻止，浏览器就能不等监听器，立刻开始滚动。</p>
<p>DOM 规范还规定了一条默认值：在 <code>window</code>、<code>document</code>、<code>documentElement</code> 或 <code>body</code> 上注册 <code>touchstart</code>、<code>touchmove</code>、<code>wheel</code>、<code>mousewheel</code> 时，<code>passive</code> 默认为 <code>true</code>。这时调用 <code>preventDefault()</code> 会被忽略。所以如果确实要阻止滚动，得显式写 <code>passive: false</code>。</p>
<h2>用 signal 一次清理一组监听器</h2>
<p>拖拽功能通常要注册三个监听器。卸载时一个个 <code>removeEventListener</code>，就得把每个函数的引用都存好。用 <code>signal</code> 就简单多了：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindDrag</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> { signal } = controller;

  element.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, onDown, { signal });
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, onMove, { signal, <span class="hljs-attr">passive</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerup&#x27;</span>, onUp, { signal });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}
</code></pre></div>
<p>三个监听器都用同一个 <code>signal</code> 注册。组件卸载时调用返回的函数，<code>abort()</code> 一下，三个一起移除。</p>
<p>还有一个边界：如果传进去的 signal 已经 abort 过了，监听器根本不会被注册。</p>
<h2>常见追问</h2>
<p><strong><code>stopPropagation()</code> 和 <code>stopImmediatePropagation()</code> 有什么区别？</strong></p>
<blockquote>
<p><code>stopPropagation()</code> 阻止事件继续传到其他元素，但同一个元素上后面的监听器还会执行。<code>stopImmediatePropagation()</code> 连同一个元素上后面的监听器也一起拦住。</p>
</blockquote>
<p><strong><code>preventDefault()</code> 和 <code>stopPropagation()</code> 有关系吗？</strong></p>
<blockquote>
<p>没关系，互不影响。<code>preventDefault()</code> 取消的是默认行为，比如链接跳转；<code>stopPropagation()</code> 停止的是事件传播。调用一个不会影响另一个。</p>
</blockquote>`};export{e as default};