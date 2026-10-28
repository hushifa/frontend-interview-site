var e={answerHtml:`<h2>简答</h2>
<ul>
<li>可迭代对象：有 <code>[Symbol.iterator]()</code> 方法，每次调用返回一个新的迭代器。数组、字符串、<code>Map</code>、<code>Set</code> 都是可迭代对象，普通对象不是。</li>
<li>迭代器：有 <code>next()</code> 方法，返回 <code>{ value, done }</code>，记录本次遍历的位置。</li>
<li>Generator 函数调用后返回生成器对象，它既是迭代器又是可迭代对象（<code>[Symbol.iterator]()</code> 返回自身），所以只能遍历一次。</li>
<li>生成器惰性执行：第一次 <code>next()</code> 才开始运行函数体，每次运行到 <code>yield</code> 暂停。</li>
<li>ES2025 的 Iterator helpers 在迭代器上提供 <code>map</code>、<code>filter</code>、<code>take</code>、<code>drop</code>、<code>flatMap</code>、<code>reduce</code>、<code>toArray</code> 等惰性方法。</li>
</ul>
<h2>手写可迭代对象</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">range</span>(<span class="hljs-params">start, end</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(start) || !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(end)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;区间端点必须是安全整数&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> {
    [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">iterator</span>]() {
      <span class="hljs-keyword">let</span> current = start;
      <span class="hljs-keyword">return</span> {
        <span class="hljs-title function_">next</span>(<span class="hljs-params"></span>) {
          <span class="hljs-keyword">if</span> (current &gt;= end) <span class="hljs-keyword">return</span> { <span class="hljs-attr">done</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">value</span>: <span class="hljs-literal">undefined</span> };
          <span class="hljs-keyword">return</span> { <span class="hljs-attr">done</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">value</span>: current++ };
        },
      };
    },
  };
}

<span class="hljs-keyword">const</span> numbers = <span class="hljs-title function_">range</span>(<span class="hljs-number">2</span>, <span class="hljs-number">5</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...numbers].<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 2,3,4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...numbers].<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 2,3,4</span>
<span class="hljs-keyword">const</span> iterator = numbers[<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">iterator</span>]();
<span class="hljs-keyword">const</span> first = iterator.<span class="hljs-title function_">next</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">value</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">done</span>); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>每次展开都会调用 <code>[Symbol.iterator]()</code> 得到新的游标，所以能重复遍历。</p>
<h2>Generator 的执行过程</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span>* <span class="hljs-title function_">sequence</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;开始执行&#x27;</span>);
  <span class="hljs-keyword">const</span> reply = <span class="hljs-keyword">yield</span> <span class="hljs-number">1</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(reply);
  <span class="hljs-keyword">return</span> <span class="hljs-number">9</span>;
}

<span class="hljs-keyword">const</span> it = <span class="hljs-title function_">sequence</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;已创建&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(it.<span class="hljs-title function_">next</span>().<span class="hljs-property">value</span>);     <span class="hljs-comment">// 开始执行 → 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(it.<span class="hljs-title function_">next</span>(<span class="hljs-string">&#x27;收到&#x27;</span>).<span class="hljs-property">value</span>); <span class="hljs-comment">// 收到 → 9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(it.<span class="hljs-title function_">next</span>().<span class="hljs-property">done</span>);      <span class="hljs-comment">// true</span>
</code></pre></div>
<ul>
<li><code>next(x)</code> 的参数成为上一个 <code>yield</code> 表达式的值；第一次 <code>next</code> 的参数没有对应的 <code>yield</code>，会被忽略。</li>
<li><code>return</code> 的值伴随 <code>done: true</code>，<code>for...of</code> 和展开不会包含它。</li>
<li><code>yield* iterable</code> 把遍历委托给另一个可迭代对象。</li>
<li>生成器不是线程，<code>next()</code> 之后的同步代码仍占用主线程，直到下一个 <code>yield</code>。</li>
</ul>
<h2>Iterator helpers（ES2025）</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span>* <span class="hljs-title function_">naturals</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> n = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) <span class="hljs-keyword">yield</span> n++;
}

<span class="hljs-keyword">const</span> result = <span class="hljs-title function_">naturals</span>()
  .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> n % <span class="hljs-number">2</span> === <span class="hljs-number">0</span>)
  .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> n * n)
  .<span class="hljs-title function_">take</span>(<span class="hljs-number">3</span>)
  .<span class="hljs-title function_">toArray</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result); <span class="hljs-comment">// [4, 16, 36]</span>
</code></pre></div>
<p>除 <code>map</code>、<code>filter</code>、<code>take</code> 外，惰性方法还有 <code>drop</code>（跳过前 n 项）和 <code>flatMap</code>（展开每项返回的迭代器）。每个方法返回新的迭代器，只有 <code>toArray</code>、<code>reduce</code>、<code>forEach</code>、<code>some</code>、<code>every</code>、<code>find</code> 会真正消费。对无限序列也只计算需要的项。数组要先调用 <code>values()</code> 才能使用这些方法；<code>Iterator.from(obj)</code> 把只有 <code>next()</code> 的对象包装成支持 helpers 的迭代器。</p>
<h2>用途</h2>
<ul>
<li>惰性序列：分页、树遍历、无限 ID 生成。</li>
<li>让自定义数据结构支持 <code>for...of</code> 和展开。</li>
<li>状态机：用暂停点代替手写的状态变量。</li>
</ul>
<p><code>[...iterator]</code> 会一次性取出全部值，对无限序列会永不结束。提前退出时的清理见<a href="/questions/js-iterator-closing/">《JavaScript 迭代器关闭和 return 方法有什么作用？》</a>，异步数据源见<a href="/questions/js-async-iterators/">《异步迭代器和 for await...of 适合处理什么数据？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>怎样让普通对象可以 <code>for...of</code>？给它加 <code>*[Symbol.iterator]() { yield* Object.entries(this); }</code>。</li>
<li>生成器的 <code>throw()</code> 做什么？在暂停的 <code>yield</code> 处抛出错误，可以被生成器内部的 <code>try/catch</code> 捕获。</li>
</ul>`};export{e as default};