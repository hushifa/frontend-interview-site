var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个函数在另一个函数里面定义，并且用到了外层函数的变量，这就形成了闭包。</p>
<p>一般来说，函数执行完，它的局部变量就用不到了。但如果外层函数把内层函数返回出去，内层函数又用到了外层的变量，这些变量就会一直保留，内层函数之后还能读、还能改。</p>
<p>最典型的用途是做私有变量。比如写一个计数器，<code>count</code> 放在外层函数里，外面没法直接改，只能通过返回的 <code>increment</code> 方法去加。另外工厂函数、事件回调、防抖节流，里面都用到了闭包。</p>
<p>有两点要注意。第一，闭包保存的是变量本身，不是当时的值，变量后来改了，闭包读到的就是新值。第二，闭包本身不等于内存泄漏，只有当闭包一直被定时器、事件监听这类东西引用着、没有清理时，它用到的数据才会一直留在内存里。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面写一个计数器。<code>count</code> 定义在 <code>createCounter</code> 里面，返回的两个方法都用到了它。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createCounter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
      count += <span class="hljs-number">1</span>;
      <span class="hljs-keyword">return</span> count;
    },
    <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">return</span> count;
    },
  };
}

<span class="hljs-keyword">const</span> first = <span class="hljs-title function_">createCounter</span>();
<span class="hljs-keyword">const</span> second = <span class="hljs-title function_">createCounter</span>();

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-title function_">increment</span>()); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-title function_">increment</span>()); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-title function_">read</span>());      <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(second.<span class="hljs-title function_">increment</span>()); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p><code>createCounter()</code> 执行完以后，按理说 <code>count</code> 就该没了。可是调用 <code>first.increment()</code>，它还能接着往上加，这就是闭包在起作用。</p>
<p><code>first</code> 里的 <code>increment</code> 和 <code>read</code> 是同一次调用创建的，所以它们操作的是同一个 <code>count</code>，加完以后 <code>read</code> 读到的是 2。<code>second</code> 是另一次调用，有自己的一份 <code>count</code>，所以它从 1 开始，跟 <code>first</code> 互不影响。</p>
<p>外面的代码没办法直接改 <code>count</code>，只能通过这两个方法。很多地方说“用闭包实现私有变量”，指的就是这种写法。</p>
<h2>为什么内层函数能找到外层的变量</h2>
<p>函数里用到一个变量，JavaScript 会先在函数自己里面找，找不到就去定义它的那个外层函数里找，再找不到就继续往外，一直找到全局。</p>
<p>这条查找路线是按函数<strong>写在哪里</strong>定下来的，跟它后来在哪里被调用没有关系，这叫词法作用域。所以 <code>increment</code> 不管被拿到哪里去调用，它找 <code>count</code> 时走的都是同一条路，最后都能找到 <code>createCounter</code> 里的那个 <code>count</code>。</p>
<h2>闭包记住的是变量，不是当时的值</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> label = <span class="hljs-string">&#x27;旧值&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">read</span> = (<span class="hljs-params"></span>) =&gt; label;
label = <span class="hljs-string">&#x27;新值&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 新值</span>
</code></pre></div>
<p><code>read</code> 创建的时候 <code>label</code> 还是“旧值”，但它记住的是 <code>label</code> 这个变量本身。后来变量被改成“新值”，再调用 <code>read</code>，读到的自然就是新值。</p>
<h2>React 里为什么会读到旧值</h2>
<p>既然闭包记住的是变量，那 React 里为什么经常读到旧的 <code>state</code>？先看一个例子：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Counter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [count, setCount] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
    }, <span class="hljs-number">1000</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id);
  }, []);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{count}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}
</code></pre></div>
<p>本来想让数字每秒加 1，结果页面上的数字变成 1 之后就再也不动了。</p>
<p>原因在于，React 每渲染一次，就会把 <code>Counter</code> 这个函数重新执行一遍。每执行一遍，都会得到一个新的 <code>count</code>。第一次渲染时 <code>count</code> 是 0，第二次渲染时是另一个值为 1 的 <code>count</code>。它们是两个不同的变量，不是同一个变量被改了。</p>
<p>定时器回调是第一次渲染时创建的，它记住的是第一次渲染的那个 <code>count</code>，值一直是 0。依赖数组写的是 <code>[]</code>，这个回调后来也没有被换掉，所以每秒执行的都是 <code>setCount(0 + 1)</code>，数字就停在了 1。</p>
<p>最简单的改法是用函数式更新，不去读外面的 <code>count</code>，让 React 把最新的值传进来：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">setCount</span>(<span class="hljs-function">(<span class="hljs-params">current</span>) =&gt;</span> current + <span class="hljs-number">1</span>);
</code></pre></div>
<p>另外两种办法是：把 <code>count</code> 写进依赖数组，让 effect 跟着重新创建回调；或者用 <code>useRef</code> 保存最新值，在回调里读 <code>ref.current</code>。</p>
<h2>for 循环里的闭包</h2>
<p>还有一道经典题：<code>for</code> 循环里用 <code>var</code> 声明变量，每个定时器回调最后都输出同一个数。原因是 <code>var</code> 在整个函数里只有一个变量，所有回调共用它，详见<a href="/questions/js-scope-hoisting/">《var、let、const 和暂时性死区有什么关系？》</a>。</p>
<h2>闭包在实际开发中用在哪里</h2>
<p>最常见的是做私有状态，比如上面的计数器，还有缓存、只执行一次的 <code>once</code> 函数，都是把数据藏在闭包里，外面只能通过返回的函数访问。</p>
<p>工厂函数也离不开闭包。比如 <code>createLogger(&#x27;[订单]&#x27;)</code> 返回一个打印日志的函数，每次打印都自动带上“[订单]”这个前缀，因为前缀被闭包记住了。</p>
<p>防抖和节流同样如此。定时器的 ID 保存在闭包里，函数被连续调用时，每次操作的都是同一个定时器，所以才能做到“等用户停下来再执行”。</p>
<h2>闭包会导致内存泄漏吗</h2>
<p>闭包本身不会。只要闭包这个函数不再被用到，它记住的变量就会和它一起被回收。</p>
<p>真正出问题的情况是，闭包被一个一直存在的东西拿着不放。比如给 <code>window</code> 加了事件监听却没有移除，或者开了 <code>setInterval</code> 却没有清除，那这个回调函数就一直活着，它用到的数据也就一直释放不掉。所以排查内存问题时，要找的是“谁还在引用这个函数”，而不是“这里有没有用闭包”。</p>
<h2>常见追问</h2>
<p><strong>同一个外层函数返回的多个闭包，会互相影响吗？</strong></p>
<blockquote>
<p>如果是同一次调用返回的，会。就像例子里的 <code>increment</code> 和 <code>read</code>，它们用的是同一个 <code>count</code>，一个改了另一个就能读到。如果是外层函数调用了两次，就是两份独立的变量，互不影响。</p>
</blockquote>
<p><strong>ES 模块和闭包有什么关系？</strong></p>
<blockquote>
<p>模块的最外层也是一个作用域。模块里没有导出的变量，外面拿不到，但模块导出的函数可以用它们。所以导出的函数其实就是闭包，它记住了模块里的私有变量。</p>
</blockquote>
<p><strong>怎样避免闭包带来的内存问题？</strong></p>
<blockquote>
<p>关键是用完就断开引用。组件卸载时移除事件监听、清掉定时器；缓存要设置上限或者过期时间；不要让长期存在的闭包引用用不到的大对象。</p>
</blockquote>`};export{e as default};