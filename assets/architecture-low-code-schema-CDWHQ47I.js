var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Schema 驱动 UI 用 JSON 描述页面或表单，渲染器根据描述创建组件，适合结构相似、数量多的后台页面和表单。</li>
<li>渲染器只能使用预先注册的组件白名单，配置里只写组件名和参数，不能写任意代码。</li>
<li>逻辑（显隐、校验、联动）用受限的声明式表达式或注册好的函数名表示，不用 <code>eval</code> 或 <code>new Function</code> 执行配置中的字符串。</li>
<li>Schema 要带版本号，渲染器升级时提供迁移函数，把旧配置转换成新格式。</li>
<li>前端校验只是体验，权限和数据合法性必须由服务端校验。</li>
</ul>
<h2>一个表单 Schema</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;version&quot;: 2,
  &quot;fields&quot;: [
    { &quot;name&quot;: &quot;type&quot;, &quot;component&quot;: &quot;Select&quot;, &quot;label&quot;: &quot;类型&quot;,
      &quot;options&quot;: [{ &quot;value&quot;: &quot;person&quot;, &quot;label&quot;: &quot;个人&quot; }, { &quot;value&quot;: &quot;company&quot;, &quot;label&quot;: &quot;企业&quot; }] },
    { &quot;name&quot;: &quot;companyName&quot;, &quot;component&quot;: &quot;Input&quot;, &quot;label&quot;: &quot;企业名称&quot;,
      &quot;visibleWhen&quot;: { &quot;field&quot;: &quot;type&quot;, &quot;equals&quot;: &quot;company&quot; },
      &quot;rules&quot;: [{ &quot;required&quot;: true }] }
  ]
}
</code></pre></div>
<h2>组件注册</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> registry = { <span class="hljs-title class_">Input</span>, <span class="hljs-title class_">Select</span>, <span class="hljs-title class_">DatePicker</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">renderField</span>(<span class="hljs-params">field</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title class_">Component</span> = registry[field.<span class="hljs-property">component</span>];
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Component</span>) <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">UnknownField</span> <span class="hljs-attr">name</span>=<span class="hljs-string">{field.name}</span> /&gt;</span></span>;
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Component</span> {<span class="hljs-attr">...pickAllowedProps</span>(<span class="hljs-attr">field</span>)} /&gt;</span></span>;
}
</code></pre></div>
<ul>
<li>只渲染注册表中存在的组件，未知组件显示占位而不是崩溃。</li>
<li>只把允许的参数传给组件，防止配置注入 <code>dangerouslySetInnerHTML</code> 或事件处理器。</li>
</ul>
<h2>逻辑表达</h2>
<p>声明式条件（如上例的 <code>visibleWhen</code>）覆盖大多数显隐和联动场景，渲染器可以静态分析字段之间的依赖。</p>
<p>复杂逻辑可以注册为命名函数，配置中只引用函数名：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{ &quot;rules&quot;: [{ &quot;validator&quot;: &quot;isValidTaxId&quot; }] }
</code></pre></div>
<p>需要用户编写表达式时，使用只支持有限运算符的表达式解析器，而不是执行 JavaScript。配置执行任意代码相当于把 XSS 能力交给了能编辑配置的人。</p>
<h2>版本迁移</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> migrations = {
  <span class="hljs-number">1</span>: <span class="hljs-function">(<span class="hljs-params">schema</span>) =&gt;</span> ({ ...schema, <span class="hljs-attr">version</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">fields</span>: schema.<span class="hljs-property">items</span> }),
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">migrate</span>(<span class="hljs-params">schema</span>) {
  <span class="hljs-keyword">let</span> current = schema;
  <span class="hljs-keyword">while</span> (migrations[current.<span class="hljs-property">version</span>]) current = migrations[current.<span class="hljs-property">version</span>](current);
  <span class="hljs-keyword">return</span> current;
}
</code></pre></div>
<p>配置会长期存储在数据库中，渲染器改动字段名或结构时，旧配置必须能被自动升级。迁移函数要有测试。</p>
<h2>安全边界</h2>
<ul>
<li>表单配置里的 <code>required</code>、<code>maxLength</code> 只影响前端体验，服务端要用同一份规则（例如从 Schema 生成 JSON Schema）独立校验提交数据。</li>
<li>字段是否隐藏不等于用户有没有权限，敏感字段要由服务端根据权限决定是否返回和接受。</li>
<li>能编辑配置的人员本身要有权限控制和审计记录。</li>
</ul>
<h2>什么时候不适合</h2>
<p>交互复杂、定制化强的页面用配置描述会比代码更难维护。常见做法是让 Schema 覆盖标准部分，同时允许嵌入注册好的自定义组件。</p>
<h2>常见追问</h2>
<ul>
<li>和 JSON Schema 是什么关系？JSON Schema 描述数据结构和校验规则；UI Schema 描述怎样展示，两者常配合使用。</li>
<li>怎样调试配置问题？渲染器在开发模式下校验 Schema 并给出具体字段路径的错误信息。</li>
</ul>`};export{e as default};