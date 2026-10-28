var e={answerHtml:`<p>页面导航、Service Worker 请求拦截和权限边界经常需要回答“这个 URL 属于哪一类资源”。如果用字符串 <code>startsWith(&#x27;/users/&#x27;)</code> 或手写正则，容易把 <code>/users/123/edit</code>、查询参数、端口和编码差异处理错。<code>URLPattern</code> 提供了按 URL 各组成部分匹配的声明式方式，但它只是匹配器，不会替你加载组件、管理历史记录或决定权限。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> userPattern = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>(
  { <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/users/:id&#x27;</span> },
  <span class="hljs-string">&#x27;https://example.com&#x27;</span>,
);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(userPattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://example.com/users/42&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(userPattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://example.com/users/42/edit&#x27;</span>)); <span class="hljs-comment">// false</span>

<span class="hljs-keyword">const</span> result = userPattern.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;https://example.com/users/42&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result?.<span class="hljs-property">pathname</span>.<span class="hljs-property">groups</span>.<span class="hljs-property">id</span>); <span class="hljs-comment">// 42</span>
</code></pre></div>
<p>在不支持 URLPattern 的运行时，构造器本身可能不存在；能力检测和降级路径必须在模块初始化前处理。示例中的第二个参数把相对模式的基准固定为 <code>https://example.com</code>，避免同一模式在不同当前页面下得到不同解释。</p>
<h2>URL 的不同部分可以分别约束</h2>
<p><code>URLPattern</code> 可以匹配 <code>protocol</code>、<code>username</code>、<code>password</code>、<code>hostname</code>、<code>port</code>、<code>pathname</code>、<code>search</code> 和 <code>hash</code> 等部分。实际应用应只声明需要的部分：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> assetPattern = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({
  <span class="hljs-attr">protocol</span>: <span class="hljs-string">&#x27;https&#x27;</span>,
  <span class="hljs-attr">hostname</span>: <span class="hljs-string">&#x27;cdn.example.com&#x27;</span>,
  <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/assets/:name.:ext&#x27;</span>,
});

<span class="hljs-keyword">const</span> match = assetPattern.<span class="hljs-title function_">exec</span>(
  <span class="hljs-string">&#x27;https://cdn.example.com/assets/app.8f3a.js&#x27;</span>,
);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(match?.<span class="hljs-property">pathname</span>.<span class="hljs-property">groups</span>);
<span class="hljs-comment">// { name: &#x27;app&#x27;, ext: &#x27;js&#x27; }</span>
</code></pre></div>
<p>没有写出的部分通常使用宽松匹配，不能误以为“只写 pathname 就自动限制同源”。服务 Worker、图片代理和跳转处理器要显式校验 origin、协议和允许的主机；匹配成功只是形状符合，不代表请求可信。</p>
<p>路径参数可以表达一段动态值，但不要把它当成解码和业务校验的替代品。拿到 <code>groups.id</code> 后仍要验证字符集、长度、数值范围和资源权限：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readUserId</span>(<span class="hljs-params">url, pattern</span>) {
  <span class="hljs-keyword">const</span> result = pattern.<span class="hljs-title function_">exec</span>(url);
  <span class="hljs-keyword">const</span> rawId = result?.<span class="hljs-property">pathname</span>.<span class="hljs-property">groups</span>.<span class="hljs-property">id</span>;
  <span class="hljs-keyword">if</span> (!rawId || !<span class="hljs-regexp">/^[1-9]\\d{0,11}$/</span>.<span class="hljs-title function_">test</span>(rawId)) {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  }
  <span class="hljs-keyword">return</span> rawId;
}
</code></pre></div>
<p>服务端仍必须重新解析和授权。客户端 URLPattern 匹配、Service Worker 拦截或前端路由成功，都不能证明用户有权读取对应用户 ID。</p>
<h2>通配符和查询参数要有明确语义</h2>
<p>模式支持参数和通配形式，但复杂匹配可读性会迅速下降。与其写一条包揽所有路径的模式，不如为资源类型建立几个边界清晰的模式：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> routes = [
  {
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;article&#x27;</span>,
    <span class="hljs-attr">pattern</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/articles/:slug&#x27;</span> }),
  },
  {
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;article-edit&#x27;</span>,
    <span class="hljs-attr">pattern</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/articles/:slug/edit&#x27;</span> }),
  },
];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">matchRoute</span>(<span class="hljs-params">url</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> route <span class="hljs-keyword">of</span> routes) {
    <span class="hljs-keyword">const</span> result = route.<span class="hljs-property">pattern</span>.<span class="hljs-title function_">exec</span>(url);
    <span class="hljs-keyword">if</span> (result) <span class="hljs-keyword">return</span> { <span class="hljs-attr">name</span>: route.<span class="hljs-property">name</span>, result };
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
}
</code></pre></div>
<p>顺序是业务契约的一部分：更具体的 <code>/edit</code> 路由应优先于可能匹配更宽路径的规则。<code>URLPattern</code> 不会替你解决两个模式同时匹配时选哪一个，也不会自动按静态段数量排序。路由表应在初始化时检查重复和歧义，避免新规则加入后悄悄改变旧页面。</p>
<p>查询字符串可以作为 <code>search</code> 部分匹配，但筛选参数通常需要 <code>URLSearchParams</code> 做结构化解析：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> searchPattern = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({
  <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/resources&#x27;</span>,
  <span class="hljs-attr">search</span>: <span class="hljs-string">&#x27;*topic*&#x27;</span>,
});

<span class="hljs-keyword">if</span> (searchPattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;https://example.com/resources?topic=react&#x27;</span>)) {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;https://example.com/resources?topic=react&#x27;</span>);
  <span class="hljs-keyword">const</span> topic = url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;topic&#x27;</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(topic);
}
</code></pre></div>
<p>上面的 search 模式只说明 URL 是否符合一个文本形状，不能代替重复键、编码、数组、空值和允许列表校验。对签名参数或权限参数，前后端必须使用相同的重复键和规范化策略，避免一个系统取第一项、另一个取最后一项。</p>
<h2>它和完整路由器不是一层能力</h2>
<p>一个完整前端路由器还要负责：</p>
<ul>
<li>历史记录和后退前进；</li>
<li>路由参数与 loader 数据的关联；</li>
<li>导航取消、错误边界和代码分割；</li>
<li>页面标题、滚动恢复和键盘焦点；</li>
<li>权限检查、缓存和页面状态保留。</li>
</ul>
<p><code>URLPattern</code> 只提供匹配和分组提取。可以把它作为路由器内部的一个小部件，也可以在 Service Worker、边缘请求分流和轻量 Web Component 中单独使用。不要因为模式能匹配 <code>/dashboard</code>，就把它当成导航完成或页面已经安全加载。</p>
<p>匹配器与导航状态也应分开：URL 变化后，旧请求可能仍在进行，新的匹配结果不应自动允许旧响应覆盖当前页面。路由器仍需使用导航身份、AbortSignal 或版本号检查结果是否过期。</p>
<h2>基准 URL、编码和标准化</h2>
<p>相对模式需要一个明确的基准。没有基准时，包含相对 pathname、协议或主机的规则可能因构造方式不同而得到意外结果。推荐在共享路由表中使用绝对 URL 或固定 base URL，不要把当前页面地址隐式作为配置来源。</p>
<p>URL 的大小写、百分号编码、尾部斜杠和默认端口会影响匹配结果或规范化结果。业务应先决定 <code>/docs</code> 与 <code>/docs/</code> 是否是同一资源，再在模式、服务器重定向和静态文件部署中保持一致。不要通过对整个 URL <code>toLowerCase()</code> 来解决大小写问题：路径、查询参数值和用户 ID 可能大小写敏感。</p>
<p><code>groups</code> 中的值不是任意可信文本，也不应直接拼进 HTML、SQL、shell 命令或跳转地址。用于生成链接时应让 <code>URL</code> 和 <code>URLSearchParams</code> 负责编码，并限制协议和目标 origin，避免把匹配后的参数变成开放重定向或注入入口。</p>
<h2>Service Worker 中的使用边界</h2>
<p>Service Worker 可以用 URLPattern 判断哪些请求交给缓存策略，但缓存命中仍需考虑 HTTP 方法、请求头、用户身份和响应的共享性：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> staticAsset = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({
  <span class="hljs-attr">origin</span>: <span class="hljs-variable language_">self</span>.<span class="hljs-property">location</span>.<span class="hljs-property">origin</span>,
  <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/assets/*&#x27;</span>,
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">request</span>.<span class="hljs-property">method</span> !== <span class="hljs-string">&#x27;GET&#x27;</span> || !staticAsset.<span class="hljs-title function_">test</span>(event.<span class="hljs-property">request</span>.<span class="hljs-property">url</span>)) {
    <span class="hljs-keyword">return</span>;
  }

  event.<span class="hljs-title function_">respondWith</span>(caches.<span class="hljs-title function_">match</span>(event.<span class="hljs-property">request</span>));
});
</code></pre></div>
<p>这只是路由分支示意。缓存命中 <code>undefined</code> 时仍要决定是否回源，缓存键是否包含查询参数，响应是否含私有 Cookie，以及 Service Worker 更新期间旧脚本如何切换。URLPattern 不会自动防止把带用户数据的响应放入共享缓存，也不会让跨源请求绕过 CORS。</p>
<h2>兼容性和降级策略</h2>
<p>URLPattern 的支持范围依赖浏览器、WebView、Node.js 和 Service Worker 运行时。能力检测可以选择成熟路由库、<code>URL</code>/<code>URLSearchParams</code> 组合或经过测试的有限正则作为降级，但降级实现必须保留相同的路径、编码、参数和优先级语义：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createPathMatcher</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">URLPattern</span> === <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLPattern</span>({ <span class="hljs-attr">pathname</span>: <span class="hljs-string">&#x27;/users/:id&#x27;</span> });
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">exec</span>(<span class="hljs-params">input</span>) {
      <span class="hljs-keyword">const</span> pathname = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(input, location.<span class="hljs-property">href</span>).<span class="hljs-property">pathname</span>;
      <span class="hljs-keyword">const</span> match = <span class="hljs-regexp">/^\\/users\\/([^/]+)$/</span>.<span class="hljs-title function_">exec</span>(pathname);
      <span class="hljs-keyword">return</span> match
        ? { <span class="hljs-attr">pathname</span>: { <span class="hljs-attr">groups</span>: { <span class="hljs-attr">id</span>: <span class="hljs-built_in">decodeURIComponent</span>(match[<span class="hljs-number">1</span>]) } } }
        : <span class="hljs-literal">null</span>;
    },
  };
}
</code></pre></div>
<p>示例降级路径只覆盖一个简单模式，<code>decodeURIComponent</code> 的异常、编码斜杠和重复参数在生产中必须处理。不要把一个小正则包装成“完整兼容 URLPattern”，否则新模式加入后会出现只在部分浏览器生效的路由差异。</p>
<p>验收时至少测试静态段与动态段冲突、尾部斜杠、编码字符、查询参数、不同 origin、非法输入、Service Worker 更新、旧浏览器和路由取消。<code>URLPattern</code> 的价值是把 URL 结构匹配写成可读、可复用的声明；路由优先级、数据加载、权限、安全和生命周期仍然需要应用层明确负责。</p>`};export{e as default};