var e={answerHtml:`<h2>简答</h2>
<ul>
<li>103 Early Hints 让服务器在生成最终响应前先发送 Link 提示，浏览器可以提前 preload 或 preconnect。</li>
<li>它比 HTML 里的 preload 更早被发现，并取代了已被移除的 Server Push。</li>
<li>需要服务器、CDN 和代理链路真正支持并转发 103。</li>
<li>只提示稳定、确定会用的资源，上线后确认关键资源请求确实提前且没有重复下载。</li>
</ul>
<p>服务器生成一个页面时，可能要先查询数据、检查权限、组合模板。这段时间浏览器还没收到 HTML，自然也不知道页面用了哪份 CSS 或哪个字体。如果服务器已经知道页面必需的静态资源，就可以先把这些信息发给浏览器，让连接准备或资源下载与页面生成同时进行。</p>
<p>这就是 <code>103 Early Hints</code> 的用途。它是最终响应之前的信息性响应，不是页面正文，也不是一次失败重试。</p>
<h2>提前提示发生在什么时候</h2>
<p>以一个需要等待数据库的页面为例，以下时间仅用来说明先后关系，不是性能测试结果：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">没有 Early Hints：
请求页面 → 等待生成 HTML → 收到 HTML → 发现 CSS → 下载 CSS

使用 Early Hints：
请求页面 → 收到 103，开始下载 CSS ───────────────┐
         └→ 服务器继续生成 HTML → 收到 HTML → 使用 CSS
</code></pre></div>
<p>如果 HTML 本来几乎立即返回，或者浏览器已缓存相应资源，这段重叠带来的收益就可能很小。103 不会让数据库查询更快，也不改变页面最终需要执行多少 JavaScript。</p>
<h2>一个请求可以先收到 103，再收到最终的 200</h2>
<p>下面使用便于阅读的 HTTP 状态行记法展示逻辑内容。实际面向浏览器部署通常使用 HTTP/2 或更新协议，并按相应帧格式传输：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/2 103 Early Hints
Link: &lt;/assets/app.a1b2.css&gt;; rel=preload; as=style
Link: &lt;https://fonts.example.com&gt;; rel=preconnect; crossorigin
</code></pre></div>
<p>随后，同一个页面请求收到最终响应：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/2 200 OK
Content-Type: text/html; charset=utf-8
</code></pre></div>
<p>最终的 HTML 仍然正常声明样式表：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;stylesheet&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/assets/app.a1b2.css&quot;</span> /&gt;</span>
</code></pre></div>
<p>浏览器收到 103 时可以提前获取样式，收到 HTML 后才知道该怎样把它用于文档。<code>rel=preload</code> 只负责提前获取，不等于已经应用 CSS。即使中间设备或浏览器忽略了 103，最终 HTML 也应该能独立完成正确加载。</p>
<p>这里的 103 和最终 200 属于一次请求的不同阶段，不是返回了两份完整页面。最终状态也可能是重定向或错误，因此早期提示不能保证所列资源一定会用上。</p>
<h2>与 HTML preload 和 Server Push 有何不同</h2>
<p>写在 HTML 里的 <code>&lt;link rel=&quot;preload&quot;&gt;</code>，需要浏览器先收到相应 HTML 字节才能被发现。写在最终响应头里的 <code>Link</code>，仍要等最终响应头到达。103 的特别之处在于，服务器可以在最终响应尚未准备好时就发送这些提示。</p>
<p>HTTP/2 Server Push 则曾允许服务器主动发送资源响应，浏览器对这一机制的支持和部署情况与 Early Hints 不同。103 只是告诉客户端“可能需要这些资源”，由客户端决定是否另行请求，可以结合自身缓存和策略处理；它不等于服务端已经把 CSS 正文推送过来。</p>
<p>普通页面 JavaScript 中的 <code>fetch()</code> 也不会把中间的 103 当作一个可先后读取的普通 <code>Response</code> 暴露。应用通常拿到的是最终响应，103 的资源处理由浏览器内部负责，且具体使用场景受浏览器支持约束。验证中间响应应使用网络工具和服务端日志，不能只打印 <code>response.status</code>。</p>
<h2>它要求部署链路真正配合</h2>
<p>仅在静态 HTML 里写一行“103”没有作用。需要服务器或 CDN 在合适时机真正发送信息性响应，反向代理还必须支持转发，浏览器也必须支持处理。</p>
<p>兼容性上不应因为协议示例写成 HTTP/1.1 文本，就认为所有 HTTP/1.1 客户端和代理都能安全处理 Early Hints。面向浏览器的支持通常集中在 HTTP/2 及以上，具体方案要按当前浏览器和托管平台能力核实。</p>
<p>对于只有静态托管权限的项目，通常无法仅靠修改前端源码控制 103。可以先做好 HTML 的资源发现顺序、少量关键 preload、缓存和图片优化；若托管平台提供 Early Hints，再配置相应规则。不要为使用一种协议特性而假定平台不存在的功能。</p>
<h2>最难的是：提示必须足够早，也足够准确</h2>
<p>稳定的公共 CSS、确定会使用的关键字体，往往比个性化数据接口更适合早期提示。如果必须等所有后端查询结束才能算出资源列表，103 已经没有多少提前量。</p>
<p>资源 URL、<code>as</code>、跨源与凭据模式要和最终页面一致，否则可能无法复用，造成第二次请求。更新构建版本时，还要同步更新 CDN 的提示清单，避免一直提示旧哈希文件。</p>
<p>不要把所有可能的资源都放进 103。对于登录后才能确定的页面、实验分组和不同设备的图片版本，错误提示可能下载不需要的内容；向第三方提前连接还涉及网站原有的隐私和授权安排。响应头也不应包含仅供当前用户使用的秘密或长期凭证。</p>
<h2>如何确认上线后真的有效</h2>
<p>先确认客户端确实收到了中间 103，再看关键资源请求是否早于最终 HTML 到达，并检查后续使用时有没有重复下载。还应分别观察缓存命中、冷启动、移动网络和重定向场景。</p>
<p>判断最终收益要看 LCP、渲染等待和总传输，而不只是“Network 里多了一个 103”。如果提前下载的字体抢了主图带宽，或错误资源每次都白下，出现 Early Hints 反而可能让页面更慢。</p>`};export{e as default};