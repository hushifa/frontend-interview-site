var e={answerHtml:`<h2>简答</h2>
<ul>
<li>ResizeObserver 在布局完成、绘制之前回调，报告元素的内容框、边框框等尺寸。</li>
<li>回调里修改了尺寸，浏览器会在同一帧内再次检查并通知，但只处理比上一轮更深层的元素，避免死循环。</li>
<li>仍有未送达的通知时，浏览器把它们留到下一帧，并在 <code>window</code> 上触发 <code>&quot;ResizeObserver loop completed with undelivered notifications&quot;</code> 错误。</li>
<li>这个错误通常不影响功能，但说明存在&quot;尺寸变化 → 改尺寸 → 再变化&quot;的循环，应该消除。</li>
</ul>
<h2>正常用法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
    <span class="hljs-keyword">const</span> width = entry.<span class="hljs-property">contentBoxSize</span>[<span class="hljs-number">0</span>].<span class="hljs-property">inlineSize</span>;
    entry.<span class="hljs-property">target</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">size</span> = width &lt; <span class="hljs-number">480</span> ? <span class="hljs-string">&#x27;small&#x27;</span> : <span class="hljs-string">&#x27;large&#x27;</span>;
  }
});
observer.<span class="hljs-title function_">observe</span>(card);
</code></pre></div>
<p>只改 <code>data-size</code>，样式里根据它调整内部元素，卡片自身尺寸不变，就不会循环。</p>
<h2>会产生循环的写法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">ResizeObserver</span>(<span class="hljs-function">(<span class="hljs-params">[entry]</span>) =&gt;</span> {
  entry.<span class="hljs-property">target</span>.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">\`<span class="hljs-subst">\${entry.contentRect.width / <span class="hljs-number">2</span>}</span>px\`</span>;
}).<span class="hljs-title function_">observe</span>(box);
</code></pre></div>
<p>修改高度又改变了尺寸。如果宽度也依赖高度（例如有滚动条出现），就会反复变化。</p>
<h2>解决办法</h2>
<ul>
<li>只在尺寸真的变化时更新，并比较新旧值，避免重复写入。</li>
<li>用 CSS 解决：<code>aspect-ratio</code>、容器查询 <code>@container</code> 能处理大部分&quot;按容器宽度调整&quot;的需求，不需要 JavaScript。</li>
<li>必须修改尺寸时放到 <code>requestAnimationFrame</code> 里，推迟到下一帧，打破同一帧内的循环。</li>
</ul>
<h2>和窗口 resize 事件的区别</h2>
<ul>
<li><code>window</code> 的 <code>resize</code> 只在视口变化时触发；ResizeObserver 能感知侧边栏收起、内容加载等导致的单个元素尺寸变化。</li>
<li>测试框架里出现这个错误时，可以在全局错误处理中按消息过滤，但不要在生产环境里吞掉所有错误。</li>
</ul>`};export{e as default};