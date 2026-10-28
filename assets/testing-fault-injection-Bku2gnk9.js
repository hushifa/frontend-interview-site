var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先确定故障发生在哪一层：接口（慢、5xx、4xx、格式错误）、网络（断开、超时）、静态资源（脚本、图片 404）、浏览器能力（存储已满、权限被拒）。</li>
<li>用 <code>page.route</code> 延迟或修改响应，<code>route.abort()</code> 模拟网络失败，<code>context.setOffline(true)</code> 模拟断网。</li>
<li>验证的不只是“出现错误提示”，还要检查用户能否重试、输入是否保留、重复提交是否被阻止。</li>
<li>发布新版本后旧页面请求的异步模块可能 404，这是前端特有的故障，要测试页面能提示刷新。</li>
<li>故障注入只在测试环境进行，生产环境做混沌实验需要严格的范围控制和随时停止的能力。</li>
</ul>
<h2>慢响应</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;慢请求显示加载状态，并能取消&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/report&#x27;</span>, <span class="hljs-title function_">async</span> (route) =&gt; {
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">3000</span>));
    <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">json</span>: { <span class="hljs-attr">rows</span>: [] } });
  });

  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/report&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>)).<span class="hljs-title function_">toHaveText</span>(<span class="hljs-string">&#x27;加载中&#x27;</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;取消&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>)).<span class="hljs-title function_">toHaveText</span>(<span class="hljs-string">&#x27;已取消&#x27;</span>);
});
</code></pre></div>
<h2>错误格式不符合预期</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/orders&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">route</span>) =&gt;</span>
  route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>, <span class="hljs-attr">contentType</span>: <span class="hljs-string">&#x27;text/html&#x27;</span>, <span class="hljs-attr">body</span>: <span class="hljs-string">&#x27;&lt;html&gt;网关错误&lt;/html&gt;&#x27;</span> }),
);
</code></pre></div>
<p>代理或 CDN 出问题时，接口可能返回 200 和一段 HTML。前端直接 <code>response.json()</code> 会抛出解析错误，页面要能处理这种情况，而不是白屏。</p>
<h2>资源加载失败</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/assets/*.js&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">route</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (route.<span class="hljs-title function_">request</span>().<span class="hljs-title function_">url</span>().<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;Settings&#x27;</span>)) <span class="hljs-keyword">return</span> route.<span class="hljs-title function_">abort</span>();
  <span class="hljs-keyword">return</span> route.<span class="hljs-title function_">continue</span>();
});
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/&#x27;</span>);
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;link&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;设置&#x27;</span> }).<span class="hljs-title function_">click</span>();
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;页面已更新，请刷新&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
</code></pre></div>
<p>模拟部署后旧版本的分块文件已被删除，懒加载路由失败的情况。</p>
<h2>浏览器能力</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">addInitScript</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title class_">Storage</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">setItem</span> = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMException</span>(<span class="hljs-string">&#x27;quota exceeded&#x27;</span>, <span class="hljs-string">&#x27;QuotaExceededError&#x27;</span>);
  };
});
</code></pre></div>
<p><code>localStorage</code> 写满或在隐私模式下不可用时，草稿保存功能应提示用户而不是让整个页面报错。</p>
<h2>检查恢复</h2>
<p>每个故障用例都要回答：</p>
<ul>
<li>用户看到了什么提示，是否说明了下一步怎么做？</li>
<li>故障消除后（例如第二次请求成功），页面是否回到正常状态？</li>
<li>有没有留下重复的数据、残留的加载状态或错误的缓存？</li>
</ul>
<p>接口模拟的基本用法见<a href="/questions/test-api-mocks/">《Playwright 接口模拟怎样覆盖成功和失败场景？》</a>。</p>
<p>本题的故障都在测试环境里注入。在生产环境做混沌实验是另一类工作，要限定影响的用户比例和时间窗口，并能随时停止。</p>
<h2>常见追问</h2>
<ul>
<li>和单元测试里模拟 <code>fetch</code> 失败有什么区别？单元测试验证某个函数的错误处理；浏览器里的故障注入还能发现加载状态、焦点、整页渲染和缓存层的问题。</li>
</ul>`};export{e as default};