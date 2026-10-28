var e={answerHtml:`<h2>简答</h2>
<p>Angular Signal 是一个可调用的值容器：signal() 创建可写信号，用 set 或 update 修改；computed() 派生只读值，按需懒计算，并缓存结果；effect() 用于同步到外部系统。依赖在每次执行时根据实际读取到的信号动态收集。直接修改信号中对象的内部属性不会通知更新，要用 update 返回新对象。新版本还提供 linkedSignal、resource 和基于信号的 input()。</p>
<h2>Signal 只追踪发生在响应式上下文中的读取</h2>
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
<p>模板读取 Signal 时 Angular 可以把它和组件视图关联，但 Signals 不会自动解决请求竞态、共享对象、权限、生命周期或服务作用域。真正可靠的设计仍要把同步派生、异步流程和外部副作用分开。</p>
<h2>可写派生、异步资源与信号输入</h2>
<p>当前文档（v22）还有几类常被追问的 Signal API：</p>
<ul>
<li><code>linkedSignal(() =&gt; options()[0])</code>：值跟随计算结果，同时允许 <code>set</code> 手动覆盖；源变化时会重置成新的计算结果。需要在源变化后保留用户选择时，改用 <code>{ source, computation }</code> 写法，<code>computation</code> 可以读到上一次的值。</li>
<li><code>resource({ params, loader })</code>：<code>params</code> 变化时重新执行 <code>loader</code>，进行中的请求通过 <code>abortSignal</code> 取消；<code>status</code> 取值为 <code>idle</code>、<code>loading</code>、<code>reloading</code>、<code>resolved</code>、<code>error</code>、<code>local</code>。处于 <code>error</code> 状态时读取 <code>value()</code> 会抛错，应先调用 <code>hasValue()</code>。<code>httpResource</code> 是基于 HttpClient 的封装，请求会经过拦截器。</li>
<li><code>input()</code> / <code>input.required()</code> / <code>model()</code>：用信号声明组件输入。<code>model()</code> 可以在组件内部写入，并自动生成 <code>xxxChange</code> 输出以支持 <code>[(x)]</code> 双向绑定；它不支持 <code>transform</code>。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Component</span>, input, model } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-meta">@Component</span>({ <span class="hljs-attr">selector</span>: <span class="hljs-string">&#x27;app-counter&#x27;</span>, <span class="hljs-attr">template</span>: <span class="hljs-string">\`{{ title() }}: {{ count() }}\`</span> })
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Counter</span> {
  title = input.<span class="hljs-property">required</span>&lt;<span class="hljs-built_in">string</span>&gt;();
  step = <span class="hljs-title function_">input</span>(<span class="hljs-number">1</span>);
  count = <span class="hljs-title function_">model</span>(<span class="hljs-number">0</span>);

  <span class="hljs-title function_">bump</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span>.<span class="hljs-title function_">update</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c + <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">step</span>());
  }
}
</code></pre></div>`};export{e as default};