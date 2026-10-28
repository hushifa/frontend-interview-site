var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Worker 在后台线程执行脚本，长时间的计算不会阻塞主线程的输入响应和渲染。</li>
<li>Worker 不能操作 DOM，界面更新仍由主线程完成。</li>
<li>主线程和 Worker 用 <code>postMessage</code> 通信，数据默认被结构化克隆；<code>ArrayBuffer</code> 等可以转移所有权，避免复制。</li>
<li>适合 JSON 解析、图片处理、压缩加密、搜索索引等 CPU 密集任务；网络请求本身是异步的，放进 Worker 通常没有收益。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.js</span>
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./parse.worker.js&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span> });

worker.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-title function_">render</span>(event.<span class="hljs-property">data</span>);
worker.<span class="hljs-property">onerror</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(event.<span class="hljs-property">message</span>);

<span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">await</span> file.<span class="hljs-title function_">arrayBuffer</span>();
worker.<span class="hljs-title function_">postMessage</span>(buffer, [buffer]);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// parse.worker.js</span>
<span class="hljs-variable language_">self</span>.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> text = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>().<span class="hljs-title function_">decode</span>(event.<span class="hljs-property">data</span>);
  <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">postMessage</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(text));
};
</code></pre></div>
<p><code>postMessage(buffer, [buffer])</code> 转移之后，主线程里的 <code>buffer.byteLength</code> 变为 0，不能再使用。</p>
<h2>通信成本</h2>
<ul>
<li>结构化克隆要遍历并复制数据，传一个很大的对象本身也可能耗时几十毫秒，这部分成本在发送方线程上。</li>
<li>函数、DOM 节点、带原型的类实例方法无法克隆。</li>
<li>返回结果也要克隆一次。数据量大时，传 <code>ArrayBuffer</code> 并转移所有权，或只返回主线程需要的部分。</li>
</ul>
<h2>Worker 的种类</h2>
<ul>
<li>Dedicated Worker：只属于创建它的页面，最常用。</li>
<li>SharedWorker：同源的多个页面共享一个实例。</li>
<li>Service Worker：拦截网络请求，用于离线缓存和推送，生命周期由浏览器管理。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Worker 能用哪些 API：<code>fetch</code>、<code>IndexedDB</code>、<code>WebSocket</code>、<code>OffscreenCanvas</code>、定时器等，不能用 <code>document</code>、<code>window</code> 和 <code>localStorage</code>。</li>
<li>怎样取消任务：调用 <code>worker.terminate()</code> 立即终止线程；只想取消单个任务时，在消息里带任务 ID，Worker 在循环中检查取消标记。</li>
<li>多个任务怎么调度：创建固定数量的 Worker 组成池，数量参考 <code>navigator.hardwareConcurrency</code>。</li>
</ul>`};export{e as default};