var e={answerHtml:`<p>表单提交的数据由成功的表单控件产生，name 是字段名，value 是当前提交值。没有 name 的控件通常不会进入原生提交数据；disabled 控件也不会提交，readonly 与 disabled 不等价。</p>
<p>label 应通过 for 与控件 id 关联，或正确包裹控件，以提供可访问名称和扩大点击区域。按钮在 form 内默认可能触发提交，普通交互按钮应显式指定 type=&quot;button&quot;。</p>
<p>使用 FormData 可以保留浏览器的字段收集规则，但多选和同名字段需要 getAll 等处理。前端校验用来改善体验，不能替代服务端校验；提交后应处理重复点击、错误提示和焦点定位。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects">Using FormData Objects - Web APIs | MDN</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label">&lt;label&gt; HTML label element - HTML | MDN</a></li>
</ul>
<h3>复习提示</h3>
<p>回答时先区分 HTML 语义、CSS 规则和浏览器默认行为，再说明结构、样式与交互之间的影响。涉及兼容性时给出目标浏览器范围，不把某个浏览器的现象当成规范结论。可先用一个最小示例验证“表单、label、FormData”，再补充空值、异常和兼容性边界。</p>`};export{e as default};