var e={answerHtml:`<p>Vue 会缓冲同一轮中的响应式状态变化，并批量更新 DOM。修改状态后立即读取 DOM，可能仍然得到更新之前的结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">count.<span class="hljs-property">value</span>++;
<span class="hljs-keyword">await</span> <span class="hljs-title function_">nextTick</span>();
<span class="hljs-comment">// 此时 Vue 对应的 DOM 更新已经完成</span>
</code></pre></div>
<p><code>nextTick</code> 等待的是 Vue 的 DOM 更新刷新，不代表图片已加载、动画已结束，也不保证浏览器已经把新像素绘制到屏幕。等待这些结果需要对应的加载、动画事件或渲染调度 API。</p>
<p>它适合在更新列表后读取元素尺寸、设置焦点或滚动位置，但不应作为“让异步请求更快”的方法。连续修改状态时尽量在同一轮完成更新；在循环中反复 await nextTick 会增加调度开销。条件渲染和异步竞态时还要确认目标元素仍然存在。</p>
<h3>组件层面的落地</h3>
<p>Vue 题目可以沿着依赖收集、更新调度、组件渲染和副作用生命周期来理解。响应式引用记录的是读取关系，不代表所有嵌套对象都会以同样方式被追踪；具体行为还取决于使用的 API 和 Vue 版本。</p>
<p>落地时把派生状态、用户输入和副作用分开，避免用一个 watch 或可写变量反复同步同一事实。组件卸载、异步竞态、SSR 和第三方 DOM 操作都需要单独验证。</p>`};export{e as default};