var e={answerHtml:`<p>假设主页面嵌入了一个跨源的图表 iframe，图表渲染完成后要告诉主页面“高度是 480 像素”。同源策略不允许双方随意读取彼此的 DOM，但可以通过 <code>postMessage</code> 发送约定好的数据。</p>
<p>风险在于：拿到窗口引用的其他页面也可能发消息；你保存的 iframe 窗口还可能导航到另一个网站。所以安全通信需要同时回答三个问题：<strong>要发给哪个源、收到的是哪个窗口发来的、这个消息允许做什么</strong>。</p>
<h3>发送时把目标来源写准确</h3>
<p>图表页面可以这样向主页面发送消息：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-property">parent</span>.<span class="hljs-title function_">postMessage</span>(
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;chart:resize&#x27;</span>, <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">height</span>: <span class="hljs-number">480</span> },
  <span class="hljs-string">&#x27;https://app.example.com&#x27;</span>,
);
</code></pre></div>
<p>第二个参数是目标源，比较时涉及协议、主机和端口，不是某个具体页面路径。浏览器只会把消息交给符合该目标源的接收文档；如果目标窗口已经导航到攻击者的网站，就不会因为你还持有旧窗口引用而把消息交过去。</p>
<p>使用 <code>&#x27;*&#x27;</code> 会放弃这项目标限制。尤其不要把访问令牌、用户资料等敏感数据用星号发送。省略参数也不等于自动识别对方：当前 API 的默认目标是发送方自己的源，跨源通信应显式填写。</p>
<h3>接收时不要只判断消息名称</h3>
<p>主页面在 iframe 元素已经存在后安装以下监听器。假设该元素的 ID 是 <code>chart-frame</code>，预期加载 <code>https://charts.example.com</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> chartFrame = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#chart-frame&#x27;</span>);
<span class="hljs-keyword">const</span> chartOrigin = <span class="hljs-string">&#x27;https://charts.example.com&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">handleChartMessage</span>(<span class="hljs-params">event</span>) {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">origin</span> !== chartOrigin) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">source</span> !== chartFrame.<span class="hljs-property">contentWindow</span>) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">const</span> data = event.<span class="hljs-property">data</span>;
  <span class="hljs-keyword">if</span> (data === <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> data !== <span class="hljs-string">&#x27;object&#x27;</span> || <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(data)) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;chart:resize&#x27;</span> || data.<span class="hljs-property">version</span> !== <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(data.<span class="hljs-property">height</span>) || data.<span class="hljs-property">height</span> &lt; <span class="hljs-number">100</span> || data.<span class="hljs-property">height</span> &gt; <span class="hljs-number">1200</span>) <span class="hljs-keyword">return</span>;

  chartFrame.<span class="hljs-property">style</span>.<span class="hljs-property">height</span> = <span class="hljs-string">\`<span class="hljs-subst">\${data.height}</span>px\`</span>;
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, handleChartMessage);

<span class="hljs-comment">// 组件卸载或不再使用图表时调用，避免留下重复监听器。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">disposeChartMessages</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, handleChartMessage);
}
</code></pre></div>
<p>这些判断各有用途：</p>
<ul>
<li><code>origin</code> 检查来自哪个源。必须完整比较，不能用 <code>includes(&#x27;example.com&#x27;)</code>，否则 <code>example.com.attacker.test</code> 等地址可能被误认。</li>
<li><code>source</code> 检查是不是预期的那个 iframe 窗口。同一来源可能同时存在多个窗口，来源正确并不代表对象正确。</li>
<li>结构与范围检查限制消息能力。这里最多允许调整一个合理范围内的高度，不允许任意修改 DOM 或执行命令。</li>
</ul>
<p><code>postMessage</code> 使用结构化克隆传输数据，可以直接发送对象，不要求先 JSON.stringify。接收后仍应做运行时校验；TypeScript 类型标注无法约束另一个页面实际发来的数据。</p>
<h3>来源可信不代表消息内容可以直接执行</h3>
<p>不要把消息中的字符串交给 <code>eval</code>，也不要直接赋给 <code>innerHTML</code>。即使来源在白名单中，对方也可能存在漏洞，或者把它收到的用户输入原样转发。通信协议应提供有限操作，例如调整高度、报告选中 ID，而不是提供“执行任意 JavaScript”的入口。</p>
<p>如果消息声称“支付成功”，主页面最多据此刷新订单，真正的支付状态仍应向可信服务查询。页面消息不是服务端业务授权凭证。</p>
<h3>窗口导航和异步消息需要另外考虑</h3>
<p><code>event.origin</code> 表示消息发送时的来源，不保证那个窗口现在仍在同一个页面。回复消息前先完成来源和窗口校验，并使用明确的目标源；不要因已验证一次就永久信任窗口后续发来的所有消息。</p>
<p>对于请求与响应，还可加入 requestId 来区分并发请求，结合超时和页面会话标识丢弃旧响应。这些字段负责关联，不替代 origin/source 校验。同一个 iframe 导航后窗口引用可能继续存在，因此 source 相同也不代表文档实例未变。</p>
<p>沙箱 iframe 或 data URL 可能使用不透明源，收到的 origin 会是字符串 <code>&quot;null&quot;</code>。多个不相关文档都可能具有这个值，不能把 <code>&quot;null&quot;</code> 放进普通可信来源白名单。确实需要这种通信时，应另行设计受限能力和通道建立流程，而不是删除校验让它“先跑起来”。</p>`};export{e as default};