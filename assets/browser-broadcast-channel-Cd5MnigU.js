var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在一个标签页点了退出登录，其他标签页也要跳到登录页。BroadcastChannel 的用法是：每个页面用同一个名字 <code>new BroadcastChannel(&#x27;auth&#x27;)</code>，第一个用这个名字的页面会创建底层频道，后面的加入进来；一方 <code>postMessage</code>，其他所有订阅者收到 <code>message</code> 事件，发送方自己收不到。</p>
<p>消息用结构化克隆传过去，可以直接发对象，不用自己 <code>JSON.stringify</code>。可是函数、DOM 节点这类不能克隆的数据会让 <code>postMessage</code> 抛出 <code>DataCloneError</code>；频道 <code>close()</code> 之后再发会抛出 <code>InvalidStateError</code>；接收方收到无法反序列化的消息，会触发 <code>messageerror</code> 而不是 <code>message</code>。</p>
<p>它的范围比“同源”还窄一点：MDN 说明实际是按存储分区隔离，嵌在别的站点里的同源 iframe 和顶层打开的同源页面互相收不到。</p>
<p>要注意它只是广播。消息只发给当时开着的页面，不存历史；也没有互斥能力，“只让一个标签页去做”要用 Web Locks。</p>
</blockquote>
<h2>频道怎样建立和关闭</h2>
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
<p>为什么 <code>logout</code> 里要自己跳转，不等消息？因为发送方自己收不到自己发的消息。MDN 还提到，你不需要保存其他页面或 Worker 的引用，它们只要用同一个名字创建自己的对象就算订阅了。</p>
<p>API 本身不规定消息格式，所以要自己约定字段，比如上面的 <code>type</code>。页面卸载或组件销毁时调用 <code>channel.close()</code>，它会断开和底层频道的连接，对象才能被垃圾回收。</p>
<h2>哪些消息发不出去</h2>
<p>结构化克隆能处理对象、数组、<code>Map</code>、<code>Date</code> 这些，但处理不了函数。下面在 Node 里试两种出错的情况：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> channel = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;auth&#x27;</span>);

<span class="hljs-keyword">try</span> {
  channel.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-title function_">onLogout</span>(<span class="hljs-params"></span>) {} });
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// DataCloneError</span>
}

channel.<span class="hljs-title function_">close</span>();
<span class="hljs-keyword">try</span> {
  channel.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;logout&#x27;</span> });
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// InvalidStateError</span>
}
</code></pre></div>
<p>第一次失败是因为消息里有一个方法，函数不能克隆，所以抛出 <code>DataCloneError</code>，消息一个字也没发出去。第二次是频道已经关了，按 MDN 的说明会抛出 <code>InvalidStateError</code>。所以消息只放纯数据，关闭后的对象不要再用。</p>
<p>还有一种错误发生在接收方。比如发送 <code>SharedArrayBuffer</code>，而收发双方不在同一个 agent cluster 里，不能共享内存，接收方就会收到 <code>messageerror</code> 事件。需要的话单独监听它，否则这种消息会被悄悄丢掉。</p>
<h2>后打开的页面怎么办</h2>
<p>广播是“发出去就完了”，消息不会存下来。用户退出登录之后再新开一个标签页，这个页面什么都收不到。所以新页面要自己去读当前状态，比如从 localStorage 或服务端获取，不能指望广播。</p>
<p>另一个坑是请求风暴。比如广播“数据更新了”，十个标签页同时收到，同时去请求接口。更好的做法是只让一个标签页去刷新，再把结果广播出去。</p>
<p>BroadcastChannel 和 <code>storage</code> 事件、SharedWorker、Service Worker、窗口 <code>postMessage</code> 怎样选，见<a href="/questions/browser-tab-communication/">《浏览器多个标签页之间怎样通信？》</a>。</p>
<h2>常见追问</h2>
<p><strong>BroadcastChannel 能保证每个页面都收到消息吗？</strong></p>
<blockquote>
<p>不能。它只发给当时开着的页面，不存历史消息。后打开的页面要自己从 localStorage 或服务端读取当前状态。</p>
</blockquote>
<p><strong>多个标签页抢着做同一件事，能用 BroadcastChannel 协调吗？</strong></p>
<blockquote>
<p>不适合。它没有互斥能力，大家都能同时收到消息。要保证只有一个标签页去做，比如刷新令牌，用 Web Locks。</p>
</blockquote>
<p><strong>两个子域能用 BroadcastChannel 通信吗？</strong></p>
<blockquote>
<p>不能。频道名只在同源（准确地说是同一存储分区）的页面之间共享，<code>a.example.com</code> 和 <code>b.example.com</code> 不同源。要跨源，只能用窗口引用加 <code>postMessage</code>，或经服务端转发。</p>
</blockquote>`};export{e as default};