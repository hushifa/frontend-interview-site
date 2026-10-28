var e={answerHtml:`<h2>简答</h2>
<ul>
<li>拦截要在 <code>page.goto()</code> 或触发请求的操作之前注册，否则页面加载时的请求已经发出。</li>
<li><code>route.fulfill()</code> 返回自定义响应，不访问网络；<code>route.abort()</code> 让请求失败；<code>route.continue()</code> 直接发往网络；<code>route.fallback()</code> 交给前一个匹配的处理器。</li>
<li>多个处理器匹配同一请求时，后注册的先执行，所以测试里可以覆盖 <code>beforeEach</code> 中的默认模拟。</li>
<li>HTTP 错误（<code>status: 500</code>）和网络失败（<code>abort()</code>）是两种不同的情况，前端的处理通常也不同，要分别测试。</li>
<li><code>page.route</code> 只影响当前页面，<code>context.route</code> 还会作用于弹出窗口；页面注册了 Service Worker 时，请求可能绕过拦截，可以把 <code>serviceWorkers</code> 设为 <code>&#x27;block&#x27;</code>。</li>
</ul>
<h2>成功和失败</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { test, expect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;

test.<span class="hljs-title function_">beforeEach</span>(<span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/orders&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">route</span>) =&gt;</span>
    route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">json</span>: [{ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;键盘&#x27;</span> }] }),
  );
});

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;显示订单&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/orders&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;键盘&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
});

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;服务端错误时显示重试按钮&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/orders&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">route</span>) =&gt;</span>
    route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">status</span>: <span class="hljs-number">500</span>, <span class="hljs-attr">json</span>: { <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;internal error&#x27;</span> } }),
  );
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/orders&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;重试&#x27;</span> })).<span class="hljs-title function_">toBeVisible</span>();
});

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;断网时提示检查网络&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/orders&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">route</span>) =&gt;</span> route.<span class="hljs-title function_">abort</span>(<span class="hljs-string">&#x27;internetdisconnected&#x27;</span>));
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/orders&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;网络连接失败&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
});
</code></pre></div>
<p>第二、三个测试里新注册的处理器先于 <code>beforeEach</code> 中的执行，覆盖了默认的成功响应。</p>
<h2>检查请求本身</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;提交订单时发送正确的数据&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/checkout&#x27;</span>);
  <span class="hljs-keyword">const</span> requestPromise = page.<span class="hljs-title function_">waitForRequest</span>(<span class="hljs-string">&#x27;**/api/orders&#x27;</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;提交&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">const</span> request = <span class="hljs-keyword">await</span> requestPromise;
  <span class="hljs-title function_">expect</span>(request.<span class="hljs-title function_">postDataJSON</span>()).<span class="hljs-title function_">toMatchObject</span>({ <span class="hljs-attr">productId</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">quantity</span>: <span class="hljs-number">2</span> });
});
</code></pre></div>
<p><code>waitForRequest</code> 要在点击之前调用，避免请求在监听开始前就完成。</p>
<h2>修改真实响应</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/profile&#x27;</span>, <span class="hljs-title function_">async</span> (route) =&gt; {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fetch</span>();
  <span class="hljs-keyword">const</span> json = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({ response, <span class="hljs-attr">json</span>: { ...json, <span class="hljs-attr">vip</span>: <span class="hljs-literal">true</span> } });
});
</code></pre></div>
<p>这依赖真实后端可用，适合在测试环境里验证某个字段对界面的影响。</p>
<h2>处理链和清理</h2>
<ul>
<li>每个处理器都必须以 <code>fulfill</code>、<code>abort</code>、<code>continue</code> 或 <code>fallback</code> 之一结束；忘记调用时请求会一直挂起。为了模拟慢响应保存的延迟 Promise，也要在测试结束时释放。</li>
<li>某个处理器发现请求不归自己负责时用 <code>fallback</code>，交给前面注册的默认模拟；用 <code>continue</code> 会直接访问真实网络，绕过其他模拟。</li>
<li>同一请求同时匹配页面级和上下文级路由时，页面级路由优先。</li>
<li><code>continue</code> 和 <code>fallback</code> 可以改写方法、请求体和部分请求头，受限请求头不能随意改写；Cookie 用上下文的 Cookie API 设置。</li>
<li>开启路由会禁用浏览器 HTTP 缓存，所以这类测试不能用来判断真实的缓存行为。</li>
<li>用 <code>page.unroute()</code> 移除指定规则，<code>page.unrouteAll()</code> 移除全部；它的 <code>behavior</code> 选项决定是否等待正在执行的处理器：<code>&#x27;wait&#x27;</code> 等待完成，<code>&#x27;ignoreErrors&#x27;</code> 不等待并吞掉之后的错误，默认值不等待。</li>
</ul>
<h2>模拟的风险</h2>
<p>模拟数据是手写的，接口变了测试仍会通过。可以从 OpenAPI 生成模拟数据，或用契约测试保证前后端一致，见<a href="/questions/testing-contract/">《前端契约测试应该验证什么？》</a>。<code>routeFromHAR</code> 能把录制的真实流量作为模拟数据回放。</p>
<h2>常见追问</h2>
<ul>
<li>和 MSW 有什么区别？MSW 在应用内部通过 Service Worker 或 Node 拦截，同一套模拟可用于开发、单元测试和 E2E；Playwright 的 route 只在 Playwright 测试中可用，但可以拦截任何请求，包括第三方资源。</li>
</ul>`};export{e as default};