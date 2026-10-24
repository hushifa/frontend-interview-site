var e={answerHtml:`<p>JavaScript 的原始类型包括 undefined、null、boolean、number、bigint、string、symbol；对象包括普通对象、数组和函数等。变量保存值，对象值具有身份；两个内容相同但分别创建的对象并不相等。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p><code>===</code> 不做隐式类型转换，NaN 与自身比较为 false，+0 与 -0 相等。<code>Object.is</code> 认为 NaN 与自身相等，但区分正负零。Set、Map 使用的 SameValueZero 则把 NaN 视为相同、把正负零视为相同。</p>
<p>业务代码通常优先使用严格比较，并对输入做明确归一化。不要用 <code>typeof null</code> 判断空值，也不要把“对象存于堆、基本类型存于栈”当成语言规范保证；那是实现层面的简化描述。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">NaN</span> === <span class="hljs-title class_">NaN</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(+<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>, +<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>]).<span class="hljs-property">size</span>);
</code></pre></div>
<p>输出依次为：false、true、false、2。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};