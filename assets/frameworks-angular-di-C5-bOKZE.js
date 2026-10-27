var e={answerHtml:`<h2>“注入一个服务”不等于全局单例</h2>
<p>调用方只声明需要某个 token，Injector 根据 provider 决定用什么值、类或工厂创建实例。同一个 token 在不同 injector 中注册，可以得到不同实例。因此讨论生命周期时必须同时说明“在哪里提供”。</p>
<p>类可以作为 token，配置值通常使用 <code>InjectionToken</code>；TypeScript interface 在运行时不存在，不能直接作为注入身份：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-variable constant_">API_URL</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">InjectionToken</span>&lt;<span class="hljs-built_in">string</span>&gt;(<span class="hljs-string">&#x27;API_URL&#x27;</span>);

<span class="hljs-keyword">const</span> parent = <span class="hljs-title class_">Injector</span>.<span class="hljs-title function_">create</span>({
  <span class="hljs-attr">providers</span>: [{ <span class="hljs-attr">provide</span>: <span class="hljs-variable constant_">API_URL</span>, <span class="hljs-attr">useValue</span>: <span class="hljs-string">&#x27;/api&#x27;</span> }],
});
<span class="hljs-keyword">const</span> child = <span class="hljs-title class_">Injector</span>.<span class="hljs-title function_">create</span>({
  parent,
  <span class="hljs-attr">providers</span>: [{ <span class="hljs-attr">provide</span>: <span class="hljs-variable constant_">API_URL</span>, <span class="hljs-attr">useValue</span>: <span class="hljs-string">&#x27;/preview-api&#x27;</span> }],
});

child.<span class="hljs-title function_">get</span>(<span class="hljs-variable constant_">API_URL</span>);  <span class="hljs-comment">// /preview-api</span>
parent.<span class="hljs-title function_">get</span>(<span class="hljs-variable constant_">API_URL</span>); <span class="hljs-comment">// /api</span>
</code></pre></div>
<p>子 injector 找到自己的 provider 就使用它；没有时才按规则向上查找。两个描述文字相同但由不同 <code>InjectionToken</code> 创建的对象，也不是同一个 token。</p>
<p><code>useValue</code>、<code>useClass</code>、<code>useFactory</code> 和 <code>useExisting</code> 分别表达值、创建类、工厂创建和别名关系。<code>useExisting</code> 不会再创建一个独立实例。</p>
<h2>Angular 有多种作用域边界</h2>
<p>现代 Angular 同时存在环境 injector 和元素/组件相关的 injector；路由、应用和组件可以在不同层级提供依赖。组件查找不是从一个全局 Map 直接取值，<code>self</code>、<code>skipSelf</code>、<code>host</code> 和 <code>optional</code> 等修饰符还会改变查找范围或缺失行为。</p>
<p>这些选项应表达明确意图：例如只接受当前组件的本地 provider，或允许可选依赖缺失。为了消除错误而随意加 <code>optional</code>，会把配置问题变成运行时的空值问题。</p>
<h2>Provider 位置决定状态是否共享</h2>
<p>编辑器组件在自身 <code>providers</code> 中提供草稿服务时，两个编辑器实例通常各自拥有一份状态，后代组件可以共享该实例；组件销毁时，这个作用域的订阅和资源应结束。</p>
<p>应用根级服务适合登录、全局配置和跨页面缓存，但可能存活很久。把每个局部草稿都放到根服务，会增加清理、并发和账号切换复杂度；反过来，把本应跨页面共享的服务放进组件 providers，又会产生意外的独立状态。</p>
<p><code>providers</code> 与 <code>viewProviders</code> 对投影内容的可见范围不同。遇到内容投影、路由组件和动态组件时，应按真实树结构验证，而不是只凭模板嵌套关系猜测。</p>
<h2><code>inject()</code> 需要合法的注入上下文</h2>
<p><code>inject()</code> 可以在构造、字段初始化、工厂和允许的注入上下文使用，但不是任意异步函数里的全局服务定位器。<code>await</code> 之后不会自动保留之前的上下文。需要在指定环境运行时，应使用对应的上下文 API，并明确同步边界。</p>
<p>服务和工具函数优先通过显式参数或构造依赖工作，不要在任意函数中偷偷查找全局状态。这样更容易测试，也更容易看出依赖属于哪个作用域。</p>
<h2>销毁 injector 不会回收所有外部资源</h2>
<p>Injector 销毁时可以执行它管理的实例清理，但订阅、DOM 监听器、计时器、Worker、WebSocket 和手动持有的引用仍需要明确释放。依赖注入负责创建和组织，不会自动取消所有外部副作用。</p>
<p>异步初始化要使用适合的启动和资源机制，不能让工厂返回 Promise 却让调用方把它当同步服务。循环依赖也不会因为 DI 存在就变成合理结构，通常需要拆分职责。</p>
<p>测试时替换 provider 很方便，但要同时验证真实配置下的层级和实例共享。测试用了根服务而生产组件提供了局部服务，可能会让测试误以为状态是共享的。</p>`};export{e as default};