var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端状态和界面状态不是一回事。弹窗开没开，只有前端知道；订单列表的数据，真正的版本在服务器上，前端拿到的只是某一刻的副本，可能已经过期了。所以要决定什么时候重新获取，修改以后哪些缓存要作废。</p>
<p>TanStack Query 和 SWR 都是按 key 缓存的。用同一个 key 的组件，共享同一份数据和同一个进行中的请求；key 变了，就自动请求新数据。</p>
<p>两者的默认行为不太一样。TanStack Query 默认 <code>staleTime</code> 是 0，数据一到手就算过期，组件挂载、窗口重新聚焦、网络恢复时会在后台重新获取；没有组件使用的缓存 5 分钟后回收；失败的查询默认重试 3 次。SWR 的思路是“先返回缓存，再重新验证”，窗口聚焦、网络恢复时可以重新验证，短时间内相同 key 的请求会去重；key 传 <code>null</code> 就不发请求，用来做条件请求。</p>
<p>要注意，修改数据以后要让相关缓存失效。TanStack Query 用 <code>queryClient.invalidateQueries</code>，SWR 用 <code>mutate</code>。</p>
</blockquote>
<h2>自己用 useEffect 请求有什么问题</h2>
<p>用 <code>useEffect</code> 加 <code>useState</code> 请求数据，问题会一个个冒出来。每个组件各请求各的，好几处用同一个接口就重复请求。切换参数时，旧响应可能晚到，把新数据盖掉。回到页面时数据不会自动刷新。修改了数据，还得手动通知所有用到它的地方。</p>
<p>把这些逻辑搬进全局 store，也只是换了个地方写，问题一个没少。查询库就是把这些事统一做掉了。</p>
<h2>TanStack Query 怎么用</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { keepPreviousData, useQuery, useMutation, useQueryClient } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@tanstack/react-query&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">useTodos</span>(<span class="hljs-params">filter</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">useQuery</span>({
    <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;todos&#x27;</span>, filter],
    <span class="hljs-attr">queryFn</span>: <span class="hljs-function">(<span class="hljs-params">{ signal }</span>) =&gt;</span>
      <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/todos?filter=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(filter)}</span>\`</span>, { signal }).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">res</span>) =&gt;</span> {
        <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${res.status}</span>\`</span>);
        <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
      }),
    <span class="hljs-attr">staleTime</span>: <span class="hljs-number">30_000</span>, <span class="hljs-comment">// 30 秒内视为新鲜，不因挂载或聚焦重新请求</span>
    <span class="hljs-attr">placeholderData</span>: keepPreviousData, <span class="hljs-comment">// 切换 filter 时先显示上一份结果，避免闪回加载态</span>
  });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">useAddTodo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> queryClient = <span class="hljs-title function_">useQueryClient</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">useMutation</span>({
    <span class="hljs-attr">mutationFn</span>: <span class="hljs-title function_">async</span> (todo) =&gt; {
      <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/todos&#x27;</span>, {
        <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
        <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
        <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(todo),
      });
      <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${res.status}</span>\`</span>);
      <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
    },
    <span class="hljs-comment">// 前缀匹配：所有以 [&#x27;todos&#x27;] 开头的查询都会失效并重新获取</span>
    <span class="hljs-attr">onSuccess</span>: <span class="hljs-function">() =&gt;</span> queryClient.<span class="hljs-title function_">invalidateQueries</span>({ <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;todos&#x27;</span>] }),
  });
}
</code></pre></div>
<p><code>queryKey</code> 里要包含 <code>queryFn</code> 用到的所有参数。这里 <code>queryFn</code> 用了 <code>filter</code>，key 里就要有 <code>filter</code>。漏了的话，参数变了 key 却没变，拿到的还是旧缓存。</p>
<p>为什么 <code>queryFn</code> 里要自己判断 <code>res.ok</code> 再抛错？因为 <code>fetch</code> 遇到 4xx、5xx 并不会 reject，只有网络错误才会。不抛错，查询库就以为请求成功了，既不会进入错误状态，也不会重试。</p>
<p>新增待办成功后，<code>invalidateQueries</code> 让所有以 <code>[&#x27;todos&#x27;]</code> 开头的查询失效，于是列表会重新获取。另外，返回的结果默认做结构共享：新数据和旧数据内容一样的部分，会保留原来的引用，组件就不会白白重新渲染。</p>
<p>一个查询要等另一个查询的结果时，用 <code>enabled</code> 控制什么时候执行：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> { <span class="hljs-attr">data</span>: user } = <span class="hljs-title function_">useQuery</span>({ <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;user&#x27;</span>, email], <span class="hljs-attr">queryFn</span>: getUserByEmail });
<span class="hljs-keyword">const</span> userId = user?.<span class="hljs-property">id</span>;
<span class="hljs-keyword">const</span> { <span class="hljs-attr">data</span>: projects } = <span class="hljs-title function_">useQuery</span>({
  <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;projects&#x27;</span>, userId],
  <span class="hljs-attr">queryFn</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">getProjectsByUser</span>(userId),
  <span class="hljs-attr">enabled</span>: !!userId, <span class="hljs-comment">// userId 就绪前不请求，状态为 pending、fetchStatus 为 idle</span>
});
</code></pre></div>
<p><code>userId</code> 还没拿到时，第二个查询不发请求，状态是 pending，<code>fetchStatus</code> 是 idle，意思是“还没数据，但也没在请求”。</p>
<p>前面用到的 <code>placeholderData: keepPreviousData</code>，作用是新 key 的数据到达之前，继续显示上一次成功的结果，而不是闪回加载状态。<code>isPlaceholderData</code> 可以告诉你当前显示的是不是占位数据。分页和筛选切换很适合这样用。</p>
<h2>SWR 怎么用</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> useSWR <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;swr&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title function_">fetcher</span> = <span class="hljs-keyword">async</span> (<span class="hljs-params">url</span>) =&gt; {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url);
  <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${res.status}</span>\`</span>); <span class="hljs-comment">// 抛错后 SWR 才会进入 error 状态</span>
  <span class="hljs-keyword">return</span> res.<span class="hljs-title function_">json</span>();
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ userId }</span>) {
  <span class="hljs-comment">// userId 为空时 key 为 null，不发请求</span>
  <span class="hljs-keyword">const</span> { data, error, isLoading, mutate } = <span class="hljs-title function_">useSWR</span>(userId ? <span class="hljs-string">\`/api/users/<span class="hljs-subst">\${userId}</span>\`</span> : <span class="hljs-literal">null</span>, fetcher);
  <span class="hljs-comment">// ...修改成功后调用 mutate() 重新验证这一个 key</span>
}
</code></pre></div>
<p><code>fetcher</code> 同样要自己抛错，道理和上面一样。<code>userId</code> 为空时 key 是 <code>null</code>，SWR 就不发请求。</p>
<p><code>useSWR</code> 返回的 <code>mutate</code> 已经绑定了当前 key，调用它就重新验证这一份数据。要更新别的 key，用 <code>useSWRConfig()</code> 拿到全局的 <code>mutate</code>，再把 key 传进去。<code>revalidateOnFocus</code>、<code>revalidateOnReconnect</code>、<code>dedupingInterval</code> 这些选项控制重新验证和去重，默认值以 SWR 官方 API 文档为准。</p>
<h2>和全局 store 怎么分工</h2>
<p>服务端数据交给查询库。弹窗开关、表单草稿、主题这类只存在于客户端的状态，仍然放在组件状态或 store 里。怎么选 store，见<a href="/questions/state-store-choice/">《Zustand、Jotai 和 Redux Toolkit 应该怎样选择？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>staleTime</code> 和 <code>gcTime</code> 有什么区别？</strong></p>
<blockquote>
<p><code>staleTime</code> 决定数据多久之后算过期、需要重新获取；<code>gcTime</code> 决定没有组件使用的缓存，多久之后从内存里删掉。</p>
</blockquote>
<p><strong>乐观更新怎么做？</strong></p>
<blockquote>
<p>修改之前先把预期的结果写进缓存，失败了就回滚到之前的快照。不管成功还是失败，最后都让缓存失效，以服务器的数据为准。</p>
</blockquote>
<p><strong>快速切换参数，会不会出现旧响应覆盖新数据？</strong></p>
<blockquote>
<p>不会。查询库按 key 存放结果，旧 key 的响应写进旧 key 的缓存，不会显示到新 key 上。</p>
</blockquote>`};export{e as default};