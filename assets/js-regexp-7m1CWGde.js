var e={answerHtml:`<p>正则适合匹配明确的文本模式，但不适合独自承担复杂语法解析。使用构造函数拼接外部文本时，应正确转义正则元字符，避免用户输入改变匹配语义。</p>
<p>带 g 或 y 标志的正则会更新 lastIndex，多次 test 的结果可能因状态不同而变化。Unicode 模式、码点和字素簇并非一回事，复杂 emoji 或组合字符不能简单按一个字符类视为一个用户感知字符。</p>
<p>包含嵌套重复和大量回溯的模式可能导致主线程长时间阻塞。对不可信输入限制长度、简化模式并使用超时或隔离策略。校验邮箱等复杂格式时，前端应优先提供合理提示，最终判断仍由服务端完成。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-regexp">/a/g</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&quot;a&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&quot;a&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-property">lastIndex</span>);
</code></pre></div>
<p>输出依次为：true、false、0，带 g 的正则会改变 lastIndex。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。建议用一个最小示例验证“正则、Unicode、ReDoS”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};