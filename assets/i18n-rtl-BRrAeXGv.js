var e={answerHtml:`<p>RTL 支持应从文档或应用根节点的 <code>dir=&quot;rtl&quot;</code> 开始，让浏览器和辅助技术理解阅读方向。布局中优先使用 <code>margin-inline-start</code>、<code>padding-inline-end</code>、<code>inset-inline-start</code> 等逻辑属性，而不是把 left/right 字符串全局替换。</p>
<p>图标、箭头、时间线和数字不一定都要镜像。需要根据语义判断：返回箭头通常随阅读方向变化，播放按钮或品牌标志可能保持方向。混合语言和代码还要使用合适的 <code>dir=&quot;auto&quot;</code> 或局部覆盖。</p>
<p>测试要覆盖文本长度、换行、表格、弹窗、键盘顺序和图标方向。RTL 不是单纯的 CSS 主题，翻译、日期数字格式和组件交互都需要一起验证。</p>
<h3>复习提示</h3>
<p>回答时把语言、地区、时区、文字方向和格式化规则分开处理。文案要允许翻译调整词序，日期、数字和复数示例应覆盖不同语言环境并验证回退策略。建议用一个最小示例验证“国际化、RTL、CSS 逻辑属性”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};