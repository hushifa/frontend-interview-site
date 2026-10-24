var e={answerHtml:`<p>对象的属性可以是数据属性，也可以是访问器属性。数据属性包含 value、writable；访问器属性包含 get、set；两类都可具有 enumerable 和 configurable。Object.defineProperty 未显式指定的布尔特性默认是 false。</p>
<p>Object.preventExtensions 阻止新增属性；seal 还使已有属性不可配置；freeze 进一步使数据属性不可写。冻结是浅层的，嵌套对象仍可能变化；访问器属性的 getter 返回值也可能变化，setter 仍可被调用，Map 等内置集合的内部状态也不能仅靠 freeze 固定。</p>
<p>TypeScript 的 readonly 是编译时约束，不能替代运行时冻结。需要不可变数据时，应明确采用结构共享、受控更新或冻结策略，并评估深冻结在循环引用和性能上的代价。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> item = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ <span class="hljs-attr">nested</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> } });
item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span>);
</code></pre></div>
<p>输出依次为：1，说明冻结不会自动递归到嵌套对象。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};