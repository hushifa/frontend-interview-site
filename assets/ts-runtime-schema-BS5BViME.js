var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>TypeScript 的类型只在编译时存在，编译完就删掉了。后端改了字段、本地缓存里存着旧格式、第三方接口出了异常，这些都发生在运行时，编译器看不到。</p>
<p>所以 <code>JSON.parse(text) as User</code>、<code>fetch&lt;User&gt;()</code> 这种写法不会生成任何校验代码，只是你在告诉编译器“相信我”。数据真不对时，程序往往在很深的地方才崩，很难排查。</p>
<p>正确做法是在信任边界，也就是数据从外面进来的地方，先把它当作 <code>unknown</code>，用 Zod、Valibot 这类 schema 库或手写函数解析，解析通过了，内部代码再依赖类型。类型最好从 schema 推导出来，比如 <code>z.infer&lt;typeof User&gt;</code>，避免类型和校验规则各写一遍、慢慢对不上。</p>
<p>网络请求要分三步检查：HTTP 状态码、JSON 语法、数据结构。前端校验也不能代替服务端校验。</p>
</blockquote>
<h2>as 只是声明，不是检查</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;reader&#x27;</span> | <span class="hljs-string">&#x27;editor&#x27;</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">readUnchecked</span>(<span class="hljs-params"><span class="hljs-attr">json</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">const</span> user = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(json) <span class="hljs-keyword">as</span> <span class="hljs-title class_">User</span>;
  <span class="hljs-keyword">return</span> user.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>(); <span class="hljs-comment">// name 是数字或缺失时运行时报错</span>
}
</code></pre></div>
<p>这段代码编译完全通过。可要是接口返回的 <code>name</code> 是个数字，或者根本没有 <code>name</code>，运行时就会报“toUpperCase 不是函数”或者“读取 undefined 的属性”。原因是 <code>as User</code> 编译后什么都不剩，它没有检查 <code>json</code> 里到底是什么。</p>
<h2>手写一个解析函数</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ParseResult</span>&lt;T&gt; = { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">value</span>: T } | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">issues</span>: <span class="hljs-built_in">string</span>[] };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isRecord</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): value is <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">unknown</span>&gt; {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; value !== <span class="hljs-literal">null</span> &amp;&amp; !<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseUser</span>(<span class="hljs-params"><span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-title class_">ParseResult</span>&lt;<span class="hljs-title class_">User</span>&gt; {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isRecord</span>(input)) <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;必须是对象&#x27;</span>] };
  <span class="hljs-keyword">const</span> { id, name, role } = input;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> id !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;id 必须是字符串&#x27;</span>] };
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> name !== <span class="hljs-string">&#x27;string&#x27;</span> || !name.<span class="hljs-title function_">trim</span>()) <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;name 不能为空&#x27;</span>] };
  <span class="hljs-keyword">if</span> (role !== <span class="hljs-string">&#x27;reader&#x27;</span> &amp;&amp; role !== <span class="hljs-string">&#x27;editor&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;role 不合法&#x27;</span>] };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">value</span>: { id, <span class="hljs-attr">name</span>: name.<span class="hljs-title function_">trim</span>(), role } };
}
</code></pre></div>
<p>参数是 <code>unknown</code>，所以每个字段都得先检查才能用，编译器逼着你把校验写全。每通过一个 <code>if</code>，对应变量的类型就被收窄一步，最后返回的对象才真正符合 <code>User</code>。</p>
<p>还要注意最后一行是新建对象，只复制了 <code>id</code>、<code>name</code>、<code>role</code>。接口多返回的字段不会混进内部状态，这比直接返回 <code>input</code> 更安全。</p>
<h2>用 schema 库</h2>
<p>字段一多，手写就很繁琐。schema 库让你只描述一次结构，同时得到校验和类型：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { z } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;zod&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">User</span> = z.<span class="hljs-title function_">object</span>({
  <span class="hljs-attr">id</span>: z.<span class="hljs-title function_">string</span>(),
  <span class="hljs-attr">name</span>: z.<span class="hljs-title function_">string</span>().<span class="hljs-title function_">trim</span>().<span class="hljs-title function_">min</span>(<span class="hljs-number">1</span>),
  <span class="hljs-attr">role</span>: z.<span class="hljs-title function_">enum</span>([<span class="hljs-string">&#x27;reader&#x27;</span>, <span class="hljs-string">&#x27;editor&#x27;</span>]),
});
<span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = z.<span class="hljs-property">infer</span>&lt;<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">User</span>&gt;;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadUser</span>(<span class="hljs-params"><span class="hljs-attr">url</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">signal</span>?: <span class="hljs-title class_">AbortSignal</span></span>): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">User</span>&gt; {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">signal</span>: signal ?? <span class="hljs-literal">null</span> });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  <span class="hljs-keyword">const</span> result = <span class="hljs-title class_">User</span>.<span class="hljs-title function_">safeParse</span>(<span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>());
  <span class="hljs-keyword">if</span> (!result.<span class="hljs-property">success</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;用户数据不符合契约&#x27;</span>, { <span class="hljs-attr">cause</span>: result.<span class="hljs-property">error</span> });
  <span class="hljs-keyword">return</span> result.<span class="hljs-property">data</span>;
}
</code></pre></div>
<p><code>User</code> 这个 schema 既用来运行时校验，又通过 <code>z.infer</code> 推出类型，两者不会写成两套。<code>loadUser</code> 正好对应三步检查：<code>response.ok</code> 看状态码，<code>response.json()</code> 解析 JSON 语法，<code>safeParse</code> 校验结构。</p>
<p>选库或配 schema 时要想清楚几件事：多出来的字段是拒绝、保留还是去掉（Zod 的 <code>object</code> 默认去掉）；<code>&#x27;1&#x27;</code> 这种字符串要不要自动转成数字；缺失的字段要不要填默认值。</p>
<h2>哪些地方需要校验</h2>
<p>凡是数据从程序外面进来的地方都要校验：接口响应、WebSocket 消息、<code>postMessage</code> 收到的数据；从 <code>localStorage</code>、IndexedDB 里恢复的数据，旧版本存的格式还要做迁移；URL 查询参数和表单输入。</p>
<p>内部函数之间互相调用，不必每层都重复校验。另外前端校验是为了尽早发现问题、改善交互，服务端仍要独立校验。字段格式合法，也不代表用户有权限做这件事。</p>
<h2>常见追问</h2>
<p><strong>能不能根据 TS 类型自动生成校验代码？</strong></p>
<blockquote>
<p>类型运行时不存在，没法直接拿来校验。常见做法是反过来，从 schema 推导类型；或者用 typia 这类编译插件，在编译时根据类型生成校验代码。</p>
</blockquote>
<p><strong>校验失败了怎么处理？</strong></p>
<blockquote>
<p>记录出错的字段路径和接口版本，方便排查；给用户显示一个可恢复的错误。不要悄悄返回空数据，那样问题会被藏起来。</p>
</blockquote>`};export{e as default};