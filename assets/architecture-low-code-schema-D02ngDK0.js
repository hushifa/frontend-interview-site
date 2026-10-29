var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Schema 驱动 UI，就是用一份 JSON 描述页面或表单长什么样，渲染器读这份描述，把组件创建出来。它适合结构差不多、数量又多的后台页面和表单。</p>
<p>安全上最重要的一条是：配置里只能写组件名和参数，不能写代码。渲染器只认预先注册好的组件白名单。显隐、校验、联动这些逻辑，用受限的声明式条件，或者引用注册好的函数名来表示，不要用 <code>eval</code>、<code>new Function</code> 去执行配置里的字符串。</p>
<p>可维护上，Schema 要带版本号。配置会在数据库里存很久，渲染器升级时要提供迁移函数，把旧配置自动转成新格式。</p>
<p>还要注意，前端按配置做的校验只是为了体验。权限和数据是否合法，必须由服务端校验。</p>
</blockquote>
<h2>一份表单 Schema 长什么样</h2>
<p>下面这份配置描述了两个字段，“企业名称”只在类型选了“企业”时显示：</p>
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
<p>注意 <code>visibleWhen</code> 是一个对象，不是一段代码。渲染器读到它，自己去判断要不要显示。</p>
<h2>渲染器怎样只用注册过的组件</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> registry = { <span class="hljs-title class_">Input</span>, <span class="hljs-title class_">Select</span>, <span class="hljs-title class_">DatePicker</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">renderField</span>(<span class="hljs-params">field</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title class_">Component</span> = registry[field.<span class="hljs-property">component</span>];
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Component</span>) <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">UnknownField</span> <span class="hljs-attr">name</span>=<span class="hljs-string">{field.name}</span> /&gt;</span></span>;
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Component</span> {<span class="hljs-attr">...pickAllowedProps</span>(<span class="hljs-attr">field</span>)} /&gt;</span></span>;
}
</code></pre></div>
<p>配置里写的组件名，只有在注册表里查得到才会渲染。查不到就显示一个占位，而不是整个页面崩掉。</p>
<p>传给组件的参数也要过一遍白名单，也就是 <code>pickAllowedProps</code>。为什么？因为如果把配置原样展开传进去，能编辑配置的人就可以塞进 <code>dangerouslySetInnerHTML</code> 或者事件处理器。</p>
<h2>逻辑怎样写进配置</h2>
<p>大部分显隐和联动，用上面 <code>visibleWhen</code> 这种声明式条件就能覆盖。它还有个好处：渲染器不用运行就能分析出字段之间谁依赖谁。</p>
<p>更复杂的逻辑，先在代码里注册成命名函数，配置里只写函数名：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{ &quot;rules&quot;: [{ &quot;validator&quot;: &quot;isValidTaxId&quot; }] }
</code></pre></div>
<p>如果确实需要让用户自己写表达式，就用一个只支持有限运算符的表达式解析器，而不是执行 JavaScript。允许配置执行任意代码，等于把 XSS 的能力交给了每一个能编辑配置的人。</p>
<h2>旧配置怎样升级</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> migrations = {
  <span class="hljs-number">1</span>: <span class="hljs-function">(<span class="hljs-params">schema</span>) =&gt;</span> ({ ...schema, <span class="hljs-attr">version</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">fields</span>: schema.<span class="hljs-property">items</span> }),
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">migrate</span>(<span class="hljs-params">schema</span>) {
  <span class="hljs-keyword">let</span> current = schema;
  <span class="hljs-keyword">while</span> (migrations[current.<span class="hljs-property">version</span>]) current = migrations[current.<span class="hljs-property">version</span>](current);
  <span class="hljs-keyword">return</span> current;
}
</code></pre></div>
<p>每个版本对应一个迁移函数，把配置升到下一版。<code>migrate</code> 一级一级往上升，直到没有更新的迁移为止。</p>
<p>为什么要这样做？因为配置长期存在数据库里，渲染器哪天改了字段名或结构，旧配置不能就这么坏掉，必须能自动升级。这些迁移函数也要写测试。</p>
<h2>安全边界在哪里</h2>
<p>表单配置里的 <code>required</code>、<code>maxLength</code> 只影响前端体验。服务端要用同一份规则独立校验提交的数据，比如从 Schema 生成 JSON Schema 来校验。</p>
<p>字段隐藏了，不等于用户没有权限。敏感字段要由服务端根据权限决定返不返回、接不接受。</p>
<p>能编辑配置的人本身也要有权限控制，修改要留审计记录。</p>
<h2>什么时候不适合用</h2>
<p>交互复杂、定制化强的页面，硬用配置去描述，往往比直接写代码更难维护。常见的折中是让 Schema 覆盖标准的部分，同时允许嵌入注册好的自定义组件。</p>
<h2>常见追问</h2>
<p><strong>这和 JSON Schema 是什么关系？</strong></p>
<blockquote>
<p>JSON Schema 描述的是数据结构和校验规则；UI Schema 描述的是怎么展示。两者经常配合使用。</p>
</blockquote>
<p><strong>配置出问题了怎么调试？</strong></p>
<blockquote>
<p>渲染器在开发模式下先校验 Schema，出错时给出具体到字段路径的错误信息。</p>
</blockquote>`};export{e as default};