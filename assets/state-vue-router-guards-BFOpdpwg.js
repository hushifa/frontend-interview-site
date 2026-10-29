var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户从列表页点进详情页时，路由不是立刻切过去的，中间会经过一串钩子，每个钩子都能决定放行、取消还是改去别的页面，这些钩子就叫导航守卫。最常见的用法是在 <code>router.beforeEach</code> 里检查登录状态，没登录就跳到登录页。</p>
<p>守卫按作用范围分三类。全局守卫注册在 router 上，有 <code>beforeEach</code>、<code>beforeResolve</code> 和 <code>afterEach</code>；路由独享守卫是写在路由配置里的 <code>beforeEnter</code>；组件内守卫写在组件里，有 <code>beforeRouteEnter</code>、<code>beforeRouteUpdate</code> 和 <code>beforeRouteLeave</code>。<code>afterEach</code> 在导航确认后才执行，不能再改变导航，适合埋点和改页面标题。</p>
<p>完整顺序是：先调用要离开的组件的 <code>beforeRouteLeave</code>，再调用全局 <code>beforeEach</code>，然后是复用组件的 <code>beforeRouteUpdate</code>、路由配置的 <code>beforeEnter</code>，接着解析异步路由组件，调用要进入的组件的 <code>beforeRouteEnter</code>、全局 <code>beforeResolve</code>，导航确认后调用 <code>afterEach</code>，最后更新 DOM。</p>
<p>要注意写法上的版本差别。Vue Router 3 的守卫必须调用第三个参数 <code>next()</code> 才会继续；Vue Router 4 推荐直接返回值，返回 <code>false</code> 取消，返回一个路由地址就重定向，不返回或返回 <code>true</code> 就放行。<code>next</code> 在 4 里仍然支持，但每次经过守卫必须恰好调用一次，漏调或多调都会出问题。</p>
</blockquote>
<h2>用 beforeEach 做登录检查</h2>
<p>下面是 Vue Router 4 的写法，需要登录的路由在 <code>meta</code> 里标记 <code>requiresAuth</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">router.<span class="hljs-title function_">beforeEach</span>(<span class="hljs-title function_">async</span> (to, <span class="hljs-keyword">from</span>) =&gt; {
  <span class="hljs-keyword">if</span> (to.<span class="hljs-property">meta</span>.<span class="hljs-property">requiresAuth</span> &amp;&amp; !<span class="hljs-title function_">isAuthenticated</span>() &amp;&amp; to.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;Login&#x27;</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Login&#x27;</span>, <span class="hljs-attr">query</span>: { <span class="hljs-attr">redirect</span>: to.<span class="hljs-property">fullPath</span> } };
  }
});
</code></pre></div>
<p>没有登录时，守卫返回登录页的地址，当前导航就被丢弃，换成一次去登录页的新导航。<code>query.redirect</code> 记下了原本想去的页面，登录成功后可以跳回来。</p>
<p>为什么要判断 <code>to.name !== &#x27;Login&#x27;</code>？因为去登录页本身也是一次导航，也会经过 <code>beforeEach</code>。不加这个判断，跳到登录页时又会被重定向到登录页，形成无限重定向。</p>
<p>守卫可以是 <code>async</code> 函数，比如先 <code>await</code> 拉取用户信息再判断。Vue Router 会等它完成，导航在此期间处于等待状态。</p>
<h2>Vue Router 3 的 next 写法为什么容易出错</h2>
<p>Vue Router 3 中，守卫必须调用 <code>next</code> 才能继续：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// Vue Router 3 中有问题的写法</span>
router.<span class="hljs-title function_">beforeEach</span>(<span class="hljs-function">(<span class="hljs-params">to, <span class="hljs-keyword">from</span>, next</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (to.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;Login&#x27;</span> &amp;&amp; !<span class="hljs-title function_">isAuthenticated</span>()) <span class="hljs-title function_">next</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Login&#x27;</span> });
  <span class="hljs-title function_">next</span>();
});
</code></pre></div>
<p>没登录时，这段代码先调用了 <code>next({ name: &#x27;Login&#x27; })</code>，接着又执行到了 <code>next()</code>，同一次守卫里调用了两次。正确写法是用 <code>else</code> 把两条路径分开，保证每次只调一次。反过来，如果某个分支忘了调用 <code>next</code>，导航会一直卡住不动。</p>
<p>正是因为这类错误太常见，Vue Router 4 改成了用返回值表达结果，<code>next</code> 只是为了兼容保留下来。</p>
<h2>组件内守卫各自什么时候用</h2>
<p><code>beforeRouteLeave</code> 在离开当前页面前调用，常用来拦截未保存的表单：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">beforeRouteLeave</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">hasUnsavedChanges</span> &amp;&amp; !<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">confirm</span>(<span class="hljs-string">&#x27;还有未保存的修改，确定离开吗？&#x27;</span>)) {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
}
</code></pre></div>
<p><code>beforeRouteUpdate</code> 用在路由变了、组件却被复用的情况。比如从 <code>/user/1</code> 跳到 <code>/user/2</code>，两个地址用的是同一个 <code>User</code> 组件，组件不会重新创建，<code>created</code>、<code>mounted</code> 也不会再执行。这时要在 <code>beforeRouteUpdate</code> 里根据新的 <code>id</code> 重新拉数据，或者用 <code>watch</code> 侦听路由参数。</p>
<p><code>beforeRouteEnter</code> 比较特殊，它在导航确认之前调用，这时组件实例还没有创建，所以不能用 <code>this</code>。如果确实要访问实例，可以给 <code>next</code> 传一个回调，等实例创建好以后执行：<code>next((vm) =&gt; { ... })</code>。这是唯一支持给 <code>next</code> 传回调的守卫。</p>
<p>组合式 API 里没有 <code>beforeRouteEnter</code> 的对应写法，另外两个可以用 <code>onBeforeRouteLeave</code> 和 <code>onBeforeRouteUpdate</code>。</p>
<h2>常见追问</h2>
<p><strong>权限控制只靠路由守卫够吗？</strong></p>
<blockquote>
<p>不够。路由守卫只是在前端拦住页面跳转，用户可以直接调接口，也可以改前端代码绕过去。真正的权限校验必须放在服务端，前端守卫只负责体验。完整的分层设计见<a href="/questions/design-permission/">《前端权限控制怎样设计路由、按钮和接口三层？》</a>。</p>
</blockquote>
<p><strong>beforeEach 和 beforeResolve 有什么区别？</strong></p>
<blockquote>
<p><code>beforeResolve</code> 在所有组件内守卫和异步路由组件都解析完之后、导航确认之前调用，比 <code>beforeEach</code> 晚。需要在确定要进入页面后再做的检查，比如申请摄像头权限，适合放在 <code>beforeResolve</code>，这样不会因为后面的守卫取消了导航而白做。</p>
</blockquote>
<p><strong>动态添加的路由，守卫还会生效吗？</strong></p>
<blockquote>
<p>会。全局守卫对所有导航都生效，包括用 <code>router.addRoute</code> 动态添加的路由。常见做法是登录后拉取权限，用 <code>addRoute</code> 加上有权限的路由，再重新导航一次到目标地址，让新路由生效。</p>
</blockquote>`};export{e as default};