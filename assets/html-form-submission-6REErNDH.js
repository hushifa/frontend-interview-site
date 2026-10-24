var e={answerHtml:`<p>表单提交的数据由成功的表单控件产生，name 是字段名，value 是当前提交值。没有 name 的控件通常不会进入原生提交数据；disabled 控件也不会提交，readonly 与 disabled 不等价。</p>
<p>label 应通过 for 与控件 id 关联，或正确包裹控件，以提供可访问名称和扩大点击区域。按钮在 form 内默认可能触发提交，普通交互按钮应显式指定 type=&quot;button&quot;。</p>
<p>使用 FormData 可以保留浏览器的字段收集规则，但多选和同名字段需要 getAll 等处理。前端校验用来改善体验，不能替代服务端校验；提交后应处理重复点击、错误提示和焦点定位。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects">Using FormData Objects - Web APIs | MDN</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label">&lt;label&gt; HTML label element - HTML | MDN</a></li>
</ul>`};export{e as default};