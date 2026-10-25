var e={answerHtml:`<p>同样请求 <code>/help</code>，中文用户可能希望看到中文，英文用户希望看到英文；同样请求一张图片，支持 AVIF 的浏览器可能得到 AVIF，另一个客户端得到 JPEG。URL 代表一个资源，但返回的具体表示可以不同。</p>
<p>内容协商就是客户端表达自己能接受什么，服务器结合已有资源和自身规则选择一种表示。前端需要关心两件事：最后实际拿到的是什么，以及缓存有没有把别人的那种表示错误地复用过来。</p>
<h2>请求偏好与实际内容要分开看</h2>
<table><thead><tr><th>请求信息</th><th>表达的意思</th><th>对应的响应信息</th></tr></thead><tbody><tr><td><code>Accept</code></td><td>可接受的媒体类型，如 JSON、HTML、WebP</td><td><code>Content-Type</code> 声明实际正文的媒体类型</td></tr><tr><td><code>Accept-Language</code></td><td>语言偏好，如中文优先、英文其次</td><td><code>Content-Language</code> 声明内容面向的语言</td></tr><tr><td><code>Accept-Encoding</code></td><td>可接受的内容编码，如 br、gzip</td><td><code>Content-Encoding</code> 声明实际采用的内容编码</td></tr></tbody></table>
<p><code>Accept-Encoding</code> 讨论的是 gzip、Brotli 等内容编码，不是 HTTP/1.1 的 chunked 传输分帧，也不是字符集。<code>Content-Type: application/json</code> 和 <code>Content-Encoding: gzip</code> 可以同时存在，意思是 JSON 表示经过 gzip 编码后传输。</p>
<p>尤其容易混淆的是 POST 请求中的这两个头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">POST /api/reports HTTP/1.1
Host: example.com
Content-Type: application/json
Accept: application/pdf

{&quot;month&quot;:&quot;2026-09&quot;}
</code></pre></div>
<p>请求的 <code>Content-Type</code> 说明“我发给你的正文是 JSON”，<code>Accept</code> 说明“我希望你返回 PDF”。它们可以完全不同。设置 <code>Accept: application/json</code> 也不会自动把请求体序列化，设置 <code>Content-Type</code> 更不会自动执行 <code>JSON.stringify()</code>。</p>
<h2>q 值表示偏好，不是服务器必须执行的转换指令</h2>
<p>例如：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Accept: application/json, text/html;q=0.8
Accept-Language: zh-CN, zh;q=0.9, en;q=0.7
</code></pre></div>
<p>省略 q 时通常按 1 处理，范围是 0 到 1。在按这些偏好协商时，JSON 的偏好高于 HTML，<code>q=0</code> 表示相应匹配项不可接受。出现通配符和更具体的媒体类型时，还要按匹配具体程度处理，不能简单把所有 q 排序后取第一项就称为完整协商算法。</p>
<p>服务器只能选择它能提供的表示。它可能根据约定回退到默认语言，也可能在无法满足媒体格式要求时返回 <code>406 Not Acceptable</code>；HTTP 也允许服务端选择忽略某些偏好而使用默认响应。因此客户端应检查实际响应，而不是因为自己写了 Accept 就直接认定返回一定是 JSON。</p>
<p><code>415 Unsupported Media Type</code> 主要表示服务器不接受本次请求正文的媒体类型或相关内容编码，和“没有符合 Accept 的响应格式”不是同一问题。</p>
<p>语言偏好也不是地理位置、国籍或权限依据。浏览器配置可能与用户当前想看的语言不同，应允许用户显式选择，并让应用约定的显式选择优先于自动猜测。</p>
<h2>为什么 Vary 少写一个字段就可能串内容</h2>
<p>假设服务器根据 <code>Accept-Language</code> 返回不同语言，但缓存只按 URL 复用响应：</p>
<ol>
<li>第一个用户请求 <code>/help</code>，偏好中文，缓存保存中文内容。</li>
<li>第二个用户请求同一个 URL，偏好英文。</li>
<li>缓存认为地址相同，就直接把中文交给第二个用户。</li>
</ol>
<p>如果响应会根据该请求头改变，应发送：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Language: zh-CN
Cache-Control: public, max-age=300
Vary: Accept-Language
</code></pre></div>
<p><code>Vary</code> 告诉缓存：重用这个响应时，除了通常的缓存键，还要核对影响表示选择的请求头。它不是告诉缓存“看看响应里的 Content-Language 是否相同”，而是声明选择时使用了哪些<strong>请求头</strong>。</p>
<p>若还根据 <code>Accept-Encoding</code> 压缩、根据 <code>Accept</code> 选择媒体类型，就要把相应维度也正确反映出来。代理/CDN 可能有额外的缓存键配置、归一化规则和支持范围，不能只看源站写了 Vary 就假定整条链路一定按预期工作。</p>
<p>Vary 也不负责登录隔离。私有资料不应因为增加 <code>Vary: Cookie</code> 就放心进入公共缓存；应先明确 private、no-store 等策略和共享缓存限制。不同用户返回不同敏感内容，是安全设计问题，不只是多一个缓存维度。</p>
<h2>变体越多，缓存越容易被切碎</h2>
<p><code>Accept-Language</code> 可能有许多不同排序和 q 值。如果每种字符串都形成单独的缓存变体，即使最终只提供中文和英文，也可能产生大量重复内容。<code>Vary: User-Agent</code> 更容易因客户端版本差异导致低命中率。</p>
<p>因此只把真正影响表示选择的头加入 Vary，不要把所有请求头都列进去。需要归一化语言或设备类别时，应由了解协商规则的服务端/CDN 实现，并保证缓存选择规则和实际响应一致。</p>
<p>对于长期可链接的页面，显式使用 <code>/zh-CN/help/</code>、<code>/en/help/</code> 可能更容易维护、缓存和分享；用户偏好可以用于首次选择或跳转，不必让同一 URL 永远隐式代表多种语言。图片也可以通过 <code>&lt;picture&gt;</code>、<code>srcset</code> 给浏览器选择明确资源地址，而不是所有格式都靠服务器猜测。</p>
<h2>压缩、验证器和前端读取的边界</h2>
<p>浏览器通常自动发送 <code>Accept-Encoding</code> 并处理支持的内容解码，脚本不能像在任意 HTTP 客户端中那样自由设置这个受控请求头。因此网络传输的压缩字节数，与 <code>response.text()</code> 得到的字符串长度不是同一个量。</p>
<p>不同表示的验证器也要匹配实际字节和语义。例如强 ETag 用于判断表示数据是否相同，不能给两份不同的编码字节随便复用同一个强标签。否则条件请求、范围下载或缓存验证可能作出错误判断。与语言、格式有关的 Vary 规则在后续验证响应中也要保持一致。</p>
<p>排查“接口偶尔返回错误格式”时，可以对比完整请求的 Accept 系列头、实际 Content-Type、Content-Encoding、Content-Language、Vary，以及 CDN 的缓存行为。仅把浏览器缓存清空一次，可能暂时绕过错误，却没有修复变体被混用的原因。</p>`};export{e as default};