var e={answerHtml:`<h2>先按职责选择抽象</h2>
<p>搜索框输入的防抖、去重、切换请求和错误恢复是时间流问题，RxJS 的操作符更适合；模板需要随时读取“当前搜索结果”和“当前加载状态”时，Signal 更自然。把所有 Observable 都改成 Signal，会丢掉取消、完成和多值流的语义；把所有状态都留在 Observable，又可能让模板读取变复杂。</p>
<p>一个常见边界是：RxJS 组织异步过程，Signal 暴露当前 UI 状态，<code>computed</code> 推导同步显示值，副作用由明确的生命周期管理。</p>
<h2><code>toSignal</code> 创建时就订阅</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> results = <span class="hljs-title function_">toSignal</span>(searchResults$, {
  <span class="hljs-attr">initialValue</span>: [],
});
</code></pre></div>
<p><code>toSignal</code> 不是等模板第一次读取才订阅。创建时可能立即触发冷 Observable 的 HTTP 请求，所以应在稳定的组件或服务生命周期中创建一次并复用，不能在模板函数或每次变更检测中反复调用。</p>
<p>Observable 可能尚未发出值，因此要提供 <code>initialValue</code>、接受 <code>undefined</code>，或仅对订阅时同步发出的源使用 <code>requireSync</code>。<code>requireSync</code> 不会让异步 HTTP 变成同步请求，普通网络请求强行使用会抛错。</p>
<p>Signal 读取到源错误时可能抛出，源完成后通常保留最后一个值，不会自动变成“已完成”。如果界面需要加载、成功、失败和完成，应先在流中建立明确的状态模型：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> viewState$ = results$.<span class="hljs-title function_">pipe</span>(
  <span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> ({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;ready&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>, data })),
  <span class="hljs-title function_">startWith</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;loading&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span> }),
  <span class="hljs-title function_">catchError</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-title function_">of</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;error&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>, error })),
);
<span class="hljs-keyword">const</span> viewState = <span class="hljs-title function_">toSignal</span>(viewState$, { <span class="hljs-attr">initialValue</span>: { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;loading&#x27;</span> } });
</code></pre></div>
<h2>生命周期决定订阅是否泄漏</h2>
<p>在组件或注入上下文中创建的 <code>toSignal</code> 通常会随上下文销毁而退订。手动提供 injector 或使用 <code>manualCleanup</code> 会改变默认清理行为，只有源会自然完成或应用明确掌控结束时才适合。一个永不完成的流如果无人负责清理，会一直保留订阅。</p>
<p>仍需要直接 <code>subscribe</code> 时，可考虑 <code>takeUntilDestroyed</code> 等工具；不必为了每个订阅都先创建 Signal。<code>toSignal</code> 的价值是把当前值暴露给模板，不是替代所有流订阅。</p>
<h2><code>toObservable</code> 不是事件日志</h2>
<p>Signal 表达当前状态，连续同步写入可能在稳定后只让 Observable 订阅者看到最后结果。若业务必须记录每次按键、拖动或操作，应使用显式事件流或日志，而不能从最终 Signal 值反推历史。</p>
<p>首次发射和后续调度要按 Angular 版本的互操作规则理解，不能把它等同于 <code>Subject.next</code> 的同步行为。状态同步和事件记录是两个不同需求。</p>
<h2>RxJS 仍然决定取消和错误传播</h2>
<p>搜索请求常见写法是 <code>switchMap</code>：新输入到来时取消旧订阅，但底层 fetch 是否真正中止取决于实现；即使客户端取消，也不代表服务端已经回滚写操作。<code>catchError</code> 放在内部请求流可以让外层输入继续工作，放在外层则可能让整个搜索流结束。</p>
<p>多个组件订阅同一个冷 Observable 可能发起重复请求。共享和缓存要根据刷新、引用计数、错误重试和数据过期语义决定；转换成 Signal 不会自动把它变成全局共享缓存。</p>
<p>实践中要明确每条边界：Observable 管理异步时间和取消，Signal 提供当前状态，computed 做纯同步派生，工具和网络副作用有明确的创建与清理位置。这样互操作才是在减少复杂度，而不是把同一状态在两种抽象之间来回搬运。</p>`};export{e as default};