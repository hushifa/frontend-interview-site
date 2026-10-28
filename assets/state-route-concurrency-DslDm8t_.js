var e={answerHtml:`<h2>简答</h2>
<ul>
<li>竞态：用户从报表 A 切到 B，A 的请求比 B 晚返回，页面却显示了 A 的数据。</li>
<li>每次导航创建一个 <code>AbortController</code>，新导航开始时取消上一个；写入结果前再检查导航序号，防止取消不及时的情况。</li>
<li>React Router 的 loader、TanStack Router 等框架已经内置了这种处理：新导航开始时取消旧 loader，只提交最新导航的结果。</li>
<li>取消请求只能让客户端不再等待，已经到达服务器的写操作不会被撤销，写操作要靠幂等键防止重复执行。</li>
<li>权限变化（登出、切换账号、角色变更）后，清空缓存的路由数据和客户端状态，再重新导航；每个接口仍要在服务端鉴权。</li>
</ul>
<h2>手写导航加载器</h2>
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

<span class="hljs-keyword">const</span> navigate = <span class="hljs-title function_">createNavigator</span>(
  <span class="hljs-function">(<span class="hljs-params">loc, signal</span>) =&gt;</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/reports/<span class="hljs-subst">\${loc.id}</span>\`</span>, { signal }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>()),
  <span class="hljs-function">(<span class="hljs-params">loc, data</span>) =&gt;</span> <span class="hljs-title function_">render</span>(loc, data),
);
</code></pre></div>
<ul>
<li><code>abort()</code> 让旧请求停止，节省网络。</li>
<li><code>id === seq</code> 是第二道保护：有些异步工作无法取消，或者在被取消前已经完成。</li>
</ul>
<h2>React Router 中的写法</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loader</span>(<span class="hljs-params">{ params, request }</span>) {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/reports/<span class="hljs-subst">\${params.id}</span>\`</span>, { <span class="hljs-attr">signal</span>: request.<span class="hljs-property">signal</span> });
  <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> === <span class="hljs-number">404</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-string">&#x27;未找到&#x27;</span>, { <span class="hljs-attr">status</span>: <span class="hljs-number">404</span> });
  <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
}
</code></pre></div>
<p>把 <code>request.signal</code> 传给 <code>fetch</code>，新导航开始时 React Router 会中止它。</p>
<h2>搜索框</h2>
<p>输入搜索词时，每次输入都可能触发一次导航。通常组合三种手段：</p>
<ul>
<li>防抖 300ms 左右再更新 URL。</li>
<li>用 <code>replace</code> 更新地址，避免每个字符都生成一条历史记录。</li>
<li>依赖上面的取消机制丢弃过期结果。</li>
</ul>
<h2>权限变化</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">logout</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/logout&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span> });
  queryClient.<span class="hljs-title function_">clear</span>(); <span class="hljs-comment">// 清空数据缓存</span>
  router.<span class="hljs-title function_">navigate</span>(<span class="hljs-string">&#x27;/login&#x27;</span>, { <span class="hljs-attr">replace</span>: <span class="hljs-literal">true</span> });
}
</code></pre></div>
<p>如果只跳转不清缓存，下一个登录的用户可能在后退时看到上一个用户的数据。多个标签页之间可以用 <code>BroadcastChannel</code> 或 <code>storage</code> 事件同步登出。</p>
<h2>路由守卫的作用范围</h2>
<p>前端守卫负责&quot;没有权限就不显示这个页面、跳到登录页&quot;，属于体验。真正的保护是服务端：每个 loader 调用的接口和每个写操作都要校验会话与权限，返回 401 或 403 时前端再跳转。</p>
<h2>常见追问</h2>
<ul>
<li>用户提交表单后马上离开页面，请求会被取消吗？取决于实现。框架通常不会取消正在进行的 action，但即使取消了，服务器可能已经执行了写入，所以写接口要支持幂等。</li>
<li>后退时要重新请求吗？可以先显示缓存的数据，再在后台刷新，这就是 stale-while-revalidate 策略。</li>
</ul>`};export{e as default};