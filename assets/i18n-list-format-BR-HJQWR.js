var e={answerHtml:`<p><code>Intl.ListFormat</code> 根据语言、<code>type</code> 和 <code>style</code> 生成列表文本，例如“甲、乙和丙”或对应语言的自然连接方式。它比手动拼接逗号、顿号和“以及”更能适应不同语言规则。</p>
<p><code>conjunction</code>、<code>disjunction</code> 和 <code>unit</code> 语义不同；列表为空、只有一项和包含长文本时也要有合理表现。列表格式化不负责转义 HTML，用户内容仍要按展示上下文安全处理。</p>
<p>语言切换后应重新创建或更新 formatter，格式化结果也应纳入快照和多语言测试。不要用同一个中文标点规则覆盖所有语言。</p>`};export{e as default};