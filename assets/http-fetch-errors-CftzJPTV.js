var e={answerHtml:`<h2>简答</h2>
<ul>
<li>fetch 兑现只说明拿到了响应，404、500 通常不会让它拒绝，需要自己检查 response.ok。</li>
<li>把流程拆成取得响应、判断状态、读取解析正文、校验业务结构四步，每步都可能失败。</li>
<li>204/205 没有正文，不能无条件调用 json；正文读取与解析也要放进错误边界。</li>
<li>取消只是停止等待，不保证服务器没执行写操作；正文通常只能消费一次，需要时提前 clone。</li>
</ul>
<p>fetch 的 Promise 兑现，通常说明已经取得可供处理的响应，而不是说明 HTTP 状态一定成功，更不代表业务已经完成。404、500 仍然是服务器发回的 HTTP 响应，所以通常不会仅因状态码就让 fetch 拒绝。</p>
<p>可以把过程拆开：发送与取得响应，判断状态，读取和解析正文，检查业务结构。失败可能发生在其中任意一步，处理方式也不同。</p>
<h2>用一个契约明确的 JSON 读取函数</h2>
<p>下面只演示 GET JSON 读取：接受正常 JSON 响应，204/205 返回 null，其他非成功 HTTP 状态保留为明确错误。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">HttpError</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">Error</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">response</span>) {
    <span class="hljs-variable language_">super</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = <span class="hljs-string">&#x27;HttpError&#x27;</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">status</span> = response.<span class="hljs-property">status</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">retryAfter</span> = response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Retry-After&#x27;</span>);
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fetchJson</span>(<span class="hljs-params">url, { signal } = {}</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { signal });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">HttpError</span>(response);
  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">status</span> === <span class="hljs-number">204</span> || response.<span class="hljs-property">status</span> === <span class="hljs-number">205</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;

  <span class="hljs-keyword">const</span> mediaType = response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Content-Type&#x27;</span>)?.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;;&#x27;</span>)[<span class="hljs-number">0</span>].<span class="hljs-title function_">trim</span>().<span class="hljs-title function_">toLowerCase</span>();
  <span class="hljs-keyword">const</span> jsonType = mediaType === <span class="hljs-string">&#x27;application/json&#x27;</span> ||
    (mediaType?.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;application/&#x27;</span>) &amp;&amp; mediaType.<span class="hljs-title function_">endsWith</span>(<span class="hljs-string">&#x27;+json&#x27;</span>));
  <span class="hljs-keyword">if</span> (!jsonType) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;响应类型不符合 JSON 接口约定&#x27;</span>);

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
}
</code></pre></div>
<p>response.ok 主要检查状态是否在 200–299 范围。本例主动把 404 等状态转成 HttpError，所以调用方的 catch 才能按这个约定处理它们。</p>
<p>204/205 没有普通 JSON 正文，不能无条件调用 json。200 的空正文或格式错误则仍然会在 JSON 解析阶段失败，不能因为前面已经通过 ok 检查就忽略。</p>
<p>Content-Type 检查帮助发现“接口实际返回了 HTML 登录页”等契约错误，但它不会证明 JSON 中有需要的业务字段。解析后还应按领域模型验证。</p>
<h2>fetch 可以在正文尚未完整读取时兑现</h2>
<p>取得响应后，正文通常仍以流的形式等待消费。response.json、text、blob 等方法有自己的异步过程，读取中断、解码或格式解析问题都可能使它们拒绝。</p>
<p>因此只在 await fetch 周围记录“请求成功”，可能过早。如果业务需要完整数据，应把正文读取与解析也包含在相应错误边界中。</p>
<p>网络中断、无效请求、浏览器策略和取消等情况，则可能让 fetch 本身拒绝。在浏览器里，CORS 失败常常只向脚本提供有限的错误信息，不能仅凭一个 TypeError 就精确诊断全部原因，应结合控制台与 Network。</p>
<h2>取消应在任务进行中发出</h2>
<p>下面接在前面的函数定义后，在浏览器模块中运行。示例地址应属于当前页面的实际 HTTP 服务：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-keyword">const</span> request = <span class="hljs-title function_">fetchJson</span>(<span class="hljs-string">&#x27;/api/data&#x27;</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
<span class="hljs-keyword">const</span> handled = request.<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// 默认主动取消时通常为 AbortError</span>
});

controller.<span class="hljs-title function_">abort</span>();
<span class="hljs-keyword">await</span> handled;
</code></pre></div>
<p>先启动请求、连接错误处理，再发出取消。若已经 await 完整请求后才调用 abort，就不能拿它演示中途终止。</p>
<p>同一个已取消 signal 不会自动恢复成可再次使用的新状态，下一次独立请求通常需要新的控制器。取消也可能发生在 fetch 已取得响应之后，此时继续读取正文仍可能失败。</p>
<p>默认 abort 常见的是 AbortError，但超时信号或自定义取消原因可能有不同表现。需要结合自己的 signal 与 API 约定识别原因，不要只靠一个错误名字处理所有情况。</p>
<p>客户端取消不保证服务器没有执行写操作。对于创建订单等结果不确定的变更，仍需幂等或状态查询；停止等待与撤销业务不是同一个操作。</p>
<h2>正文通常只能消费一次</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-string">&#x27;{&quot;ok&quot;:true}&#x27;</span>, {
  <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
});
<span class="hljs-keyword">const</span> copy = response.<span class="hljs-title function_">clone</span>();

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>()).<span class="hljs-property">ok</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> copy.<span class="hljs-title function_">text</span>()); <span class="hljs-comment">// {&quot;ok&quot;:true}</span>
<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">text</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>response 的流已经被 json 消费，再读取同一个正文会失败。clone 需要在原正文被消费或锁定之前建立，并通过分支提供另一次读取路径。</p>
<p>克隆并不是免费复制一个已经在内存里的小字符串。对于大正文或流，一条分支消费很慢时可能造成额外缓冲；日志与业务解析应尽量采用清楚的单次读取策略。</p>
<h2>不同业务不一定都适合统一抛同一种错误</h2>
<p>某个查询的 404 可能表示正常的“没有记录”，另一个页面的 404 则需要提示资源不存在。202 可能需要后续等待，429 可能需要读取限流信息，认证失败又涉及会话流程。</p>
<p>上面的辅助函数只定义了一个有限读取约定。真实请求层可以解析受控的错误结构并保留状态、请求关联标识等信息，但不应把所有失败都自动转换为空数组或把服务器原始正文直接展示给用户。</p>
<p>跨源响应要读取 Retry-After 等非默认暴露头时，还需相应 CORS 配置。脚本读取到 null 不一定表示网络响应里绝对没有这个头。</p>
<h2>浏览器的过滤响应与普通 HTTP 错误不同</h2>
<p>no-cors 得到的 opaque 响应或手动重定向得到的 opaqueredirect，可能对脚本呈现 status:0、不可读正文和受限头信息。它们不能直接当作正常 JSON 接口结果，也不是服务器真的返回了一个“HTTP 0”。</p>
<p>Node 和浏览器的缓存、CORS 与重定向可见性并不完全相同。调试前应明确环境，再判断是 HTTP 状态、浏览器过滤、连接失败、正文读取还是业务结构的问题。</p>
<p>把这些阶段分开后，catch 才能承担有意义的恢复，而不是把所有不符合预期的结果都笼统叫作“网络错误”。</p>`};export{e as default};