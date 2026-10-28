var e={answerHtml:`<h2>简答</h2>
<ul>
<li>服务端状态与界面状态不同：数据由服务器持有，前端副本可能已经过期，需要决定何时重新获取，以及修改后哪些缓存要失效。</li>
<li>两个库都按 key 缓存：相同 key 的组件共享同一份数据和同一个进行中的请求，key 变化时自动请求新数据。</li>
<li>TanStack Query 默认 <code>staleTime</code> 为 0，数据一到手就视为过期；组件挂载、窗口重新聚焦、网络恢复时会在后台重新获取。没有组件使用的缓存 5 分钟后回收，失败的查询默认重试 3 次。</li>
<li>SWR 按&quot;先返回缓存，再重新验证&quot;工作，窗口聚焦、网络恢复时可以重新验证，短时间内相同 key 的请求会去重。key 传 <code>null</code> 时不发请求，用于条件请求。</li>
<li>修改数据后要让相关缓存失效：TanStack Query 用 <code>queryClient.invalidateQueries</code>，SWR 用 <code>mutate</code>。</li>
</ul>
<h2>手写的问题</h2>
<p>用 <code>useEffect</code> 加 <code>useState</code> 请求数据时，每个组件各自请求，多处使用同一接口会重复请求；切换参数时旧响应可能晚到并覆盖新数据；回到页面时数据不会刷新；修改之后要手动通知所有使用方。把这些逻辑放进全局 store 也只是换了地方写。</p>
<h2>TanStack Query</h2>
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
<p><code>queryKey</code> 要包含 <code>queryFn</code> 用到的所有参数，否则参数变化时会命中旧缓存。<code>fetch</code> 遇到 4xx/5xx 不会拒绝，要自己抛错，查询才会进入错误状态并触发重试。返回结果默认做结构共享，内容没变时保持原引用。</p>
<p>一个查询依赖另一个查询的结果时，用 <code>enabled</code> 控制何时执行：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> { <span class="hljs-attr">data</span>: user } = <span class="hljs-title function_">useQuery</span>({ <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;user&#x27;</span>, email], <span class="hljs-attr">queryFn</span>: getUserByEmail });
<span class="hljs-keyword">const</span> userId = user?.<span class="hljs-property">id</span>;
<span class="hljs-keyword">const</span> { <span class="hljs-attr">data</span>: projects } = <span class="hljs-title function_">useQuery</span>({
  <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;projects&#x27;</span>, userId],
  <span class="hljs-attr">queryFn</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">getProjectsByUser</span>(userId),
  <span class="hljs-attr">enabled</span>: !!userId, <span class="hljs-comment">// userId 就绪前不请求，状态为 pending、fetchStatus 为 idle</span>
});
</code></pre></div>
<p><code>placeholderData: keepPreviousData</code> 让新 key 的数据到达前继续显示上一次成功的结果，<code>isPlaceholderData</code> 可以区分当前是不是占位数据，适合分页和筛选切换。</p>
<h2>SWR</h2>
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
<p><code>useSWR</code> 返回的 <code>mutate</code> 已绑定当前 key；要更新其他 key，用 <code>useSWRConfig()</code> 拿到全局 <code>mutate</code> 并传入 key。<code>revalidateOnFocus</code>、<code>revalidateOnReconnect</code>、<code>dedupingInterval</code> 等选项控制重新验证和去重，默认值以 SWR 官方 API 文档为准。</p>
<h2>和全局 store 的分工</h2>
<p>服务端数据交给查询库，弹窗开关、表单草稿、主题这类只存在于客户端的状态仍放在组件状态或 store 中，选择方法见<a href="/questions/state-store-choice/">《Zustand、Jotai 和 Redux Toolkit 应该怎样选择？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li><code>staleTime</code> 和 <code>gcTime</code> 有什么区别？<code>staleTime</code> 决定数据多久后需要重新获取，<code>gcTime</code> 决定没有组件使用的缓存多久后从内存删除。</li>
<li>怎样做乐观更新？在修改前写入预期结果，失败时回滚到之前的快照，成功或失败后都让缓存失效，以服务器数据为准。</li>
<li>快速切换参数会不会出现旧响应覆盖？查询库按 key 存放结果，旧 key 的响应写入旧 key 的缓存，不会显示到新 key 上。</li>
</ul>`};export{e as default};