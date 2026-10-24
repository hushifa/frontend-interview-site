var e={answerHtml:`<p>映射类型遍历一组属性键，生成具有新属性类型或修饰符的对象类型。Partial 把顶层属性变为可选，Required 移除可选，Readonly 添加只读；Pick 选择字段，Omit 排除字段。</p>
<p>这些工具通常是浅层转换，并不会递归修改嵌套对象。它们也不会删除运行时对象上的字段：把对象断言成 Omit&lt;User, &#x27;password&#x27;&gt; 并不能防止真实 password 被序列化。</p>
<p>更新接口可使用 Pick 明确允许更新的字段，再决定哪些可选。对外响应必须实际构造返回值或经过运行时过滤。类型工具应表达业务约束，不应把所有字段都 Partial 后丢失必要的不变量。</p>`};export{e as default};