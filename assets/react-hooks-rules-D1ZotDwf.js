var e={answerHtml:`<p>React 依靠稳定的 Hook 调用结构关联各次渲染中的状态。把 useState 或 useEffect 放进条件、循环和提前返回之后，会导致调用关系不一致。Hook 也不能随意在普通工具函数中调用。</p>
<p>自定义 Hook 用于复用带状态或副作用的逻辑，不会自动让多个使用者共享同一份状态。共享状态需要提升到共同祖先、Context 或外部 store。命名 use 前缀配合 lint 规则能帮助发现错误。</p>
<p>某些特定 API（如 React 的 use）有不同的调用约束，应按其官方规则理解，不能把例外推广到所有 Hook。实际项目应启用对应 ESLint 规则，并处理依赖检查提示。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://react.dev/reference/react/use">use – React</a></li>
</ul>
<h3>复习提示</h3>
<p>回答时先说明渲染、状态和副作用分别由谁负责，再谈 Hook 或并发机制。具体行为要锁定 React 版本，并说明组件卸载、重复渲染和错误处理等边界。可先用一个最小示例验证“Hooks、调用顺序、自定义Hook”，再补充空值、异常和兼容性边界。</p>`};export{e as default};