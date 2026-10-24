var e={answerHtml:`<p>多字节数值的字节排列有大端和小端之分。TypedArray 的多字节解释通常遵循平台字节序；DataView 可以在每次读写时显式指定字节序，更适合包含不同类型字段的二进制格式。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> buffer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">ArrayBuffer</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> view = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DataView</span>(buffer);
view.<span class="hljs-title function_">setUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-number">0x1234</span>); <span class="hljs-comment">// 默认采用大端</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(buffer).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 输出：18,52</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 输出：4660</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-title function_">getUint16</span>(<span class="hljs-number">0</span>, <span class="hljs-literal">true</span>)); <span class="hljs-comment">// 输出：13330</span>
</code></pre></div>
<p>DataView 的偏移按字节计算，超出可访问范围会抛出错误。协议解析应明确字段长度、符号、字节序和数据完整性，不能因为本机测试正确就默认所有设备的多字节视图解释相同。</p>
<h3>推导路径</h3>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>`};export{e as default};