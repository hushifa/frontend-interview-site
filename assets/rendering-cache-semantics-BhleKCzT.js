var e={answerHtml:`<h2>简答</h2>
<p>SSR 和 SSG 涉及几层不同的缓存：浏览器和 CDN 的 HTTP 缓存由 Cache-Control 控制；请求内去重（如 React cache）只在单次请求内有效；框架数据缓存可以跨请求持久化，需要 revalidate 或打标签失效；还有客户端状态缓存。公共内容可以设 public 并放进 CDN；个性化内容要设 private 或 no-store，缓存键必须包含用户、语言和权限等所有影响结果的维度。</p>
<p>服务端渲染一个页面时，可能同时出现几种“缓存”：浏览器缓存 HTML，CDN 缓存响应，框架在一次请求内复用同一个查询，数据层缓存数据库结果，组件还可能保留客户端状态。它们的生命周期和安全边界不同，不能只在代码里加一个 <code>cache: true</code> 就认为页面已经正确缓存。</p>
<h2>先分清四种复用范围</h2>
<p>请求内去重只保证同一次渲染过程不会重复做完全相同的读取；它通常不会把结果留给下一个 HTTP 请求。HTTP 缓存和 CDN 缓存复用的是响应表示，依据 <code>Cache-Control</code>、验证器、<code>Vary</code> 等规则。框架数据缓存可能跨请求保存查询或生成结果，但失效方式由具体框架决定。客户端 store 又是浏览器内存中的状态，刷新或切换用户后需要单独处理。</p>
<p>一个页面同时使用这些层并不矛盾，但每层都要写清楚“谁可以看到、多久有效、如何失效”。</p>
<h2>公共内容和个性化内容不能共用缓存策略</h2>
<p>博客文章、公开题解和不随用户变化的导航通常适合静态生成或公共 CDN 缓存。登录用户的昵称、权限菜单和订单数据则不能把用户 A 的 HTML 当公共响应给用户 B。</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=60
</code></pre></div>
<p>这类响应只适合内容确实可以被不同用户共享的页面。个性化页面通常需要 <code>private</code>、<code>no-store</code> 或精确的缓存键和边界；即使写了 <code>Vary: Cookie</code>，也不能把敏感响应随意放进共享缓存再假设不会泄漏。</p>
<p>如果页面由公共外壳和用户数据组成，可以让外壳静态化，登录后的局部数据在客户端或受控服务端请求中获取。这样减少公共内容的请求成本，但首屏和权限状态仍需清楚表达。</p>
<h2>SSG 的“更新”通常是重新生成或增量失效</h2>
<p>静态生成在构建时得到文件，普通静态托管不会因为数据库变化自动重新运行页面代码。内容更新后要重新构建、发布新的文件，或使用带运行时能力的平台提供按需重新生成。</p>
<p>增量生成、定时重新验证和按标签失效是框架能力，不是 SSG 缩写本身的标准保证。部署到只提供静态文件的环境时，不能把本地开发或框架服务器的 revalidate 行为带过去。</p>
<p>静态产物还要考虑内容版本和资源版本的配套。HTML 入口如果仍引用旧哈希资源，资源被删除后可能出现异步块 404；如果 CDN 仍缓存旧 HTML，新内容也不会立即出现。发布和回滚要把入口、资源清单、缓存和旧页面一起考虑。</p>
<h2>SSR 的数据缓存要带上所有影响结果的维度</h2>
<p>假设一个查询结果取决于 <code>documentId</code>、语言、用户身份和权限。缓存键只使用 <code>documentId</code>，就可能把英语内容或用户权限结果复用给错误请求。缓存函数还不能偷偷读取当前请求中的全局用户变量，因为缓存命中时可能没有重新执行那段读取。</p>
<p>可以把影响结果的值显式传给数据层：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadDocument</span>(<span class="hljs-params">{ documentId, locale, userId }</span>) {
  <span class="hljs-keyword">const</span> key = <span class="hljs-string">\`<span class="hljs-subst">\${documentId}</span>:<span class="hljs-subst">\${locale}</span>:<span class="hljs-subst">\${userId}</span>\`</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">readThroughCache</span>(key, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">queryDocument</span>({ documentId, locale, userId }));
}
</code></pre></div>
<p>这只是表达键的概念，不是一个可直接用于生产的缓存实现。还要限制容量、设置过期、处理错误是否缓存、避免把秘密写进键或日志，并在账号退出、权限变化和文档更新时失效记录。</p>
<h2>请求内去重不等于跨请求一致性</h2>
<p>同一页面的标题和正文都请求文章详情时，请求内去重可以避免重复读取；但一个请求读取到版本 7，另一个请求稍后读取到版本 8，仍可能出现不同页面结果。这不是请求内去重失效，而是缓存范围和数据时点不同。</p>
<p>需要页面内一致快照时，应由数据层提供事务或版本快照；需要多个请求之间的可见性时，要设计发布版本、数据库一致性或失效消息。缓存不会自动把不同资源变成原子事务。</p>
<h2>失效比命中更难设计</h2>
<p>文章更新后，至少要考虑数据库、框架数据缓存、CDN、浏览器 HTTP 缓存、Service Worker Cache Storage 和已经打开页面的内存状态。只清掉一个层，用户仍可能看到旧内容。</p>
<p>失效消息也可能丢失或乱序。可采用版本号、标签、短 TTL、主动重新验证或发布不可变资源来降低风险；对必须立即生效的权限和余额数据，不应依赖长时间缓存。读取旧内容和执行写操作必须分开，不能因为页面仍显示旧数据就允许用户无条件覆盖新版本。</p>
<h2>缓存失败和缓存未命中不是一回事</h2>
<p>数据库暂时不可用时，把错误缓存很长时间会让所有用户持续看到失败；完全不缓存错误又可能在故障期间形成请求风暴。应根据错误类型、重试策略和业务重要性决定是否短暂缓存、降级或直接失败。</p>
<p>缓存未命中只表示需要执行真实读取，不代表网络或数据库一定失败。监控应分别记录命中、未命中、失效、错误、过期内容和用户可见的错误，不能把所有延迟都归因于“缓存没有生效”。</p>
<h2>验证缓存要从真实部署链路开始</h2>
<p>测试至少覆盖公共页面、登录页面、权限变化、内容更新、回滚、不同语言、不同设备和两个并发请求。检查实际响应头、CDN 行为、服务端日志、缓存键、失效时间和客户端结果；不能只在本地热缓存刷新几次。</p>
<p>一个可解释的缓存方案应明确：哪些数据可以共享、哪些数据必须按用户隔离、缓存在哪一层、谁负责失效、旧数据最多能存在多久，以及缓存故障时用户看到什么。缓存命中率只是指标之一，不能凌驾于安全、正确性和可恢复性之上。</p>`};export{e as default};