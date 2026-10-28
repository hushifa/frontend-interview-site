var e={answerHtml:`<h2>简答</h2>
<ul>
<li>会修改原数组：<code>push</code>、<code>pop</code>、<code>shift</code>、<code>unshift</code>、<code>splice</code>、<code>sort</code>、<code>reverse</code>、<code>fill</code>、<code>copyWithin</code>。</li>
<li>返回新数组：<code>map</code>、<code>filter</code>、<code>slice</code>、<code>concat</code>、<code>flat</code>，以及 ES2023 的 <code>toSorted</code>、<code>toReversed</code>、<code>toSpliced</code>、<code>with</code>。</li>
<li>新数组是浅复制，里面的对象仍是同一个引用。</li>
<li><code>sort</code> 默认按字符串比较，数字排序要传 <code>(a, b) =&gt; a - b</code>。</li>
<li><code>forEach</code> 不能 <code>break</code>，也不会等待 <code>async</code> 回调；需要等待时用 <code>for...of</code> 加 <code>await</code> 或 <code>Promise.all</code>。</li>
</ul>
<h2>按意图选方法</h2>
<table><thead><tr><th>目的</th><th>方法</th><th>返回值</th></tr></thead><tbody><tr><td>逐项转换</td><td><code>map</code></td><td>等长新数组</td></tr><tr><td>筛选</td><td><code>filter</code></td><td>满足条件的新数组</td></tr><tr><td>找第一个</td><td><code>find</code> / <code>findIndex</code></td><td>元素或 <code>undefined</code> / 索引或 <code>-1</code></td></tr><tr><td>从后找</td><td><code>findLast</code> / <code>findLastIndex</code></td><td>同上</td></tr><tr><td>是否存在 / 是否全部满足</td><td><code>some</code> / <code>every</code></td><td>布尔值，可提前结束</td></tr><tr><td>汇总</td><td><code>reduce</code></td><td>累加器</td></tr><tr><td>副作用</td><td><code>forEach</code> / <code>for...of</code></td><td>—</td></tr></tbody></table>
<p>只判断是否存在时用 <code>some</code>，不要 <code>filter(...).length &gt; 0</code>。</p>
<h2>sort 与 toSorted</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> values = [<span class="hljs-number">10</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>];
<span class="hljs-keyword">const</span> numeric = values.<span class="hljs-title function_">toSorted</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>));  <span class="hljs-comment">// 10,2,1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(numeric.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">sort</span>() === values); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,10,2</span>
</code></pre></div>
<p><code>sort()</code> 不传比较函数时把元素转成字符串比较，所以 <code>10</code> 排在 <code>2</code> 前面。<code>sort</code> 原地排序并返回原数组；<code>toSorted</code> 返回排好序的副本。规范要求排序稳定。</p>
<p><code>splice</code> 返回被删除的元素数组，不是修改后的数组；<code>slice</code> 不修改原数组。</p>
<h2>新数组不等于深拷贝</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> source = [{ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">score</span>: <span class="hljs-number">10</span> }];
<span class="hljs-keyword">const</span> selected = source.<span class="hljs-title function_">filter</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-literal">true</span>);
selected[<span class="hljs-number">0</span>].<span class="hljs-property">score</span> = <span class="hljs-number">20</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(source[<span class="hljs-number">0</span>].<span class="hljs-property">score</span>); <span class="hljs-comment">// 20</span>

<span class="hljs-keyword">const</span> updated = source.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">row</span> =&gt;</span>
  row.<span class="hljs-property">id</span> === <span class="hljs-number">1</span> ? { ...row, <span class="hljs-attr">score</span>: <span class="hljs-number">30</span> } : row,
);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(source[<span class="hljs-number">0</span>].<span class="hljs-property">score</span>);  <span class="hljs-comment">// 20</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(updated[<span class="hljs-number">0</span>].<span class="hljs-property">score</span>); <span class="hljs-comment">// 30</span>
</code></pre></div>
<p>不可变更新的做法是：只为被修改的那一项创建新对象，其余项复用原引用。</p>
<h2>边界</h2>
<ul>
<li><code>[].some(fn)</code> 为 <code>false</code>，<code>[].every(fn)</code> 为 <code>true</code>。</li>
<li>空数组调用 <code>reduce</code> 不传初始值会抛 <code>TypeError</code>，求和时写 <code>reduce((s, x) =&gt; s + x, 0)</code>。</li>
<li>稀疏数组 <code>[, 2]</code> 的空位会被 <code>map</code>、<code>forEach</code>、<code>filter</code> 跳过，但展开和 <code>for...of</code> 会把空位读成 <code>undefined</code>。不要用 <code>delete arr[i]</code> 删元素。</li>
</ul>
<h2>async 回调</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">double</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">return</span> value * <span class="hljs-number">2</span>;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">calculate</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> values = [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>];
  <span class="hljs-keyword">const</span> results = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(values.<span class="hljs-title function_">map</span>(double));
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(results.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 2,4,6</span>
}

<span class="hljs-title function_">calculate</span>();
</code></pre></div>
<p><code>forEach(async ...)</code> 只是发起了几个 Promise，<code>forEach</code> 本身立即返回 <code>undefined</code>。要并行就 <code>Promise.all(arr.map(...))</code>，要串行就 <code>for (const x of arr) await task(x)</code>。</p>
<h2>分组与异步收集</h2>
<p><code>Object.groupBy</code>（ES2024）按回调返回的键分组，结果是原型为 <code>null</code> 的对象，要用 <code>Object.hasOwn</code> 判断键；键不是字符串时用 <code>Map.groupBy</code>。<code>Array.fromAsync</code>（ES2026）把异步可迭代对象逐个等待后收集成数组。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> items = [
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;js&#x27;</span> },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;css&#x27;</span> },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;js&#x27;</span> },
];
<span class="hljs-keyword">const</span> groups = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">groupBy</span>(items, <span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">type</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(groups.<span class="hljs-property">js</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">name</span>)); <span class="hljs-comment">// [&#x27;a&#x27;, &#x27;c&#x27;]</span>
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li><code>map</code> 回调里修改元素算不算修改原数组？<code>map</code> 本身不改容器，但回调可以改元素对象，语言不会阻止。</li>
<li><code>for...in</code> 能遍历数组吗？能，但会遍历到继承的可枚举属性，键是字符串，不推荐。</li>
</ul>`};export{e as default};