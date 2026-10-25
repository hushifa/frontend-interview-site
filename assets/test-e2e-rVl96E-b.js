var e={answerHtml:`<p>端到端测试不稳定，通常不是简单的“机器太慢”，而是测试依赖了没有写明的条件：上一个用例留下的数据、某个请求必须先回来、固定等待两秒就足够，或者同一个账号只能同时执行一个流程。</p>
<p>要减少偶发失败，应把数据、操作和完成条件写清楚。增加超时或重试可以帮助观察，却不能替代消除这些隐含依赖。</p>
<h3>自动等待只解决特定的可操作条件</h3>
<p>Playwright 的 locator.click 会等待元素满足相关条件，例如可见、稳定、能接收事件和启用。但按钮可以点击，不代表页面的所有业务初始化都完成，也不代表点击后保存已经成功。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByLabel</span>(<span class="hljs-string">&#x27;昵称&#x27;</span>, { <span class="hljs-attr">exact</span>: <span class="hljs-literal">true</span> }).<span class="hljs-title function_">fill</span>(<span class="hljs-string">&#x27;新的昵称&#x27;</span>);
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;保存&#x27;</span>, <span class="hljs-attr">exact</span>: <span class="hljs-literal">true</span> }).<span class="hljs-title function_">click</span>();
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>)).<span class="hljs-title function_">toHaveText</span>(<span class="hljs-string">&#x27;保存成功&#x27;</span>);
</code></pre></div>
<p>最后一条使用可重试断言等待可见结果。只 await click 然后结束测试，会漏掉服务端失败或界面没有更新的问题。以上片段需要已有页面及对应的测试导入，不是一整个独立测试文件。</p>
<p>如果应用在 hydration 前显示一个可点击但尚未绑定处理的按钮，应修复应用的可操作状态；不要让测试通过随意 sleep 掩盖真实用户也可能点不到的竞态。</p>
<h3>在触发操作之前注册事件等待</h3>
<p>若要确认某个接口响应，先建立等待，再点击：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> responsePromise = page.<span class="hljs-title function_">waitForResponse</span>(<span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(response.<span class="hljs-title function_">url</span>());
  <span class="hljs-keyword">return</span> url.<span class="hljs-property">pathname</span> === <span class="hljs-string">&#x27;/api/profile&#x27;</span> &amp;&amp; response.<span class="hljs-title function_">request</span>().<span class="hljs-title function_">method</span>() === <span class="hljs-string">&#x27;PATCH&#x27;</span>;
});
<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;保存&#x27;</span>, <span class="hljs-attr">exact</span>: <span class="hljs-literal">true</span> }).<span class="hljs-title function_">click</span>();
<span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> responsePromise;
<span class="hljs-title function_">expect</span>(response.<span class="hljs-title function_">ok</span>()).<span class="hljs-title function_">toBeTruthy</span>();
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>)).<span class="hljs-title function_">toHaveText</span>(<span class="hljs-string">&#x27;保存成功&#x27;</span>);
</code></pre></div>
<p>如果先点再开始 waitForResponse，快速响应可能已经发生，测试就会一直等下一次。弹窗、下载等事件也有类似问题。</p>
<p>接口成功仍不等于页面正确呈现，所以保留 UI 断言。匹配条件还应结合实际来源和业务参数，避免把另一个同路径请求误认成目标响应。</p>
<h3>隔离浏览器状态，也要隔离后端数据</h3>
<p>Playwright Test 默认的页面 fixture 使用独立浏览器上下文，有助于隔离 Cookie 和本地存储。但两个测试仍可能共享后端账号、订单或文件，导致并行运行时互相覆盖。</p>
<p>测试应准备自己的数据或使用明确的只读数据集，必要时为 worker 分配独立账号，结束后清理。复用 storageState 可以节约登录时间，却不自动隔离服务端状态，也应保护其中的认证信息。</p>
<p>不要让测试 B 必须先由测试 A 创建订单。每个用例应独立准备前置状态，单独运行、乱序和重试时都能成立。</p>
<h3>定位器要稳定，也要足够具体</h3>
<p>按角色与可访问名称定位，通常比深层 CSS 或易变 class 更可靠。多个同名按钮时，可在对应对话框或区域内缩小范围，而不是用 nth(0) 碰巧选中当前布局里的第一个。</p>
<p>force 点击可能跳过部分可操作性检查，若问题是按钮被遮挡，强制点击会掩盖用户无法操作的缺陷。只有明确测试需要时才使用，而不是作为通用修复。</p>
<p>等待 networkidle 也不是所有应用的 ready 定义。轮询、分析请求和长连接会干扰它，应等待真正的业务结果或明确的页面状态。</p>
<h3>失败证据比盲目重试更有用</h3>
<p>失败时保存 trace、截图、控制台错误和必要网络记录，查看失败前元素状态、请求和操作顺序。敏感 Cookie、响应内容及用户资料应按测试环境要求保护。</p>
<p>重试可以帮助识别偶发问题，但“第二次成功”仍然说明第一次的失败需要解释。数据污染、真实产品竞态和资源不足分别需要不同修复，不能都归类为测试抖动。</p>
<p>保持浏览器版本、字体、视口和必要环境条件可控，并给 CI 合理资源。最终验证不仅是本机连续通过，还应在目标 CI 中重复运行关键流程，确认修复针对了原因，而不是把等待时间拉长到恰好掩盖问题。</p>`};export{e as default};