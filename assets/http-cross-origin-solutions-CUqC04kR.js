var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面在 <code>https://shop.example.com</code>，接口在 <code>https://api.example.com</code>，两者域名不同，浏览器的同源策略默认不让页面脚本读取这个接口的响应，这就是跨域问题。解决办法可以按“谁来放行”分成几类。</p>
<p>最标准的做法是 CORS：服务器在响应里加上 <code>Access-Control-Allow-Origin</code> 等响应头，告诉浏览器“这个来源可以读我的响应”。浏览器看到允许就把响应交给脚本。复杂请求还会先发一个 <code>OPTIONS</code> 预检。它要后端配合，但最规范。</p>
<p>第二类是代理。同源策略只管浏览器，服务器之间互相请求不受限制。所以让浏览器请求同源的地址，比如 <code>/api/user</code>，再由同源的服务器把请求转发给真正的接口。开发时用 Vite、webpack dev server 的 <code>proxy</code> 配置，上线后用 Nginx 反向代理，或者把页面和接口部署在同一个域名下。</p>
<p>第三类是老办法 JSONP。<code>&lt;script&gt;</code> 标签加载别的域名的脚本不受同源策略限制，于是让接口返回一段调用函数的脚本，比如 <code>handleData({...})</code>，页面事先定义好 <code>handleData</code>，脚本一执行，数据就作为参数传进来了。要注意，它只能发 GET，出错很难捕获，最大的问题是等于无条件执行对方返回的代码，接口被篡改就能在你的页面上为所欲为，现在应该用 CORS 代替。</p>
</blockquote>
<h2>代理为什么能解决跨域</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// vite.config.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">server</span>: {
    <span class="hljs-attr">proxy</span>: {
      <span class="hljs-string">&#x27;/api&#x27;</span>: {
        <span class="hljs-attr">target</span>: <span class="hljs-string">&#x27;https://api.example.com&#x27;</span>,
        <span class="hljs-attr">changeOrigin</span>: <span class="hljs-literal">true</span>,
        <span class="hljs-attr">rewrite</span>: <span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> path.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/^\\/api/</span>, <span class="hljs-string">&#x27;&#x27;</span>),
      },
    },
  },
};
</code></pre></div>
<p>页面里请求 <code>/api/user</code>，浏览器发给的是开发服务器自己，和页面同源，不存在跨域。Vite 文档的说法是，路径以 <code>/api</code> 开头的请求，会被代理转发到配置的 <code>target</code>。开发服务器收到后，去掉 <code>/api</code> 前缀，向 <code>https://api.example.com/user</code> 发请求，再把结果原样返回给浏览器。</p>
<p><code>changeOrigin: true</code> 有什么用？它会把转发请求的 <code>Host</code> 头改成目标服务器的地址。有些服务器按 <code>Host</code> 区分站点，不改的话会收到 <code>localhost</code>，可能返回 404 或拒绝请求。</p>
<p>要注意，Vite 的 <code>server.proxy</code> 只在开发服务器上生效，打包出来的静态文件里没有这个代理。上线后要由 Nginx 或网关做同样的转发，不然请求 <code>/api</code> 会直接 404。</p>
<h2>JSONP 是怎样拿到数据的</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">jsonp</span>(<span class="hljs-params">url, callbackName</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> script = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;script&#x27;</span>);
    <span class="hljs-variable language_">window</span>[callbackName] = <span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> {
      <span class="hljs-title function_">resolve</span>(data);
      script.<span class="hljs-title function_">remove</span>();
      <span class="hljs-keyword">delete</span> <span class="hljs-variable language_">window</span>[callbackName];
    };
    script.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;JSONP 请求失败&#x27;</span>));
    script.<span class="hljs-property">src</span> = <span class="hljs-string">\`<span class="hljs-subst">\${url}</span>?callback=<span class="hljs-subst">\${callbackName}</span>\`</span>;
    <span class="hljs-variable language_">document</span>.<span class="hljs-property">head</span>.<span class="hljs-title function_">append</span>(script);
  });
}
</code></pre></div>
<p>页面先在全局定义一个函数，再插入一个 <code>&lt;script&gt;</code>，把函数名通过 <code>callback</code> 参数告诉服务器。服务器返回的不是 JSON，而是一行脚本 <code>handleData({&quot;name&quot;:&quot;小明&quot;})</code>。浏览器加载并执行这段脚本，就调用了页面事先定义的函数，数据作为参数传了进来。</p>
<p>为什么只能发 GET？因为 <code>&lt;script&gt;</code> 加载资源只会发 GET 请求，也没法设置请求头。为什么不安全？返回的内容是直接执行的脚本，接口要是返回了别的代码，页面也会照样执行。开启了 CSP 的页面，还要把接口域名加进 <code>script-src</code> 才能加载。</p>
<h2>常见追问</h2>
<p><strong>CORS 报错了，请求到底发出去没有？</strong></p>
<blockquote>
<p>简单请求已经发出去了，服务器也可能已经执行了，只是浏览器不让脚本读响应。需要预检的请求，预检没通过时真正的请求不会发出。具体规则见<a href="/questions/http-cors/">《什么是跨域？CORS 为什么需要服务端配合？》</a>。</p>
</blockquote>
<p><strong>页面和 iframe、新窗口之间跨域怎么通信？</strong></p>
<blockquote>
<p>用 <code>postMessage</code>。发送时指定目标来源，接收时检查 <code>event.origin</code>，见<a href="/questions/sec-postmessage/">《跨窗口 postMessage 怎样避免把消息发给错误对象？》</a>。<code>document.domain</code> 以前也能让同一主域下的页面互相访问，现在浏览器正在逐步禁用它，不要再用。</p>
</blockquote>`};export{e as default};