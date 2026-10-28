var e={answerHtml:`<h2>简答</h2>
<ul>
<li>浏览器通常把样式修改攒到下一帧统一计算布局。</li>
<li>写入样式后马上读取 <code>offsetHeight</code>、<code>getBoundingClientRect()</code> 等布局值，浏览器必须立刻同步计算布局，这叫强制同步布局。</li>
<li>在循环里交替读写，每次读取都触发一次布局，就是布局抖动（layout thrashing）。</li>
<li>解决办法是先集中读取、再集中写入，或者把写入放到 <code>requestAnimationFrame</code> 里。</li>
</ul>
<h2>会触发同步布局的读取</h2>
<p>常见的有：<code>offsetTop/Left/Width/Height</code>、<code>clientWidth/Height</code>、<code>scrollTop</code>、<code>scrollHeight</code>、<code>getBoundingClientRect()</code>、<code>getComputedStyle()</code> 读取布局相关属性、<code>scrollIntoView()</code>、<code>focus()</code>。</p>
<p>如果之前没有待处理的样式修改，读取这些属性不会额外触发布局。</p>
<h2>示例</h2>
<p>有问题的写法，每轮循环都先写后读：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> items) {
  item.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${container.offsetWidth / <span class="hljs-number">2</span>}</span>px\`</span>;
}
</code></pre></div>
<p>每次写入 <code>width</code> 都让布局失效，下一轮读取 <code>offsetWidth</code> 又要重新计算。</p>
<p>改为先读后写：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> half = container.<span class="hljs-property">offsetWidth</span> / <span class="hljs-number">2</span>;
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> items) {
  item.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${half}</span>px\`</span>;
}
</code></pre></div>
<p>读写分散在不同模块里时，可以把读取和写入分别排队，在同一帧里先执行所有读、再执行所有写。</p>
<h2>减少布局成本的其他手段</h2>
<ul>
<li>动画优先用 <code>transform</code> 和 <code>opacity</code>，它们通常不触发布局。</li>
<li>用 <code>contain: layout</code> 或 <code>content-visibility: auto</code> 限制布局影响范围。</li>
<li>批量插入节点时先放进 <code>DocumentFragment</code>，一次性挂到 DOM。</li>
<li>用 <code>ResizeObserver</code> 获取尺寸变化，代替轮询读取。</li>
</ul>
<h2>排查</h2>
<p>在 Chrome DevTools 的 Performance 面板录制，紫色的 Layout 块上出现 &quot;Forced reflow&quot; 警告时，调用栈会指出是哪一行代码触发的读取。</p>`};export{e as default};