var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>URLPattern</code> 分别匹配协议、主机、路径、查询、哈希等部分，<code>:id</code> 是命名参数，<code>*</code> 是通配符。</li>
<li><code>pattern.test(url)</code> 返回布尔值，<code>pattern.exec(url)</code> 返回各部分的匹配结果和参数。</li>
<li>构造方式：字符串模式加第二个参数作基准地址，或对象形式把 <code>baseURL</code> 写在对象里；对象形式再传字符串第二个参数会抛 <code>TypeError</code>。</li>
<li>对象里没写的部分默认是通配符，不写 <code>hostname</code> 时任意域名都能匹配。</li>
<li>MDN 标为 Baseline 2025，Worker 中也可用；旧浏览器可以用 <code>urlpattern-polyfill</code>。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/users/:id&#x27;</span>, <span class="hljs-attr">baseURL</span>: <span class="hljs-string">&#x27;https://example.com&#x27;</span> });

pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://example.com/users/42&#x27;</span>); <span class="hljs-comment">// true</span>
pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://other.com/users/42&#x27;</span>); <span class="hljs-comment">// false</span>
pattern.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;https://example.com/users/42&#x27;</span>).<span class="hljs-property">pathname</span>.<span class="hljs-property">groups</span>; <span class="hljs-comment">// { id: &#x27;42&#x27; }</span>

<span class="hljs-keyword">const</span> relative = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>(<span class="hljs-string">&#x27;/users/:id&#x27;</span>, <span class="hljs-string">&#x27;https://example.com&#x27;</span>);
relative.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://example.com/users/7&#x27;</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>baseURL</code> 提供了协议和主机，所以只匹配 <code>example.com</code>。</p>
<h2>带约束的参数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> asset = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/assets/:name([^\\\\/]+)\\\\.:ext([a-z0-9]+)&#x27;</span> });
asset.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;https://cdn.example.com/assets/app.8f3a.js&#x27;</span>).<span class="hljs-property">pathname</span>.<span class="hljs-property">groups</span>;
<span class="hljs-comment">// { name: &#x27;app.8f3a&#x27;, ext: &#x27;js&#x27; }</span>
</code></pre></div>
<ul>
<li>括号里是正则约束，<code>[^\\/]+</code> 贪婪匹配，回溯后让 <code>ext</code> 只拿到最后一段扩展名。字符类里的 <code>/</code> 要写成 <code>\\/</code>；写成 <code>[^/]+</code> 时 Chrome 156 在构造阶段就抛 <code>TypeError</code>（invalid regular expression group）。</li>
<li>不加约束时，<code>:name</code> 默认匹配到下一个分隔符前的最短内容，多段扩展名的结果不符合预期。</li>
<li><code>:id?</code> 可选，<code>:path+</code> 一段或多段，<code>:path*</code> 零段或多段。</li>
</ul>
<h2>Service Worker 路由</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> apiRoute = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/api/*&#x27;</span>, <span class="hljs-attr">baseURL</span>: <span class="hljs-variable language_">self</span>.<span class="hljs-property">location</span>.<span class="hljs-property">origin</span> });

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (apiRoute.<span class="hljs-title function_">test</span>(event.<span class="hljs-property">request</span>.<span class="hljs-property">url</span>)) {
    event.<span class="hljs-title function_">respondWith</span>(<span class="hljs-title function_">networkFirst</span>(event.<span class="hljs-property">request</span>));
  }
});
</code></pre></div>
<p>把 <code>baseURL</code> 设为当前源，只拦截同源的 <code>/api/</code> 请求，第三方域名上的 <code>/api/</code> 不会被误匹配。</p>
<h2>适合与不适合</h2>
<ul>
<li>适合：Service Worker 缓存路由、轻量路由表、校验回调地址是否在允许范围内。</li>
<li>框架路由通常还需要嵌套布局、数据加载和优先级排序，URLPattern 只解决匹配部分。</li>
<li>多个模式都能匹配时，按注册顺序判断，自己决定优先级。</li>
</ul>`};export{e as default};