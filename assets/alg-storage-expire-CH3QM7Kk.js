var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如把城市列表缓存 1 小时，1 小时内再打开页面就不用重新请求。可是 MDN 写明，<code>localStorage</code> 的数据没有过期时间，不手动删就一直在，所以过期要自己实现。</p>
<p>做法是写入时把值和过期时间戳包成一个对象，比如 <code>{ value, expires: Date.now() + 3600000 }</code>，因为 <code>localStorage</code> 只能存字符串，所以要用 <code>JSON.stringify</code> 转一下。读取时先 <code>JSON.parse</code>，再拿过期时间和当前时间比，过期了就删掉这一项，返回 <code>null</code>。</p>
<p>这种删除是“读的时候才删”，过期但一直没被读的数据还占着空间。需要的话，可以在页面启动时遍历一遍，把过期的清掉。</p>
<p>有两处要防出错。读取时，这个 key 可能被别的代码写成了普通字符串，<code>JSON.parse</code> 会抛错，要用 <code>try...catch</code> 包住；写入时，存储空间满了 <code>setItem</code> 会抛出 <code>QuotaExceededError</code>，也要捕获，缓存写不进去不应该让页面报错。</p>
</blockquote>
<h2>封装 createExpiringStorage</h2>
<p>为了在 Node 里也能运行，下面把存储对象和取当前时间的函数作为参数传进来。在浏览器里直接传 <code>localStorage</code> 和 <code>Date.now</code> 即可。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createExpiringStorage</span>(<span class="hljs-params">storage, now = () =&gt; <span class="hljs-built_in">Date</span>.now()</span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">set</span>(<span class="hljs-params">key, value, ttl</span>) {
      <span class="hljs-keyword">const</span> record = { value, <span class="hljs-attr">expires</span>: ttl == <span class="hljs-literal">null</span> ? <span class="hljs-literal">null</span> : <span class="hljs-title function_">now</span>() + ttl };
      <span class="hljs-keyword">try</span> {
        storage.<span class="hljs-title function_">setItem</span>(key, <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(record));
        <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
      } <span class="hljs-keyword">catch</span> {
        <span class="hljs-comment">// 配额不足等写入失败时，缓存降级为不缓存。</span>
        <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
      }
    },
    <span class="hljs-title function_">get</span>(<span class="hljs-params">key</span>) {
      <span class="hljs-keyword">const</span> raw = storage.<span class="hljs-title function_">getItem</span>(key);
      <span class="hljs-keyword">if</span> (raw === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> record = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(raw);
        <span class="hljs-keyword">if</span> (record.<span class="hljs-property">expires</span> !== <span class="hljs-literal">null</span> &amp;&amp; <span class="hljs-title function_">now</span>() &gt;= record.<span class="hljs-property">expires</span>) {
          storage.<span class="hljs-title function_">removeItem</span>(key);
          <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
        }
        <span class="hljs-keyword">return</span> record.<span class="hljs-property">value</span>;
      } <span class="hljs-keyword">catch</span> {
        <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
      }
    },
  };
}

<span class="hljs-comment">// 在 Node 里模拟 Storage 的三个方法和一个可以手动拨动的时钟。</span>
<span class="hljs-keyword">const</span> map = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">const</span> fakeStorage = {
  <span class="hljs-attr">getItem</span>: <span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> (map.<span class="hljs-title function_">has</span>(key) ? map.<span class="hljs-title function_">get</span>(key) : <span class="hljs-literal">null</span>),
  <span class="hljs-attr">setItem</span>: <span class="hljs-function">(<span class="hljs-params">key, value</span>) =&gt;</span> map.<span class="hljs-title function_">set</span>(key, <span class="hljs-title class_">String</span>(value)),
  <span class="hljs-attr">removeItem</span>: <span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> map.<span class="hljs-title function_">delete</span>(key),
};
<span class="hljs-keyword">let</span> time = <span class="hljs-number">0</span>;
<span class="hljs-keyword">const</span> cache = <span class="hljs-title function_">createExpiringStorage</span>(fakeStorage, <span class="hljs-function">() =&gt;</span> time);

cache.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;cities&#x27;</span>, [<span class="hljs-string">&#x27;北京&#x27;</span>, <span class="hljs-string">&#x27;上海&#x27;</span>], <span class="hljs-number">1000</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;cities&#x27;</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 北京,上海</span>
time = <span class="hljs-number">1000</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;cities&#x27;</span>)); <span class="hljs-comment">// null</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(map.<span class="hljs-title function_">has</span>(<span class="hljs-string">&#x27;cities&#x27;</span>)); <span class="hljs-comment">// false</span>

fakeStorage.<span class="hljs-title function_">setItem</span>(<span class="hljs-string">&#x27;legacy&#x27;</span>, <span class="hljs-string">&#x27;not json&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(cache.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;legacy&#x27;</span>)); <span class="hljs-comment">// null</span>
</code></pre></div>
<p><code>time = 1000</code> 时，过期时间正好是 0 + 1000，判断条件是 <code>&gt;=</code>，所以算过期，返回 <code>null</code>，同时 <code>map.has(&#x27;cities&#x27;)</code> 变成 <code>false</code>，说明这一项已经被删掉了。</p>
<p>为什么把时钟作为参数传进来？除了能在 Node 里运行，测试的时候也不用真的等 1 小时，把 <code>time</code> 改一下就能验证过期逻辑。</p>
<p><code>&#x27;legacy&#x27;</code> 那一项是别的代码直接写进去的普通字符串，<code>JSON.parse(&#x27;not json&#x27;)</code> 会抛出 <code>SyntaxError</code>，被 <code>catch</code> 接住后返回 <code>null</code>。如果不包这一层，一条脏数据就能让读缓存的地方报错。</p>
<h2>不传 ttl 时为什么存 null</h2>
<p><code>expires</code> 写成 <code>null</code> 表示永不过期。不能写成 <code>Infinity</code>，因为 <code>JSON.stringify(Infinity)</code> 的结果是 <code>&#x27;null&#x27;</code>，读出来就是 <code>null</code>，和直接存 <code>null</code> 没区别，不如一开始就用 <code>null</code> 表示。</p>
<h2>实际使用时还要注意什么</h2>
<p>存进去的值要能被 JSON 表示。<code>Date</code> 会变成字符串，<code>Map</code>、<code>Set</code> 会变成空对象，<code>undefined</code> 的属性会被丢掉，读出来以后形状就变了。</p>
<p><code>localStorage</code> 的读写是同步的，大量数据会阻塞主线程，所以只适合存少量配置和缓存，大量数据应该放到 IndexedDB，见<a href="/questions/browser-indexeddb/">《IndexedDB 为什么比 localStorage 更适合大型离线数据？》</a>。</p>
<p>另外，同一个源的多个标签页共用一份 <code>localStorage</code>。MDN 写明，一个标签页修改了数据，同源的其他标签页会收到 <code>storage</code> 事件，修改的那个标签页自己收不到。如果缓存的数据要在多个标签页之间保持一致，可以监听这个事件。</p>
<h2>常见追问</h2>
<p><strong>用户修改了本机时间，过期判断会不会出错？</strong></p>
<blockquote>
<p>会。<code>Date.now()</code> 读的是本机时间，用户把时间往回调，缓存就会过期得更晚。缓存只是为了少发请求，影响不大；如果是登录状态这类有安全要求的数据，过期必须由服务端判断，不能只靠前端。</p>
</blockquote>
<p><strong>和 Cookie 的 <code>Expires</code> 有什么区别？</strong></p>
<blockquote>
<p>Cookie 的过期由浏览器管理，到期后浏览器自动删除，也不会再随请求发送。<code>localStorage</code> 的过期是自己写的逻辑，只有调用 <code>get</code> 时才会检查。两者的其他区别见<a href="/questions/browser-storage/">《Cookie、localStorage 和 sessionStorage 如何选择？》</a>。</p>
</blockquote>`};export{e as default};