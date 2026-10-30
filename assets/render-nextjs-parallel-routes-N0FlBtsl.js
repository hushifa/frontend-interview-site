var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如图片流页面，点一张图希望弹出模态框，地址栏变成 <code>/photo/123</code> 方便分享；别人直接打开这个链接，看到的是完整的图片详情页。Next.js App Router 用并行路由加拦截路由来做这件事。</p>
<p>并行路由是在一个布局里同时放几块“插槽”，文件夹用 <code>@</code> 开头，比如 <code>@team</code>、<code>@analytics</code>。插槽会作为 props 传给父布局，每块能独立导航，也能有自己的 loading 和错误界面。插槽不是路由段，不会出现在 URL 里。</p>
<p>拦截路由是在当前布局里加载另一个路由的内容。文件夹名用 <code>(.)</code>、<code>(..)</code>、<code>(..)(..)</code>、<code>(...)</code> 表示同级、上一级、上两级和根目录，按路由段算，不按文件夹层级算。只有站内的客户端导航会被拦截；刷新或者直接访问，渲染的是原本的完整页面。</p>
<p>最容易出问题的是刷新。站内跳转时，匹配不上当前 URL 的插槽会保留原来的内容；刷新后 Next.js 无法恢复这些状态，会渲染插槽里的 <code>default.js</code>，没有就直接 404。所以每个插槽，包括隐式的 <code>children</code>，通常都要准备 <code>default.js</code>。</p>
</blockquote>
<h2>并行路由怎样写</h2>
<p>假设仪表盘要同时显示团队和统计两块。目录里建 <code>app/@team</code> 和 <code>app/@analytics</code>，父布局就会多出两个同名的 props：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Layout</span>(<span class="hljs-params">{
  children,
  team,
  analytics,
}: {
  children: React.ReactNode;
  team: React.ReactNode;
  analytics: React.ReactNode;
}</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      {children}
      {team}
      {analytics}
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p><code>children</code> 也是一个插槽，只是不用建文件夹，<code>app/page.js</code> 就等于 <code>app/@children/page.js</code>。插槽不影响地址，<code>app/@analytics/views</code> 对应的 URL 是 <code>/views</code>。</p>
<p>插槽可以按条件渲染，比如管理员返回 <code>admin</code> 插槽，普通用户返回 <code>user</code> 插槽。官方文档特别提醒：两个插槽都会在服务器上渲染，布局里的条件只决定用户看到哪一块，<code>@admin/page.js</code> 里的数据请求对每个用户都会执行。所以每个插槽的页面里要自己做权限校验。</p>
<p>还有一个限制：插槽和普通页面合起来组成这个路由段的最终页面，所以同一层级的插槽不能有的静态预渲染、有的动态渲染，只要有一个是动态的，同级的都得是动态的。</p>
<h2>刷新以后为什么 404</h2>
<p>插槽在两种导航下表现不同，这是并行路由最容易踩的坑。</p>
<p>站内用 <code>&lt;Link&gt;</code> 跳转是软导航，Next.js 会记住每个插槽当前显示的子页面。跳到 <code>/settings</code> 时，如果 <code>@team</code> 有 <code>settings</code> 页面而 <code>@analytics</code> 没有，<code>@team</code> 换成新页面，<code>@analytics</code> 继续显示原来的内容。</p>
<p>刷新页面是硬导航，Next.js 不知道 <code>@analytics</code> 之前显示什么，于是渲染 <code>@analytics/default.js</code>；如果没有这个文件，整页 404。官方的解释是，这个 404 能避免把并行路由渲染到原本不打算出现的页面上。<code>children</code> 也一样，恢复不了父页面状态时同样需要 <code>default.js</code>。</p>
<h2>用拦截路由做可分享的模态框</h2>
<p>拦截路由的约定类似相对路径 <code>../</code>，只是按路由段计算。<code>@modal</code> 这种插槽文件夹不算路由段，所以 <code>app/@modal/(.)photo/[id]</code> 里的 <code>(.)</code> 指的是和插槽所在位置同级的 <code>photo</code> 路由。</p>
<p>做模态框需要几个文件配合。<code>app/photo/[id]/page.tsx</code> 是完整的详情页；<code>app/@modal/default.tsx</code> 返回 <code>null</code>，保证平时不显示模态框；<code>app/@modal/(.)photo/[id]/page.tsx</code> 把详情内容包在模态框组件里；根布局同时渲染 <code>{modal}</code> 和 <code>{children}</code>。</p>
<p>这样站内点击图片时，<code>/photo/123</code> 被拦截，模态框盖在图片流上；刷新或者直接打开链接，不会发生拦截，显示完整详情页。官方列出的好处是：模态框内容可以通过 URL 分享，刷新后不丢上下文，后退关闭模态框，前进重新打开。</p>
<p>关闭模态框可以调用 <code>router.back()</code>。如果用 <code>&lt;Link&gt;</code> 跳到别的页面，要注意软导航下插槽会保留旧内容，模态框不会自己消失，所以要给插槽准备一个返回 <code>null</code> 的页面，比如 <code>@modal/page.tsx</code> 或者兜底的 <code>@modal/[...catchAll]/page.tsx</code>。</p>
<p>模态框本身的焦点和键盘行为，见<a href="/questions/a11y-dialog/">《一个可访问的模态对话框需要具备哪些行为？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>(..)</code> 有时候和文件夹层级对不上？</strong></p>
<blockquote>
<p>因为它按路由段算，不按文件系统算。<code>@slot</code> 文件夹不是路由段，官方例子里 <code>photo</code> 在文件系统上高两级，但按路由段只高一级，所以写 <code>(..)</code> 就够了。</p>
</blockquote>
<p><strong>并行路由除了模态框还能做什么？</strong></p>
<blockquote>
<p>官方给出的例子有仪表盘同时显示多块内容、按用户角色渲染不同插槽、在插槽里放布局做独立切换的标签页，以及给每块内容单独设置 loading 和错误界面，让它们各自流式加载。</p>
</blockquote>
<p><strong>插槽里的组件能读到当前激活的子路由吗？</strong></p>
<blockquote>
<p>可以用 <code>useSelectedLayoutSegment</code> 或 <code>useSelectedLayoutSegments</code>，传入插槽名作为 <code>parallelRouteKey</code>。比如访问 <code>/login</code> 时，<code>useSelectedLayoutSegment(&#x27;auth&#x27;)</code> 返回 <code>&quot;login&quot;</code>。</p>
</blockquote>`};export{e as default};