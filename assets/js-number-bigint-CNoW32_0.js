var e={answerHtml:`<p>Number 使用 IEEE 754 双精度表示，许多十进制小数无法精确表示，所以 0.1 + 0.2 的结果可能不等于字面量 0.3。安全整数范围内的整数可以精确区分，超出范围可能发生相邻整数碰撞。</p>
<p>BigInt 用于任意精度整数，不能直接与 Number 混用算术运算，也不是小数计算方案。默认 JSON.stringify 不支持 BigInt，需要明确约定序列化格式。后端返回的大整数 ID 应考虑直接使用字符串，避免解析时先丢失精度。</p>
<p>金额计算可以根据业务精度采用整数最小单位或可靠的十进制库，同时定义舍入规则。Number.EPSILON 不是适用于所有数值尺度的统一误差阈值，需要结合绝对与相对误差判断。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0.1</span> + <span class="hljs-number">0.2</span> === <span class="hljs-number">0.3</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">9007199254740991n</span> + <span class="hljs-number">2n</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">5n</span> / <span class="hljs-number">2n</span>);
</code></pre></div>
<p>输出依次为：false、9007199254740993n、2n。</p>`};export{e as default};