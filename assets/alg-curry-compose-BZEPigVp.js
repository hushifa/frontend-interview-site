var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>柯里化就是把 <code>add(1, 2, 3)</code> 变成可以写成 <code>add(1)(2)(3)</code>，也可以写成 <code>add(1, 2)(3)</code>。每次调用先把参数存起来，凑够原函数需要的个数，再一次性调用原函数。原函数需要几个参数，看的是它的 <code>length</code>。</p>
<p>实现靠闭包。<code>curry</code> 返回一个函数，这个函数记住已经收到的参数；参数不够就再返回一个函数继续收，够了就调用原函数。</p>
<p>它的用处是预先固定一部分参数，得到一个更具体的函数。比如 <code>const log = curry(logger)(&#x27;订单&#x27;)</code>，之后每次调用 <code>log</code> 都自动带上“订单”这个前缀。compose 是另一种组合方式，<code>compose(f, g)(x)</code> 等于 <code>f(g(x))</code>，把几个处理步骤串成一个函数，手写一般用 <code>reduceRight</code>。</p>
<p>要注意，<code>length</code> 不计算默认参数及其后面的参数，也不计算剩余参数。所以对写了默认值或 <code>...args</code> 的函数，柯里化可能凑不够个数或者提前执行，这时要手动传入参数个数。</p>
</blockquote>
<h2>手写 curry</h2>
<p>下面的 <code>curry</code> 接收一个函数，返回柯里化以后的版本。可以把要凑够的参数个数当作第二个参数传进来，不传就用 <code>fn.length</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">curry</span>(<span class="hljs-params">fn, arity = fn.length</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">curried</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">if</span> (args.<span class="hljs-property">length</span> &gt;= arity) {
      <span class="hljs-keyword">return</span> fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    }
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">...rest</span>) {
      <span class="hljs-keyword">return</span> curried.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, [...args, ...rest]);
    };
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">add</span>(<span class="hljs-params">a, b, c</span>) {
  <span class="hljs-keyword">return</span> a + b + c;
}

<span class="hljs-keyword">const</span> curriedAdd = <span class="hljs-title function_">curry</span>(add);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">curriedAdd</span>(<span class="hljs-number">1</span>)(<span class="hljs-number">2</span>)(<span class="hljs-number">3</span>)); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">curriedAdd</span>(<span class="hljs-number">1</span>, <span class="hljs-number">2</span>)(<span class="hljs-number">3</span>)); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">curriedAdd</span>(<span class="hljs-number">1</span>)(<span class="hljs-number">2</span>, <span class="hljs-number">3</span>)); <span class="hljs-comment">// 6</span>

<span class="hljs-keyword">const</span> addTen = <span class="hljs-title function_">curriedAdd</span>(<span class="hljs-number">10</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">addTen</span>(<span class="hljs-number">1</span>)(<span class="hljs-number">2</span>)); <span class="hljs-comment">// 13</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">addTen</span>(<span class="hljs-number">5</span>, <span class="hljs-number">5</span>)); <span class="hljs-comment">// 20</span>
</code></pre></div>
<p><code>curriedAdd(1)</code> 为什么没有报错，而是返回了一个函数？因为 <code>add.length</code> 是 3，现在只收到 1 个参数，不够，所以返回一个新函数继续等。这个新函数被调用时，会把之前的 <code>[1]</code> 和新收到的参数拼起来，再交给 <code>curried</code> 判断一次。</p>
<p>之前收到的参数存在哪里？存在闭包里。每个返回的函数都记住了它创建时的 <code>args</code>。所以 <code>addTen</code> 可以反复用，<code>addTen(1)(2)</code> 和 <code>addTen(5, 5)</code> 都从 <code>[10]</code> 开始拼，互不影响。</p>
<p><code>fn.apply(this, args)</code> 里传 <code>this</code>，是为了柯里化以后的函数作为对象方法调用时，<code>this</code> 还能传给原函数。</p>
<h2>为什么有时要手动传参数个数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">greet</span>(<span class="hljs-params">name, greeting = <span class="hljs-string">&#x27;你好&#x27;</span></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${greeting}</span>，<span class="hljs-subst">\${name}</span>\`</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(greet.<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p><code>greet</code> 明明写了两个参数，<code>length</code> 却是 1。因为 <code>length</code> 只数第一个默认参数之前的参数，剩余参数 <code>...args</code> 也不算。所以 <code>curry(greet)(&#x27;小明&#x27;)</code> 收到 1 个参数就执行了，第二个参数根本没机会传。</p>
<p>这时就用第二个参数告诉 <code>curry</code> 要凑几个：<code>curry(greet, 2)(&#x27;小明&#x27;)(&#x27;早上好&#x27;)</code>。</p>
<h2>手写 compose</h2>
<p>处理数据时经常要经过好几步，比如先去空格、再转小写、再加前缀。写成 <code>addPrefix(toLower(trim(input)))</code> 层层嵌套不好读，compose 可以把它们串起来。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">compose</span>(<span class="hljs-params">...fns</span>) {
  <span class="hljs-keyword">if</span> (fns.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value;
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">return</span> fns.<span class="hljs-title function_">reduceRight</span>(<span class="hljs-function">(<span class="hljs-params">result, fn</span>) =&gt;</span> <span class="hljs-title function_">fn</span>(result), value);
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">pipe</span>(<span class="hljs-params">...fns</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">value</span>) {
    <span class="hljs-keyword">return</span> fns.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">result, fn</span>) =&gt;</span> <span class="hljs-title function_">fn</span>(result), value);
  };
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">trim</span> = (<span class="hljs-params">s</span>) =&gt; s.<span class="hljs-title function_">trim</span>();
<span class="hljs-keyword">const</span> <span class="hljs-title function_">toLower</span> = (<span class="hljs-params">s</span>) =&gt; s.<span class="hljs-title function_">toLowerCase</span>();
<span class="hljs-keyword">const</span> <span class="hljs-title function_">addPrefix</span> = (<span class="hljs-params">s</span>) =&gt; <span class="hljs-string">\`user:<span class="hljs-subst">\${s}</span>\`</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">compose</span>(addPrefix, toLower, trim)(<span class="hljs-string">&#x27;  Alice &#x27;</span>)); <span class="hljs-comment">// user:alice</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">pipe</span>(trim, toLower, addPrefix)(<span class="hljs-string">&#x27;  Alice &#x27;</span>)); <span class="hljs-comment">// user:alice</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">compose</span>()(<span class="hljs-number">5</span>)); <span class="hljs-comment">// 5</span>
</code></pre></div>
<p>为什么 compose 用 <code>reduceRight</code>？因为 <code>compose(f, g, h)(x)</code> 的意思是 <code>f(g(h(x)))</code>，最右边的 <code>h</code> 先执行。<code>reduceRight</code> 从数组末尾往前遍历，正好是这个顺序。<code>pipe</code> 则是从左往右，读起来和执行顺序一致，很多人觉得更直观。</p>
<p>没有传任何函数时返回原值，这样 <code>compose()</code> 也能安全使用。</p>
<h2>常见追问</h2>
<p><strong>柯里化和 bind 预设参数有什么区别？</strong></p>
<blockquote>
<p><code>bind</code> 只能预设一次参数，返回的函数再调用时就直接执行了。柯里化可以分任意多次传，直到凑够个数才执行。另外 <code>bind</code> 会固定 <code>this</code>，柯里化不会。</p>
</blockquote>
<p><strong>Redux 的中间件为什么也用到 compose？</strong></p>
<blockquote>
<p>Redux 的 <code>applyMiddleware</code> 用 compose 把多个中间件串成一条链，每个中间件包住下一个，请求从外往里传。Koa 的洋葱模型思路类似，不过 Koa 处理的是异步函数，实现上用的是递归调用 <code>next</code>。</p>
</blockquote>
<p><strong>实际项目里经常手写柯里化吗？</strong></p>
<blockquote>
<p>不常手写通用的 <code>curry</code>，更常见的是直接写一个返回函数的函数，比如 <code>const createLogger = (prefix) =&gt; (msg) =&gt; console.log(prefix, msg)</code>。它的道理和柯里化一样，都是用闭包记住先传进来的参数。</p>
</blockquote>`};export{e as default};