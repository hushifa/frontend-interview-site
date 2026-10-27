var e={answerHtml:`<h2>变化的是通知来源，不是异步任务消失</h2>
<p>依赖 Zone.js 时，Angular 可以借助异步任务拦截安排更广泛的检查；Zoneless 更依赖框架能识别的更新通知。外部回调仍然会执行，但普通字段被修改后，框架不一定知道哪个视图需要重新检查。</p>
<p>项目要先确认 Angular 版本和启动配置。官方版本的默认行为会变化，旧项目也可能显式保留 Zone 配置。不能只看 <code>package.json</code> 是否存在 <code>zone.js</code> 就判断真实运行模式。</p>
<h2>用 Signal 或明确通知连接外部状态</h2>
<p>模板读取的 Signal 发生变化、Angular 管理的事件回调、<code>ComponentRef.setInput</code>、<code>markForCheck</code> 和 <code>AsyncPipe</code> 等都能提供视图更新信号：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-meta">@Component</span>({
  <span class="hljs-attr">selector</span>: <span class="hljs-string">&#x27;app-status&#x27;</span>,
  <span class="hljs-attr">standalone</span>: <span class="hljs-literal">true</span>,
  <span class="hljs-attr">template</span>: <span class="hljs-string">\`&lt;p&gt;{{ status() }}&lt;/p&gt;\`</span>,
})
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">StatusComponent</span> {
  <span class="hljs-keyword">readonly</span> status = <span class="hljs-title function_">signal</span>(<span class="hljs-string">&#x27;等待结果&#x27;</span>);

  <span class="hljs-title function_">receiveExternalResult</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">status</span>.<span class="hljs-title function_">set</span>(value);
  }
}
</code></pre></div>
<p>如果第三方 SDK 只修改普通字段，不能依赖过去的 Zone 行为自动刷新。可以把外部结果写入 Signal，使用 AsyncPipe，或在明确场景调用 <code>ChangeDetectorRef.markForCheck</code>。不要用全局 <code>detectChanges()</code> 到处补洞，它会扩大检查范围并掩盖状态边界。</p>
<h2>OnPush 和 Zoneless 不是一回事</h2>
<p>OnPush 是组件的检查策略，Zoneless 是框架如何获得更新通知。OnPush 的不可变输入、明确状态和局部更新习惯通常有帮助，但不是把所有组件改成 OnPush 就等于启用 Zoneless，也不是必须依赖 OnPush 才能工作。</p>
<p>即使一次点击偶然让旧字段显示出来，也不能证明外部更新路径正确。要确认数据来源、模板读取和通知之间存在稳定关系。</p>
<h2>第三方回调是迁移的主要风险</h2>
<p>图表、编辑器、原生 DOM 监听、WebSocket 和定时器都可能在 Angular 外部回调。逐个检查它们是否把结果交给 Signal、Observable + AsyncPipe 或显式通知，而不是只删除 Zone.js 后观察首页能否打开。</p>
<p>依赖 <code>NgZone.onStable</code> 推断任务结束的旧代码也要重新评估；没有 Zone 时，它不再描述相同的生命周期。<code>runOutsideAngular</code> 也不是唯一的性能边界，先明确哪些状态需要更新，再选择最小通知。</p>
<h2>SSR 和 hydration 还需要管理异步稳定性</h2>
<p>客户端看到更新，不代表服务端在生成 HTML 时等待了同一任务。移除 Zone 后，自定义异步工作不能自动假设会被 SSR 稳定性捕获，需要按 Angular 的 PendingTasks 或框架集成机制登记必须完成的工作。</p>
<p>路由、数据加载和 hydration 有各自的协作协议。要分别测试服务端初始 HTML、客户端接管、异步数据到达和失败恢复，不能用浏览器刷新结果推断 SSR 正确。</p>
<h2>测试不要用手动刷新掩盖缺失通知</h2>
<p>如果每个测试动作后都调用 <code>fixture.detectChanges()</code>，可能让测试通过，但真实页面在缺少通知时不会更新。测试应尽量按实际交互等待可观察结果，只有在需要诊断时才手动触发检查。</p>
<p>迁移还要检查 polyfills、zone testing、假计时器和第三方库要求。去掉 Zone 之前先确认所有运行和测试路径都不再依赖它。Zoneless 能减少不必要的拦截并让更新来源更明确，但不会自动优化昂贵模板、大列表和重复计算，仍需用真实交互和性能数据验证收益。</p>`};export{e as default};