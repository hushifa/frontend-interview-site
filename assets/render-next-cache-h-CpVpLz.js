var e={answerHtml:`<h2>简答</h2>
<p>Next.js App Router 有四层缓存：Data Cache 缓存 fetch 结果，跨请求持久；Full Route Cache 在构建时缓存静态路由的 HTML 和 RSC 载荷；客户端 Router Cache 缓存导航过程中拿到的路由段；最外层还有 HTTP 和 CDN 缓存。Next.js 15 起，fetch 和 GET Route Handler 默认不再缓存。通过 revalidatePath 或 revalidateTag 让服务端缓存失效，用 router.refresh 刷新客户端。</p>
<p>App Router 页面里出现了 <code>fetch</code>、Server Component 和客户端导航后，开发者常问“为什么我改了数据库，页面还是旧的”。原因可能不是一个缓存，而是数据缓存、路由渲染结果、浏览器/CDN 响应和客户端 Router Cache 同时存在。</p>
<p>Next.js 的缓存默认值在大版本之间变化过，回答时先说清楚是哪个版本：</p>
<table><thead><tr><th>版本</th><th><code>fetch</code></th><th>GET Route Handler</th><th>客户端 Router Cache（页面段）</th></tr></thead><tbody><tr><td>14</td><td>默认缓存</td><td>默认缓存（未用动态函数时）</td><td>动态页面默认复用约 30 秒</td></tr><tr><td>15 起</td><td>默认不缓存，需要显式选择</td><td>默认不缓存，可用 <code>dynamic = &#x27;force-static&#x27;</code> 选择</td><td><code>staleTime</code> 默认 0，可用 <code>experimental.staleTimes</code> 调整</td></tr></tbody></table>
<p>依据 Next.js 15 发布说明：共享布局不会重新请求，前进后退仍从缓存恢复，<code>loading.js</code> 仍缓存 5 分钟。Next.js 16 另外提供基于 <code>use cache</code> 指令的 Cache Components 模型，具体 API 以所用版本的文档为准。</p>
<h2>先区分四层缓存</h2>
<p>常见概念可以这样理解：</p>
<ul>
<li><strong>Data Cache</strong>：服务端数据请求或数据读取的持久化结果，是否缓存、多久重新验证取决于请求和框架配置；</li>
<li><strong>Full Route Cache</strong>：静态或可缓存路由的服务端渲染结果，包括生成的 HTML/RSC 内容；</li>
<li><strong>Client-side Router Cache</strong>：浏览器客户端导航期间暂存的 RSC 路由段，影响后退和再次导航；</li>
<li><strong>HTTP/CDN Cache</strong>：浏览器、代理和 CDN 根据响应头复用最终响应。</li>
</ul>
<p>这些层可以同时命中。清理 Data Cache 不一定让已经打开的客户端立即丢掉 Router Cache；更新 HTML 也不一定删除 CDN 中的旧入口。排查时要明确是哪一层提供了旧值。</p>
<h2>静态和动态路由的选择会改变缓存结果</h2>
<p>公开文章、题解和资源目录适合静态生成或按时间重新验证；用户订单、权限菜单和实时库存需要请求时读取或受控的客户端请求。把用户 Cookie、Header、搜索参数或动态函数带进渲染路径，可能让路由变成动态，具体影响取决于 Next.js 版本和使用的 API。</p>
<p>不要只因为页面使用 Server Component 就认为它一定是静态或一定是动态。要检查数据请求、路由配置、动态函数、构建输出和实际响应头。开发环境的刷新行为也可能与生产构建不同。</p>
<h2>revalidate 是时间策略，不是权限控制</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> revalidate = <span class="hljs-number">60</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Articles</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;https://api.example.com/articles&#x27;</span>, {
    <span class="hljs-attr">next</span>: { <span class="hljs-attr">revalidate</span>: <span class="hljs-number">60</span>, <span class="hljs-attr">tags</span>: [<span class="hljs-string">&#x27;articles&#x27;</span>] },
  });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;文章加载失败&#x27;</span>);
  <span class="hljs-keyword">const</span> articles = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ArticleList</span> <span class="hljs-attr">articles</span>=<span class="hljs-string">{articles}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>示例是未启用 Cache Components 的 App Router 路由段配置写法，ArticleList 需要由项目提供。官方 Route Segment Config 的版本记录说明，Next.js 16 启用 Cache Components 时移除了旧模型中的 revalidate、fetchCache 等相关配置；不能仍按此处 export const revalidate 配置缓存，应查阅对应版本的 use cache、cacheLife 等机制。这不表示所有路由段选项都被移除，runtime、maxDuration 等有各自职责。不要把不同缓存模式的配置拼在一起，再凭开发环境表现猜测优先级。</p>
<p>这里表达“允许短时间复用并可按标签失效”的意图。revalidate 不能替代用户权限，每次实际变更操作仍要由服务端重新鉴权；缓存键也必须包含所有影响结果的维度，不能把用户数据放进公共缓存。</p>
<p>时间重新验证还存在旧内容窗口：一次请求可能先得到旧值，后台再触发更新。对文章列表通常可接受，对余额、权限和支付状态则必须重新评估。错误是否缓存、失败后是否继续显示旧结果，也要按框架和业务策略验证。</p>
<h2>失效操作的范围必须明确</h2>
<p>按路径失效、按标签失效、重新验证路由和刷新客户端缓存解决的不是同一层问题。服务端写入成功后，相关数据缓存和 Full Route Cache 可能需要一起失效；客户端已经打开的页面还可能需要刷新或重新获取 RSC 数据。</p>
<p>失效函数应在受控服务端路径中调用，并验证当前用户是否有权触发。不能让客户端任意提交 tag 或路径就清除全站缓存，也不能把失效调用当成数据库事务回滚。写入失败、失效失败和客户端刷新失败应记录为不同状态。</p>
<h2>Router Cache 会影响客户端导航的观感</h2>
<p>客户端从文章 A 导航到 B，再返回 A，可能直接复用已经获取的路由段；这改善了体验，但也意味着用户不一定每次返回都看到服务端最新数据。预取、后退恢复、刷新和完整文档导航的缓存路径不同。</p>
<p>需要强一致显示时，应在写入成功后主动刷新相关数据，或让页面显示明确的“正在更新”状态；不要简单地禁用所有缓存来解决一个局部更新问题。禁用缓存还会增加延迟、请求数和服务成本。</p>
<h2>个性化数据必须防止跨用户复用</h2>
<p>服务端组件可以读取会话和权限，但返回给客户端的 props、RSC 结果和预渲染 HTML 都可能被用户看到。不要把完整数据库对象、密钥或其他用户资料通过缓存层返回。CDN 共享策略、Cookie、请求 Header 和缓存键要一起检查。</p>
<p>如果公共页面和私有数据混合，通常让公共内容静态化，把私有部分放进受控请求；如果确实需要服务端按用户渲染，就确保响应不会被共享缓存错误复用。源码仓库私有、Server Component 文件不发送到浏览器，都不能证明输出数据是秘密。</p>
<p>router.refresh 触发客户端刷新并请求新的服务端组件结果，但不等于已经清除 Data Cache 或 Full Route Cache。因此刷新后仍可能得到缓存的旧数据；应该先确定服务端数据失效策略，再决定客户端何时刷新，而不是反复调用 refresh。</p>
<h2>排查不要只看一个 fetch</h2>
<p>遇到旧内容时，依次检查：数据库实际版本、请求是否命中 Data Cache、路由是否静态生成、Full Route Cache 是否重新验证、浏览器 Router Cache 是否复用、最终 HTTP 响应头和 CDN 状态，以及 Service Worker 是否介入。</p>
<p>生产验证要使用构建后的应用和真实部署。开发服务器中的热刷新、日志和缓存禁用行为不能直接推导生产结果。还要测试发布、回滚、标签失效、多个用户、权限变化、客户端后退和打开旧页面后重新提交。</p>
<p>Next.js 的缓存 API 能减少重复读取和渲染成本，但它们不是一个全局开关。可靠的方案必须明确每层的生命周期、失效触发者、数据敏感度、旧值可接受时间和失败后的恢复路径。</p>
<p>补充参考：<a href="https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config">Next.js · Route Segment Config 与版本记录</a>。</p>`};export{e as default};