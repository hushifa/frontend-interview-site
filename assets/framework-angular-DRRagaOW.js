var e={answerHtml:`<p>Angular Signal 是可被读取的响应式值。调用 signal 函数读取当前值时，如果处在模板、computed 或 effect 等响应式消费者中，Angular 会建立依赖关系。之后写入发生变化，相关消费者才知道需要重新求值或更新视图。</p>
<p>它不是对所有 JavaScript 变量自动追踪，也不是只要对象内容变了就一定通知。</p>
<h3>computed 适合从已有状态推导结果</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { signal, computed } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> price = <span class="hljs-title function_">signal</span>(<span class="hljs-number">10</span>);
<span class="hljs-keyword">const</span> quantity = <span class="hljs-title function_">signal</span>(<span class="hljs-number">2</span>);
<span class="hljs-keyword">const</span> total = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">price</span>() * <span class="hljs-title function_">quantity</span>());

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">total</span>()); <span class="hljs-comment">// 20</span>
quantity.<span class="hljs-title function_">update</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value + <span class="hljs-number">1</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">total</span>()); <span class="hljs-comment">// 30</span>
</code></pre></div>
<p>price、quantity 是可写 signal，提供 set 和 update；total 是只读派生值。读取 total 时计算依赖，不需要手动订阅两个字段，也不需要在每次更新数量后再同步 total。</p>
<p>computed 具有惰性和缓存：首次读取才计算，依赖未变化时复用结果；依赖变化后使缓存失效，下一次读取再计算。它不会把昂贵计算变成后台任务，大量同步过滤仍然需要关注执行成本。</p>
<h3>依赖取决于这次实际读到了什么</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> expanded = <span class="hljs-title function_">signal</span>(<span class="hljs-literal">false</span>);
<span class="hljs-keyword">const</span> detail = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;原始内容&#x27;</span>);
<span class="hljs-keyword">let</span> runs = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> display = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> {
  runs += <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">expanded</span>() ? <span class="hljs-title function_">detail</span>() : <span class="hljs-string">&#x27;已折叠&#x27;</span>;
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">display</span>(), runs); <span class="hljs-comment">// 已折叠 1</span>
detail.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;更新内容&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">display</span>(), runs); <span class="hljs-comment">// 已折叠 1</span>
expanded.<span class="hljs-title function_">set</span>(<span class="hljs-literal">true</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">display</span>(), runs); <span class="hljs-comment">// 更新内容 2</span>
</code></pre></div>
<p>第一次 expanded 为 false，没有读取 detail，所以 detail 变化不会使这个 computed 因该依赖失效。展开后重新执行分支，detail 才进入依赖集合；再次折叠也可以移除这条依赖。</p>
<p>这比“函数里提到过的所有 signal 都永远依赖”更准确。异步边界之后的读取也不能自动当作同一次同步依赖收集的一部分，异步任务需要明确状态和取消设计。</p>
<h3>对象内部突变可能绕过通知</h3>
<p>默认相等判断通常基于 Object.is。若 signal 保存数组，直接 <code>items().push(value)</code> 没有通过 signal 写入，消费者不应期待自动收到更新；把相同引用 set 回去，也可能被视为没有变化。</p>
<p>常见做法是 <code>items.update(old =&gt; [...old, value])</code>，让更新路径和新值明确。asReadonly 限制的是写入 API，不会把内部对象递归冻结。自定义 equal 可以减少无意义更新，但错误地认定相等也会隐藏真正变化。</p>
<h3>派生值不要用 effect 来回同步</h3>
<p>如果 total 完全由 price 和 quantity 决定，computed 更直接。用 effect 读取它们后再写另一个 total signal，会多出一份需要保持一致的状态，并引入调度和循环风险。</p>
<p>effect 更适合与外部系统同步，例如日志、非 Angular 图形库或其他副作用。其创建上下文、执行调度和清理需要遵循当前 Angular 版本规则，不应当作同步函数调用，也不该随意用于传播所有状态。</p>
<p>需要在响应式上下文中读取某个值但不建立依赖时，可以评估 untracked，不过应明确为什么不希望它触发更新；用它压制更新并不能修复数据设计错误。</p>
<p>模板读取 signal 时，Angular 能跟踪对应视图的依赖，配合变更检测通知。但信号模型仍需与组件生命周期、异步流和服务作用域配合，不会自动解决请求竞态、对象共享或业务权限。</p>`};export{e as default};