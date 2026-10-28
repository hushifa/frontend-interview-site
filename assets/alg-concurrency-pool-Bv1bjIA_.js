var e={answerHtml:`<h2>简答</h2>
<ul>
<li>传入的是任务函数 <code>() =&gt; fetch(url)</code>，不是 <code>fetch(url)</code> 返回的 Promise；Promise 创建时请求已经发出，池子只有拿到函数才能控制启动时机。</li>
<li>启动 <code>Math.min(limit, 任务数)</code> 个执行循环，它们共享一个 <code>next</code> 下标，每次同步领取 <code>next++</code>，所以同一个任务不会被领取两次。</li>
<li>结果写入 <code>results[index]</code>，输出顺序与输入一致，与完成先后无关。</li>
<li>某个任务失败时设置 <code>failed</code> 标记，整体 Promise 以该错误拒绝，其他循环在完成当前任务后停止领取。失败被观察到之前，别的循环可能已经领取了新任务。</li>
<li>并发池限制的是同时在途的任务数，不是每秒请求数；需要限制速率时要另外实现令牌桶等机制。</li>
</ul>
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
<p>参数校验发生在启动任何任务之前。任务同步抛错也会被 <code>try/catch</code> 捕获。空任务列表直接返回 <code>[]</code>。</p>
<h2>失败时会发生什么</h2>
<p>四个任务、并发数 2，第二个任务在 10 毫秒时失败：</p>
<ol>
<li>0 毫秒：两个循环分别领取任务 a 和 b。</li>
<li>10 毫秒：a 先完成，它所在的循环领取 c；随后 b 失败，<code>failed</code> 变为 <code>true</code>，整体拒绝。</li>
<li>c 已经开始，会继续执行到结束；之后循环检查到 <code>failed</code>，不再领取 d。</li>
</ol>
<p>实测 <code>started</code> 为 <code>[&#x27;a&#x27;, &#x27;b&#x27;, &#x27;c&#x27;]</code>。所以&quot;失败后停止&quot;指的是停止领取新任务，已经开始的任务和它们的副作用不会自动撤销。</p>
<p>需要真正中断时，让任务共用一个 <code>AbortController</code>：</p>
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
<p><code>fetch</code> 对 404、500 这类响应不会拒绝，任务里要检查 <code>response.ok</code>，否则失败的请求会被当成成功结果。</p>
<h2>常见追问</h2>
<ul>
<li><strong>想要全部任务的结果，不因失败而停止？</strong> 在任务里捕获错误，返回 <code>{ status: &#x27;rejected&#x27;, reason }</code>，效果类似 <code>Promise.allSettled</code> 加并发限制。</li>
<li><strong>任务数量是动态的怎么办？</strong> 把 <code>queue</code> 换成可以随时 <code>push</code> 的队列，执行循环在队列为空时等待新任务，而不是直接退出。</li>
<li><strong>并发数怎么选？</strong> 浏览器对同一域名的 HTTP/1.1 连接数有限制（Chrome 为 6 个），HTTP/2 下多路复用没有这个限制，但服务端仍有容量上限。按接口的承载能力和实测耗时调整。</li>
</ul>`};export{e as default};