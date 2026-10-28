var e={answerHtml:`<h2>简答</h2>
<ul>
<li>缓存键通常由方法、主机、路径和查询串组成，具体规则由 CDN 配置决定，请求头默认不在键里。源站如果根据不在键里的输入（如 <code>X-Forwarded-Host</code>）生成内容，攻击者就能让缓存存下恶意版本。</li>
<li>缓存欺骗：攻击者诱导用户访问 <code>/account/profile.css</code>，路由把它当成 <code>/account/profile</code> 返回个人数据，CDN 按 <code>.css</code> 后缀缓存，攻击者再去读取。</li>
<li>私有响应设置 <code>Cache-Control: private</code>，不应被任何缓存保存的再加 <code>no-store</code>；CDN 规则要尊重源站头部。</li>
<li><code>Vary</code> 只用来声明哪些请求头会改变响应，它不是权限控制；<code>Vary: Cookie</code> 会让缓存几乎失效。</li>
<li>CDN 和源站对 URL 的规范化（大小写、尾斜杠、编码、路径参数）要一致。</li>
</ul>
<h2>投毒示例</h2>
<p>源站用请求头拼出资源地址：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 有问题的写法</span>
<span class="hljs-keyword">const</span> host = req.<span class="hljs-property">headers</span>[<span class="hljs-string">&#x27;x-forwarded-host&#x27;</span>] ?? req.<span class="hljs-property">headers</span>.<span class="hljs-property">host</span>;
res.<span class="hljs-title function_">send</span>(<span class="hljs-string">\`&lt;script src=&quot;https://<span class="hljs-subst">\${host}</span>/app.js&quot;&gt;&lt;/script&gt;\`</span>);
</code></pre></div>
<p>攻击者发送带 <code>X-Forwarded-Host: evil.example</code> 的请求，CDN 按 <code>/</code> 缓存了这份响应，之后所有访问首页的用户都会加载攻击者的脚本。</p>
<p>修复：</p>
<ul>
<li>资源地址用配置里的固定域名，不读请求头。</li>
<li>必须使用某个请求头时，把它加入缓存键或 <code>Vary</code>，并校验取值白名单。</li>
<li>在 CDN 边缘剥掉不需要的请求头。</li>
</ul>
<h2>欺骗示例与防护</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">https://app.example/account/settings/avatar.png
</code></pre></div>
<p>如果应用路由忽略多余路径段，返回的是账户设置页；CDN 看到 <code>.png</code> 按静态资源缓存。</p>
<ul>
<li>应用对不存在的路径返回 404，不做宽松匹配。</li>
<li>个性化响应设置 <code>Cache-Control: private, no-store</code>。</li>
<li>CDN 按源站的 <code>Cache-Control</code> 决定是否缓存，而不是按扩展名强制缓存。</li>
<li>对带 <code>Authorization</code> 或会话 Cookie 的请求默认不缓存。</li>
</ul>
<h2>其他容易被缓存的内容</h2>
<ul>
<li>错误页和重定向：一次 500 或指向攻击者域名的 302 被缓存后影响所有人。</li>
<li>带个人信息的 JSON 接口。</li>
<li>依赖 <code>Accept-Language</code>、设备类型的页面，缺少 <code>Vary</code> 时会串内容。</li>
</ul>
<h2>验证和应急</h2>
<ul>
<li>用 <code>Age</code>、<code>Cache-Status</code> 或厂商缓存头确认响应是否来自共享缓存，见<a href="/questions/network-cache-status/">《Cache-Status 响应头能帮助诊断哪些缓存问题？》</a>。</li>
<li>测试时给 URL 加随机参数（cache buster），避免污染真实缓存。</li>
<li>发现泄露后先修复源站头部，再清除 CDN 缓存，已缓存的副本不会因源站修改自动消失。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和普通的缓存配置错误有什么区别？配置错误是被动串内容，投毒是攻击者主动构造请求让缓存存下恶意响应。</li>
<li>前端能做什么？不要让页面输出依赖未验证的请求头或 URL 片段，接口按约定返回正确的缓存头。</li>
</ul>`};export{e as default};