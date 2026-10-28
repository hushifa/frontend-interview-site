var e={answerHtml:`<h2>简答</h2>
<p>用户快速切换路由时，旧导航的数据请求可能晚于新导航返回，从而覆盖新页面。每次导航应带一个身份标识，用 AbortController 取消旧的 loader，并在写入状态前检查结果是否仍属于当前导航。前端路由守卫只负责界面跳转，每个接口都必须在服务端重新鉴权。权限变化后，要清理缓存的 loader 数据。取消请求不能撤销已经发生的写操作。</p>
<p>用户先打开报表 A，立刻点击报表 B，又按后退回到 A。三个导航的请求可能以任意顺序完成；如果旧 loader 结果没有被识别为过期，它可能把当前页面替换成用户已经离开的数据。</p>
<p>路由系统需要把 URL、导航身份、数据加载、权限和缓存放进同一条可解释的流程。前端守卫只能控制界面导航，不能代替服务端授权；取消请求也不能撤销已经发生的写操作。</p>
<h2>每次导航都需要一个身份</h2>
<p>可以为每次导航生成序号或 AbortController：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createNavigationLoader</span>(<span class="hljs-params">load, commit</span>) {
  <span class="hljs-keyword">let</span> sequence = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> active;

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">navigate</span>(<span class="hljs-params">location</span>) {
    active?.<span class="hljs-title function_">abort</span>();
    <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
    active = controller;
    <span class="hljs-keyword">const</span> id = ++sequence;

    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">let</span> data;
      <span class="hljs-keyword">try</span> {
        data = <span class="hljs-keyword">await</span> <span class="hljs-title function_">load</span>(location, controller.<span class="hljs-property">signal</span>);
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-keyword">if</span> (!controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span> &amp;&amp; id === sequence) {
          <span class="hljs-title function_">commit</span>({ location, error });
        }
        <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
      }
      <span class="hljs-keyword">if</span> (controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span> || id !== sequence) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
      <span class="hljs-title function_">commit</span>({ location, data });
      <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
    } <span class="hljs-keyword">finally</span> {
      <span class="hljs-keyword">if</span> (active === controller) active = <span class="hljs-literal">undefined</span>;
    }
  };
}
</code></pre></div>
<p>这只是表达导航身份的教学实现。真实路由器会同时管理历史记录、loader、错误边界、代码分割和滚动恢复。取消旧请求可以节省资源，但过期检查仍然需要存在，因为某些数据源忽略 AbortSignal，或响应已经进入后续处理。</p>
<p>导航序号只表示当前页面意图，不是服务端数据版本。订单、草稿和权限状态仍要使用服务端版本、ETag 或操作 ID 保护，不能拿导航 ID 当数据库一致性凭证。</p>
<p>load 与 commit 的错误边界分开：数据加载失败可以提交当前页面的错误状态，但 commit 自身抛错属于状态提交或渲染错误，不应再调用一次 commit 把它伪装成网络失败。示例要求 commit 为同步提交函数；若提交还有异步步骤，应由对应框架或状态层继续检查导航身份。</p>
<h2>读取导航和写入提交要分开</h2>
<p>用户点击保存后，应用可能先提交一个 action，再导航到详情页。写操作不能因为用户立刻离开就被当成取消；请求可能已经成功，客户端只是没有收到响应。服务端要支持幂等键、状态查询或明确的操作结果。</p>
<p>读取 loader 可以在导航取消时停止等待；写入 action 则应根据业务决定是否继续、如何显示处理中，以及重试是否安全。把所有 fetch 都绑定到“离开页面就 abort”可能让用户误以为付款或创建操作已经撤销。</p>
<h2>权限守卫不是授权边界</h2>
<p>路由守卫可以在客户端发现没有登录时跳转到登录页，也可以隐藏普通用户看不到的菜单。但用户可以绕过前端直接请求接口，已打开页面的权限也可能在服务器侧被撤销。</p>
<p>每个服务端读取和写入都要重新验证身份、租户和资源权限。导航期间如果会话过期，loader 应返回可理解的认证状态；403 和 401 不能都无条件重定向登录，否则会掩盖资源本身不允许访问的问题。</p>
<p>权限变化后，已缓存的 loader 数据和菜单状态需要失效。只把按钮隐藏起来，不会清除内存中的敏感数据，也不会撤销已经打开的 WebSocket、下载或后台任务。</p>
<h2>并发导航会影响 loading 和错误显示</h2>
<p>如果每个 loader 的 finally 都直接设置全局 <code>loading=false</code>，旧导航结束时可能把新导航的 loading 提前关掉。加载状态要绑定当前导航身份，或者由路由器统一管理 pending 状态。</p>
<p>错误也要落在正确的边界：一个侧栏推荐失败不应让主文章白屏，权限错误和网络错误应提供不同恢复入口。空结果是成功但没有数据，不应显示成无限 loading 或系统故障。</p>
<p>导航开始后 URL 是否立即变化、失败时是否回退、用户按后退时是否取消当前请求，都应写成产品契约。不能只依赖浏览器 history 默认行为来猜测用户体验。</p>
<h2>缓存、预取和后退恢复需要统一规则</h2>
<p>路由预取可以减少点击后的等待，却可能下载用户最终不会打开的页面；缓存命中也可能返回旧权限或旧版本数据。公共文章和用户订单需要不同的缓存策略，不能把所有 loader 结果放进一个全局 Map。</p>
<p>从 bfcache 或客户端 Router Cache 恢复时，页面状态可能很新，但权限和服务端数据已经变化。可以保留滚动和输入体验状态，同时按业务规则重新验证敏感数据。旧 loader 结果返回后必须检查页面身份，不能覆盖用户当前所在路由。</p>
<h2>深链接和部署错误也会伪装成路由并发问题</h2>
<p>直接刷新 <code>/reports/42</code> 失败往往是部署回退规则的问题，不是并发问题，排查方法见 SEO 与部署一题。</p>
<p>测试要覆盖快速连续点击、后退、网络慢响应、取消、权限撤销、缓存命中、深链接刷新和写入后离开页面。路由并发的目标不是让所有旧请求都停止，而是让用户看到的状态只由当前仍有资格的导航更新，并让已经发生的业务副作用有可追踪的结果。</p>`};export{e as default};