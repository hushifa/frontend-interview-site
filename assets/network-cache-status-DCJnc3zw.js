var e={answerHtml:`<p>一个请求最终返回 200，不足以说明它是否真的访问了源站。可能是 CDN 直接返回缓存，也可能是 CDN 向源站重新验证后，把原有正文返回给浏览器。<code>Cache-Status</code> 让参与处理的缓存层描述自己做了什么，帮助把这些情况区分开。</p>
<p>它是可选的诊断响应头，不是浏览器必定自动添加的信息。没有这个头，不能断言没有缓存；出现这个头，也不能认为它已经描述了整条链路上所有缓存。</p>
<h2>从一条简单的命中记录读起</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Status: EdgeCache; hit; ttl=120
</code></pre></div>
<p><code>EdgeCache</code> 是报告该信息的缓存标识。<code>hit</code> 表示它用缓存中的响应满足请求，没有为这次处理向上游转发；<code>ttl=120</code> 表示这层缓存报告时计算出的剩余新鲜时间约为 120 秒。</p>
<p>这里的 ttl 不是“浏览器一定还能缓存 120 秒”，也不是资源自创建以来的年龄。不同缓存可能采用自己的策略和计算，客户端仍应依据适用的 HTTP 缓存规则决定如何使用响应。</p>
<p><code>hit</code> 也不一定意味着内容新鲜。某些允许使用过期响应的情况可以报告：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Status: EdgeCache; hit; ttl=-30
</code></pre></div>
<p>它表示这次由缓存满足，但按照该缓存的计算，响应已过期 30 秒。是否允许这样返回，还要结合 stale 相关策略、请求要求和服务端可用性判断。</p>
<h2>没命中时，fwd 比一个 MISS 更有用</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Status: EdgeCache; fwd=uri-miss; stored
</code></pre></div>
<p>这表示该层没有找到匹配请求 URI 的响应，所以向上游转发，并把获得的响应存了下来。<code>stored</code> 说明这次发生了存储，不保证下一次一定命中：缓存还可能过期、被淘汰，或者下一次请求选中了不同变体。</p>
<p>常见 <code>fwd</code> 原因包括：</p>
<table><thead><tr><th>值</th><th>这层缓存报告的原因</th></tr></thead><tbody><tr><td><code>uri-miss</code></td><td>没有匹配请求 URI 的缓存响应</td></tr><tr><td><code>vary-miss</code></td><td>地址匹配，但请求头与已有 Vary 变体不匹配</td></tr><tr><td><code>stale</code></td><td>找到了响应，但已过期，需要向上游处理</td></tr><tr><td><code>bypass</code></td><td>配置要求绕过此缓存</td></tr><tr><td><code>request</code></td><td>有新鲜响应，但本次请求的要求不允许直接使用</td></tr><tr><td><code>method</code></td><td>请求方法的语义要求转发</td></tr><tr><td><code>partial</code></td><td>只有部分内容，无法满足本次范围或完整内容请求</td></tr></tbody></table>
<p>例如看到 <code>vary-miss</code>，应该检查语言、编码等请求头和缓存变体规则，而不是只检查资源是否过期。看到 <code>bypass</code>，则应检查 CDN 路由和缓存配置，不要把它解释成缓存服务器坏了。</p>
<p>同一个列表成员中的 <code>hit</code> 与 <code>fwd</code> 应互斥：这层处理要么直接由缓存满足，要么需要向上游转发。不要为了让监控“看起来命中”而在一次同步重新验证后同时标两者。</p>
<h2>浏览器收到 200，上游却可能只返回了 304</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 200 OK
Cache-Status: EdgeCache; fwd=stale; fwd-status=304
</code></pre></div>
<p>这个例子表示缓存里有旧响应，但需要向上游确认；上游返回 304，缓存因此可以更新相应元信息并继续使用原正文，最终向客户端提供完整响应。</p>
<p><code>fwd-status=304</code> 是<strong>下一跳对转发请求返回的状态码</strong>，不必等于浏览器最终收到的状态码。由于确实发生了上游验证，这个处理不按 RFC 9211 定义算作直接 hit。诊断时如果只看浏览器的 200，就会漏掉这一段等待。</p>
<p>同样，上游的下一跳可能是另一层缓存，不一定就是应用源站。</p>
<h2>多层缓存的记录要从来源和时间一起理解</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Cache-Status: OriginCache; hit; ttl=900, EdgeCache; hit; ttl=120
</code></pre></div>
<p>列表通常从靠近源站的缓存排到靠近用户的缓存。这个例子中 EdgeCache 更靠近用户。</p>
<p>但它不能简单读成“这次请求先访问了 OriginCache，再访问了 EdgeCache”。当 EdgeCache 直接命中时，请求没有继续发到上游；响应里保留的 OriginCache 信息可能来自更早获取并保存该响应的那次请求。</p>
<p>因此多层记录可以帮助理解响应经过了什么处理，却不总是一次请求的实时完整调用链。尤其不能把每一层 ttl 相加，或者把多条 hit 当成当前同时访问所有层的证据。</p>
<h2>它与其他缓存相关信息各有职责</h2>
<ul>
<li><code>Cache-Control</code> 提供缓存行为指令，例如能否存储、何时需要验证。</li>
<li><code>Vary</code> 描述哪些请求头影响缓存变体的匹配。</li>
<li><code>ETag</code> 等验证器帮助判断表示是否变化。</li>
<li><code>Age</code> 表达响应的估计年龄，和“还剩多久新鲜”不同。</li>
<li><code>Cache-Status</code> 报告某一缓存层如何处理请求，是解释和诊断信息。</li>
</ul>
<p>因此手动在响应里写 <code>Cache-Status: MyCache; hit</code> 不会凭空创建缓存，也不能证明实现真的命中。必须让实际缓存组件按真实处理结果生成它。</p>
<p>开发者工具里的 <code>from memory cache</code>、<code>from disk cache</code> 和 <code>from ServiceWorker</code> 也来自不同观察角度。若浏览器根本没有发送网络请求，看到的服务器诊断头可能只是以前响应保留下来的内容，不是 CDN 刚刚生成的新记录。</p>
<h2>在代码中读这个头时要注意什么</h2>
<p>同源响应可以通过 <code>response.headers.get(&#x27;Cache-Status&#x27;)</code> 读取；跨源脚本通常需要服务端用 <code>Access-Control-Expose-Headers</code> 暴露该字段。开发者工具能看到它，不代表跨源 JavaScript 也能读取。</p>
<p>它使用 HTTP Structured Fields 的列表和参数语法，缓存名称可能是带引号的字符串，参数也有不同类型。正式做诊断面板时应使用成熟的结构化字段解析器，不要仅靠逗号和分号切割所有内容。厂商自己的 <code>X-Cache</code> 等字段也可能有完全不同的约定，不能直接按同一套语义解析。</p>
<p><code>key</code>、<code>detail</code> 等可选参数可能透露内部缓存键、节点或规则。公开程度应按需要控制，敏感详情可以仅对授权诊断请求返回。</p>
<p>真正排查问题时，把当前请求头、最终响应状态、Cache-Status、Age、Vary 和服务端日志对齐到同一次请求。它能缩小原因范围，但不能替代对实际缓存策略和内容正确性的检查。</p>`};export{e as default};