var e={answerHtml:`<p>空值合并只在左侧为 null 或 undefined 时使用右侧值；逻辑或则会把 0、false、空字符串等假值也视为需要回退。是否保留这些值取决于业务语义。</p>
<p>在“可选链和空值合并为什么不能简单替换为 &amp;&amp; 和 ||？”这个问题中，先记录输入、调用顺序和副作用，再观察同步、异步和清理发生的时间；结果相同的写法也要比较可读性和取消方式。这里的 可选链、空值合并、短路 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> ?? <span class="hljs-number">10</span>); <span class="hljs-comment">// 输出：0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> || <span class="hljs-number">10</span>); <span class="hljs-comment">// 输出：10</span>
<span class="hljs-keyword">const</span> user = <span class="hljs-literal">null</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span> ?? <span class="hljs-string">&#x27;匿名&#x27;</span>); <span class="hljs-comment">// 输出：匿名</span>
</code></pre></div>
<p>可选链在链路遇到 null 或 undefined 时短路，不是捕获任意错误。访问未声明变量仍可能抛错，属性存在但不是函数时，可选调用也不保证成功；括号分组可能结束连续短路链。它适合表达数据确实可缺失的情况，不应掩盖本来必须存在的业务字段。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining">可选链</a>。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};