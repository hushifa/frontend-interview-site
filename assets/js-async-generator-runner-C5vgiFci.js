var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>const user = await getUser()</code> 读起来像同步代码，实际上函数在这里暂停了，等 <code>getUser()</code> 返回的 Promise 完成，再带着结果继续往下走。MDN 的说法是，<code>await</code> 会暂停函数的执行，直到 Promise 完成或失败，完成的值就成了 <code>await</code> 表达式的结果。</p>
<p>能“暂停再恢复”的函数，JavaScript 里早就有了，就是 Generator。Generator 函数执行到 <code>yield</code> 会停下来，外面调用 <code>next(value)</code> 才继续，而且传进去的 <code>value</code> 会成为 <code>yield</code> 表达式的结果。所以只要写一个执行器：每次 Generator 吐出一个 Promise，就等它完成，再用 <code>next(结果)</code> 把结果送回去，失败就用 <code>throw(错误)</code> 在暂停的地方抛出，Generator 就能像 async 函数一样运行。</p>
<p>早期没有 async/await 时，co 这类库就是这样做的。可以把 async 函数理解为“Generator 加自动执行器”的语法糖，<code>yield</code> 换成了 <code>await</code>，执行器由引擎内置，返回值包装成 Promise。</p>
<p>要注意，这是理解原理的模型，不是规范里的实现方式。async 函数不需要 Generator 也能运行，引擎有自己的实现，而且 async 函数的错误和栈信息比手写执行器更友好。</p>
</blockquote>
<h2>手写自动执行器</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">generatorFn, ...args</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> iterator = <span class="hljs-title function_">generatorFn</span>(...args);

    <span class="hljs-keyword">function</span> <span class="hljs-title function_">step</span>(<span class="hljs-params">method, value</span>) {
      <span class="hljs-keyword">let</span> result;
      <span class="hljs-keyword">try</span> {
        result = iterator[method](value);
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-title function_">reject</span>(error);
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-keyword">if</span> (result.<span class="hljs-property">done</span>) {
        <span class="hljs-title function_">resolve</span>(result.<span class="hljs-property">value</span>);
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(result.<span class="hljs-property">value</span>).<span class="hljs-title function_">then</span>(
        <span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> <span class="hljs-title function_">step</span>(<span class="hljs-string">&#x27;next&#x27;</span>, data),
        <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-title function_">step</span>(<span class="hljs-string">&#x27;throw&#x27;</span>, error),
      );
    }

    <span class="hljs-title function_">step</span>(<span class="hljs-string">&#x27;next&#x27;</span>, <span class="hljs-literal">undefined</span>);
  });
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">delay</span> = (<span class="hljs-params">value, ms</span>) =&gt; <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(value), ms));

<span class="hljs-keyword">const</span> result = <span class="hljs-title function_">run</span>(<span class="hljs-keyword">function</span>* () {
  <span class="hljs-keyword">const</span> a = <span class="hljs-keyword">yield</span> <span class="hljs-title function_">delay</span>(<span class="hljs-number">1</span>, <span class="hljs-number">10</span>);
  <span class="hljs-keyword">const</span> b = <span class="hljs-keyword">yield</span> <span class="hljs-title function_">delay</span>(<span class="hljs-number">2</span>, <span class="hljs-number">10</span>);
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">yield</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;失败&#x27;</span>));
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${a + b}</span>，捕获到<span class="hljs-subst">\${error.message}</span>\`</span>;
  }
});

result.<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value)); <span class="hljs-comment">// 3，捕获到失败</span>
</code></pre></div>
<p>第一次调用 <code>step(&#x27;next&#x27;, undefined)</code>，Generator 开始执行，到第一个 <code>yield</code> 停下，吐出 <code>delay(1, 10)</code> 这个 Promise。执行器等它完成，拿到 1，调用 <code>iterator.next(1)</code>，于是 <code>a</code> 就是 1。这正是 <code>const a = await delay(1, 10)</code> 的效果。</p>
<p><code>yield Promise.reject(...)</code> 那一步，Promise 失败了，执行器调用 <code>iterator.throw(error)</code>。错误在 Generator 暂停的那一行抛出，被里面的 <code>try...catch</code> 捕获，和 async 函数里 <code>try...catch</code> 包住 <code>await</code> 的效果一样。</p>
<p>为什么要用 <code>Promise.resolve(result.value)</code> 包一层？因为 <code>yield</code> 后面不一定是 Promise，也可能是普通值。包一层以后，普通值会马上完成，处理方式就统一了，这和 <code>await 普通值</code> 的行为一致。</p>
<p><code>iterator[method](value)</code> 外面为什么要 <code>try...catch</code>？如果 Generator 里的错误没被捕获，<code>next</code> 或 <code>throw</code> 调用本身会抛出，这时整个任务失败，要 <code>reject</code> 外层 Promise，相当于 async 函数返回的 Promise 失败了。</p>
<h2>await 之后的代码什么时候执行</h2>
<p><code>await</code> 后面的代码总是在微任务里继续执行，哪怕等的是一个已经完成的值。所以：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">f</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-literal">null</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">3</span>);
}
<span class="hljs-title function_">f</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2</span>);
</code></pre></div>
<p>输出顺序是 1、2、3。<code>f()</code> 同步执行到 <code>await</code> 前打印 1，然后暂停，把后续代码安排为微任务；外面继续执行，打印 2；当前同步代码执行完后，微任务执行，打印 3。事件循环的完整顺序见<a href="/questions/js-event-loop/">《事件循环中，任务和微任务按什么顺序执行？》</a>。</p>
<h2>常见追问</h2>
<p><strong>async 函数一定返回 Promise 吗？</strong></p>
<blockquote>
<p>一定。<code>return 1</code> 得到的是一个以 1 完成的 Promise，函数里抛出的错误会变成 Promise 失败。所以调用 async 函数时，同步的 <code>try...catch</code> 捕获不到它的错误，必须 <code>await</code> 它或者用 <code>.catch</code>。</p>
</blockquote>
<p><strong>多个 await 写在一起会不会变慢？</strong></p>
<blockquote>
<p>如果几个请求互不依赖，写成连续的 <code>await</code> 会一个等一个，总时间是相加的。应该先同时发起，再用 <code>await Promise.all([...])</code> 一起等，见<a href="/questions/js-async-await-errors/">《async/await 如何处理异常和并发？》</a>。</p>
</blockquote>`};export{e as default};