var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Signal 总有当前值，读取是同步的；Observable 是推送的事件流，可能还没有值，也可能已经完成或出错。</li>
<li><code>toSignal(obs$)</code> 订阅 Observable，把最新值作为 Signal 返回，组件销毁时自动取消订阅；在第一个值到达前，Signal 的值是 <code>undefined</code>，可以用 <code>initialValue</code> 指定。</li>
<li><code>toObservable(sig)</code> 在 Signal 变化后发出新值，适合接入 <code>debounceTime</code>、<code>switchMap</code> 等操作符。</li>
<li>需要防抖、取消上一次请求、合并多个事件流时，RxJS 更合适；表示界面状态和派生值时，Signal 更简单。</li>
<li><code>toSignal</code> 遇到 Observable 出错时，读取该 Signal 会抛出错误，所以要在管道中用 <code>catchError</code> 处理。</li>
</ul>
<h2>搜索框：Signal 输入 → RxJS 处理 → Signal 输出</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Component</span>, inject, signal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;
<span class="hljs-keyword">import</span> { toObservable, toSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core/rxjs-interop&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">HttpClient</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/common/http&#x27;</span>;
<span class="hljs-keyword">import</span> { catchError, debounceTime, distinctUntilChanged, <span class="hljs-keyword">of</span>, switchMap } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;rxjs&#x27;</span>;

<span class="hljs-meta">@Component</span>({
  <span class="hljs-attr">selector</span>: <span class="hljs-string">&#x27;app-search&#x27;</span>,
  <span class="hljs-attr">template</span>: <span class="hljs-string">\`
    &lt;input [value]=&quot;query()&quot; (input)=&quot;query.set($any($event.target).value)&quot; /&gt;
    @for (item of results(); track item.id) {
      &lt;p&gt;{{ item.title }}&lt;/p&gt;
    }
  \`</span>,
})
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">SearchComponent</span> {
  <span class="hljs-keyword">private</span> http = <span class="hljs-title function_">inject</span>(<span class="hljs-title class_">HttpClient</span>);
  <span class="hljs-keyword">readonly</span> query = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;&#x27;</span>);

  <span class="hljs-keyword">readonly</span> results = <span class="hljs-title function_">toSignal</span>(
    <span class="hljs-title function_">toObservable</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">query</span>).<span class="hljs-title function_">pipe</span>(
      <span class="hljs-title function_">debounceTime</span>(<span class="hljs-number">300</span>),
      <span class="hljs-title function_">distinctUntilChanged</span>(),
      <span class="hljs-title function_">switchMap</span>(<span class="hljs-function">(<span class="hljs-params">q</span>) =&gt;</span>
        q
          ? <span class="hljs-variable language_">this</span>.<span class="hljs-property">http</span>
              .<span class="hljs-property">get</span>&lt;{ <span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span> }[]&gt;(<span class="hljs-string">\`/api/search?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(q)}</span>\`</span>)
              .<span class="hljs-title function_">pipe</span>(<span class="hljs-title function_">catchError</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">of</span>([])))
          : <span class="hljs-title function_">of</span>([]),
      ),
    ),
    { <span class="hljs-attr">initialValue</span>: [] },
  );
}
</code></pre></div>
<ul>
<li><code>switchMap</code> 在新查询到来时取消上一次未完成的请求。</li>
<li><code>initialValue</code> 让模板在第一次请求完成前也能直接遍历。</li>
<li><code>catchError</code> 写在 <code>switchMap</code> 内部的请求上：如果放在外层管道，一次出错就会让整个流结束，之后的输入不再触发搜索。</li>
</ul>
<h2>订阅清理</h2>
<ul>
<li>
<p><code>toSignal</code> 和 <code>async</code> 管道会自动取消订阅。</p>
</li>
<li>
<p>手动订阅时用 <code>takeUntilDestroyed()</code>：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-variable language_">this</span>.<span class="hljs-property">socket</span>.<span class="hljs-property">messages$</span>.<span class="hljs-title function_">pipe</span>(<span class="hljs-title function_">takeUntilDestroyed</span>()).<span class="hljs-title function_">subscribe</span>(<span class="hljs-function">(<span class="hljs-params">m</span>) =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">messages</span>.<span class="hljs-title function_">update</span>(<span class="hljs-function">(<span class="hljs-params">l</span>) =&gt;</span> [...l, m]));
</code></pre></div>
<p>在构造期间调用无需参数，其他位置需要传入 <code>DestroyRef</code>。</p>
</li>
</ul>
<h2>也可以用 resource</h2>
<p>只需要&quot;根据参数请求一次数据&quot;时，Angular 的 <code>resource</code> / <code>rxResource</code> 直接把参数 Signal 和异步加载结合起来，不必手动转换，见《Angular Signals 的依赖追踪与 computed 有什么特点？》。</p>
<h2>常见追问</h2>
<ul>
<li><code>toSignal</code> 能在组件外调用吗？必须在注入上下文中调用，否则要传入 <code>injector</code> 选项。</li>
<li>同步发出值的 Observable（如 <code>BehaviorSubject</code>）能省略初始值吗？可以设置 <code>requireSync: true</code>，类型中就不会包含 <code>undefined</code>。</li>
</ul>`};export{e as default};