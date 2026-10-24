var e={answerHtml:`<p><code>useFormStatus</code> 可以让表单内部的子组件读取最近父级 form 的提交状态、提交数据和方法。它适合做提交按钮禁用、进度提示和防重复提交等界面反馈。</p>
<p>它必须在 form 的子树中使用，不能在 form 自己的同一个组件层级读取自己提交状态。表单提交仍要处理服务端校验、错误、取消和成功后的状态更新，不能只依赖 <code>pending</code>。</p>
<p>该 Hook 与 React Actions、框架表单集成有关，使用前要按当前 React/框架版本核对。浏览器原生表单提交和客户端增强之间也要保持可用的降级体验。</p>`};export{e as default};