var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户从报表 A 快速切到报表 B，A 的请求比 B 晚回来，结果页面上显示的却是 A 的数据。这种请求先后顺序打乱导致的问题，叫竞态。</p>
<p>解决办法有两道保护。每次导航创建一个 <code>AbortController</code>，新导航开始时取消上一个；写入结果前再检查一下导航序号，防止取消不及时。React Router 的 loader、TanStack Router 这些框架已经内置了这种处理：新导航开始时取消旧的 loader，只提交最新导航的结果。</p>
<p>要注意，取消请求只是让客户端不再等，已经到达服务器的写操作不会被撤销。写操作要靠幂等键，防止重复执行。</p>
<p>权限变化，比如登出、切换账号、角色变更之后，要清空缓存的路由数据和客户端状态，再重新导航。前端守卫只管界面，每个接口仍然要在服务端鉴权。</p>
</blockquote>
<h2>手写一个只认最新导航的加载器</h2>
<p>先看代码，注意 <code>id === seq</code> 这个判断：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createNavigator</span>(<span class="hljs-params">load, commit</span>) {
  <span class="hljs-keyword">let</span> seq = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> controller;

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">navigate</span>(<span class="hljs-params">location</span>) {
    controller?.<span class="hljs-title function_">abort</span>();
    controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
    <span class="hljs-keyword">const</span> id = ++seq;
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> <span class="hljs-title function_">load</span>(location, controller.<span class="hljs-property">signal</span>);
      <span class="hljs-keyword">if</span> (id === seq) <span class="hljs-title function_">commit</span>(location, data);
    } <span class="hljs-keyword">catch</span> (err) {
      <span class="hljs-keyword">if</span> (err.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span> &amp;&amp; id === seq) <span class="hljs-title function_">commit</span>(location, { <span class="hljs-attr">error</span>: err });
    }
  };
}
</code></pre></div>
<p>既然已经 <code>abort()</code> 了，为什么还要比较序号？用一个不理会取消信号的加载函数试试：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 模拟一个不理会 signal 的加载函数：A 慢、B 快</span>
<span class="hljs-keyword">const</span> delays = { <span class="hljs-attr">A</span>: <span class="hljs-number">50</span>, <span class="hljs-attr">B</span>: <span class="hljs-number">10</span> };
<span class="hljs-keyword">const</span> <span class="hljs-title function_">load</span> = (<span class="hljs-params">loc</span>) =&gt;
  <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(<span class="hljs-string">\`报表 <span class="hljs-subst">\${loc.id}</span>\`</span>), delays[loc.<span class="hljs-property">id</span>]));
<span class="hljs-keyword">const</span> navigate = <span class="hljs-title function_">createNavigator</span>(load, <span class="hljs-function">(<span class="hljs-params">loc, data</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;显示&#x27;</span>, data));

<span class="hljs-title function_">navigate</span>({ <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;A&#x27;</span> });
<span class="hljs-title function_">navigate</span>({ <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;B&#x27;</span> });
<span class="hljs-comment">// 输出：显示 报表 B</span>
</code></pre></div>
<p>A 的请求虽然被 <code>abort()</code> 了，可加载函数没理会信号，50 毫秒后照样返回了结果。这时 <code>seq</code> 已经是 2，A 的 <code>id</code> 是 1，对不上，所以 A 的结果被丢掉，只显示了 B。</p>
<p>所以 <code>abort()</code> 是为了让旧请求停下、节省网络；<code>id === seq</code> 是第二道保护，用来兜住那些没法取消、或者在取消前就已经完成的异步工作。</p>
<p>实际使用时，<code>load</code> 一般是把 <code>signal</code> 传给 <code>fetch</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> navigate = <span class="hljs-title function_">createNavigator</span>(
  <span class="hljs-function">(<span class="hljs-params">loc, signal</span>) =&gt;</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/reports/<span class="hljs-subst">\${loc.id}</span>\`</span>, { signal }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>()),
  <span class="hljs-function">(<span class="hljs-params">loc, data</span>) =&gt;</span> <span class="hljs-title function_">render</span>(loc, data),
);
</code></pre></div>
<h2>React Router 里怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loader</span>(<span class="hljs-params">{ params, request }</span>) {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/reports/<span class="hljs-subst">\${params.id}</span>\`</span>, { <span class="hljs-attr">signal</span>: request.<span class="hljs-property">signal</span> });
  <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> === <span class="hljs-number">404</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-string">&#x27;未找到&#x27;</span>, { <span class="hljs-attr">status</span>: <span class="hljs-number">404</span> });
  <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
}
</code></pre></div>
<p>关键是把 <code>request.signal</code> 传给 <code>fetch</code>。新导航开始时，React Router 会中止这个信号，旧请求就停了。</p>
<h2>搜索框怎样避免一堆导航</h2>
<p>搜索词放在 URL 里时，每输入一个字都可能触发一次导航。通常把三种手段组合起来用。</p>
<p>先防抖，等用户停下 300 毫秒左右再更新 URL。更新地址时用 <code>replace</code>，不然每个字符都会多出一条历史记录，用户按后退要按很多次。最后依靠上面的取消机制，丢弃过期的结果。</p>
<h2>权限变化后要做什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">logout</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/logout&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span> });
  queryClient.<span class="hljs-title function_">clear</span>(); <span class="hljs-comment">// 清空数据缓存</span>
  router.<span class="hljs-title function_">navigate</span>(<span class="hljs-string">&#x27;/login&#x27;</span>, { <span class="hljs-attr">replace</span>: <span class="hljs-literal">true</span> });
}
</code></pre></div>
<p>为什么登出时一定要清缓存？如果只跳转不清，下一个人在同一个浏览器登录后，点后退可能还会看到上一个用户的数据。</p>
<p>开着多个标签页时，一个标签页登出了，其他标签页也要跟着登出。可以用 <code>BroadcastChannel</code> 或 <code>storage</code> 事件来同步。</p>
<h2>路由守卫管到哪一步</h2>
<p>前端守卫负责的是“没权限就不显示这个页面、跳到登录页”，这是体验。</p>
<p>真正的保护在服务端。每个 loader 调用的接口、每个写操作，都要校验会话和权限。服务端返回 401 或 403 时，前端再做相应的跳转。</p>
<h2>常见追问</h2>
<p><strong>用户提交表单后马上离开页面，请求会被取消吗？</strong></p>
<blockquote>
<p>要看具体实现。框架通常不会取消正在进行的 action。而且就算取消了，服务器也可能已经写入了，所以写接口要支持幂等。</p>
</blockquote>
<p><strong>后退时要重新请求吗？</strong></p>
<blockquote>
<p>可以先显示缓存的数据，再在后台刷新。这就是 stale-while-revalidate 策略。</p>
</blockquote>`};export{e as default};