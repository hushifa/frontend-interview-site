var e={answerHtml:`<p><code>ref</code> 可以包装原始值或对象，JavaScript 中通过 <code>.value</code> 读写；对象值通常会转换为深层响应式对象。<code>reactive</code> 返回对象的响应式 Proxy，不能直接用于数字、字符串等原始值。</p>
<p>从 <code>reactive</code> 对象解构原始值，会得到当时的普通值，失去与原属性的响应式连接；需要保持连接时可以使用 <code>toRef</code> 或 <code>toRefs</code>。</p>
<p>替换整个对象时，<code>ref.value = newObject</code> 更直接。模板中 ref 的自动解包有适用条件，数组、集合和嵌套位置不能一概而论。</p>
<h3>复习提示</h3>
<p>回答时区分响应式依赖、组件更新和副作用，说明状态的来源与生命周期。涉及编译优化或组合式 API 时要标明 Vue 版本，避免把运行时实现细节当成稳定契约。可先用一个最小示例验证“响应式、ref、reactive”，再补充空值、异常和兼容性边界。</p>`};export{e as default};