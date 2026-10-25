var e={answerHtml:`<p>Svelte 负责组件，SvelteKit 在其之上组织页面路由、数据加载、服务端处理与部署。理解 SvelteKit 的关键是知道某段代码在哪里运行，以及它的结果是否会被发送给浏览器。</p>
<p>文件名带 server 能限制代码运行环境，但不能让返回值自动保密。服务端读取密钥是可以的，把密钥放进页面数据返回就不是。</p>
<h3>文件路由将页面与数据准备关联</h3>
<p>src/routes 中的 +page.svelte 表示页面，+layout.svelte 提供共享布局，动态目录如 [slug] 表达路由参数。页面需要数据时，可使用相应的 load 文件。</p>
<p>+page.js 或 +layout.js 中的通用 load 可以在服务端首次渲染以及浏览器导航等适用时机执行；+page.server.js 或 +layout.server.js 中的服务端 load 只在服务端运行。</p>
<p>因此通用 load 不能直接读取数据库密钥，也不能因为某次在浏览器运行就假设 window 永远存在。具体执行次数还受 SSR、预渲染、导航和数据失效规则影响，不应按一次开发调试观察概括。</p>
<h3>服务端 load 返回的是页面需要的数据</h3>
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
<p>示例假设服务端认证流程已经设置 locals.user。它只返回页面要展示的字段，不返回会话凭证或完整数据库对象。返回数据会参与页面渲染或客户端获取，因此必须按用户可见数据处理。</p>
<p>locals 本身需要由可信的服务端认证流程建立，不能把客户端传来的任意 userId 原样当作已认证身份。服务端 load 中的权限检查也不能代替所有写接口和 API 路由的独立授权。</p>
<h3>load 重跑取决于依赖，不是每次都全量执行</h3>
<p>SvelteKit 会根据相关参数、URL、数据依赖和显式失效等条件决定哪些 load 重跑。布局级 load 不一定在每次子路由操作时重新执行，不能把只在一个共享布局里的检查当成永久可靠的访问控制。</p>
<p>load 中调用框架提供的 fetch 可以获得相应 SSR 与数据传递集成，但仍需检查状态码、数据结构和权限。请求之间可以并行的工作不要无故串行；await parent 等依赖也可能影响关键路径。</p>
<p>不要在模块全局变量中保存当前用户的数据。服务端模块可能被多个请求共享，错误的共享状态会造成跨用户污染。</p>
<h3>表单 action 与页面读取有不同职责</h3>
<p>服务端 action 适合处理表单 POST，执行输入校验、权限检查和写入，再返回结果或重定向。配合渐进增强时，基础表单仍应有清晰的提交行为，JavaScript 增强用于改善交互。</p>
<p>无论是否使用增强，服务端都必须验证输入。按钮 disabled、前端 schema 或隐藏字段都不是权限边界；重复提交还可能需要幂等处理。</p>
<p>+server.js 可定义 HTTP 端点，适合需要明确响应接口的场景。不要因为 action 与端点都在服务端，就忽略它们的返回语义、缓存和调用方式差异。</p>
<h3>渲染模式最终受部署环境约束</h3>
<p>预渲染适合构建时可确定的页面；按请求 SSR 需要相应运行环境和 adapter；纯客户端模式又有首屏与内容交付上的代价。</p>
<p>静态托管不能直接运行服务端 action 或数据库查询。若希望导出静态站，应确认路由、参数与数据能预先生成，动态功能由现有外部服务承担，而不是把 server 文件一并上传就期待执行。</p>
<p>最后验证直接打开深链接、客户端导航、权限失效、错误页和生产构建。SvelteKit 提供约定降低样板代码，但服务端信任边界和数据生命周期仍由应用设计负责。</p>`};export{e as default};