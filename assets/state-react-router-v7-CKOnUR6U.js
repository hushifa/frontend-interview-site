var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 Remix v2 项目升级，官方给的路线不是升到 Remix v3，而是改成 React Router v7：把 <code>@remix-run/*</code> 依赖换成 <code>react-router</code>，Vite 插件从 <code>remix()</code> 换成 <code>reactRouter()</code>。因为 Remix 团队在 2024 年宣布，原计划的 Remix v3 改为 React Router v7 发布。</p>
<p>原因是 Remix 一直只是 React Router 上面的一层，路由、loader、action 这些核心能力早就放进了 React Router，剩下的这层越来越薄，干脆合并。</p>
<p>合并以后，React Router 有三种模式，功能逐层叠加。declarative mode 就是熟悉的 <code>&lt;BrowserRouter&gt;</code>，只管 URL 匹配和导航；data mode 用 <code>createBrowserRouter</code> 把路由配置移到 React 渲染之外，加上 loader、action 和 pending 状态；framework mode 再用 Vite 插件包一层，提供类型安全的路由模块、按路由拆分代码，以及 SPA、SSR、静态渲染几种策略。framework mode 就是原来 Remix 提供的那套框架能力。</p>
<p>要注意两点。第一，Remix 这个名字没有消失，团队 2025 年宣布 Remix 3 会走新路线，不再依赖 React，起点是 Preact 的一个分支，所以“Remix 3”和 React Router v7 是两回事。第二，React Router 已经发布 v8，framework mode 还在，但要求 Vite 7 并默认启用 Vite Environment API 等变更。</p>
</blockquote>
<h2>为什么 Remix 会并进 React Router</h2>
<p>Remix 官方博客的说法是：Remix 一直只是 React Router 之上的一层。团队先把 Remix 的数据加载模式搬进 React Router（就是 v6.4 的 data router），后来又让 Remix 更多地直接依赖 React Router。到最后 Remix 自己的代码只剩很薄一层，所以决定去掉它，把原定的 Remix v3 作为 React Router v7 发布。</p>
<p>所以理解这件事的关键是：Remix 用户升级到 React Router v7，拿到的还是同一套框架能力，只是包名换了。官方说，在开启所有 future flag、并且已经用 Vite 的前提下，升级除了改 import 基本没有破坏性变更。</p>
<h2>三种模式分别是什么</h2>
<p>用哪种模式，取决于入口用的是哪个顶层路由 API。</p>
<p>declarative mode 写法和以前一样，只提供 URL 匹配、导航和激活状态，比如 <code>&lt;Link&gt;</code>、<code>useNavigate</code>、<code>useLocation</code>：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">BrowserRouter</span>&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>
&lt;/<span class="hljs-title class_">BrowserRouter</span>&gt;
</code></pre></div>
<p>data mode 把路由配置移到 React 渲染之外，于是可以在渲染前加载数据：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> router = <span class="hljs-title function_">createBrowserRouter</span>([
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/&#x27;</span>, <span class="hljs-title class_">Component</span>: <span class="hljs-title class_">Root</span>, <span class="hljs-attr">loader</span>: loadRootData },
]);
root.<span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">RouterProvider</span> <span class="hljs-attr">router</span>=<span class="hljs-string">{router}</span> /&gt;</span></span>);
</code></pre></div>
<p>framework mode 在 data mode 外面包了一个 Vite 插件。路由写在 <code>app/routes.ts</code> 里，每个路由模块导出 <code>loader</code>、组件等，插件会生成对应的类型：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">Route</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./+types/product&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loader</span>(<span class="hljs-params">{ params }: <span class="hljs-title class_">Route</span>.<span class="hljs-title class_">LoaderArgs</span></span>) {
  <span class="hljs-keyword">const</span> product = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getProduct</span>(params.<span class="hljs-property">pid</span>);
  <span class="hljs-keyword">return</span> { product };
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Product</span>(<span class="hljs-params">{ loaderData }: <span class="hljs-title class_">Route</span>.<span class="hljs-title class_">ComponentProps</span></span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span>&gt;</span>{loaderData.product.name}<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>;
}
</code></pre></div>
<p><code>loaderData</code> 的类型直接从 <code>loader</code> 的返回值推出来，不用手写。<code>&lt;Links&gt;</code>、<code>&lt;Meta&gt;</code>、<code>&lt;Scripts&gt;</code>、<code>&lt;ServerRouter&gt;</code> 和 <code>&lt;Link prefetch&gt;</code> 这些 API 只有 framework mode 才有，因为它们需要构建工具知道每个路由对应哪些资源。</p>
<h2>该选哪种模式</h2>
<p>官方文档的建议很直接：每种模式都支持任何架构和部署目标，问题不是要不要 SSR，而是有多少事想自己做。</p>
<p>想直接用 React 做一个应用、拿不准要不要服务端渲染、或者在和 Next.js 之类的框架做比较、从 Next.js 迁移过来，选 framework mode。想要 loader、action 这些数据能力，但打包、数据层、服务端都想自己控制，或者 v6.4 起就在用 data router，选 data mode。只想把 React Router 当最简单的路由库用，或者数据层自己处理 pending 状态，选 declarative mode。</p>
<p>路由守卫和懒加载这类通用话题，见<a href="/questions/react-router/">《React Router 的原理是什么？怎样做路由守卫和懒加载？》</a>。</p>
<h2>Remix v2 怎样升级</h2>
<p>官方升级指南的主要步骤是：先开启 Remix v2 所有 future flag；运行社区提供的 codemod <code>npx codemod remix/2/react-router/upgrade</code>；把 <code>@remix-run/react</code>、<code>@remix-run/server-runtime</code> 等共享 API 改为从 <code>react-router</code> 导入，运行时相关的包改成 <code>@react-router/node</code>、<code>@react-router/cloudflare</code> 等；<code>vite.config.ts</code> 里的 <code>remix()</code> 换成 <code>@react-router/dev/vite</code> 的 <code>reactRouter()</code>；路由改在 <code>app/routes.ts</code> 里声明，原来的配置挪到 <code>react-router.config.ts</code>；入口文件里的 <code>RemixServer</code> 和 <code>RemixBrowser</code> 换成 <code>ServerRouter</code> 和 <code>HydratedRouter</code>。</p>
<h2>常见追问</h2>
<p><strong>Remix 3 是 React Router v7 的下一个版本吗？</strong></p>
<blockquote>
<p>不是。React Router v7 承接的是原来的 Remix v2 用户。Remix 团队 2025 年 5 月的博客说，新的 Remix 不会有关键依赖，连 React 都不依赖，起点是 Preact 的一个分支，并要构建自己的组件模型。</p>
</blockquote>
<p><strong>从 v7 升到 v8，framework mode 要改什么？</strong></p>
<blockquote>
<p>v8 要求 Node 22.22 以上、React 19.2.7 以上，framework mode 还要求 Vite 7。v7 的几个 future flag 变成默认行为，比如中间件、按路由拆分客户端模块、使用 Vite Environment API。另外 <code>react-router-dom</code> 包被移除，DOM 相关的 API 从 <code>react-router/dom</code> 导入。官方建议在 v7 上把 flag 一个个打开、每步提交上线，再升 v8。</p>
</blockquote>
<p><strong>data mode 能做服务端渲染吗？</strong></p>
<blockquote>
<p>能。官方说每种模式都支持任何架构和部署目标，区别在于 framework mode 把 SSR、代码拆分和类型生成都配好了，data mode 要自己处理打包和服务端这部分。</p>
</blockquote>`};export{e as default};