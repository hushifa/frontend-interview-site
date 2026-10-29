var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Signal 和 Observable 描述的是两种东西。Signal 是“现在的值”，任何时候都有值，读取是同步的。Observable 是“一串陆续到来的事件”，可能还一个值都没有，也可能已经结束或者出错了。</p>
<p>两者可以互转。<code>toSignal(obs$)</code> 会订阅 Observable，把最新的值变成 Signal，组件销毁时自动取消订阅。第一个值到达之前，这个 Signal 的值是 <code>undefined</code>，可以用 <code>initialValue</code> 给一个初始值。反过来，<code>toObservable(sig)</code> 在 Signal 变化后发出新值，方便接上 <code>debounceTime</code>、<code>switchMap</code> 这些操作符。</p>
<p>所以分工是：要防抖、取消上一次请求、合并多个事件流，用 RxJS；表示界面状态和派生值，用 Signal 更简单。</p>
<p>有一点要注意，Observable 出错以后，读取 <code>toSignal</code> 得到的 Signal 会抛错，所以要在管道里用 <code>catchError</code> 处理掉。</p>
</blockquote>
<h2>一个搜索框把两者串起来</h2>
<p>搜索框是最典型的场景：输入是界面状态，适合 Signal；防抖、取消旧请求是流的处理，适合 RxJS；结果又要给模板用，再转回 Signal。</p>
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
<p>用户连续输入时，<code>debounceTime(300)</code> 等他停下 300 毫秒才往下走。新的查询到来时，<code>switchMap</code> 会取消上一次还没完成的请求，所以慢回来的旧结果不会覆盖新结果。<code>initialValue: []</code> 让模板在第一次请求完成前也能直接遍历，不用处理 <code>undefined</code>。</p>
<p>这里最容易写错的是 <code>catchError</code> 的位置。它写在 <code>switchMap</code> 里面、单个请求的后面。如果放到外层管道上，一次请求出错，整条流就结束了，之后用户再怎么输入都不会触发搜索。放在里面，出错的只是这一次请求，换成空数组，外面的流继续工作。</p>
<h2>订阅什么时候需要手动清理</h2>
<p><code>toSignal</code> 和模板里的 <code>async</code> 管道都会自动取消订阅。自己写 <code>subscribe</code> 的时候，就要用 <code>takeUntilDestroyed()</code>，让订阅在组件销毁时结束：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-variable language_">this</span>.<span class="hljs-property">socket</span>.<span class="hljs-property">messages$</span>.<span class="hljs-title function_">pipe</span>(<span class="hljs-title function_">takeUntilDestroyed</span>()).<span class="hljs-title function_">subscribe</span>(<span class="hljs-function">(<span class="hljs-params">m</span>) =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">messages</span>.<span class="hljs-title function_">update</span>(<span class="hljs-function">(<span class="hljs-params">l</span>) =&gt;</span> [...l, m]));
</code></pre></div>
<p>在构造期间调用时它不需要参数；在别的地方调用，要传入 <code>DestroyRef</code>。</p>
<h2>只是按参数请求一次数据时</h2>
<p>如果需求只是“参数变了就重新请求”，不需要防抖这类流处理，可以直接用 Angular 的 <code>resource</code> 或 <code>rxResource</code>。它们把参数 Signal 和异步加载结合在一起，不用手动来回转换，详见<a href="/questions/framework-angular/">《Angular Signals 的依赖追踪与 computed 有什么特点？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>toSignal</code> 能在组件外调用吗？</strong></p>
<blockquote>
<p>它要在注入上下文里调用，因为要靠注入上下文知道什么时候自动取消订阅。在别的地方调用，需要通过 <code>injector</code> 选项传一个注入器进去。</p>
</blockquote>
<p><strong>像 <code>BehaviorSubject</code> 这种同步就有值的 Observable，能省略初始值吗？</strong></p>
<blockquote>
<p>可以，设置 <code>requireSync: true</code>。这样 Signal 的类型里就不会带 <code>undefined</code>。</p>
</blockquote>`};export{e as default};