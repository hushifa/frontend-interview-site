var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>读文件、收网络数据时拿到的是一串字节，Node.js 用 <code>Buffer</code> 表示这串字节。<code>Buffer.from(&#x27;你好&#x27;)</code> 得到 6 个字节，因为默认按 UTF-8 编码，每个汉字占 3 个字节。</p>
<p><code>Buffer</code> 是 <code>Uint8Array</code> 的子类，所以下标读写、<code>length</code>、<code>subarray</code> 这些 TypedArray 的东西它都有，另外加了字符串和 hex、base64 之间的编码转换，以及按字节序读写整数这些方法。Node.js 文档说，接受 <code>Buffer</code> 的 API 也接受普通的 <code>Uint8Array</code>。</p>
<p>创建方式要分清。<code>Buffer.alloc(n)</code> 分配并清零；<code>Buffer.allocUnsafe(n)</code> 不清零，更快，但里面可能是旧数据，甚至是敏感数据，必须马上全部写满；<code>Buffer.from()</code> 从字符串、数组复制出新内存，传 <code>ArrayBuffer</code> 时则共享那块内存，不复制。</p>
<p>最容易踩的坑是 <code>slice</code>。<code>Uint8Array</code> 的 <code>slice</code> 会复制，<code>Buffer</code> 的 <code>slice</code> 却不复制，改了切片会改到原数据。这个方法已经被废弃，统一用 <code>subarray</code> 表示“不复制的视图”，需要复制时再显式复制。</p>
</blockquote>
<h2>Buffer 和 Uint8Array 是什么关系</h2>
<p>从 Node.js 3.0 开始，<code>Buffer</code> 类继承自 <code>Uint8Array</code>。所以 <code>buf instanceof Uint8Array</code> 是 <code>true</code>，TypedArray 的方法和属性在 <code>Buffer</code> 上都能用。<code>ArrayBuffer</code>、视图、<code>subarray</code> 这些基础概念见<a href="/questions/js-typed-arrays/">《ArrayBuffer、TypedArray 和普通数组有什么区别？》</a>。</p>
<p><code>Buffer</code> 多出来的主要是编码相关的能力。下面这段要在 Node.js 里运行，用 Node.js 22.23.3 验证：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buf = <span class="hljs-title class_">Buffer</span>.<span class="hljs-title function_">from</span>(<span class="hljs-string">&#x27;你好&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buf.<span class="hljs-property">length</span>); <span class="hljs-comment">// 6</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buf.<span class="hljs-title function_">toString</span>(<span class="hljs-string">&#x27;hex&#x27;</span>)); <span class="hljs-comment">// e4bda0e5a5bd</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buf.<span class="hljs-title function_">toString</span>(<span class="hljs-string">&#x27;base64&#x27;</span>)); <span class="hljs-comment">// 5L2g5aW9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buf <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Uint8Array</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buf.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">0</span>, <span class="hljs-number">3</span>).<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// 你</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buf.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>).<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// �</span>
</code></pre></div>
<p><code>length</code> 是字节数，不是字符数，所以是 6。<code>toString</code> 默认按 UTF-8 解码，前 3 个字节正好是“你”。只截前 2 个字节时，这不是一段完整的 UTF-8，文档说无效的字节会被换成替换字符 <code>U+FFFD</code>，也就是最后一行的 <code>�</code>。所以按字节切分流数据再解码时，要处理一个字符被切在两块之间的情况。</p>
<p>Node.js 文档也说，<code>Buffer</code> 虽然在全局作用域里能直接用，仍然建议显式写 <code>const { Buffer } = require(&#x27;node:buffer&#x27;)</code> 或对应的 <code>import</code>。</p>
<h2>alloc 和 allocUnsafe 差在哪里</h2>
<p><code>Buffer.alloc(size)</code> 返回一块已经填好 0 的内存。<code>Buffer.allocUnsafe(size)</code> 不做初始化，文档的原话是内容未知，<strong>可能包含敏感数据</strong>，要用 <code>buf.fill(0)</code> 初始化，或者确保马上把它全部覆盖。</p>
<p><code>allocUnsafe</code> 快的原因有两个。一是省掉了清零。二是小块内存走内部的预分配池：Node.js 预先分配一块大小为 <code>Buffer.poolSize</code> 的 <code>Buffer</code>，<code>allocUnsafe</code>、<code>Buffer.from(array)</code>、<code>Buffer.from(string)</code>、<code>Buffer.concat()</code> 申请的大小小于 <code>Buffer.poolSize &gt;&gt;&gt; 1</code> 时，从这块池子里切一段出来，减少垃圾回收的开销。<code>Buffer.poolSize</code> 的默认值在 Node.js 26.3 从 8192 提高到了 65536。</p>
<p><code>Buffer.alloc(size, fill)</code> 永远不走这个池，<code>Buffer.allocUnsafe(size).fill(fill)</code> 在大小不超过池的一半时会走。所以两者结果一样，内存来源不同。</p>
<p>池化带来一个现象：小 <code>Buffer</code> 的 <code>.buffer</code> 不是只属于它的内存。在 Node.js 22.23.3 里，<code>Buffer.from(&#x27;hi&#x27;).buffer.byteLength</code> 是 8192，<code>byteOffset</code> 是 8，说明它只是池里的一段。把 <code>buf.buffer</code> 整个交给别的 API 时，必须带上 <code>byteOffset</code> 和 <code>length</code>，不然会读到池里别人的数据。文档也提醒，需要长期保留一小块池内存时，可以用 <code>Buffer.allocUnsafeSlow()</code> 分配不走池的内存再复制过去，避免整块池因为这一小段一直不能回收。</p>
<h2>Buffer.from 什么时候复制，什么时候共享</h2>
<p><code>Buffer.from(string)</code> 按编码把字符串转成字节，默认 UTF-8。<code>Buffer.from(array)</code> 把一个整数数组复制成字节。这两种都会得到新内存。</p>
<p><code>Buffer.from(arrayBuffer, byteOffset, length)</code> 不一样。文档说它创建的是 <code>ArrayBuffer</code> 的一个视图，不复制底层内存，行为和 <code>new Uint8Array(arrayBuffer)</code> 一样。所以拿 TypedArray 的 <code>.buffer</code> 去创建 <code>Buffer</code>，两边改的是同一块内存。</p>
<p>反过来，把一个 <code>Buffer</code> 传给 TypedArray 构造函数，比如 <code>new Uint32Array(buf)</code>，会把每个字节当成一个整数复制过去，而不是把字节重新解释成 32 位整数。要按其他类型解读同一块内存，应该传 <code>buf.buffer</code>、<code>buf.byteOffset</code> 和长度。</p>
<h2>slice 为什么不能和 Uint8Array 混着理解</h2>
<p>先看 <code>Uint8Array</code> 自己的行为。<code>subarray</code> 返回共享内存的视图，<code>slice</code> 返回一份复制：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">104</span>, <span class="hljs-number">105</span>, <span class="hljs-number">33</span>]);
<span class="hljs-keyword">const</span> view = bytes.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> copy = bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>);
bytes[<span class="hljs-number">0</span>] = <span class="hljs-number">72</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 72</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 104</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-property">buffer</span> === bytes.<span class="hljs-property">buffer</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">buffer</span> === bytes.<span class="hljs-property">buffer</span>); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>改了原数组的第 0 个字节，<code>view</code> 跟着变成 72，<code>copy</code> 还是 104。</p>
<p>可是 <code>Buffer.prototype.slice()</code> 和 <code>subarray</code> 一样，返回的是不复制的视图。文档说这种行为只是为了兼容旧代码而保留的，容易让人意外，从 Node.js 17.5、16.15 起已经废弃，推荐在 <code>Buffer</code> 和其他 TypedArray 上都用 <code>subarray</code>。所以在 Node.js 代码里看到 <code>buf.slice()</code>，要意识到它改的是原数据；需要独立副本时，用 <code>Buffer.from(buf.subarray(a, b))</code> 或 <code>Uint8Array.prototype.slice.call(buf, a, b)</code> 显式复制。</p>
<p>除了 <code>slice</code>，文档还列了两处不兼容：<code>buf.toString()</code> 和 TypedArray 的 <code>toString</code> 不一样，前者按编码解码，后者输出逗号分隔的数字；<code>buf.indexOf()</code> 等方法多支持了一些参数，比如可以直接搜索字符串。</p>
<h2>常见追问</h2>
<p><strong>为什么不再用 new Buffer()？</strong></p>
<blockquote>
<p><code>new Buffer()</code> 的行为取决于第一个参数的类型。文档举的例子是，本该收到字符串 <code>&quot;100&quot;</code> 的接口被传进数字 <code>100</code>，就会变成分配 100 个字节。Node.js 8.0 之前这块内存不清零，可能泄露内存里的旧数据；8.0 之后虽然清零了，攻击者仍能让服务器分配超大内存。所以各种形式的 <code>new Buffer()</code> 都被废弃了，换成意图明确的 <code>Buffer.from()</code>、<code>Buffer.alloc()</code> 和 <code>Buffer.allocUnsafe()</code>。</p>
</blockquote>
<p><strong>写跨 Node.js 和浏览器的库，该用 Buffer 还是 Uint8Array？</strong></p>
<blockquote>
<p>公共接口用 <code>Uint8Array</code> 更通用，因为浏览器没有 <code>Buffer</code>，而 Node.js 的 API 本来就接受 <code>Uint8Array</code>，<code>Buffer</code> 传进来也是合法的 <code>Uint8Array</code>。字符串和字节的转换可以用 <code>TextEncoder</code>、<code>TextDecoder</code>，Base64 的写法见<a href="/questions/js-base64-uint8array/">《Uint8Array.fromBase64/toBase64 和 btoa/atob 有什么区别？中文怎样转 Base64？》</a>。</p>
</blockquote>
<p><strong>读大文件时应该一次读成一个 Buffer 吗？</strong></p>
<blockquote>
<p>不应该。一次读进来，整个文件都要放在内存里。大文件应该用流按块处理，每块是一个 <code>Buffer</code>，见<a href="/questions/node-stream/">《流和背压为什么能避免一次性读入大文件？》</a>。</p>
</blockquote>`};export{e as default};