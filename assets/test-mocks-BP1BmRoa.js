var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>mock 就是在测试里用一个假的东西替换真实依赖。适合替换的是那些慢、不稳定、结果不受控的外部边界，比如 HTTP 请求、当前时间、随机数、地理位置和剪贴板这类浏览器 API，还有支付等第三方服务。</p>
<p>不适合替换的是被测模块内部的函数、纯计算逻辑、和被测代码一起交付的子组件。这些一旦 mock 掉，测试就变成在“复述实现”：重构一下测试就挂，真正的 bug 却测不出来。</p>
<p>mock 用完要清理。<code>mockClear</code> 只清调用记录；<code>mockReset</code> 还会清掉自定义实现，<code>vi.fn()</code> 会变成返回 <code>undefined</code>，<code>vi.fn(impl)</code> 和 <code>spyOn</code> 回到原来的实现；<code>mockRestore</code> 再把 <code>spyOn</code> 监视的对象恢复成原方法。</p>
<p>还要注意，模拟数据要来自真实契约，比如 OpenAPI 类型或录下来的响应。不然后端接口改了，测试还在通过。</p>
</blockquote>
<h2>mock 的边界应该放在哪里</h2>
<p>下面的函数把 <code>fetch</code> 作为参数传进来，测试时就能换成假的：</p>
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
<p>这里只替换了网络这一层，<code>loadUser</code> 自己判断状态码、抛错的逻辑都是真实运行的。通过参数把依赖传进来，这种做法叫依赖注入，它比用 <code>vi.mock</code> 换掉整个模块更直接。而且假 <code>fetcher</code> 返回的是一个真正的 <code>Response</code> 对象，<code>ok</code> 和 <code>status</code> 的行为和浏览器一致：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-literal">null</span>, { <span class="hljs-attr">status</span>: <span class="hljs-number">404</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(response.<span class="hljs-property">ok</span>, response.<span class="hljs-property">status</span>); <span class="hljs-comment">// false 404</span>
</code></pre></div>
<h2>vi.mock 为什么不能直接用外面的变量</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts">vi.<span class="hljs-title function_">mock</span>(<span class="hljs-string">&#x27;./analytics&#x27;</span>, <span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">track</span>: vi.<span class="hljs-title function_">fn</span>() }));
</code></pre></div>
<p><code>vi.mock</code> 会被提升到文件顶部，在所有 import 之前执行。这时文件里其他变量还没定义，所以工厂函数里不能直接用外部变量。确实需要时，用 <code>vi.hoisted</code> 声明，它会跟着一起被提升。</p>
<h2>怎样在每个测试后自动清理</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// vitest.config.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">test</span>: {
    <span class="hljs-attr">clearMocks</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">restoreMocks</span>: <span class="hljs-literal">true</span>,
  },
});
</code></pre></div>
<p>这两个选项容易被误解。<code>clearMocks</code> 在每个测试前清掉调用记录。<code>restoreMocks</code> 只把 <code>vi.spyOn</code> 创建的 spy 恢复成原方法，不会重置 <code>vi.fn()</code>。如果连 <code>vi.fn()</code> 上的自定义实现也要清掉，改用 <code>mockReset: true</code>。</p>
<p>改了 <code>globalThis</code>、<code>Date</code> 或环境变量时，用 <code>vi.stubGlobal</code>、<code>vi.stubEnv</code> 去改，再配合 <code>unstubGlobals</code>、<code>unstubEnvs</code> 自动还原，不然上一个测试的修改会漏到下一个测试里。</p>
<h2>组件里直接调用 fetch 怎么办</h2>
<p>如果组件内部直接写了 <code>fetch</code>，没法通过参数替换，可以用 MSW 在网络层拦截。组件代码不用改，同一套处理器还能用在开发环境和浏览器测试里：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { http, <span class="hljs-title class_">HttpResponse</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;msw&#x27;</span>;
<span class="hljs-keyword">import</span> { setupServer } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;msw/node&#x27;</span>;

<span class="hljs-keyword">const</span> server = <span class="hljs-title function_">setupServer</span>(
  http.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;/api/users/:id&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">{ params }</span>) =&gt;</span>
    <span class="hljs-title class_">HttpResponse</span>.<span class="hljs-title function_">json</span>({ <span class="hljs-attr">id</span>: params.<span class="hljs-property">id</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;张三&#x27;</span> }),
  ),
);
</code></pre></div>
<h2>常见追问</h2>
<p><strong>怎样判断 mock 是不是太多了？</strong></p>
<blockquote>
<p>看两个信号。一是改了一个内部函数的名字，就要同时改很多测试里的 mock；二是测试里设置 mock 的代码比断言还长。出现这两种情况，说明 mock 的边界选得太靠里了，应该退到网络、时间这些外部边界上。</p>
</blockquote>`};export{e as default};