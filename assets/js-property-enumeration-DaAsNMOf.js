var e={answerHtml:`<p>Object.keys 返回对象自身、可枚举的字符串属性键；for...in 还会遍历继承链上的可枚举字符串键；Reflect.ownKeys 包含自身的字符串键与 Symbol 键，不限于可枚举属性。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;内部标记&#x27;</span>);
<span class="hljs-keyword">const</span> object = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">inherited</span>: <span class="hljs-number">1</span> });
object.<span class="hljs-property">visible</span> = <span class="hljs-number">2</span>;
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(object, <span class="hljs-string">&#x27;hidden&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">3</span> });
object[key] = <span class="hljs-number">4</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(object).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 输出：visible</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">ownKeys</span>(object).<span class="hljs-property">length</span>); <span class="hljs-comment">// 输出：3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(object, <span class="hljs-string">&#x27;inherited&#x27;</span>)); <span class="hljs-comment">// 输出：false</span>
</code></pre></div>
<p>遍历输入对象前应先明确需要的是记录字段还是包含继承的属性集合，避免把原型属性误当作用户数据。属性描述符、Symbol 和属性顺序都有规则，序列化或复制操作不能被当作完整保留对象语义的通用方案。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};