var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前 Angular 靠 Zone.js 知道什么时候该刷新界面。Zone.js 给 <code>setTimeout</code>、<code>fetch</code>、事件这些异步 API 都打了补丁，任何异步回调跑完，Angular 就做一次变更检测，也就是检查界面要不要更新。Zoneless 就是去掉 Zone.js，改成“有人明确通知才检查”。</p>
<p>Angular v21 起默认就是 zoneless；v20 要在启动时加 <code>provideZonelessChangeDetection()</code>。如果项目里写了 <code>provideZoneChangeDetection()</code>，它会覆盖默认值，回到 Zone.js 模式。</p>
<p>会触发检查的通知有这几种：模板读取的 Signal 被修改；模板或宿主上绑定的事件回调；调用 <code>ChangeDetectorRef.markForCheck()</code>，<code>AsyncPipe</code> 会自动调它；还有 <code>ComponentRef.setInput()</code>。反过来，在 <code>setTimeout</code>、<code>fetch</code> 或第三方库回调里直接改普通字段，界面就不会自动刷新了。</p>
<p>还有几处要注意：Reactive Forms 的 <code>setValue</code>、<code>patchValue</code> 不会自动安排检查，要配合 Signal 或 <code>markForCheck()</code>；<code>NgZone.onStable</code>、<code>onMicrotaskEmpty</code> 不会再触发；SSR 里需要等待的异步工作要用 <code>PendingTasks</code> 登记。</p>
</blockquote>
<h2>为什么界面不更新了</h2>
<p>下面这个时钟在 Zone.js 模式下没问题，换成 zoneless 以后，时间就停住不动了。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// Zone.js 模式下能工作，zoneless 下界面不更新</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">ClockComponent</span> {
  time = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>();
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">time</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>()), <span class="hljs-number">1000</span>);
  }
}
</code></pre></div>
<p><code>this.time</code> 其实每秒都在变，只是没人告诉 Angular。以前 Zone.js 会在 <code>setInterval</code> 回调跑完后自动触发检查，现在没有它了，Angular 不知道要更新。</p>
<p>改法是把 <code>time</code> 换成 Signal。Signal 被修改时会主动通知 Angular：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// zoneless 写法：用 Signal</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Component</span>, <span class="hljs-title class_">DestroyRef</span>, inject, signal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-meta">@Component</span>({ <span class="hljs-attr">selector</span>: <span class="hljs-string">&#x27;app-clock&#x27;</span>, <span class="hljs-attr">template</span>: <span class="hljs-string">\`{{ time() | date: &#x27;mediumTime&#x27; }}\`</span> })
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">ClockComponent</span> {
  <span class="hljs-keyword">readonly</span> time = <span class="hljs-title function_">signal</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>());

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> id = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">time</span>.<span class="hljs-title function_">set</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>()), <span class="hljs-number">1000</span>);
    <span class="hljs-title function_">inject</span>(<span class="hljs-title class_">DestroyRef</span>).<span class="hljs-title function_">onDestroy</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearInterval</span>(id));
  }
}
</code></pre></div>
<p>顺便用 <code>DestroyRef</code> 在组件销毁时清掉定时器，原来的写法漏了这一步。</p>
<h2>迁移分几步</h2>
<ol>
<li>v20 项目在 <code>bootstrapApplication</code> 的 providers 里加 <code>provideZonelessChangeDetection()</code>。</li>
<li>找出在异步回调里修改、又在模板里显示的状态，改成 Signal，或者改完后调用 <code>markForCheck()</code>。</li>
<li>推荐组件用 <code>OnPush</code>。它要求的通知方式和 zoneless 一样，能提前暴露问题，但不是必须的。</li>
<li>从 <code>angular.json</code> 里 <code>build</code> 和 <code>test</code> 目标的 <code>polyfills</code> 中删掉 <code>zone.js</code> 和 <code>zone.js/testing</code>，再卸载 <code>zone.js</code>。</li>
<li>依赖 <code>onStable</code> 的逻辑改用 <code>afterNextRender</code> 或 <code>afterEveryRender</code>。</li>
</ol>
<h2>SSR 怎样知道什么时候渲染完</h2>
<p>服务端渲染要等数据都到了才能输出 HTML。Zone.js 模式下，服务端会等所有宏任务完成再序列化，因为 Zone.js 知道还有哪些任务没完成。zoneless 下没人跟踪这些任务了，需要自己登记：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">PendingTasks</span>, inject } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> tasks = <span class="hljs-title function_">inject</span>(<span class="hljs-title class_">PendingTasks</span>);
tasks.<span class="hljs-title function_">run</span>(<span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">data</span>.<span class="hljs-title function_">set</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">loadData</span>());
});
</code></pre></div>
<p>Router 导航和 <code>HttpClient</code> 请求，Angular 已经自动登记了，不用自己处理。</p>
<h2>换来了什么</h2>
<p>一是少了 Zone.js 的包体积，也不用再给所有异步 API 打补丁。二是变更检测只在有明确通知时运行，调用栈更清楚，第三方库频繁触发回调时也不会跟着反复检测。</p>
<h2>常见追问</h2>
<p><strong>测试有什么变化？</strong></p>
<blockquote>
<p><code>TestBed</code> 默认也是 zoneless。依赖 Zone.js 行为的测试，要在 providers 里加 <code>provideZoneChangeDetection()</code>。</p>
</blockquote>
<p><strong><code>NgZone.runOutsideAngular</code> 还要留着吗？</strong></p>
<blockquote>
<p>不必删。在 zoneless 应用里它不会造成问题。如果你写的是库，被仍在用 Zone.js 的应用引用时，删掉它反而可能拖慢性能。</p>
</blockquote>`};export{e as default};