var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在支付页面连点了两下“提交订单”，或者网络慢、以为没点上又点了一次，结果后台生成了两笔订单。还有一种情况：页面上三个组件同时请求同一个用户信息，发了三个一模一样的请求。这两类问题都要处理。</p>
<p>防重复提交，前端的做法是在请求进行中禁用按钮，并在处理函数里加一个“进行中”的标记，标记没清掉之前再次触发直接忽略。只禁用按钮不够，因为回车提交、快捷键或者代码调用不经过按钮。</p>
<p>同样的读请求重复发，用一个 <code>Map</code> 以“请求方法加地址加参数”为键，存下进行中的 Promise。后来的调用发现键已经在了，就直接返回同一个 Promise，请求结束后把键删掉。</p>
<p>前端的这些手段只能减少重复，挡不住网络重发、用户开两个标签页或者直接调接口。真正保证一笔订单只创建一次，要靠服务端：前端为每次提交生成一个幂等键放在请求头里，服务端发现同一个键已经处理过，就返回上次的结果而不是再创建一次。</p>
</blockquote>
<h2>提交按钮怎样防连点</h2>
<p>最直观的是请求期间禁用按钮。可是按钮禁用要等状态更新、页面重新渲染以后才生效，两次点击挨得很近时，第二次可能在禁用前就触发了。而且表单还能用回车提交。所以处理函数里要再加一道同步的标记。</p>
<p>下面的 <code>withLock</code> 把一个异步函数包起来，进行中再调用就直接返回：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withLock</span>(<span class="hljs-params">fn</span>) {
  <span class="hljs-keyword">let</span> running = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">async</span> (...args) =&gt; {
    <span class="hljs-keyword">if</span> (running) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    running = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">fn</span>(...args);
    } <span class="hljs-keyword">finally</span> {
      running = <span class="hljs-literal">false</span>;
    }
  };
}
</code></pre></div>
<p><code>running</code> 是普通变量，同步地设成 <code>true</code>，第二次调用进来立刻就能看到，不用等渲染。<code>finally</code> 保证请求失败时也会解锁，否则一次失败按钮就永远点不动了。界面上再配合 <code>disabled</code> 和“提交中”的文字，让用户知道已经点上了。</p>
<p>防抖也能挡连点，但它是“等停下来再执行”，第一次点击要延迟才生效，用在提交按钮上会让人觉得没反应。加锁是第一次立即执行、后面忽略，更适合提交。</p>
<h2>同样的请求怎样只发一次</h2>
<p>页面上几个组件同时要同一份数据，各自发请求就会重复。思路是把“进行中的请求”缓存起来，相同的请求共享同一个 Promise。先看效果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pending = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">dedupe</span>(<span class="hljs-params">key, request</span>) {
  <span class="hljs-comment">// 同一个 key 的请求还没结束，就直接复用它的 Promise</span>
  <span class="hljs-keyword">if</span> (pending.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">return</span> pending.<span class="hljs-title function_">get</span>(key);
  <span class="hljs-keyword">const</span> promise = <span class="hljs-title function_">request</span>().<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> pending.<span class="hljs-title function_">delete</span>(key));
  pending.<span class="hljs-title function_">set</span>(key, promise);
  <span class="hljs-keyword">return</span> promise;
}

<span class="hljs-keyword">let</span> calls = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">fetchUser</span> = (<span class="hljs-params">id</span>) =&gt; <span class="hljs-function">() =&gt;</span>
  <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
    calls += <span class="hljs-number">1</span>;
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>({ id, <span class="hljs-attr">name</span>: <span class="hljs-string">\`用户<span class="hljs-subst">\${id}</span>\`</span> }), <span class="hljs-number">10</span>);
  });

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([<span class="hljs-title function_">dedupe</span>(<span class="hljs-string">&#x27;user:1&#x27;</span>, <span class="hljs-title function_">fetchUser</span>(<span class="hljs-number">1</span>)), <span class="hljs-title function_">dedupe</span>(<span class="hljs-string">&#x27;user:1&#x27;</span>, <span class="hljs-title function_">fetchUser</span>(<span class="hljs-number">1</span>))])
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">[a, b]</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(calls); <span class="hljs-comment">// 1</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a === b); <span class="hljs-comment">// true</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pending.<span class="hljs-property">size</span>); <span class="hljs-comment">// 0</span>
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">dedupe</span>(<span class="hljs-string">&#x27;user:1&#x27;</span>, <span class="hljs-title function_">fetchUser</span>(<span class="hljs-number">1</span>));
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(calls); <span class="hljs-comment">// 2</span>
  });
</code></pre></div>
<p>两次 <code>dedupe(&#x27;user:1&#x27;, …)</code> 同时调用，<code>calls</code> 却只有 1，说明真正的请求只发了一次。两个调用方拿到的 <code>a</code> 和 <code>b</code> 是同一个对象，因为它们等的是同一个 Promise。</p>
<p>为什么请求结束后要删掉键？因为这里只是合并“同时进行的”请求，不是缓存结果。请求结束后 <code>pending.size</code> 变回 0，再调用一次就会发新请求，所以最后 <code>calls</code> 变成 2。如果还想在一段时间内直接用上次的结果，那是另一层缓存，要考虑过期时间。</p>
<p>删键放在 <code>finally</code> 里，是因为请求失败时也要删。否则一个失败的 Promise 一直留在 Map 里，之后的调用拿到的永远是这个失败结果。</p>
<p>键要包含所有影响结果的东西：方法、地址、查询参数，必要时还有请求体。只用地址做键，<code>?page=1</code> 和 <code>?page=2</code> 就会被错误地合并。</p>
<h2>合并请求和取消旧请求有什么不同</h2>
<p>搜索框是另一种情况。用户输入“a”、“ab”、“abc”，三个请求的参数不同，不能合并。这里要的是只用最后一次的结果，前面的作废，否则慢的旧请求后回来会覆盖新结果。做法是每次发新请求前，用 <code>AbortController</code> 取消上一个，或者记下请求序号、只接收最新那个的响应，见<a href="/questions/browser-ime-search/">《中文输入法期间怎样触发搜索？composition 与请求竞态如何一起处理？》</a>。</p>
<p>所以规则是：参数相同、大家都要结果的，合并；参数不同、只要最新的，取消旧的。</p>
<h2>为什么最终要靠服务端幂等</h2>
<p>前端的锁和去重只在当前页面的内存里生效。用户打开两个标签页、刷新后重新提交、网络超时后浏览器或代理重发，前端都管不到。所以涉及钱和库存的写操作，必须由服务端保证“同一次操作只生效一次”。</p>
<p>MDN 对幂等的解释是：同样的请求连续发一次和发多次，对服务器状态的影响相同。MDN 还写明 <code>POST</code> 和 <code>PATCH</code> 不保证幂等，所以创建订单需要额外的手段。常见做法是前端在用户打开提交页时生成一个唯一 ID（比如 <code>crypto.randomUUID()</code>，它只在 HTTPS 等安全上下文里可用），作为幂等键随请求发送，重试时用同一个键。服务端处理前先查这个键，处理过就返回上次的结果。HTTP 方法本身的幂等性见<a href="/questions/http-methods/">《HTTP 方法的安全性和幂等性是什么意思？》</a>。</p>
<h2>常见追问</h2>
<p><strong>axios 拦截器里统一去重好不好？</strong></p>
<blockquote>
<p>可以做，但要区分读和写。读请求合并没有副作用，适合统一处理。写请求如果在拦截器里静默丢掉第二次，调用方会拿到一个永远不完成或者被取消的结果，界面状态容易乱。写操作更适合在业务层加锁，配合服务端幂等键。</p>
</blockquote>
<p><strong>请求失败后自动重试，会不会造成重复提交？</strong></p>
<blockquote>
<p>对写操作会。超时不等于服务端没处理，可能服务端已经创建了订单，只是响应没回来。所以写请求重试必须带同一个幂等键，让服务端认出这是同一次操作；没有幂等保证的接口不要自动重试。</p>
</blockquote>
<p><strong>表单提交后用户点浏览器后退再前进，会重复提交吗？</strong></p>
<blockquote>
<p>传统表单 POST 后直接返回结果页面，用户刷新时浏览器会再次发送这个 POST，通常会先弹窗询问。常见做法是 POST 成功后重定向到一个结果页（先 POST 再重定向，再 GET），这样刷新的是结果页，不会再发 POST。</p>
</blockquote>`};export{e as default};