var e={answerHtml:`<h2>简答</h2>
<p>useFetch 和 useAsyncData 在 SSR 时由服务端获取数据并写入 payload，客户端 hydration 直接复用，不会重复请求。key 决定缓存身份，Nuxt 4 中同一个 key 的调用共享数据 ref，选项必须一致。lazy 让导航不必等待请求完成；server: false 只在客户端获取；immediate: false 推迟到手动调用 execute。Nuxt 4 中 data 默认是 shallowRef，初始值是 undefined。</p>
<p>Nuxt 页面在服务端已经请求过文章，浏览器 hydration 后如果又重复请求一次，会增加等待和服务器压力；但如果把所有数据都永久缓存，又可能让用户看到过期或错误权限的数据。<code>useFetch</code> 和 <code>useAsyncData</code> 解决的是 Nuxt 渲染流程中的数据获取协作，不是一个通用的全局缓存开关。</p>
<h2>SSR 首次数据可以通过 payload 传给客户端</h2>
<p>在支持 SSR 的默认流程中，服务端执行数据获取并把结果放进 Nuxt payload，客户端 hydration 可以复用这份结果，避免同一导航立即再发一次相同请求。具体序列化、payload 提取和缓存行为取决于 Nuxt 版本与配置，生产环境要看实际 Network 和构建输出。</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
const route = useRoute();
const { data: article, status, error, refresh } = await useFetch(
  () =&gt; \`/api/articles/\${encodeURIComponent(String(route.params.id))}\`,
);
&lt;/script&gt;

&lt;template&gt;
  &lt;p v-if=&quot;status === &#x27;pending&#x27;&quot;&gt;加载中&lt;/p&gt;
  &lt;p v-else-if=&quot;error&quot; role=&quot;alert&quot;&gt;文章加载失败。&lt;/p&gt;
  &lt;article v-else-if=&quot;article&quot;&gt;
    &lt;h1&gt;{{ article.title }}&lt;/h1&gt;
    &lt;button type=&quot;button&quot; @click=&quot;refresh&quot;&gt;重新加载&lt;/button&gt;
  &lt;/article&gt;
&lt;/template&gt;
</code></pre></div>
<p><code>useFetch</code> 还会处理请求上下文、响应数据和 Nuxt 生命周期；直接在 <code>setup</code> 中调用普通 <code>$fetch</code> 可能导致服务端和客户端各自请求。使用 composable 时应遵循 Nuxt 文档的调用位置和版本要求，不能只因为函数名相似就混用所有参数。</p>
<p>示例将 URL 作为 getter 传入，路由参数改变且页面组件被复用时，Nuxt 才能追踪这个依赖。直接在 setup 中插值生成字符串只得到当时的值，不会因为字符串来自 route 就自动变成响应式。这里使用 useFetch 的自动 key；若采用显式 key，也要让它随请求身份变化，避免把多个文章绑定到旧的固定键。</p>
<h2>key 决定复用和状态关联</h2>
<p>同一 key 的 <code>useAsyncData</code> 调用可能共享状态或刷新关系，key 需要包含真正影响结果的参数，例如文档 ID、语言和权限上下文。只使用固定的 <code>article</code> key，会让不同文章或语言互相复用错误结果。</p>
<p>Nuxt 可以自动生成 key，但显式 key 更容易审查跨组件共享和缓存边界。Nuxt 4 中同一个 key 的所有调用共享同一组 <code>data</code>、<code>error</code>、<code>status</code> ref，因此 handler、default、transform、pick、deep、getCachedData 等选项必须一致，不一致时会给出警告。建议把共享 key 的调用收进同一个 composable。</p>
<p>Nuxt 4 的另外两项默认变化：<code>data</code> 改为 <code>shallowRef</code>，只修改嵌套属性不会触发更新，需要深层响应时传 <code>{ deep: true }</code>；<code>data</code> 和 <code>error</code> 的初始值从 <code>null</code> 改为 <code>undefined</code>，旧代码里的 <code>=== null</code> 判断要跟着改。</p>
<p>key 只是 Nuxt 数据状态的标识，不是数据库缓存的安全边界，也不是用户权限凭证。服务端 API 仍要根据当前会话验证文档权限，不能因为客户端把 ID 放进 key 就允许访问。</p>
<h2>watch、refresh 和导航会触发新的获取</h2>
<p>路由参数、查询参数或显式 <code>watch</code> 变化时，数据可能重新获取。旧请求晚于新请求完成时，Nuxt 的数据层和你的 handler 仍要符合当前版本的去重、取消和过期结果语义；写入操作不能仅靠页面刷新解决幂等问题。</p>
<p>如果数据只在用户点击时加载，应明确设置 <code>immediate: false</code>，再调用 execute 或 refresh；lazy 本身只是让客户端导航不必等请求完成，不表示“等待用户点击才请求”。若也不希望在服务端获取，则另设 server: false。<code>immediate: false</code> 时请求开始前 <code>status</code> 为 <code>&#x27;idle&#x27;</code>，模板要单独处理这个状态，不要把它当成加载中或空结果。首屏必须有正文时，这些选择会改变 HTML 与加载体验，不能互相替代。</p>
<p><code>watch</code> 只决定何时重新运行，不能自动判断请求是否应该取消，也不会替你验证返回结构。服务端响应仍应按 schema 或业务契约解析，404、权限错误、空结果和网络失败要分别处理。</p>
<h2>server、lazy 和缓存不是同一组概念</h2>
<p><code>server: false</code> 通常表示不在服务端预取，数据要等客户端 hydration 后再请求；这可能适合只依赖浏览器 API 的内容，但会让初始 HTML 缺少正文，不利于首屏和搜索。<code>lazy</code> 通常影响页面是否等待数据再完成导航，而不是让数据自动长期缓存。</p>
<p>浏览器 HTTP 缓存、CDN、Nitro/server API 缓存、Nuxt payload 和客户端内存状态是不同层。给 composable 加一个选项不会自动改变 CDN 的 <code>Cache-Control</code>，也不会让个性化响应安全地进入公共缓存。公开文章和登录用户资料应采用不同策略。</p>
<p>如果使用 <code>getCachedData</code> 或自定义数据缓存，缓存键、过期时间、错误是否缓存、账号切换清理和跨请求隔离都要明确。服务端模块级 Map 不能保存当前用户数据，否则多个请求可能串户；缓存中也不应放服务端密钥。</p>
<h2>服务端异常、重定向和权限要落到正确边界</h2>
<p>服务端 <code>useAsyncData</code> handler 抛出的错误可能影响 SSR 响应和错误页，客户端 <code>refresh</code> 失败则需要页面级错误或局部错误状态。不要把所有错误转换成空对象，让用户误以为文章本来就是空的。</p>
<p>如果接口需要登录，服务端应从受控会话取得用户，不要信任客户端传来的 userId。登录状态变化、权限撤销和账号切换后，应清理或刷新数据；客户端页面里隐藏按钮不是授权控制。</p>
<p>公开页面的 SSR HTML、payload 和静态生成文件都可能被访问者取得。不要把数据库内部字段、令牌、完整用户对象或只供服务端判断的权限信息返回到 payload。<code>useAsyncData</code> 的结果是页面数据输出边界，不是秘密容器。</p>
<h2>排查重复请求要看完整生命周期</h2>
<p>用生产构建验证：服务端是否请求一次、HTML/payload 是否包含数据、hydration 是否复用、客户端导航是否重新获取、是否有组件重复使用不同 key、Service Worker/CDN 是否又缓存了一层。开发模式下的热刷新和日志不能直接代表生产次数。</p>
<p>Nuxt 的数据 composable 让 SSR、客户端导航和错误状态更容易组织，但它不能替代数据契约、权限、缓存失效、幂等和监控。真正可维护的代码会把“谁拥有数据、什么时候刷新、失败如何恢复、哪一层可以缓存”写在明确的配置和服务端边界里。</p>`};export{e as default};