var e={answerHtml:`<p>后端字段改名、缓存里留着旧版本数据、第三方接口偶尔返回错误结构，都发生在 TypeScript 编译之外。即使前端声明了 User，服务器也不会因为看见这个类型名字，就自动返回符合它的对象。</p>
<p>类型检查可以保证项目内正常受检查的调用关系，不能替你验证网络、存储、URL 参数或其他外部输入的实际内容。</p>
<h3>as User 并没有检查任何字段</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;reader&#x27;</span> | <span class="hljs-string">&#x27;editor&#x27;</span>;
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">readUnchecked</span>(<span class="hljs-params"><span class="hljs-attr">json</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">const</span> user = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(json) <span class="hljs-keyword">as</span> <span class="hljs-title class_">User</span>;
  <span class="hljs-keyword">return</span> user.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>();
}
</code></pre></div>
<p>JSON.parse 只解析 JSON 语法。输入可以是数字、null、数组，或者 name 为数字的对象。as User 不会生成验证逻辑，后面的 toUpperCase 仍然可能在运行时失败。</p>
<p>给请求封装写 get() 也是同样的问题：如果内部只是把结果断言成 T，类型参数表达的是调用者的预期，不是一次已经发生的校验。</p>
<h3>先把边界输入当 unknown，再明确建立 User</h3>
<p>下面的解析器按记录字段检查输入的类型和允许值，去掉姓名两侧空白，并创建只含白名单字段的新对象：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ParseResult</span>&lt;T&gt; =
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">value</span>: T }
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">issues</span>: <span class="hljs-built_in">string</span>[] };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isRecord</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">unknown</span></span>): value is <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">unknown</span>&gt; {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span> &amp;&amp; value !== <span class="hljs-literal">null</span> &amp;&amp; !<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseUser</span>(<span class="hljs-params"><span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span></span>): <span class="hljs-title class_">ParseResult</span>&lt;<span class="hljs-title class_">User</span>&gt; {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">isRecord</span>(input)) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;用户数据必须是对象&#x27;</span>] };
  }
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(input, <span class="hljs-string">&#x27;id&#x27;</span>) || <span class="hljs-keyword">typeof</span> input.<span class="hljs-property">id</span> !== <span class="hljs-string">&#x27;string&#x27;</span> ||
      !<span class="hljs-regexp">/^user_[0-9]+$/</span>.<span class="hljs-title function_">test</span>(input.<span class="hljs-property">id</span>)) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;id 必须符合 user_数字 的格式&#x27;</span>] };
  }
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(input, <span class="hljs-string">&#x27;name&#x27;</span>) || <span class="hljs-keyword">typeof</span> input.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;string&#x27;</span> ||
      input.<span class="hljs-property">name</span>.<span class="hljs-title function_">trim</span>() === <span class="hljs-string">&#x27;&#x27;</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;name 必须是非空字符串&#x27;</span>] };
  }
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(input, <span class="hljs-string">&#x27;role&#x27;</span>) ||
      (input.<span class="hljs-property">role</span> !== <span class="hljs-string">&#x27;reader&#x27;</span> &amp;&amp; input.<span class="hljs-property">role</span> !== <span class="hljs-string">&#x27;editor&#x27;</span>)) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">issues</span>: [<span class="hljs-string">&#x27;role 不在允许范围内&#x27;</span>] };
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">value</span>: { <span class="hljs-attr">id</span>: input.<span class="hljs-property">id</span>, <span class="hljs-attr">name</span>: input.<span class="hljs-property">name</span>.<span class="hljs-title function_">trim</span>(), <span class="hljs-attr">role</span>: input.<span class="hljs-property">role</span> },
  };
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">raw</span>: <span class="hljs-built_in">unknown</span> = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(
  <span class="hljs-string">&#x27;{&quot;id&quot;:&quot;user_1&quot;,&quot;name&quot;:&quot; Lin &quot;,&quot;role&quot;:&quot;reader&quot;,&quot;extra&quot;:true}&#x27;</span>,
);
<span class="hljs-keyword">const</span> parsed = <span class="hljs-title function_">parseUser</span>(raw);
<span class="hljs-keyword">if</span> (parsed.<span class="hljs-property">ok</span>) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(parsed.<span class="hljs-property">value</span>));
<span class="hljs-comment">// 输出：{&quot;id&quot;:&quot;user_1&quot;,&quot;name&quot;:&quot;Lin&quot;,&quot;role&quot;:&quot;reader&quot;}</span>
</code></pre></div>
<p>返回联合明确区分成功值与失败信息，内部组件拿到 ok:true 后可以按 User 使用。新对象只复制 id、name、role，才真正做到忽略未声明字段，而不是通过 Omit 或断言让它们在类型提示里消失。</p>
<p>这里会拒绝数组与缺失的自身字段，但没有承诺验证任意宿主对象的所有原型或访问器行为。示例面向 JSON 等普通数据边界；若输入本身是能够执行 getter、Proxy trap 的不受控对象，还要另外分析访问行为。</p>
<p>规则中的 user_数字、非空姓名和角色枚举是本例的业务约定。实际接口还可能需要长度限制、版本字段、跨字段关系与更细的错误路径，应由真实契约决定。</p>
<h3>网络成功、JSON 解析成功、数据合法是三步</h3>
<p>沿用上面的 parseUser，可以在请求边界分别处理这些阶段：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadUser</span>(<span class="hljs-params">
  <span class="hljs-attr">url</span>: <span class="hljs-built_in">string</span>,
  <span class="hljs-attr">options</span>: <span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">RequestInit</span>, <span class="hljs-string">&#x27;signal&#x27;</span>&gt; = {},
</span>): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">User</span>&gt; {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, options);
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`用户请求返回 HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);

  <span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span> = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">const</span> result = <span class="hljs-title function_">parseUser</span>(input);
  <span class="hljs-keyword">if</span> (!result.<span class="hljs-property">ok</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`用户数据不符合契约：<span class="hljs-subst">\${result.issues.join(<span class="hljs-string">&#x27;；&#x27;</span>)}</span>\`</span>);
  }
  <span class="hljs-keyword">return</span> result.<span class="hljs-property">value</span>;
}
</code></pre></div>
<p>fetch 返回 HTTP 错误响应时不一定拒绝，response.json 也可能因为内容不是有效 JSON 而失败。两步成功后，还需要结构校验。不能把所有问题都归为“接口没返回”或“TypeScript 类型不对”。</p>
<p>真正使用时，调用方还要区分取消、网络故障与契约错误，并决定提示、重试或降级。把不合法结构统一转成空列表，可能会让用户误以为数据确实为空。</p>
<h3>结构复杂时，让 schema 成为统一来源</h3>
<p>手写守卫适合小而稳定的结构。大量嵌套对象、联合分支、数组和错误路径，可以交给 Zod、Valibot 等适合项目的运行时 schema 工具，并从 schema 推导静态类型，减少两份契约手工同步。</p>
<p>使用库也要确认具体规则：额外字段是拒绝、保留还是剥离？字符串数字是否允许转换？缺失时是否填默认值？转换前的输入类型与转换后的输出类型是否相同？这些都会影响 API 语义，不能只看 parse 没抛错。</p>
<p>强制转换尤其需要谨慎。例如把任意非空字符串转换成布尔值，并不自然等于用户输入的 &#x27;false&#x27; 应被理解为 false。默认值也可能掩盖后端意外漏字段，必须有明确的兼容策略。</p>
<h3>只在不可信边界重复验证必要内容</h3>
<p>网络响应、localStorage 恢复、跨窗口消息和用户输入是常见边界。经过解析后，可以让内部函数依靠清楚的类型契约流转，避免每个组件再写一份互不一致的校验逻辑。</p>
<p>但如果内部代码仍会通过可变引用任意修改对象，原本通过的约束也可能被破坏。是否需要只读接口、复制、受控更新或重新验证，要根据对象生命周期决定，不能把一次解析当成永久不变的认证标记。</p>
<p>持久化数据还要考虑版本迁移。旧数据符合旧结构、不符合新结构时，应明确升级、重置或提示，而不是靠断言让它继续冒充新版模型。</p>
<h3>校验通过不等于有权限执行操作</h3>
<p>字段合法不代表用户拥有对应资源，也不代表字符串里的链接、文件或 HTML 内容在任何使用位置都安全。不同使用场景仍需要授权、编码或相应安全规则。</p>
<p>前端校验主要帮助尽早发现契约问题并改善交互，服务端仍需验证请求。记录错误时可以保留字段路径、版本和必要的诊断码，避免直接把敏感原始数据全部上传。清楚的边界解析，才会让静态类型在后续代码里成为有依据的保证。</p>`};export{e as default};