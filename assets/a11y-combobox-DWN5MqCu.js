var e={answerHtml:`<p>Combobox 不是给输入框加一个 <code>role</code> 就完成了。控件要表达展开状态、关联的 popup 和当前活动选项；键盘用户需要能打开、移动、选择、取消并关闭列表，焦点行为要稳定，选中值要回到输入控件。</p>
<p>如果使用 <code>aria-activedescendant</code>，被引用的活动元素必须存在且 ID 稳定；如果把焦点移动到列表项，则要处理返回输入框、Escape 和 Tab 的行为。过滤结果变化时，不应让焦点跳到不可见或已删除的元素。</p>
<p>原生 <code>select</code> 能满足需求时优先使用原生控件。自定义组件还需要测试屏幕阅读器、键盘、触摸和鼠标交互，不能只看视觉效果或自动化属性快照。</p>`};export{e as default};