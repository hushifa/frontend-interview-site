var e={answerHtml:`<h2>简答</h2>
<ul>
<li>适合 mock：HTTP 请求、当前时间、随机数、浏览器 API（地理位置、剪贴板）、支付等第三方服务。</li>
<li>不适合 mock：被测模块内部的函数、纯计算逻辑、和被测代码一起交付的子组件。</li>
<li>mock 越多，测试越接近“复述实现”：重构后测试失败，真实 bug 却测不出来。</li>
<li><code>mockClear</code> 只清调用记录；<code>mockReset</code> 还清除自定义实现，<code>vi.fn()</code> 变成返回 <code>undefined</code>，<code>vi.fn(impl)</code> 和 <code>spyOn</code> 回到原实现；<code>mockRestore</code> 再把 <code>spyOn</code> 的对象恢复成原方法。</li>
<li>模拟数据要来自真实契约（OpenAPI 类型、录制的响应），否则接口改了测试仍会通过。</li>
</ul>
<h2>选择 mock 的边界</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// 被测函数</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadUser</span>(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>, fetcher = fetch</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetcher</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${id}</span>\`</span>);
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
  <span class="hljs-keyword">return</span> response.<span class="hljs-title function_">json</span>();
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { expect, test, vi } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;非 2xx 响应时抛错&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> fetcher = vi.<span class="hljs-title function_">fn</span>().<span class="hljs-title function_">mockResolvedValue</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-literal">null</span>, { <span class="hljs-attr">status</span>: <span class="hljs-number">404</span> }));
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">loadUser</span>(<span class="hljs-string">&#x27;1&#x27;</span>, fetcher)).<span class="hljs-property">rejects</span>.<span class="hljs-title function_">toThrow</span>(<span class="hljs-string">&#x27;HTTP 404&#x27;</span>);
  <span class="hljs-title function_">expect</span>(fetcher).<span class="hljs-title function_">toHaveBeenCalledWith</span>(<span class="hljs-string">&#x27;/api/users/1&#x27;</span>);
});
</code></pre></div>
<p>通过参数注入依赖，比用 <code>vi.mock</code> 替换整个模块更直接。模拟返回的是真实的 <code>Response</code> 对象，<code>ok</code> 和 <code>status</code> 的行为与浏览器一致。</p>
<h2>模块 mock</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts">vi.<span class="hljs-title function_">mock</span>(<span class="hljs-string">&#x27;./analytics&#x27;</span>, <span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">track</span>: vi.<span class="hljs-title function_">fn</span>() }));
</code></pre></div>
<p><code>vi.mock</code> 会被提升到文件顶部，在所有 import 之前执行。工厂里不能直接使用外部变量，需要时用 <code>vi.hoisted</code> 声明。</p>
<h2>清理</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// vitest.config.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">test</span>: {
    <span class="hljs-attr">restoreMocks</span>: <span class="hljs-literal">true</span>,
  },
});
</code></pre></div>
<p>开启 <code>restoreMocks</code> 后，每个测试前自动调用 <code>mockRestore</code>，避免一个测试设置的返回值或替换的全局方法影响下一个测试。修改了 <code>globalThis</code>、<code>Date</code> 或环境变量时，用 <code>vi.stubGlobal</code>、<code>vi.stubEnv</code> 并配合 <code>unstubGlobals</code>、<code>unstubEnvs</code>。</p>
<h2>用 MSW 模拟网络层</h2>
<p>组件内部直接调用 <code>fetch</code> 时，可以用 MSW 在网络层拦截，组件代码不用改，同一套处理器还能用于开发环境和浏览器测试：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { http, <span class="hljs-title class_">HttpResponse</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;msw&#x27;</span>;
<span class="hljs-keyword">import</span> { setupServer } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;msw/node&#x27;</span>;

<span class="hljs-keyword">const</span> server = <span class="hljs-title function_">setupServer</span>(
  http.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;/api/users/:id&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">{ params }</span>) =&gt;</span>
    <span class="hljs-title class_">HttpResponse</span>.<span class="hljs-title function_">json</span>({ <span class="hljs-attr">id</span>: params.<span class="hljs-property">id</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;张三&#x27;</span> }),
  ),
);
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>怎样判断 mock 过多？如果改了一个内部函数名，要同时改很多测试的 mock，或者测试里的 mock 设置比断言还长，就说明边界选得太靠里了。</li>
</ul>`};export{e as default};