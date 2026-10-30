var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>点一下导航里的“用户详情”，地址栏变成 <code>/user/1</code>，页面中间换成用户组件，整个页面却没有重新加载。Vue Router 做的就是这件事。</p>
<p>它由三部分组成。history 层负责改地址、听地址变化，hash 模式靠 <code>hashchange</code>，HTML5 模式靠 <code>pushState</code> 加 <code>popstate</code>。匹配层把路径和路由表比对，找出对应的组件，顺便解析出 <code>:id</code> 这样的参数。渲染层把当前路由存在响应式数据里，<code>RouterView</code> 读它，所以路由一变，<code>RouterView</code> 就渲染新的组件。</p>
<p>手写时，<code>router.push</code> 调 history 改地址，再匹配出新路由赋给响应式变量；<code>RouterLink</code> 渲染一个 <code>&lt;a&gt;</code>，点击时阻止默认跳转改调 <code>push</code>；<code>install</code> 里注册这两个组件，再用 <code>provide</code> 把 router 交给组件使用。</p>
<p>要注意，<code>pushState</code> 不会触发 <code>popstate</code>，所以 <code>push</code> 之后要自己更新当前路由；HTML5 模式下刷新页面会真的请求这个路径，服务器要回退到 <code>index.html</code>。</p>
</blockquote>
<h2>先拆成三层</h2>
<p>官方文档列出了 <code>app.use(router)</code> 做的事：全局注册 <code>RouterView</code> 和 <code>RouterLink</code>，添加 <code>$router</code> 和 <code>$route</code>，启用 <code>useRouter()</code>、<code>useRoute()</code>，并触发初始路由的解析。手写版只要实现其中的主干就够了。</p>
<p>hash 和 history 两种模式怎样监听地址、服务器怎样配置回退，已经在<a href="/questions/state-hash-history/">《hash 路由和 history 路由的原理是什么？服务器要怎样配置回退？》</a>里讲过，这里把它们看成一个统一的 history 对象：能读当前路径，能跳转，能在用户前进后退时通知路由器。导航守卫的执行顺序见<a href="/questions/state-vue-router-guards/">《Vue Router 有哪些导航守卫？完整的导航流程是怎样的？》</a>，手写版只保留 <code>beforeEach</code>。</p>
<h2>匹配层：把路径变成路由</h2>
<p>匹配层和浏览器无关，可以单独用 Node 运行。下面把 <code>/user/:id</code> 这样的路径编译成正则，冒号开头的段落变成捕获组，匹配成功时再按顺序取出参数。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createMatcher</span>(<span class="hljs-params">routes</span>) {
  <span class="hljs-keyword">const</span> records = routes.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">route</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> keys = [];
    <span class="hljs-keyword">const</span> pattern = route.<span class="hljs-property">path</span>.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/:(\\w+)/g</span>, <span class="hljs-function">(<span class="hljs-params">_, key</span>) =&gt;</span> {
      keys.<span class="hljs-title function_">push</span>(key);
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;([^/]+)&#x27;</span>;
    });
    <span class="hljs-keyword">return</span> { route, keys, <span class="hljs-attr">regex</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(<span class="hljs-string">&#x27;^&#x27;</span> + pattern + <span class="hljs-string">&#x27;$&#x27;</span>) };
  });

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">match</span>(<span class="hljs-params">path</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> { route, keys, regex } <span class="hljs-keyword">of</span> records) {
      <span class="hljs-keyword">const</span> result = regex.<span class="hljs-title function_">exec</span>(path);
      <span class="hljs-keyword">if</span> (result) {
        <span class="hljs-keyword">const</span> params = {};
        keys.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">key, index</span>) =&gt;</span> {
          params[key] = <span class="hljs-built_in">decodeURIComponent</span>(result[index + <span class="hljs-number">1</span>]);
        });
        <span class="hljs-keyword">return</span> { ...route, path, params };
      }
    }
    <span class="hljs-keyword">return</span> { path, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;not-found&#x27;</span>, <span class="hljs-attr">params</span>: {} };
  };
}

<span class="hljs-keyword">const</span> match = <span class="hljs-title function_">createMatcher</span>([
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;home&#x27;</span> },
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/user/:id&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;user&#x27;</span> },
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/user/:id/post/:postId&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;post&#x27;</span> },
]);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">match</span>(<span class="hljs-string">&#x27;/&#x27;</span>).<span class="hljs-property">name</span>); <span class="hljs-comment">// home</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">match</span>(<span class="hljs-string">&#x27;/user/42&#x27;</span>).<span class="hljs-property">params</span>.<span class="hljs-property">id</span>); <span class="hljs-comment">// 42</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">match</span>(<span class="hljs-string">&#x27;/user/42/post/7&#x27;</span>).<span class="hljs-property">params</span>.<span class="hljs-property">postId</span>); <span class="hljs-comment">// 7</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">match</span>(<span class="hljs-string">&#x27;/about&#x27;</span>).<span class="hljs-property">name</span>); <span class="hljs-comment">// not-found</span>
</code></pre></div>
<p>正则两头加了 <code>^</code> 和 <code>$</code>，所以 <code>/user/42</code> 不会被 <code>/</code> 匹配上，<code>/user/42/post/7</code> 也不会被 <code>/user/:id</code> 截走。<code>([^/]+)</code> 只匹配到下一个斜杠为止，一个参数不会吃掉后面的路径。</p>
<p>手写版按书写顺序找第一个匹配的路由，真正的 Vue Router 匹配语法更丰富，还支持自定义参数正则、可选参数和重复参数。找不到时返回 <code>not-found</code>，对应官方建议配置的 <code>/:pathMatch(.*)</code> 兜底路由。</p>
<h2>路由器：push 之后自己更新当前路由</h2>
<p>路由器把 history 和匹配器连起来。当前路由放在 <code>shallowRef</code> 里，因为每次导航都整体换成一个新对象，不需要深层响应。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { shallowRef } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createRouter</span>(<span class="hljs-params">{ history, routes }</span>) {
  <span class="hljs-keyword">const</span> match = <span class="hljs-title function_">createMatcher</span>(routes);
  <span class="hljs-keyword">const</span> currentRoute = <span class="hljs-title function_">shallowRef</span>(<span class="hljs-title function_">match</span>(history.<span class="hljs-title function_">location</span>()));
  <span class="hljs-keyword">const</span> guards = [];

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">navigate</span>(<span class="hljs-params">path, mode</span>) {
    <span class="hljs-keyword">const</span> to = <span class="hljs-title function_">match</span>(path);
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> guard <span class="hljs-keyword">of</span> guards) {
      <span class="hljs-keyword">if</span> ((<span class="hljs-keyword">await</span> <span class="hljs-title function_">guard</span>(to, currentRoute.<span class="hljs-property">value</span>)) === <span class="hljs-literal">false</span>) <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">if</span> (mode === <span class="hljs-string">&#x27;push&#x27;</span>) history.<span class="hljs-title function_">push</span>(path);
    <span class="hljs-keyword">if</span> (mode === <span class="hljs-string">&#x27;replace&#x27;</span>) history.<span class="hljs-title function_">replace</span>(path);
    currentRoute.<span class="hljs-property">value</span> = to;
  }

  <span class="hljs-comment">// 前进后退时地址已经变了，只需要更新当前路由</span>
  history.<span class="hljs-title function_">listen</span>(<span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> <span class="hljs-title function_">navigate</span>(path, <span class="hljs-string">&#x27;pop&#x27;</span>));

  <span class="hljs-keyword">return</span> {
    currentRoute,
    <span class="hljs-attr">push</span>: <span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> <span class="hljs-title function_">navigate</span>(path, <span class="hljs-string">&#x27;push&#x27;</span>),
    <span class="hljs-attr">replace</span>: <span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> <span class="hljs-title function_">navigate</span>(path, <span class="hljs-string">&#x27;replace&#x27;</span>),
    <span class="hljs-attr">beforeEach</span>: <span class="hljs-function">(<span class="hljs-params">guard</span>) =&gt;</span> guards.<span class="hljs-title function_">push</span>(guard),
    <span class="hljs-title function_">install</span>(<span class="hljs-params">app</span>) {
      app.<span class="hljs-title function_">provide</span>(<span class="hljs-string">&#x27;router&#x27;</span>, <span class="hljs-variable language_">this</span>);
      app.<span class="hljs-property">config</span>.<span class="hljs-property">globalProperties</span>.<span class="hljs-property">$router</span> = <span class="hljs-variable language_">this</span>;
      app.<span class="hljs-title function_">component</span>(<span class="hljs-string">&#x27;RouterView&#x27;</span>, <span class="hljs-title class_">RouterView</span>);
      app.<span class="hljs-title function_">component</span>(<span class="hljs-string">&#x27;RouterLink&#x27;</span>, <span class="hljs-title class_">RouterLink</span>);
    },
  };
}
</code></pre></div>
<p>为什么 <code>push</code> 里改完地址还要手动给 <code>currentRoute</code> 赋值？MDN 说明，调用 <code>pushState</code> 不会触发 <code>popstate</code>，<code>popstate</code> 只在用户前进、后退等切换历史记录时触发。所以主动跳转时路由器得自己更新，被动的前进后退才交给监听器。</p>
<p><code>match</code> 返回的对象展开了整条路由记录，路由表里写的 <code>component</code> 也会一起带出来，<code>RouterView</code> 就靠它渲染。</p>
<p>HTML5 模式的 history 对象大致这样写：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createWebHistory</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">location</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-property">location</span>.<span class="hljs-property">pathname</span>,
    <span class="hljs-attr">push</span>: <span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-property">history</span>.<span class="hljs-title function_">pushState</span>({}, <span class="hljs-string">&#x27;&#x27;</span>, path),
    <span class="hljs-attr">replace</span>: <span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-property">history</span>.<span class="hljs-title function_">replaceState</span>({}, <span class="hljs-string">&#x27;&#x27;</span>, path),
    <span class="hljs-attr">listen</span>: <span class="hljs-function">(<span class="hljs-params">callback</span>) =&gt;</span> {
      <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;popstate&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">callback</span>(<span class="hljs-variable language_">window</span>.<span class="hljs-property">location</span>.<span class="hljs-property">pathname</span>));
    },
  };
}
</code></pre></div>
<p>hash 模式只要把读路径换成 <code>location.hash.slice(1) || &#x27;/&#x27;</code>，跳转改成设置 <code>location.hash</code>，监听改成 <code>hashchange</code>。设置 <code>location.hash</code> 本身会触发 <code>hashchange</code>，所以 hash 版的 <code>push</code> 改完地址后可以不手动更新，交给监听器统一处理，免得一次跳转更新两遍。</p>
<h2>RouterView 和 RouterLink</h2>
<p><code>RouterView</code> 读当前路由，渲染对应的组件。它在渲染函数里读了 <code>currentRoute.value</code>，所以路由一换，它就重新渲染。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { h, inject } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">RouterView</span> = {
  <span class="hljs-title function_">setup</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> router = <span class="hljs-title function_">inject</span>(<span class="hljs-string">&#x27;router&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> component = router.<span class="hljs-property">currentRoute</span>.<span class="hljs-property">value</span>.<span class="hljs-property">component</span>;
      <span class="hljs-keyword">return</span> component ? <span class="hljs-title function_">h</span>(component) : <span class="hljs-literal">null</span>;
    };
  },
};

<span class="hljs-keyword">const</span> <span class="hljs-title class_">RouterLink</span> = {
  <span class="hljs-attr">props</span>: { <span class="hljs-attr">to</span>: { <span class="hljs-attr">type</span>: <span class="hljs-title class_">String</span>, <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span> } },
  <span class="hljs-title function_">setup</span>(<span class="hljs-params">props, { slots }</span>) {
    <span class="hljs-keyword">const</span> router = <span class="hljs-title function_">inject</span>(<span class="hljs-string">&#x27;router&#x27;</span>);
    <span class="hljs-keyword">function</span> <span class="hljs-title function_">onClick</span>(<span class="hljs-params">event</span>) {
      event.<span class="hljs-title function_">preventDefault</span>();
      router.<span class="hljs-title function_">push</span>(props.<span class="hljs-property">to</span>);
    }
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;a&#x27;</span>, { <span class="hljs-attr">href</span>: props.<span class="hljs-property">to</span>, onClick }, slots.<span class="hljs-property">default</span>?.());
  },
};
</code></pre></div>
<p><code>RouterLink</code> 仍然渲染真正的 <code>&lt;a href&gt;</code>，这样能看到链接地址、能用新标签页打开。点击时用 <code>preventDefault</code> 拦住浏览器的整页跳转，改调 <code>router.push</code>。官方文档也说，用 <code>RouterLink</code> 代替普通 <code>&lt;a&gt;</code>，是为了让 Vue Router 不重新加载页面就能改地址。</p>
<p>这两个组件用到的 <code>h()</code> 写法见<a href="/questions/vue-render-function/">《Vue 的渲染函数、JSX 和 h() 怎样使用？》</a>。</p>
<p>使用方式和官方一样，<code>use</code> 要写在 <code>mount</code> 前面：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> router = <span class="hljs-title function_">createRouter</span>({ <span class="hljs-attr">history</span>: <span class="hljs-title function_">createWebHistory</span>(), routes });
<span class="hljs-title function_">createApp</span>(<span class="hljs-title class_">App</span>).<span class="hljs-title function_">use</span>(router).<span class="hljs-title function_">mount</span>(<span class="hljs-string">&#x27;#app&#x27;</span>);
</code></pre></div>
<h2>常见追问</h2>
<p><strong>手写版和真正的 Vue Router 差在哪里？</strong></p>
<blockquote>
<p>手写版只保留了监听地址、匹配、响应式渲染这条主线。官方版本还支持嵌套路由、命名路由、完整的导航守卫流程、路由懒加载和滚动行为控制，这些在 Vue Router 文档里各有专门章节。</p>
</blockquote>
<p><strong>memory 模式是做什么的？</strong></p>
<blockquote>
<p><code>createMemoryHistory()</code> 不依赖浏览器环境，不读也不改地址栏，适合 Node 和 SSR。它也不会自动触发初始导航，要在 <code>app.use(router)</code> 之后自己 <code>push</code> 初始路由。在浏览器里用它，前进后退就没有效果。</p>
</blockquote>`};export{e as default};