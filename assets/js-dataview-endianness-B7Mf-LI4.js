var e={answerHtml:`<h2>简答</h2>
<ul>
<li>类型化数组使用平台字节序，读取文件或网络协议时字节序必须由格式决定。</li>
<li>DataView 的 getXxx/setXxx 用 littleEndian 参数显式指定端序，不传时默认大端。</li>
<li>偏移量按字节计算，越界会抛 RangeError。</li>
<li>解析二进制格式前先校验长度，再按字段逐个读取。</li>
</ul>
<p>一个 16 位整数需要两个字节。数值 0x1234 可以把高位字节 0x12 放前面，也可以把低位字节 0x34 放前面；协议双方如果使用不同顺序，就会把同一组字节读成不同数字。</p>
<p>高位字节先出现叫大端，低位字节先出现叫小端。DataView 可以显式决定每次多字节读写使用哪一种顺序，而多字节 TypedArray 通常采用平台字节序，更适合已明确本地数据表示的同类型数组。</p>
<h2>同样两个字节，读法不同结果就不同</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(buffer);
view.<span class="hljs-title function_">setUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0x1234</span>); <span class="hljs-comment">// 未传 littleEndian，按大端写入</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 18,52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 4660，也就是 0x1234</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">true</span>)); <span class="hljs-comment">// 13330，也就是 0x3412</span>
</code></pre></div>
<p>0x12 的十进制值是 18，0x34 是 52，所以第一行能直接看见缓冲中两个字节的排列。getUint16 默认按大端解释；传入 true 表示按小端解释。false 也明确表示大端。</p>
<p>实际协议代码通常建议显式写出这个布尔参数，或用有意义的常量说明协议顺序，避免维护者误以为省略参数就是“自动使用当前机器的顺序”。单字节读写没有字节先后问题，不需要相同的字节序参数。</p>
<h2>偏移按字节计算，不要求字段天然对齐</h2>
<p>DataView 的 getUint16(offset)、getUint32(offset) 等方法，都以视图起点为参照按字节定位。一个 32 位字段可以从字节 3 开始，不需要像 TypedArray 构造偏移那样天然满足元素对齐。</p>
<p>这适合混合字段的二进制消息：例如先放 1 字节类型，再放 2 字节长度，再放 4 字节序号。各字段宽度和起点由协议决定，不应随意用一个 Uint32Array 把整包数据都当成同一种数值读。</p>
<h2>一个带长度检查的消息解析例子</h2>
<p>以下自定义示例协议只接受类型 1，头部为 7 字节，长度与序号都采用大端，输入必须恰好包含一条完整消息：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parsePacket</span>(<span class="hljs-params">bytes</span>) {
  <span class="hljs-keyword">if</span> (!(bytes <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Uint8Array</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;输入必须是 Uint8Array&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (bytes.<span class="hljs-property">byteLength</span> &lt; <span class="hljs-number">7</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;消息不足以包含完整头部&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(bytes.<span class="hljs-property">buffer</span>, bytes.<span class="hljs-property">byteOffset</span>, bytes.<span class="hljs-property">byteLength</span>);
  <span class="hljs-keyword">const</span> type = view.<span class="hljs-title function_">getUint8</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">const</span> payloadLength = view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">1</span>, <span class="hljs-literal">false</span>);
  <span class="hljs-keyword">const</span> sequence = view.<span class="hljs-title function_">getUint32</span>(<span class="hljs-number">3</span>, <span class="hljs-literal">false</span>);

  <span class="hljs-keyword">if</span> (type !== <span class="hljs-number">1</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;不支持的消息类型&#x27;</span>);
  <span class="hljs-keyword">if</span> (bytes.<span class="hljs-property">byteLength</span> !== <span class="hljs-number">7</span> + payloadLength) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;消息长度与头部声明不一致&#x27;</span>);
  }

  <span class="hljs-keyword">return</span> { type, sequence, <span class="hljs-attr">payload</span>: bytes.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">7</span>) };
}

<span class="hljs-keyword">const</span> storage = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(<span class="hljs-number">12</span>);
storage.<span class="hljs-title function_">set</span>([<span class="hljs-number">1</span>, <span class="hljs-number">0</span>, <span class="hljs-number">3</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">9</span>, <span class="hljs-number">65</span>, <span class="hljs-number">66</span>, <span class="hljs-number">67</span>], <span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> packet = <span class="hljs-title function_">parsePacket</span>(storage.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">2</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(packet.<span class="hljs-property">type</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(packet.<span class="hljs-property">sequence</span>); <span class="hljs-comment">// 9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(packet.<span class="hljs-property">payload</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 65,66,67</span>
</code></pre></div>
<p>故意把消息放在 storage 的第 2 字节开始，是为了体现视图范围。若只写 <code>new DataView(bytes.buffer)</code>，就会从底层缓冲第 0 字节开始读，把前面的两个填充字节误当成消息头。</p>
<p>传入 byteOffset 和 byteLength，才能让 DataView 与当前 Uint8Array 看到同一段数据。真实 Node Buffer 或其他子视图也可能只是大缓冲的一部分，不能认为 buffer 属性一定只包含当前消息。</p>
<p>payload 使用 subarray 返回共享视图，没有再次复制字节。后续修改 storage 的对应区域会影响 payload；如果调用方需要独立保存，应明确改为 slice 等复制方式。</p>
<p>这个示例没有实现跨网络分块的缓冲拼接。一次网络读取可能只包含半个头部，也可能包含多条消息，需要先按协议分帧，再交给接受完整消息的解析函数。</p>
<h2>数值类型与字节序是两个独立选择</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">2</span>));
view.<span class="hljs-title function_">setInt16</span>(<span class="hljs-number">0</span>, -<span class="hljs-number">1</span>, <span class="hljs-literal">false</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getInt16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">false</span>)); <span class="hljs-comment">// -1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">false</span>)); <span class="hljs-comment">// 65535</span>
</code></pre></div>
<p>这两次使用相同字节序，但一个按有符号整数解释，另一个按无符号整数解释，所以得到不同结果。浮点字段则应使用 getFloat32、getFloat64 等方法，不能因为字段占 4 字节就一律读成 Uint32。</p>
<p>64 位整数可使用 BigInt 读写方法，结果类型也是 BigInt。若再转成 Number，仍需要检查安全整数范围；DataView 正确读出了所有位，不代表之后的数值转换不会丢失精度。</p>
<h2>方法边界检查不等于完整协议验证</h2>
<p>读取超出当前可访问视图范围会抛 RangeError 等错误，缓冲被转移后失效或调整大小也会影响读取。但即使每个 get 都成功，数据仍可能存在不支持的版本、越界的业务值、错误校验和或不一致的字段关系。</p>
<p>写入时也不能把 DataView 当成自动业务校验器：窄整数写入有数值转换规则，超出希望范围的输入未必按业务意图拒绝。应先验证类型与范围，再按协议编码。</p>
<p>最后，DataView 只负责按格式解释字节。它不自动解码 UTF-8 文本、不验证压缩格式，也不提供多线程共享内存上的原子一致性。文本应使用合适的解码器，跨线程同步则需要另外的共享内存与原子操作设计。</p>
<h2>ES2025 的 Float16Array</h2>
<p>ES2025 增加了 <code>Float16Array</code>，以及 <code>DataView.prototype.getFloat16</code>/<code>setFloat16</code> 和 <code>Math.f16round</code>。MDN 标为 Baseline 2025（2025 年 4 月起主流浏览器最新版本可用）。Node.js 22 尚不支持，使用前应做能力检测：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Float16Array</span> !== <span class="hljs-string">&#x27;undefined&#x27;</span>) {
  <span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Float16Array</span>([<span class="hljs-number">21</span>, <span class="hljs-number">31</span>]);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-property">BYTES_PER_ELEMENT</span>); <span class="hljs-comment">// 2</span>

  <span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">2</span>));
  view.<span class="hljs-title function_">setFloat16</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1.5</span>, <span class="hljs-literal">true</span>); <span class="hljs-comment">// 显式指定小端序</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getFloat16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">true</span>)); <span class="hljs-comment">// 1.5</span>
}
</code></pre></div>
<p>与其他类型化数组一样，<code>Float16Array</code> 使用平台字节序，跨平台交换数据时仍应通过 DataView 显式指定端序。它主要用于 WebGPU、WebGL 和机器学习模型权重，部分 CPU 没有原生 float16 指令，计算可能比 Float32Array 慢。</p>`};export{e as default};