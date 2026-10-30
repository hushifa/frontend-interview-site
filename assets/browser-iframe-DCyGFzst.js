var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面里放一个地图、一段视频播放器或者一个支付表单，常用的就是 <code>&lt;iframe&gt;</code>。它在当前页面里嵌入另一个完整的文档，这个文档有自己的 <code>window</code>、<code>document</code> 和导航历史。</p>
<p>好处来自“独立”：被嵌的页面跟父页面的样式和脚本互不干扰；跨域的话，双方脚本还被同源策略隔开；配合 <code>sandbox</code> 属性可以进一步禁止脚本、表单、弹窗。所以嵌第三方内容、展示用户生成的 HTML、老系统接入新页面，都会用它。</p>
<p>代价也来自“独立”：MDN 提醒每个 iframe 都是一个完整的文档环境，需要额外的内存和计算资源；它的内容不会自动撑开高度；屏幕阅读器用户需要 <code>title</code> 才知道里面是什么；对方站点还可能用 <code>X-Frame-Options</code> 或 CSP 的 <code>frame-ancestors</code> 禁止被嵌入。</p>
<p>通信分两种情况。同源时，父页面通过 <code>iframe.contentWindow</code> 拿到子页面的 <code>window</code>，子页面用 <code>window.parent</code> 拿到父页面，可以直接调用。跨域时只能用 <code>postMessage</code> 发消息，发送时写明目标 <code>origin</code>，接收时检查 <code>event.origin</code>。</p>
</blockquote>
<h2>iframe 适合用在哪里</h2>
<p>最常见的是嵌入别的站点的内容，比如地图、视频、广告、第三方登录或支付页面。对方的页面在自己的文档里运行，父页面不用关心它用了什么技术。</p>
<p>另一类是隔离不可信的内容。MDN 的示例里就有用 <code>srcdoc</code> 加 <code>sandbox</code> 展示一段 HTML 源码的写法，用来防止展示用户内容时被注入脚本。<code>sandbox</code> 为空时启用全部限制，再用 <code>allow-scripts</code>、<code>allow-forms</code> 这类令牌逐项放开。可是同源内容同时放开 <code>allow-scripts</code> 和 <code>allow-same-origin</code> 时，被嵌的页面能把 <code>sandbox</code> 属性自己删掉，等于没加，详见<a href="/questions/security-iframe-sandbox/">《iframe sandbox 的权限组合有什么风险？》</a>。</p>
<h2>iframe 的缺点有哪些</h2>
<p>首先是开销。每个 iframe 都要加载并维护一个完整的文档，数量多了会占内存、拖慢页面。对不在首屏的 iframe，可以加 <code>loading=&quot;lazy&quot;</code>，等它接近视口再加载。</p>
<p>其次是尺寸。出于安全和隐私原因，iframe 默认不会把内容的尺寸告诉父页面，所以高度不会自动跟着内容变。常见的做法是让子页面量好高度，用 <code>postMessage</code> 告诉父页面去改 iframe 的高度。</p>
<p>还有无障碍和可嵌入性。MDN 建议给 iframe 加 <code>title</code>，否则屏幕阅读器用户得进到里面才知道是什么内容。另外，对方站点返回了 <code>X-Frame-Options: DENY</code>，或者用 CSP 的 <code>frame-ancestors</code> 限制了嵌入方，浏览器就不会在你的页面里显示它，见<a href="/questions/sec-clickjacking/">《怎样用 frame-ancestors 限制页面被嵌入？》</a>。</p>
<p>最后是加载状态不可靠。MDN 说明，为了防止有人用 iframe 探测内网地址，浏览器不会在 iframe 上触发 <code>error</code> 事件，即使内容加载失败也会触发 <code>load</code>。所以不能靠 <code>onerror</code> 判断嵌入是否成功。</p>
<h2>同源时怎样直接访问</h2>
<p>父页面和子页面同源时，可以像访问普通对象一样互相访问：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 父页面</span>
<span class="hljs-keyword">const</span> frame = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;iframe&#x27;</span>);
frame.<span class="hljs-property">contentWindow</span>.<span class="hljs-title function_">someFunction</span>();
frame.<span class="hljs-property">contentDocument</span>.<span class="hljs-property">body</span>.<span class="hljs-property">style</span>.<span class="hljs-property">background</span> = <span class="hljs-string">&#x27;#fff&#x27;</span>;

<span class="hljs-comment">// 子页面</span>
<span class="hljs-variable language_">window</span>.<span class="hljs-property">parent</span>.<span class="hljs-property">document</span>.<span class="hljs-property">title</span> = <span class="hljs-string">&#x27;子页面改了标题&#x27;</span>;
</code></pre></div>
<p><code>contentDocument</code> 和 <code>contentWindow.document</code> 是同一个东西。可是只要不同源，这些属性里的大部分内容脚本都碰不到，<code>contentDocument</code> 会是 <code>null</code>，这是同源策略的限制。</p>
<h2>跨域时用 postMessage</h2>
<p>跨域时只剩 <code>postMessage</code> 这条路。它把消息用结构化克隆复制一份，在对方窗口上派发一个 <code>message</code> 事件。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 父页面：第二个参数写子页面的确切源</span>
frame.<span class="hljs-property">contentWindow</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;init&#x27;</span>, <span class="hljs-attr">userId</span>: <span class="hljs-number">42</span> }, <span class="hljs-string">&#x27;https://child.example&#x27;</span>);

<span class="hljs-comment">// 子页面：先看消息是从哪来的</span>
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">origin</span> !== <span class="hljs-string">&#x27;https://parent.example&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span>?.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;init&#x27;</span>) <span class="hljs-keyword">return</span>;
  event.<span class="hljs-property">source</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ready&#x27;</span> }, event.<span class="hljs-property">origin</span>);
});
</code></pre></div>
<p>为什么发送时不写 <code>&#x27;*&#x27;</code>？因为 iframe 里的页面可能已经被导航到了别的站点，写 <code>&#x27;*&#x27;</code> 消息就会发给当前在那里的任何页面。写确切的源，源对不上浏览器就不派发。</p>
<p>为什么接收时要查 <code>event.origin</code>？因为 MDN 指出，iframe 层级里的任何窗口（包括恶意站点的）都可以给其他窗口发消息。确认来源以后，还要校验消息的格式，不能把收到的内容直接拿去执行或插进页面。更多细节见<a href="/questions/sec-postmessage/">《跨窗口 postMessage 怎样避免把消息发给错误对象？》</a>。</p>
<h2>消息多了可以用 MessageChannel</h2>
<p><code>postMessage</code> 所有消息都走同一个 <code>message</code> 事件，类型一多就要自己区分。<code>MessageChannel</code> 能建一条专用通道，它有两个端口，一端留在父页面，另一端通过 <code>postMessage</code> 的第三个参数转交给 iframe，之后双方只在这条通道上收发。</p>
<p>下面在 node 里演示两个端口之间的一问一答，浏览器里的用法相同，只是 <code>port2</code> 会先被转交给子页面：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { port1, port2 } = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MessageChannel</span>();

port2.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;子页面收到:&#x27;</span>, event.<span class="hljs-property">data</span>);
  port2.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;pong&#x27;</span>, <span class="hljs-attr">id</span>: event.<span class="hljs-property">data</span>.<span class="hljs-property">id</span> });
};
port1.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;父页面收到:&#x27;</span>, event.<span class="hljs-property">data</span>);
  port1.<span class="hljs-title function_">close</span>();
  port2.<span class="hljs-title function_">close</span>();
};

port1.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ping&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;消息已发出&#x27;</span>);
</code></pre></div>
<p>用 Node.js 22 运行，输出依次是：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">消息已发出
子页面收到: { type: &#x27;ping&#x27;, id: 1 }
父页面收到: { type: &#x27;pong&#x27;, id: 1 }
</code></pre></div>
<p>“消息已发出”最先打印，说明 <code>postMessage</code> 不会同步调用对方的处理函数，消息是异步送达的。转交给 iframe 时的写法是 <code>frame.contentWindow.postMessage(&#x27;init&#x27;, &#x27;https://child.example&#x27;, [channel.port2])</code>，端口转交以后父页面这边就不能再用 <code>port2</code> 了。</p>
<h2>常见追问</h2>
<p><strong>子页面能把整个页面跳走吗？</strong></p>
<blockquote>
<p>同源的子页面可以设置 <code>window.top.location</code>。跨域的子页面只有在用户和它有过交互之后才能让顶层页面跳转，加了 <code>sandbox</code> 的 iframe 则需要 <code>allow-top-navigation</code> 或 <code>allow-top-navigation-by-user-activation</code> 才行。</p>
</blockquote>
<p><strong>同一域名下的多个标签页也能这样通信吗？</strong></p>
<blockquote>
<p>标签页之间拿不到彼此的 <code>window</code> 引用（<code>window.open</code> 打开的除外），一般用 <code>BroadcastChannel</code> 或 <code>storage</code> 事件，见<a href="/questions/browser-tab-communication/">《浏览器多个标签页之间怎样通信？》</a>。</p>
</blockquote>`};export{e as default};