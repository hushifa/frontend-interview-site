var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两个都是“观察器”，区别在看什么。MutationObserver 看的是 DOM 有没有被改：子节点增删（<code>childList</code>）、属性变化（<code>attributes</code>）、文字变化（<code>characterData</code>），加上 <code>subtree: true</code> 就连所有后代一起看。</p>
<p>它的回调不是每改一次就调一次，而是放在微任务里批量执行，一次把这段时间的所有变化记录交给你。</p>
<p>ResizeObserver 看的是元素尺寸。窗口缩放、字体加载完、父容器变宽都会让元素变大变小，可这些时候 DOM 一点都没改，MutationObserver 是察觉不到的。所以两者不能互相替代。</p>
<p>要注意，在 MutationObserver 回调里又改被观察的 DOM，会产生新记录、再触发回调，容易形成循环。观察范围也要尽量小。</p>
</blockquote>
<h2>用 MutationObserver 处理新插入的图片</h2>
<p>下面观察一个容器，有新的 <code>img[data-src]</code> 插进来就懒加载它。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MutationObserver</span>(<span class="hljs-function">(<span class="hljs-params">records</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> record <span class="hljs-keyword">of</span> records) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> node <span class="hljs-keyword">of</span> record.<span class="hljs-property">addedNodes</span>) {
      <span class="hljs-keyword">if</span> (node <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Element</span> &amp;&amp; node.<span class="hljs-title function_">matches</span>(<span class="hljs-string">&#x27;img[data-src]&#x27;</span>)) <span class="hljs-title function_">lazyLoad</span>(node);
    }
  }
});

observer.<span class="hljs-title function_">observe</span>(container, { <span class="hljs-attr">childList</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">subtree</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>为什么回调收到的是一个数组？因为它是批量的。同一段同步代码里插了十个节点，回调只执行一次，<code>records</code> 里有十条记录。这样比每次修改都回调一次省得多。</p>
<p><code>addedNodes</code> 里可能有文本节点，所以要先判断 <code>node instanceof Element</code> 再调用 <code>matches</code>。</p>
<h2>观察时的几个常用选项</h2>
<p>如果只关心某几个属性，用 <code>attributeFilter: [&#x27;class&#x27;]</code>，其他属性变化就不会产生记录。想知道属性改之前是什么，加 <code>attributeOldValue: true</code>，记录里会带上旧值。</p>
<p><code>observer.takeRecords()</code> 能把还没交给回调的记录立刻取出来，常在 <code>disconnect()</code> 停止观察前调用，免得漏掉最后几条。</p>
<h2>该用哪一个</h2>
<p>第三方脚本往页面里插了节点、富文本编辑器的内容变了，这些是 DOM 结构变化，用 MutationObserver。容器宽度变了要重新布局图表，这是尺寸变化，用 ResizeObserver。如果要知道元素有没有进入视口，两个都不对，要用 IntersectionObserver。</p>
<p>ResizeObserver 的具体用法见<a href="/questions/api-resize-observer/">《ResizeObserver 为什么可能出现循环通知错误？》</a>。</p>
<h2>常见追问</h2>
<p><strong>观察整个 <code>document.body</code> 有什么问题？</strong></p>
<blockquote>
<p>每次 DOM 变化都要生成记录。在更新很频繁的页面上，这个开销很明显。所以观察范围要尽量小，能观察一个容器就不要观察整个 body。</p>
</blockquote>
<p><strong>自己框架渲染的组件，需要用 MutationObserver 监听变化吗？</strong></p>
<blockquote>
<p>通常不需要。组件自己就知道什么时候更新，直接在更新逻辑里处理就行。MutationObserver 更适合观察不受你控制的 DOM，比如第三方脚本插入的内容。</p>
</blockquote>`};export{e as default};