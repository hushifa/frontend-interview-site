var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>cookieStore.get()</code>、<code>set()</code>、<code>delete()</code> 都返回 Promise，替代手动拼接和解析 <code>document.cookie</code> 字符串。</li>
<li>它只在安全上下文（HTTPS 或 localhost）中可用，写入的 Cookie 一定带 Secure；MDN 标为 Baseline 2025。</li>
<li>过期时间用 <code>expires</code> 传毫秒时间戳，没有 <code>maxAge</code> 选项；<code>sameSite</code> 默认是 <code>strict</code>。</li>
<li>读不到 <code>HttpOnly</code> Cookie，登录会话应由服务端设置 HttpOnly Cookie。</li>
<li>可以监听 <code>change</code> 事件，Service Worker 中也能通过 <code>cookieStore</code> 使用。</li>
</ul>
<h2>写入和读取</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">setTheme</span>(<span class="hljs-params">theme</span>) {
  <span class="hljs-keyword">await</span> cookieStore.<span class="hljs-title function_">set</span>({
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;theme&#x27;</span>,
    <span class="hljs-attr">value</span>: theme,
    <span class="hljs-attr">expires</span>: <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() + <span class="hljs-number">365</span> * <span class="hljs-number">24</span> * <span class="hljs-number">60</span> * <span class="hljs-number">60</span> * <span class="hljs-number">1000</span>,
    <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/&#x27;</span>,
    <span class="hljs-attr">sameSite</span>: <span class="hljs-string">&#x27;lax&#x27;</span>,
  });
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getTheme</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> cookie = <span class="hljs-keyword">await</span> cookieStore.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;theme&#x27;</span>);
  <span class="hljs-keyword">return</span> cookie?.<span class="hljs-property">value</span> ?? <span class="hljs-string">&#x27;system&#x27;</span>;
}
</code></pre></div>
<p><code>set()</code> 参数不合法时 Promise 会 reject；被浏览器策略拒绝时是否 reject 没有统一保证，关键 Cookie 写入后可以用 <code>get()</code> 确认。</p>
<h2>监听变化</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">cookieStore.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> cookie <span class="hljs-keyword">of</span> event.<span class="hljs-property">changed</span>) {
    <span class="hljs-keyword">if</span> (cookie.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;theme&#x27;</span>) <span class="hljs-title function_">applyTheme</span>(cookie.<span class="hljs-property">value</span>);
  }
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> cookie <span class="hljs-keyword">of</span> event.<span class="hljs-property">deleted</span>) {
    <span class="hljs-keyword">if</span> (cookie.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;theme&#x27;</span>) <span class="hljs-title function_">applyTheme</span>(<span class="hljs-string">&#x27;system&#x27;</span>);
  }
});
</code></pre></div>
<p>服务端通过 <code>Set-Cookie</code> 修改非 HttpOnly 的 Cookie 时，这个事件也会触发。</p>
<h2>降级</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">setThemeFallback</span>(<span class="hljs-params">theme</span>) {
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">cookie</span> = <span class="hljs-string">\`theme=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(theme)}</span>; Max-Age=31536000; Path=/; SameSite=Lax; Secure\`</span>;
}

<span class="hljs-keyword">const</span> save = <span class="hljs-string">&#x27;cookieStore&#x27;</span> <span class="hljs-keyword">in</span> globalThis ? setTheme : setThemeFallback;
</code></pre></div>
<p>两条路径要写入同样的过期时间和属性，否则用户在不同浏览器得到的 Cookie 行为不一致。</p>
<h2>常见追问</h2>
<ul>
<li>和 localStorage 怎么选：服务端渲染时需要读取的偏好用 Cookie，纯前端使用的数据用 localStorage，避免每次请求都携带。</li>
<li>能不能用它做认证：不能。脚本能读写的 Cookie 一旦遇到 XSS 就会泄露。</li>
</ul>`};export{e as default};