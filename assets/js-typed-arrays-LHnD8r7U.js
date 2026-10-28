var e={answerHtml:`<h2>简答</h2>
<ul>
<li>ArrayBuffer 是固定长度的原始字节，自身不能读写，要通过 TypedArray 或 DataView 视图访问。</li>
<li>TypedArray 元素类型和长度固定，写入超范围的值会截断或取模。</li>
<li>普通数组可以存放任意值并动态增长。</li>
<li>多个视图可以共享同一个 ArrayBuffer，修改一个视图会影响其他视图。</li>
</ul>
<p>普通数组可以同时保存数字、字符串和对象，适合业务列表。二进制数据则更关注“这段数据到底有多少字节，每几个字节表示一个什么数”，例如图片像素、音频采样、文件内容或网络协议字段。</p>
<p>ArrayBuffer 提供原始字节存储，本身不是用 buffer[0] 访问元素的普通数组。TypedArray 在它上面建立有类型的视图，例如 Uint8Array 把每个字节解释为无符号整数，Float32Array 把每四个字节解释为单精度浮点数。</p>
<h2>新视图不一定意味着新数据</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]);
<span class="hljs-keyword">const</span> shared = bytes.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> copied = bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>);
shared[<span class="hljs-number">0</span>] = <span class="hljs-number">9</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes[<span class="hljs-number">1</span>]); <span class="hljs-comment">// 9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copied[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(bytes)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>subarray 创建指向同一底层缓冲区域的视图，因此 shared[0] 与 bytes[1] 访问同一位置。slice 则复制对应元素到新的存储中，所以 copied 保留原来的 2。</p>
<p>如果想为一个数据块创建只读展示窗口，subarray 也不会自动使它只读；它仍然是能修改共享字节的视图。是否允许修改，需要调用方和接口约定，而不是根据变量名判断。</p>
<h2>元素数量、字节长度与偏移是三件事</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">8</span>);
<span class="hljs-keyword">const</span> words = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint16Array</span>(buffer, <span class="hljs-number">2</span>, <span class="hljs-number">2</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(buffer.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 8</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-property">length</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-property">byteOffset</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-property">byteLength</span>); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(words.<span class="hljs-property">BYTES_PER_ELEMENT</span>); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>这里从 buffer 的第 2 字节开始，建立一个包含两个 16 位元素的视图，所以覆盖 4 个字节。TypedArray 构造参数里的起始偏移按字节计算，指定的 length 却是元素个数；DataView 的长度参数则直接按字节计，不能混用。</p>
<p>多字节 TypedArray 的起始偏移要满足对齐要求，区域也不能超出缓冲范围。一个子视图的 buffer 仍然可能是更大的原始缓冲，直接传 view.buffer 给另一个 API，可能把视图之外的数据也一起交出去，应同时考虑 byteOffset、byteLength。</p>
<h2>类型不同，写入时的转换规则也不同</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> integers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">256</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">3.9</span>]);
<span class="hljs-keyword">const</span> clamped = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8ClampedArray</span>([<span class="hljs-number">256</span>, -<span class="hljs-number">1</span>, <span class="hljs-number">3.9</span>]);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(integers.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 0,255,3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(clamped.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 255,0,4</span>
</code></pre></div>
<p>Uint8Array 使用对应整数转换规则，超出八位范围会发生截断与取模效果，不是自动校验并报错。Uint8ClampedArray 则把值限制到 0–255，并按其规定的舍入规则处理小数，所以常用于像素通道数据。</p>
<p>Float32Array 与 Float64Array 的精度也不同；BigInt64Array、BigUint64Array 使用 BigInt 元素，不能把普通 Number 数据毫无区别地混进去。选择类型是在选择数据表示和范围，不只是选择一个更短的类名。</p>
<h2>构造参数决定共享还是复制</h2>
<p><code>new Uint8Array(buffer)</code> 基于已有 ArrayBuffer 建立视图；<code>new Uint8Array([1, 2, 3])</code> 则从普通数组转换并复制值。传入另一个 TypedArray 时，通常是按元素类型创建并转换副本，不能简单等同于重新解释原来的全部字节。</p>
<p>需要把同一组字节按另一种类型查看，应明确使用原 buffer、合适偏移和长度。对于跨平台二进制协议，多字节 TypedArray 的解释依赖平台字节序，不应拿本机恰好正确的解释当成协议定义；这类场景用 DataView 显式指定字节序更合适。</p>
<h2>TypedArray 不是可任意扩长的普通 Array</h2>
<p>它有 map、filter、slice、set 等接口，但没有普通数组式的 push、pop。索引代表特定的数值元素，不能随意制造稀疏空位来保存混合类型。</p>
<p>TypedArray 的 sort 默认按数值顺序排序，这也不同于普通数组默认转字符串比较的 sort。即使方法同名，也应检查返回类型、转换和修改行为，不要默认与 Array 完全相同。</p>
<p>固定缓冲上的视图长度不能通过赋值 length 来增长。不过支持可调整大小 ArrayBuffer 的环境中，可以创建跟随缓冲大小变化的视图；这种长度跟踪能力与普通数组 push 的模型不同，缩小缓冲还会影响已有视图的可访问范围。使用这些较新能力时，应确认目标运行环境。</p>
<h2>共享缓冲还涉及资源生命周期</h2>
<p>多个视图指向同一个 ArrayBuffer，只是共享同一块本地存储。跨线程共同访问则涉及 SharedArrayBuffer 及同步规则，不是给普通 buffer 建立第二个视图就自动获得线程安全。</p>
<p>把可转移 ArrayBuffer 转移给另一个执行环境后，原缓冲可能变为 detached，已有视图也不再能按原来的数据使用。需要保留原数据时，应选择复制而不是转移，不能只看传递函数有没有返回成功。</p>
<p>TypedArray 在二进制、图形与数值计算中很有价值，但不是所有业务数组的性能替代品。转换本身有成本，定长数值表示也会改变语义；用户列表、配置记录等仍然应优先使用更符合数据模型的普通数组与对象。</p>`};export{e as default};