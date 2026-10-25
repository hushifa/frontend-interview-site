var e={answerHtml:`<p>不要先收集一串缓存指令再全部加到响应上。应该先判断：这份内容能不能存，能否被多个用户共享，多久内可以直接复用，过期后能否短暂显示旧版本。</p>
<p>同一网站的入口 HTML、哈希脚本、公开排行榜与个人资料，答案可能完全不同。</p>
<h3>内容哈希资源适合长新鲜期与 immutable</h3>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=31536000, immutable
</code></pre></div>
<p>这类策略适合内容变化就换 URL 的脚本、样式或图片，例如 app.abc123.js。浏览器可以在较长新鲜期内复用，而 immutable 表达该响应在新鲜期间不会变化，减少不必要的重新验证。</p>
<p>immutable 不表示永远不更新，也不会自动把内容写进文件名。若你在同一个 URL 下直接替换正文，客户端仍可能继续使用旧文件，策略与发布方式就发生冲突。</p>
<p>强制刷新、用户清理缓存、容量淘汰等行为仍可能影响实际命中，不能把一年新鲜期当成一年必定保留的本地存储保证。</p>
<h3>入口 HTML 可以存储，但及时验证</h3>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: no-cache
ETag: &quot;page-v7&quot;
</code></pre></div>
<p>no-cache 不禁止保存正文，而是要求在复用前进行相应验证。内容未变时可通过 304 复用，变化时取得新入口，从而发现新资源地址。</p>
<p>这比把所有入口都设置成长时间 immutable 更容易配合持续发布，但是否采用它，还要根据可用性、网络成本和托管服务能力决定。</p>
<p>max-age=0 通常意味着立即过期，must-revalidate 则强调过期后未经验证不能继续复用；它们不能简单替代所有 no-cache 语义。也不必为了“更保险”无差别堆上所有相似指令。</p>
<h3>stale-while-revalidate 允许先给旧结果，再更新缓存</h3>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=60, stale-while-revalidate=300
</code></pre></div>
<p>以响应年龄为参照，前 60 秒属于正常新鲜期。过期后，在额外允许的 300 秒窗口里，支持该策略的缓存可以先提供旧结果，同时尝试后台验证或更新。</p>
<p>它适合能接受短暂滞后的公开内容，例如某些非关键展示数据。用户这次看到旧值，不等于后台验证没有发生；后续请求才可能取得更新后的缓存。</p>
<p>这条扩展不会在无人请求时自动定期刷新，也不保证过期窗口无限延长。超出允许范围后，不能仅凭这条指令继续任意提供旧内容，还需按其他适用规则处理。具体缓存实现、请求方式和浏览器支持也要验证。</p>
<p>涉及权限、余额或必须立即体现的变更时，应先判断业务是否真的接受旧数据，而不是只因为它能缩短等待就套用。</p>
<h3>no-store 限制存储，不是删除所有历史数据的按钮</h3>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: no-store
</code></pre></div>
<p>no-store 要求相关 HTTP 缓存不要保存这次请求或响应对应的内容，适合不希望被这类缓存存储的数据。它通常意味着无法获得正常 HTTP 响应复用的收益。</p>
<p>它不会让已被旧策略保存的所有副本立即消失，也不是清空 Service Worker Cache API、IndexedDB、应用内缓存或浏览器历史的通用命令。浏览器前进后退缓存也有自己的生命周期与实现策略，不能只靠这个响应头推断所有历史页面行为。</p>
<p>若需要退出登录后清理客户端数据，应对实际存储与会话机制分别设计。HTTP 缓存指令也不替代 HTTPS、认证和访问控制。</p>
<h3>private、public 与 s-maxage 决定不同缓存范围</h3>
<p>private 用来限制共享缓存使用相应响应，浏览器等私有缓存仍可按策略保存。它不表示内容经过额外加密，也不意味着多个使用同一浏览器环境的人无法看到已经显示过的页面。</p>
<p>public 可以明确允许共享缓存处理符合规则的响应。不能给个性化结果随手加 public，再依赖 Cookie 或前端代码保证它不会被错误共享。</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=60, s-maxage=300
</code></pre></div>
<p>s-maxage 面向共享缓存，可以覆盖其相应新鲜度规则；浏览器私有缓存不按它获得同样的 300 秒寿命。还要结合响应已经具有的 Age，不能认为每次从 CDN 收到数据后，浏览器都重新获得完整的 max-age 时间。</p>
<p>如果同一 URL 因语言、编码或 Origin 等条件返回不同表示，需要正确的 Vary 和缓存键设计。用户身份相关响应则更应明确共享策略，不能把一个漏了维度的缓存键交给任意长 TTL 放大问题。</p>
<h3>must-revalidate 约束的是过期后的复用</h3>
<p>带 must-revalidate 的响应在新鲜期仍然可以直接使用；过期后若无法成功验证，缓存不能仅因离线或连接失败就随意继续提供过期内容。</p>
<p>因此它不是“每一次都到源站重新取完整正文”的意思，也不等于 no-store。若同时使用允许旧内容的扩展策略，应核对标准和实现如何处理组合，不要把多个互相限制的指令视为简单叠加收益。</p>
<h3>请求侧选项不能替服务端定义整站策略</h3>
<p>fetch 的 cache 选项可以影响该请求与浏览器 HTTP 缓存的交互，但不等于修改服务器响应头，也不自动控制所有 CDN、其他用户或应用缓存。</p>
<p>策略最终需要由服务器、托管平台或 CDN 正确发出，并检查实际返回头，而不是只看某个前端配置文件中写了期望值。</p>
<p>发布时还要验证入口和资源的版本关系、错误页面是否被缓存、回滚路径及当前打开页面继续请求旧资源的行为。好的缓存配置应服务资源生命周期，不能只追求命中率最高。</p>`};export{e as default};