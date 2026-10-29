var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>选数组方法，先看自己要做什么。每一项都要变个样，用 <code>map</code>；只留一部分，用 <code>filter</code>；找第一个符合条件的，用 <code>find</code>；只想知道有没有，用 <code>some</code>；要算出一个总数，用 <code>reduce</code>。</p>
<p>会改原数组的方法要单独记住：<code>push</code>、<code>pop</code>、<code>shift</code>、<code>unshift</code>、<code>splice</code>、<code>sort</code>、<code>reverse</code>、<code>fill</code>、<code>copyWithin</code>。<code>map</code>、<code>filter</code>、<code>slice</code>、<code>concat</code>、<code>flat</code> 返回新数组，ES2023 还给 <code>sort</code>、<code>reverse</code>、<code>splice</code> 配了不改原数组的版本 <code>toSorted</code>、<code>toReversed</code>、<code>toSpliced</code>，以及替换单个元素的 <code>with</code>。</p>
<p>要注意，新数组只是新的容器，里面的对象还是原来那几个，改元素的属性照样会影响原数组。</p>
<p>还有两个常见坑。<code>sort</code> 不传比较函数时按字符串排，数字排序要写 <code>(a, b) =&gt; a - b</code>。<code>forEach</code> 不会等 <code>async</code> 回调，要等待就用 <code>for...of</code> 加 <code>await</code>，或者 <code>Promise.all</code>。</p>
</blockquote>
<h2>按要做的事选方法</h2>
<p>大部分数组方法的区别，就在于“回调返回的东西被拿去做什么”。下面这张表按目的列出来：</p>
<table><thead><tr><th>目的</th><th>方法</th><th>返回值</th></tr></thead><tbody><tr><td>逐项转换</td><td><code>map</code></td><td>等长新数组</td></tr><tr><td>筛选</td><td><code>filter</code></td><td>满足条件的新数组</td></tr><tr><td>找第一个</td><td><code>find</code> / <code>findIndex</code></td><td>元素或 <code>undefined</code> / 索引或 <code>-1</code></td></tr><tr><td>从后找</td><td><code>findLast</code> / <code>findLastIndex</code></td><td>同上</td></tr><tr><td>是否存在 / 是否全部满足</td><td><code>some</code> / <code>every</code></td><td>布尔值，可提前结束</td></tr><tr><td>汇总</td><td><code>reduce</code></td><td>累加器</td></tr><tr><td>副作用</td><td><code>forEach</code> / <code>for...of</code></td><td>—</td></tr></tbody></table>
<p>只想判断有没有，就用 <code>some</code>，不要写 <code>filter(...).length &gt; 0</code>。<code>some</code> 找到一个就停，<code>filter</code> 却要把整个数组走完，还白白造出一个新数组。</p>
<h2>sort 为什么会把 10 排在 2 前面</h2>
<p>先看 <code>sort</code> 和 <code>toSorted</code> 放在一起的效果，注意 <code>values</code> 本身有没有变。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> values = [<span class="hljs-number">10</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>];
<span class="hljs-keyword">const</span> numeric = values.<span class="hljs-title function_">toSorted</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>));  <span class="hljs-comment">// 10,2,1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(numeric.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">sort</span>() === values); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,10,2</span>
</code></pre></div>
<p><code>toSorted</code> 排完以后，<code>values</code> 还是 <code>10,2,1</code>，结果放在新数组 <code>numeric</code> 里。</p>
<p>可是调用 <code>values.sort()</code> 以后，结果是 <code>1,10,2</code>，<code>10</code> 跑到了 <code>2</code> 前面。原因是 <code>sort</code> 不传比较函数时，会把元素都转成字符串再比。字符串是一位一位比的，<code>&#x27;10&#x27;</code> 的第一位 <code>&#x27;1&#x27;</code> 比 <code>&#x27;2&#x27;</code> 小，所以排在前面。改法就是传比较函数 <code>(a, b) =&gt; a - b</code>，按数值比。</p>
<p><code>values.sort() === values</code> 是 <code>true</code>，说明 <code>sort</code> 是在原数组上排好，再把原数组返回。规范还要求排序是稳定的，也就是比较结果相等的元素，排序后保持原来的先后顺序。</p>
<p><code>fill</code> 和 <code>copyWithin</code> 也一样，原地修改并返回原数组。<code>splice</code> 比较特别，它返回的是被删掉的那些元素，而不是修改后的数组；名字很像的 <code>slice</code> 则不改原数组，只是截出一段新数组。<code>concat</code> 把几个数组拼成新数组，<code>flat</code> 把嵌套数组展开成新数组。</p>
<h2>返回新数组，为什么原数据还是被改了</h2>
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
<p><code>selected</code> 是 <code>filter</code> 返回的新数组，可改了 <code>selected[0].score</code>，<code>source[0].score</code> 也变成了 20。</p>
<p>因为新数组只是一个新的“盒子”，盒子里放的还是原来那个对象。两个数组的第 0 项指向同一个对象，从哪边改都一样。这种只复制最外一层的做法叫浅拷贝。</p>
<p>想改某一项又不影响原数据，就像第二段那样，只给要改的那一项创建新对象 <code>{ ...row, score: 30 }</code>，其他项直接复用。这叫不可变更新，React 里更新列表状态就是这么写的。</p>
<h2>空数组和稀疏数组的边界</h2>
<p>空数组有几个反直觉的结果。<code>[].some(fn)</code> 是 <code>false</code>，因为一个满足的都没有；<code>[].every(fn)</code> 却是 <code>true</code>，因为找不到不满足的。空数组调用 <code>reduce</code> 又不传初始值，会直接抛 <code>TypeError</code>，所以求和要写成 <code>reduce((s, x) =&gt; s + x, 0)</code>。</p>
<p>稀疏数组是中间有空位的数组，比如 <code>[, 2]</code>。<code>map</code>、<code>forEach</code>、<code>filter</code> 会跳过空位，展开语法和 <code>for...of</code> 却会把空位读成 <code>undefined</code>，同一个数组用不同方法遍历，结果不一致。所以删除元素不要用 <code>delete arr[i]</code>，它会留下空位，应该用 <code>splice</code> 或 <code>filter</code>。</p>
<h2>forEach 为什么不等 async 回调</h2>
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
<p><code>forEach</code> 只管把回调调用一遍，不看回调的返回值。<code>async</code> 回调返回的是 Promise，<code>forEach</code> 拿到以后直接丢掉，自己马上返回 <code>undefined</code>，所以后面的代码不会等这些任务完成。</p>
<p><code>map</code> 不一样，它会把每个 Promise 收集进数组。交给 <code>Promise.all</code> 等待，就是几个任务一起跑，也就是并行。如果要一个做完再做下一个，就写 <code>for (const x of arr) await task(x)</code>。另外 <code>forEach</code> 也不能用 <code>break</code> 提前结束，需要中途停下时同样改用 <code>for...of</code>。</p>
<h2>怎样按字段分组</h2>
<p><code>Object.groupBy</code>（ES2024）按回调的返回值把元素分组：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> items = [
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;js&#x27;</span> },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;css&#x27;</span> },
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;js&#x27;</span> },
];
<span class="hljs-keyword">const</span> groups = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">groupBy</span>(items, <span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">type</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(groups.<span class="hljs-property">js</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> item.<span class="hljs-property">name</span>)); <span class="hljs-comment">// [&#x27;a&#x27;, &#x27;c&#x27;]</span>
</code></pre></div>
<p>它返回的对象没有原型，也就是原型为 <code>null</code>，所以不能调用 <code>groups.hasOwnProperty</code>，判断某个键在不在要用 <code>Object.hasOwn</code>。分组的键不是字符串时，比如要按对象分组，就用 <code>Map.groupBy</code>，它返回一个 <code>Map</code>。</p>
<p>如果数据是一项一项异步到达的，可以用 <code>Array.fromAsync</code>（ES2026），它会逐个等待异步可迭代对象里的值，最后收集成数组。</p>
<h2>常见追问</h2>
<p><strong><code>map</code> 回调里修改了元素，算不算修改原数组？</strong></p>
<blockquote>
<p><code>map</code> 本身不会改原数组这个容器，但回调拿到的是原来的元素。如果元素是对象，回调里改了它的属性，原数组里的对象也就被改了，语言不会拦着。所以 <code>map</code> 回调里最好只返回新值，不去改传进来的元素。</p>
</blockquote>
<p><strong><code>for...in</code> 能遍历数组吗？</strong></p>
<blockquote>
<p>能，但不推荐。它拿到的键是字符串 <code>&#x27;0&#x27;</code>、<code>&#x27;1&#x27;</code>，而且会把原型链上可枚举的属性也遍历出来。遍历数组用 <code>for...of</code> 或者数组方法。</p>
</blockquote>`};export{e as default};