var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>@Injectable({ providedIn: &#x27;root&#x27; })</code> 在应用根注入器注册，全应用共享一个实例，并且没有被使用时可以被 tree-shaking 移除。</li>
<li>在组件的 <code>providers</code> 中注册，每个组件实例（及其后代）得到独立的服务实例，组件销毁时服务也销毁。</li>
<li>在路由配置的 <code>providers</code> 中注册，实例属于该路由的环境注入器，供该路由及其子路由共享。</li>
<li>查找顺序：元素注入器（当前组件 → 父组件 → …）→ 环境注入器（路由 → 应用根 → 平台）；都找不到就报错，除非标记为可选。</li>
<li>推荐用 <code>inject()</code> 函数获取依赖，它可以在构造阶段的字段初始化、工厂函数和路由守卫中使用。</li>
</ul>
<h2>三种作用域</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 全局单例</span>
<span class="hljs-meta">@Injectable</span>({ <span class="hljs-attr">providedIn</span>: <span class="hljs-string">&#x27;root&#x27;</span> })
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">AuthService</span> {}

<span class="hljs-comment">// 每个编辑器组件各自一个</span>
<span class="hljs-meta">@Injectable</span>()
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">EditorState</span> {
  <span class="hljs-keyword">readonly</span> dirty = <span class="hljs-title function_">signal</span>(<span class="hljs-literal">false</span>);
}

<span class="hljs-meta">@Component</span>({
  <span class="hljs-attr">selector</span>: <span class="hljs-string">&#x27;app-editor&#x27;</span>,
  <span class="hljs-attr">providers</span>: [<span class="hljs-title class_">EditorState</span>],
  <span class="hljs-attr">template</span>: <span class="hljs-string">\`&lt;app-toolbar /&gt;&lt;app-canvas /&gt;\`</span>,
})
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">EditorComponent</span> {}
</code></pre></div>
<p>页面上有两个 <code>&lt;app-editor&gt;</code> 时，各自的 <code>toolbar</code> 和 <code>canvas</code> 注入的是自己父编辑器的 <code>EditorState</code>，互不影响。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 路由级共享</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">routes</span>: <span class="hljs-title class_">Routes</span> = [
  {
    <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;admin&#x27;</span>,
    <span class="hljs-attr">providers</span>: [<span class="hljs-title class_">AdminApi</span>],
    <span class="hljs-attr">loadChildren</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./admin/routes&#x27;</span>),
  },
];
</code></pre></div>
<h2>注入令牌</h2>
<p>非类的依赖（配置对象、字符串）用 <code>InjectionToken</code>：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-variable constant_">API_BASE</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">InjectionToken</span>&lt;<span class="hljs-built_in">string</span>&gt;(<span class="hljs-string">&#x27;API_BASE&#x27;</span>);

<span class="hljs-title function_">bootstrapApplication</span>(<span class="hljs-title class_">App</span>, {
  <span class="hljs-attr">providers</span>: [{ <span class="hljs-attr">provide</span>: <span class="hljs-variable constant_">API_BASE</span>, <span class="hljs-attr">useValue</span>: <span class="hljs-string">&#x27;https://api.example.com&#x27;</span> }],
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">UserApi</span> {
  <span class="hljs-keyword">private</span> base = <span class="hljs-title function_">inject</span>(<span class="hljs-variable constant_">API_BASE</span>);
}
</code></pre></div>
<p>provider 还可以写成 <code>useClass</code>（替换实现，常用于测试）、<code>useFactory</code>（根据其他依赖创建）、<code>useExisting</code>（别名）。</p>
<h2>查找修饰</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">optional</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 找不到返回 null</span>
<span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">self</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 只在当前元素注入器找</span>
<span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">skipSelf</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 从父级开始找</span>
<span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">host</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 查找到宿主组件为止</span>
</code></pre></div>
<h2>常见问题</h2>
<ul>
<li>在组件 <code>providers</code> 里又注册了一次 <code>providedIn: &#x27;root&#x27;</code> 的服务，会创建第二个实例，导致状态不同步。</li>
<li>懒加载路由中注册的服务，在路由外部注入不到。</li>
<li><code>inject()</code> 只能在注入上下文中调用（构造期间、工厂函数中），在 <code>ngOnInit</code> 或异步回调中调用会报错，可以用 <code>runInInjectionContext</code> 处理特殊场景。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>providers</code> 和 <code>viewProviders</code> 的区别？<code>viewProviders</code> 中的服务只对组件自己的模板可见，通过内容投影传入的子内容拿不到。</li>
<li>和 Vue 的 provide/inject 有什么相似之处？都是沿组件树向上查找，Angular 额外有环境注入器和类型化的 token 体系。</li>
</ul>`};export{e as default};