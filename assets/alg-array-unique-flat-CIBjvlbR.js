var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>接口返回的标签列表里有重复项，要去掉重复的，最简单的写法是 <code>[...new Set(arr)]</code>。Set 里每个值只能出现一次，把数组放进去再展开出来，重复项就没了，顺序还保持第一次出现的顺序。</p>
<p>Set 判断“相同”用的是 SameValueZero 规则：和 <code>===</code> 基本一样，区别是 <code>NaN</code> 和 <code>NaN</code> 算相同。所以 <code>indexOf</code> 写法去不掉的 <code>NaN</code>，Set 能去掉。可是对象按引用比较，两个内容一样的 <code>{ id: 1 }</code> 会被当成不同的值。对象数组要按 <code>id</code> 去重，就用一个 Map，以 <code>id</code> 为键记录。</p>
<p>扁平化是把 <code>[1, [2, [3]]]</code> 变成 <code>[1, 2, 3]</code>。现在直接用 <code>arr.flat(Infinity)</code>，<code>flat()</code> 不传参数默认只展开一层。手写时遍历数组，遇到数组就递归展开，不是数组就放进结果；嵌套很深时可以改用显式栈，避免递归层数太多导致栈溢出。</p>
<p>要注意，<code>flat</code> 会跳过稀疏数组里的空位，手写版本如果用 <code>for</code> 循环按下标遍历，会把空位当成 <code>undefined</code> 放进结果，两者结果不一样。</p>
</blockquote>
<h2>去重的几种写法</h2>
<p>下面对同一个数组试三种写法，重点看 <code>NaN</code> 和对象的结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> list = [<span class="hljs-number">1</span>, <span class="hljs-string">&#x27;1&#x27;</span>, <span class="hljs-number">1</span>, <span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>, { <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> }, { <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> }];

<span class="hljs-keyword">const</span> bySet = [...<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>(list)];
<span class="hljs-keyword">const</span> byIndexOf = list.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">item, index</span>) =&gt;</span> list.<span class="hljs-title function_">indexOf</span>(item) === index);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bySet.<span class="hljs-property">length</span>); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(byIndexOf.<span class="hljs-property">length</span>); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bySet.<span class="hljs-title function_">includes</span>(<span class="hljs-title class_">NaN</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(byIndexOf.<span class="hljs-title function_">includes</span>(<span class="hljs-title class_">NaN</span>)); <span class="hljs-comment">// false</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">uniqueBy</span>(<span class="hljs-params">items, getKey</span>) {
  <span class="hljs-keyword">const</span> seen = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> items) {
    <span class="hljs-keyword">const</span> key = <span class="hljs-title function_">getKey</span>(item);
    <span class="hljs-keyword">if</span> (!seen.<span class="hljs-title function_">has</span>(key)) seen.<span class="hljs-title function_">set</span>(key, item);
  }
  <span class="hljs-keyword">return</span> [...seen.<span class="hljs-title function_">values</span>()];
}

<span class="hljs-keyword">const</span> users = [{ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;甲&#x27;</span> }, { <span class="hljs-attr">id</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;乙&#x27;</span> }, { <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;甲2&#x27;</span> }];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">uniqueBy</span>(users, <span class="hljs-function">(<span class="hljs-params">user</span>) =&gt;</span> user.<span class="hljs-property">id</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">user</span>) =&gt;</span> user.<span class="hljs-property">name</span>).<span class="hljs-title function_">join</span>()); <span class="hljs-comment">// 甲,乙</span>
</code></pre></div>
<p>Set 得到 5 项，<code>indexOf</code> 写法只有 4 项，差的就是 <code>NaN</code>：Set 保留了一个，<code>indexOf</code> 写法把两个都丢了。因为 <code>indexOf</code> 用的是 <code>===</code>，<code>NaN === NaN</code> 是 <code>false</code>，<code>list.indexOf(NaN)</code> 永远返回 -1，跟任何下标都不相等，所以每个 <code>NaN</code> 都被过滤掉了。</p>
<p>两个 <code>{ id: 1 }</code> 在两种写法里都保留了下来，因为它们是两个不同的对象。<code>1</code> 和 <code>&#x27;1&#x27;</code> 也都保留，因为类型不同。按字段去重时，<code>uniqueBy</code> 用 Map 记录每个 <code>id</code> 第一次出现的那一项，后面同 <code>id</code> 的都跳过。想保留最后一次出现的那项，去掉 <code>has</code> 判断，每次都 <code>set</code> 就行。</p>
<p>为什么不用双层循环？双层循环每一项都要和前面所有项比较，是 O(n²)。Set 和 Map 查找平均是常数时间，整体接近 O(n)。</p>
<h2>手写扁平化</h2>
<p>先看递归版本，可以指定展开几层，行为对齐原生 <code>flat</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">flatten</span>(<span class="hljs-params">arr, depth = <span class="hljs-number">1</span></span>) {
  <span class="hljs-keyword">const</span> result = [];
  arr.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(item) &amp;&amp; depth &gt; <span class="hljs-number">0</span>) {
      result.<span class="hljs-title function_">push</span>(...<span class="hljs-title function_">flatten</span>(item, depth - <span class="hljs-number">1</span>));
    } <span class="hljs-keyword">else</span> {
      result.<span class="hljs-title function_">push</span>(item);
    }
  });
  <span class="hljs-keyword">return</span> result;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flattenDeep</span>(<span class="hljs-params">arr</span>) {
  <span class="hljs-keyword">const</span> stack = [...arr];
  <span class="hljs-keyword">const</span> result = [];
  <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">const</span> item = stack.<span class="hljs-title function_">pop</span>();
    <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(item)) {
      stack.<span class="hljs-title function_">push</span>(...item);
    } <span class="hljs-keyword">else</span> {
      result.<span class="hljs-title function_">push</span>(item);
    }
  }
  <span class="hljs-keyword">return</span> result.<span class="hljs-title function_">reverse</span>();
}

<span class="hljs-keyword">const</span> nested = [<span class="hljs-number">1</span>, [<span class="hljs-number">2</span>, [<span class="hljs-number">3</span>, [<span class="hljs-number">4</span>]]], <span class="hljs-number">5</span>];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">flatten</span>(nested))); <span class="hljs-comment">// [1,2,[3,[4]],5]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">flatten</span>(nested, <span class="hljs-title class_">Infinity</span>))); <span class="hljs-comment">// [1,2,3,4,5]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(<span class="hljs-title function_">flattenDeep</span>(nested))); <span class="hljs-comment">// [1,2,3,4,5]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">flatten</span>([<span class="hljs-number">1</span>, , [<span class="hljs-number">2</span>]]).<span class="hljs-property">length</span>); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p><code>flatten(nested)</code> 为什么只展开了一层？因为 <code>depth</code> 默认是 1，进入下一层时减到 0，再遇到数组就原样放进结果，和 <code>nested.flat()</code> 一样。传 <code>Infinity</code> 时怎么减都大于 0，就会一直展开到底。</p>
<p><code>flattenDeep</code> 不用递归，而是自己维护一个栈。每次从栈顶取一项，是数组就把它的元素压回栈里，不是就放进结果。因为是从末尾往前取的，结果是倒序的，最后要 <code>reverse</code> 一次。它的好处是嵌套再深也不会因为递归太多层而栈溢出。</p>
<p>最后一行的 <code>[1, , [2]]</code> 中间有一个空位，结果长度是 2，不是 3。因为 <code>forEach</code> 会跳过空位，这和原生 <code>flat</code> 跳过空位的行为一致。如果改成 <code>for (let i = 0; i &lt; arr.length; i++)</code>，读到空位得到 <code>undefined</code>，结果就会多一项。</p>
<h2>常见追问</h2>
<p><strong><code>arr.toString().split(&#x27;,&#x27;)</code> 能扁平化吗？</strong></p>
<blockquote>
<p>只有数组里全是数字或简单字符串时能凑合用。它会把所有值变成字符串，数字 1 变成 <code>&#x27;1&#x27;</code>，对象变成 <code>&#x27;[object Object]&#x27;</code>，字符串里本身有逗号的还会被拆开，所以不推荐。</p>
</blockquote>
<p><strong>Set 去重之后顺序会变吗？</strong></p>
<blockquote>
<p>不会。Set 按插入顺序保存值，重复的值不会再插入，所以结果保持每个值第一次出现的顺序。</p>
</blockquote>
<p><strong>对象数组能用 JSON.stringify 当键去重吗？</strong></p>
<blockquote>
<p>能用但有坑。属性顺序不同的两个对象，比如 <code>{ a: 1, b: 2 }</code> 和 <code>{ b: 2, a: 1 }</code>，序列化出的字符串不同，会被当成两个；<code>undefined</code> 和函数属性会被丢掉。有明确的唯一字段时，按字段去重更可靠。</p>
</blockquote>`};export{e as default};