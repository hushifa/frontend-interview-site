var e={answerHtml:`<p><code>computed</code> 用于从已有响应式数据推导新值，并基于依赖缓存，getter 应保持纯粹。<code>watch</code> 显式指定监听源，适合需要新旧值或精确控制触发条件的副作用。<code>watchEffect</code> 自动追踪同步执行过程中读取的响应式依赖。</p>
<p>异步 <code>watchEffect</code> 只会追踪第一次 <code>await</code> 之前访问的依赖。网络请求等副作用需要处理失效清理，防止旧请求结果覆盖新状态。</p>
<p>深度监听可能遍历大量属性，应按需使用。对于计算出来就能得到的状态，优先考虑 computed。</p>`};export{e as default};