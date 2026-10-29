var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在函数体或文件顶部写上 <code>&#x27;use server&#x27;</code>，打包工具就会把这个函数留在服务端，客户端只拿到一个引用。客户端调用它时，框架发一个请求到服务端，执行完再把结果送回来。这种函数叫 Server Function；传给 <code>&lt;form action&gt;</code> 或在 Action 里调用时，通常叫 Server Action。</p>
<p>因为中间隔了一次网络传输，参数和返回值必须能被 React 序列化。基本类型、普通对象、数组、<code>Date</code>、<code>FormData</code>、Promise 都可以；类实例和普通函数不行，Server Function 本身除外。</p>
<p>它的好处是写表单提交、改数据时不用自己定义接口和写 fetch。它需要框架支持，比如 Next.js App Router。</p>
<p>最要注意的是安全。每个 Server Function 都相当于一个任何人都能调用的 HTTP 接口，必须在函数内部做认证、授权和参数校验，不能指望“按钮只对管理员显示”。另外要用打过安全补丁的版本，2025 年 12 月披露的 CVE-2025-55182 影响 <code>react-server-dom-*</code> 的多个 19.x 版本。</p>
</blockquote>
<h2>先看一个发帖的例子</h2>
<p>服务端的 Action 放在单独的文件里，文件顶部写 <code>&#x27;use server&#x27;</code>：</p>
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
<p>客户端组件直接导入它，交给 <code>useActionState</code>：</p>
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
<p>客户端看起来是直接导入了一个函数，但打包后它拿到的只是引用。<code>db</code>、<code>auth</code> 这些服务端代码不会进入浏览器的包。</p>
<p>注意 <code>createPost</code> 一上来就检查登录、校验标题，而且 <code>authorId</code> 是从服务端的会话里取的，不是从表单里拿的。因为任何人都能绕过页面，直接构造请求调用这个函数。如果 <code>authorId</code> 由表单提交，用户改一下就能冒充别人发帖。</p>
<h2>闭包里的变量也会发到客户端</h2>
<p>在 Server Component 里直接内联定义 Server Function 时，它用到的外部变量会被序列化后发给客户端，调用时再传回服务端。</p>
<p>这意味着用户能看到这些值。所以不要在闭包里捕获密钥或者不想让用户看到的数据，需要保密的值放在函数内部重新读取。</p>
<h2>和 Server Components 有什么区别</h2>
<p>两者都在服务端运行，但方向相反。Server Component 在服务端渲染、输出 UI，客户端不能主动调用它。Server Function 是客户端可以调用的服务端函数，主要用来改数据。</p>
<p>还有一个常见误会：<code>&#x27;use server&#x27;</code> 不是用来标记 Server Component 的。Server Component 不需要任何指令。详见<a href="/questions/render-server-components/">《React Server Components 和 SSR 是同一件事吗？》</a>。</p>
<h2>常见追问</h2>
<p><strong>改完数据以后页面怎么刷新？</strong></p>
<blockquote>
<p>由框架提供。例如在 Next.js 里，在 Action 中调用 <code>revalidatePath</code> 或 <code>updateTag</code>，让相关页面重新获取数据。</p>
</blockquote>
<p><strong>能用 Server Function 读数据吗？</strong></p>
<blockquote>
<p>不推荐。框架通常一次只处理一个 Action，用它读数据会排队变慢。读数据应该放在 Server Component 或数据加载层里。</p>
</blockquote>`};export{e as default};