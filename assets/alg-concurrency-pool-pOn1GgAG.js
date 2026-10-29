var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>并发池的作用是：一堆异步任务，最多同时跑 <code>limit</code> 个，跑完一个再接下一个。</p>
<p>关键是传进来的必须是任务函数，比如 <code>() =&gt; fetch(url)</code>，而不是 <code>fetch(url)</code> 的结果。因为 Promise 一创建，请求就已经发出去了，池子只有拿到函数，才能决定什么时候启动。</p>
<p>实现上，同时开 <code>Math.min(limit, 任务数)</code> 个执行循环。它们共用一个 <code>next</code> 下标，每次同步地领 <code>next++</code>，所以同一个任务不会被领两次。结果写到 <code>results[index]</code>，输出顺序和输入一致，跟谁先完成没关系。</p>
<p>失败时要说清楚语义：某个任务失败，就设一个 <code>failed</code> 标记，整体以这个错误拒绝，其他循环跑完手上的任务后就不再领新的。但已经开始的任务不会自动停，要靠 <code>AbortSignal</code> 自己中断。另外，并发池限制的是同时在跑的数量，不是每秒请求数，限速要另外做。</p>
</blockquote>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">runPool</span>(<span class="hljs-params">tasks, limit</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(tasks)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;任务必须是数组&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(limit) || limit &lt; <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;并发数必须为正整数&#x27;</span>);
  }

  <span class="hljs-comment">// 复制任务列表，并把稀疏数组中的空位变成 undefined，方便统一校验。</span>
  <span class="hljs-keyword">const</span> queue = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(tasks);
  <span class="hljs-keyword">if</span> (queue.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">task</span>) =&gt;</span> <span class="hljs-keyword">typeof</span> task !== <span class="hljs-string">&#x27;function&#x27;</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;每个任务都必须是函数&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> results = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(queue.<span class="hljs-property">length</span>);
  <span class="hljs-keyword">let</span> next = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> failed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">worker</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">while</span> (!failed &amp;&amp; next &lt; queue.<span class="hljs-property">length</span>) {
      <span class="hljs-keyword">const</span> index = next++;
      <span class="hljs-keyword">try</span> {
        results[index] = <span class="hljs-keyword">await</span> queue[index]();
      } <span class="hljs-keyword">catch</span> (error) {
        failed = <span class="hljs-literal">true</span>;
        <span class="hljs-keyword">throw</span> error;
      }
    }
  }

  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(limit, queue.<span class="hljs-property">length</span>) }, worker));
  <span class="hljs-keyword">return</span> results;
}
</code></pre></div>
<p>几个循环同时在领 <code>next</code>，会不会领到同一个？不会。JavaScript 是单线程的，<code>const index = next++</code> 这一行是同步执行的，中间不会被别的循环插进来。只有到了 <code>await</code>，才会切到别的循环。</p>
<p>为什么要用 <code>results[index]</code> 而不是 <code>results.push</code>？因为任务完成的先后是不确定的，<code>push</code> 会按完成顺序排。按下标写，输出顺序就和输入顺序一致。</p>
<p>参数校验放在最前面，在启动任何任务之前。任务里同步抛出的错误，也会被 <code>try/catch</code> 接住。空任务列表会直接返回 <code>[]</code>。</p>
<p>下面验证一下最多同时跑几个：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> active = <span class="hljs-number">0</span>;
<span class="hljs-keyword">let</span> maximum = <span class="hljs-number">0</span>;

<span class="hljs-keyword">const</span> jobs = [<span class="hljs-number">40</span>, <span class="hljs-number">10</span>, <span class="hljs-number">5</span>, <span class="hljs-number">20</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">delay, index</span>) =&gt;</span> <span class="hljs-title function_">async</span> () =&gt; {
  active++;
  maximum = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(maximum, active);
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, delay));
    <span class="hljs-keyword">return</span> index;
  } <span class="hljs-keyword">finally</span> {
    active--;
  }
});

<span class="hljs-title function_">runPool</span>(jobs, <span class="hljs-number">2</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result); <span class="hljs-comment">// [0, 1, 2, 3]</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(maximum); <span class="hljs-comment">// 2</span>
});
</code></pre></div>
<p>任务完成的顺序是乱的，但结果仍然是 <code>[0, 1, 2, 3]</code>，同时在跑的最多是 2 个。</p>
<h2>一个任务失败了，会发生什么</h2>
<p>假设有四个任务 a、b、c、d，并发数是 2，b 在 10 毫秒时失败。过程是这样的：</p>
<p>0 毫秒时，两个循环分别领了 a 和 b。a 先完成，它所在的循环接着领了 c。随后 b 失败，<code>failed</code> 变成 <code>true</code>，整体 Promise 拒绝。可是 c 已经开始了，它会继续跑完；之后循环检查到 <code>failed</code>，就不再领 d。</p>
<p>实际跑一遍，<code>started</code> 是 <code>[&#x27;a&#x27;, &#x27;b&#x27;, &#x27;c&#x27;]</code>。所以“失败后停止”的意思是不再领新任务，已经开始的任务和它们产生的副作用，不会被自动撤销。</p>
<p>如果要真的中断已经开始的任务，可以让所有任务共用一个 <code>AbortController</code>，失败时统一取消：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-keyword">const</span> tasks = urls.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">url</span>) =&gt;</span> <span class="hljs-function">() =&gt;</span>
  <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
    <span class="hljs-keyword">return</span> response.<span class="hljs-title function_">json</span>();
  }),
);

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">runPool</span>(tasks, <span class="hljs-number">4</span>);
} <span class="hljs-keyword">catch</span> (error) {
  controller.<span class="hljs-title function_">abort</span>(error);
  <span class="hljs-keyword">throw</span> error;
}
</code></pre></div>
<p>注意任务里检查了 <code>response.ok</code>。<code>fetch</code> 碰到 404、500 不会拒绝，不检查的话，失败的请求会被当成成功的结果。</p>
<h2>常见追问</h2>
<p><strong>想拿到全部任务的结果，不因为一个失败就停下来，怎么办？</strong></p>
<blockquote>
<p>在每个任务里自己捕获错误，返回 <code>{ status: &#x27;rejected&#x27;, reason }</code>，这样池子看到的全是成功。效果就像带并发限制的 <code>Promise.allSettled</code>。</p>
</blockquote>
<p><strong>任务数量是动态增加的怎么办？</strong></p>
<blockquote>
<p>把 <code>queue</code> 换成可以随时 <code>push</code> 的队列。执行循环发现队列空了，就等新任务进来，而不是直接退出。</p>
</blockquote>
<p><strong>并发数怎么选？</strong></p>
<blockquote>
<p>浏览器对同一个域名的 HTTP/1.1 连接数有限制，Chrome 是 6 个。HTTP/2 可以多路复用，没有这个限制，但服务端仍然有容量上限。要按接口的承载能力和实际测出来的耗时来调。</p>
</blockquote>`};export{e as default};