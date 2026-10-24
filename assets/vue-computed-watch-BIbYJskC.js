var e={answerHtml:`<p><code>computed</code> 用于从已有响应式数据推导新值，并基于依赖缓存，getter 应保持纯粹。<code>watch</code> 显式指定监听源，适合需要新旧值或精确控制触发条件的副作用。<code>watchEffect</code> 自动追踪同步执行过程中读取的响应式依赖。</p>
<p>异步 <code>watchEffect</code> 只会追踪第一次 <code>await</code> 之前访问的依赖。网络请求等副作用需要处理失效清理，防止旧请求结果覆盖新状态。</p>
<p>深度监听可能遍历大量属性，应按需使用。对于计算出来就能得到的状态，优先考虑 computed。</p>
<h3>复习提示</h3>
<p>回答时区分响应式依赖、组件更新和副作用，说明状态的来源与生命周期。涉及编译优化或组合式 API 时要标明 Vue 版本，避免把运行时实现细节当成稳定契约。建议用一个最小示例验证“computed、watch、副作用”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};