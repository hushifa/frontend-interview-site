var e={answerHtml:`<h2>先判断代码在哪里运行</h2>
<p><code>+page.svelte</code> 和 <code>+layout.svelte</code> 描述页面与共享布局；<code>+page.js</code>/<code>+layout.js</code> 的通用 load 可能在服务端首次渲染，也可能在浏览器导航时执行；<code>+page.server.js</code>/<code>+layout.server.js</code> 的 load 只在服务端运行。</p>
<p>文件名带 <code>server</code> 能限制运行环境，但不能让返回值自动保密。服务端可以读取数据库密钥，返回到页面的数据却会进入 HTML 或客户端导航响应，必须按用户可见内容处理。</p>
<h2>服务端 load 只返回页面需要的字段</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// src/routes/account/+page.server.js</span>
<span class="hljs-keyword">import</span> { error } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@sveltejs/kit&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">load</span>(<span class="hljs-params">{ locals }</span>) {
  <span class="hljs-keyword">if</span> (!locals.<span class="hljs-property">user</span>) <span class="hljs-title function_">error</span>(<span class="hljs-number">401</span>, <span class="hljs-string">&#x27;请先登录&#x27;</span>);
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">user</span>: {
      <span class="hljs-attr">id</span>: locals.<span class="hljs-property">user</span>.<span class="hljs-property">id</span>,
      <span class="hljs-attr">displayName</span>: locals.<span class="hljs-property">user</span>.<span class="hljs-property">displayName</span>,
    },
  };
}
</code></pre></div>
<p>示例假设可信认证流程已经设置 <code>locals.user</code>，只返回页面需要的字段，不返回会话凭证和完整数据库对象。<code>locals</code> 不能直接信任客户端传来的 userId；每个写接口和 API 端点仍要独立做身份、租户和权限检查。</p>
<p>通用 load 可能在浏览器执行，不能直接读取数据库密钥，也不能假设 <code>window</code> 在所有执行阶段都存在。SSR、预渲染、客户端导航和失效策略会改变执行次数，不能用一次开发调试归纳全部行为。</p>
<h2>load 重跑和缓存不是访问控制</h2>
<p>SvelteKit 会根据路由参数、URL、数据依赖和显式失效决定哪些 load 重跑。父布局的 load 不一定在每次子路由操作时重新执行，因此只在布局里做一次检查不能替代服务端每次请求的授权。</p>
<p>框架提供的 <code>fetch</code> 可能参与 SSR 和数据传递，但仍要检查状态码、返回结构和权限。可以并行的读取不要无故串行，<code>await parent()</code> 也可能把子页面关键路径延后。不要在服务端模块级变量中保存当前用户数据，因为多个请求可能共享同一个进程并造成串户。</p>
<h2>action、端点和渐进增强</h2>
<p>服务端 form action 适合处理表单 POST：解析输入、校验权限、写入数据，然后返回结果或重定向。渐进增强可以改善等待、错误显示和局部更新，但关闭 JavaScript 后基础表单也应有清晰的提交行为。</p>
<p>服务端必须重新校验所有输入。前端 Schema、隐藏字段和 disabled 按钮都不是权限边界；重复提交、网络重试和支付类写操作还需要幂等键。<code>+server.js</code> 更适合明确的 HTTP API，action 和端点有不同的请求、缓存和返回语义，不能只看它们都在服务端。</p>
<h2>部署模式决定哪些能力存在</h2>
<p>预渲染适合构建时可以确定的页面；按请求 SSR 需要支持对应运行时的 adapter；纯客户端模式则承担首屏 HTML 和数据请求成本。静态托管不能直接执行服务端 action、数据库查询和 server load，即使这些文件被上传也不会自动运行。</p>
<p>若目标是静态站，要确认路由和参数能在构建时生成，动态功能由外部 API 提供，并把认证和权限放在受控服务端。不要因为本地开发服务器能执行 server 文件，就认为 GitHub Pages 等静态托管也具备相同能力。</p>
<p>上线前测试直接打开深链接、客户端导航、登录过期、权限变化、错误页、表单重复提交和生产构建。SvelteKit 减少了路由和数据加载样板，但服务端信任边界、返回数据生命周期和部署能力仍由应用负责。</p>`};export{e as default};