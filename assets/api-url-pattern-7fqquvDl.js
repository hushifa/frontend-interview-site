var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写路由时，经常要判断“这个网址是不是 <code>/users/某个 id</code>”，还要把 id 取出来。以前要自己写正则，现在浏览器有了 <code>URLPattern</code>。它的写法和 path-to-regexp 差不多，<code>:id</code> 是命名参数，<code>*</code> 是通配符，而且能分别匹配协议、主机、路径、查询、哈希。</p>
<p>用法很简单：<code>pattern.test(url)</code> 返回是否匹配，<code>pattern.exec(url)</code> 返回各部分的匹配结果和参数。</p>
<p>构造有两种写法。一种是字符串模式，第二个参数是基准地址；另一种是对象，基准地址写在对象的 <code>baseURL</code> 字段里。对象形式再传字符串第二个参数，会抛 <code>TypeError</code>。对象里没写的部分默认是通配符，比如不写 <code>hostname</code>，任何域名都能匹配。</p>
<p>MDN 标为 Baseline 2025，Worker 里也能用，旧浏览器可以用 <code>urlpattern-polyfill</code>。它只负责匹配，嵌套布局、数据加载、多条路由谁优先，还得自己处理。</p>
</blockquote>
<h2>基本用法</h2>
<p>下面用两种写法创建同一个模式。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/users/:id&#x27;</span>, <span class="hljs-attr">baseURL</span>: <span class="hljs-string">&#x27;https://example.com&#x27;</span> });

pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://example.com/users/42&#x27;</span>); <span class="hljs-comment">// true</span>
pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://other.com/users/42&#x27;</span>); <span class="hljs-comment">// false</span>
pattern.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;https://example.com/users/42&#x27;</span>).<span class="hljs-property">pathname</span>.<span class="hljs-property">groups</span>; <span class="hljs-comment">// { id: &#x27;42&#x27; }</span>

<span class="hljs-keyword">const</span> relative = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>(<span class="hljs-string">&#x27;/users/:id&#x27;</span>, <span class="hljs-string">&#x27;https://example.com&#x27;</span>);
relative.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://example.com/users/7&#x27;</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>为什么换了个域名就不匹配了？因为 <code>baseURL</code> 不只是用来补全路径，它还提供了协议和主机，所以这个模式只匹配 <code>example.com</code>。如果去掉 <code>baseURL</code>，主机没写就是通配符，<code>other.com</code> 也会匹配。</p>
<p>取参数要从 <code>exec</code> 结果的对应部分里拿，路径参数在 <code>pathname.groups</code> 里。</p>
<h2>给参数加约束</h2>
<p>默认情况下，<code>:name</code> 会匹配到下一个分隔符前最短的内容。遇到 <code>app.8f3a.js</code> 这种有多个点的文件名，结果就不符合预期。这时可以在参数后面加括号，写正则约束：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> asset = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/assets/:name([^\\\\/]+)\\\\.:ext([a-z0-9]+)&#x27;</span> });
asset.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;https://cdn.example.com/assets/app.8f3a.js&#x27;</span>).<span class="hljs-property">pathname</span>.<span class="hljs-property">groups</span>;
<span class="hljs-comment">// { name: &#x27;app.8f3a&#x27;, ext: &#x27;js&#x27; }</span>
</code></pre></div>
<p><code>[^\\/]+</code> 是贪婪匹配，它先吃掉尽量多的内容，再回溯，让 <code>ext</code> 只拿到最后一段扩展名，所以 <code>name</code> 是 <code>app.8f3a</code>。</p>
<p>有个坑：字符类里的 <code>/</code> 要写成 <code>\\/</code>。写成 <code>[^/]+</code> 时，Chrome 156 在构造阶段就抛 <code>TypeError</code>（invalid regular expression group）。</p>
<p>另外还有几个修饰符：<code>:id?</code> 表示可选，<code>:path+</code> 表示一段或多段，<code>:path*</code> 表示零段或多段。</p>
<h2>在 Service Worker 里做路由</h2>
<p>下面只拦截同源的 <code>/api/</code> 请求，走网络优先策略。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> apiRoute = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/api/*&#x27;</span>, <span class="hljs-attr">baseURL</span>: <span class="hljs-variable language_">self</span>.<span class="hljs-property">location</span>.<span class="hljs-property">origin</span> });

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (apiRoute.<span class="hljs-title function_">test</span>(event.<span class="hljs-property">request</span>.<span class="hljs-property">url</span>)) {
    event.<span class="hljs-title function_">respondWith</span>(<span class="hljs-title function_">networkFirst</span>(event.<span class="hljs-property">request</span>));
  }
});
</code></pre></div>
<p>Service Worker 会收到页面发出的所有请求，包括第三方域名的。把 <code>baseURL</code> 设成当前源，第三方域名上的 <code>/api/</code> 就不会被误匹配。</p>
<h2>适合做框架路由吗</h2>
<p>它适合 Service Worker 的缓存路由、轻量路由表，以及校验回调地址是否在允许范围内。</p>
<p>框架路由一般还需要嵌套布局、数据加载和优先级排序，URLPattern 只解决了匹配这一部分。多个模式都能匹配同一个地址时，它不会帮你选，要自己按注册顺序判断。</p>
<h2>常见追问</h2>
<p><strong>对象形式为什么不能传第二个参数？</strong></p>
<blockquote>
<p>因为对象形式的基准地址规定写在 <code>baseURL</code> 字段里。再传一个字符串作第二个参数，就会抛 <code>TypeError</code>。字符串模式才用第二个参数当基准地址。</p>
</blockquote>
<p><strong>不写 <code>hostname</code> 会怎样？</strong></p>
<blockquote>
<p>对象里没写的部分默认是通配符，所以任何域名都能匹配。只想匹配自己的站点，就要写 <code>baseURL</code> 或 <code>hostname</code>。</p>
</blockquote>`};export{e as default};