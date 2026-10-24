var e={answerHtml:`<p>普通类型注解规定变量对外呈现的类型，可能把具体字面量拓宽。as const 会阻止表达式中的字面量拓宽，并使对象属性和数组结构在类型层面更只读；它不是运行时深冻结，也不会把表达式中已经引用的所有外部可变对象递归变成不可变对象。</p>
<p>satisfies 用来检查表达式是否符合目标类型，同时通常保留更具体的推导结果。它适合配置表、路由映射和枚举式对象，让拼错字段可被发现，又不丢失各项的具体类型。</p>
<p>类型断言 as 则告诉编译器按指定类型理解，不能等同于验证。选择时先判断目标是“约束形状”“保留字面量”还是“改变对外类型”，必要时组合 as const satisfies，但仍需处理运行时不可信输入。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html">TypeScript: Documentation - TypeScript 3.4</a></li>
</ul>`};export{e as default};