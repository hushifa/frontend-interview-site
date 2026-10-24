var e={answerHtml:`<p>Testing Library 倾向用用户可感知的角色、名称、标签和文本查询元素，例如 <code>getByRole</code>、<code>getByLabelText</code>。这样测试更接近真实使用，也能同时暴露缺少可访问名称的问题。</p>
<p>查询优先级不是绝对规则：没有合适语义时可以使用文本、显示值或 <code>data-testid</code>。<code>data-testid</code> 应作为最后手段，不能把组件内部 class、DOM 层级或第三方实现细节当成稳定契约。</p>
<p>断言要区分同步、异步和消失状态，异步内容使用 <code>findBy</code> 或等待工具，避免固定 sleep。测试失败时先检查真实用户是否能找到并操作该元素，而不是马上降低查询条件。</p>
<h3>复习提示</h3>
<p>回答时说明测试对象、隔离边界和失败信息，选择能表达用户风险的测试层级。Mock、快照和覆盖率都是手段，不能代替关键流程、错误路径和真实环境验证。建议用一个最小示例验证“Testing Library、组件测试、无障碍”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};