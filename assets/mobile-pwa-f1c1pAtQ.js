var e={answerHtml:`<p>PWA 不是一个新的 UI 框架，而是把网站逐步增强为更接近应用的体验：可以从桌面或主屏幕启动，使用合适图标和窗口模式，在弱网或离线时仍提供有用内容，并在支持的平台上接入部分系统能力。</p>
<p>这些能力不是一个开关同时开启，也不是所有浏览器都实现同样的安装与后台行为。基础网页应该先能正常完成任务，再按能力增强。</p>
<h3>Manifest 描述安装后的应用身份</h3>
<p>页面通过 link 引入 Web App Manifest，浏览器读取名称、图标、启动地址和显示方式等信息：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;manifest&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/app/manifest.webmanifest&quot;</span> /&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;id&quot;: &quot;/app/&quot;,
  &quot;name&quot;: &quot;离线阅读示例&quot;,
  &quot;short_name&quot;: &quot;阅读&quot;,
  &quot;start_url&quot;: &quot;/app/&quot;,
  &quot;scope&quot;: &quot;/app/&quot;,
  &quot;display&quot;: &quot;standalone&quot;,
  &quot;icons&quot;: [
    { &quot;src&quot;: &quot;/app/icon-192.png&quot;, &quot;sizes&quot;: &quot;192x192&quot;, &quot;type&quot;: &quot;image/png&quot; },
    { &quot;src&quot;: &quot;/app/icon-512.png&quot;, &quot;sizes&quot;: &quot;512x512&quot;, &quot;type&quot;: &quot;image/png&quot; }
  ]
}
</code></pre></div>
<p>这些路径需要在部署中真实存在，图片尺寸也应与声明一致。start_url 是启动入口，scope 描述应用导航范围，id 帮助标识应用身份。standalone 请求更像应用窗口的显示方式，但最终效果由平台决定。</p>
<p>Manifest 不是资源缓存清单，列出图标和入口不代表正文、脚本和接口已经离线可用。安装条件也随浏览器版本与平台变化，不能把某一份清单当作永久通用的验收标准。</p>
<h3>安装与离线是两件事</h3>
<p>Service Worker 常用于离线缓存和网络策略，但不能简单说“所有平台可安装都必须有 Service Worker”。同样，注册了 Service Worker，也不代表浏览器一定展示安装按钮。</p>
<p>有些浏览器支持页面捕获安装提示事件，有些需要用户使用系统菜单添加到主屏幕。应用应按目标平台提供适当说明，不要在没有相关能力时显示一个永远点不动的安装按钮。</p>
<p>安全上下文通常是重要前提，本地开发环境有相应例外。开发机 localhost 成功并不能证明线上 HTTP 部署也具备同样能力。</p>
<h3>离线体验需要定义“哪些事仍能做”</h3>
<p>阅读应用可以缓存已经下载的文章；订单应用可能只允许查看上次数据，禁止把未发送的操作标为成功。离线页面不是统一显示一张“网络断开”图片就结束，也不是把全部请求无限缓存。</p>
<p>应区分应用壳、带版本的静态资源、公开数据和用户私有数据，分别设计缓存与失效。退出账号时要处理敏感数据留存，不能让下一个使用设备的人看到上一位用户的缓存内容。</p>
<p>若允许离线编辑，需要明确本地保存、待同步、同步失败和冲突状态。后台同步能力并非所有平台都可用，服务端幂等和冲突解决也不会由 PWA 自动提供。</p>
<h3>更新是长期使用场景的核心问题</h3>
<p>用户可能数天不关闭已安装应用，旧页面和新发布资源会并存。新 Service Worker 默认可能等待旧客户端退出，应用应能发现可用更新，在合适时机提示或协调重载。</p>
<p>直接强制更新可能打断表单和未保存内容；长期保留旧版本也可能有安全与兼容成本。应设计版本协商、数据迁移和失败恢复，而不是遇到缓存问题就要求用户清空浏览器全部数据。</p>
<p>浏览器存储也可能受配额、清理和系统压力影响。缓存不是永不丢失的数据库，离线资源被移除后应能重新获取，重要用户数据要有适当持久化与同步策略。</p>
<h3>安装后仍然受 Web 平台边界约束</h3>
<p>推送、文件、后台执行和分享等能力有各自的权限与支持范围。安装到主屏幕不等于获得原生应用所有能力，也不保证脚本能一直在后台运行。</p>
<p>验收应分别覆盖普通浏览器访问、安装启动、离线首次或再次访问、更新、退出登录、存储被清理以及前后台恢复。跨平台体验可以不同，但不支持增强能力时，用户仍应有清楚的可用路径。</p>`};export{e as default};