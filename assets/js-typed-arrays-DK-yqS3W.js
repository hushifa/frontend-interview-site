var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>ArrayBuffer</code> 只是一块字节存储，要通过 TypedArray 或 <code>DataView</code> 视图读写。</li>
<li>TypedArray 每个元素是固定类型的数值，写入时会被转换：<code>Uint8Array</code> 写 256 得到 0，<code>Uint8ClampedArray</code> 写 256 得到 255。</li>
<li><code>subarray</code> 返回共享同一缓冲区的新视图，<code>slice</code> 复制出独立数据。</li>
<li>多个视图可以指向同一个缓冲区；<code>Array.isArray(typedArray)</code> 为 <code>false</code>。</li>
<li>普通 <code>ArrayBuffer</code> 创建后长度固定；ES2024 起可以用 <code>new ArrayBuffer(len, { maxByteLength })</code> 创建可调整大小的缓冲区。</li>
</ul>
<h2>共享与复制</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]);
<span class="hljs-keyword">const</span> shared = bytes.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> copied = bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>);
shared[<span class="hljs-number">0</span>] = <span class="hljs-number">9</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes[<span class="hljs-number">1</span>]); <span class="hljs-comment">// 9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copied[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(bytes)); <span class="hljs-comment">// false</span>
</code></pre></div>
<h2>元素转换</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> u8 = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">1</span>);
u8[<span class="hljs-number">0</span>] = <span class="hljs-number">256</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(u8[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 0，按 2^8 取模</span>

<span class="hljs-keyword">const</span> clamped = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8ClampedArray</span>(<span class="hljs-number">1</span>);
clamped[<span class="hljs-number">0</span>] = <span class="hljs-number">256</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(clamped[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 255，钳制到范围内</span>

<span class="hljs-keyword">const</span> i8 = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Int8Array</span>([<span class="hljs-number">200</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(i8[<span class="hljs-number">0</span>]); <span class="hljs-comment">// -56</span>
</code></pre></div>
<p><code>Uint8ClampedArray</code> 用于 Canvas 的 <code>ImageData</code>。</p>
<h2>与普通数组对比</h2>
<table><thead><tr><th></th><th>普通数组</th><th>TypedArray</th></tr></thead><tbody><tr><td>元素</td><td>任意值</td><td>固定数值类型</td></tr><tr><td>长度</td><td>可变</td><td>固定</td></tr><tr><td><code>push</code> / <code>pop</code></td><td>有</td><td>没有</td></tr><tr><td>越界写入</td><td>扩展数组</td><td>被忽略</td></tr><tr><td>用途</td><td>通用</td><td>文件、网络、WebGL、音视频、WASM</td></tr></tbody></table>
<h2>视图的偏移</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">8</span>);
<span class="hljs-keyword">const</span> all = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer);
<span class="hljs-keyword">const</span> tail = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint16Array</span>(buffer, <span class="hljs-number">4</span>, <span class="hljs-number">2</span>); <span class="hljs-comment">// 从第 4 字节开始，2 个元素</span>
tail[<span class="hljs-number">0</span>] = <span class="hljs-number">0xffff</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(all[<span class="hljs-number">4</span>], all[<span class="hljs-number">5</span>]); <span class="hljs-comment">// 255 255</span>
</code></pre></div>
<p><code>byteOffset</code> 必须是元素大小的整数倍，否则抛 <code>RangeError</code>。多字节类型按平台字节序读写（几乎都是小端），需要指定字节序时用 <code>DataView</code>。</p>
<h2>可调整大小与转移</h2>
<ul>
<li><code>new ArrayBuffer(8, { maxByteLength: 64 })</code> 后可调用 <code>resize()</code>；不传长度创建的 TypedArray 会随缓冲区长度变化。</li>
<li><code>buffer.transfer()</code>（ES2024）把内容移到新缓冲区，原缓冲区变为已分离，长度为 0。</li>
<li><code>postMessage(data, [buffer])</code> 把缓冲区转移给 Worker，避免复制。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样把 TypedArray 转成普通数组？<code>Array.from(view)</code> 或 <code>[...view]</code>。</li>
<li><code>SharedArrayBuffer</code> 有什么前提？页面需要跨源隔离（COOP + COEP），并配合 <code>Atomics</code> 同步访问。</li>
</ul>`};export{e as default};