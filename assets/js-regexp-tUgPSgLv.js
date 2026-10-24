var e={answerHtml:`<p>正则适合匹配明确的文本模式，但不适合独自承担复杂语法解析。使用构造函数拼接外部文本时，应正确转义正则元字符，避免用户输入改变匹配语义。</p>
<p>可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>带 g 或 y 标志的正则会更新 lastIndex，多次 test 的结果可能因状态不同而变化。Unicode 模式、码点和字素簇并非一回事，复杂 emoji 或组合字符不能简单按一个字符类视为一个用户感知字符。</p>
<p>包含嵌套重复和大量回溯的模式可能导致主线程长时间阻塞。对不可信输入限制长度、简化模式并使用超时或隔离策略。校验邮箱等复杂格式时，前端应优先提供合理提示，最终判断仍由服务端完成。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-regexp">/a/g</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&quot;a&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&quot;a&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-property">lastIndex</span>);
</code></pre></div>
<p>输出依次为：true、false、0，带 g 的正则会改变 lastIndex。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>在实际项目中，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};