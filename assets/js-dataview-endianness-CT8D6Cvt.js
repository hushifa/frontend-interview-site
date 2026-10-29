var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个大于 1 字节的数字，比如 <code>0x1234</code>，存进内存时要拆成两个字节，先放高位还是先放低位，就叫字节序。先放高位是大端，先放低位是小端。</p>
<p><code>DataView</code> 用 <code>getUint16(offset, littleEndian)</code> 这类方法，在任意字节位置读写数字，不要求位置对齐。第二个参数不传或者传 <code>false</code> 就按大端，传 <code>true</code> 按小端。</p>
<p>为什么要用它？因为 TypedArray 只能按当前平台的字节序读写，主流平台都是小端，而网络协议和很多文件格式用的是大端。解析这类数据，就得用 <code>DataView</code> 明确指定。</p>
<p>要注意，读取超过视图末尾会抛 <code>RangeError</code>，所以解析前先检查 <code>byteLength</code>。另外 ES2025 新增了 <code>Float16Array</code>、<code>getFloat16</code>、<code>setFloat16</code> 和 <code>Math.f16round</code>，MDN 标注为 Baseline 2025。</p>
</blockquote>
<h2>大端和小端读出来有什么不同</h2>
<p>先按大端写入 <code>0x1234</code>，再看看字节怎么排，以及按两种字节序读回来的结果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(buffer);
view.<span class="hljs-title function_">setUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0x1234</span>); <span class="hljs-comment">// 未传 littleEndian，按大端写入</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 18,52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 4660，也就是 0x1234</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">true</span>)); <span class="hljs-comment">// 13330，也就是 0x3412</span>
</code></pre></div>
<p>逐个字节看，是 18 和 52，也就是 <code>0x12</code> 和 <code>0x34</code>。大端把高位字节 <code>0x12</code> 放在前面，低位 <code>0x34</code> 放在后面。</p>
<p>同样两个字节，按大端读回来是 4660，就是原来的 <code>0x1234</code>。按小端读，会把第一个字节当成低位，得到 <code>0x3412</code>，也就是 13330。所以字节序读错了，数字就全错了，而且不会报错。</p>
<h2>怎样解析一个协议头</h2>
<p>假设协议头是这样的：1 字节版本号，1 字节类型，再跟着 4 字节、大端的无符号长度。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseHeader</span>(<span class="hljs-params">buffer</span>) {
  <span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(buffer);
  <span class="hljs-keyword">if</span> (view.<span class="hljs-property">byteLength</span> &lt; <span class="hljs-number">6</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;协议头不完整&#x27;</span>);

  <span class="hljs-keyword">const</span> header = {
    <span class="hljs-attr">version</span>: view.<span class="hljs-title function_">getUint8</span>(<span class="hljs-number">0</span>),
    <span class="hljs-attr">type</span>: view.<span class="hljs-title function_">getUint8</span>(<span class="hljs-number">1</span>),
    <span class="hljs-attr">length</span>: view.<span class="hljs-title function_">getUint32</span>(<span class="hljs-number">2</span>),
  };
  <span class="hljs-keyword">if</span> (view.<span class="hljs-property">byteLength</span> &lt; <span class="hljs-number">6</span> + header.<span class="hljs-property">length</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;消息体不完整&#x27;</span>);
  <span class="hljs-keyword">return</span> header;
}
</code></pre></div>
<p>长度字段从第 2 个字节开始，不是 4 的倍数，TypedArray 的视图要求按元素大小对齐，这里就用不了，而 <code>DataView</code> 可以从任意位置读。<code>getUint32(2)</code> 不传第二个参数，正好按大端读。读之前先检查长度够不够 6 字节，读完头部再检查消息体是不是完整。</p>
<p>解析时还有几个细节。<code>getInt*</code> 和 <code>getUint*</code> 对同样的字节理解不同，<code>0xff</code> 用 <code>getUint8</code> 读是 255，用 <code>getInt8</code> 读是 -1。64 位整数用 <code>getBigUint64</code> 或 <code>getBigInt64</code>，返回的是 BigInt。另外，从一个 <code>Uint8Array</code> 创建视图时，要带上它的偏移和长度：<code>new DataView(u8.buffer, u8.byteOffset, u8.byteLength)</code>。只传 <code>u8.buffer</code> 的话，视图会覆盖整个底层缓冲区，读到的位置就错了。</p>
<h2>Float16 是做什么的</h2>
<p>半精度浮点数只占 2 个字节，精度低但省空间，用在 WebGPU、机器学习模型权重这类要节省带宽的地方。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Float16Array</span> === <span class="hljs-string">&#x27;function&#x27;</span>) {
  <span class="hljs-keyword">const</span> half = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Float16Array</span>([<span class="hljs-number">1.1</span>]);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(half[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 1.099609375，半精度只有约 3 位有效数字</span>
}
</code></pre></div>
<p>存进去的是 1.1，读出来却是 1.099609375，因为半精度只有大约 3 位有效数字。Node.js 22 还没有 <code>Float16Array</code>，所以用之前要先像上面这样检测一下。</p>
<h2>常见追问</h2>
<p><strong>怎样判断当前平台是不是小端？</strong></p>
<blockquote>
<p>写一个 <code>Uint16Array([1])</code>，再按字节看它的第一个字节。<code>new Uint8Array(new Uint16Array([1]).buffer)[0] === 1</code> 为真，说明低位放在前面，就是小端。</p>
</blockquote>
<p><strong>二进制里的文本怎么读？</strong></p>
<blockquote>
<p>用 <code>TextDecoder</code>：<code>new TextDecoder(&#x27;utf-8&#x27;).decode(new Uint8Array(buffer, offset, length))</code>，先截出文本所在的那段字节，再解码。</p>
</blockquote>`};export{e as default};