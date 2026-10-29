var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>端到端测试不稳定，就是同一份代码有时过有时不过。最常见的原因是测试在页面还没准备好时就去读或去点。Playwright 在操作前会自动等元素可见、稳定、能接收事件，<code>expect(locator).toBeVisible()</code> 这类断言也会一直重试到超时，所以不要自己写 <code>waitForTimeout(1000)</code>。</p>
<p>找元素优先用 <code>getByRole</code>、<code>getByLabel</code>、<code>getByText</code>，少用依赖 DOM 结构的 CSS 和 XPath，页面结构一调整它们就失效。</p>
<p>测试之间也要隔离。每个测试本来就有独立的浏览器上下文，Cookie 和存储互不影响；可是后端数据要自己隔离，比如每个测试创建自己的订单。等弹窗、下载、请求时，要先创建等待的 Promise 再点击。</p>
<p>真失败了，开启 <code>trace: &#x27;on-first-retry&#x27;</code> 去看每一步的截图、DOM 和网络。<code>retries</code> 只能把不稳定暴露出来，不能修好它。</p>
</blockquote>
<h2>为什么读一次文本的断言会时好时坏</h2>
<p>先看两种写法：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 不稳定：只读取一次</span>
<span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>).<span class="hljs-title function_">textContent</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;已保存&#x27;</span>);

<span class="hljs-comment">// 稳定：自动重试直到满足或超时</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>)).<span class="hljs-title function_">toHaveText</span>(<span class="hljs-string">&#x27;已保存&#x27;</span>);
</code></pre></div>
<p>第一种写法在本地经常能过，到 CI 上就偶尔失败。原因是 <code>textContent()</code> 只读一次。保存请求如果慢了一点，读的时候文字还是“保存中”，断言就挂了。</p>
<p>第二种写法把定位器直接交给 <code>expect</code>，Playwright 会反复检查，直到文字变成“已保存”或者超时。这种会自己重试的断言叫 web-first 断言。改法就是把“先取值再比较”换成“把定位器交给断言”。</p>
<h2>为什么要先等待再点击</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> downloadPromise = page.<span class="hljs-title function_">waitForEvent</span>(<span class="hljs-string">&#x27;download&#x27;</span>);
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;导出&#x27;</span> }).<span class="hljs-title function_">click</span>();
<span class="hljs-keyword">const</span> download = <span class="hljs-keyword">await</span> downloadPromise;
<span class="hljs-title function_">expect</span>(download.<span class="hljs-title function_">suggestedFilename</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;orders.csv&#x27;</span>);
</code></pre></div>
<p>如果反过来，先点击再调用 <code>waitForEvent</code>，下载事件可能在点击的那一刻就触发了，等监听开始时事件早就过去，测试只能等到超时。所以先创建等待的 Promise，再做触发它的操作，最后 <code>await</code> 它。</p>
<h2>怎样让测试数据互不干扰</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;删除订单&#x27;</span>, <span class="hljs-title function_">async</span> ({ page, request }) =&gt; {
  <span class="hljs-keyword">const</span> created = <span class="hljs-keyword">await</span> request.<span class="hljs-title function_">post</span>(<span class="hljs-string">&#x27;/api/test/orders&#x27;</span>, {
    <span class="hljs-attr">data</span>: { <span class="hljs-attr">title</span>: <span class="hljs-string">\`测试订单-<span class="hljs-subst">\${test.info().testId}</span>\`</span> },
  });
  <span class="hljs-keyword">const</span> { id } = <span class="hljs-keyword">await</span> created.<span class="hljs-title function_">json</span>();

  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">\`/orders/<span class="hljs-subst">\${id}</span>\`</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;删除&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;订单已删除&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
});
</code></pre></div>
<p>这个测试自己通过 API 创建一条订单，再去删除它。通过 API 准备数据比在界面上点一遍快，也不会被别的页面的问题拖累。并行运行时，如果两个测试共用同一条订单，一个删了，另一个就找不到，所以每个测试都用自己的数据。</p>
<h2>登录状态怎样复用</h2>
<p>每个测试都走一遍登录很慢。常见做法是在一个 setup 项目里登录一次，用 <code>storageState</code> 把 Cookie 和本地存储保存下来，其他测试直接加载。会修改账号设置的测试要用单独的账号，避免影响别人，见<a href="/questions/testing-playwright-fixtures/">《Playwright fixtures 解决了什么测试维护问题？》</a>。</p>
<h2>常见的不稳定现象怎么查</h2>
<table><thead><tr><th>现象</th><th>原因</th><th>处理</th></tr></thead><tbody><tr><td>偶尔点不到按钮</td><td>动画或遮罩还在</td><td>等遮罩消失的断言，或在测试环境关闭动画</td></tr><tr><td>列表数量不对</td><td>数据来自其他并行测试</td><td>每个测试用自己的数据</td></tr><tr><td>本地通过，CI 失败</td><td>时区、语言、视口不同</td><td>在配置中固定 <code>timezoneId</code>、<code>locale</code>、<code>viewport</code></td></tr><tr><td>依赖第三方服务</td><td>外部不稳定</td><td>用 <code>page.route</code> 模拟第三方</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>发现一个不稳定的测试，怎么处理？</strong></p>
<blockquote>
<p>先用 <code>--repeat-each</code> 在本地多跑几遍把问题复现出来，再看 trace 找原因。确实暂时修不了，就用 <code>test.fixme</code> 标记并写明原因，而不是一直靠重试让它通过。</p>
</blockquote>`};export{e as default};