var e={answerHtml:`<h2>简答</h2>
<ul>
<li>可迭代对象实现 Symbol.iterator，返回的迭代器提供 next()，每次返回 { value, done }。</li>
<li>Generator 函数调用后返回一个既是迭代器又是可迭代对象的生成器，用 yield 暂停。</li>
<li>数组可以重复遍历，生成器对象只能遍历一次。</li>
<li>惰性求值只在需要时计算下一项；ES2025 的 Iterator helpers 可以直接链式处理迭代器。</li>
</ul>
<p>可以把可迭代对象理解成“能开始一次遍历的数据来源”，把迭代器理解成“这次遍历的游标”。前者提供入口，后者记住当前进度；二者可以由同一个对象实现，也可以分别实现。</p>
<p>for...of、数组展开、数组解构等语法不是只认识数组，它们会按迭代协议请求数据。普通对象即使有很多属性，也不自动拥有这种遍历方式；要处理它的记录字段，可以先用 Object.entries 等明确转换。</p>
<h2>两个协议各自要求什么</h2>
<p>可迭代对象提供 Symbol.iterator 方法。消费者调用它，得到一个迭代器。</p>
<p>迭代器提供 next() 方法，每次返回一个结果对象。done 表示是否结束，value 是本次结果。done:false 时消费者继续处理 value；done:true 表示遍历已经结束，value 可以表示终止结果，但一般 for...of 不会把这个终止值当成普通元素输出。</p>
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
<p>这里是 start 到 end、不包含 end 的整数区间。每次调用 Symbol.iterator 都创建一份 current，所以可以重新遍历，也可以同时有多个互不干扰的游标。</p>
<p>返回的游标只实现了 next，没有给自己定义 Symbol.iterator，因此它是迭代器，但不能直接假定它也是可迭代对象。许多内置迭代器会额外让 <code>iterator[Symbol.iterator]()</code> 返回自身，从而同时满足两种协议。</p>
<h2>Generator 用函数暂停点保存遍历状态</h2>
<p>手写游标需要自己维护当前位置。Generator 通过 function*、yield 和 next，把暂停位置与局部变量状态一起保存下来：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span>* <span class="hljs-title function_">sequence</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;开始执行&#x27;</span>);
  <span class="hljs-keyword">const</span> reply = <span class="hljs-keyword">yield</span> <span class="hljs-number">1</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(reply);
  <span class="hljs-keyword">return</span> <span class="hljs-number">9</span>;
}

<span class="hljs-keyword">const</span> sequenceIterator = <span class="hljs-title function_">sequence</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;已创建&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sequenceIterator.<span class="hljs-title function_">next</span>().<span class="hljs-property">value</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sequenceIterator.<span class="hljs-title function_">next</span>(<span class="hljs-string">&#x27;收到&#x27;</span>).<span class="hljs-property">value</span>); <span class="hljs-comment">// 9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sequenceIterator.<span class="hljs-title function_">next</span>().<span class="hljs-property">done</span>); <span class="hljs-comment">// true</span>
<span class="hljs-comment">// 输出顺序：已创建 → 开始执行 → 1 → 收到 → 9 → true</span>
</code></pre></div>
<p>调用 sequence() 先得到生成器对象，函数体还没有开始运行。第一次 next 才执行到 yield 1，向调用方交出 <code>{ value: 1, done: false }</code>，并暂停在这个位置。</p>
<p>第二次 next(&#x27;收到&#x27;) 恢复执行，使前一个 yield 表达式得到 &#x27;收到&#x27;，然后继续到 return 9，产生 <code>{ value: 9, done: true }</code>。生成器结束后，后续 next 通常继续得到 done:true。</p>
<p>第一下 next 传入的参数没有一个已经暂停的 yield 表达式来接收，因此不能把它当成 Generator 函数的初始化参数；初始化参数应在调用 sequence(...) 时传入。</p>
<h2>可重复的数据来源与一次性的游标要区分</h2>
<p>Generator 对象同时是迭代器和可迭代对象，它的 Symbol.iterator 返回自身。已经消费过的进度不会因为又写了一次 for...of 或展开语法就重置。</p>
<p>如果需要重新遍历，通常重新调用 Generator 函数，得到一个新生成器。前面的 range 则通过每次提供新游标实现重复遍历。接口使用者应该知道拿到的是可重复来源，还是正在消费中的一次性流程。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span>* <span class="hljs-title function_">words</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">yield</span> <span class="hljs-string">&#x27;第一项&#x27;</span>;
  <span class="hljs-keyword">yield</span>* [<span class="hljs-string">&#x27;第二项&#x27;</span>, <span class="hljs-string">&#x27;第三项&#x27;</span>];
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;结束标记&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...<span class="hljs-title function_">words</span>()].<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 第一项,第二项,第三项</span>
</code></pre></div>
<p>yield* 把遍历委托给另一个可迭代对象。return 的结束标记没有出现在展开结果中，因为它伴随 done:true。若需要结束标记作为普通数据，就应显式 yield 它，而不是指望所有消费者都会使用终止 value。</p>
<h2>惰性减少的是不必要的提前工作</h2>
<p>生成器可以在消费者请求下一项时才计算，不必一开始就构造整个数组。大区间、分阶段处理、树遍历等场景可以因此减少一次性分配，也能在只需要前几项时提前停止。</p>
<p>但如果消费端立刻执行 <code>[...iterator]</code>，仍然会把全部结果放进数组；无限生成器这样展开还会一直执行。惰性也不等于低内存保证，生成器暂停时仍可能保留它需要访问的大型状态。</p>
<p>Generator 不是线程。next 恢复后，内部同步代码仍然占用当前执行线程，直到下一个 yield、return 或异常。一次 next 中做大量计算，仍可能阻塞页面。</p>
<h2>资源清理和异步数据是下一层协议</h2>
<p>迭代器可以额外提供 return、throw 方法，for...of 提前退出时会调用 return 关闭迭代器。哪些退出路径会关闭、清理出错怎样传播，见《JavaScript 迭代器关闭和 return 方法有什么作用？》。</p>
<p>异步数据源则可以实现 Symbol.asyncIterator，让 next 返回可等待的结果，由 for await...of 消费。普通 Generator 不会仅因 yield 一个 Promise 就变成线程或并发池；是否等待、以何种顺序消费，取决于使用的是同步还是异步协议及消费者写法。</p>
<h2>ES2025 的 Iterator helpers</h2>
<p>ES2025 为迭代器增加了 map、filter、take、drop、flatMap、reduce、toArray 等方法，并提供全局 <code>Iterator</code>。它们惰性求值，可以直接作用于无限序列。下面的示例在 Node.js 22 中实际运行过：</p>
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
<p>这些方法挂在迭代器上，不在可迭代对象上：数组要先调用 <code>values()</code>，Set、Map 用 <code>values()</code> 或 <code>entries()</code>。它们只处理同步迭代器，异步迭代器的对应方法仍在提案阶段。</p>`};export{e as default};