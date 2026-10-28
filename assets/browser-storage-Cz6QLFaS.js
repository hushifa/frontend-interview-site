var e={answerHtml:`<h2>简答</h2>
<ul>
<li>选择存储先看四点：服务器是否要自动收到、生命周期、数据规模和敏感程度。</li>
<li>Cookie 的价值在于随 HTTP 请求发送，适合会话等服务端需要的小数据。</li>
<li>localStorage 适合跨标签保留的小型偏好，sessionStorage 只属于当前页面会话。</li>
<li>大量结构化数据用 IndexedDB；敏感信息和数据丢失后的恢复要单独设计。</li>
</ul>
<h2>先问四个问题</h2>
<p>登录会话、深色主题和未完成表单都可以叫“要保存的数据”，但适合的位置不同：</p>
<ol>
<li>服务端是否需要在每次请求中自动收到它？</li>
<li>数据是跨标签页保留，还是只属于当前页面会话？</li>
<li>数据是否小而简单，能否接受同步访问？</li>
<li>数据丢失后能否重新生成，是否包含敏感信息？</li>
</ol>
<table><thead><tr><th>存储</th><th>更适合</th><th>不适合</th></tr></thead><tbody><tr><td>Cookie</td><td>少量会话状态、服务器需要参与的状态</td><td>大对象、用户资料、列表缓存</td></tr><tr><td>localStorage</td><td>小型跨刷新偏好</td><td>令牌、大文档、事务数据</td></tr><tr><td>sessionStorage</td><td>当前页面会话的临时状态</td><td>重要草稿和跨标签共享</td></tr><tr><td>IndexedDB</td><td>大型结构化数据、离线数据、事务</td><td>只保存一个简单主题字符串</td></tr></tbody></table>
<p>浏览器隐私模式、分区策略和用户清理会影响所有本地存储。没有哪种 API 能承诺数据永久存在。</p>
<h2>Cookie 的价值是参与 HTTP 请求</h2>
<p>服务端可以通过 <code>Set-Cookie</code> 设置 Cookie，浏览器会根据 Domain、Path、Secure、SameSite、过期时间和凭据策略决定是否在请求中携带。Cookie 是少数能让服务端自动获得状态的客户端存储方式。</p>
<p>登录会话通常使用 <code>HttpOnly</code>、<code>Secure</code> 和合适的 <code>SameSite</code>，让 JavaScript 无法直接读取会话值并降低窃取风险。但 Cookie 自动发送仍需要 CSRF 防护、权限校验和服务端失效策略。<code>HttpOnly</code> 不是“所有认证问题都解决了”。</p>
<p>Cookie 有大小和数量限制，自动携带还会增加请求头。不要把完整用户资料或大列表放进去，也不要把 Path 当成真正的权限隔离。没有过期时间的会话 Cookie 也不一定在关闭浏览器后绝对消失，浏览器可能恢复会话。</p>
<h2>localStorage 适合小型偏好</h2>
<p>Web Storage 只保存字符串，且 API 是同步的。主题偏好可以这样封装：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">KEY</span> = <span class="hljs-string">&#x27;frontend-notes:theme:v1&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readTheme</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> value = <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">getItem</span>(<span class="hljs-variable constant_">KEY</span>);
    <span class="hljs-keyword">return</span> [<span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-string">&#x27;dark&#x27;</span>, <span class="hljs-string">&#x27;system&#x27;</span>].<span class="hljs-title function_">includes</span>(value) ? value : <span class="hljs-string">&#x27;system&#x27;</span>;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;system&#x27;</span>;
  }
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">saveTheme</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">if</span> (![<span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-string">&#x27;dark&#x27;</span>, <span class="hljs-string">&#x27;system&#x27;</span>].<span class="hljs-title function_">includes</span>(value)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;主题值无效&#x27;</span>);
  }
  <span class="hljs-keyword">try</span> {
    <span class="hljs-variable language_">localStorage</span>.<span class="hljs-title function_">setItem</span>(<span class="hljs-variable constant_">KEY</span>, value);
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
}
</code></pre></div>
<p>属性访问和写入都可能因隐私策略、配额或禁用设置失败，因此界面要有默认值和失败路径。对象需要自行 JSON 序列化和读取校验，不能假设字符串会自动变回对象。不要调用 <code>localStorage.clear()</code>，同源下其他功能的键也会被删；使用前缀和版本便于迁移。</p>
<p>它没有内置 TTL。需要过期时保存时间并在读取时判断，同时考虑时钟变化和清理。每次输入都序列化大型文档会阻塞主线程，这种数据应考虑 IndexedDB 或分片保存。</p>
<h2>sessionStorage 是页面会话级隔离</h2>
<p><code>sessionStorage</code> 通常按源和顶层浏览上下文区分。刷新同一标签页通常仍能读到它，独立打开的另一个标签页通常拥有不同内容；新页面保留 opener 时，初始值可能被复制，之后又各自独立。</p>
<p>它适合当前标签页的临时筛选、未完成步骤和一次性 UI 状态。重要草稿不能只放在这里，因为标签页结束、会话恢复策略或用户清理都可能让它消失。它也不是权限和过期机制，验证码、会话和授权截止时间应由服务端控制。</p>
<h2>跨标签通知不是并发事务</h2>
<p><code>localStorage</code> 改变时，其他符合条件的文档可以收到 <code>storage</code> 事件，执行写入的窗口不会收到自己的那次事件。这个事件只传递变化通知，不提供锁、版本比较或事务；两个标签页都读到旧值再写回，仍会互相覆盖。</p>
<p>需要跨标签广播复杂状态时可以考虑 BroadcastChannel，但并发写入仍需 IndexedDB 事务、版本号、Web Locks 或幂等协议。事件通知不会自动解决数据一致性。</p>
<h2>敏感信息和恢复策略要单独设计</h2>
<p>脚本可读的 localStorage 和 sessionStorage 都可能被同源 XSS 读取，不适合存放长期密钥和可直接换取高权限的令牌。把令牌从 Cookie 换到 localStorage 并不会自动更安全。</p>
<p>本地数据可能因空间不足、隐私模式、浏览器清理和设备故障而消失。主题和缓存可以回退或重建，重要业务数据应有服务端同步、导出或恢复方案。先按数据的重要性设计丢失后的行为，再选择存储 API。</p>`};export{e as default};