var e={answerHtml:`<p><code>key</code> 帮助 React 在同级列表中识别元素身份。插入、删除或排序时，数组下标变化，原有组件状态可能被错误地复用给另一项。</p>
<p>优先使用数据本身稳定、同级唯一的 ID。不要在渲染时使用 <code>Math.random()</code>，这会让每次渲染都产生新身份并重建组件。</p>
<p>对于永不重排、增删且没有身份相关状态的静态列表，下标风险较低。<code>key</code> 不会作为普通 prop 传入子组件；子组件需要 ID 时应另传一个属性。</p>`};export{e as default};