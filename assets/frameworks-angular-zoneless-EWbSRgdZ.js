var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Angular v21 起默认 zoneless；v20 需要在启动时加 <code>provideZonelessChangeDetection()</code>。如果项目中存在 <code>provideZoneChangeDetection()</code>，它会覆盖默认值，恢复 Zone.js 模式。</li>
<li>以下操作会触发变更检测：模板读取的 Signal 被修改、模板或宿主上绑定的事件回调、<code>ChangeDetectorRef.markForCheck()</code>（<code>AsyncPipe</code> 会自动调用）、<code>ComponentRef.setInput()</code>。</li>
<li><code>setTimeout</code>、<code>fetch</code>、第三方库回调中直接修改普通字段，不再自动刷新界面。</li>
<li>Reactive Forms 的 <code>setValue</code>、<code>patchValue</code> 不会自动安排检测，需要配合 Signal 或 <code>markForCheck()</code>。</li>
<li><code>NgZone.onStable</code>、<code>onMicrotaskEmpty</code> 不会再触发；SSR 中需要等待的异步工作要用 <code>PendingTasks</code> 登记。</li>
</ul>
<h2>改写示例</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// Zone.js 模式下能工作，zoneless 下界面不更新</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">ClockComponent</span> {
  time = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>();
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">time</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>()), <span class="hljs-number">1000</span>);
  }
}
</code></pre></div>
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
<h2>迁移步骤</h2>
<ol>
<li>v20 项目在 <code>bootstrapApplication</code> 的 providers 中加入 <code>provideZonelessChangeDetection()</code>。</li>
<li>把在异步回调里修改、并在模板中显示的状态改成 Signal，或在修改后调用 <code>markForCheck()</code>。</li>
<li>推荐组件使用 <code>OnPush</code>，它要求的通知方式与 zoneless 一致，能提前暴露问题；但 <code>OnPush</code> 不是必须的。</li>
<li>从 <code>angular.json</code> 的 <code>build</code> 和 <code>test</code> 目标的 <code>polyfills</code> 中删除 <code>zone.js</code> 和 <code>zone.js/testing</code>，然后卸载 <code>zone.js</code>。</li>
<li>把依赖 <code>onStable</code> 的逻辑改成 <code>afterNextRender</code> 或 <code>afterEveryRender</code>。</li>
</ol>
<h2>SSR 中等待异步任务</h2>
<p>Zone.js 模式下，服务端会等所有宏任务完成再序列化 HTML。zoneless 下需要显式登记：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">PendingTasks</span>, inject } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> tasks = <span class="hljs-title function_">inject</span>(<span class="hljs-title class_">PendingTasks</span>);
tasks.<span class="hljs-title function_">run</span>(<span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">data</span>.<span class="hljs-title function_">set</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">loadData</span>());
});
</code></pre></div>
<p>Router 导航和 <code>HttpClient</code> 请求 Angular 已经自动登记。</p>
<h2>收益</h2>
<ul>
<li>少了 Zone.js 的包体积和对所有异步 API 的补丁。</li>
<li>变更检测只在有明确通知时运行，调用栈更清晰，也不会因为第三方库的频繁回调而反复检测。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>测试有什么变化？<code>TestBed</code> 默认也是 zoneless，依赖 Zone.js 行为的测试需要在 providers 中加 <code>provideZoneChangeDetection()</code>。</li>
<li><code>NgZone.runOutsideAngular</code> 还需要吗？可以保留，它不会造成问题，供仍使用 Zone.js 的应用中的库使用。</li>
</ul>`};export{e as default};