var e={answerHtml:`<h2>简答</h2>
<ul>
<li>操作前 Playwright 会自动等待元素可见、稳定、可接收事件；<code>expect(locator).toBeVisible()</code> 这类断言会重试直到超时。不要写 <code>waitForTimeout(1000)</code>。</li>
<li>定位器优先 <code>getByRole</code>、<code>getByLabel</code>、<code>getByText</code>，少用依赖 DOM 结构的 CSS 和 XPath。</li>
<li>每个测试有独立的浏览器上下文（Cookie、存储互不影响），但后端数据要自己隔离，例如每个测试创建自己的用户或订单。</li>
<li>等待弹窗、下载、请求时，先创建等待的 Promise，再执行点击，否则事件可能在开始监听前就发生了。</li>
<li>开启 <code>trace: &#x27;on-first-retry&#x27;</code>，失败时查看每一步的截图、DOM 和网络；<code>retries</code> 只能暴露不稳定，不能修复它。</li>
</ul>
<h2>断言要会重试</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 不稳定：只读取一次</span>
<span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>).<span class="hljs-title function_">textContent</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;已保存&#x27;</span>);

<span class="hljs-comment">// 稳定：自动重试直到满足或超时</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>)).<span class="hljs-title function_">toHaveText</span>(<span class="hljs-string">&#x27;已保存&#x27;</span>);
</code></pre></div>
<h2>事件等待的顺序</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> downloadPromise = page.<span class="hljs-title function_">waitForEvent</span>(<span class="hljs-string">&#x27;download&#x27;</span>);
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;导出&#x27;</span> }).<span class="hljs-title function_">click</span>();
<span class="hljs-keyword">const</span> download = <span class="hljs-keyword">await</span> downloadPromise;
<span class="hljs-title function_">expect</span>(download.<span class="hljs-title function_">suggestedFilename</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;orders.csv&#x27;</span>);
</code></pre></div>
<h2>数据隔离</h2>
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
<p>测试通过 API 准备数据比通过界面点击更快，也不会受其他界面的问题影响。并行运行时，不同测试不要共用同一条数据。</p>
<h2>登录状态复用</h2>
<p>在 setup 项目里登录一次，用 <code>storageState</code> 保存 Cookie 和本地存储，其他测试直接加载。会修改账号设置的测试应使用单独的账号，见《Playwright fixtures 解决了什么测试维护问题？》。</p>
<h2>常见不稳定原因</h2>
<table><thead><tr><th>现象</th><th>原因</th><th>处理</th></tr></thead><tbody><tr><td>偶尔点不到按钮</td><td>动画或遮罩还在</td><td>等遮罩消失的断言，或在测试环境关闭动画</td></tr><tr><td>列表数量不对</td><td>数据来自其他并行测试</td><td>每个测试用自己的数据</td></tr><tr><td>本地通过，CI 失败</td><td>时区、语言、视口不同</td><td>在配置中固定 <code>timezoneId</code>、<code>locale</code>、<code>viewport</code></td></tr><tr><td>依赖第三方服务</td><td>外部不稳定</td><td>用 <code>page.route</code> 模拟第三方</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>不稳定的测试怎么处理？先用 <code>--repeat-each</code> 在本地复现，再查 trace。确实暂时无法修复时，用 <code>test.fixme</code> 标记并记录原因，而不是一直靠重试通过。</li>
</ul>`};export{e as default};