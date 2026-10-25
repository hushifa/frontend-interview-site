var e={answerHtml:`<p>选择数组方法时，先说清想得到什么结果。如果要把每项变成另一种表示，用 map；只留下满足条件的项，用 filter；找到一个就够了，用 find。方法名能直接表达意图，比把所有遍历都塞进 reduce 或 forEach 更容易维护。</p>
<p>另一层问题是：这个方法会不会改变原数组？界面状态、缓存和多人共享的数据里，意外修改原数组往往比循环写得长一点更难排查。</p>
<h3>常见任务和对应返回值</h3>
<table><thead><tr><th>想做的事情</th><th>常用方法</th><th>返回什么</th></tr></thead><tbody><tr><td>逐项转换</td><td>map</td><td>新数组，通常保留原有位置关系</td></tr><tr><td>筛选部分元素</td><td>filter</td><td>通过条件的元素组成的新数组</td></tr><tr><td>找第一个匹配值</td><td>find</td><td>元素或 undefined</td></tr><tr><td>找第一个匹配位置</td><td>findIndex</td><td>索引或 -1</td></tr><tr><td>至少有一个满足</td><td>some</td><td>布尔值，可以提前结束</td></tr><tr><td>所有被检查项都满足</td><td>every</td><td>布尔值，可以提前结束</td></tr><tr><td>累积出一个结果</td><td>reduce</td><td>由累加器定义的结果</td></tr><tr><td>对每项执行副作用</td><td>forEach</td><td>undefined，不收集回调返回值</td></tr></tbody></table>
<p>只是检查是否存在时，没必要用 filter 先建立完整数组再判断 length。需要可以随时 break 的逐项业务流程时，普通 for...of 也很合适，代码不必为了“函数式”而变得难读。</p>
<h3>sort 会原地修改，toSorted 返回新数组</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> values = [<span class="hljs-number">10</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>];
<span class="hljs-keyword">const</span> numeric = values.<span class="hljs-title function_">toSorted</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>));  <span class="hljs-comment">// 10,2,1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(numeric.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">sort</span>() === values); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,10,2</span>
</code></pre></div>
<p>sort 默认将相应元素转为字符串后按 UTF-16 码元顺序比较，不是按数值大小，所以 10 会排在 2 前面。数字升序可以提供 <code>(a, b) =&gt; a - b</code>；比较函数应表达小于、等于、大于，而不是随便返回一个布尔值。</p>
<p>sort 会修改原数组并返回这个数组本身；toSorted 执行相应的复制排序。现代标准要求排序稳定，但稳定性不代表一个不满足比较规则的函数也能得到可靠结果。</p>
<p>类似地，reverse、splice、push、pop、shift、unshift、fill、copyWithin 都会改变原数组的内容或结构。toReversed、toSpliced、with 等提供对应的一些复制操作，具体可用性要按项目目标环境确认。</p>
<p>slice 通常用于复制一段，不会像 splice 那样从原数组删除元素。splice 的返回值是被删除项组成的数组，不是“修改后的完整数组”，这也是经常混淆的地方。</p>
<h3>新数组不代表里面的对象也复制了</h3>
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
<p>filter 创建了新的数组容器，但元素仍然是原对象引用，因此修改 selected[0].score 也会影响 source。map、slice、展开语法以及多数数组复制方法，同样不能自动完成深拷贝。</p>
<p>第二段为要修改的那项建立新对象，其他不变项目可以共享引用，这是常见的不可变状态更新方式。若对象内部还有嵌套数据，需要按实际修改路径继续复制。</p>
<p>说 map “不修改原数组”，指方法自身不会像 sort 那样重排原容器。回调仍然可以直接修改原数组或元素对象，语言不会阻止这些副作用。不能只看到用了 map，就认定整段代码不可变。</p>
<h3>空数组和空位各有规则</h3>
<p><code>[].some(...)</code> 为 false，<code>[].every(...)</code> 为 true，因为没有任何被检查元素违反条件。如果业务要求“至少有一个项目，并且全部通过”，还必须单独检查 length。</p>
<p>reduce 在没有初始值且没有可用元素时会抛 TypeError。求和时给出初始值 0，既清楚也能处理空数组；但初始值具体是什么，应由累积结果的类型决定。</p>
<p>稀疏数组的空位与显式的 undefined 不完全一样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> sparse = [, <span class="hljs-number">2</span>];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sparse.<span class="hljs-property">length</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> <span class="hljs-keyword">in</span> sparse); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> <span class="hljs-keyword">in</span> sparse.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> value * <span class="hljs-number">2</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> <span class="hljs-keyword">in</span> [...sparse]); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sparse.<span class="hljs-title function_">includes</span>(<span class="hljs-literal">undefined</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sparse.<span class="hljs-title function_">indexOf</span>(<span class="hljs-literal">undefined</span>)); <span class="hljs-comment">// -1</span>
</code></pre></div>
<p>map、forEach、filter 等对普通稀疏数组会跳过不存在的索引，map 的结果可保留相应空位。展开与数组迭代器会把这种位置读取为 undefined，使结果变成实际存在的元素。includes 会按相应规则把空位当作 undefined，而 indexOf 会跳过不存在的索引。</p>
<p>find 及其相关方法对空位的访问规则又不同，不能背成“所有数组方法都会跳过空位”。原型上的索引属性也可能影响属性存在性检查，因此这里以没有相关原型污染的普通数组为前提。日常业务尽量避免用 delete 制造空洞；删除项目通常使用 splice 或对应复制操作。</p>
<h3>async 回调不会让 forEach 自动等待</h3>
<p>forEach 直接忽略回调的返回值。给回调加 async，会得到每次调用的 Promise，但 forEach 不会收集并等待这些 Promise；写 <code>await array.forEach(...)</code> 也只是在等待它返回的 undefined，不能等待所有任务完成。</p>
<p>若需要并行等待，可以明确使用 Promise.all 收集结果：</p>
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
<p>真实任务可能拒绝，调用方应处理错误。Promise.all 不会自动取消其他已开始的操作，也不会限制并发数量；任务多时需要单独的并发控制。</p>
<p>若后一步必须等前一步完成，用 async 函数中的 for...of 配合 await 更直接。最后还应避免在遍历过程中随意改动数组长度或删除未访问项，不同方法对初始长度和当前位置的处理会让结果不直观；确需这样做时，先定义清楚遍历语义。</p>`};export{e as default};