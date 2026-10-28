var e={answerHtml:`<h2>简答</h2>
<ul>
<li>同源的上下文用相同名称创建 <code>BroadcastChannel</code>，一方 <code>postMessage</code>，其他所有方收到 <code>message</code> 事件，发送方自己收不到。</li>
<li>消息用结构化克隆传递，可以发送对象。</li>
<li>适合广播&quot;已退出登录&quot;&quot;主题已切换&quot;&quot;某条数据已更新&quot;这类通知。</li>
<li>消息只发给当前打开的上下文，后打开的页面收不到之前的消息；需要互斥时用 Web Locks。</li>
</ul>
<h2>示例：同步退出登录</h2>
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
<p>页面卸载或组件销毁时调用 <code>channel.close()</code>。</p>
<h2>和其他方案对比</h2>
<table><thead><tr><th>方案</th><th>特点</th></tr></thead><tbody><tr><td>BroadcastChannel</td><td>一对多广播，API 最简单</td></tr><tr><td><code>storage</code> 事件</td><td>只能借 localStorage 写入触发，数据要序列化成字符串</td></tr><tr><td>SharedWorker</td><td>有一个共享的中心，可以保存状态、做协调</td></tr><tr><td>Service Worker <code>clients</code></td><td>能找到所有受控页面，也能处理推送</td></tr><tr><td><code>postMessage</code></td><td>需要拿到目标窗口引用，可以跨源</td></tr></tbody></table>
<h2>注意事项</h2>
<ul>
<li>只在同源之间工作。不同子域之间需要用 <code>postMessage</code> 或服务端转发。</li>
<li>新打开的页面要自己读取当前状态，例如从 localStorage 或服务端获取，不能依赖广播。</li>
<li>多个标签页同时收到消息后都去刷新数据，可能造成请求风暴，可以只让一个标签页刷新再广播结果。</li>
</ul>`};export{e as default};