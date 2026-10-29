var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户开了三个标签页，令牌同时过期，三个页面同时去刷新，服务端就收到三次重复的刷新请求。Web Locks 就是用来排队的：<code>navigator.locks.request(name, callback)</code> 在同源范围内获取一把有名字的锁，<code>callback</code> 返回的 Promise 结束时，锁自动释放。</p>
<p>默认是独占锁，同一时间只有一个持有者。设 <code>mode: &#x27;shared&#x27;</code> 是共享锁，允许多个读者同时持有。</p>
<p>不想排队也有办法：<code>ifAvailable: true</code> 拿不到锁时立刻用 <code>null</code> 调用回调；<code>signal</code> 可以取消排队；<code>steal: true</code> 会强行抢走别人的锁，原持有者的 <code>request()</code> 以 <code>AbortError</code> reject。</p>
<p>要注意，持有锁的标签页关闭或崩溃时，锁会自动释放，不会死锁在那里。但同一把独占锁里再嵌套请求同名的锁，就会自己把自己锁死。</p>
</blockquote>
<h2>先看只让一个标签页刷新令牌</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">refreshTokenOnce</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;token-refresh&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">const</span> current = <span class="hljs-title function_">readToken</span>();
    <span class="hljs-keyword">if</span> (current &amp;&amp; !<span class="hljs-title function_">isExpired</span>(current)) <span class="hljs-keyword">return</span> current;

    <span class="hljs-keyword">const</span> next = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchNewToken</span>();
    <span class="hljs-title function_">saveToken</span>(next);
    <span class="hljs-keyword">return</span> next;
  });
}
</code></pre></div>
<p>三个标签页同时调用，它们会排队一个一个进入回调。第一个进去时令牌过期了，于是去刷新、保存。后面两个进去时先检查，发现令牌已经是新的，直接返回，不再发请求。</p>
<p>关键在于进入锁之后要重新检查一遍。如果只是排队，不检查，三个页面还是会依次刷新三次。</p>
<p><code>request()</code> 的返回值就是回调的返回值，所以调用方能直接拿到令牌。</p>
<h2>怎样选一个标签页当“主节点”</h2>
<p>有些后台同步只需要一个标签页来做。可以让大家抢一把锁，抢到的那个一直不放：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;leader&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">startBackgroundSync</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">() =&gt;</span> {});
});
</code></pre></div>
<p>回调返回一个永远不结束的 Promise，所以锁会一直被持有，直到这个标签页关闭。它一关，锁自动释放，排在后面的下一个标签页就自动接管。</p>
<h2>不想一直排队怎么办</h2>
<p>导出这类操作，等太久还不如告诉用户“正忙”。用 <code>signal</code> 给排队设个超时：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>(), <span class="hljs-number">3000</span>);

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;export&#x27;</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> }, doExport);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-title function_">showBusy</span>();
  <span class="hljs-keyword">else</span> <span class="hljs-keyword">throw</span> error;
}
</code></pre></div>
<p>3 秒还没拿到锁，排队就被取消，<code>request()</code> 以 <code>AbortError</code> reject，这时提示用户稍后再试。</p>
<h2>用的时候要注意什么</h2>
<p>锁只在同源内有效，协调不了不同源的页面，也协调不了不同设备。</p>
<p>回调里出错时，锁同样会释放，错误会从 <code>request()</code> 抛出来。</p>
<p>调试时可以用 <code>navigator.locks.query()</code> 查看当前谁拿着锁、谁在排队。</p>
<h2>常见追问</h2>
<p><strong>拿着锁的标签页崩溃了，锁会一直卡住吗？</strong></p>
<blockquote>
<p>不会。持有锁的标签页关闭或崩溃时，锁会自动释放，排队的下一个会接着拿到。</p>
</blockquote>
<p><strong>Web Locks 和 BroadcastChannel 有什么区别？</strong></p>
<blockquote>
<p>BroadcastChannel 只负责广播消息，大家都能同时收到，没法保证只有一个去做。Web Locks 负责互斥，保证同一时间只有一个持有者。两者经常配合用：用锁保证一个标签页刷新，再用广播通知其他标签页。</p>
</blockquote>`};export{e as default};