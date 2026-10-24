var e={answerHtml:`<p>ArrayBuffer 保存原始字节，TypedArray 提供按某种数值类型解释这些字节的视图。多个视图可以共享同一块缓冲，因此改变一个视图可能被另一个视图观察到。TypedArray 不是普通 Array，不能直接使用 push、pop 等改变长度的方法。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]);
<span class="hljs-keyword">const</span> shared = bytes.<span class="hljs-title function_">subarray</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> copied = bytes.<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>);
shared[<span class="hljs-number">0</span>] = <span class="hljs-number">9</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes[<span class="hljs-number">1</span>]); <span class="hljs-comment">// 输出：9</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copied[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 输出：2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(bytes)); <span class="hljs-comment">// 输出：false</span>
</code></pre></div>
<p>这里 subarray 创建共享缓冲区的视图，slice 复制元素。TypedArray 适合图像、音频、二进制协议等数据，不是所有业务数组的性能替代品。讨论长度时还要区分元素个数与 byteLength，并考虑可调整大小缓冲区等较新能力的兼容性。</p>
<h3>推导路径</h3>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>`};export{e as default};