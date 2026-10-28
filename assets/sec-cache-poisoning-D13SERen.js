var e={answerHtml:`<h2>简答</h2>
<ul>
<li>缓存投毒是让共享缓存保存并分发不该共享或被攻击者影响的响应。</li>
<li>缓存键由 URL、方法和缓存系统选定的请求字段决定，未进入键却影响响应的输入就是风险点。</li>
<li>私有响应要明确设置 private 或 no-store；Vary 只表达变化维度，不是安全开关。</li>
<li>错误页、重定向、API JSON 都可能被缓存，各层的 URL 规范化必须一致。</li>
</ul>
<p>页面上线 CDN 后，某个访问者发现首页偶尔出现错误链接，甚至看到另一个用户的个性化内容。很多团队只检查了浏览器是否命中缓存，却忽略了 CDN 如何计算缓存键、源站响应是否受未纳入缓存键的输入影响。攻击者可以构造一个请求，让 CDN 保存一份带有恶意内容或错误跳转的响应，再让其他用户命中这份响应，这就是缓存投毒的核心风险。</p>
<h2>缓存键决定哪些请求可以共享响应</h2>
<p>一个缓存条目通常由 URL、方法以及缓存系统选定的请求字段共同决定。实际缓存键由 CDN 配置和协议实现决定，不能简单假设“URL 相同就一定安全”。如果源站会根据 <code>X-Forwarded-Host</code>、某个查询参数、Cookie 或语言头生成响应，却没有让缓存系统按同样的维度区分，就可能出现响应混用。</p>
<p>典型危险组合是：</p>
<ol>
<li>CDN 只按路径缓存 <code>/welcome</code>；</li>
<li>源站把未验证的请求头拼进响应中的链接或脚本地址；</li>
<li>攻击者发送带有恶意头部的请求；</li>
<li>CDN 把响应保存为普通 <code>/welcome</code> 的缓存；</li>
<li>其他用户获得被污染的内容。</li>
</ol>
<p>这和缓存欺骗不同：缓存欺骗通常是诱导缓存系统保存本不应公开的私有响应，缓存投毒则是让公共缓存保存攻击者影响过的响应。两者都要求审查缓存边界和响应内容。</p>
<h2>公共缓存和私有响应必须分开</h2>
<p>登录用户的账户信息、购物车、权限结果和 CSRF 值不应进入公共 CDN 缓存。服务端应明确发送：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: private, no-store
</code></pre></div>
<p><code>no-store</code> 要求缓存不要存储该响应；不带字段参数的 <code>private</code> 禁止共享缓存存储，但单独使用时仍可允许浏览器私有缓存。上面的组合采用更严格的不存储策略。对于不存储的响应，不必再靠 <code>Vary: Cookie</code> 隔离缓存条目。</p>
<p><code>Vary: Cookie</code> 可以区分 Cookie 不同的请求，但不是授权机制，也不是敏感响应的通用防泄露方案；整个 Cookie 串会造成大量缓存变体。已有的泄露副本也不会因源站后来增加 no-store 自动消失，需要清除共享缓存并核对 CDN 覆盖规则。包含 Set-Cookie 的响应也不能仅靠该头保证不被缓存，应明确设置缓存策略。</p>
<p>公开且与用户无关的静态资源可以使用长缓存，例如带内容哈希的 JS、CSS 和图片：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Control: public, max-age=31536000, immutable
</code></pre></div>
<p>文件名变更后才发布新版本，避免必须依赖 CDN 立即清除旧内容。HTML 入口通常需要较短缓存或重新验证，因为它引用的是最新资源清单。</p>
<h2><code>Vary</code> 不是万能的安全开关</h2>
<p>如果响应确实会根据 <code>Accept-Language</code> 或 <code>Accept-Encoding</code> 变化，可以用 <code>Vary</code> 表达变化维度。但把任意用户可控头部都放进 <code>Vary</code> 会造成缓存碎片和性能下降；更危险的是，某些中间层可能忽略或不一致地处理它。优先在源站规范化输入，并让缓存键和响应变化保持一一对应。</p>
<p>对 <code>Host</code>、转发头和查询参数要特别谨慎。应用不应从未经验证的头部生成绝对 URL、重定向地址或脚本来源；应使用可信配置的公开域名，并拒绝不在允许列表中的主机名。查询参数应按业务白名单处理，追踪参数可以在进入缓存键前规范化或剥离，但不能把真正影响内容的参数一并删除。</p>
<h2>预览、错误页和重定向也要检查</h2>
<p>缓存投毒不只发生在 200 页面。错误页、3xx 重定向、内容协商结果和 API JSON 都可能被缓存。错误响应如果包含请求中的路径或头部，攻击者可能把它保存为公共页面；重定向如果受到可控参数影响，可能把用户导向恶意站点。</p>
<p>对登录、管理和支付路由通常直接禁用共享缓存。对公开 API，应明确允许缓存的字段、响应状态和最大年龄，并确保响应中不包含请求者身份或临时令牌。不要仅凭“响应状态是 200”就允许 CDN 存储。</p>
<h2>规范化是多层系统必须共同执行的规则</h2>
<p>浏览器、CDN、反向代理和应用可能以不同方式解析 URL、重复斜杠、编码字符、点段、大小写路径和查询参数。如果上游认为两个 URL 相同而缓存层认为不同，可能绕过清理规则；反过来，如果缓存层认为相同而应用认为不同，就可能发生响应混用。</p>
<p>应在入口记录解析规则：拒绝不合法编码，明确尾斜杠策略，并保证缓存层与源站对请求含义一致。不能默认把所有查询参数排序：重复参数可能按首值、末值或有序数组解释，签名 URL 也可能对原始顺序敏感。只有证明顺序不影响业务含义时才归一化；无法证明时保留差异或禁用该路由的共享缓存。不要在某一层随意重复解码，最好使用 CDN 和框架官方支持的 URL 处理方式并用实际请求验证。</p>
<h2>如何验证缓存安全</h2>
<p>测试环境中可以为同一路径构造不同的安全测试输入，检查响应头和内容：</p>
<ul>
<li>不同 <code>Host</code>、转发头和查询参数是否影响响应；</li>
<li>带认证 Cookie 的响应是否出现 <code>private</code> 或 <code>no-store</code>；</li>
<li>公开响应是否包含用户姓名、令牌或内部 URL；</li>
<li>首次请求带特殊输入后，后续普通请求是否得到相同异常内容；</li>
<li>CDN、反向代理和源站日志中的缓存键是否符合预期。</li>
</ul>
<p>测试必须使用隔离域名和无害标记，不能在生产公共缓存中写入攻击载荷。上线后监控 <code>Age</code>、缓存命中状态、<code>Via</code> 或 CDN 专用调试头，比较源站和边缘响应的摘要；这些头部不应向所有用户泄露内部拓扑。</p>
<h2>清理和失效不是唯一防线</h2>
<p>发现污染后可以刷新相关缓存，但如果根因仍在，攻击者会再次写入。失效操作本身也可能因为通配范围过大造成流量回源。更可靠的做法是先修复缓存键和响应生成，再按具体资源清理；对版本化静态资源优先发布新 URL。涉及敏感数据时，暂时关闭共享缓存并检查已有边缘节点是否仍保存旧响应。</p>
<h2>常见误区和选型</h2>
<ul>
<li>看到 <code>CDN-Cache-Control: public</code> 就缓存所有响应：应先确认响应没有身份和请求相关内容。</li>
<li>只在前端过滤恶意参数：缓存和源站的安全边界必须由服务端控制。</li>
<li>认为 HTTPS 能解决缓存投毒：HTTPS 保护传输链路，不能修复错误的公共缓存策略。</li>
<li>用完整 Cookie 作为缓存键：可能造成隐私风险、缓存爆炸和不可预测命中。</li>
<li>只测试浏览器缓存：共享 CDN、反向代理和服务网格可能各自有缓存规则。</li>
</ul>
<p>公共内容、用户私有内容和动态 API 应分别设计缓存策略。缓存带来的性能收益必须建立在“相同缓存键一定可以共享相同安全响应”的前提上；无法证明这一点时，宁可回源或设置 <code>private, no-store</code>，也不要为了命中率缓存不确定的响应。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://portswigger.net/web-security/web-cache-poisoning">PortSwigger Web Security Academy · Web Cache Poisoning（攻击案例）</a></li>
<li><a href="https://www.rfc-editor.org/rfc/rfc9111.html">RFC 9111 · HTTP Caching</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control">MDN · Cache-Control</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary">MDN · Vary</a></li>
</ul>`};export{e as default};