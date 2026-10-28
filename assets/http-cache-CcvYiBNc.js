var e={answerHtml:`<h2>简答</h2>
<ul>
<li>“强缓存”和“协商缓存”是同一缓存流程中的不同分支：先判断能否存储与匹配，再判断是否新鲜，过期才带验证器发条件请求。</li>
<li>新鲜度按响应年龄计算，会结合 Date、Age 等信息，不是从浏览器收到响应才开始计时。</li>
<li>304 仍有一次网络往返，只是不重传正文；同时带 If-None-Match 与 If-Modified-Since 时优先评估 If-None-Match。</li>
<li>no-cache 允许存储但复用前必须验证，no-store 要求 HTTP 缓存不存储，两者不能互换。</li>
<li>缓存键不只看路径，Vary 与 private/public 决定变体和共享范围。</li>
</ul>
<p>前端常把直接复用新鲜响应叫“强缓存”，把带条件请求的重新验证叫“协商缓存”。它们不是两套互斥方案，而是同一个缓存流程中不同条件下的处理方式。</p>
<p>先问响应是否允许保存、当前请求能否匹配这份记录，再问它是否仍然新鲜。需要验证时，缓存可以带上之前保存的验证器，让服务端判断是否必须重新发送正文。</p>
<h2>第一次得到响应时，同时保存新鲜度与验证器</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60
ETag: &quot;catalog-v1&quot;

{&quot;items&quot;:[&quot;HTML&quot;,&quot;CSS&quot;]}
</code></pre></div>
<p>max-age 提供新鲜度寿命，ETag 提供这份表示的验证标识。缓存保存符合规则的响应后，在仍新鲜且请求匹配时，可以直接复用，不必每次到源站确认。</p>
<p>ETag 不要求一定是文件内容的哈希，也可以来自服务器可靠管理的版本信息。关键是它正确反映相应资源表示的验证语义，不能把一个永不变化的固定字符串当成所有版本的标识。</p>
<h2>新鲜度不是简单从当前浏览器收到响应开始计时</h2>
<p>响应可能已经在代理或 CDN 中停留了一段时间。缓存会结合 Date、Age、传输与本地驻留等信息估计当前年龄，再与新鲜度寿命比较。</p>
<p>例如寿命为 60 秒，而收到时相应年龄已经达到 50 秒，不能再无条件给浏览器完整的 60 秒新鲜期。Age 也不是“这个资源还可以缓存多少秒”，它描述的是相关年龄信息。</p>
<p>没有显式 Cache-Control，也不代表一定完全不缓存。某些响应可以按规则采用启发式新鲜度，因此希望明确控制行为时，应由服务端提供清楚策略。</p>
<h2>需要验证时，发送条件请求</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /catalog HTTP/1.1
Host: example.com
If-None-Match: &quot;catalog-v1&quot;
</code></pre></div>
<p>资源表示未变化时，服务器可以返回：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 304 Not Modified
Cache-Control: max-age=60
ETag: &quot;catalog-v1&quot;
</code></pre></div>
<p>304 不携带重新发送的完整资源正文。缓存根据响应中的相关元信息更新记录，并继续使用已有正文。如果内容已经变化，服务器通常返回新的 200 正文及新验证器。</p>
<p>因此 304 仍然发生了请求与网络往返，只是减少了正文传输。它不等于“没有请求”，也不保证服务器完全没有做任何验证工作。</p>
<p>浏览器自动缓存验证时，开发者工具可能显示网络上有 304，但普通 fetch 最终得到的可能是合并缓存后的完整响应。不能要求业务代码每次都直接拿到一个 status 为 304 的 Response。</p>
<h2>Last-Modified 是另一种验证方式</h2>
<p>服务器可以提供 Last-Modified，后续请求通过 If-Modified-Since 携带时间。时间验证受精度和服务器时间管理等因素影响，ETag 通常更适合表达可靠的表示版本。</p>
<p>请求同时带有 If-None-Match 与 If-Modified-Since 时，按 RFC 9110 服务端应优先评估 If-None-Match，忽略 If-Modified-Since。新鲜度计算中，<code>Cache-Control: max-age</code>（共享缓存还有 <code>s-maxage</code>）优先于 <code>Expires</code>，见 RFC 9111。</p>
<p>弱 ETag 与强 ETag 也有不同语义，普通缓存验证可以使用相应弱比较，而字节范围和严格前置条件等场景可能要求更强的验证。不要把所有含 ETag 的请求都理解成完全一样的比较。</p>
<h2>no-cache 与 no-store 分别改变哪一层</h2>
<p>no-cache 允许存储，但复用前需要按要求成功验证。它经常适合希望能及时发现新版本、又希望未变化时少传正文的入口资源。</p>
<p>no-store 则要求相应 HTTP 缓存不要存储该请求或响应的相关内容。它不是把“强缓存关闭、协商缓存保留”的别名，也不意味着浏览器里所有其他存储机制都被自动清空。</p>
<p>immutable、stale-while-revalidate 等指令怎样按资源类型选择，见“Cache-Control 的 immutable、stale-while-revalidate 和 no-store 怎样选择？”。</p>
<h2>匹配缓存记录不只看路径</h2>
<p>缓存键通常涉及请求方法和目标 URI；响应中的 Vary 还可能要求按 Accept-Encoding、Accept-Language 等请求头区分表示。相同 URL 不一定意味着所有请求都应使用同一份内容。</p>
<p>如果服务器根据用户或语言生成不同结果，却没有合适的缓存范围和键设计，共享缓存可能返回不属于当前请求的数据。private、共享缓存控制和身份边界应由服务端明确安排，而不是靠前端“多刷新几次”。</p>
<h2>部署与调试怎样配合</h2>
<p>入口 HTML 可以采用合适的验证策略，内容哈希文件则适合较长的新鲜期。发布时还要考虑旧入口引用旧资源、缓存层没有同时更新等情况，文件名带哈希不会自动完成整个版本切换协议。</p>
<p>调试时应分别看是否从浏览器缓存取出、是否发送了条件头、网络层实际状态、响应年龄以及 CDN 行为。开发工具的禁用缓存选项、强制刷新和 Service Worker 都可能改变观察结果。</p>
<p>Service Worker Cache API、应用内数据缓存和浏览器前进后退缓存并不等同于 HTTP 缓存。先确认正在讨论哪一层，再用对应规则解释，才能避免把所有“看到旧内容”都归为同一个问题。</p>`};export{e as default};