var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个流只能被读一次。如果同一份响应既要交给页面、又要写进缓存，就用 <code>stream.tee()</code>，它返回两个新的 <code>ReadableStream</code>，两边读到的是同样的数据。原来的流会被锁住，之后只能读这两个分支。</p>
<p>代价在内存。源流的拉取速度由读得快的那一边决定，慢的那一边没读的数据会在它的队列里排队，不会让源流放慢，这叫没有背压。一边一直不读，整个响应最后都会堆在内存里。</p>
<p>取消也要注意。只取消一个分支，源流不会停；两个分支都取消了，源流才收到取消。</p>
<p>所以 tee 适合“两边都会读完”的场景，比如 Service Worker 边返回边缓存。一边可能长期不读，就不要用 tee；只是想顺便统计字节数，用 <code>TransformStream</code> 在一条管道里处理更好。</p>
</blockquote>
<h2>典型用法：Service Worker 边返回边缓存</h2>
<p>下面把响应体分成两份，一份给页面，一份写进缓存。</p>
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
<p>为什么不直接把 <code>response</code> 同时交给页面和缓存？因为响应体是一个流，读过一次就没了。所以要先分成两份。实际中更常见的写法是 <code>response.clone()</code>，它内部也是用 tee 实现的，代价一样。</p>
<h2>两边读得不一样快会怎样</h2>
<p>先看一个会出问题的写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> [fast, slow] = hugeStream.<span class="hljs-title function_">tee</span>();
<span class="hljs-keyword">await</span> <span class="hljs-title function_">consume</span>(fast);
</code></pre></div>
<p><code>fast</code> 被读完了，<code>slow</code> 一直没人读。可是 <code>fast</code> 读过的每一块，都要给 <code>slow</code> 留一份，因为 <code>slow</code> 以后可能会读。所以这些数据全堆在 <code>slow</code> 的队列里，最后整个响应都留在了内存中。</p>
<p>为什么源流不等一等慢的那边？因为 tee 的设计是按快的一边拉数据，慢的一边只是缓存，不会反过来让源流暂停。</p>
<p>改法有三种。第一，两个分支同时消费：<code>await Promise.all([consume(a), consume(b)])</code>。第二，某个分支不再需要时立刻 <code>cancel()</code>，它的队列会被丢掉。第三，如果只是想计算摘要或进度，就别分叉，用 <code>TransformStream</code> 在一条管道里顺带处理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> bytes = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> counter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TransformStream</span>({
  <span class="hljs-title function_">transform</span>(<span class="hljs-params">chunk, controller</span>) {
    bytes += chunk.<span class="hljs-property">byteLength</span>;
    controller.<span class="hljs-title function_">enqueue</span>(chunk);
  },
});
<span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>.<span class="hljs-title function_">pipeThrough</span>(counter).<span class="hljs-title function_">pipeTo</span>(destination);
</code></pre></div>
<p>数据流过 <code>counter</code> 时顺便累加字节数，原样往下传，全程只有一份数据。</p>
<h2>只取消一个分支，源流会停吗</h2>
<p>不会。下面这个例子在 Node 里能直接运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> source = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ReadableStream</span>({
  <span class="hljs-title function_">pull</span>(<span class="hljs-params">controller</span>) {
    controller.<span class="hljs-title function_">enqueue</span>(<span class="hljs-number">1</span>);
  },
  <span class="hljs-title function_">cancel</span>(<span class="hljs-params">reason</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;源流被取消&#x27;</span>, reason);
  },
});
<span class="hljs-keyword">const</span> [a, b] = source.<span class="hljs-title function_">tee</span>();

a.<span class="hljs-title function_">cancel</span>(<span class="hljs-string">&#x27;a&#x27;</span>);
<span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">10</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;只取消了 a&#x27;</span>);
<span class="hljs-keyword">await</span> b.<span class="hljs-title function_">cancel</span>(<span class="hljs-string">&#x27;b&#x27;</span>);
<span class="hljs-comment">// 只取消了 a</span>
<span class="hljs-comment">// 源流被取消 [ &#x27;a&#x27;, &#x27;b&#x27; ]</span>
</code></pre></div>
<p>取消 <code>a</code> 以后，源流的 <code>cancel</code> 没有被调用，因为 <code>b</code> 还可能要读。等 <code>b</code> 也取消了，源流才收到取消，取消原因是两个分支各自的原因合成的数组。</p>
<h2>出错时会怎样</h2>
<p>源流出错时，两个分支都会出错。但一个分支的消费方自己出错，不会影响另一个分支。这时候要记得把出错那边的分支取消掉，否则另一边继续读，这边的队列会一直增长。</p>
<h2>常见追问</h2>
<p><strong><code>response.clone()</code> 和 tee 有什么关系？</strong></p>
<blockquote>
<p><code>clone()</code> 内部就是对响应体做 tee。所以克隆以后两份都要读完，或者把不用的那份取消，否则一样会把数据堆在内存里。</p>
</blockquote>
<p><strong>只想显示下载进度，需要 tee 吗？</strong></p>
<blockquote>
<p>不需要。用一个 <code>TransformStream</code> 接在管道中间，每块经过时累加 <code>byteLength</code> 再原样传下去，不用分叉，也没有额外的内存占用。</p>
</blockquote>`};export{e as default};