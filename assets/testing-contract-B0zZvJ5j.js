var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端单元测试里的接口数据是手写的 mock。后端把字段改了名，前端测试照样通过，上线才发现页面坏了。契约测试就是用来发现这种前后端不一致的。</p>
<p>常见有两种做法。一种以 OpenAPI 规范为准，前端从规范生成 TypeScript 类型和模拟数据，后端在 CI 里验证实现符合规范。另一种是消费者驱动契约，比如 Pact：前端测试记下“我发这个请求，期望收到这些字段”，生成契约文件，后端拿它回放验证。</p>
<p>契约不能只写成功的情况。401、403、404、422 这些状态码和错误体的格式也要写进去，因为前端的错误处理依赖它们。</p>
<p>判断一个改动会不会破坏旧前端，要分方向看。删字段、改类型肯定是破坏性的；请求字段从可选改成必填、响应字段从必填改成可选，同样会破坏旧消费者。</p>
</blockquote>
<h2>用 OpenAPI 生成类型</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npx openapi-typescript ./openapi.yaml -o src/api/schema.d.ts
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { paths } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./schema&#x27;</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Order</span> =
  paths[<span class="hljs-string">&#x27;/orders/{id}&#x27;</span>][<span class="hljs-string">&#x27;get&#x27;</span>][<span class="hljs-string">&#x27;responses&#x27;</span>][<span class="hljs-string">&#x27;200&#x27;</span>][<span class="hljs-string">&#x27;content&#x27;</span>][<span class="hljs-string">&#x27;application/json&#x27;</span>];
</code></pre></div>
<p>这样前端用到的 <code>Order</code> 类型直接来自规范。规范一改，类型检查就会报出前端用了不存在的字段。</p>
<p>可是类型只在编译时起作用。运行时真正收到的数据仍可能不符合规范，比如后端实现和规范不一致。关键接口可以再用 Zod 这类库在数据进入前端时校验一遍。</p>
<h2>消费者驱动契约怎样写</h2>
<p>“消费者”指调用接口的一方，这里就是前端。消费者驱动的意思是，由前端写下自己依赖什么，后端保证不破坏它。</p>
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
<p><code>like</code> 只要求类型一致，不要求值也是 99.5；<code>regex</code> 约束取值必须是 <code>paid</code> 或 <code>pending</code>。契约里只出现前端用到的字段，所以后端新增字段不会让验证失败，删掉 <code>total</code> 才会。</p>
<h2>三种测试分别证明什么</h2>
<table><thead><tr><th>测试</th><th>证明</th><th>不能证明</th></tr></thead><tbody><tr><td>前端 mock 测试</td><td>前端按假设的数据正确工作</td><td>假设是否正确</td></tr><tr><td>契约测试</td><td>前后端对接口形状达成一致</td><td>业务逻辑是否正确</td></tr><tr><td>端到端测试</td><td>整条链路在某个环境下可用</td><td>能覆盖的组合很少</td></tr></tbody></table>
<h2>契约测试怎样放进发布流程</h2>
<p>后端发布前要跑一遍所有消费者的契约验证，失败就不能部署。</p>
<p>真要做破坏性变更，就先加新字段或者新版本的接口，等所有消费者都迁移完，再删旧的。</p>
<p>判断是否兼容时，请求和响应的方向要分开看。请求字段改成必填，没传它的旧客户端会被拒绝；响应字段改成可选，依赖它一定存在的旧客户端会出错。反过来，响应里新增字段、请求里新增可选字段，通常是兼容的。</p>
<p>移动端这类没法强制升级的客户端，旧版本会在线很久，旧契约也要保留更长时间。</p>
<h2>常见追问</h2>
<p><strong>用了 TypeScript 全栈（比如 tRPC），还需要契约测试吗？</strong></p>
<blockquote>
<p>前后端在同一个仓库、同时部署时，共享类型已经能发现大部分不一致。如果前后端独立部署、有多个客户端或第三方消费者，契约测试仍然有价值。</p>
</blockquote>`};export{e as default};