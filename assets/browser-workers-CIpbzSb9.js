var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户上传一个 50MB 的 JSON 文件，直接在主线程 <code>JSON.parse</code>，解析的那几秒页面完全点不动。Web Worker 能把这种计算挪到后台线程去做，主线程照样响应输入、渲染页面。</p>
<p>Worker 不能操作 DOM，算完的结果要交回主线程，由主线程更新界面。两边用 <code>postMessage</code> 通信，数据默认被复制一份过去，这叫结构化克隆；<code>ArrayBuffer</code> 这类数据还可以直接转移所有权，省掉复制。</p>
<p>它适合 JSON 解析、图片处理、压缩加密、搜索索引这类耗 CPU 的任务。</p>
<p>要注意，网络请求本身就是异步的，不占主线程，放进 Worker 通常没有收益。另外传数据也有成本，对象很大时，光是复制就可能花几十毫秒。</p>
</blockquote>
<h2>先看一个解析文件的例子</h2>
<p>主线程把文件内容交给 Worker，等结果回来再渲染：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./parse.worker.js&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span> });

worker.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-title function_">render</span>(event.<span class="hljs-property">data</span>);
worker.<span class="hljs-property">onerror</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(event.<span class="hljs-property">message</span>);

<span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">await</span> file.<span class="hljs-title function_">arrayBuffer</span>();
worker.<span class="hljs-title function_">postMessage</span>(buffer, [buffer]);
</code></pre></div>
<p>Worker 里解码、解析，再把结果发回去：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// parse.worker.js</span>
<span class="hljs-variable language_">self</span>.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> text = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>().<span class="hljs-title function_">decode</span>(event.<span class="hljs-property">data</span>);
  <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">postMessage</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(text));
};
</code></pre></div>
<p>注意 <code>postMessage(buffer, [buffer])</code> 的第二个参数。它表示把 <code>buffer</code> 的所有权转移给 Worker，而不是复制一份。转移之后，主线程里的 <code>buffer</code> 就被清空了，不能再用。</p>
<p>可以用 <code>structuredClone</code> 在 Node 里看到同样的效果，它和 <code>postMessage</code> 用的是同一套规则：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">8</span>);
<span class="hljs-keyword">const</span> copy = <span class="hljs-title function_">structuredClone</span>(buffer, { <span class="hljs-attr">transfer</span>: [buffer] });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buffer.<span class="hljs-property">byteLength</span>, copy.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 0 8</span>
</code></pre></div>
<p>原来的 <code>buffer</code> 长度变成 0，数据全部到了新的那一边。</p>
<h2>传数据为什么也会卡</h2>
<p>结构化克隆要把数据整个遍历一遍再复制。传一个很大的对象，光复制就可能花几十毫秒，而且这部分时间花在发送方的线程上。如果是主线程在发，主线程还是会卡一下。</p>
<p>结果传回来也要再克隆一次。所以数据量大时，尽量传 <code>ArrayBuffer</code> 并转移所有权，或者只把主线程真正需要的部分传回来。</p>
<p>还有些东西根本传不过去：函数、DOM 节点、类实例上的方法都没法克隆。</p>
<h2>Worker 有哪几种</h2>
<p>Dedicated Worker 只属于创建它的页面，最常用，上面的例子就是。SharedWorker 被同源的多个页面共享一个实例。Service Worker 用来拦截网络请求，做离线缓存和推送，它的生命周期由浏览器管理。</p>
<h2>常见追问</h2>
<p><strong>Worker 里能用哪些 API？</strong></p>
<blockquote>
<p>能用 <code>fetch</code>、<code>IndexedDB</code>、<code>WebSocket</code>、<code>OffscreenCanvas</code>、定时器等。<code>document</code>、<code>window</code> 和 <code>localStorage</code> 都用不了。</p>
</blockquote>
<p><strong>怎样取消 Worker 里正在跑的任务？</strong></p>
<blockquote>
<p>调用 <code>worker.terminate()</code> 会立刻终止整个线程。如果只想取消其中一个任务，就在消息里带上任务 ID，Worker 在循环里检查有没有收到取消标记。任务多时，可以按 <code>navigator.hardwareConcurrency</code> 创建固定数量的 Worker 组成池来调度。</p>
</blockquote>`};export{e as default};