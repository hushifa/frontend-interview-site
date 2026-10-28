var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.locks.request(name, callback)</code> 获取同源范围内的命名锁，<code>callback</code> 返回的 Promise 结束时锁自动释放。</li>
<li>默认是独占锁（<code>exclusive</code>），<code>mode: &#x27;shared&#x27;</code> 允许多个读者同时持有。</li>
<li><code>ifAvailable: true</code> 拿不到锁时立即以 <code>null</code> 调用回调，不排队等待；<code>signal</code> 可以取消排队。</li>
<li><code>steal: true</code> 强行释放其他持有者的锁并立即获得，原持有者的 <code>request()</code> Promise 以 <code>AbortError</code> reject。</li>
<li>持有锁的标签页关闭或崩溃时，锁会被自动释放。</li>
</ul>
<h2>示例：只让一个标签页刷新令牌</h2>
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
<p>多个标签页同时发现令牌过期时，它们排队进入。第一个刷新成功后，后面的进入时检查发现令牌已有效，直接返回，不再重复请求。<code>request()</code> 的返回值就是回调的返回值。</p>
<h2>选一个标签页当主节点</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;leader&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">startBackgroundSync</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">() =&gt;</span> {});
});
</code></pre></div>
<p>回调返回一个永不结束的 Promise，锁会一直持有到这个标签页关闭，之后排队的下一个标签页自动接管。</p>
<h2>超时等待</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>(), <span class="hljs-number">3000</span>);

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(<span class="hljs-string">&#x27;export&#x27;</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> }, doExport);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-title function_">showBusy</span>();
  <span class="hljs-keyword">else</span> <span class="hljs-keyword">throw</span> error;
}
</code></pre></div>
<h2>注意事项</h2>
<ul>
<li>锁只在同源内有效，不能协调不同源或不同设备。</li>
<li><code>navigator.locks.query()</code> 可以查看当前持有和排队的锁，用于调试。</li>
<li>回调内出错时锁同样会释放，错误会从 <code>request()</code> 抛出。</li>
<li>同一个锁里嵌套请求同名的独占锁会造成死锁。</li>
</ul>`};export{e as default};