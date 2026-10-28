var e={answerHtml:`<h2>简答</h2>
<ul>
<li>在函数体或文件顶部写 <code>&#x27;use server&#x27;</code>，打包工具会把函数留在服务端，只给客户端一个引用；客户端调用时，框架发送请求、在服务端执行并返回结果。</li>
<li>传给 <code>&lt;form action&gt;</code> 或在 Action 中调用时，通常称为 Server Action。</li>
<li>参数和返回值必须能被 React 序列化：基本类型、普通对象、数组、<code>Date</code>、<code>FormData</code>、Promise 等可以，类实例、函数（Server Function 除外）不可以。</li>
<li>每个 Server Function 等同于一个任何人都能调用的 HTTP 接口，必须在函数内部做认证、授权和参数校验，不能依赖&quot;按钮只对管理员显示&quot;。</li>
<li>需要框架支持（如 Next.js App Router），并使用打过安全补丁的版本：2025 年 12 月披露的 CVE-2025-55182 影响 <code>react-server-dom-*</code> 的多个 19.x 版本。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// app/actions.js</span>
<span class="hljs-string">&#x27;use server&#x27;</span>;

<span class="hljs-keyword">import</span> { z } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;zod&#x27;</span>;
<span class="hljs-keyword">import</span> { auth } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./auth&#x27;</span>;
<span class="hljs-keyword">import</span> { db } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./db&#x27;</span>;

<span class="hljs-keyword">const</span> schema = z.<span class="hljs-title function_">object</span>({ <span class="hljs-attr">title</span>: z.<span class="hljs-title function_">string</span>().<span class="hljs-title function_">min</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">max</span>(<span class="hljs-number">100</span>) });

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createPost</span>(<span class="hljs-params">prevState, formData</span>) {
  <span class="hljs-keyword">const</span> session = <span class="hljs-keyword">await</span> <span class="hljs-title function_">auth</span>();
  <span class="hljs-keyword">if</span> (!session) <span class="hljs-keyword">return</span> { <span class="hljs-attr">error</span>: <span class="hljs-string">&#x27;请先登录&#x27;</span> };

  <span class="hljs-keyword">const</span> parsed = schema.<span class="hljs-title function_">safeParse</span>({ <span class="hljs-attr">title</span>: formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;title&#x27;</span>) });
  <span class="hljs-keyword">if</span> (!parsed.<span class="hljs-property">success</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">error</span>: <span class="hljs-string">&#x27;标题长度应为 1–100 个字符&#x27;</span> };

  <span class="hljs-keyword">await</span> db.<span class="hljs-property">post</span>.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">data</span>: { <span class="hljs-attr">title</span>: parsed.<span class="hljs-property">data</span>.<span class="hljs-property">title</span>, <span class="hljs-attr">authorId</span>: session.<span class="hljs-property">userId</span> } });
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">error</span>: <span class="hljs-literal">null</span> };
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// app/new-post.jsx</span>
<span class="hljs-string">&#x27;use client&#x27;</span>;

<span class="hljs-keyword">import</span> { useActionState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { createPost } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./actions&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">NewPost</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [state, action, pending] = <span class="hljs-title function_">useActionState</span>(createPost, { <span class="hljs-attr">error</span>: <span class="hljs-literal">null</span> });
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{action}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;title&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{pending}</span>&gt;</span>发布<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      {state.error &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>{state.error}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p><code>authorId</code> 从服务端会话中获取，而不是由表单提交，防止用户冒充他人。</p>
<h2>闭包变量也会被发送</h2>
<p>在 Server Component 里内联定义 Server Function 时，它捕获的外部变量会被序列化后发给客户端，调用时再传回服务端。不要在闭包中捕获密钥或不想让用户看到的数据；需要保密的值在函数内部重新读取。</p>
<h2>与 Server Components 的区别</h2>
<ul>
<li>Server Component 在服务端渲染并输出 UI，不能被客户端主动调用。</li>
<li>Server Function 是客户端可以调用的服务端函数，用于修改数据。</li>
</ul>
<p><code>&#x27;use server&#x27;</code> 不是用来标记 Server Component 的，Server Component 不需要任何指令。详见<a href="/questions/render-server-components/">《React Server Components 和 SSR 是同一件事吗？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>修改数据后怎么刷新页面？由框架提供，例如 Next.js 中调用 <code>revalidatePath</code> 或 <code>updateTag</code>。</li>
<li>能用来读数据吗？不推荐，框架通常一次只处理一个 Action，读数据应放在 Server Component 或数据加载层里。</li>
</ul>`};export{e as default};