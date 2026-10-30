var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如 <code>fs.stat(path, callback)</code> 这种老式 API，结果通过最后一个回调参数 <code>(err, value)</code> 返回，第一个参数放错误，这叫错误优先回调。<code>util.promisify</code> 把它包成一个返回 Promise 的函数，这样就能用 <code>await</code> 了。</p>
<p>手写的思路是返回一个新函数。新函数里 <code>new Promise</code>，把调用时传的参数原样交给原函数，再在最后补一个回调：<code>err</code> 有值就 <code>reject(err)</code>，否则 <code>resolve(value)</code>。</p>
<p>这样回调式 API 就能接进 <code>async/await</code> 和 Promise 组合方法里，错误也统一走 <code>catch</code>。如果原函数的回调不是错误优先的格式，可以在函数上挂 <code>util.promisify.custom</code>，自己写好 Promise 版本，<code>promisify</code> 会直接返回它。</p>
<p>要注意三点。第一，<code>promisify(obj.method)</code> 拿到的函数丢了 <code>this</code>，要用 <code>call</code> 或 <code>bind</code> 补上。第二，按文档描述的 <code>(err, value)</code> 格式，只有一个结果会被 resolve，回调多给的参数不会自动打包。第三，<code>promisify</code> 默认最后一个参数就是回调，原函数不是这种签名时转出来的函数不会按预期工作。</p>
</blockquote>
<h2>手写一个最小版本</h2>
<p>先看核心实现。<code>readUser</code> 是自己写的模拟回调函数，用 <code>Promise.resolve().then</code> 让回调异步执行，模拟真实 I/O。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> custom = <span class="hljs-title class_">Symbol</span>.<span class="hljs-title function_">for</span>(<span class="hljs-string">&#x27;nodejs.util.promisify.custom&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">promisify</span>(<span class="hljs-params">original</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> original !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;original 必须是函数&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (original[custom]) <span class="hljs-keyword">return</span> original[custom];

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
      original.<span class="hljs-title function_">call</span>(<span class="hljs-variable language_">this</span>, ...args, <span class="hljs-function">(<span class="hljs-params">err, value</span>) =&gt;</span> {
        <span class="hljs-keyword">if</span> (err) <span class="hljs-title function_">reject</span>(err);
        <span class="hljs-keyword">else</span> <span class="hljs-title function_">resolve</span>(value);
      });
    });
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">readUser</span>(<span class="hljs-params">id, callback</span>) {
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (id &lt;= <span class="hljs-number">0</span>) <span class="hljs-title function_">callback</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;用户不存在&#x27;</span>));
    <span class="hljs-keyword">else</span> <span class="hljs-title function_">callback</span>(<span class="hljs-literal">null</span>, <span class="hljs-string">&#x27;用户&#x27;</span> + id);
  });
}

<span class="hljs-keyword">const</span> readUserAsync = <span class="hljs-title function_">promisify</span>(readUser);

<span class="hljs-title function_">readUserAsync</span>(<span class="hljs-number">7</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">name</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(name)); <span class="hljs-comment">// 用户7</span>
<span class="hljs-title function_">readUserAsync</span>(<span class="hljs-number">0</span>).<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(err.<span class="hljs-property">message</span>)); <span class="hljs-comment">// 用户不存在</span>
</code></pre></div>
<p>调用 <code>readUserAsync(7)</code> 时，参数 <code>7</code> 原样传给 <code>readUser</code>，后面再补上一个回调。<code>readUser</code> 回调 <code>(null, &#x27;用户7&#x27;)</code>，<code>err</code> 是 <code>null</code>，于是 resolve；传 <code>0</code> 时回调收到错误对象，于是 reject。</p>
<p>为什么返回的是 <code>function</code> 而不是箭头函数？因为箭头函数没有自己的 <code>this</code>，下面要用 <code>original.call(this, ...)</code> 把调用时的 <code>this</code> 传下去，只有普通函数才拿得到。开头的类型检查对应文档的说法：<code>original</code> 不是函数时 <code>promisify()</code> 会抛错。</p>
<h2>为什么 promisify 一个方法会丢 this</h2>
<p>Node.js 文档专门提醒：对类方法或其他用到 <code>this</code> 的方法调用 <code>promisify</code>，如果不做特殊处理，可能不会按预期工作。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-meta">&#x27;use strict&#x27;</span>;

<span class="hljs-keyword">const</span> custom = <span class="hljs-title class_">Symbol</span>.<span class="hljs-title function_">for</span>(<span class="hljs-string">&#x27;nodejs.util.promisify.custom&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">promisify</span>(<span class="hljs-params">original</span>) {
  <span class="hljs-keyword">if</span> (original[custom]) <span class="hljs-keyword">return</span> original[custom];
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> (<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
      original.<span class="hljs-title function_">call</span>(<span class="hljs-variable language_">this</span>, ...args, <span class="hljs-function">(<span class="hljs-params">err, value</span>) =&gt;</span> (err ? <span class="hljs-title function_">reject</span>(err) : <span class="hljs-title function_">resolve</span>(value)));
    });
  };
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span> = <span class="hljs-number">42</span>;
  }

  <span class="hljs-title function_">read</span>(<span class="hljs-params">callback</span>) {
    <span class="hljs-title function_">callback</span>(<span class="hljs-literal">null</span>, <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span>);
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">lookup</span>(<span class="hljs-params">host, callback</span>) {
  <span class="hljs-title function_">callback</span>(<span class="hljs-literal">null</span>, <span class="hljs-string">&#x27;10.0.0.1&#x27;</span>, <span class="hljs-number">4</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">ask</span>(<span class="hljs-params">question, onYes, onNo</span>) {
  <span class="hljs-keyword">if</span> (question.<span class="hljs-title function_">endsWith</span>(<span class="hljs-string">&#x27;?&#x27;</span>)) <span class="hljs-title function_">onYes</span>(<span class="hljs-string">&#x27;好&#x27;</span>);
  <span class="hljs-keyword">else</span> <span class="hljs-title function_">onNo</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;不是问题&#x27;</span>));
}
ask[custom] = <span class="hljs-function">(<span class="hljs-params">question</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> <span class="hljs-title function_">ask</span>(question, resolve, reject));

<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Counter</span>();
<span class="hljs-keyword">const</span> read = <span class="hljs-title function_">promisify</span>(counter.<span class="hljs-property">read</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">String</span>(<span class="hljs-title function_">promisify</span>(ask) === ask[custom])); <span class="hljs-comment">// true</span>
<span class="hljs-title function_">read</span>()
  .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(err.<span class="hljs-property">constructor</span>.<span class="hljs-property">name</span>)) <span class="hljs-comment">// TypeError</span>
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> read.<span class="hljs-title function_">call</span>(counter))
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;call: &#x27;</span> + n)) <span class="hljs-comment">// call: 42</span>
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> read.<span class="hljs-title function_">bind</span>(counter)())
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;bind: &#x27;</span> + n)) <span class="hljs-comment">// bind: 42</span>
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">promisify</span>(lookup)(<span class="hljs-string">&#x27;example.com&#x27;</span>))
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value)) <span class="hljs-comment">// 10.0.0.1</span>
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">promisify</span>(ask)(<span class="hljs-string">&#x27;可以吗?&#x27;</span>))
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">answer</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(answer)); <span class="hljs-comment">// 好</span>
</code></pre></div>
<p><code>counter.read</code> 被单独取出来以后，只是一个普通函数，和 <code>counter</code> 没有关系了。示例开头加了 <code>&#x27;use strict&#x27;</code>，和 ES 模块、<code>class</code> 内部的默认行为一致：直接调用 <code>read()</code> 时 <code>this</code> 是 <code>undefined</code>，读 <code>this.count</code> 就抛出 <code>TypeError</code>。非严格模式下，<code>this</code> 会退回到全局对象，<code>this.count</code> 读到 <code>undefined</code>，不报错但结果是错的。几次调用用 <code>then</code> 串起来，是为了让输出顺序固定。因为这个错误发生在 <code>new Promise</code> 的执行函数里，它会变成 Promise 的拒绝，所以用 <code>catch</code> 能接到。改法和文档示例一致：<code>read.call(counter)</code> 或 <code>read.bind(counter)</code>。</p>
<p><code>lookup</code> 的回调给了两个结果，但转出来的 Promise 只拿到第一个 <code>&#x27;10.0.0.1&#x27;</code>。这是手写版的行为，也符合文档对 <code>(err, value)</code> 格式的描述。真实的 <code>dns.lookup</code> 在 promisify 后返回 <code>{ address, family }</code> 对象，那是 dns 模块文档单独说明的特例，不是通用规则，所以需要多个结果时，最好用下面的 <code>custom</code> 自己决定返回什么。</p>
<h2>util.promisify.custom 解决什么问题</h2>
<p><code>ask</code> 有成功和失败两个回调，不是错误优先格式，直接 promisify 会把补上的回调当成 <code>onYes</code>，结果对不上。文档给的办法是在函数上挂 <code>util.promisify.custom</code> 属性，写好它的 Promise 版本，<code>promisify</code> 遇到这个属性会直接返回它的值，所以上面比较结果是 <code>true</code>。</p>
<p>这个符号在全局符号注册表里注册过，任何环境下都能用 <code>Symbol.for(&#x27;nodejs.util.promisify.custom&#x27;)</code> 拿到，所以手写版也用它。文档还说明，<code>custom</code> 属性存在但不是函数时，<code>promisify()</code> 会抛错，手写版为了简短没有做这个检查。</p>
<h2>常见追问</h2>
<p><strong>原函数本身已经返回 Promise，还能 promisify 吗？</strong></p>
<blockquote>
<p>不应该这么做。Node.js 从 v20.8.0 起，对返回 Promise 的函数调用 <code>promisify</code> 已被标记为弃用。这类函数本来就能直接 <code>await</code>，再包一层只会多等一个永远不会被调用的回调。</p>
</blockquote>
<p><strong>回调转 Promise 后，原来的错误处理要怎么改？</strong></p>
<blockquote>
<p>错误从回调的 <code>err</code> 参数挪到了 Promise 的拒绝里，所以要用 <code>try/catch</code> 包住 <code>await</code>，或者在链上加 <code>catch</code>。没有处理的拒绝在 Node.js 里默认会让进程退出，详见<a href="/questions/node-uncaught-exception/">《Node 进程怎样处理 uncaughtException 和 unhandledRejection？为什么捕获后仍应退出重启？》</a>。</p>
</blockquote>
<p><strong>fs 模块还需要自己 promisify 吗？</strong></p>
<blockquote>
<p>多数时候不需要。Node.js 自带 <code>fs/promises</code> 这类 Promise 版本的 API，直接用就行。<code>promisify</code> 主要用在第三方库或老代码里只有回调版本的函数上。</p>
</blockquote>`};export{e as default};