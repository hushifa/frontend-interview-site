var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>src/routes/blog/[slug]/+page.svelte</code> 对应 <code>/blog/:slug</code>；<code>+layout.svelte</code> 是共享布局。</li>
<li>通用 load（<code>+page.js</code>）首次访问时在服务端运行，之后的客户端导航在浏览器运行，不能使用密钥。</li>
<li>服务端 load（<code>+page.server.js</code>）只在服务端运行，可以查数据库；返回值会序列化后发给浏览器，所以只返回页面需要的字段。</li>
<li><code>+page.server.js</code> 中的 <code>actions</code> 处理表单 POST，配合 <code>use:enhance</code> 实现无刷新提交，不开启 JavaScript 时也能用普通表单提交。</li>
<li><code>+server.js</code> 定义 API 端点；adapter（node、static、vercel 等）决定构建产物在哪里运行，<code>adapter-static</code> 下服务端代码无法在运行时执行。</li>
</ul>
<h2>服务端 load</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// src/routes/account/+page.server.js</span>
<span class="hljs-keyword">import</span> { error } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@sveltejs/kit&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">load</span>(<span class="hljs-params">{ locals }</span>) {
  <span class="hljs-keyword">if</span> (!locals.<span class="hljs-property">user</span>) <span class="hljs-title function_">error</span>(<span class="hljs-number">401</span>, <span class="hljs-string">&#x27;请先登录&#x27;</span>);
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">user</span>: { <span class="hljs-attr">id</span>: locals.<span class="hljs-property">user</span>.<span class="hljs-property">id</span>, <span class="hljs-attr">displayName</span>: locals.<span class="hljs-property">user</span>.<span class="hljs-property">displayName</span> },
  };
}
</code></pre></div>
<p><code>locals.user</code> 由 <code>hooks.server.js</code> 根据会话 cookie 设置。返回值里不要包含密码哈希、令牌或完整数据库记录。</p>
<h2>表单 action</h2>
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
<p><code>fail</code> 返回的数据通过 <code>form</code> prop 传回页面，用于显示错误和回填输入。action 成功后，SvelteKit 会重新运行页面的 load。</p>
<h2>load 什么时候重新运行</h2>
<ul>
<li>路由参数、<code>url</code> 变化，且 load 读取了它们。</li>
<li>调用 <code>invalidate(url)</code> 或 <code>invalidateAll()</code>。</li>
<li>action 提交之后。</li>
</ul>
<p>父布局的 load 不一定在每次子页面导航时重新执行，所以权限检查不能只放在布局里，每个服务端 load、action 和端点都要自己检查。</p>
<h2>注意点</h2>
<ul>
<li>不要在服务端模块的顶层变量里存当前用户数据，同一个进程会被多个请求共享。</li>
<li>在 load 里用 SvelteKit 提供的 <code>fetch</code>，它会转发 cookie，并在 SSR 时把响应内联到页面，避免客户端重复请求。</li>
<li>多个互不依赖的请求用 <code>Promise.all</code> 并行，<code>await parent()</code> 会让当前 load 等待父级，应放在需要时才调用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 Next.js App Router 的区别？SvelteKit 用 load 函数显式加载数据，没有 Server Components；Next.js 在 Server Component 中直接 <code>await</code> 数据。</li>
<li>预渲染怎么开启？在页面或布局中导出 <code>export const prerender = true</code>，构建时生成静态 HTML。</li>
</ul>`};export{e as default};