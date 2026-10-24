var e={answerHtml:`<p>Map 是键值集合，键可以是任意值，并按插入顺序迭代；Set 保存不重复的值。普通对象更适合表达具有固定字段的记录，但其原型、属性键转换和整数键枚举规则不能简单等同于 Map。</p>
<p>在“Map、Set、WeakMap 与普通对象各有什么用途？”这个问题中，先记录输入、调用顺序和副作用，再观察同步、异步和清理发生的时间；结果相同的写法也要比较可读性和取消方式。这里的 Map、Set、WeakMap 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>WeakMap 的键具有弱引用特性，适合为对象关联额外元数据而不单独阻止其回收。它不能枚举，也不能获取 size，因为垃圾回收时机不可预测。现代规范还允许某些不可注册 Symbol 作为弱键，使用时需确认目标运行环境。</p>
<p>缓存不一定应该使用 WeakMap：若需要主动淘汰、遍历或按字符串查询，Map 加容量策略更合适。WeakMap 解决的是特定引用关系，不保证所有内存泄漏问题自动消失。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = {};
<span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[key, <span class="hljs-number">1</span>]]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>(key));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>({}));
</code></pre></div>
<p>输出依次为：1、undefined，内容相同的两个对象仍不是同一个键。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};