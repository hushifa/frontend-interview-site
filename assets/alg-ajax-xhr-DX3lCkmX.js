var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如写一个 <code>ajax({ url: &#x27;/api/user&#x27;, method: &#x27;GET&#x27; })</code>，返回 Promise，成功时拿到数据，失败时进入 <code>catch</code>。底层用浏览器的 <code>XMLHttpRequest</code>。</p>
<p>步骤是：<code>new XMLHttpRequest()</code> 创建请求，<code>open(method, url)</code> 设置方法和地址，需要的话用 <code>setRequestHeader</code> 加请求头，最后 <code>send(body)</code> 发出。MDN 写明，<code>setRequestHeader</code> 必须在 <code>open</code> 之后、<code>send</code> 之前调用。结果通过事件告诉我们：<code>load</code> 表示收到了响应，<code>error</code> 表示网络错误，<code>timeout</code> 表示超时，<code>abort</code> 表示被取消。</p>
<p>最容易写错的是成功的判断。服务器返回 404、500 也是一个完整的响应，同样触发 <code>load</code>，所以 <code>load</code> 里要再看 <code>status</code>，在 200 到 299 之间才 <code>resolve</code>，否则 <code>reject</code>。这和 <code>fetch</code> 收到 404 不会 <code>reject</code> 是同一个道理。</p>
<p>另外，网络错误时 <code>status</code> 是 0；超时用 <code>xhr.timeout</code> 设置毫秒数；要能取消，就把 <code>xhr.abort()</code> 暴露出去。现在新代码一般直接用 <code>fetch</code>，手写 XHR 主要是为了理解请求的过程，以及需要监听上传进度时使用。</p>
</blockquote>
<h2>手写 ajax</h2>
<p>下面的 <code>ajax</code> 把 <code>XMLHttpRequest</code> 的构造函数作为参数传进来，浏览器里不用传。为了在 Node 里运行，示例用一个假的 XHR 类，根据地址模拟成功、404 和网络错误。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">ajax</span>(<span class="hljs-params">{ url, method = <span class="hljs-string">&#x27;GET&#x27;</span>, headers = {}, body = <span class="hljs-literal">null</span>, timeout = <span class="hljs-number">0</span> }, XHR = XMLHttpRequest</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> xhr = <span class="hljs-keyword">new</span> <span class="hljs-title function_">XHR</span>();
    xhr.<span class="hljs-title function_">open</span>(method, url);
    <span class="hljs-comment">// 请求头只能在 open 之后、send 之前设置。</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [name, value] <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">entries</span>(headers)) xhr.<span class="hljs-title function_">setRequestHeader</span>(name, value);
    xhr.<span class="hljs-property">timeout</span> = timeout;
    xhr.<span class="hljs-property">responseType</span> = <span class="hljs-string">&#x27;json&#x27;</span>;

    xhr.<span class="hljs-property">onload</span> = <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">if</span> (xhr.<span class="hljs-property">status</span> &gt;= <span class="hljs-number">200</span> &amp;&amp; xhr.<span class="hljs-property">status</span> &lt; <span class="hljs-number">300</span>) <span class="hljs-title function_">resolve</span>(xhr.<span class="hljs-property">response</span>);
      <span class="hljs-keyword">else</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`请求失败，状态码 <span class="hljs-subst">\${xhr.status}</span>\`</span>));
    };
    xhr.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;网络错误&#x27;</span>));
    xhr.<span class="hljs-property">ontimeout</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;请求超时&#x27;</span>));
    xhr.<span class="hljs-property">onabort</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;请求已取消&#x27;</span>));

    xhr.<span class="hljs-title function_">send</span>(body);
  });
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">FakeXHR</span> {
  <span class="hljs-title function_">open</span>(<span class="hljs-params">method, url</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">url</span> = url;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">headers</span> = {};
  }
  <span class="hljs-title function_">setRequestHeader</span>(<span class="hljs-params">name, value</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">headers</span>[name] = value;
  }
  <span class="hljs-title function_">send</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">url</span> === <span class="hljs-string">&#x27;/offline&#x27;</span>) {
        <span class="hljs-variable language_">this</span>.<span class="hljs-property">status</span> = <span class="hljs-number">0</span>;
        <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">onerror</span>();
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">status</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-property">url</span> === <span class="hljs-string">&#x27;/missing&#x27;</span> ? <span class="hljs-number">404</span> : <span class="hljs-number">200</span>;
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">response</span> = <span class="hljs-variable language_">this</span>.<span class="hljs-property">status</span> === <span class="hljs-number">200</span> ? { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;小明&#x27;</span> } : <span class="hljs-literal">null</span>;
      <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">onload</span>();
    }, <span class="hljs-number">10</span>);
  }
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">show</span> = (<span class="hljs-params">promise</span>) =&gt;
  promise.<span class="hljs-title function_">then</span>(
    <span class="hljs-function">(<span class="hljs-params">data</span>) =&gt;</span> <span class="hljs-string">\`成功：<span class="hljs-subst">\${data.name}</span>\`</span>,
    <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-string">\`失败：<span class="hljs-subst">\${error.message}</span>\`</span>,
  );

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
  <span class="hljs-title function_">show</span>(<span class="hljs-title function_">ajax</span>({ <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/user&#x27;</span> }, <span class="hljs-title class_">FakeXHR</span>)),
  <span class="hljs-title function_">show</span>(<span class="hljs-title function_">ajax</span>({ <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/missing&#x27;</span> }, <span class="hljs-title class_">FakeXHR</span>)),
  <span class="hljs-title function_">show</span>(<span class="hljs-title function_">ajax</span>({ <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/offline&#x27;</span> }, <span class="hljs-title class_">FakeXHR</span>)),
]).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">lines</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(lines.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; | &#x27;</span>)); <span class="hljs-comment">// 成功：小明 | 失败：请求失败，状态码 404 | 失败：网络错误</span>
});
</code></pre></div>
<p><code>/missing</code> 返回 404，假 XHR 调用的是 <code>onload</code>，不是 <code>onerror</code>，这和真实浏览器一致。XHR 规范里，只要收到了服务器的响应，就会触发 <code>load</code>；只有连不上服务器、跨域被拦这类没拿到响应的情况，才会触发 <code>error</code>。所以 404 能进入 <code>catch</code>，靠的是 <code>onload</code> 里对 <code>status</code> 的判断。</p>
<p>为什么设置 <code>responseType = &#x27;json&#x27;</code>？设置以后，<code>xhr.response</code> 就是浏览器帮我们解析好的对象，不用自己 <code>JSON.parse(xhr.responseText)</code>。如果服务器返回的不是合法 JSON，<code>response</code> 是 <code>null</code>。</p>
<h2>readyState 和 onreadystatechange 还要用吗</h2>
<p>老写法监听 <code>onreadystatechange</code>，判断 <code>xhr.readyState === 4</code> 表示请求结束。<code>readyState</code> 是请求的阶段，0 是还没调用 <code>open</code>，4 是完成。可是请求结束不一定是成功，网络错误、超时、取消时 <code>readyState</code> 也会变成 4，这时还得再看 <code>status</code> 是不是 0，写起来容易漏。</p>
<p>所以现在更推荐分别监听 <code>load</code>、<code>error</code>、<code>timeout</code>、<code>abort</code>，每种结果对应一个事件，不用自己区分。</p>
<h2>怎样支持取消和上传进度</h2>
<p>取消只需要调用 <code>xhr.abort()</code>，会触发 <code>abort</code> 事件，Promise 随之 <code>reject</code>。可以让 <code>ajax</code> 返回 <code>{ promise, abort: () =&gt; xhr.abort() }</code>，或者接收一个 <code>AbortSignal</code>，在它的 <code>abort</code> 事件里调用 <code>xhr.abort()</code>。</p>
<p>上传进度是 XHR 相比 <code>fetch</code> 仍然有用的地方。<code>xhr.upload</code> 上可以监听 <code>progress</code> 事件，事件对象里的 <code>loaded</code> 和 <code>total</code> 是已上传和总共的字节数，用来显示上传进度条。</p>
<h2>常见追问</h2>
<p><strong><code>fetch</code> 和 XHR 在错误处理上有什么相同之处？</strong></p>
<blockquote>
<p>两者都只在网络层面失败时才算出错，HTTP 状态码 404、500 都算正常拿到了响应。所以都要自己检查状态码，<code>fetch</code> 里看的是 <code>response.ok</code>，见<a href="/questions/http-fetch-errors/">《为什么 fetch 收到 404 不一定进入 catch？》</a>。</p>
</blockquote>
<p><strong>跨域请求失败时，能拿到具体原因吗？</strong></p>
<blockquote>
<p>拿不到。被 CORS 拦下的请求在脚本里表现为网络错误，<code>status</code> 是 0，具体原因只会显示在开发者工具的控制台里，这是为了不让脚本探测别的站点的信息。</p>
</blockquote>`};export{e as default};