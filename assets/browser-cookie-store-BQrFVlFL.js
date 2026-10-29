var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前在前端读写 Cookie，只能操作 <code>document.cookie</code> 这个字符串，自己拼、自己解析。Cookie Store API 换成了 <code>cookieStore.get()</code>、<code>set()</code>、<code>delete()</code> 这几个返回 Promise 的方法，还能监听 Cookie 的变化。</p>
<p>它只在安全上下文里能用，也就是 HTTPS 或 localhost，写进去的 Cookie 一定带 Secure。Chromium、Firefox 140、Safari 18.4 起都支持基本读写，但部分方法和事件仍有差异，MDN 兼容表把整套 API 列为尚未全面可用，所以要保留降级方案。</p>
<p>参数上有几个细节：过期时间用 <code>expires</code> 传毫秒时间戳，没有 <code>maxAge</code>；<code>sameSite</code> 默认是 <code>strict</code>。</p>
<p>最重要的边界是，它读不到 <code>HttpOnly</code> Cookie。所以它适合管理主题、语言这种不敏感的 Cookie，登录会话还是应该由服务端设置 HttpOnly Cookie。</p>
</blockquote>
<h2>怎样写入和读取</h2>
<p>下面把用户选的主题存一年，再读出来：</p>
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
<p>和 <code>document.cookie</code> 比，不用再手动拼 <code>; Path=/</code> 这类字符串，也不用自己按分号切开去找值。</p>
<p>可是 <code>await</code> 成功不一定代表写进去了。参数不合法时 Promise 会 reject；但如果是被浏览器策略拒绝，会不会 reject 没有统一保证。所以关键的 Cookie 写完以后，可以再 <code>get()</code> 一次确认。</p>
<h2>怎样知道 Cookie 变了</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">cookieStore.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> cookie <span class="hljs-keyword">of</span> event.<span class="hljs-property">changed</span>) {
    <span class="hljs-keyword">if</span> (cookie.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;theme&#x27;</span>) <span class="hljs-title function_">applyTheme</span>(cookie.<span class="hljs-property">value</span>);
  }
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> cookie <span class="hljs-keyword">of</span> event.<span class="hljs-property">deleted</span>) {
    <span class="hljs-keyword">if</span> (cookie.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;theme&#x27;</span>) <span class="hljs-title function_">applyTheme</span>(<span class="hljs-string">&#x27;system&#x27;</span>);
  }
});
</code></pre></div>
<p><code>change</code> 事件把变化分成两组：<code>changed</code> 是新增或修改的，<code>deleted</code> 是被删掉的。不光脚本改 Cookie 会触发，服务端用 <code>Set-Cookie</code> 改了非 HttpOnly 的 Cookie，这个事件也会触发。Service Worker 里也能通过 <code>cookieStore</code> 用这套 API。</p>
<h2>不支持的浏览器怎么办</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">setThemeFallback</span>(<span class="hljs-params">theme</span>) {
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">cookie</span> = <span class="hljs-string">\`theme=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(theme)}</span>; Max-Age=31536000; Path=/; SameSite=Lax; Secure\`</span>;
}

<span class="hljs-keyword">const</span> save = <span class="hljs-string">&#x27;cookieStore&#x27;</span> <span class="hljs-keyword">in</span> globalThis ? setTheme : setThemeFallback;
</code></pre></div>
<p>降级就是回到 <code>document.cookie</code>。要注意两条路径写入的过期时间和属性得一致，否则用户换个浏览器，Cookie 的行为就不一样了。</p>
<h2>常见追问</h2>
<p><strong>Cookie Store API 能用来管理登录状态吗？</strong></p>
<blockquote>
<p>不能。脚本能读写的 Cookie，一旦页面有 XSS 就会被偷走。它本身也读不到 HttpOnly Cookie。登录会话应该由服务端下发 HttpOnly Cookie。</p>
</blockquote>
<p><strong>主题偏好放 Cookie 还是 localStorage？</strong></p>
<blockquote>
<p>看服务端要不要用。服务端渲染时需要知道主题，就放 Cookie，请求会带上它。纯前端用的数据放 localStorage，避免每次请求都多带一份。</p>
</blockquote>`};export{e as default};