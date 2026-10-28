var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>DataView</code> 用 <code>getUint16(offset, littleEndian)</code> 这类方法在任意字节偏移读写，不要求对齐。</li>
<li>第二个参数省略或为 <code>false</code> 时按大端，<code>true</code> 时按小端。</li>
<li>TypedArray 使用平台字节序，主流平台都是小端，所以解析大端协议要用 <code>DataView</code>。</li>
<li>读取越过视图末尾时抛 <code>RangeError</code>，解析前先检查 <code>byteLength</code>。</li>
<li>ES2025 新增 <code>Float16Array</code>、<code>getFloat16</code>/<code>setFloat16</code> 和 <code>Math.f16round</code>，MDN 标注为 Baseline 2025。</li>
</ul>
<h2>大端与小端</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(buffer);
view.<span class="hljs-title function_">setUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0x1234</span>); <span class="hljs-comment">// 未传 littleEndian，按大端写入</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 18,52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 4660，也就是 0x1234</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">true</span>)); <span class="hljs-comment">// 13330，也就是 0x3412</span>
</code></pre></div>
<p>大端把高位字节放在低地址：<code>0x12</code> 在前、<code>0x34</code> 在后。按小端重新读取同样两个字节就得到 <code>0x3412</code>。</p>
<h2>解析一个协议头</h2>
<p>假设协议头为：1 字节版本、1 字节类型、4 字节大端无符号长度。</p>
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
<p>注意事项：</p>
<ul>
<li><code>getInt*</code> 与 <code>getUint*</code> 对同样字节的解释不同，<code>0xff</code> 用 <code>getInt8</code> 读是 -1。</li>
<li>64 位整数用 <code>getBigUint64</code>/<code>getBigInt64</code>，返回 BigInt。</li>
<li>从 <code>Uint8Array</code> 创建视图时要带上偏移：<code>new DataView(u8.buffer, u8.byteOffset, u8.byteLength)</code>，否则会读到整个底层缓冲区。</li>
</ul>
<h2>Float16</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Float16Array</span> === <span class="hljs-string">&#x27;function&#x27;</span>) {
  <span class="hljs-keyword">const</span> half = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Float16Array</span>([<span class="hljs-number">1.1</span>]);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(half[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 1.099609375，半精度只有约 3 位有效数字</span>
}
</code></pre></div>
<p>半精度用于 WebGPU、机器学习模型权重等节省带宽的场景。Node.js 22 还没有 <code>Float16Array</code>，使用前做能力检测。</p>
<h2>常见追问</h2>
<ul>
<li>怎样判断当前平台字节序？<code>new Uint8Array(new Uint16Array([1]).buffer)[0] === 1</code> 为小端。</li>
<li>文本怎么读？用 <code>new TextDecoder(&#x27;utf-8&#x27;).decode(new Uint8Array(buffer, offset, length))</code>。</li>
</ul>`};export{e as default};