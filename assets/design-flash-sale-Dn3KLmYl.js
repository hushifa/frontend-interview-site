var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>双十一零点开抢 100 台手机，几十万人同时盯着按钮。前端能做的不是“扛住”这些请求，而是让请求少发、发得准、失败了也让用户知道怎么回事。真正决定谁抢到的库存扣减和限流，必须在服务端完成。</p>
<p>少发请求靠两件事。活动页做成静态页面放到 CDN，商品图片、描述这些不变的内容不再打到源站，只把库存、资格这类动态数据单独请求。按钮点击后立即置灰，在请求返回前不能再点，防止一个人连点发出十几个请求。</p>
<p>发得准靠倒计时校准。本机时钟可能快几秒，如果按本机时间开放按钮，用户会提前点、拿到“未开始”的错误。所以要用接口往返估算和服务端的时间差，按服务端时间判断开没开始；真正的下单地址也最好在开抢时才从服务端拿到，不提前写在页面里。</p>
<p>失败时，服务端返回 429 或排队状态，前端要显示“排队中”而不是“系统错误”，并按 <code>Retry-After</code> 或带随机抖动的间隔重试，避免所有人在同一毫秒再次涌进来。要注意，前端的置灰、隐藏地址都能被绕过，只能减少无效请求，不能当作安全措施。</p>
</blockquote>
<h2>先看整体：前端负责哪几层</h2>
<p>一次秒杀请求从用户到数据库，要经过 CDN、网关、业务服务和库存服务。前端位于最外层，能做的是在请求出发前把无效的部分过滤掉：</p>
<ol>
<li>页面和静态资源走 CDN，源站只处理动态接口。</li>
<li>开抢前按钮不可点，开抢时间以服务端为准。</li>
<li>每个用户同一时刻只有一个下单请求在路上。</li>
<li>被限流或排队时，有节制地重试，并告诉用户当前状态。</li>
</ol>
<p>后端常见的手段，比如网关限流、请求排队、库存预扣、下单异步化，前端不需要实现，但要能正确处理它们返回的状态。</p>
<h2>倒计时怎样以服务端时间为准</h2>
<p>下面这个函数根据“当前时间”判断活动状态。关键在于传进来的 <code>now</code> 是本机时间加上与服务端的时间差，而不是直接用 <code>Date.now()</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getSaleState</span>(<span class="hljs-params">now, startAt, endAt</span>) {
  <span class="hljs-keyword">if</span> (now &lt; startAt) <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;waiting&#x27;</span>, <span class="hljs-attr">remainMs</span>: startAt - now };
  <span class="hljs-keyword">if</span> (now &lt; endAt) <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;open&#x27;</span>, <span class="hljs-attr">remainMs</span>: endAt - now };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;ended&#x27;</span>, <span class="hljs-attr">remainMs</span>: <span class="hljs-number">0</span> };
}

<span class="hljs-keyword">const</span> startAt = <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;2026-11-11T00:00:00+08:00&#x27;</span>);
<span class="hljs-keyword">const</span> endAt = startAt + <span class="hljs-number">10</span> * <span class="hljs-number">60</span> * <span class="hljs-number">1000</span>;
<span class="hljs-keyword">const</span> offset = <span class="hljs-number">1500</span>; <span class="hljs-comment">// 服务端比本机快 1.5 秒</span>
<span class="hljs-keyword">const</span> localNow = startAt - <span class="hljs-number">3000</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getSaleState</span>(localNow, startAt, endAt));          <span class="hljs-comment">// { state: &#x27;waiting&#x27;, remainMs: 3000 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getSaleState</span>(localNow + offset, startAt, endAt)); <span class="hljs-comment">// { state: &#x27;waiting&#x27;, remainMs: 1500 }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getSaleState</span>(startAt + <span class="hljs-number">1</span>, startAt, endAt).<span class="hljs-property">state</span>);  <span class="hljs-comment">// open</span>
</code></pre></div>
<p>同一时刻，只看本机时间会以为还剩 3 秒，校准后其实只剩 1.5 秒。如果不校准，这个用户会比别人晚 1.5 秒看到按钮可点。反过来，本机时钟快的用户会提前点击，白白发出一批注定失败的请求。</p>
<p>时间差怎样通过接口往返估算、倒计时为什么不能用 <code>setInterval</code> 每秒减一，见<a href="/questions/design-countdown/">《前端倒计时为什么会走慢？怎样用服务端时间校准？》</a>。临近开抢时可以再校准一次，减少长时间停留在页面上带来的误差。</p>
<p>还要注意，开抢前就算按钮置灰，接口地址写在页面里，有人照样能用脚本直接调用。所以常见做法是开抢时再向服务端请求一个本场活动的下单凭证或地址，服务端在活动开始前不发放。这只是提高了门槛，服务端仍要自己校验活动时间。</p>
<h2>按钮怎样防重复点击</h2>
<p>秒杀场景里，用户会疯狂点击按钮。如果每次点击都发请求，一个人就能发出十几个下单请求。</p>
<p>做法是点击后立即把按钮置灰，并记录“正在提交”的状态，请求返回前忽略后续点击；请求失败后再恢复。这里用的是“请求进行中锁定”，而不是固定时长的防抖：防抖要等用户停止点击后才执行，会让真正的第一次点击延迟发出，在秒杀里是吃亏的。按钮锁定、请求去重和幂等键的具体写法，见<a href="/questions/design-prevent-duplicate/">《前端怎样防止重复提交和接口重复请求？》</a>。</p>
<p>服务端仍要用幂等键或“每人限购一件”这样的约束兜底，因为用户可以开多个标签页，或者绕过页面直接发请求。</p>
<h2>静态化和 CDN 怎样减轻源站压力</h2>
<p>活动开始前的几分钟，大量用户反复刷新页面。如果每次刷新都打到源站，服务还没开抢就已经很吃力了。</p>
<p>所以把活动页拆成两部分。商品图片、描述、活动规则这些对所有人都一样的内容，构建成静态 HTML 和带哈希的资源，放到 CDN 上长期缓存。库存、用户是否有资格、活动状态这些动态数据，通过单独的接口获取，接口返回很小的 JSON。</p>
<p>库存数字不需要完全实时。显示“仅剩少量”或者每隔几秒刷新一次就够了，真正能不能买到以下单结果为准。CDN 缓存怎样设置、带哈希的文件为什么能长期缓存，见<a href="/questions/network-cdn/">《CDN 的原理是什么？前端怎样用好 CDN？》</a>。</p>
<h2>被限流和排队时前端怎样处理</h2>
<p>服务端扛不住时会限流。MDN 对 429 的说明是：客户端在一段时间内发送了太多请求，这种让客户端放慢速度的机制叫限流；响应里可以带 <code>Retry-After</code> 头，告诉客户端等多久再请求。<code>Retry-After</code> 可以是秒数，也可以是一个 HTTP 日期。</p>
<p>前端处理分三种情况：</p>
<ul>
<li>收到 429 且有 <code>Retry-After</code>，就按它给的时间等待后重试，并显示“当前人数过多，正在排队”。</li>
<li>没有 <code>Retry-After</code>，用指数退避加随机抖动：每次等待时间翻倍，再加一个随机量。随机量让不同用户的重试时间错开，避免所有人在同一时刻再次涌入。这里的随机数只用于错开时间，用 <code>Math.random()</code> 就够了；MDN 提醒它不是密码学安全的，不能用于任何安全相关的地方。</li>
<li>服务端返回“已进入队列”的业务状态，前端轮询或通过 WebSocket 等待结果，界面显示排队中，不要让用户以为卡死了而刷新页面重来。</li>
</ul>
<p>重试要有上限。超过次数或者活动已经结束，就明确告诉用户“已抢完”或“活动结束”，而不是一直转圈。</p>
<h2>常见追问</h2>
<p><strong>前端把按钮隐藏到开抢时才显示，能防止刷单吗？</strong></p>
<blockquote>
<p>不能。页面上的逻辑、接口地址都能被查看和绕过，脚本可以直接调用接口。前端做的这些只能减少普通用户的无效请求，防刷要靠服务端的限流、风控、验证码和每人限购等措施。</p>
</blockquote>
<p><strong>库存数字为什么不实时推送？</strong></p>
<blockquote>
<p>几十万人同时在线时，实时推送库存本身就是很大的开销，而且显示的数字转瞬就会过时。对用户来说，“还有货、快没了、已抢完”这几种状态就够用，最终结果以下单接口为准。</p>
</blockquote>
<p><strong>秒杀页面需要服务端渲染吗？</strong></p>
<blockquote>
<p>通常不需要个性化的 SSR。活动页内容对所有人一样，预先生成静态页面放到 CDN 上更能扛住流量；个性化的部分，比如用户资格和下单结果，用接口单独获取。</p>
</blockquote>`};export{e as default};