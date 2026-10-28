var e={answerHtml:`<h2>简答</h2>
<ul>
<li>类型只存在于编译期，后端改字段、缓存存着旧格式、第三方接口异常，都发生在编译器看不到的地方。</li>
<li><code>JSON.parse(text) as User</code>、<code>fetch&lt;User&gt;()</code> 不会生成校验代码，后续代码可能在很深的地方才崩溃。</li>
<li>在信任边界把输入当作 <code>unknown</code>，用 schema 解析出可信数据，内部代码再依赖类型。</li>
<li>用 schema 推导类型（<code>z.infer&lt;typeof User&gt;</code>），避免类型和校验规则写两遍后不一致。</li>
<li>网络请求要分三步检查：HTTP 状态、JSON 语法、数据结构。</li>
</ul>
<h2>断言不是检查</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;reader&#x27;</span> | <span class="hljs-string">&#x27;editor&#x27;</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">readUnchecked</span>(<span class="hljs-params"><span class="hljs-attr">json</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">const</span> user = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(json) <span class="hljs-keyword">as</span> <span class="hljs-title class_">User</span>;
  <span class="hljs-keyword">return</span> user.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>(); <span class="hljs-comment">// name 是数字或缺失时运行时报错</span>
}
</code></pre></div>
<h2>手写解析</h2>
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
<p>返回新对象只复制白名单字段，多余字段不会流进内部状态。</p>
<h2>用 schema 库</h2>
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
<p>选择库时要确认：多余字段是拒绝、保留还是剥离（Zod 的 <code>object</code> 默认剥离）；是否允许 <code>&#x27;1&#x27;</code> 自动转成数字；缺失字段是否填默认值。</p>
<h2>哪些地方需要校验</h2>
<ul>
<li>接口响应、WebSocket 消息、<code>postMessage</code> 收到的数据。</li>
<li><code>localStorage</code> / IndexedDB 中恢复的数据，旧版本格式需要迁移。</li>
<li>URL 查询参数、表单输入。</li>
</ul>
<p>内部函数之间不必重复校验。前端校验用于尽早发现问题和改善交互，服务端仍要独立校验，字段合法也不代表用户有权限。</p>
<h2>常见追问</h2>
<ul>
<li>能根据 TS 类型自动生成校验吗？类型在运行时不存在，需要从 schema 推导类型，或用 typia 等编译插件从类型生成代码。</li>
<li>校验失败怎样处理？记录字段路径和接口版本，向用户显示可恢复的错误，不要静默返回空数据。</li>
</ul>`};export{e as default};