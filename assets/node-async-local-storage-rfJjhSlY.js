var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端打日志时，希望每一行都带上当前请求的 ID，可又不想把 <code>requestId</code> 一层层当参数传下去。AsyncLocalStorage 就是干这个的：在请求入口调用 <code>storage.run(store, fn)</code>，<code>fn</code> 里面以及它启动的所有异步操作，都能用 <code>getStore()</code> 读到这个 store。</p>
<p>每次 <code>run</code> 都有自己独立的 store，两个请求交错着 <code>await</code>，读到的也不会串。在 <code>run</code> 外面调用 <code>getStore()</code>，得到的是 <code>undefined</code>。</p>
<p>原生 Promise、定时器和大多数核心 API 会自动把上下文带过去。但 EventEmitter 的监听器是在触发 <code>emit</code> 的那个上下文里运行的，要用 <code>AsyncResource.bind</code> 绑定；回调式的第三方库也可能把上下文弄丢；Worker 线程不继承主线程的 store，要在消息里自己传请求 ID。</p>
<p>要注意，它只适合做日志关联，不能拿来做授权判断。另外 Node.js 24.0.0 起默认换成了 AsyncContextFrame 实现，可以用 <code>--no-async-context-frame</code> 切回基于 async_hooks 的旧实现。</p>
</blockquote>
<h2>为什么不能用一个全局变量记当前请求</h2>
<p>最直接的想法是放一个模块级变量，请求进来时写上 ID。先看并发时会发生什么：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> current;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handle</span>(<span class="hljs-params">id</span>) {
  current = id;
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, id === <span class="hljs-string">&#x27;A&#x27;</span> ? <span class="hljs-number">20</span> : <span class="hljs-number">5</span>));
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(id, <span class="hljs-string">&#x27;读到&#x27;</span>, current);
}

<span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([<span class="hljs-title function_">handle</span>(<span class="hljs-string">&#x27;A&#x27;</span>), <span class="hljs-title function_">handle</span>(<span class="hljs-string">&#x27;B&#x27;</span>)]);
<span class="hljs-comment">// B 读到 B</span>
<span class="hljs-comment">// A 读到 B</span>
</code></pre></div>
<p>请求 A 读到的是 B 的 ID。原因是 Node.js 的 JavaScript 只有一个线程，A 走到 <code>await</code> 就让出去了，B 趁这个空当把 <code>current</code> 改成了 B。等 A 回来接着执行，变量早就被覆盖了。</p>
<h2>用 run 给每个请求一份自己的上下文</h2>
<p>改成 AsyncLocalStorage，在每个请求入口调用 <code>run</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">AsyncLocalStorage</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:async_hooks&#x27;</span>;

<span class="hljs-keyword">const</span> storage = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AsyncLocalStorage</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">log</span>(<span class="hljs-params">message</span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${storage.getStore()?.requestId ?? <span class="hljs-string">&#x27;-&#x27;</span>}</span> <span class="hljs-subst">\${message}</span>\`</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">handle</span>(<span class="hljs-params">requestId, ms</span>) {
  <span class="hljs-keyword">return</span> storage.<span class="hljs-title function_">run</span>({ requestId }, <span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;开始&#x27;</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, ms));
    <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;完成&#x27;</span>);
  });
}

<span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([<span class="hljs-title function_">handle</span>(<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-number">30</span>), <span class="hljs-title function_">handle</span>(<span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-number">5</span>)]);
<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;外部&#x27;</span>);
</code></pre></div>
<p>Node.js 22 实测输出：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">A 开始
B 开始
B 完成
A 完成
- 外部
</code></pre></div>
<p>B 比 A 先完成，可两条日志各自带着正确的 ID。<code>log</code> 函数没有接收任何参数，它是通过 <code>getStore()</code> 从“当前这条异步调用链”上拿到 store 的。最后一行在 <code>run</code> 外面调用，读到 <code>undefined</code>，所以打出来是 <code>-</code>。</p>
<p>真实服务里，在 HTTP 处理函数的入口调用 <code>run</code>。请求 ID 由服务端生成，或者校验格式以后采用上游传来的值。</p>
<h2>什么情况下上下文会丢</h2>
<p>上下文是跟着异步操作“被创建时”的链路走的。EventEmitter 不一样，监听器是在别人调用 <code>emit</code> 时同步执行的，所以它读到的是触发方的上下文。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">AsyncResource</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:async_hooks&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">EventEmitter</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:events&#x27;</span>;

<span class="hljs-keyword">const</span> emitter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventEmitter</span>();
storage.<span class="hljs-title function_">run</span>({ <span class="hljs-attr">requestId</span>: <span class="hljs-string">&#x27;C&#x27;</span> }, <span class="hljs-function">() =&gt;</span> {
  emitter.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;普通监听&#x27;</span>));
  emitter.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;x&#x27;</span>, <span class="hljs-title class_">AsyncResource</span>.<span class="hljs-title function_">bind</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;绑定后的监听&#x27;</span>)));
});
storage.<span class="hljs-title function_">run</span>({ <span class="hljs-attr">requestId</span>: <span class="hljs-string">&#x27;D&#x27;</span> }, <span class="hljs-function">() =&gt;</span> emitter.<span class="hljs-title function_">emit</span>(<span class="hljs-string">&#x27;x&#x27;</span>));
<span class="hljs-comment">// D 普通监听</span>
<span class="hljs-comment">// C 绑定后的监听</span>
</code></pre></div>
<p>两个监听器都是在 C 里注册的。普通监听器读到的是触发 <code>emit</code> 时的上下文 D；用 <code>AsyncResource.bind</code> 包过的监听器，保留了注册时的上下文 C。</p>
<p>其他常见情况处理方式如下：</p>
<table><thead><tr><th>场景</th><th>处理方式</th></tr></thead><tbody><tr><td>回调式 API</td><td>用 <code>util.promisify</code> 转成 Promise，或用 <code>AsyncResource</code> 包装回调</td></tr><tr><td>自定义连接池、任务队列</td><td>入队时用 <code>AsyncResource.bind</code> 绑定回调</td></tr><tr><td>Worker Threads</td><td>在消息里传递请求 ID，Worker 内部重新 <code>run</code></td></tr><tr><td>跨服务</td><td>用 W3C Trace Context（<code>traceparent</code> 请求头）传递，进程内上下文不会跨网络</td></tr></tbody></table>
<p>调试时如果发现某条日志的 ID 变成了 <code>undefined</code>，通常是它前面最近执行的那个回调把上下文弄丢了，顺着往前找就行。</p>
<h2>用的时候要注意什么</h2>
<p>优先用 <code>run()</code>。<code>enterWith()</code> 仍是实验性 API，它会改变当前整段同步执行的上下文，后面的代码容易意外继承到它。</p>
<p>store 里只放请求 ID、租户 ID 这类小而稳定的标识，可以用 <code>Object.freeze</code> 防止被下游改写。因为 store 里的东西会被复制进每条日志，所以 Cookie、令牌和用户输入都不要放。</p>
<p>还有一点，上下文是用来关联日志的，不是用来判断权限的。用户身份要从认证后的会话里取。</p>
<h2>常见追问</h2>
<p><strong>为什么不用模块级变量保存当前请求？</strong></p>
<blockquote>
<p>并发请求会互相覆盖。一个请求走到 <code>await</code> 让出线程，另一个请求就可能改掉这个变量，第一个请求回来后读到的已经是别人的值。</p>
</blockquote>
<p><strong>AsyncContextFrame 改变了什么？</strong></p>
<blockquote>
<p>Node.js 24.0.0 起默认使用它。上下文改为随 V8 的 Promise 续体传播，不再依赖 async_hooks，开销更低，API 不变。官方说明两种实现的上下文流向在少数情况下可能不同，所以升级时要回归测试日志关联。</p>
</blockquote>
<p><strong>和 diagnostics_channel 怎么配合？</strong></p>
<blockquote>
<p>订阅者收到诊断事件时调用 <code>getStore()</code>，给事件打上当前请求 ID，见<a href="/questions/node-diagnostics-channel/">《Node.js 的 diagnostics_channel 适合解决什么问题？》</a>。</p>
</blockquote>`};export{e as default};