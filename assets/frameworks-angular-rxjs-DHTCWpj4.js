var e={answerHtml:`<p>Observable 表达一段可能随时间产生多个值、错误或完成的流；Signal 提供随时可同步读取的当前状态。两者可以协作，但不是换一个 API 名称就能无损互换。</p>
<p>例如搜索输入的防抖、去重和取消上一请求适合用 RxJS 组合，最终结果可以转成 Signal 供模板读取。没有必要为了使用 Signals 把成熟的异步流操作全部重写一遍。</p>
<h3>toSignal 会建立订阅，不是等读取时才订阅</h3>
<p>toSignal 创建时就订阅 Observable，可能立刻触发 HTTP 请求等副作用。应在明确生命周期中创建一次并复用，不要在模板读取函数或频繁执行的方法里反复调用。</p>
<p>Signal 必须能回答“现在是什么值”，但 Observable 可能还没发出数据，因此要处理初始状态：提供 initialValue、不提供而接受 undefined，或对确实同步发射的源使用 requireSync。</p>
<p>下面用同步发射的 BehaviorSubject 演示转换。manualCleanup 在这里用于由示例显式完成源，而非组件默认生命周期：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { toSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core/rxjs-interop&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">BehaviorSubject</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;rxjs&#x27;</span>;

<span class="hljs-keyword">const</span> source = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BehaviorSubject</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> current = <span class="hljs-title function_">toSignal</span>(source, { <span class="hljs-attr">requireSync</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">manualCleanup</span>: <span class="hljs-literal">true</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">current</span>()); <span class="hljs-comment">// 1</span>
source.<span class="hljs-title function_">next</span>(<span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">current</span>()); <span class="hljs-comment">// 2</span>
source.<span class="hljs-title function_">complete</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">current</span>()); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>requireSync 要求订阅时就得到值，不是替异步请求同步等待。普通 HTTP 请求不满足这个条件，强行使用会产生错误。</p>
<p>完成后 Signal 保留最后一个值，不会自动变成“已完成”。若源错误，错误会在读取 Signal 时抛出。UI 若需要加载、成功、失败和完成状态，应先在流中把它们映射成明确的数据模型，不能只转换裸结果后猜测状态。</p>
<h3>默认清理依赖创建时的上下文</h3>
<p>通常 toSignal 在组件或服务的注入上下文中使用，并在相应生命周期结束时取消订阅；也可按 API 要求提供 injector。manualCleanup 会改变默认清理安排，只有源自然结束或你明确掌控结束机制时才适合使用。</p>
<p>不要把 manualCleanup 当作绕过注入错误的通用按钮。一个永不完成的流配合无人管理的手动清理，会持续保留订阅。</p>
<p>对于仍需要直接 subscribe 的场景，可评估 takeUntilDestroyed 等生命周期工具；它与 toSignal 的用途不同，不需要为了每个订阅都先创建一个 Signal。</p>
<h3>toObservable 不保证回放每次同步写入</h3>
<p>toObservable 通过相应响应式机制把 Signal 变化提供给 Observable。Signal 表达的是状态，连续同步写入可能在稳定后只让订阅者看到最后结果，不能把它当作每次操作都必达的事件总线。</p>
<p>比如连续 set 为 1、2、3，业务若必须记录每一次操作，应使用事件流或明确日志，而不是寄希望于从最终状态反推出全部历史。</p>
<p>首次发射与后续调度还要遵循所用版本的互操作规则。不要将它与直接 Subject.next 的同步行为混为一谈。</p>
<h3>流操作仍然决定取消和错误传播</h3>
<p>switchMap 可以切换到新内部流并取消旧订阅，但底层任务是否真正停止取决于它的取消实现。写入操作也不能因为取消订阅就认为服务端一定回滚。</p>
<p>catchError 放在不同层会影响外层搜索流是否还能继续接收下一次输入。若希望一次请求失败后仍可继续搜索，通常在对应内部请求层转换错误，而不是让整个输入流永久结束。</p>
<p>多个订阅可能造成重复请求，是否使用共享与缓存操作要按刷新、引用计数和错误语义决定；toSignal 本身不会自动把所有冷 Observable 变成全局共享缓存。</p>
<p>将边界保持清楚：RxJS 组织时间与取消关系，Signal 暴露组件当前状态，computed 推导同步显示值，外部副作用另行管理。这样比反复在两者之间转换更容易维护。</p>`};export{e as default};