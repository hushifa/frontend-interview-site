var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>依赖注入就是组件不自己 <code>new</code> 服务，而是说“我要一个 <code>AuthService</code>”，由 Angular 去找一个给它。负责找和创建的叫注入器，告诉注入器“这个东西怎么创建”的配置叫 provider。</p>
<p>服务是不是全局只有一个，看 provider 注册在哪一层。写 <code>@Injectable({ providedIn: &#x27;root&#x27; })</code> 就注册在应用根上，全应用共享一个实例，没人用时还能被 tree-shaking 删掉。注册在组件的 <code>providers</code> 里，每个组件实例和它的后代各有一份，组件销毁时服务也销毁。注册在路由的 <code>providers</code> 里，就由这个路由和它的子路由共享。</p>
<p>查找的顺序是：先从当前组件开始，沿着父组件一路往上找元素注入器；找不到再去环境注入器，依次是路由、应用根、平台。都没找到就报错，除非标了可选。</p>
<p>获取依赖推荐用 <code>inject()</code> 函数，它能用在字段初始化、工厂函数和路由守卫里。</p>
</blockquote>
<h2>三种作用域分别是什么样</h2>
<p>先看全局单例和组件级别的写法：</p>
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
<p>如果页面上放了两个 <code>&lt;app-editor&gt;</code>，它们里面的 <code>toolbar</code> 和 <code>canvas</code> 会拿到同一个 <code>EditorState</code> 吗？不会。<code>toolbar</code> 往上找，最先碰到的是自己所在那个编辑器的 <code>providers</code>，所以拿到的是这个编辑器的那份。两个编辑器各有一份，互不影响。</p>
<p>路由级别的写法是这样：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 路由级共享</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">routes</span>: <span class="hljs-title class_">Routes</span> = [
  {
    <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;admin&#x27;</span>,
    <span class="hljs-attr">providers</span>: [<span class="hljs-title class_">AdminApi</span>],
    <span class="hljs-attr">loadChildren</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./admin/routes&#x27;</span>),
  },
];
</code></pre></div>
<p><code>AdminApi</code> 属于这个路由的环境注入器，<code>admin</code> 下面的页面共享一个实例。</p>
<h2>不是类的依赖怎么注入</h2>
<p>配置对象、字符串这类东西没有类可以当标识，就用 <code>InjectionToken</code> 造一个：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-variable constant_">API_BASE</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">InjectionToken</span>&lt;<span class="hljs-built_in">string</span>&gt;(<span class="hljs-string">&#x27;API_BASE&#x27;</span>);

<span class="hljs-title function_">bootstrapApplication</span>(<span class="hljs-title class_">App</span>, {
  <span class="hljs-attr">providers</span>: [{ <span class="hljs-attr">provide</span>: <span class="hljs-variable constant_">API_BASE</span>, <span class="hljs-attr">useValue</span>: <span class="hljs-string">&#x27;https://api.example.com&#x27;</span> }],
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">UserApi</span> {
  <span class="hljs-keyword">private</span> base = <span class="hljs-title function_">inject</span>(<span class="hljs-variable constant_">API_BASE</span>);
}
</code></pre></div>
<p><code>useValue</code> 是直接给一个值。provider 还有几种写法：<code>useClass</code> 换一个实现类，测试时常用；<code>useFactory</code> 根据别的依赖现算出来；<code>useExisting</code> 给已有的依赖起个别名。</p>
<h2>怎样控制查找范围</h2>
<p>默认是一路往上找，<code>inject()</code> 的选项可以改变这个行为：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">optional</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 找不到返回 null</span>
<span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">self</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 只在当前元素注入器找</span>
<span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">skipSelf</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 从父级开始找</span>
<span class="hljs-title function_">inject</span>(<span class="hljs-title class_">Logger</span>, { <span class="hljs-attr">host</span>: <span class="hljs-literal">true</span> }); <span class="hljs-comment">// 查找到宿主组件为止</span>
</code></pre></div>
<h2>容易出错的地方</h2>
<p>第一种是重复注册。一个服务已经写了 <code>providedIn: &#x27;root&#x27;</code>，又在某个组件的 <code>providers</code> 里注册了一次，这个组件下面就会拿到第二个实例。两边的状态不同步，查起来很费劲。</p>
<p>第二种是懒加载路由里注册的服务，在这个路由外面是注入不到的，因为外面的查找路线根本经过不了它。</p>
<p>第三种是 <code>inject()</code> 的调用位置。它只能在注入上下文里调用，也就是构造期间、工厂函数里。在 <code>ngOnInit</code> 或者异步回调里调会报错。特殊场景可以用 <code>runInInjectionContext</code> 处理。</p>
<h2>常见追问</h2>
<p><strong><code>providers</code> 和 <code>viewProviders</code> 有什么区别？</strong></p>
<blockquote>
<p><code>viewProviders</code> 里的服务只对组件自己的模板可见。通过内容投影传进来的子内容，也就是写在组件标签中间的那部分，拿不到它。</p>
</blockquote>
<p><strong>和 Vue 的 provide/inject 像吗？</strong></p>
<blockquote>
<p>像，都是沿着组件树往上找。不同的是 Angular 在组件树之外还有一层环境注入器，而且有类型化的 token 体系。</p>
</blockquote>`};export{e as default};