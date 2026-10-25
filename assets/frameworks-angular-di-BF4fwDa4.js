var e={answerHtml:`<p>依赖注入让使用者声明“需要哪个依赖”，由 injector 按 token 查找 provider 并提供实例。它把对象创建、配置和使用分开，但不意味着所有服务都是全局单例。</p>
<p>同一个 token 在不同层级注册，可以对应不同实例。讨论服务生命周期时，必须同时说明它在哪个 injector 中提供。</p>
<h3>token 是查找身份，provider 是创建规则</h3>
<p>类本身可以作为 token，配置值也可以使用 InjectionToken。TypeScript interface 在运行时不存在，不能直接拿接口类型当作注入身份。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">InjectionToken</span>, <span class="hljs-title class_">Injector</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/core&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">API_URL</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">InjectionToken</span>(<span class="hljs-string">&#x27;API_URL&#x27;</span>);
<span class="hljs-keyword">const</span> parent = <span class="hljs-title class_">Injector</span>.<span class="hljs-title function_">create</span>({
  <span class="hljs-attr">providers</span>: [{ <span class="hljs-attr">provide</span>: <span class="hljs-variable constant_">API_URL</span>, <span class="hljs-attr">useValue</span>: <span class="hljs-string">&#x27;/api&#x27;</span> }],
});
<span class="hljs-keyword">const</span> child = <span class="hljs-title class_">Injector</span>.<span class="hljs-title function_">create</span>({
  parent,
  <span class="hljs-attr">providers</span>: [{ <span class="hljs-attr">provide</span>: <span class="hljs-variable constant_">API_URL</span>, <span class="hljs-attr">useValue</span>: <span class="hljs-string">&#x27;/preview-api&#x27;</span> }],
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(parent.<span class="hljs-title function_">get</span>(<span class="hljs-variable constant_">API_URL</span>)); <span class="hljs-comment">// /api</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(child.<span class="hljs-title function_">get</span>(<span class="hljs-variable constant_">API_URL</span>)); <span class="hljs-comment">// /preview-api</span>
child.<span class="hljs-title function_">destroy</span>();
parent.<span class="hljs-title function_">destroy</span>();
</code></pre></div>
<p>child 提供了同一个 token，查找会使用该层的配置；如果该层没有相应 provider，则可按规则向上寻找。两个描述文字都叫 API_URL 的不同 InjectionToken 对象，也不是同一个 token，描述主要用于诊断。</p>
<p>useValue 提供值，useClass 提供类实例，useFactory 通过工厂创建，useExisting 让一个 token 指向已有 token。useExisting 是别名关系，不应误当成再创建一个独立实例。</p>
<h3>Angular 存在不止一条 injector 层级</h3>
<p>现代 Angular 有环境 injector 层级，以及与元素和组件相关的元素 injector 层级；使用 NgModule 的应用还涉及相应模块组织方式。</p>
<p>应用级、路由级和组件级 provider 的可见范围不同。组件注入时会按 Angular 规定的查找路径解析，不能简单理解成“任何组件都从唯一全局 Map 获取服务”。</p>
<p>self、skipSelf、host、optional 等修饰会改变查找约束或缺失处理。它们应表达明确意图，例如只接受本地 provider，而不是在依赖找不到时随意叠加选项直到不报错。</p>
<h3>组件 providers 会影响状态共享</h3>
<p>如果编辑器组件在 providers 中提供一个草稿服务，那么两个编辑器实例通常各有自己的服务实例。内部后代可以共享对应实例，编辑器销毁时该作用域的资源也应结束。</p>
<p>把服务提供到应用根部则更适合跨页面共享，但它可能存活很久。将每个局部草稿都放进根服务，会让清理和并发编辑更复杂；反过来，在子组件重复提供本应共享的服务，又会得到意外的独立状态。</p>
<p>providers 与 viewProviders 对投影内容等可见范围也有区别。需要向外部投影内容提供依赖时，应按真实组件结构验证，不能只看到模板里嵌套就认定注入关系完全相同。</p>
<h3>inject 需要合法的注入上下文</h3>
<p>inject 可在允许的构造、字段初始化、工厂等上下文使用。它不是任意异步函数都能调用的全局服务定位器；await 之后也不会自动保留之前的注入上下文。</p>
<p>确实需要在指定环境中执行注入逻辑时，可使用相应上下文 API，但其同步边界仍需理解。服务应尽量通过明确依赖工作，而不是在所有工具函数里临时查找全局状态。</p>
<h3>创建可控不等于副作用自动清理</h3>
<p>Angular 销毁相应 injector 时，可以执行所管理实例的销毁钩子等清理，但你启动的任意外部进程或手动持有引用仍需设计生命周期。订阅、事件监听和计时器不能因为服务用了 DI 就被无条件回收。</p>
<p>循环依赖也不会由框架自动变成合理结构；可能需要拆分职责。异步初始化要使用合适的启动或资源机制，不要让依赖注入工厂返回意外的 Promise 后仍把它当同步服务。</p>
<p>DI 的价值是让依赖与作用域可配置、可测试。测试中替换 provider 很方便，但仍要验证真实配置下的层级与共享关系，避免测试使用根服务，而生产组件其实提供了另一份实例。</p>`};export{e as default};