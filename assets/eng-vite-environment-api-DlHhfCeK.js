var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个应用部署在 Cloudflare Workers 上，服务端代码在生产环境跑在 workerd 里。可是开发时，Vite 的 SSR 代码是在开发服务器自己的 Node 进程里执行的，Node 有的 API workerd 不一定有，本地正常、上线报错的问题就会出现。</p>
<p>原因是 Vite 5 之前只有两个隐式的环境：<code>client</code>，以及可选的 <code>ssr</code>。一个应用如果同时有浏览器、Node 服务器和边缘服务器三种运行环境，Vite 5 没办法把它们分别表示出来。</p>
<p>Vite 6 引入的 Environment API 让开发服务器能同时管理多个环境。在配置的 <code>environments</code> 里按生产架构声明，比如 <code>server</code> 和 <code>edge</code>，每个环境可以有自己的解析规则和构建选项，连接自己的运行时；浏览器以外的环境由 ModuleRunner 去取转换后的代码来执行，workerd 环境本地可以接 miniflare。</p>
<p>要注意，普通 SPA 不需要改任何配置，顶层选项默认就作用在 <code>client</code> 环境上。这套 API 主要给框架作者、插件作者和运行时提供方用。官方文档写明它整体处于候选发布阶段，部分 API 仍是实验性的，稳定前可能有破坏性变更。</p>
</blockquote>
<h2>以前的 SSR 为什么和生产对不上</h2>
<p>Vite 开发 SSR 应用时，浏览器那边直接用原生 ES 模块加载转换后的代码，服务端那边则在 Vite 开发服务器所在的 Node 进程里执行。如果生产服务器也是 Node，这没什么问题。</p>
<p>可是现在很多服务端代码跑在别的运行时里，官方文档举的例子是 Cloudflare 的 workerd，它的限制和 Node 不一样。还有的应用前端在浏览器、一部分接口在 Node、一部分在边缘节点。Vite 5 只能区分“客户端”和“SSR”两类，开发环境模拟不出这种结构。</p>
<p>Vite 自己为什么开发时快、生产时还要打包，见<a href="/questions/eng-vite/">《Vite 开发模式为什么启动快，生产环境为什么仍需要构建？》</a>。</p>
<h2>怎样声明多个环境</h2>
<p>普通 SPA 或多页应用不用动配置，顶层的 <code>build</code>、<code>resolve</code> 等选项会自动应用到 <code>client</code> 环境。需要多个运行环境时，在 <code>environments</code> 里声明：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">build</span>: {
    <span class="hljs-attr">sourcemap</span>: <span class="hljs-literal">false</span>,
  },
  <span class="hljs-attr">optimizeDeps</span>: {
    <span class="hljs-attr">include</span>: [<span class="hljs-string">&#x27;lib&#x27;</span>],
  },
  <span class="hljs-attr">environments</span>: {
    <span class="hljs-attr">server</span>: {},
    <span class="hljs-attr">edge</span>: {
      <span class="hljs-attr">resolve</span>: {
        <span class="hljs-attr">noExternal</span>: <span class="hljs-literal">true</span>,
      },
    },
  },
};
</code></pre></div>
<p>这里有一个读者会疑惑的地方：顶层的 <code>build.sourcemap</code> 会不会影响 <code>server</code> 和 <code>edge</code>？会。声明的环境默认继承顶层选项，所以 <code>server</code> 和 <code>edge</code> 都不生成 sourcemap，<code>edge</code> 另外把所有依赖打进包里。但有少数选项不继承，比如 <code>optimizeDeps</code> 只作用于客户端，因为依赖预构建是给浏览器用的。官方建议客户端的配置仍然写在顶层，不要写进 <code>environments.client</code>。</p>
<p>开发时 <code>client</code> 和名为 <code>ssr</code> 的服务端环境总是存在；构建时，只有配置了 <code>environments.ssr</code> 或 <code>build.ssr</code> 才会有 <code>ssr</code> 环境。顶层的 <code>ssr</code> 选项计划在 API 稳定后废弃。</p>
<h2>多个环境在开发服务器里怎样运行</h2>
<p>所有环境共用同一个 HTTP 服务器、中间件、解析后的配置和插件流水线，但每个环境连接自己的运行时。浏览器直接导入客户端代码；其他环境用 ModuleRunner，由它向开发服务器取回转换后的模块再执行。</p>
<p>这样，Cloudflare 的 Vite 插件这类运行时提供方就可以提供一个自定义环境，在本地用 miniflare 跑 workerd，开发时就能拿到和生产一致的 API 限制。插件在处理模块时，也能知道当前在为哪个环境转换，按环境输出不同的代码。Vite 插件钩子本身的作用见<a href="/questions/engineering-vite-plugin/">《Vite 插件的 resolveId、load 和 transform 分别做什么？》</a>。</p>
<h2>常见追问</h2>
<p><strong>写业务应用需要马上迁移到 Environment API 吗？</strong></p>
<blockquote>
<p>不需要。官方文档明确说暂不推荐切换，原有的服务端 API 和 Vite 5 保持向后兼容，简单应用也不需要新配置。通常是框架或部署平台的插件在背后用它，比如 React Router v8 的 framework mode 就默认启用了 Vite Environment API。</p>
</blockquote>
<p><strong>ModuleRunner 和以前的 <code>ssrLoadModule</code> 是什么关系？</strong></p>
<blockquote>
<p>都是在服务端环境里加载转换后的模块。官方文档提到，SSR 计划改为基于 ModuleRunner API，ModuleRunner 可以在不同的运行时里执行，而不只是 Vite 自己的 Node 进程。</p>
</blockquote>
<p><strong><code>client</code> 环境的配置为什么建议写在顶层？</strong></p>
<blockquote>
<p>因为顶层选项本来就作用于 <code>client</code>，而且会被其他环境继承。写在顶层，SPA 的配置方式和以前一样，多环境时也只需要在 <code>environments</code> 里写各环境的差异。</p>
</blockquote>`};export{e as default};