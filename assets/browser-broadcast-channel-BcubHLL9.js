var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户开了三个标签页，在其中一个点了退出登录，另外两个也应该马上跳到登录页。BroadcastChannel 就是干这个的：同源的标签页、iframe、Worker 用同一个名字创建频道，一方 <code>postMessage</code>，其他所有方都会收到 <code>message</code> 事件。</p>
<p>它用起来很简单，消息走结构化克隆，可以直接发对象。发送方自己收不到自己发的消息。</p>
<p>适合广播“已退出登录”“主题切换了”“某条数据更新了”这类通知。</p>
<p>要注意它只是广播。消息只发给当时开着的页面，后打开的页面收不到之前的消息；它也不管谁先谁后，需要“只让一个标签页去做”时要用 Web Locks。</p>
</blockquote>
<h2>先看一个同步退出登录的例子</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> channel = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;auth&#x27;</span>);

channel.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span>.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;logout&#x27;</span>) {
    <span class="hljs-title function_">clearLocalSession</span>();
    location.<span class="hljs-title function_">assign</span>(<span class="hljs-string">&#x27;/login&#x27;</span>);
  }
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">logout</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title function_">clearLocalSession</span>();
  channel.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;logout&#x27;</span> });
  location.<span class="hljs-title function_">assign</span>(<span class="hljs-string">&#x27;/login&#x27;</span>);
}
</code></pre></div>
<p>当前页面调用 <code>logout()</code>，自己先清掉会话，再往 <code>auth</code> 频道里发一条消息。其他标签页收到后，也清会话、跳登录页。</p>
<p>为什么 <code>logout</code> 里要自己跳转，不等消息？因为发送方自己收不到自己发的消息。下面这段在 Node 里同一个频道名建了两个对象，<code>a</code> 发消息，只有 <code>b</code> 收到：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> a = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;auth&#x27;</span>);
<span class="hljs-keyword">const</span> b = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;auth&#x27;</span>);
a.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;a 收到&#x27;</span>, e.<span class="hljs-property">data</span>);
b.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> { <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;b 收到&#x27;</span>, e.<span class="hljs-property">data</span>); a.<span class="hljs-title function_">close</span>(); b.<span class="hljs-title function_">close</span>(); };
a.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;logout&#x27;</span> });
<span class="hljs-comment">// b 收到 { type: &#x27;logout&#x27; }</span>
</code></pre></div>
<p>页面卸载或组件销毁时，记得调用 <code>channel.close()</code>。</p>
<h2>后打开的页面怎么办</h2>
<p>广播是“发出去就完了”，消息不会存下来。用户退出登录之后再新开一个标签页，这个页面什么都收不到。所以新页面要自己去读当前状态，比如从 localStorage 或服务端获取，不能指望广播。</p>
<p>另一个坑是请求风暴。比如广播“数据更新了”，十个标签页同时收到，同时去请求接口。更好的做法是只让一个标签页去刷新，再把结果广播出去。</p>
<p>它也只在同源之间工作。不同子域之间要通信，得用 <code>postMessage</code> 或者服务端转发。</p>
<h2>和其他通信方案怎么选</h2>
<table><thead><tr><th>方案</th><th>特点</th></tr></thead><tbody><tr><td>BroadcastChannel</td><td>一对多广播，API 最简单</td></tr><tr><td><code>storage</code> 事件</td><td>只能借 localStorage 写入触发，数据要序列化成字符串</td></tr><tr><td>SharedWorker</td><td>有一个共享的中心，可以保存状态、做协调</td></tr><tr><td>Service Worker <code>clients</code></td><td>能找到所有受控页面，也能处理推送</td></tr><tr><td><code>postMessage</code></td><td>需要拿到目标窗口引用，可以跨源</td></tr></tbody></table>
<p>只是发个通知，BroadcastChannel 最省事。需要一个地方保存共享状态，用 SharedWorker。要跨源，就只能用窗口的 <code>postMessage</code>。</p>
<h2>常见追问</h2>
<p><strong>BroadcastChannel 能保证每个页面都收到消息吗？</strong></p>
<blockquote>
<p>不能。它只发给当时开着的页面，不存历史消息。后打开的页面要自己从 localStorage 或服务端读取当前状态。</p>
</blockquote>
<p><strong>多个标签页抢着做同一件事，能用 BroadcastChannel 协调吗？</strong></p>
<blockquote>
<p>不适合。它没有互斥能力，大家都能同时收到消息。要保证只有一个标签页去做，比如刷新令牌，用 Web Locks。</p>
</blockquote>`};export{e as default};