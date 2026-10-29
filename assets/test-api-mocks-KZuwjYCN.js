var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写端到端测试时，我们经常不想依赖真实后端，就用 <code>page.route</code> 把某个接口拦下来，自己决定它返回什么。拦截要在 <code>page.goto()</code> 或触发请求的操作之前注册，不然请求已经发出去了。</p>
<p>拦下来以后有四种处理：<code>fulfill</code> 直接返回一份自定义响应，不走网络；<code>abort</code> 让请求失败，模拟断网；<code>continue</code> 放它去真实网络；<code>fallback</code> 交给前面注册的另一个处理器。</p>
<p>同一个请求匹配多个处理器时，后注册的先执行。所以可以在 <code>beforeEach</code> 里放一个默认的成功响应，个别测试再注册一个失败响应把它盖掉。</p>
<p>要注意，服务端返回 500 和网络根本没通是两种情况，前端的提示通常也不一样，要分开测。另外 <code>page.route</code> 只管当前页面，<code>context.route</code> 还能管到弹出窗口；页面注册了 Service Worker 时请求可能绕过拦截，可以把 <code>serviceWorkers</code> 设成 <code>&#x27;block&#x27;</code>。</p>
</blockquote>
<h2>怎样分别测成功、服务端错误和断网</h2>
<p>下面三个测试共用一个默认的成功响应，后两个各自换成失败情况。</p>
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
<p>你可能会问，<code>beforeEach</code> 里已经注册过成功响应了，后面两个测试为什么还能拿到失败？因为同一个请求匹配多个处理器时，后注册的先执行。测试里新注册的处理器直接返回了结果，<code>beforeEach</code> 里那个就轮不到了。</p>
<p><code>status: 500</code> 和 <code>abort()</code> 的区别在于，前者是请求到了服务器、服务器说出错了，<code>fetch</code> 会正常拿到一个 <code>ok</code> 为 <code>false</code> 的响应；后者是请求根本没完成，<code>fetch</code> 会直接抛错。前端往往一个显示“重试”，一个显示“检查网络”，所以要各写一个用例。</p>
<h2>怎样检查前端发出去的请求对不对</h2>
<p>有时要验证的不是页面显示，而是前端提交的数据。这时监听请求本身：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;提交订单时发送正确的数据&#x27;</span>, <span class="hljs-title function_">async</span> ({ page }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/checkout&#x27;</span>);
  <span class="hljs-keyword">const</span> requestPromise = page.<span class="hljs-title function_">waitForRequest</span>(<span class="hljs-string">&#x27;**/api/orders&#x27;</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;提交&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">const</span> request = <span class="hljs-keyword">await</span> requestPromise;
  <span class="hljs-title function_">expect</span>(request.<span class="hljs-title function_">postDataJSON</span>()).<span class="hljs-title function_">toMatchObject</span>({ <span class="hljs-attr">productId</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">quantity</span>: <span class="hljs-number">2</span> });
});
</code></pre></div>
<p>注意 <code>waitForRequest</code> 写在点击之前。如果先点击再开始等，请求可能在监听开始前就已经发完了，测试就会一直等到超时。</p>
<h2>怎样在真实响应上只改一个字段</h2>
<p>如果只想改真实接口里的某个字段，可以先用 <code>route.fetch()</code> 把请求发出去，拿到真实响应，再改完返回：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/profile&#x27;</span>, <span class="hljs-title function_">async</span> (route) =&gt; {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fetch</span>();
  <span class="hljs-keyword">const</span> json = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({ response, <span class="hljs-attr">json</span>: { ...json, <span class="hljs-attr">vip</span>: <span class="hljs-literal">true</span> } });
});
</code></pre></div>
<p>这种写法依赖真实后端可用，适合在测试环境里看某个字段对界面的影响，比如把用户临时变成 VIP。</p>
<h2>处理器写错了会怎样</h2>
<p>每个处理器最后都必须调用 <code>fulfill</code>、<code>abort</code>、<code>continue</code>、<code>fallback</code> 中的一个。忘了调用，请求就一直挂着，页面也一直在加载。为了模拟慢响应而故意攒着的延迟 Promise，测试结束时也要放掉。</p>
<p><code>continue</code> 和 <code>fallback</code> 容易混。一个处理器发现这个请求不归自己管时，应该用 <code>fallback</code>，交给前面注册的默认模拟；用 <code>continue</code> 会直接去真实网络，把其他模拟都绕过去。两者都可以改写请求方法、请求体和部分请求头，但受限的请求头不能随便改，Cookie 要用上下文的 Cookie API 设置。</p>
<p>还有几条规则要记住。同一个请求同时匹配页面级和上下文级路由时，页面级优先。开启路由会禁用浏览器的 HTTP 缓存，所以这类测试不能用来判断真实的缓存行为。移除规则用 <code>page.unroute()</code> 或 <code>page.unrouteAll()</code>，后者的 <code>behavior</code> 选项决定要不要等正在执行的处理器：<code>&#x27;wait&#x27;</code> 等它们完成，<code>&#x27;ignoreErrors&#x27;</code> 不等并吞掉之后的错误，默认是不等。</p>
<h2>模拟数据有什么风险</h2>
<p>模拟数据是手写的，后端接口改了，测试照样通过。可以从 OpenAPI 生成模拟数据，或者用契约测试保证前后端一致，见<a href="/questions/testing-contract/">《前端契约测试应该验证什么？》</a>。也可以用 <code>routeFromHAR</code> 把录下来的真实流量当作模拟数据回放。</p>
<h2>常见追问</h2>
<p><strong>Playwright 的 route 和 MSW 有什么区别？</strong></p>
<blockquote>
<p>MSW 在应用内部拦截，浏览器里靠 Service Worker，Node 里靠拦截请求模块，所以同一套模拟能同时用在开发环境、单元测试和端到端测试里。Playwright 的 route 只能在 Playwright 测试里用，但它在浏览器层拦截，任何请求都能管到，包括第三方资源。</p>
</blockquote>`};export{e as default};