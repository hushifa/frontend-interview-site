var e={answerHtml:`<p>不同语言的复数规则不只是“1 个”和“多个”两种。<code>Intl.PluralRules</code> 可以根据语言和类型返回 <code>one</code>、<code>two</code>、<code>few</code>、<code>many</code>、<code>other</code> 等类别；<code>cardinal</code> 用于数量，<code>ordinal</code> 用于序数，不能混用。</p>
<p>组件应把规则选择交给国际化消息层，再把结果映射到完整句子，而不是在模板里手动判断 <code>count === 1</code>。消息中还要处理零、负数、小数、范围和没有精确匹配时的 <code>other</code> 分支。</p>
<p>数字格式化和复数分支是两个问题：应同时使用 <code>Intl.NumberFormat</code> 或消息库提供的格式化能力。切换语言后要重新计算，测试时覆盖目标语言的真实规则，而不是只测中文和英文。</p>
<h3>复习提示</h3>
<p>回答时把语言、地区、时区、文字方向和格式化规则分开处理。文案要允许翻译调整词序，日期、数字和复数示例应覆盖不同语言环境并验证回退策略。建议用一个最小示例验证“国际化、Intl、复数”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};