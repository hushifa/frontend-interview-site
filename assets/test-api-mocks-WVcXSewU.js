var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Playwright 的 route 能拦截浏览器请求并返回受控响应，让失败、重试等场景稳定复现。</li>
<li>拦截要在请求发生前安装。</li>
<li>测试仍运行真实浏览器和前端代码，但被拦截的后端没有参与。</li>
<li>通过这类测试不能说明完整服务链路已经验证。</li>
</ul>
<p>真实接口不容易稳定返回“第一次失败、第二次成功”，而组件的重试体验恰好需要这种场景。Playwright 的 route 可以拦截浏览器请求，返回受控响应，让测试稳定验证界面状态。</p>
<p>这仍然运行真实浏览器和前端代码，但被拦截的后端没有参与，不能把结果解释成完整服务链路已经验证。</p>
<h2>在请求发生前安装拦截</h2>
<p>下面假设测试站点具有 /questions 页面，页面通过 GET /api/questions 加载题目，失败后提供“重试”按钮。测试项目已经配置 baseURL：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { expect, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;题目加载失败后可以重试&#x27;</span>, <span class="hljs-title function_">async</span> ({ page, baseURL }) =&gt; {
  <span class="hljs-keyword">if</span> (!baseURL) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;需要配置测试站点 baseURL&#x27;</span>);
  <span class="hljs-keyword">const</span> endpoint = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;/api/questions&#x27;</span>, baseURL).<span class="hljs-property">href</span>;
  <span class="hljs-keyword">let</span> attempts = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(endpoint, <span class="hljs-title function_">async</span> (route) =&gt; {
    <span class="hljs-title function_">expect</span>(route.<span class="hljs-title function_">request</span>().<span class="hljs-title function_">method</span>()).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;GET&#x27;</span>);
    attempts += <span class="hljs-number">1</span>;
    <span class="hljs-keyword">if</span> (attempts === <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({ <span class="hljs-attr">status</span>: <span class="hljs-number">503</span>, <span class="hljs-attr">json</span>: { <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;暂时不可用&#x27;</span> } });
    } <span class="hljs-keyword">else</span> {
      <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({
        <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>,
        <span class="hljs-attr">json</span>: { <span class="hljs-attr">items</span>: [{ <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;promise&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;Promise 如何工作？&#x27;</span> }] },
      });
    }
  });

  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/questions&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;alert&#x27;</span>)).<span class="hljs-title function_">toContainText</span>(<span class="hljs-string">&#x27;加载失败&#x27;</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;重试&#x27;</span> }).<span class="hljs-title function_">click</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;Promise 如何工作？&#x27;</span>, { <span class="hljs-attr">exact</span>: <span class="hljs-literal">true</span> })).<span class="hljs-title function_">toBeVisible</span>();
  <span class="hljs-title function_">expect</span>(attempts).<span class="hljs-title function_">toBe</span>(<span class="hljs-number">2</span>);
});
</code></pre></div>
<p>先 route 再 goto，确保初始化请求被拦截。测试同时检查错误反馈、用户重试、最终数据与请求次数，不只是检查“接口返回了一个对象”。</p>
<p>示例的页面、响应结构和文案是明确约定，不是任意网站都能直接运行的用例。真实项目应使用自己的接口契约，若应用会自动重试，也要据此重新定义次数断言。</p>
<h2>匹配范围要能发现错误请求</h2>
<p>若用 <code>**/*</code> 给所有请求返回成功 JSON，错误的 URL、方法甚至资源请求都可能被掩盖。应匹配预期来源与路径，并检查必要的方法、查询参数或请求体。</p>
<p>完整字符串匹配与 glob 的行为不同；接口包含查询参数时，应使用合适的 URL 谓词或明确模式。未匹配请求可能落到真实网络，测试环境应对意外 API 请求有检测或隔离，避免 Mock 漏掉后仍偶然通过。</p>
<p>每条被接管的 route 都应选择 fulfill、continue、fallback 或 abort 等明确处理路径，不能让请求一直悬挂。多条 route 重叠时还要理解其优先级，避免公共拦截器覆盖了当前场景。</p>
<h2>HTTP 失败与网络失败要分别测试</h2>
<p>503 是服务器返回的 HTTP 响应，fetch 通常会正常完成 Promise，但 response.ok 为 false。route.abort 模拟的是请求无法完成的网络类错误，前端通常进入异常分支。两者不能互相代替。</p>
<p>还可以测试 200 空结果、格式不符、权限失效和请求迟迟未完成。测试慢响应时优先使用受控释放机制，先确认加载状态，再允许响应完成；不要只是加一个不确定的固定 sleep。</p>
<h2>route.fetch 仍依赖真实上游</h2>
<p>有时想保留大部分真实响应，只修改某个字段，可以调用 route.fetch，再通过 fulfill 修改响应。此时请求已经访问真实服务，测试仍受网络、数据和认证影响，不应称为完全离线 Mock。</p>
<p>HAR 回放也需要维护。录制文件可能包含 Cookie、令牌、个人数据和失效的动态字段，提交前必须清理。它能帮助复现流量，不能保证录下来的契约永远正确。</p>
<h2>浏览器拦截有自己的边界</h2>
<p>Service Worker 可能先接管请求，导致预期的 route 看不到它。普通接口模拟可在测试上下文中按需求阻止 Service Worker；若测试目标就是离线缓存，则应保留真实路径，另写专门用例。</p>
<p>page.route 只针对对应页面范围，context.route 可覆盖上下文中的页面；弹窗或早期请求应选择合适层级。启用 routing 还会影响 HTTP 缓存行为，因此这类功能测试不能顺便当作真实缓存性能测试。</p>
<p>最后保留关键真实集成验证，确认服务端认证、状态码和数据结构仍与 Mock 一致。接口模拟的价值是稳定覆盖前端分支，而不是用一套假数据取代所有系统验证。</p>`};export{e as default};