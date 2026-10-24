var e={answerHtml:`<p>Map 是键值集合，键可以是任意值，并按插入顺序迭代；Set 保存不重复的值。普通对象更适合表达具有固定字段的记录，但其原型、属性键转换和整数键枚举规则不能简单等同于 Map。</p>
<p>WeakMap 的键具有弱引用特性，适合为对象关联额外元数据而不单独阻止其回收。它不能枚举，也不能获取 size，因为垃圾回收时机不可预测。现代规范还允许某些不可注册 Symbol 作为弱键，使用时需确认目标运行环境。</p>
<p>缓存不一定应该使用 WeakMap：若需要主动淘汰、遍历或按字符串查询，Map 加容量策略更合适。WeakMap 解决的是特定引用关系，不保证所有内存泄漏问题自动消失。</p>
<h2>可运行示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = {};
<span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[key, <span class="hljs-number">1</span>]]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>(key));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>({}));
</code></pre></div>
<p>输出依次为：1、undefined，内容相同的两个对象仍不是同一个键。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。建议用一个最小示例验证“Map、Set、WeakMap”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};