var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>ArrayBuffer</code> 只是一块字节存储，它自己没有读写方法，要通过 TypedArray 或 <code>DataView</code> 这样的“视图”去读写。</p>
<p>TypedArray 有很多种，比如 <code>Uint8Array</code>、<code>Float32Array</code>，每种都按固定的数字类型解读字节。写进去的值会被转换成这个类型，比如往 <code>Uint8Array</code> 写 256 会变成 0，往 <code>Uint8ClampedArray</code> 写 256 会变成 255。它的长度固定，没有 <code>push</code>，<code>Array.isArray</code> 判断它也是 <code>false</code>。</p>
<p>多个视图可以指向同一块缓冲区。所以要分清 <code>subarray</code> 和 <code>slice</code>：前者返回共享同一块缓冲区的新视图，改它会影响原数据；后者复制出一份独立的数据。</p>
<p>普通的 <code>ArrayBuffer</code> 创建后长度固定。ES2024 起，可以用 <code>new ArrayBuffer(len, { maxByteLength })</code> 创建能调整大小的缓冲区。</p>
</blockquote>
<h2>subarray 和 slice 有什么不同</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]);
<span class="hljs-keyword">const</span> shared = bytes.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> copied = bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>);
shared[<span class="hljs-number">0</span>] = <span class="hljs-number">9</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes[<span class="hljs-number">1</span>]); <span class="hljs-comment">// 9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copied[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(bytes)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>改的是 <code>shared[0]</code>，可 <code>bytes[1]</code> 也变成了 9。</p>
<p>因为 <code>subarray</code> 没有复制数据，它只是在同一块缓冲区上开了一个新窗口，从第 1 个字节开始看。<code>shared[0]</code> 和 <code>bytes[1]</code> 其实是同一个字节。<code>slice</code> 则把数据复制了一份，<code>copied</code> 和原数据互不影响，所以还是 2。</p>
<p>这和普通数组的 <code>slice</code> 一样都是复制，名字相似的 <code>subarray</code> 却是共享，处理大块二进制数据时要特别留意。</p>
<h2>写进去的值为什么变了</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> u8 = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">1</span>);
u8[<span class="hljs-number">0</span>] = <span class="hljs-number">256</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(u8[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 0，按 2^8 取模</span>

<span class="hljs-keyword">const</span> clamped = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8ClampedArray</span>(<span class="hljs-number">1</span>);
clamped[<span class="hljs-number">0</span>] = <span class="hljs-number">256</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(clamped[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 255，钳制到范围内</span>

<span class="hljs-keyword">const</span> i8 = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Int8Array</span>([<span class="hljs-number">200</span>]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(i8[<span class="hljs-number">0</span>]); <span class="hljs-comment">// -56</span>
</code></pre></div>
<p><code>Uint8Array</code> 每个元素只有 8 位，范围是 0 到 255。写入 256 超出了范围，它不报错，而是按 256 取余数，得到 0。</p>
<p><code>Uint8ClampedArray</code> 处理方式不同，超出范围的值会被压到边界上，256 变成 255。Canvas 的 <code>ImageData</code> 用的就是它，颜色值超过 255 就当 255，比绕回 0 合理得多。</p>
<p><code>Int8Array</code> 是有符号的，范围是 -128 到 127。200 的二进制按有符号数解读，就成了 -56。</p>
<h2>和普通数组比较</h2>
<table><thead><tr><th></th><th>普通数组</th><th>TypedArray</th></tr></thead><tbody><tr><td>元素</td><td>任意值</td><td>固定数值类型</td></tr><tr><td>长度</td><td>可变</td><td>固定</td></tr><tr><td><code>push</code> / <code>pop</code></td><td>有</td><td>没有</td></tr><tr><td>越界写入</td><td>扩展数组</td><td>被忽略</td></tr><tr><td>用途</td><td>通用</td><td>文件、网络、WebGL、音视频、WASM</td></tr></tbody></table>
<p>普通数组什么都能放，越界写入时会自动变长。TypedArray 越界写入会被直接忽略。它适合处理文件、网络数据、WebGL、音视频和 WebAssembly 这类本来就是字节的数据。</p>
<h2>视图怎样从缓冲区中间开始</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">8</span>);
<span class="hljs-keyword">const</span> all = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer);
<span class="hljs-keyword">const</span> tail = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint16Array</span>(buffer, <span class="hljs-number">4</span>, <span class="hljs-number">2</span>); <span class="hljs-comment">// 从第 4 字节开始，2 个元素</span>
tail[<span class="hljs-number">0</span>] = <span class="hljs-number">0xffff</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(all[<span class="hljs-number">4</span>], all[<span class="hljs-number">5</span>]); <span class="hljs-comment">// 255 255</span>
</code></pre></div>
<p><code>tail</code> 从第 4 个字节开始，取 2 个 16 位元素。往 <code>tail[0]</code> 写 <code>0xffff</code>，用按字节看的 <code>all</code> 去读，第 4、5 两个字节都变成了 255，说明它们确实指向同一块内存。</p>
<p>起始位置有要求：<code>byteOffset</code> 必须是元素大小的整数倍，<code>Uint16Array</code> 的元素占 2 字节，就只能从偶数位置开始，否则抛 <code>RangeError</code>。另外多字节的类型按平台字节序读写，几乎都是小端，需要指定字节序时要用 <code>DataView</code>。</p>
<h2>缓冲区能变大，也能转移</h2>
<p><code>new ArrayBuffer(8, { maxByteLength: 64 })</code> 创建的缓冲区，之后可以调用 <code>resize()</code> 改变长度。创建 TypedArray 时不传长度，它的长度就会跟着缓冲区一起变。</p>
<p><code>buffer.transfer()</code>（ES2024）会把内容移到一个新的缓冲区，原来的缓冲区就变成已分离状态，长度为 0，不能再用。给 Worker 发数据时，<code>postMessage(data, [buffer])</code> 也是把缓冲区转移过去，省掉了复制大块数据的开销。</p>
<h2>常见追问</h2>
<p><strong>怎样把 TypedArray 转成普通数组？</strong></p>
<blockquote>
<p>用 <code>Array.from(view)</code> 或者 <code>[...view]</code>。</p>
</blockquote>
<p><strong><code>SharedArrayBuffer</code> 有什么使用前提？</strong></p>
<blockquote>
<p>页面需要开启跨源隔离，也就是同时设置 COOP 和 COEP 响应头。多个线程同时读写它时，要配合 <code>Atomics</code> 做同步。</p>
</blockquote>`};export{e as default};