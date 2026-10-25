var e={answerHtml:`<p>登录后每次请求都要让服务器识别会话、用户希望下次打开仍保留深色主题、一个标签页正在填写暂存表单，这三种状态看起来都是“保存一些数据”，但需要的生命周期和访问方式不同。</p>
<p>选择时先问：服务器是否需要自动收到它，数据是否只属于当前页面会话，规模是否足够小，以及丢失后能否恢复。不要只按“哪个 API 写起来最短”决定。</p>
<table><thead><tr><th>维度</th><th>Cookie</th><th>localStorage</th><th>sessionStorage</th></tr></thead><tbody><tr><td>常见用途</td><td>会话标识、需要服务器参与的少量状态</td><td>跨页面会话保留的小型偏好</td><td>当前标签页会话中的临时状态</td></tr><tr><td>是否自动随请求发送</td><td>满足 Cookie 与请求规则时会</td><td>不会</td><td>不会</td></tr><tr><td>常见生命周期</td><td>由 Max-Age/Expires 或会话规则决定</td><td>没有应用级自动过期时间</td><td>页面会话持续期间，通常跨刷新保留</td></tr><tr><td>脚本访问</td><td>普通 Cookie 可访问，HttpOnly 不可直接访问</td><td>可被有权限的同源脚本访问</td><td>可被有权限的对应页面上下文脚本访问</td></tr><tr><td>数据形式</td><td>受大小与数量限制的字符串键值</td><td>字符串键值，同步 API</td><td>字符串键值，同步 API</td></tr></tbody></table>
<p>浏览器的隐私模式、存储分区、用户设置和数据清理还会影响实际行为。这张表是用途上的比较，不是对数据永久存在的承诺。</p>
<h2>Cookie 的特点是参与 HTTP 状态</h2>
<p>Cookie 可以由服务端通过 Set-Cookie 设置，浏览器之后按规则选择是否放进 Cookie 请求头。域、路径、Secure、SameSite、过期时间，以及请求的凭据模式和浏览器策略都会影响结果。</p>
<p>HttpOnly 能阻止普通页面脚本直接读取或修改对应 Cookie，适合保护不应暴露给 JavaScript 的会话标识；Secure 约束安全传输，正式部署通常配合 HTTPS。localhost 等开发环境可能有特定例外，不应把本地表现当成公网规则。</p>
<p>Cookie 不适合放整个用户资料或大列表。自动携带意味着会影响符合条件的请求大小，也可能把本来只供界面使用的数据发送给服务器。Path 也不是应用之间的安全隔离墙，不能只靠路径区分就把敏感权限边界设计完整。</p>
<p>没有持久过期时间的会话 Cookie，也不应被当成“用户关掉浏览器就绝对退出”的证明：会话恢复等功能可能恢复它。真正的会话失效与授权仍由服务端规则控制。</p>
<h2>localStorage 适合小型偏好，但需要处理不可用</h2>
<p>Web Storage 的值是字符串。对象需要自行序列化并在读取时验证结构；把一个对象直接传给 setItem，不会自动保存成可还原的 JSON 对象。</p>
<p>主题偏好不需要复杂对象，可以直接保存有限的字符串：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">THEME_KEY</span> = <span class="hljs-string">&#x27;frontend-notes:theme:v1&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">readSavedTheme</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> value = <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">getItem</span>(<span class="hljs-variable constant_">THEME_KEY</span>);
    <span class="hljs-keyword">return</span> value === <span class="hljs-string">&#x27;light&#x27;</span> || value === <span class="hljs-string">&#x27;dark&#x27;</span> ? value : <span class="hljs-string">&#x27;system&#x27;</span>;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;system&#x27;</span>;
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">saveTheme</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">if</span> (![<span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-string">&#x27;dark&#x27;</span>, <span class="hljs-string">&#x27;system&#x27;</span>].<span class="hljs-title function_">includes</span>(value)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;不支持的主题值&#x27;</span>);
  }

  <span class="hljs-keyword">try</span> {
    <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">setItem</span>(<span class="hljs-variable constant_">THEME_KEY</span>, value);
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;主题偏好未能保存&#x27;</span>, error);
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
}
</code></pre></div>
<p>读取失败或旧值不符合当前规则时，回到系统主题；保存失败时，界面仍可以使用本次选择，但要知道它未必能在下次恢复。把 <code>localStorage</code> 属性访问也放进 try，是因为策略限制时不只 setItem 可能失败。</p>
<p>代码没有随意调用 <code>localStorage.clear()</code>。同一源下可能还有别的功能使用存储，清空全部键会把它们一起删除。使用明确前缀和版本有助于维护，但版本迁移和过期删除仍需应用自己实现。</p>
<h2>sessionStorage 隔离的是页面会话，不是一次渲染</h2>
<p>sessionStorage 按源和顶层浏览上下文等条件区分。一个标签页刷新后通常仍能读到之前的值，不能把它当成“刷新就清空”的临时变量；同一标签页内符合条件的同源 iframe，也可能访问相应的会话存储。</p>
<p>独立打开的另一个标签页通常有自己的 sessionStorage。但新页面保留 opener 时，初始 sessionStorage 可能从 opener 复制而来，此后各自独立，修改不会持续同步。通过合适方式去除 opener，可以避免这种初始复制。</p>
<p>关闭标签页通常结束页面会话，然而页面或会话恢复行为仍应考虑具体浏览器。不要把它当成安全到期机制；权限截止、验证码过期等应由权威时间和服务端逻辑控制。</p>
<p>它适合当前标签的临时筛选或未完成流程状态，但重要草稿若只能存于这里，用户意外结束会话后就可能无法恢复。</p>
<h2>Web Storage 的同步开销容易被忽略</h2>
<p>getItem、setItem、removeItem 等 API 是同步的，JSON.stringify 和 JSON.parse 也需要在当前线程完成。每次输入一个字符就序列化一整份大型文档，会给主线程制造负担。</p>
<p>对于较大、结构化、需要索引查询或事务的数据，应考虑 IndexedDB；二进制和离线响应也有更合适的存储方式。Web Storage 并没有把大对象简单改成字符串后就变成数据库。</p>
<p>localStorage 没有内置 TTL。若保存“十分钟有效”的缓存，需要记录时间并在读取时判断，也要考虑时钟变化和过期数据清理。配额并不是无限的，写入可能因空间限制或浏览器策略失败，不能把某个固定 MB 数写死成所有浏览器都保证的容量。</p>
<h2>storage 事件能通知变化，但不能提供事务</h2>
<p>localStorage 的值发生变化时，同一存储区域内的其他合适文档可以收到 storage 事件，执行修改的那个窗口不会因为自己的这次修改收到同一事件。写入相同值也不应被当成可靠的通知触发器。</p>
<p>sessionStorage 的通知范围还受页面会话限制，通常用于同一顶层上下文中的合适同源文档，而不是自动广播到其他独立标签页。需要显式跨页面通知时，可以考虑 BroadcastChannel，同时检查存储分区条件。</p>
<p>无论使用 storage 事件还是广播，“先读一个对象、改一下、再写回去”都不是跨标签事务。两个页面可能读到同一旧值，再互相覆盖结果。需要并发安全时，应设计明确的数据版本、数据库事务或参与者共同遵循的锁协议，不能靠事件通知消除竞态。</p>
<h2>保存位置不会自动解决安全与备份</h2>
<p>脚本可读的 localStorage 和 sessionStorage 也会被同源 XSS 代码读取。它们没有 HttpOnly 选项，不适合随意存放长期密钥或把敏感令牌当成普通主题偏好。</p>
<p>HttpOnly Cookie 能降低直接窃取会话值的风险，但不会阻止浏览器按规则自动携带 Cookie 发请求，仍需 CSRF、权限和会话失效设计。换一种存储位置，不会自动让认证系统安全。</p>
<p>用户清理站点数据、隐私模式结束、浏览器配置变化或设备丢失，都可能让本地数据消失。偏好可以回退默认值，缓存可以重建，重要业务数据则应有服务端同步或可导出的备份方案。先按数据的重要性设计恢复方式，再决定存在哪里。</p>`};export{e as default};