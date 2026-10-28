var e={answerHtml:`<h2>简答</h2>
<ul>
<li>点击劫持是把真实页面放进透明 iframe，诱导用户点击。</li>
<li>由被嵌入的页面通过 CSP frame-ancestors 声明允许谁嵌入自己。</li>
<li>frame-ancestors 必须通过响应头发送，meta 标签无效，也不回退到 default-src；存在时浏览器忽略 X-Frame-Options。</li>
<li>frame-src 管的是本页能嵌入谁，方向相反。</li>
</ul>
<p>点击劫持不一定需要往你的页面注入脚本。攻击者可以把真实的账户页面放在 iframe 里，再用透明度、遮罩和定位把其中的“确认”按钮放到诱导用户点击的位置。用户以为在点抽奖按钮，实际点到的却是另一个站点上的敏感操作。</p>
<p>攻击者即使受同源策略限制、读不到 iframe 的内容，也可能通过这种视觉欺骗利用用户点击。因此，“别人读不到我的页面”与“别人不能嵌入我的页面”是两件事。</p>
<h2>规则应由被嵌入的页面声明</h2>
<p>假设 <code>account.example.com</code> 不允许任何页面嵌入自己，应在它的 HTML 响应中设置：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: frame-ancestors &#x27;none&#x27;
</code></pre></div>
<p>如果只允许同源页面嵌入，可以使用 <code>&#x27;self&#x27;</code>。如果业务要求让特定管理平台嵌入，则显式列出来源：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: frame-ancestors &#x27;self&#x27; https://admin.example.com
</code></pre></div>
<p>这里的 <code>&#x27;self&#x27;</code> 指被保护页面自己的源，不是整个 example.com 下的任意子域。不要为了省事允许所有 HTTPS 来源；那相当于也允许攻击者自己的 HTTPS 网站嵌入。</p>
<p>frame-ancestors 检查的是整个祖先链。若 A 嵌入 B，B 再嵌入受保护的 C，即使 B 在 C 的许可名单里，只要 A 不满足 C 的规则，C 仍然不能正常嵌入。只看直接父页面会漏掉这一层。</p>
<h2>frame-src 管的是相反方向</h2>
<p>可以把两个指令分别读成：</p>
<ul>
<li><code>frame-src</code>：我这个页面可以往自己的 iframe 里加载谁？</li>
<li><code>frame-ancestors</code>：谁可以把我这个页面放进它的框架里？</li>
</ul>
<p>例如，后台需要嵌入报表服务，但后台本身不能被其他站点嵌入：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: frame-src https://reports.example.com; frame-ancestors &#x27;none&#x27;
</code></pre></div>
<p>这两个要求并不冲突。报表能否成功显示，还要看报表响应自身是否允许该后台嵌入；父页面的许可不能覆盖子页面的拒绝。</p>
<h2>容易配错的几个位置</h2>
<p>frame-ancestors 必须通过响应头发送，放进 HTML 的 CSP meta 标签无效。它也不会回退到 default-src，所以 <code>default-src &#x27;none&#x27;</code> 并不表示“禁止其他页面嵌入我”。</p>
<p>应检查实际文档响应，而不只是代码仓库里的配置。例如反向代理可能没有把配置应用到登录页、错误页或某些静态路由。使用无法配置此响应头的静态托管服务时，增加一个 meta 标签不能补上这个能力，需要使用支持响应头的托管或代理层。</p>
<p>旧的 <code>X-Frame-Options: DENY</code>、<code>SAMEORIGIN</code> 可以表达禁止嵌入或仅允许同源嵌入，但不适合配置多个合作方来源。不要使用已废弃的 ALLOW-FROM 来实现现代白名单。若同时发送两类头，支持 CSP 的浏览器会以 <code>frame-ancestors</code> 为准并忽略 X-Frame-Options，两者的意图仍应保持一致。</p>
<h2>验证时真的把页面放进 iframe</h2>
<p>先在开发者工具的 Network 中确认最终 HTML 响应含有预期策略，再分别从合法来源、非法来源和多层嵌套场景尝试加载。被阻止时，控制台通常会给出违反 frame-ancestors 的提示；只在浏览器地址栏直接打开页面，不能证明防嵌入规则有效。</p>
<p>限制嵌入也不能替代敏感操作自身的防护。服务端仍需鉴权，高风险操作可以要求再次确认或重新认证。frame-ancestors 主要处理“真实页面被借来诱导点击”，不负责修复页面内部的 XSS，也不保证用户一定理解正在确认的业务操作。</p>`};export{e as default};