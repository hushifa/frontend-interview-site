var e={answerHtml:`<h2>简答</h2>
<ul>
<li>MutationObserver 观察 DOM 结构变化：子节点增删（<code>childList</code>）、属性（<code>attributes</code>）、文本（<code>characterData</code>），<code>subtree: true</code> 时包括所有后代。</li>
<li>回调在微任务中执行，一次收到这段时间内的所有变化记录。</li>
<li>ResizeObserver 观察元素尺寸变化，窗口缩放、字体加载、父容器变宽都会触发，这些情况下 DOM 并没有变化。</li>
<li>回调里修改被观察的 DOM，会产生新的记录并再次触发回调，容易形成循环。</li>
</ul>
<h2>MutationObserver 示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MutationObserver</span>(<span class="hljs-function">(<span class="hljs-params">records</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> record <span class="hljs-keyword">of</span> records) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> record.<span class="hljs-property">addedNodes</span>) {
      <span class="hljs-keyword">if</span> (node <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Element</span> &amp;&amp; node.<span class="hljs-title function_">matches</span>(<span class="hljs-string">&#x27;img[data-src]&#x27;</span>)) <span class="hljs-title function_">lazyLoad</span>(node);
    }
  }
});

observer.<span class="hljs-title function_">observe</span>(container, { <span class="hljs-attr">childList</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">subtree</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<ul>
<li><code>attributeFilter: [&#x27;class&#x27;]</code> 只观察指定属性，减少回调次数。</li>
<li><code>attributeOldValue: true</code> 在记录中保留旧值。</li>
<li><code>observer.takeRecords()</code> 取出还没交给回调的记录，<code>disconnect()</code> 停止观察。</li>
</ul>
<h2>选哪一个</h2>
<table><thead><tr><th>需求</th><th>用</th></tr></thead><tbody><tr><td>第三方脚本插入了节点</td><td>MutationObserver</td></tr><tr><td>富文本编辑器的内容变化</td><td>MutationObserver</td></tr><tr><td>容器宽度变化后重新布局图表</td><td>ResizeObserver</td></tr><tr><td>元素进入视口</td><td>IntersectionObserver</td></tr></tbody></table>
<h2>注意事项</h2>
<ul>
<li>观察 <code>document.body</code> 的整个子树，每次 DOM 变化都要产生记录，在频繁更新的页面上开销明显，范围应尽量小。</li>
<li>自己框架渲染的组件，通常在组件内部就知道何时更新，不需要用 MutationObserver 观察。</li>
<li>ResizeObserver 的具体用法见<a href="/questions/api-resize-observer/">《ResizeObserver 为什么可能出现循环通知错误？》</a>。</li>
</ul>`};export{e as default};