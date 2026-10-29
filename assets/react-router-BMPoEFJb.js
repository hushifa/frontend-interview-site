var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在后台系统里从“订单”点到“设置”，浏览器地址从 <code>/dashboard/orders</code> 变成 <code>/dashboard/settings</code>，页面没有刷新，只有中间的内容换了。这就是 React Router 做的事：它监听地址变化，拿当前 URL 去和路由配置逐层匹配，再把匹配到的组件按父子关系渲染出来，子路由显示在父组件的 <code>&lt;Outlet /&gt;</code> 位置。</p>
<p>它不需要刷新页面，是因为底层用的是浏览器的 History API。点击 <code>&lt;Link&gt;</code> 时，React Router 拦下默认跳转，改写地址，再重新匹配和渲染。地址本身怎么变、服务器为什么要配回退，是<a href="/questions/state-hash-history/">《hash 路由和 history 路由的原理是什么？服务器要怎样配置回退？》</a>讲的内容。</p>
<p>当前版本是 v8（写作时为 8.5.1），文档把用法分成声明式、数据和框架三种模式，后一种在前一种的基础上加功能。路由守卫在数据模式里推荐写在 <code>middleware</code> 或 <code>loader</code> 里，没登录就 <code>throw redirect(&quot;/login&quot;)</code>，这样组件根本不会渲染。懒加载用路由对象的 <code>lazy</code> 属性，进入这个路由时才去加载组件和 loader。</p>
<p>要注意版本差别。v8 移除了 <code>react-router-dom</code> 包，改从 <code>react-router</code> 导入，DOM 专用的 API 从 <code>react-router/dom</code> 导入；还要求 React 19.2.7 以上。老项目里常见的写法和 v6 文章不一定适用。</p>
</blockquote>
<h2>路由是怎样匹配和渲染的</h2>
<p>先看声明式模式的写法，它最接近“路由就是一组组件”的直觉。下面这段配置要看父子路由是怎么拼成 URL 的：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">BrowserRouter</span>, <span class="hljs-title class_">Routes</span>, <span class="hljs-title class_">Route</span>, <span class="hljs-title class_">Outlet</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-router&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Dashboard</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>后台<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Outlet</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}

<span class="hljs-title function_">createRoot</span>(root).<span class="hljs-title function_">render</span>(
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">BrowserRouter</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">Routes</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Route</span> <span class="hljs-attr">path</span>=<span class="hljs-string">&quot;dashboard&quot;</span> <span class="hljs-attr">element</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">Dashboard</span> /&gt;</span>}&gt;
        <span class="hljs-tag">&lt;<span class="hljs-name">Route</span> <span class="hljs-attr">index</span> <span class="hljs-attr">element</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">Home</span> /&gt;</span>} /&gt;
        <span class="hljs-tag">&lt;<span class="hljs-name">Route</span> <span class="hljs-attr">path</span>=<span class="hljs-string">&quot;settings&quot;</span> <span class="hljs-attr">element</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">Settings</span> /&gt;</span>} /&gt;
      <span class="hljs-tag">&lt;/<span class="hljs-name">Route</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">Routes</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">BrowserRouter</span>&gt;</span></span>,
);
</code></pre></div>
<p>为什么 <code>settings</code> 前面不用写 <code>/dashboard</code>？因为子路由的路径会自动带上父路由的路径，这段配置同时生成了 <code>/dashboard</code> 和 <code>/dashboard/settings</code> 两个地址。访问 <code>/dashboard/settings</code> 时，React Router 从外往里匹配，先命中 <code>Dashboard</code>，再命中 <code>Settings</code>，然后把 <code>Settings</code> 渲染进 <code>Dashboard</code> 里的 <code>&lt;Outlet /&gt;</code>。<code>index</code> 路由是父路径本身被访问时显示的默认子页面。</p>
<p>所以“原理”可以拆成三步：监听地址变化，按配置逐层匹配，再按嵌套关系渲染。切换页面时外层的 <code>Dashboard</code> 保持不动，只有 <code>Outlet</code> 里的内容被替换。</p>
<h2>三种模式有什么区别</h2>
<p>React Router 文档把它称为多策略路由，三种模式的功能是叠加的。声明式模式用 <code>&lt;BrowserRouter&gt;</code>、<code>&lt;Routes&gt;</code>、<code>&lt;Route&gt;</code>，只负责匹配和渲染。数据模式用 <code>createBrowserRouter</code> 和 <code>&lt;RouterProvider&gt;</code>，在路由对象上加了 <code>loader</code>、<code>action</code>、<code>middleware</code> 等，数据加载和路由放在一起。框架模式在数据模式外面加了 Vite 插件，提供类型安全、自动代码分割以及 SPA、SSR、静态渲染等策略。</p>
<p>面试时讲守卫和懒加载，用数据模式最清楚，因为官方给这两件事提供了专门的位置。</p>
<h2>路由守卫写在哪里</h2>
<p>很多老写法是在组件里判断登录状态，没登录就渲染一个跳转。这样组件已经开始渲染，可能先闪一下页面或发出请求。数据模式下可以把判断提前到渲染之前。下面要看 <code>authMiddleware</code> 挂在哪一层：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createBrowserRouter, createContext, redirect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-router&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">RouterProvider</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-router/dom&#x27;</span>;

<span class="hljs-keyword">const</span> userContext = <span class="hljs-title function_">createContext</span>();

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">authMiddleware</span>(<span class="hljs-params">{ context }</span>) {
  <span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getCurrentUser</span>();
  <span class="hljs-keyword">if</span> (!user) {
    <span class="hljs-keyword">throw</span> <span class="hljs-title function_">redirect</span>(<span class="hljs-string">&#x27;/login&#x27;</span>);
  }
  context.<span class="hljs-title function_">set</span>(userContext, user);
}

<span class="hljs-keyword">const</span> router = <span class="hljs-title function_">createBrowserRouter</span>([
  {
    <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/&#x27;</span>,
    <span class="hljs-title class_">Component</span>: <span class="hljs-title class_">Root</span>,
    <span class="hljs-attr">children</span>: [
      {
        <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;dashboard&#x27;</span>,
        <span class="hljs-attr">middleware</span>: [authMiddleware],
        <span class="hljs-attr">loader</span>: dashboardLoader,
        <span class="hljs-title class_">Component</span>: <span class="hljs-title class_">Dashboard</span>,
      },
      { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;login&#x27;</span>, <span class="hljs-title class_">Component</span>: <span class="hljs-title class_">Login</span> },
    ],
  },
]);
</code></pre></div>
<p>为什么用 <code>throw</code> 而不是 <code>return</code>？因为抛出 <code>redirect</code> 会中断这次导航，后面的 loader 和组件都不会执行，直接转到 <code>/login</code>。<code>middleware</code> 挂在 <code>dashboard</code> 上，它下面的所有子路由都会先经过这道检查，不用每个页面各写一遍。检查通过后把用户存进 <code>context</code>，后面的 loader 可以直接读，不用再请求一次。</p>
<p>文档说明，客户端 middleware 在每次客户端导航时都会运行，不管这个路由有没有 loader。在 v7 里 middleware 需要打开 <code>future.v8_middleware</code> 开关，v8 起成为默认行为。如果项目还没用 middleware，也可以在 <code>loader</code> 开头做同样的判断并 <code>throw redirect</code>。</p>
<p>前端守卫只是体验层面的拦截，用户能改前端代码绕过它。真正的权限要由接口校验，这一点见<a href="/questions/design-permission/">《前端权限控制怎样设计路由、按钮和接口三层？》</a>。</p>
<h2>懒加载怎样写</h2>
<p>路由对象的 <code>lazy</code> 属性返回一个 Promise，进入这个路由时才执行。下面要看组件和 loader 是怎样一起加载的：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">createBrowserRouter</span>([
  {
    <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/app&#x27;</span>,
    <span class="hljs-attr">lazy</span>: <span class="hljs-title function_">async</span> () =&gt; {
      <span class="hljs-keyword">const</span> [<span class="hljs-title class_">Component</span>, loader] = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
        <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./app&#x27;</span>),
        <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./app-loader&#x27;</span>),
      ]);
      <span class="hljs-keyword">return</span> { <span class="hljs-title class_">Component</span>, loader };
    },
  },
]);
</code></pre></div>
<p>为什么不直接用 <code>React.lazy</code>？<code>React.lazy</code> 只能延迟加载组件，组件渲染出来以后才开始请求数据，形成“先下代码、再请求数据”的瀑布。<code>lazy</code> 属性能把 loader 也放进来，两份代码并行下载，下载完先跑 loader 再渲染。打包工具会把 <code>import()</code> 的模块拆成单独的文件，拆分的原理见<a href="/questions/engineering-lazy/">《代码分割与懒加载适合哪些场景？》</a>。</p>
<p>只用声明式模式、不用数据路由时，可以像普通 React 组件一样用 <code>React.lazy</code> 配合 <code>&lt;Suspense&gt;</code> 包住 <code>element</code>。<code>Route</code> 组件的 API 文档里虽然列出了 <code>lazy</code> 属性，但它和 <code>loader</code> 一样属于数据路由的功能，声明式模式下用不上。</p>
<h2>常见追问</h2>
<p><strong><code>&lt;Navigate&gt;</code> 组件和 <code>useNavigate</code> 怎么选？</strong></p>
<blockquote>
<p>官方文档说 <code>&lt;Navigate&gt;</code> 是给类组件用的，因为类组件里不能调用 Hook，并建议优先用 <code>useNavigate</code>。如果要在渲染前拦截，数据模式下更推荐在 middleware 或 loader 里 <code>throw redirect</code>。</p>
</blockquote>
<p><strong>v6 项目升级到 v8 要注意什么？</strong></p>
<blockquote>
<p>官方路径是先升级到 v7 的最新版本，逐个打开 <code>future.v8_*</code> 开关并修好问题，再升到 v8。v8 要求 Node 22.22 以上和 React 19.2.7 以上，并移除了 <code>react-router-dom</code>，导入改成 <code>react-router</code> 和 <code>react-router/dom</code>。</p>
</blockquote>
<p><strong>路由切换时页面状态为什么会保留或丢失？</strong></p>
<blockquote>
<p>父路由组件在子路由切换时不会卸载，所以它的状态会保留；<code>Outlet</code> 里换成另一个组件，旧组件就卸载了，状态也跟着没了。同一个组件只是参数变了，比如 <code>/user/1</code> 到 <code>/user/2</code>，组件不会卸载，需要依赖参数重新取数据。</p>
</blockquote>`};export{e as default};