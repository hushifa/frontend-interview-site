var e={answerHtml:`<p>传统 SPA 路由通常要自己组合链接点击、<code>pushState</code>、<code>popstate</code>、数据加载、取消旧导航、滚动恢复和焦点管理。只监听 <code>&lt;a&gt;</code> 的 click 还会漏掉后退、前进、脚本发起的导航和表单导航。</p>
<p>Navigation API 提供一个更集中的导航模型，可以观察导航开始、目标 URL、历史遍历与当前导航，并在适合的情况下拦截后加载页面内容。它是浏览器平台能力，不是完整的 React 或 Vue 路由器。</p>
<h3>navigate 事件不等于所有请求都能拦截</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;navigation&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>) {
  navigation.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;navigate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(event.<span class="hljs-property">destination</span>.<span class="hljs-property">url</span>);
    <span class="hljs-keyword">if</span> (url.<span class="hljs-property">origin</span> !== location.<span class="hljs-property">origin</span> || event.<span class="hljs-property">downloadRequest</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">if</span> (!event.<span class="hljs-property">canIntercept</span> || event.<span class="hljs-property">hashChange</span>) <span class="hljs-keyword">return</span>;

    event.<span class="hljs-title function_">intercept</span>({
      <span class="hljs-keyword">async</span> <span class="hljs-title function_">handler</span>(<span class="hljs-params"></span>) {
        <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url.<span class="hljs-property">pathname</span> + url.<span class="hljs-property">search</span>, {
          <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Accept</span>: <span class="hljs-string">&#x27;text/html&#x27;</span> },
        });
        <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`页面加载失败：<span class="hljs-subst">\${response.status}</span>\`</span>);
        <span class="hljs-keyword">const</span> html = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">text</span>();
        <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#app&#x27;</span>).<span class="hljs-property">innerHTML</span> = html;
      },
    });
  });
}
</code></pre></div>
<p>这是展示拦截边界的简化示例，不是完整路由实现。跨源导航、下载、哈希变化和浏览器不允许拦截的情况，应保留默认导航。真实应用还要处理脚本执行、事件监听、页面标题、错误边界和返回按钮。</p>
<p><code>intercept()</code> 的 handler 抛错时，导航会进入失败路径；它不会自动把失败页面变成成功。数据加载也应绑定当前导航的 signal，避免用户快速点击新链接后旧请求继续覆盖新页面。</p>
<h3>与 History API 的关系</h3>
<p>Navigation API 不是把 History API 删除，而是提供更完整的导航事件和当前导航对象。旧浏览器不支持时，项目仍可能需要使用 History API 或成熟路由库降级。</p>
<p>导航历史、页面数据和组件状态需要分别管理。调用 <code>pushState</code> 只改变历史条目，不会自动获取数据、更新焦点或滚动到顶部；Navigation API 也不会替应用决定数据缓存和权限。</p>
<p>历史遍历可能恢复之前的页面状态，也可能触发重新加载。应用不要假设每次导航都是一个全新 URL 请求，也不要把所有 <code>navigate</code> 事件都当成普通链接点击。</p>
<h3>取消、提交和滚动需要有明确时机</h3>
<p>一次导航可以处于准备、提交或完成阶段。用户在数据加载期间又点击新链接时，应取消或忽略旧导航。框架若同时管理自己的路由，不能让两个系统分别接管同一个链接。</p>
<p>滚动与焦点恢复是用户体验的一部分：新页面通常回到顶部，片段链接则应滚到目标元素；后退恢复可能需要保留原位置。Navigation API 提供相关能力，但应用仍要按页面类型选择行为。</p>
<h3>兼容性和选型边界</h3>
<p>Navigation API 的核心能力与具体子功能支持度需要分别核对。它适合减少 SPA 路由的底层胶水代码，但目前不应假设所有浏览器、WebView 和测试环境都支持。</p>
<p>如果项目已经使用成熟路由库，不要为了使用新 API 重写全部导航。可以等框架适配稳定后采用，或用特性检测把它限制在适合的运行环境。最终测试要覆盖深链接、后退前进、下载、哈希、取消、错误和键盘焦点。</p>
<h3>一个真实路由器还要补齐什么</h3>
<p>上面的示例直接把 HTML 塞进 <code>#app</code>，只是为了展示拦截时机。真正的应用通常需要先根据目标 URL 匹配路由，再请求页面数据或代码，最后由框架渲染组件。直接替换 <code>innerHTML</code> 会丢失事件监听、组件状态和清理逻辑，不能当作生产路由实现。</p>
<p>导航处理器应与当前导航绑定。可以使用 <code>event.signal</code> 取消 fetch 或数据加载：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">navigation.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;navigate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (!event.<span class="hljs-property">canIntercept</span> || event.<span class="hljs-property">hashChange</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(event.<span class="hljs-property">destination</span>.<span class="hljs-property">url</span>);

  event.<span class="hljs-title function_">intercept</span>({
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">handler</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/page?path=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(url.pathname)}</span>\`</span>, {
        <span class="hljs-attr">signal</span>: event.<span class="hljs-property">signal</span>,
      });
      <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;页面数据加载失败&#x27;</span>);
      <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
      <span class="hljs-title function_">renderRoute</span>(data, url);
    },
  });
});
</code></pre></div>
<p>如果用户在第一个请求完成前又导航到第二个地址，第一条 signal 会被取消或变为不再适用。即使某个底层 API 不支持取消，也要在提交 UI 前检查当前导航身份，不能让旧结果覆盖新页面。</p>
<h3>同一导航可能包含表单、下载和跨源跳转</h3>
<p>NavigationEvent 能提供目的地址、导航类型以及是否为下载或包含 POST 数据等信息。应用不应为了统一 SPA 体验而拦截文件下载、表单副作用或外部站点跳转。把 POST 导航当成无副作用的 GET 请求，会改变表单语义。</p>
<p>跨源链接通常应交给浏览器默认处理；即使目标同源，也要检查用户是否按住了新标签页快捷键、是否请求下载，以及是否需要保留浏览器的默认行为。路由层过度拦截会破坏复制链接、打开新窗口和辅助技术操作。</p>
<h3>当前导航对象不能替代应用状态</h3>
<p>Navigation API 可以观察当前导航和历史条目，但不会自动保存表单草稿、滚动位置或数据缓存。页面在提交前被新导航取消时，是否保留用户输入要由应用决定。</p>
<p>遇到认证拦截时，可以在导航处理阶段转向登录页，但登录完成后应恢复原始目标，并防止开放重定向。权限检查仍要在服务端完成，客户端导航拦截只负责体验与初步流程。</p>
<p>这是一个逐步采用的底层 API。对于题库这种静态站，普通链接和现有 History 逻辑已经足够；对于复杂 SPA，使用它前应确认目标浏览器、框架集成、监控和降级成本。</p>
<h3>如何避免重复请求和错误提交</h3>
<p>路由处理器不应只按 URL 字符串判断是否相同。用户连续点击同一个链接、在加载过程中点击后退，再回到原地址，可能对应不同的导航实例。可以给每次导航分配请求上下文，只有仍然是当前上下文时才提交数据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> activeNavigation = <span class="hljs-number">0</span>;

navigation.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;navigate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (!event.<span class="hljs-property">canIntercept</span> || event.<span class="hljs-property">hashChange</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> navigationId = ++activeNavigation;

  event.<span class="hljs-title function_">intercept</span>({
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">handler</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> <span class="hljs-title function_">loadPage</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(event.<span class="hljs-property">destination</span>.<span class="hljs-property">url</span>));
      <span class="hljs-keyword">if</span> (navigationId !== activeNavigation) <span class="hljs-keyword">return</span>;
      <span class="hljs-title function_">renderRoute</span>(data);
    },
  });
});
</code></pre></div>
<p>这里的序号只是 UI 层的最后一次提交保护，不能替代 <code>event.signal</code> 的取消。网络请求应优先使用 signal，序号检查则负责处理不支持取消的计算、缓存回调或第三方 SDK。对于带副作用的 POST 导航，还要避免因为用户重复点击而重复创建订单，幂等键和服务端校验必须放在服务端。</p>
<h3>导航失败时应保留什么状态</h3>
<p>数据加载失败并不等于整个应用必须白屏。可以把错误显示在目标页面区域，同时保留当前页面和可重试按钮；如果目标资源不存在，再显示 404 页面。处理器抛错后，应用应记录 URL、导航类型和错误原因，但日志中不要直接写入密码、令牌或表单内容。</p>
<p>表单离开前的未保存提示也要谨慎：只在确实有未保存修改时拦截，保存成功后及时清除脏状态。下载、打开新窗口和用户按住 Ctrl/Command 的操作应遵循浏览器默认行为，否则会影响可访问性和用户对链接的预期。</p>`};export{e as default};