var e={answerHtml:`<p>判断条件首先把值转换为布尔值。空数组和空对象都是真值，空字符串、0、NaN、null、undefined 等是假值。字符串 &quot;0&quot; 也是真值，因此不能用是否为空代替数字是否合法。</p>
<p>加号既可以表示数值相加，也可以拼接字符串：操作数转换为原始值后，只要一侧是字符串就进行拼接。减号等算术运算通常要求数值；对象转换涉及 Symbol.toPrimitive、valueOf、toString。</p>
<p>接收表单输入时先明确解析规则，再验证结果，例如 Number.isFinite。Number(&#x27;&#x27;) 是 0，parseInt(&#x27;12px&#x27;, 10) 是 12，这两种行为可能都不符合业务要求。应把允许的输入格式作为验证规则，而不是依赖宽松转换。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>([]));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>(<span class="hljs-string">&quot;0&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(<span class="hljs-string">&quot;&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-built_in">parseInt</span>(<span class="hljs-string">&quot;12px&quot;</span>, <span class="hljs-number">10</span>));
</code></pre></div>
<p>输出依次为：true、true、0、12。</p>`};export{e as default};