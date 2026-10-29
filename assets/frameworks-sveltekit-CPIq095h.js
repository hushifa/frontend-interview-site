var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>SvelteKit 的路由就是目录。<code>src/routes/blog/[slug]/+page.svelte</code> 对应 <code>/blog/:slug</code>，<code>+layout.svelte</code> 是共享布局。页面要的数据由同目录下的 <code>load</code> 函数提供。</p>
<p><code>load</code> 放在哪个文件里，决定它在哪里跑。放在 <code>+page.js</code> 里叫通用 load，第一次访问时在服务端跑，之后客户端导航时在浏览器里跑，所以不能用密钥。放在 <code>+page.server.js</code> 里叫服务端 load，只在服务端跑，可以查数据库。但它的返回值会序列化后发给浏览器，所以只返回页面要用的字段。</p>
<p>表单提交交给 <code>+page.server.js</code> 里的 <code>actions</code>。配合 <code>use:enhance</code> 可以无刷新提交，浏览器没开 JavaScript 时，它也能当普通表单用。</p>
<p>另外 <code>+server.js</code> 用来写 API 端点。代码最终跑在哪里由 adapter 决定，比如 node、static、vercel。用 <code>adapter-static</code> 时，服务端代码在运行时是执行不了的。</p>
</blockquote>
<h2>服务端 load 返回什么</h2>
<p>下面是账户页的服务端 load。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// src/routes/account/+page.server.js</span>
<span class="hljs-keyword">import</span> { error } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@sveltejs/kit&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">load</span>(<span class="hljs-params">{ locals }</span>) {
  <span class="hljs-keyword">if</span> (!locals.<span class="hljs-property">user</span>) <span class="hljs-title function_">error</span>(<span class="hljs-number">401</span>, <span class="hljs-string">&#x27;请先登录&#x27;</span>);
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">user</span>: { <span class="hljs-attr">id</span>: locals.<span class="hljs-property">user</span>.<span class="hljs-property">id</span>, <span class="hljs-attr">displayName</span>: locals.<span class="hljs-property">user</span>.<span class="hljs-property">displayName</span> },
  };
}
</code></pre></div>
<p><code>locals.user</code> 是在 <code>hooks.server.js</code> 里根据会话 cookie 设置的。这里没有直接 <code>return { user: locals.user }</code>，而是挑了两个字段。原因是返回值最终会发到浏览器，如果把整条用户记录返回，密码哈希、令牌这些东西也会跟着出去。</p>
<h2>表单 action 怎样处理提交</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// src/routes/todos/+page.server.js</span>
<span class="hljs-keyword">import</span> { fail } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@sveltejs/kit&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> actions = {
  <span class="hljs-attr">create</span>: <span class="hljs-title function_">async</span> ({ request, locals }) =&gt; {
    <span class="hljs-keyword">if</span> (!locals.<span class="hljs-property">user</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-number">401</span>, { <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;请先登录&#x27;</span> });
    <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> request.<span class="hljs-title function_">formData</span>();
    <span class="hljs-keyword">const</span> text = <span class="hljs-title class_">String</span>(data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;text&#x27;</span>) ?? <span class="hljs-string">&#x27;&#x27;</span>).<span class="hljs-title function_">trim</span>();
    <span class="hljs-keyword">if</span> (!text) <span class="hljs-keyword">return</span> <span class="hljs-title function_">fail</span>(<span class="hljs-number">400</span>, { text, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;内容不能为空&#x27;</span> });
    <span class="hljs-keyword">await</span> db.<span class="hljs-property">todo</span>.<span class="hljs-title function_">create</span>({ text, <span class="hljs-attr">userId</span>: locals.<span class="hljs-property">user</span>.<span class="hljs-property">id</span> });
  },
};
</code></pre></div>
<p>页面这边用一个普通的 <code>&lt;form&gt;</code> 指向这个 action：</p>
<div class="not-prose code-block"><div class="code-language">svelte</div><pre><code class="hljs language-svelte">&lt;!-- +page.svelte --&gt;
&lt;script&gt;
  import { enhance } from &#x27;$app/forms&#x27;;
  let { form } = $props();
&lt;/script&gt;

&lt;form method=&quot;POST&quot; action=&quot;?/create&quot; use:enhance&gt;
  &lt;input name=&quot;text&quot; value={form?.text ?? &#x27;&#x27;} /&gt;
  {#if form?.message}&lt;p role=&quot;alert&quot;&gt;{form.message}&lt;/p&gt;{/if}
  &lt;button&gt;添加&lt;/button&gt;
&lt;/form&gt;
</code></pre></div>
<p>校验失败时，<code>fail</code> 返回的数据会通过 <code>form</code> 这个 prop 传回页面，所以能显示错误信息，还能把用户刚才输入的内容填回去。提交成功后，SvelteKit 会重新运行页面的 load，列表自然就是最新的。</p>
<h2>load 什么时候会重新运行</h2>
<ul>
<li>路由参数或 <code>url</code> 变了，并且 load 里读了它们。</li>
<li>调用了 <code>invalidate(url)</code> 或 <code>invalidateAll()</code>。</li>
<li>action 提交之后。</li>
</ul>
<p>这里有个安全上的坑。父布局的 load 不一定在每次子页面导航时都重新执行，所以不能只在布局里检查权限。每个服务端 load、action 和端点都要自己检查一遍。</p>
<h2>还有哪些要注意</h2>
<p>不要在服务端模块的顶层变量里存当前用户的数据。服务端一个进程会同时处理很多请求，顶层变量是大家共享的，一个用户的数据可能被另一个用户读到。</p>
<p>在 load 里请求数据，要用 SvelteKit 传进来的 <code>fetch</code>。它会转发 cookie，SSR 时还会把响应内联进页面，这样客户端 hydration 时就不用再请求一次。</p>
<p>多个互不依赖的请求，用 <code>Promise.all</code> 并行发。<code>await parent()</code> 会让当前 load 等父级 load 完成，所以只在真的需要父级数据时才调用，否则就白白串行了。</p>
<h2>常见追问</h2>
<p><strong>和 Next.js App Router 有什么区别？</strong></p>
<blockquote>
<p>SvelteKit 用 load 函数显式加载数据，没有 Server Components。Next.js 是在 Server Component 里直接 <code>await</code> 数据。</p>
</blockquote>
<p><strong>预渲染怎么开启？</strong></p>
<blockquote>
<p>在页面或布局里导出 <code>export const prerender = true</code>，构建时就会生成静态 HTML。</p>
</blockquote>`};export{e as default};