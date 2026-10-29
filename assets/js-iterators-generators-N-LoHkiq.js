var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>for...of</code>、展开、解构能遍历数组、字符串、<code>Map</code>、<code>Set</code>，是因为它们都遵守同一套约定，叫迭代协议。普通对象没有遵守，所以不能直接 <code>for...of</code>。</p>
<p>这套约定有两个角色。可迭代对象有一个 <code>[Symbol.iterator]()</code> 方法，每次调用都返回一个新的迭代器。迭代器有一个 <code>next()</code> 方法，每调用一次返回 <code>{ value, done }</code>，并记住遍历到了哪里。</p>
<p>手写这两层比较麻烦，Generator 函数可以自动搞定。它调用后返回一个生成器对象，既是迭代器，又是可迭代对象，<code>[Symbol.iterator]()</code> 返回它自己，所以只能遍历一次。它是惰性执行的，第一次 <code>next()</code> 才开始运行函数体，每到一个 <code>yield</code> 就暂停。</p>
<p>ES2025 又在迭代器上加了 Iterator helpers，也就是 <code>map</code>、<code>filter</code>、<code>take</code>、<code>drop</code>、<code>flatMap</code>、<code>reduce</code>、<code>toArray</code> 等方法，可以直接链式调用，而且也是惰性的。</p>
</blockquote>
<h2>怎样让自己的对象能被 for...of 遍历</h2>
<p>下面手写一个 <code>range</code>，返回从 <code>start</code> 到 <code>end</code> 前一个数的序列。注意它被展开了两次，结果都一样。</p>
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
<p>展开语法做的事情是：调用 <code>numbers[Symbol.iterator]()</code> 拿到一个迭代器，然后不停调用 <code>next()</code>，直到 <code>done</code> 为 <code>true</code>。</p>
<p>为什么能展开两次？因为每次展开都会重新调用 <code>[Symbol.iterator]()</code>，拿到一个新的迭代器，<code>current</code> 从 <code>start</code> 重新开始。遍历的位置记在迭代器里，不在 <code>numbers</code> 上，所以可迭代对象本身可以反复遍历。</p>
<p>最后几行手动调用一次 <code>next()</code>，可以看到它返回的就是 <code>{ value: 2, done: false }</code>。</p>
<h2>Generator 是怎样一步一步执行的</h2>
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
<p>调用 <code>sequence()</code> 时，函数体一行都没执行，所以“已创建”先打印。第一次 <code>next()</code> 才开始运行，打印“开始执行”，走到 <code>yield 1</code> 暂停，把 1 交出来。</p>
<p>第二次调用 <code>next(&#x27;收到&#x27;)</code>，传进去的参数就成了上一个 <code>yield</code> 表达式的值，所以 <code>reply</code> 是“收到”。函数继续运行到 <code>return 9</code>，结束。第一次 <code>next</code> 传的参数没有对应的 <code>yield</code> 来接，会被忽略。</p>
<p><code>return</code> 的值会和 <code>done: true</code> 一起返回，但 <code>for...of</code> 和展开语法看到 <code>done: true</code> 就停了，不会包含这个值。想把遍历交给另一个可迭代对象，可以写 <code>yield* iterable</code>。</p>
<p>还要知道，生成器不是线程。调用 <code>next()</code> 以后，函数体在主线程上同步运行，直到下一个 <code>yield</code> 才把控制权交回来。</p>
<h2>Iterator helpers 怎样处理无限序列</h2>
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
<p><code>naturals()</code> 是一个无限序列，<code>while (true)</code> 永远不会结束，可这段代码很快就返回了 <code>[4, 16, 36]</code>。</p>
<p>因为这些方法是惰性的。<code>filter</code>、<code>map</code>、<code>take</code> 都只是返回一个新的迭代器，不会马上计算。只有 <code>toArray</code> 开始要值时，才一个一个往回取，<code>take(3)</code> 拿够 3 个就停，后面的数根本不会生成。同样会真正消费数据的方法还有 <code>reduce</code>、<code>forEach</code>、<code>some</code>、<code>every</code>、<code>find</code>。除了上面用到的，还有 <code>drop</code> 跳过前 n 项，<code>flatMap</code> 把每项返回的迭代器展开。</p>
<p>这些方法在迭代器上，不在数组上。数组要先调用 <code>values()</code> 拿到迭代器才能用。只有 <code>next()</code> 方法的对象，可以用 <code>Iterator.from(obj)</code> 包装一下再用。</p>
<h2>实际开发里用在哪里</h2>
<p>最常见的是惰性序列，比如分页数据、树的遍历、无限生成 ID，需要多少取多少。另一个用途是让自定义的数据结构支持 <code>for...of</code> 和展开。生成器还可以写状态机，用暂停的位置代替手写的状态变量。</p>
<p>要小心 <code>[...iterator]</code> 会一次取出所有值，对无限序列来说永远不会结束。提前退出时怎么清理，见<a href="/questions/js-iterator-closing/">《JavaScript 迭代器关闭和 return 方法有什么作用？》</a>；数据是异步到达的，见<a href="/questions/js-async-iterators/">《异步迭代器和 for await...of 适合处理什么数据？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样让普通对象可以 <code>for...of</code>？</strong></p>
<blockquote>
<p>给它加一个生成器方法：<code>*[Symbol.iterator]() { yield* Object.entries(this); }</code>，这样每次遍历拿到的就是 <code>[键, 值]</code>。</p>
</blockquote>
<p><strong>生成器的 <code>throw()</code> 做什么？</strong></p>
<blockquote>
<p>它在生成器暂停的那个 <code>yield</code> 处抛出一个错误。如果生成器里面在那里写了 <code>try/catch</code>，就能接住这个错误并继续执行。</p>
</blockquote>`};export{e as default};