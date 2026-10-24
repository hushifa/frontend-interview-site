var e={answerHtml:`<p>Vue 会缓冲同一轮中的响应式状态变化，并批量更新 DOM。修改状态后立即读取 DOM，可能仍然得到更新之前的结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">count.<span class="hljs-property">value</span>++;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-comment">// 此时 Vue 对应的 DOM 更新已经完成</span>
</code></pre></div>
<p><code>nextTick</code> 等待的是 Vue 的 DOM 更新刷新，不代表图片已加载、动画已结束，也不保证浏览器已经把新像素绘制到屏幕。等待这些结果需要对应的加载、动画事件或渲染调度 API。</p>
<p>它适合在更新列表后读取元素尺寸、设置焦点或滚动位置，但不应作为“让异步请求更快”的方法。连续修改状态时尽量在同一轮完成更新；在循环中反复 await nextTick 会增加调度开销。条件渲染和异步竞态时还要确认目标元素仍然存在。</p>`};export{e as default};