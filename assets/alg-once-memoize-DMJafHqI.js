var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面上的初始化函数可能被好几个地方调用，但只该真正执行一次，这就是 <code>once</code>。它返回一个包装函数，闭包里存一个“是否调用过”的标记和第一次的结果，之后再调用直接返回那个结果。</p>
<p><code>memoize</code> 是把“同样的参数得到同样的结果”缓存起来，比如计算很慢的纯函数，或者递归求斐波那契数。它在闭包里放一个 <code>Map</code>，用参数算出一个键，命中就直接返回，没命中再调用原函数并存起来。</p>
<p>关键在键怎么算。常见实现默认只用第一个参数当键，多参数函数不传自定义键函数就会算错；对象参数按引用比较，内容相同的两个对象也算不同的键。包装时要用 <code>fn.apply(this, args)</code> 保留调用时的 <code>this</code>。</p>
<p>要注意，缓存只适合结果只取决于参数的函数。缓存 Promise 时，失败的 Promise 也会被存下来，之后每次都直接拿到失败，需要在拒绝时把它从缓存里删掉；缓存会一直增长，长期运行的页面要考虑上限。</p>
</blockquote>
<h2>once：用闭包记住是否调用过</h2>
<p>先看 <code>once</code>，注意第一次调用的结果是怎样保存下来的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">once</span>(<span class="hljs-params">fn</span>) {
  <span class="hljs-keyword">let</span> called = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> result;
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">if</span> (!called) {
      called = <span class="hljs-literal">true</span>;
      result = fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
      fn = <span class="hljs-literal">null</span>; <span class="hljs-comment">// 执行后释放原函数，避免一直持有它引用的变量</span>
    }
    <span class="hljs-keyword">return</span> result;
  };
}

<span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> init = <span class="hljs-title function_">once</span>(<span class="hljs-function">(<span class="hljs-params">x</span>) =&gt;</span> ++count + x);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">init</span>(<span class="hljs-number">10</span>), <span class="hljs-title function_">init</span>(<span class="hljs-number">20</span>), count); <span class="hljs-comment">// 11 11 1</span>
</code></pre></div>
<p>第二次调用传了 <code>20</code>，结果仍是第一次的 <code>11</code>，<code>count</code> 也只加了一次。为什么 <code>called = true</code> 写在调用 <code>fn</code> 之前？如果 <code>fn</code> 内部又调用了包装函数，或者 <code>fn</code> 抛了错，先置标记能保证它不会被执行第二次。代价是第一次抛错后，之后的调用都返回 <code>undefined</code>，需要“失败可重试”的话就把置标记挪到调用成功之后。</p>
<p><code>called</code>、<code>result</code>、<code>fn</code> 都是闭包变量，每次调用 <code>once</code> 生成一套独立的状态，原理见<a href="/questions/js-closure/">《什么是闭包？它有哪些实际应用？》</a>。</p>
<h2>memoize：用 Map 按键缓存结果</h2>
<p>下面的 <code>memoize</code> 第二个参数是计算键的函数，默认取第一个参数。示例对比了默认键和自定义键的差别。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">memoize</span>(<span class="hljs-params">fn, resolver = (...args) =&gt; args[<span class="hljs-number">0</span>]</span>) {
  <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">memoized</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">const</span> key = resolver.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    <span class="hljs-keyword">if</span> (cache.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">const</span> result = fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    cache.<span class="hljs-title function_">set</span>(key, result);
    <span class="hljs-keyword">return</span> result;
  }
  memoized.<span class="hljs-property">cache</span> = cache;
  <span class="hljs-keyword">return</span> memoized;
}

<span class="hljs-keyword">let</span> calls = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> slowSquare = <span class="hljs-title function_">memoize</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> {
  calls++;
  <span class="hljs-keyword">return</span> n * n;
});
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">slowSquare</span>(<span class="hljs-number">4</span>), <span class="hljs-title function_">slowSquare</span>(<span class="hljs-number">4</span>), calls); <span class="hljs-comment">// 16 16 1</span>

<span class="hljs-keyword">const</span> add = <span class="hljs-title function_">memoize</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">add</span>(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>), <span class="hljs-title function_">add</span>(<span class="hljs-number">1</span>, <span class="hljs-number">100</span>)); <span class="hljs-comment">// 3 3</span>
<span class="hljs-keyword">const</span> add2 = <span class="hljs-title function_">memoize</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b, <span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${a}</span>,<span class="hljs-subst">\${b}</span>\`</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">add2</span>(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>), <span class="hljs-title function_">add2</span>(<span class="hljs-number">1</span>, <span class="hljs-number">100</span>)); <span class="hljs-comment">// 3 101</span>

<span class="hljs-keyword">const</span> fib = <span class="hljs-title function_">memoize</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> (n &lt; <span class="hljs-number">2</span> ? n : <span class="hljs-title function_">fib</span>(n - <span class="hljs-number">1</span>) + <span class="hljs-title function_">fib</span>(n - <span class="hljs-number">2</span>)));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">fib</span>(<span class="hljs-number">50</span>)); <span class="hljs-comment">// 12586269025</span>
</code></pre></div>
<p><code>add(1, 100)</code> 返回了 <code>3</code>，这是错误结果。默认键只看第一个参数，两次调用的键都是 <code>1</code>，第二次直接命中了第一次的缓存。传入把所有参数拼起来的键函数后，<code>add2</code> 才算对。</p>
<p>为什么用 <code>cache.has</code> 判断而不是 <code>cache.get(key) !== undefined</code>？因为原函数可能本来就返回 <code>undefined</code>，用 <code>get</code> 判断会把这种结果当成没缓存，每次都重新算。为什么用 <code>Map</code> 不用普通对象？<code>Map</code> 的键可以是任何值，数字 <code>1</code> 和字符串 <code>&#x27;1&#x27;</code> 是不同的键，对象也能当键，而且不会碰到 <code>__proto__</code> 这类继承属性名。</p>
<p><code>fib(50)</code> 能瞬间算出来，因为递归里调用的 <code>fib</code> 就是缓存过的版本，每个 <code>n</code> 只真正计算一次，总共是 O(n) 次计算。不加缓存的递归是指数级的。</p>
<h2>缓存 Promise 时要处理失败</h2>
<p>异步函数的返回值是 Promise，<code>memoize</code> 存的是 Promise 本身。这对成功的请求很好，同时发起的重复请求会共用同一个 Promise。可是失败的 Promise 也会被存下来。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">memoize</span>(<span class="hljs-params">fn, resolver = (...args) =&gt; args[<span class="hljs-number">0</span>]</span>) {
  <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">memoized</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">const</span> key = resolver.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    <span class="hljs-keyword">if</span> (cache.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">const</span> result = fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    cache.<span class="hljs-title function_">set</span>(key, result);
    <span class="hljs-keyword">return</span> result;
  }
  memoized.<span class="hljs-property">cache</span> = cache;
  <span class="hljs-keyword">return</span> memoized;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">memoizeAsync</span>(<span class="hljs-params">fn</span>) {
  <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">key</span>) {
    <span class="hljs-keyword">if</span> (cache.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">const</span> p = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(fn.<span class="hljs-title function_">call</span>(<span class="hljs-variable language_">this</span>, key)).<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> {
      cache.<span class="hljs-title function_">delete</span>(key); <span class="hljs-comment">// 失败后删除，下次调用会重新请求</span>
      <span class="hljs-keyword">throw</span> err;
    });
    cache.<span class="hljs-title function_">set</span>(key, p);
    <span class="hljs-keyword">return</span> p;
  };
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">main</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> requests = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">failing</span> = (<span class="hljs-params"></span>) =&gt; {
    requests++;
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;网络错误&#x27;</span>));
  };

  <span class="hljs-keyword">const</span> naive = <span class="hljs-title function_">memoize</span>(failing);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">naive</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">naive</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(requests); <span class="hljs-comment">// 1</span>

  requests = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">const</span> safe = <span class="hljs-title function_">memoizeAsync</span>(failing);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">safe</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">safe</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(requests); <span class="hljs-comment">// 2</span>
}
<span class="hljs-title function_">main</span>();
</code></pre></div>
<p>第一段里请求只发了一次，第二次调用直接拿到了缓存里那个已经失败的 Promise，网络恢复后也不会重试。<code>memoizeAsync</code> 在 Promise 拒绝时把它从缓存里删掉，所以第二次调用重新发了请求。成功的结果仍然会被缓存，同时发起的相同请求也只发一次。</p>
<h2>常见追问</h2>
<p><strong>参数是对象时怎样生成缓存键？</strong></p>
<blockquote>
<p><code>Map</code> 按引用比较对象，同一个对象能命中，内容相同的新对象不能。可以在键函数里用 <code>JSON.stringify</code> 把参数转成字符串，但它对属性顺序敏感，也处理不了函数、循环引用等值。更稳妥的做法是挑出决定结果的几个字段拼成键。</p>
</blockquote>
<p><strong>缓存一直增长怎么办？</strong></p>
<blockquote>
<p>给缓存设上限，超出时淘汰最久没用的，也就是 LRU 策略，见<a href="/questions/alg-map-lru/">《如何利用 Map 实现固定容量的 LRU 缓存？》</a>。如果键是对象、并且希望对象不再使用后缓存能被回收，可以把 <code>Map</code> 换成 <code>WeakMap</code>，但 <code>WeakMap</code> 的键只能是对象或非注册的 Symbol。</p>
</blockquote>`};export{e as default};