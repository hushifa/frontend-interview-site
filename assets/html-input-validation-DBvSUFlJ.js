var e={answerHtml:`<p>type、required、min、max、minlength、maxlength 和 pattern 等属性可以表达基础约束；浏览器提供 validity、checkValidity 和 reportValidity 等接口。setCustomValidity 可以设置自定义错误，恢复合法时要清空消息。</p>
<p>约束规则应与控件类型匹配，例如数字范围和字符串长度不是同一概念。自动填充、移动端键盘和输入法也会影响输入过程，不应在用户每输入一个字符时都强行清除看似不合法的中间值。</p>
<p>服务端必须重新验证所有数据。错误文案要说明如何修复，并与字段建立语义关联。不要只通过红色边框表达错误，也不要把 placeholder 当成永久可见的标签。</p>`};export{e as default};