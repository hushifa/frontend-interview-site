var e={answerHtml:`<p>判断条件首先把值转换为布尔值。空数组和空对象都是真值，空字符串、0、NaN、null、undefined 等是假值。字符串 &quot;0&quot; 也是真值，因此不能用是否为空代替数字是否合法。</p>
<p>在“隐式类型转换有哪些容易踩坑的规则？”这个问题中，先记录输入、调用顺序和副作用，再观察同步、异步和清理发生的时间；结果相同的写法也要比较可读性和取消方式。这里的 类型转换、ToPrimitive、真假值 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>加号既可以表示数值相加，也可以拼接字符串：操作数转换为原始值后，只要一侧是字符串就进行拼接。减号等算术运算通常要求数值；对象转换涉及 Symbol.toPrimitive、valueOf、toString。</p>
<p>接收表单输入时先明确解析规则，再验证结果，例如 Number.isFinite。Number(&#x27;&#x27;) 是 0，parseInt(&#x27;12px&#x27;, 10) 是 12，这两种行为可能都不符合业务要求。应把允许的输入格式作为验证规则，而不是依赖宽松转换。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>([]));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Boolean</span>(<span class="hljs-string">&quot;0&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Number</span>(<span class="hljs-string">&quot;&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-built_in">parseInt</span>(<span class="hljs-string">&quot;12px&quot;</span>, <span class="hljs-number">10</span>));
</code></pre></div>
<p>输出依次为：true、true、0、12。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};