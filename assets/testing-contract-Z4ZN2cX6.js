var e={answerHtml:`<h2>简答</h2>
<ul>
<li>前端单元测试里的 mock 是手写的，接口改了测试照样通过；契约测试用来发现这种前后端不一致。</li>
<li>以 OpenAPI 为准时：从规范生成 TypeScript 类型和模拟数据，后端在 CI 中验证实现符合规范。</li>
<li>消费者驱动契约（Pact）：前端测试记录“我发这个请求，期望收到这些字段”，生成契约文件，后端用它回放验证。</li>
<li>契约要包括错误情况：401、403、404、422 的状态码和错误体格式，前端的错误处理依赖它们。</li>
<li>删除字段、改类型、把可选改成必填是破坏性变更；只新增可选字段通常兼容。</li>
</ul>
<h2>用 OpenAPI 生成类型</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npx openapi-typescript ./openapi.yaml -o src/api/schema.d.ts
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { paths } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./schema&#x27;</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Order</span> =
  paths[<span class="hljs-string">&#x27;/orders/{id}&#x27;</span>][<span class="hljs-string">&#x27;get&#x27;</span>][<span class="hljs-string">&#x27;responses&#x27;</span>][<span class="hljs-string">&#x27;200&#x27;</span>][<span class="hljs-string">&#x27;content&#x27;</span>][<span class="hljs-string">&#x27;application/json&#x27;</span>];
</code></pre></div>
<p>规范一改，类型检查就会报出前端依赖了不存在的字段。类型只在编译期起作用，运行时收到的数据仍可能不符合，关键接口可以用 Zod 等库在边界处校验。</p>
<h2>消费者驱动契约</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> provider
  .<span class="hljs-title function_">given</span>(<span class="hljs-string">&#x27;订单 42 存在&#x27;</span>)
  .<span class="hljs-title function_">uponReceiving</span>(<span class="hljs-string">&#x27;获取订单详情&#x27;</span>)
  .<span class="hljs-title function_">withRequest</span>({ <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span>, <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/orders/42&#x27;</span> })
  .<span class="hljs-title function_">willRespondWith</span>({
    <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>,
    <span class="hljs-attr">body</span>: { <span class="hljs-attr">id</span>: <span class="hljs-number">42</span>, <span class="hljs-attr">total</span>: <span class="hljs-title function_">like</span>(<span class="hljs-number">99.5</span>), <span class="hljs-attr">status</span>: <span class="hljs-title function_">regex</span>(<span class="hljs-regexp">/paid|pending/</span>, <span class="hljs-string">&#x27;paid&#x27;</span>) },
  })
  .<span class="hljs-title function_">executeTest</span>(<span class="hljs-title function_">async</span> (mock) =&gt; {
    <span class="hljs-keyword">const</span> order = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getOrder</span>(mock.<span class="hljs-property">url</span>, <span class="hljs-number">42</span>);
    <span class="hljs-title function_">expect</span>(order.<span class="hljs-property">status</span>).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;paid&#x27;</span>);
  });
</code></pre></div>
<p><code>like</code> 只要求类型一致，<code>regex</code> 约束取值范围。契约里只出现前端使用的字段，后端新增字段不会导致失败，删除 <code>total</code> 才会。</p>
<h2>三种测试分别证明什么</h2>
<table><thead><tr><th>测试</th><th>证明</th><th>不能证明</th></tr></thead><tbody><tr><td>前端 mock 测试</td><td>前端按假设的数据正确工作</td><td>假设是否正确</td></tr><tr><td>契约测试</td><td>前后端对接口形状达成一致</td><td>业务逻辑是否正确</td></tr><tr><td>端到端测试</td><td>整条链路在某个环境下可用</td><td>能覆盖的组合很少</td></tr></tbody></table>
<h2>发布流程</h2>
<ul>
<li>后端发布前运行所有消费者的契约验证，失败就不能部署。</li>
<li>破坏性变更要先新增字段或新版本接口，等所有消费者迁移后再删除旧的。</li>
<li>移动端等无法强制升级的客户端，要保留旧契约更长时间。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>有 TypeScript 全栈（如 tRPC）还需要契约测试吗？前后端在同一仓库同时部署时，类型共享已经能发现大部分不一致；独立部署、有多个客户端或第三方消费者时，契约测试仍然有价值。</li>
</ul>`};export{e as default};