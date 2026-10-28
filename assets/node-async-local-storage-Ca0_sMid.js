var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>storage.run(store, fn)</code> 让 <code>fn</code> 及其中启动的异步操作通过 <code>getStore()</code> 读到同一个 store，常用于请求 ID、trace 信息和日志关联。</li>
<li>每次 <code>run</code> 有独立的 store，两个请求交错执行 <code>await</code> 也不会串用；在 <code>run</code> 之外调用 <code>getStore()</code> 返回 <code>undefined</code>。</li>
<li>原生 Promise、定时器和大多数核心 API 会自动传播上下文。EventEmitter 监听器在触发 <code>emit</code> 的上下文中运行，需要 <code>AsyncResource.bind</code> 绑定；回调式第三方库可能丢失上下文。</li>
<li>Worker 线程不继承主线程的 store，需要在消息里显式传递请求 ID。</li>
<li>Node.js 24.0.0 起默认由 AsyncContextFrame 实现，可用 <code>--no-async-context-frame</code> 切回基于 async_hooks 的旧实现。</li>
</ul>
<h2>请求入口建立上下文</h2>
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
<p>B 先完成，但两个请求的日志各自带着正确的 ID。真实服务里在 HTTP 处理函数的入口调用 <code>run</code>，请求 ID 由服务端生成，或者在校验格式后采用上游传来的值。</p>
<h2>上下文丢失的场景</h2>
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
<p>普通监听器读到的是触发 <code>emit</code> 时的上下文 D，绑定后的监听器保留了注册时的上下文 C。其他常见情况：</p>
<table><thead><tr><th>场景</th><th>处理方式</th></tr></thead><tbody><tr><td>回调式 API</td><td>用 <code>util.promisify</code> 转成 Promise，或用 <code>AsyncResource</code> 包装回调</td></tr><tr><td>自定义连接池、任务队列</td><td>入队时用 <code>AsyncResource.bind</code> 绑定回调</td></tr><tr><td>Worker Threads</td><td>在消息里传递请求 ID，Worker 内部重新 <code>run</code></td></tr><tr><td>跨服务</td><td>用 W3C Trace Context（<code>traceparent</code> 请求头）传递，进程内上下文不会跨网络</td></tr></tbody></table>
<p>调试时，如果某条日志的 ID 变成 <code>undefined</code>，通常是它之前最近执行的那个回调丢失了上下文。</p>
<h2>使用建议</h2>
<ul>
<li>优先用 <code>run()</code>。<code>enterWith()</code> 仍是实验性 API，它会改变当前整段同步执行的上下文，容易让后续代码意外继承。</li>
<li>store 只放请求 ID、租户 ID 这类小而稳定的标识，可以用 <code>Object.freeze</code> 防止被下游改写。</li>
<li>上下文用于日志关联，不用于授权判断；用户身份要从认证后的会话中取得。</li>
<li>store 中的数据会被复制到每条日志，不要放 Cookie、令牌和用户输入。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>为什么不用模块级变量保存当前请求？</strong> 并发请求会互相覆盖，第一个 <code>await</code> 之后读到的可能已经是另一个请求的值。</li>
<li><strong>AsyncContextFrame 改变了什么？</strong> 上下文改为随 V8 的 Promise 续体传播，不再依赖 async_hooks，开销更低，API 不变。官方说明两种实现的上下文流向在少数情况下可能不同，升级时要回归测试日志关联。</li>
<li><strong>和 diagnostics_channel 怎么配合？</strong> 订阅者在收到诊断事件时调用 <code>getStore()</code> 给事件打上请求 ID，见<a href="/questions/node-diagnostics-channel/">《Node.js 的 diagnostics_channel 适合解决什么问题？》</a>。</li>
</ul>`};export{e as default};