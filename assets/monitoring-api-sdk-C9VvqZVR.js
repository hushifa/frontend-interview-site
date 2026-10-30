var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如想知道线上哪些接口慢、哪些接口报错。业务代码里请求很分散，不可能每处都手动打点，所以监控 SDK 会在页面启动时把 <code>window.fetch</code> 换成自己的包装函数，再改写 <code>XMLHttpRequest.prototype</code> 上的 <code>open</code> 和 <code>send</code>，之后所有请求都会先经过 SDK。</p>
<p>包装函数在请求发出前记下开始时间，请求结束后算出耗时，再带上方法、路径和状态码上报。要注意 <code>fetch</code> 遇到 404、500 这类状态码不会 reject，只有网络错误、请求被中止这类情况才会 reject，所以“接口报错”要看 <code>response.ok</code> 和 <code>status</code>。XHR 则监听 <code>loadend</code>，成功、失败、中止都会触发它。</p>
<p>这样做主要是为了在用户反馈之前发现接口问题，还能把失败请求和 JS 错误、用户操作串起来排查。</p>
<p>有两点要特别注意。第一，上报本身也是一个请求，如果它也走被包装的 <code>fetch</code>，就会“上报产生请求、请求又触发上报”，所以要跳过上报地址。第二，URL 的查询参数、请求体和响应体里常有手机号、token，默认只采集去掉查询参数的路径，不采集内容。</p>
</blockquote>
<h2>怎样包装 fetch</h2>
<p>思路是保存原来的 <code>fetch</code>，返回一个签名相同的函数：先记时间，再调用原函数，在 Promise 的成功和失败分支里分别上报。下面的例子没有改全局对象，而是把原始 <code>fetch</code>、上报函数和时钟都作为参数传进去，这样在 Node 里也能用假的 <code>fetch</code> 跑通。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createMonitoredFetch</span>(<span class="hljs-params">originalFetch, options</span>) {
  <span class="hljs-keyword">const</span> { reportUrl, report, now } = options;

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">monitoredFetch</span>(<span class="hljs-params">input, init</span>) {
    <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">typeof</span> input === <span class="hljs-string">&#x27;string&#x27;</span> ? input : input.<span class="hljs-property">url</span>;
    <span class="hljs-comment">// 上报请求自己也走 fetch，不跳过就会无限上报。</span>
    <span class="hljs-keyword">if</span> (url.<span class="hljs-title function_">startsWith</span>(reportUrl)) <span class="hljs-keyword">return</span> <span class="hljs-title function_">originalFetch</span>(input, init);

    <span class="hljs-keyword">const</span> start = <span class="hljs-title function_">now</span>();
    <span class="hljs-keyword">const</span> method = (init &amp;&amp; init.<span class="hljs-property">method</span>) || <span class="hljs-string">&#x27;GET&#x27;</span>;
    <span class="hljs-comment">// 只保留路径，查询参数里可能有手机号、token。</span>
    <span class="hljs-keyword">const</span> path = url.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;?&#x27;</span>)[<span class="hljs-number">0</span>];

    <span class="hljs-keyword">return</span> <span class="hljs-title function_">originalFetch</span>(input, init).<span class="hljs-title function_">then</span>(
      <span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> {
        <span class="hljs-title function_">report</span>({ path, method, <span class="hljs-attr">status</span>: response.<span class="hljs-property">status</span>, <span class="hljs-attr">ok</span>: response.<span class="hljs-property">ok</span>, <span class="hljs-attr">duration</span>: <span class="hljs-title function_">now</span>() - start });
        <span class="hljs-keyword">return</span> response;
      },
      <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
        <span class="hljs-title function_">report</span>({ path, method, <span class="hljs-attr">status</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">duration</span>: <span class="hljs-title function_">now</span>() - start, <span class="hljs-attr">error</span>: error.<span class="hljs-property">name</span> });
        <span class="hljs-keyword">throw</span> error;
      },
    );
  };
}

<span class="hljs-keyword">let</span> clock = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">now</span> = (<span class="hljs-params"></span>) =&gt; clock;
<span class="hljs-keyword">const</span> records = [];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">fakeFetch</span>(<span class="hljs-params">url</span>) {
  clock += <span class="hljs-number">120</span>;
  <span class="hljs-keyword">if</span> (url.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;offline&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;Failed to fetch&#x27;</span>));
  <span class="hljs-keyword">const</span> status = url.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;missing&#x27;</span>) ? <span class="hljs-number">404</span> : <span class="hljs-number">200</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>({ status, <span class="hljs-attr">ok</span>: status &lt; <span class="hljs-number">400</span> });
}

<span class="hljs-keyword">const</span> monitoredFetch = <span class="hljs-title function_">createMonitoredFetch</span>(fakeFetch, {
  <span class="hljs-attr">reportUrl</span>: <span class="hljs-string">&#x27;/log&#x27;</span>,
  now,
  <span class="hljs-title function_">report</span>(<span class="hljs-params">record</span>) {
    records.<span class="hljs-title function_">push</span>(record);
    <span class="hljs-title function_">monitoredFetch</span>(<span class="hljs-string">&#x27;/log&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span> });
  },
});

<span class="hljs-title function_">monitoredFetch</span>(<span class="hljs-string">&#x27;/api/user?phone=13800000000&#x27;</span>)
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">monitoredFetch</span>(<span class="hljs-string">&#x27;/api/missing&#x27;</span>))
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">monitoredFetch</span>(<span class="hljs-string">&#x27;/api/offline&#x27;</span>))
  .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>)) <span class="hljs-comment">// TypeError</span>
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">line</span> = (<span class="hljs-params">r</span>) =&gt; <span class="hljs-string">\`<span class="hljs-subst">\${r.method}</span> <span class="hljs-subst">\${r.path}</span> <span class="hljs-subst">\${r.status}</span> <span class="hljs-subst">\${r.ok}</span> <span class="hljs-subst">\${r.duration}</span>\`</span>;
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">line</span>(records[<span class="hljs-number">0</span>])); <span class="hljs-comment">// GET /api/user 200 true 120</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">line</span>(records[<span class="hljs-number">1</span>])); <span class="hljs-comment">// GET /api/missing 404 false 120</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">line</span>(records[<span class="hljs-number">2</span>])); <span class="hljs-comment">// GET /api/offline 0 false 120</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(records.<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
  });
</code></pre></div>
<p>先看第二行记录。<code>/api/missing</code> 返回 404，假 <code>fetch</code> 照样 resolve，这和真实的 <code>fetch</code> 一致：MDN 写明，<code>fetch()</code> 的 Promise 只在请求失败时 reject，比如 URL 格式错误或网络错误，服务器返回 404、504 这类状态码并不会 reject。所以 SDK 必须在成功分支里看 <code>ok</code>，否则 4xx、5xx 全被当成成功。</p>
<p>第三行是真正的网络失败，Promise reject，没有状态码，SDK 记成 0 并保留错误名。包装函数上报以后还要把错误重新抛出去，业务代码的 <code>catch</code> 才能照常拿到它，所以外面打印出了 <code>TypeError</code>。成功分支同理，要把 <code>response</code> 原样返回。</p>
<p><code>report</code> 每次都会再发一个 <code>/log</code> 请求，可最后只有 3 条记录。原因是包装函数开头判断了上报地址，直接交给原始 <code>fetch</code>，不再计时上报。去掉这个判断，每次上报都会产生新的上报，就成了死循环。另一种做法是 SDK 在替换前保存原始 <code>fetch</code>，上报时直接用它。</p>
<p>第一行的路径里没有 <code>phone=...</code>，因为采集时只保留了问号前面的部分。</p>
<h2>XHR 怎样代理</h2>
<p><code>XMLHttpRequest</code> 不是一个函数调用就完成的，方法和 URL 在 <code>open</code> 里传，请求在 <code>send</code> 时才发出，结果通过事件通知。所以要改写原型上的两个方法：<code>open</code> 里把方法和 URL 存到实例上，<code>send</code> 里记开始时间并监听 <code>loadend</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> originalOpen = <span class="hljs-title class_">XMLHttpRequest</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">open</span>;
<span class="hljs-keyword">const</span> originalSend = <span class="hljs-title class_">XMLHttpRequest</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">send</span>;

<span class="hljs-title class_">XMLHttpRequest</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">open</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params">method, url, ...rest</span>) {
  <span class="hljs-variable language_">this</span>.<span class="hljs-property">__monitor</span> = { method, <span class="hljs-attr">url</span>: <span class="hljs-title class_">String</span>(url) };
  <span class="hljs-keyword">return</span> originalOpen.<span class="hljs-title function_">call</span>(<span class="hljs-variable language_">this</span>, method, url, ...rest);
};

<span class="hljs-title class_">XMLHttpRequest</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">send</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params">body</span>) {
  <span class="hljs-keyword">const</span> info = <span class="hljs-variable language_">this</span>.<span class="hljs-property">__monitor</span>;
  <span class="hljs-keyword">if</span> (info &amp;&amp; !info.<span class="hljs-property">url</span>.<span class="hljs-title function_">startsWith</span>(<span class="hljs-variable constant_">REPORT_URL</span>)) {
    <span class="hljs-keyword">const</span> start = performance.<span class="hljs-title function_">now</span>();
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;loadend&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">report</span>({
        <span class="hljs-attr">method</span>: info.<span class="hljs-property">method</span>,
        <span class="hljs-attr">path</span>: info.<span class="hljs-property">url</span>.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;?&#x27;</span>)[<span class="hljs-number">0</span>],
        <span class="hljs-attr">status</span>: <span class="hljs-variable language_">this</span>.<span class="hljs-property">status</span>,
        <span class="hljs-attr">duration</span>: performance.<span class="hljs-title function_">now</span>() - start,
      });
    });
  }
  <span class="hljs-keyword">return</span> originalSend.<span class="hljs-title function_">call</span>(<span class="hljs-variable language_">this</span>, body);
};
</code></pre></div>
<p>为什么监听 <code>loadend</code> 而不是 <code>load</code>？因为 MDN 说明，<code>loadend</code> 在请求完成时触发，不管成功（在 <code>load</code> 之后）还是失败（在 <code>abort</code> 或 <code>error</code> 之后）。只听 <code>load</code> 就会漏掉失败的请求。请求失败或被中止时 <code>status</code> 是 0，可以据此和正常返回区分。</p>
<h2>能不能采集响应体</h2>
<p>有时想从响应里取业务错误码，比如 HTTP 200 但 <code>code</code> 不是 0。这时不能直接读 <code>response.json()</code>，因为响应体只能读一次，SDK 读了，业务代码再读就会失败。MDN 给的办法是 <code>response.clone()</code>，但要在读取之前克隆，响应体已经被读过时 <code>clone()</code> 会抛 <code>TypeError</code>。MDN 还提醒，克隆后如果只读其中一份，整个响应体会被缓存在内存里，所以大响应不适合这样做。</p>
<p>实际上大多数 SDK 默认不采集请求体和响应体，一是内存和上报体积，二是里面常有用户数据。确实需要时，只按白名单取个别字段。</p>
<h2>只看 Performance API 行不行</h2>
<p>不改写任何函数也能拿到一部分数据：<code>performance.getEntriesByType(&#x27;resource&#x27;)</code> 里，<code>initiatorType</code> 为 <code>fetch</code> 或 <code>xmlhttprequest</code> 的条目就是接口请求，自带各阶段耗时。</p>
<p>但它有两个限制。跨域请求如果响应没有 <code>Timing-Allow-Origin</code> 头，详细的阶段耗时会被置为 0；而且 MDN 说明这个头只开放时间信息，不开放状态码、响应体大小这类描述响应本身的属性。所以要拿到接口失败率，还是要代理 <code>fetch</code> 和 XHR，Performance API 用来补充各阶段耗时。</p>
<h2>常见追问</h2>
<p><strong>SDK 的包装函数会不会影响业务代码？</strong></p>
<blockquote>
<p>包装函数要做到“透明”：参数原样传给原函数，返回值原样返回，错误原样抛出。上报逻辑本身要放在 <code>try...catch</code> 里，SDK 自己出错也不能让业务请求失败。</p>
</blockquote>
<p><strong>接口错误和 JS 错误怎样关联？</strong></p>
<blockquote>
<p>每条接口记录带上页面地址、时间和会话 ID，和<a href="/questions/monitoring-error-capture/">《前端怎样全局捕获 JS 错误、Promise 拒绝和资源加载失败？》</a>里采集的错误放进同一个会话。排查时按会话和时间顺序排起来，就能看到“哪个接口失败后页面报了错”。</p>
</blockquote>
<p><strong>接口数据量大，怎样上报？</strong></p>
<blockquote>
<p>不要每个请求发一次，先放进队列攒一批，定时或页面隐藏时发出，可以再按比例采样。页面关闭时的发送方式见<a href="/questions/monitoring-beacon/">《页面关闭时怎样可靠上报？sendBeacon 和 keepalive 怎么选？》</a>，采样和去重见<a href="/questions/monitoring-sampling-alert/">《前端监控数据怎样做采样、去重、聚合和告警？》</a>。</p>
</blockquote>`};export{e as default};