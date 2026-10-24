var e={answerHtml:`<p>type、required、min、max、minlength、maxlength 和 pattern 等属性可以表达基础约束；浏览器提供 validity、checkValidity 和 reportValidity 等接口。setCustomValidity 可以设置自定义错误，恢复合法时要清空消息。</p>
<p>约束规则应与控件类型匹配，例如数字范围和字符串长度不是同一概念。自动填充、移动端键盘和输入法也会影响输入过程，不应在用户每输入一个字符时都强行清除看似不合法的中间值。</p>
<p>服务端必须重新验证所有数据。错误文案要说明如何修复，并与字段建立语义关联。不要只通过红色边框表达错误，也不要把 placeholder 当成永久可见的标签。</p>
<h3>复习提示</h3>
<p>回答时先区分 HTML 语义、CSS 规则和浏览器默认行为，再说明结构、样式与交互之间的影响。涉及兼容性时给出目标浏览器范围，不把某个浏览器的现象当成规范结论。可先用一个最小示例验证“约束校验、输入类型、错误提示”，再补充空值、异常和兼容性边界。</p>`};export{e as default};