var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如商品详情页要显示商品信息、商家名称和前三条评论。用 REST，一般要请求 <code>/products/1</code>、<code>/shops/8</code>、<code>/products/1/reviews</code> 三个接口，每个接口返回什么字段由后端定，常常多给一堆用不上的字段。用 GraphQL，前端写一个查询，把这三样东西和需要的字段都列出来，发到同一个 <code>/graphql</code> 地址，一次拿回来，字段不多不少。</p>
<p>能这样做是因为 GraphQL 的服务端先用类型系统描述了所有数据：有哪些类型、每个类型有哪些字段、字段之间怎么关联。客户端的查询会先按这套类型校验，再执行。客户端只拿自己写的字段，服务端加字段不影响老查询，所以官方倾向于不做版本号，而是持续演进 schema，旧字段用 <code>@deprecated</code> 标记为废弃。</p>
<p>前端使用时，通常用 POST 把 <code>query</code> 和 <code>variables</code> 放进 JSON 请求体发过去。要注意，响应里只要 <code>data</code> 不为 <code>null</code>，服务端就应该返回 2xx，即使 <code>errors</code> 里有错误，因为 HTTP 没有“部分成功”这个状态码。所以不能只看 <code>response.ok</code>，还要检查 <code>errors</code>。</p>
<p>代价也要讲清楚。所有请求都打到一个 URL，REST 那种按 URL 做的 HTTP 缓存和 CDN 缓存就不好用了，客户端要靠对象的 <code>id</code> 自己做缓存；服务端要处理 N+1 查询，还要限制查询深度和复杂度，防止一个查询把服务器拖垮。</p>
</blockquote>
<h2>同一个页面，两种写法</h2>
<p>先看 REST。商品详情页需要三份数据，就要发三个请求，每份数据都是后端定好的形状：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">GET /products/1          → { id, name, price, description, stock, ... }
GET /shops/8             → { id, name, address, phone, ... }
GET /products/1/reviews  → [{ id, content, rating, user, createdAt, ... }, ...]
</code></pre></div>
<p>如果第二个请求的商家 ID 要从第一个请求的结果里拿，还得等第一个回来再发，页面就多了一轮等待。</p>
<p>GraphQL 把这三份数据写进一个查询里，关联关系在查询里直接表达：</p>
<div class="not-prose code-block"><div class="code-language">graphql</div><pre><code class="hljs language-graphql">query ProductPage($id: ID!) {
  product(id: $id) {
    name
    price
    shop {
      name
    }
    reviews(first: 3) {
      content
      rating
    }
  }
}
</code></pre></div>
<p>服务端按查询的形状返回 JSON，<code>data.product.shop.name</code> 就是商家名称，没写的字段不会出现在响应里。商家和评论跟着商品一起返回，前端不用再等第一个请求回来才发第二个。</p>
<h2>为什么只有一个 URL</h2>
<p>REST 用 URL 标识资源，<code>/products/1</code> 和 <code>/shops/8</code> 是两个不同的东西。GraphQL 不用 URL 标识实体，官方文档说一个 GraphQL 服务只在一个端点上工作，通常是 <code>/graphql</code>，所有请求都发到这里，要什么数据由查询内容决定。</p>
<p>HTTP 方法上，官方规定服务端必须支持 POST，可以选择支持 GET，但 GET 只能用于查询（query），变更（mutation）必须用 POST。POST 请求的 <code>Content-Type</code> 应该是 <code>application/json</code>，<code>Accept</code> 里应该带上 <code>application/graphql-response+json</code>。</p>
<h2>前端怎样发请求、怎样判断出错</h2>
<p>不用任何库，<code>fetch</code> 就能发 GraphQL 请求：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/graphql&#x27;</span>, {
  <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
  <span class="hljs-attr">headers</span>: {
    <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span>,
    <span class="hljs-title class_">Accept</span>: <span class="hljs-string">&#x27;application/graphql-response+json, application/json&#x27;</span>,
  },
  <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">query</span>: <span class="hljs-variable constant_">PRODUCT_QUERY</span>, <span class="hljs-attr">variables</span>: { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;1&#x27;</span> } }),
});
<span class="hljs-keyword">const</span> body = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>();
</code></pre></div>
<p><code>variables</code> 单独传，不要把用户输入拼进查询字符串里，这和 SQL 参数化是一个道理。</p>
<p>拿到响应以后怎样判断成功？官方文档的说法是：响应里至少有 <code>data</code> 或 <code>errors</code> 之一；语法、校验这类请求错误发生在执行之前，不会有 <code>data</code>；某个字段的解析出错时，其他字段照样执行，<code>data</code> 和 <code>errors</code> 同时出现，这叫部分响应。下面把这几种情况分开处理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readGraphQL</span>(<span class="hljs-params">status, body</span>) {
  <span class="hljs-keyword">if</span> (!body.<span class="hljs-property">data</span>) {
    <span class="hljs-comment">// 请求错误：语法或校验失败，没有执行，通常是 4xx</span>
    <span class="hljs-keyword">return</span> <span class="hljs-string">\`失败(<span class="hljs-subst">\${status}</span>)：<span class="hljs-subst">\${body.errors.map((e) =&gt; e.message).join(<span class="hljs-string">&#x27;; &#x27;</span>)}</span>\`</span>;
  }
  <span class="hljs-keyword">if</span> (body.<span class="hljs-property">errors</span>) {
    <span class="hljs-comment">// 部分响应：data 不为 null，状态码仍是 2xx</span>
    <span class="hljs-keyword">const</span> paths = body.<span class="hljs-property">errors</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> e.<span class="hljs-property">path</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;.&#x27;</span>));
    <span class="hljs-keyword">return</span> <span class="hljs-string">\`部分成功(<span class="hljs-subst">\${status}</span>)，出错字段：<span class="hljs-subst">\${paths.join(<span class="hljs-string">&#x27;, &#x27;</span>)}</span>\`</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`成功(<span class="hljs-subst">\${status}</span>)\`</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readGraphQL</span>(<span class="hljs-number">200</span>, { <span class="hljs-attr">data</span>: { <span class="hljs-attr">product</span>: { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;键盘&#x27;</span> } } }));
<span class="hljs-comment">// 成功(200)</span>
<span class="hljs-keyword">const</span> partial = {
  <span class="hljs-attr">data</span>: { <span class="hljs-attr">product</span>: { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;键盘&#x27;</span>, <span class="hljs-attr">reviews</span>: <span class="hljs-literal">null</span> } },
  <span class="hljs-attr">errors</span>: [{ <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;评论服务超时&#x27;</span>, <span class="hljs-attr">path</span>: [<span class="hljs-string">&#x27;product&#x27;</span>, <span class="hljs-string">&#x27;reviews&#x27;</span>] }],
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readGraphQL</span>(<span class="hljs-number">200</span>, partial));
<span class="hljs-comment">// 部分成功(200)，出错字段：product.reviews</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readGraphQL</span>(<span class="hljs-number">400</span>, { <span class="hljs-attr">errors</span>: [{ <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;Cannot query field &quot;prise&quot; on type &quot;Product&quot;.&#x27;</span> }] }));
<span class="hljs-comment">// 失败(400)：Cannot query field &quot;prise&quot; on type &quot;Product&quot;.</span>
</code></pre></div>
<p>第二种情况状态码是 200，如果只判断 <code>res.ok</code>，就会把评论缺失当成正常数据。为什么服务端不返回 5xx？官方文档解释，只要 <code>data</code> 不为 <code>null</code>，就应该返回 2xx，因为 HTTP 还没有表示“部分成功”的状态码。<code>errors</code> 里的 <code>path</code> 指出是哪个字段出了错，页面可以只让评论区显示错误，商品信息照常展示。</p>
<p>第三种是校验错误，字段名写错了，查询根本没有执行，所以没有 <code>data</code>。官方文档说这类错误服务端通常返回 400；响应类型是 <code>application/graphql-response+json</code> 时，合法的请求执行失败会返回 4xx 或 5xx，而一些用 <code>application/json</code> 的老服务端可能一律返回 2xx。所以前端的判断要以 <code>data</code> 和 <code>errors</code> 为准，状态码作为辅助。</p>
<p>实际项目里一般会用 Apollo Client、urql 这类客户端库，它们把请求、缓存和错误处理都封装好了，但判断逻辑和上面一样。</p>
<h2>缓存为什么比 REST 麻烦</h2>
<p>REST 的 URL 本身就是全局唯一的标识，浏览器和 CDN 可以直接按 URL 缓存。GraphQL 的请求都是 POST 到同一个地址，这条路走不通。官方的建议是给每个对象一个全局唯一的 <code>id</code> 字段，客户端库按“类型 + id”把对象拆开存成一张表，同一个商品出现在两个查询里，更新一次两处都会变。</p>
<p>也可以让查询走 GET，利用 HTTP 缓存和 CDN。但复杂查询很长，可能超过浏览器和 CDN 对 URL 长度的限制。官方提到的常见做法是持久化查询：服务端预先存好查询文档，客户端只发一个短的标识。</p>
<h2>服务端要多处理什么</h2>
<p>N+1 问题是 GraphQL 最常被问的性能问题。查 10 个商品，每个商品再查自己的商家，如果每个字段各查各的，就是 1 次查商品加 10 次查商家。官方文档提到的解决办法是用 Facebook 的 DataLoader 这类工具，把一小段时间里收集到的请求合并成一次批量查询。</p>
<p>另外，客户端能自由组合查询，也就能写出嵌套很深、很贵的查询。官方的安全文档列了几种手段：限制查询深度、限制广度和批量数量、限流、分析查询复杂度，以及只允许执行预先登记过的查询（trusted documents）。</p>
<h2>常见追问</h2>
<p><strong>GraphQL 一定比 REST 好吗？</strong></p>
<blockquote>
<p>不一定。数据关系复杂、多个端（Web、App）各要不同字段时，GraphQL 的好处明显。接口简单、主要是增删改查，或者很依赖 HTTP 缓存和 CDN 的场景，REST 更直接。GraphQL 还要求服务端维护 schema、处理 N+1 和查询复杂度，团队成本更高。</p>
</blockquote>
<p><strong>GraphQL 的权限控制放在哪里？</strong></p>
<blockquote>
<p>官方建议身份认证在 GraphQL 校验请求之前完成，比如放在 HTTP 中间件里；授权放在业务逻辑里，在执行查询时判断当前用户能不能看。前端隐藏某个字段不等于做了权限控制。</p>
</blockquote>
<p><strong>为什么 GraphQL 不用版本号？</strong></p>
<blockquote>
<p>因为客户端只拿自己写的字段，服务端新增字段不会影响老查询。要替换一个字段时，先加新字段，再给旧字段加上 <code>@deprecated(reason: &quot;...&quot;)</code>，客户端工具会提示开发者改用新字段。官方把这称为 schema 的持续演进，而不是发布 v2、v3。</p>
</blockquote>`};export{e as default};