var e={answerHtml:`<p>用户打开一个筛选后的题库地址，刷新后仍应看到相同条件；按后退应回到前一个筛选；把链接发给别人，对方也能理解当前页面。这些都不是简单地“把组件 A 换成 B”就能完成的。</p>
<p>路由负责把地址、历史记录、数据加载和界面状态协调起来。它既是导航机制，也是一份关于页面能否直接访问、分享和恢复的契约。</p>
<h2>哪些状态应该进入 URL</h2>
<p>页面身份通常放在路径中，例如某篇文章的 ID；可分享的搜索、分类和页码常放在查询参数中；片段标识可以表达文档内的位置。</p>
<p>输入框焦点、弹窗里的未提交输入和临时拖拽位置通常不需要进入 URL。是否保存某个状态，要看用户是否希望刷新、回退或分享时恢复它，而不是所有状态都写进去。</p>
<p>一旦 URL 是某项状态的事实来源，就要避免另一个 store 长期保存互不关联的副本。搜索输入可以有临时草稿，但提交后应明确怎样转成规范 URL。</p>
<h2>路由参数同样需要解析和校验</h2>
<p>查询参数都是外部输入。页码可能是负数、小数或超大数，分类可能不存在，重复参数也需要约定怎样处理。</p>
<p>下面演示一个题库查询的读取规则：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseQuestionUrl</span>(<span class="hljs-params">address</span>) {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(address);
  <span class="hljs-keyword">const</span> params = url.<span class="hljs-property">searchParams</span>;
  <span class="hljs-keyword">const</span> allowedCategories = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;all&#x27;</span>, <span class="hljs-string">&#x27;javascript&#x27;</span>, <span class="hljs-string">&#x27;css&#x27;</span>]);
  <span class="hljs-keyword">const</span> requestedCategory = params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;category&#x27;</span>) ?? <span class="hljs-string">&#x27;all&#x27;</span>;
  <span class="hljs-keyword">const</span> pageText = params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;page&#x27;</span>) ?? <span class="hljs-string">&#x27;1&#x27;</span>;
  <span class="hljs-keyword">const</span> pageNumber = <span class="hljs-regexp">/^\\d+$/</span>.<span class="hljs-title function_">test</span>(pageText) ? <span class="hljs-title class_">Number</span>(pageText) : <span class="hljs-title class_">NaN</span>;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">keyword</span>: (params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>) ?? <span class="hljs-string">&#x27;&#x27;</span>).<span class="hljs-title function_">trim</span>(),
    <span class="hljs-attr">category</span>: allowedCategories.<span class="hljs-title function_">has</span>(requestedCategory) ? requestedCategory : <span class="hljs-string">&#x27;all&#x27;</span>,
    <span class="hljs-attr">page</span>: <span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(pageNumber) &amp;&amp; pageNumber &gt; <span class="hljs-number">0</span> ? pageNumber : <span class="hljs-number">1</span>,
  };
}
</code></pre></div>
<p>这里要求传入完整 URL，使用第一项同名查询参数，非法分类与页码回到默认值。实际页码是否超过结果总页数，还需要数据层判断；不是解析成正整数就一定有那一页。</p>
<p>构造 URL 时应使用 URL、URLSearchParams 或框架提供的接口，正确处理中文、空格和 <code>+</code> 等字符。字符串拼接容易把值中的特殊字符变成新的参数结构。</p>
<h2>push 与 replace 影响用户的后退体验</h2>
<p>push 创建新的历史位置，replace 更新当前位置。用户明确进入一个新页面通常值得保留历史；输入时每个字符都 push，则可能让后退需要按几十次。可以按产品约定在编辑中 replace，提交或关键筛选变化时 push。</p>
<p>使用原生 History API 时，pushState/replaceState 不会因此自动触发一次 popstate，也不会自动让组件重新渲染。路由库会组织相应状态同步，自己实现时必须处理这些不同入口。</p>
<p>后退不等于重新执行一次普通点击。它可能恢复历史状态、滚动位置或 bfcache 页面，加载与失效策略也应覆盖这种情况。</p>
<h2>数据加载与导航应属于同一次操作</h2>
<p>新页面可能需要数据、权限检查或代码分包。用户快速连续导航时，旧请求不应在新页面上提交结果；导航取消与请求取消需要关联，仍不支持取消的数据源也要检查结果是否过期。</p>
<p>还要区分首次加载、后台刷新、参数变化和表单提交后的重新验证。loading 不应永远覆盖已有可用内容，错误也应落到合适的路由边界，而不是任何子区域失败就让整站白屏。</p>
<p>React Router 的 Declarative、Data 和 Framework 模式提供不同程度的组织能力。Data 模式增加 loader/action、等待与错误等数据路由能力，Framework 模式进一步结合构建插件和路由模块；不能把某种模式的 API 直接复制到另一种用法中。具体选择取决于愿意让框架管理多少内容，也要核对项目版本。</p>
<h2>前端守卫不等于服务端授权</h2>
<p>路由可以在进入页面前显示登录入口，或避免普通用户看到不适用的界面，但浏览器代码可被修改，接口不能只相信前端守卫已经检查过权限。</p>
<p>服务端仍需验证身份与资源权限。登录状态变化后，路由缓存和已加载数据也可能需要失效，不能只把菜单隐藏掉就认为私有数据已经清理。</p>
<h2>深链接必须在部署层真正成立</h2>
<p>History 路由中的 <code>/questions/123</code>，不只是首页内点击时能到达；直接输入该地址和刷新时，托管服务也要返回正确页面或适当的应用入口。</p>
<p>静态托管可以预生成对应页面、使用平台支持的回退策略，或根据需求选择 hash 等方案。不存在的地址仍应有合理的 404 行为，不能把所有错误都静默返回成功页面。</p>
<p>构建资源基础路径、子目录部署和客户端路由前缀也要一致。开发服务器提供的自动回退，不代表生产环境已经配置好。</p>
<h2>导航完成还需要让用户知道发生了什么</h2>
<p>更新标题，提供适当的主内容焦点或导航通知，并处理滚动恢复。进入新页面通常不应停留在上一页底部；后退又可能需要恢复之前的位置，不能每次都无条件滚到顶部。</p>
<p>保留普通链接的语义也很重要：新标签打开、复制地址、浏览器前后退和键盘操作都属于导航体验。复杂路由器可以帮助组织这些能力，但仍需要应用明确地址、数据与交互之间的规则。</p>`};export{e as default};