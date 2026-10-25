var e={answerHtml:`<p>Zoneless Angular 不再依赖 Zone.js 对异步任务的广泛拦截来安排变更检测，而是依靠 Angular 能识别的更新通知。重点不是“异步任务消失了”，而是状态变化需要通过正确机制告诉框架哪些视图可能需要更新。</p>
<p>按当前官方文档，Angular 21 起默认 Zoneless；Angular 20 可通过 provideZonelessChangeDetection 启用。旧项目还可能显式使用基于 Zone 的配置，因此必须先确认项目版本与启动配置，不能只看 package.json 中有没有 zone.js。</p>
<h3>哪些更新能通知 Angular</h3>
<p>模板读取的 Signal 发生更新、绑定的模板或宿主事件回调、ComponentRef.setInput，以及 ChangeDetectorRef.markForCheck 等都是框架能识别的通知来源。AsyncPipe 也会通过相应方式通知视图更新。</p>
<p>这不意味着所有普通字段都不能使用。例如 Angular 管理的点击事件里修改字段，可以伴随事件通知进行检查；但某个外部计时器回调只修改普通字段，不应依赖 Zone.js 过去的行为自动刷新。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Component</span>, signal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-meta">@Component</span>({
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
<p>外部能力回调调用 receiveExternalResult 后，更新的是模板读取的 Signal，Angular 能知道相关视图受影响。若使用普通字段，则需要明确的通知，例如注入 ChangeDetectorRef 后调用 markForCheck，不能只在失败后随意加全局检测。</p>
<h3>OnPush 有帮助，但不等于 Zoneless</h3>
<p>OnPush 控制视图检查策略，Zoneless 改变变更检测的通知来源，二者不是同一个开关。遵循 OnPush 的数据更新习惯通常有利于兼容，但官方并不要求所有组件必须使用 OnPush 才能运行 Zoneless。</p>
<p>输入引用、信号依赖、手动标记和视图树都要一起考虑。即使页面最终某次点击后偶然刷新了旧字段，也不代表之前的外部更新通知设计正确。</p>
<h3>第三方回调是迁移时的重点</h3>
<p>图表、编辑器、原生 DOM 监听或外部 SDK 可能在自己的回调里更新数据。需要检查这些更新是否进入 Signal、AsyncPipe 或显式通知路径，而不是只移除 Zone.js 后看首页能否打开。</p>
<p>依赖 NgZone.onStable 等事件推断任务结束的旧代码也要评估，因为没有 Zone 的运行方式下不能继续假定这些事件描述相同生命周期。runOutsideAngular 也不再是唯一的性能边界设计手段。</p>
<p>另一方面，不必把所有异步代码都包进一个手动刷新函数。先确认数据来源和视图消费方式，使用最小、明确的通知，比到处 detectChanges 更容易推理。</p>
<h3>SSR 稳定性与浏览器刷新不同</h3>
<p>服务端需要知道哪些异步任务必须完成后才能输出。移除 Zone 追踪后，自定义异步工作不能自动假定会被纳入稳定性判断，应按 Angular 提供的 PendingTasks 等机制或相应框架集成管理。</p>
<p>hydration、路由与数据加载有各自协作机制，不能用“客户端看到了更新”推断服务端一定等待了同一任务。需要分别测试服务端初始 HTML 和客户端接管。</p>
<h3>测试不要手动刷新掩盖缺失通知</h3>
<p>如果每次测试操作后都强制 fixture.detectChanges，可能让本来没有通知、真实页面不会更新的代码在测试里通过。测试应尽可能按实际模式等待框架调度和可观察结果，必要时再使用专门诊断手段。</p>
<p>迁移时检查构建与测试的 polyfills、zone.js/testing、假计时器和第三方库要求。去掉依赖之前先确认不再有需要它的运行路径，而不是仅修改一个启动函数。</p>
<p>Zoneless 的收益来自减少不必要的拦截和让更新来源更明确，但不会自动优化昂贵模板、大列表或重复计算。仍要按真实交互测量，并把每个状态变化映射到可靠的通知路径。</p>`};export{e as default};