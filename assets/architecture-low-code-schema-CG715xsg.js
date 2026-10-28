var e={answerHtml:`<p>低代码平台通常把页面结构、字段、校验和数据源保存成 JSON，再由运行时渲染。这样可以让运营快速调整表单和列表，但也会带来新的问题：配置怎样校验、组件怎样升级、表达式能做什么、用户权限在哪里执行，以及旧配置怎样迁移。</p>
<p>Schema 驱动 UI 的价值在于把可变业务描述成受约束的数据；如果配置里可以执行任意 JavaScript，它就不再是单纯的 Schema，而接近一个需要隔离和治理的程序运行时。</p>
<h2>先区分结构 Schema 和业务数据</h2>
<p>页面配置可以描述组件类型、属性、子节点和事件：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;version&quot;: 2,
  &quot;type&quot;: &quot;form&quot;,
  &quot;fields&quot;: [
    {
      &quot;id&quot;: &quot;email&quot;,
      &quot;component&quot;: &quot;text&quot;,
      &quot;label&quot;: &quot;邮箱&quot;,
      &quot;required&quot;: true,
      &quot;inputType&quot;: &quot;email&quot;
    }
  ]
}
</code></pre></div>
<p>这个对象是 UI 结构的描述，不等于用户填写的表单值，也不等于服务端权限。结构校验可以检查 <code>component</code> 是否在白名单、字段 ID 是否唯一、嵌套深度和字符串长度是否有限；业务数据还要按字段类型、跨字段约束和服务端规则单独校验。</p>
<p>Schema 通过不等于配置安全。来自网络、数据库导入或用户编辑的配置都应当视为不可信输入，不能直接把任意字段 spread 到 DOM 或组件 props 上。</p>
<h2>组件注册表比动态执行组件名更可控</h2>
<p>渲染器应从受控注册表取得组件：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> components = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([
  [<span class="hljs-string">&#x27;text&#x27;</span>, <span class="hljs-title class_">TextField</span>],
  [<span class="hljs-string">&#x27;select&#x27;</span>, <span class="hljs-title class_">SelectField</span>],
]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">renderField</span>(<span class="hljs-params">schema, value, onChange</span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title class_">Component</span> = components.<span class="hljs-title function_">get</span>(schema.<span class="hljs-property">component</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Component</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未知组件：<span class="hljs-subst">\${schema.component}</span>\`</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Component</span> <span class="hljs-attr">schema</span>=<span class="hljs-string">{schema}</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{value}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{onChange}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>不要根据配置拼接模块路径并执行任意导入，也不要把组件名交给 <code>eval</code>。需要插件扩展时，应采用明确的插件清单、版本和权限，而不是让配置直接加载任意 URL。</p>
<p>组件 API 要有稳定契约：哪些属性是展示配置，哪些是用户输入，哪些事件是允许的，错误和 loading 如何表达。组件升级时，旧 Schema 要么由迁移脚本转换，要么由渲染器明确拒绝；默默把旧字段解释成新含义会产生难以追踪的页面差异。</p>
<h2>数据绑定和表达式是最高风险区域</h2>
<p>低代码平台常让配置引用 <code>form.email</code>、<code>data.items</code> 或条件表达式。安全做法是定义有限表达式语言或路径访问器，只允许读取白名单字段和有限运算；不要把配置字符串直接交给 <code>eval</code>、<code>new Function</code> 或模板编译器。</p>
<p>即使表达式不能执行 JavaScript，也要限制递归深度、循环次数、字符串长度和可访问对象。一个恶意配置可以通过巨大数组、深层路径或高成本正则耗尽主线程。表达式错误应显示可定位的配置路径，不能让整个应用只剩一个空白 loading。</p>
<p>数据源请求也要由受控连接器负责。配置不能任意指定内网 URL、请求头和长期凭据，否则平台可能变成 SSRF、数据越权或密钥泄漏入口。服务端必须根据当前用户和资源权限重新检查数据源，前端 Schema 不是授权凭据。</p>
<h2>事件动作需要能力白名单</h2>
<p>按钮动作可以是“提交表单”“刷新数据”或“打开面板”，但不能因为配置中出现一个字符串就执行任意代码。动作注册表应限制参数、目标和可组合范围；写操作还需要幂等、确认和错误恢复。</p>
<p>如果允许自定义脚本，应把它视为独立的代码执行功能。普通同源 Worker 只是线程与 DOM 访问边界，不是安全沙箱：它仍可能请求网络、访问同源数据或耗尽资源。不能仅把 eval 搬到 Worker 就宣称安全。独立 origin、受控消息协议和服务端隔离环境也需要分别设计权限、网络出口、资源限额与终止机制。iframe 不会自动成为安全沙箱，allow-scripts、allow-same-origin 和消息通信必须一起审查。</p>
<h2>Schema 版本和迁移要可追踪</h2>
<p>配置一旦保存，就会经历组件重命名、字段属性改变和数据结构升级。每份配置应包含版本，发布新渲染器时提供确定性的迁移函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">migrate</span>(<span class="hljs-params">schema</span>) {
  <span class="hljs-keyword">if</span> (!schema || <span class="hljs-keyword">typeof</span> schema !== <span class="hljs-string">&#x27;object&#x27;</span> || !<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(schema.<span class="hljs-property">fields</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;配置结构无效&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (schema.<span class="hljs-property">version</span> !== <span class="hljs-number">1</span> &amp;&amp; schema.<span class="hljs-property">version</span> !== <span class="hljs-number">2</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;不支持该配置版本&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (schema.<span class="hljs-property">version</span> === <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">return</span> {
      ...schema,
      <span class="hljs-attr">version</span>: <span class="hljs-number">2</span>,
      <span class="hljs-attr">fields</span>: schema.<span class="hljs-property">fields</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">field</span>) =&gt;</span> ({
        ...field,
        <span class="hljs-attr">inputType</span>: field.<span class="hljs-property">kind</span> === <span class="hljs-string">&#x27;email&#x27;</span> ? <span class="hljs-string">&#x27;email&#x27;</span> : field.<span class="hljs-property">inputType</span>,
      })),
    };
  }
  <span class="hljs-keyword">return</span> schema;
}
</code></pre></div>
<p>迁移函数应保持纯、可重复并有回归样例，不能在页面首次打开时偷偷修改数据库而没有备份。迁移失败时要保留原配置、显示错误并提供导出或回滚路径。版本号不是权限版本，发布配置仍需要审批和审计。</p>
<p>示例只展示版本分派，不是完整的 Schema 校验器。进入迁移前先按 v1 或 v2 的对应结构检查每个 field；迁移后再按 v2 验证组件名、属性与业务限制。未知的未来版本必须拒绝，不能原样返回给旧渲染器碰运气。当前返回的 v2 对象仍与输入共用引用，调用方应将配置当作只读数据。</p>
<h2>配置驱动不等于不需要测试</h2>
<p>除了 Schema 单元校验，还要测试组件注册、渲染状态、表达式边界、字段错误、权限拒绝、旧版本迁移、空数据和配置损坏。配置数量很大时，可以用属性测试生成合法和非法结构，检查渲染器不会崩溃或越权。</p>
<p>关键业务页面还需要端到端、视觉、键盘和读屏验收。一个 JSON 文件能成功解析，不代表用户能完成表单；一个配置能在开发环境渲染，也不代表发布时所有组件和数据连接器都存在。</p>
<p>低代码的正确目标是把重复的结构化工作变成受约束的产品能力，同时保留必要的代码扩展和人工审查。Schema、组件注册、表达式、数据连接和权限都清楚之后，平台才容易演进；否则只是把难维护的代码搬进一份更难调试的 JSON。</p>`};export{e as default};