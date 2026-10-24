var e={answerHtml:`<p>多字节数值的字节排列有大端和小端之分。TypedArray 的多字节解释通常遵循平台字节序；DataView 可以在每次读写时显式指定字节序，更适合包含不同类型字段的二进制格式。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(buffer);
view.<span class="hljs-title function_">setUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0x1234</span>); <span class="hljs-comment">// 默认采用大端</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 输出：18,52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 输出：4660</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">true</span>)); <span class="hljs-comment">// 输出：13330</span>
</code></pre></div>
<p>DataView 的偏移按字节计算，超出可访问范围会抛出错误。协议解析应明确字段长度、符号、字节序和数据完整性，不能因为本机测试正确就默认所有设备的多字节视图解释相同。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。建议用一个最小示例验证“DataView、字节序、二进制协议”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};