var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>stream.tee()</code> 返回两个新的 <code>ReadableStream</code>，原流被锁定，之后只能读这两个分支。</li>
<li>拉取速度由读得快的分支决定，慢的分支没读的数据在内存中排队，不会对源流产生背压。</li>
<li>只取消一个分支不会停止源流，两个分支都取消后，源流才收到取消。</li>
<li>适合&quot;同一份响应既写入缓存又交给页面&quot;这类两边都会读完的场景；一边可能长期不读时不要用 tee。</li>
</ul>
<h2>典型用法：Service Worker 边返回边缓存</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">respondWith</span>(
    (<span class="hljs-title function_">async</span> () =&gt; {
      <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(event.<span class="hljs-property">request</span>);
      <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span> || !response.<span class="hljs-property">body</span>) <span class="hljs-keyword">return</span> response;

      <span class="hljs-keyword">const</span> [forPage, forCache] = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">tee</span>();
      <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">open</span>(<span class="hljs-string">&#x27;v1&#x27;</span>);
      event.<span class="hljs-title function_">waitUntil</span>(cache.<span class="hljs-title function_">put</span>(event.<span class="hljs-property">request</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(forCache, response)));
      <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(forPage, response);
    })(),
  );
});
</code></pre></div>
<p>这里更常见的写法是 <code>response.clone()</code>，它内部也是 tee，代价相同。</p>
<h2>内存问题</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> [fast, slow] = hugeStream.<span class="hljs-title function_">tee</span>();
<span class="hljs-keyword">await</span> <span class="hljs-title function_">consume</span>(fast);
</code></pre></div>
<p><code>slow</code> 一直不读，<code>fast</code> 读过的每一块都留在 <code>slow</code> 的队列里，最终整个响应都留在内存中。</p>
<p>规避方式：</p>
<ul>
<li>两个分支并发消费：<code>await Promise.all([consume(a), consume(b)])</code>。</li>
<li>某个分支不再需要时立即 <code>cancel()</code>，队列会被丢弃。</li>
<li>只需要计算摘要或进度时，用 <code>TransformStream</code> 在一条管道里顺带处理，不分叉：</li>
</ul>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> bytes = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TransformStream</span>({
  <span class="hljs-title function_">transform</span>(<span class="hljs-params">chunk, controller</span>) {
    bytes += chunk.<span class="hljs-property">byteLength</span>;
    controller.<span class="hljs-title function_">enqueue</span>(chunk);
  },
});
<span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>.<span class="hljs-title function_">pipeThrough</span>(counter).<span class="hljs-title function_">pipeTo</span>(destination);
</code></pre></div>
<h2>错误传播</h2>
<p>源流出错时，两个分支都会出错。一个分支的消费方出错不会影响另一个分支，但要记得取消它，否则缓存会持续增长。</p>`};export{e as default};