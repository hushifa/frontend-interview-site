var e={answerHtml:`<p>空值合并只在左侧为 null 或 undefined 时使用右侧值；逻辑或则会把 0、false、空字符串等假值也视为需要回退。是否保留这些值取决于业务语义。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> ?? <span class="hljs-number">10</span>); <span class="hljs-comment">// 输出：0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> || <span class="hljs-number">10</span>); <span class="hljs-comment">// 输出：10</span>
<span class="hljs-keyword">const</span> user = <span class="hljs-literal">null</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span> ?? <span class="hljs-string">&#x27;匿名&#x27;</span>); <span class="hljs-comment">// 输出：匿名</span>
</code></pre></div>
<p>可选链在链路遇到 null 或 undefined 时短路，不是捕获任意错误。访问未声明变量仍可能抛错，属性存在但不是函数时，可选调用也不保证成功；括号分组可能结束连续短路链。它适合表达数据确实可缺失的情况，不应掩盖本来必须存在的业务字段。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining">可选链</a>。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。可先用一个最小示例验证“可选链、空值合并、短路”，再补充空值、异常和兼容性边界。</p>`};export{e as default};