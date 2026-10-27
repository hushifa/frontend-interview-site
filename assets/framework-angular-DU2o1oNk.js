var e={answerHtml:`<h2>Signal 只追踪发生在响应式上下文中的读取</h2>
<p>Signal 不是对所有 JavaScript 变量的全局监控。模板、<code>computed</code> 和 <code>effect</code> 等消费者在执行时调用 <code>count()</code>，Angular 才知道这个消费者依赖当前值；之后通过 <code>set</code> 或 <code>update</code> 改变它，相关消费者才会重新计算或更新。</p>
<p>仅仅在普通函数里提到某个 Signal，或改变一个普通变量，不会自动建立通知关系。</p>
<h2><code>computed</code> 是只读的派生状态</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> price = <span class="hljs-title function_">signal</span>(<span class="hljs-number">10</span>);
<span class="hljs-keyword">const</span> quantity = <span class="hljs-title function_">signal</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> total = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">price</span>() * <span class="hljs-title function_">quantity</span>());

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">total</span>()); <span class="hljs-comment">// 20</span>
quantity.<span class="hljs-title function_">update</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value + <span class="hljs-number">1</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">total</span>()); <span class="hljs-comment">// 30</span>
</code></pre></div>
<p><code>price</code> 和 <code>quantity</code> 是可写 Signal，<code>total</code> 是只读派生值。<code>computed</code> 通常惰性计算并缓存：第一次读取时求值，依赖没有变化时复用，依赖变化后让缓存失效，下一次读取再计算。</p>
<p>缓存不会把昂贵计算移到后台。对大量数据过滤、排序和格式化仍要测量执行成本，必要时拆分数据或使用更合适的结构。</p>
<h2>依赖由当前分支决定</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> expanded = <span class="hljs-title function_">signal</span>(<span class="hljs-literal">false</span>);
<span class="hljs-keyword">const</span> detail = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;原始内容&#x27;</span>);
<span class="hljs-keyword">const</span> display = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">expanded</span>() ? <span class="hljs-title function_">detail</span>() : <span class="hljs-string">&#x27;已折叠&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">display</span>());
detail.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;新内容&#x27;</span>); <span class="hljs-comment">// 折叠时不会触发 display 重新计算</span>
expanded.<span class="hljs-title function_">set</span>(<span class="hljs-literal">true</span>); <span class="hljs-comment">// 重新执行后 detail 才进入依赖</span>
</code></pre></div>
<p>第一次执行走折叠分支，没有读取 <code>detail</code>，所以它变化时不会使 <code>display</code> 失效；展开后，<code>detail</code> 加入依赖集合。再次改变分支时，依赖也可能被移除。依赖不是“函数文本中出现过的所有 Signal 永久固定”。</p>
<p>异步 <code>await</code> 或计时器之后的读取不能自动算作同一次同步依赖收集。异步任务需要自己的状态、取消和过期结果处理。</p>
<h2>通过写入创建明确的新值</h2>
<p>Signal 常用引用相等判断。如果保存数组，直接执行 <code>items().push(value)</code> 没有通过 Signal 写入，消费者不应期待收到更新；把同一引用重新 <code>set</code> 也可能被视为没有变化：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts">items.<span class="hljs-title function_">update</span>(<span class="hljs-function">(<span class="hljs-params">previous</span>) =&gt;</span> [...previous, value]);
</code></pre></div>
<p><code>asReadonly</code> 只隐藏写入 API，不会递归冻结对象。自定义 <code>equal</code> 可以减少无意义更新，但如果错误地判断两个对象相等，也会隐藏真实变化。复杂嵌套数据需要明确不可变更新、Store 或其他状态策略。</p>
<h2>派生不要用 effect 来回同步</h2>
<p>如果 <code>total</code> 完全由价格和数量决定，<code>computed</code> 比 effect 读取后再写另一个 Signal 更直接。后者多出一份需要保持一致的状态，还可能产生调度延迟和循环更新。</p>
<p><code>effect</code> 更适合把状态同步到外部系统，例如日志、非 Angular 图表或浏览器 API。它有自己的创建上下文、调度和清理规则，不应被当作同步函数，也不应拿来传播所有状态。<code>untracked</code> 适合明确排除某个依赖的场景，不能用来掩盖状态设计错误。</p>
<p>模板读取 Signal 时 Angular 可以把它和组件视图关联，但 Signals 不会自动解决请求竞态、共享对象、权限、生命周期或服务作用域。真正可靠的设计仍要把同步派生、异步流程和外部副作用分开。</p>`};export{e as default};