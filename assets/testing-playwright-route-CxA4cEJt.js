var e={answerHtml:`<p>一个简单测试可能只有一条 route，但实际项目常同时配置公共 API 默认响应、当前场景特殊错误，以及第三方请求隔离。如果不理解处理链，某条“继续请求”就可能绕过其他 Mock，让测试意外访问真实网络。</p>
<p>route 的关键不是能否拦截，而是请求匹配后最终由谁处理，以及处理器的作用域是否符合测试目标。</p>
<h3>四种结束方式有不同含义</h3>
<table><thead><tr><th>方法</th><th>主要行为</th></tr></thead><tbody><tr><td>fulfill</td><td>直接提供响应，可以是受控 JSON、文本或文件</td></tr><tr><td>abort</td><td>让请求失败，用于网络类错误场景</td></tr><tr><td>continue</td><td>发送到网络，不再交给其他匹配处理器</td></tr><tr><td>fallback</td><td>交给下一条匹配处理器；没有其他处理器时才继续网络</td></tr></tbody></table>
<p>continue 与 fallback 最容易混淆。某个处理器发现“这不是我负责的方法”，若希望公共兜底继续处理，应使用 fallback，而不是 continue。</p>
<h3>后注册的匹配处理器先运行</h3>
<p>下面假设已在测试中取得 page 和配置 baseURL，演示同一个端点的默认响应与特殊分支：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> endpoint = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;/api/items&#x27;</span>, baseURL).<span class="hljs-property">href</span>;

<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(endpoint, <span class="hljs-title function_">async</span> (route) =&gt; {
  <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>, <span class="hljs-attr">json</span>: { <span class="hljs-attr">items</span>: [] } });
});

<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(endpoint, <span class="hljs-title function_">async</span> (route) =&gt; {
  <span class="hljs-keyword">if</span> (route.<span class="hljs-title function_">request</span>().<span class="hljs-title function_">method</span>() === <span class="hljs-string">&#x27;POST&#x27;</span>) {
    <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">status</span>: <span class="hljs-number">403</span>, <span class="hljs-attr">json</span>: { <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;禁止创建&#x27;</span> } });
    <span class="hljs-keyword">return</span>;
  }
  <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fallback</span>();
});
</code></pre></div>
<p>POST 由后注册的处理器返回 403；GET 先进入后注册处理器，再 fallback 给前面的默认响应。若把 fallback 换成 continue，GET 会直接发到网络，前面的 Mock 不再执行。</p>
<p>这是链路示意，不表示所有方法都应默认成功。正式测试应对意外方法明确失败，并在发起请求前完成注册。过宽的默认响应会掩盖错误路径，因此匹配条件应尽量表达真实接口边界。</p>
<h3>修改请求不等于伪造所有浏览器状态</h3>
<p>continue 和 fallback 可以覆盖部分请求属性，例如方法、请求体和允许修改的头，但受限头不能随意重写。Cookie 等状态应通过浏览器上下文的 Cookie API 正确设置，而不是期待覆盖请求头绕过所有规则。</p>
<p>如果使用 route.fetch 获取上游响应再修改，真实上游仍被调用。它适合保留真实内容的大部分语义，但不再具备完全离线、完全稳定的模拟性质。</p>
<p>请求变更也应检查重定向和认证处理。测试若只把状态码改成 200，却保留不匹配的内容类型或错误主体，可能构造出实际服务不会返回的结果。</p>
<h3>page 与 context 的边界要明确</h3>
<p>page.route 作用于对应页面，browserContext.route 可以覆盖上下文中的多个页面。对弹窗的首次请求，通常需要提前在 context 层安装处理器，而不是等 popup 对象出现后再追赶已经开始的导航。</p>
<p>页面级与上下文级路由同时匹配时，页面级规则有优先权。多个 fixture 都注册路由时，应把规则分工和覆盖关系写清楚，不要依赖某次导入顺序碰巧成立。</p>
<p>Service Worker 接管的请求可能不经过预期的页面路由。一般 API Mock 可按需求设置 serviceWorkers: &#x27;block&#x27;；如果目标是验证离线缓存和 Service Worker，则应使用专门场景，而不是把它禁掉后声称离线功能通过。</p>
<h3>每条被接管请求都需要完成</h3>
<p>处理器忘记 fulfill、abort、continue 或 fallback，请求可能一直等待。为了测试慢响应而保存一个延迟 Promise 时，也要在测试失败与清理阶段释放或正确结束它，避免上下文关闭时产生额外错误。</p>
<p>测试自建或复用上下文时，应清理自己注册的处理器，避免污染下一场景。unroute 可以移除特定规则；需要管理正在执行的处理器时，可评估相应版本的 unrouteAll 行为选项，不能简单移除规则就认为已开始的回调也停止了。</p>
<p>routing 会影响浏览器 HTTP 缓存行为，因此它适合验证前端对响应的处理，不适合直接推断真实网络缓存性能。浏览器成功消费 Mock 响应，也不能证明服务端 CORS、网关、权限和真实数据契约都正确；这些需要相应集成验证。</p>`};export{e as default};