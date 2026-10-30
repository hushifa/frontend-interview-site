var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在一个标签页退出登录，其他开着的标签页也要马上跳到登录页，这就是多标签页通信要解决的事。</p>
<p>同源页面有四种常用办法。往 localStorage 写一个值，其他同源标签页会收到 <code>storage</code> 事件，写的那个页面自己收不到；BroadcastChannel 用同一个频道名一发多收，最省事；SharedWorker 是多个页面共用的一个后台脚本，可以在里面保存状态、转发消息；Service Worker 能通过 <code>clients.matchAll()</code> 找到它控制的页面，逐个 <code>postMessage</code>。</p>
<p>还有一种靠窗口引用：<code>window.open()</code> 返回新窗口的引用，新窗口通过 <code>window.opener</code> 拿到原窗口，双方可以用 <code>postMessage</code> 通信，而且能跨源。</p>
<p>要注意，前四种都要求同源，<code>sessionStorage</code> 的 <code>storage</code> 事件也到不了别的标签页。窗口引用在 <code>noopener</code> 或 <code>Cross-Origin-Opener-Policy</code> 隔离时会断开，跨源发消息还要校验 <code>origin</code>。</p>
</blockquote>
<h2>用 BroadcastChannel 同步退出登录</h2>
<p>最常见的需求是“一处操作，处处同步”。下面在 Node 里用同一个频道名建三个对象，模拟三个标签页，看看 A 发出的消息谁能收到：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> tabA = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;auth&#x27;</span>);
<span class="hljs-keyword">const</span> tabB = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;auth&#x27;</span>);
<span class="hljs-keyword">const</span> tabC = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;auth&#x27;</span>);
<span class="hljs-keyword">let</span> received = <span class="hljs-number">0</span>;

tabA.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;A 收到&#x27;</span>, e.<span class="hljs-property">data</span>);
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, ch] <span class="hljs-keyword">of</span> [[<span class="hljs-string">&#x27;B&#x27;</span>, tabB], [<span class="hljs-string">&#x27;C&#x27;</span>, tabC]]) {
  ch.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${name}</span> 收到\`</span>, e.<span class="hljs-property">data</span>);
    received += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (received === <span class="hljs-number">2</span>) [tabA, tabB, tabC].<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c.<span class="hljs-title function_">close</span>());
  };
}

tabA.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;logout&#x27;</span>, <span class="hljs-attr">at</span>: <span class="hljs-number">1</span> });
<span class="hljs-comment">// C 收到 { type: &#x27;logout&#x27;, at: 1 }</span>
<span class="hljs-comment">// B 收到 { type: &#x27;logout&#x27;, at: 1 }</span>
</code></pre></div>
<p>为什么 A 没有打印？因为发送方自己收不到自己发的消息，所以真实代码里，发起退出的页面要自己清会话、自己跳转。B 和 C 是不同的接收方，代码不要依赖它们谁先收到。消息走结构化克隆，可以直接发对象。哪些数据发不出去、关闭后再发会怎样，见<a href="/questions/browser-broadcast-channel/">《BroadcastChannel 的消息怎样发送和接收，有哪些限制？》</a>。</p>
<h2>storage 事件：最老的办法</h2>
<p>BroadcastChannel 普及之前，大家借 localStorage 来通信。原理是：一个页面改了 localStorage，同源的其他页面会收到 <code>storage</code> 事件，事件里带着 <code>key</code>、<code>oldValue</code> 和 <code>newValue</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 发送方</span>
<span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">setItem</span>(<span class="hljs-string">&#x27;auth-event&#x27;</span>, <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;logout&#x27;</span>, <span class="hljs-attr">at</span>: <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() }));

<span class="hljs-comment">// 接收方</span>
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;storage&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> !== <span class="hljs-string">&#x27;auth-event&#x27;</span> || !event.<span class="hljs-property">newValue</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> message = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(event.<span class="hljs-property">newValue</span>);
  <span class="hljs-keyword">if</span> (message.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;logout&#x27;</span>) location.<span class="hljs-title function_">assign</span>(<span class="hljs-string">&#x27;/login&#x27;</span>);
});
</code></pre></div>
<p>为什么要带一个 <code>at</code> 时间戳？因为值没有变化时，不算一次修改，带上变化的字段才能保证每次都触发。localStorage 只存字符串，所以对象要先 <code>JSON.stringify</code>。</p>
<p>和 BroadcastChannel 一样，改值的那个页面自己不会收到事件。<code>sessionStorage</code> 也有 <code>storage</code> 事件，但 MDN 写明它只在同一个标签页里的同源 iframe 之间触发，不会到达其他标签页，所以不能拿来做多标签页通信。</p>
<h2>需要共享状态时用 SharedWorker</h2>
<p>前两种都是广播，消息发完就没了，后打开的页面收不到。如果几个标签页要共用一份状态，或者共用一条 WebSocket 连接，就需要一个大家都连得上的中心，这就是 SharedWorker：同源页面用同一个脚本地址创建它，得到的是同一个实例。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// shared.js，由所有标签页共用</span>
<span class="hljs-keyword">const</span> ports = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
<span class="hljs-keyword">let</span> user = <span class="hljs-literal">null</span>;

onconnect = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> port = event.<span class="hljs-property">ports</span>[<span class="hljs-number">0</span>];
  ports.<span class="hljs-title function_">add</span>(port);
  port.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;init&#x27;</span>, user });
  port.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
    user = e.<span class="hljs-property">data</span>.<span class="hljs-property">user</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> p <span class="hljs-keyword">of</span> ports) p.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;update&#x27;</span>, user });
  };
};

<span class="hljs-comment">// 页面里</span>
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">SharedWorker</span>(<span class="hljs-string">&#x27;/shared.js&#x27;</span>);
worker.<span class="hljs-property">port</span>.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-title function_">render</span>(e.<span class="hljs-property">data</span>);
worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">user</span>: { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小王&#x27;</span> } });
</code></pre></div>
<p>新页面一连上就会收到 <code>init</code>，拿到当前状态，这是广播做不到的。代价是要自己维护连接列表：页面关掉时不能指望 Worker 一定收到通知，<code>ports</code> 里可能留下失效的端口，实际项目里常让页面卸载前发一条“断开”消息。SharedWorker 和普通 Worker 的区别见<a href="/questions/browser-shared-worker/">《SharedWorker 和 Dedicated Worker 有什么区别？》</a>。</p>
<h2>Service Worker 转发</h2>
<p>已经注册了 Service Worker 的站点，也可以让它当中转站。页面把消息发给 Service Worker，Service Worker 用 <code>clients.matchAll()</code> 找到它控制的页面，再调用每个页面的 <code>postMessage</code>，页面在 <code>navigator.serviceWorker</code> 上监听 <code>message</code> 事件接收。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sw.js</span>
<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-title function_">async</span> (event) =&gt; {
  <span class="hljs-keyword">const</span> list = <span class="hljs-keyword">await</span> <span class="hljs-variable language_">self</span>.<span class="hljs-property">clients</span>.<span class="hljs-title function_">matchAll</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;window&#x27;</span> });
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> client <span class="hljs-keyword">of</span> list) {
    <span class="hljs-keyword">if</span> (client.<span class="hljs-property">id</span> !== event.<span class="hljs-property">source</span>.<span class="hljs-property">id</span>) client.<span class="hljs-title function_">postMessage</span>(event.<span class="hljs-property">data</span>);
  }
});

<span class="hljs-comment">// 页面里</span>
navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e.<span class="hljs-property">data</span>));
navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-property">controller</span>?.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;logout&#x27;</span> });
</code></pre></div>
<p>它比 BroadcastChannel 绕，只有在本来就用 Service Worker 处理推送或离线时才值得这样做。还要注意 <code>controller</code> 可能是 <code>null</code>，比如强制刷新后页面不受 Service Worker 控制。</p>
<h2>窗口引用：唯一能跨源的办法</h2>
<p>上面四种都只在同源之间工作。如果页面 A 用 <code>window.open()</code> 打开了页面 B，A 能拿到返回的窗口引用，B 能通过 <code>window.opener</code> 拿到 A，双方就能用 <code>postMessage</code> 直接通信，而且可以跨源。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面 A</span>
<span class="hljs-keyword">const</span> child = <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">open</span>(<span class="hljs-string">&#x27;https://pay.example/checkout&#x27;</span>);
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">origin</span> !== <span class="hljs-string">&#x27;https://pay.example&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;支付结果&#x27;</span>, event.<span class="hljs-property">data</span>);
});

<span class="hljs-comment">// 页面 B（pay.example）</span>
<span class="hljs-variable language_">window</span>.<span class="hljs-property">opener</span>?.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;paid&#x27;</span> }, <span class="hljs-string">&#x27;https://shop.example&#x27;</span>);
</code></pre></div>
<p>为什么要写目标源和检查 <code>event.origin</code>？因为窗口里的页面可能已经跳到别的网站，不写目标源，消息可能发给错误的对象；不检查来源，任何页面都能冒充对方，详见<a href="/questions/sec-postmessage/">《跨窗口 postMessage 怎样避免把消息发给错误对象？》</a>。</p>
<p>这种办法有几个前提：两个窗口必须是这种打开关系，用户自己新开的标签页没有引用；<code>window.open()</code> 被弹窗拦截时返回 <code>null</code>；用了 <code>noopener</code>，新窗口的 <code>window.opener</code> 是 <code>null</code>；页面设置了 <code>Cross-Origin-Opener-Policy</code> 并被放进不同的浏览上下文组时，引用会断开，返回的窗口对象 <code>closed</code> 为 <code>true</code>。</p>
<h2>怎么选</h2>
<p>只发通知，用 BroadcastChannel；要兼容很老的浏览器，用 <code>storage</code> 事件；要共享状态或一条连接，用 SharedWorker；已经有 Service Worker，可以让它转发；跨源，只能用窗口引用加 <code>postMessage</code>。不同源的标签页之间没有引用时，浏览器里没有直接通道，只能经服务端，比如 WebSocket 推送。</p>
<h2>常见追问</h2>
<p><strong>同源是什么意思？两个子域算同源吗？</strong></p>
<blockquote>
<p>同源要求协议、主机名和端口都相同，<code>a.example.com</code> 和 <code>b.example.com</code> 主机名不同，不算同源，BroadcastChannel、SharedWorker 都连不上。另外 MDN 还提到，BroadcastChannel 实际按存储分区隔离，嵌在别的站点里的同源 iframe 也和顶层打开的页面通不了。区别见<a href="/questions/browser-storage-origin/">《同源、同站点与跨域分别是什么意思？》</a>。</p>
</blockquote>
<p><strong>多个标签页同时收到“数据更新了”，都去请求接口怎么办？</strong></p>
<blockquote>
<p>这是广播的通病。可以只让一个标签页去请求，再把结果广播出去；选谁去做可以用 Web Locks 抢锁，或者用 SharedWorker 统一请求再分发。</p>
</blockquote>
<p><strong>为什么不轮询 localStorage？</strong></p>
<blockquote>
<p>能用，但要定时读、比较值，既浪费又有延迟。<code>storage</code> 事件和 BroadcastChannel 都是有变化才通知，没有理由再轮询。</p>
</blockquote>`};export{e as default};