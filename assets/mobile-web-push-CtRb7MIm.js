var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户关掉了外卖网站的页面，订单状态变了，手机上还是弹出一条通知，这就是 Web Push。它分三方：浏览器、你的应用服务器，以及浏览器厂商提供的推送服务。页面在 Service Worker 注册好以后调用 <code>registration.pushManager.subscribe()</code>，拿到一个订阅对象，里面有推送服务的 <code>endpoint</code> 地址和加密用的密钥，把它发给自己的服务器保存。</p>
<p>服务器要发消息时，用订阅里的密钥加密内容，再向 <code>endpoint</code> 发请求。VAPID 是服务器向推送服务证明“我是谁”的办法：订阅时页面传入服务器的公钥 <code>applicationServerKey</code>，之后服务器每次发消息都带一个用对应私钥签名的 JWT，推送服务只接受这台服务器发来的消息。</p>
<p>消息到达后，浏览器会在需要时启动 Service Worker，触发 <code>push</code> 事件。页面不用开着，Service Worker 在事件里读出数据，用 <code>event.waitUntil()</code> 包住 <code>registration.showNotification()</code> 把通知显示出来。</p>
<p>要注意三点。<code>subscribe()</code> 要在用户点击之类的操作里调用，Chrome 和 Edge 还要求 <code>userVisibleOnly: true</code>。<code>endpoint</code> 本身就是发消息的凭证，要当作机密保存。iOS 和 iPadOS 从 16.4 开始支持，但只对添加到主屏幕的网页应用有效。</p>
</blockquote>
<h2>三方各做什么</h2>
<p>先把参与者分清，后面的代码就好懂了。</p>
<p>浏览器负责向用户申请权限、生成订阅、收到消息后唤醒 Service Worker。推送服务由浏览器厂商运营，订阅里的 <code>endpoint</code> 就是它的一个地址，你的服务器只和它通信，不直接连用户的设备。应用服务器是你自己的后端，保存订阅，需要时发消息。</p>
<p>MDN 对 Push API 的描述是：应用要接收推送消息，必须有一个处于激活状态的 Service Worker；不管页面是否在前台，甚至没有打开，消息都能送达。所以 Web Push 建立在 Service Worker 之上，Service Worker 的注册和更新可以看<a href="/questions/mobile-serviceworker/">《Service Worker 的安装、激活与缓存更新有哪些坑？》</a>。</p>
<h2>第一步：在页面里订阅</h2>
<p>订阅要在用户点击按钮后发起。MDN 的说法是，这不只是好的做法，浏览器也会明确禁止不是由用户操作触发的通知，Firefox 从 72 版起已经这样做了。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">subscribeButton.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> registration = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-property">ready</span>;
  <span class="hljs-keyword">const</span> subscription = <span class="hljs-keyword">await</span> registration.<span class="hljs-property">pushManager</span>.<span class="hljs-title function_">subscribe</span>({
    <span class="hljs-attr">userVisibleOnly</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">applicationServerKey</span>: <span class="hljs-variable constant_">VAPID_PUBLIC_KEY</span>,
  });

  <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/push/subscriptions&#x27;</span>, {
    <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
    <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
    <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(subscription),
  });
});
</code></pre></div>
<p><code>userVisibleOnly: true</code> 表示这个订阅只用于“效果对用户可见”的消息，实际做法就是每条消息都显示通知。MDN 注明 Chrome 和 Edge 在没有设成 <code>true</code> 时会拒绝这个 Promise，所以实际上都要写。</p>
<p><code>applicationServerKey</code> 是服务器的 VAPID 公钥，MDN 的说明是一个 ECDSA P-256 公钥，可以是 Base64 字符串或 <code>ArrayBuffer</code>。设置以后，服务器发来的所有消息都必须带上用对应私钥签名的 JWT。MDN 还特别提醒，这把公钥和加密消息内容用的 ECDH 密钥不是同一个。</p>
<p>为什么可以直接 <code>JSON.stringify(subscription)</code>？因为 <code>PushSubscription</code> 有 <code>toJSON()</code> 方法，<code>JSON.stringify</code> 会自动调用它，得到包含 <code>endpoint</code>、<code>expirationTime</code> 和 <code>keys</code>（其中有 <code>p256dh</code> 和 <code>auth</code>）的普通对象。如果自己用 <code>getKey(&#x27;p256dh&#x27;)</code> 去取，拿到的是 <code>ArrayBuffer</code>，直接序列化会变成 <code>{}</code>，服务器就收不到密钥。</p>
<h2>VAPID 公钥常见的格式问题</h2>
<p>服务端工具生成的 VAPID 公钥通常是 base64url 字符串，也就是用 <code>-</code> 和 <code>_</code> 代替 <code>+</code> 和 <code>/</code>，并去掉末尾的 <code>=</code>。很多示例会把它先转成 <code>Uint8Array</code> 再传给 <code>applicationServerKey</code>。下面这个转换函数可以单独运行，看看转换结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">toStandardBase64</span>(<span class="hljs-params">base64String</span>) {
  <span class="hljs-keyword">const</span> padding = <span class="hljs-string">&#x27;=&#x27;</span>.<span class="hljs-title function_">repeat</span>((<span class="hljs-number">4</span> - (base64String.<span class="hljs-property">length</span> % <span class="hljs-number">4</span>)) % <span class="hljs-number">4</span>);
  <span class="hljs-keyword">return</span> (base64String + padding).<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/-/g</span>, <span class="hljs-string">&#x27;+&#x27;</span>).<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/_/g</span>, <span class="hljs-string">&#x27;/&#x27;</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">urlBase64ToUint8Array</span>(<span class="hljs-params">base64String</span>) {
  <span class="hljs-keyword">const</span> raw = <span class="hljs-title function_">atob</span>(<span class="hljs-title function_">toStandardBase64</span>(base64String));
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Uint8Array</span>.<span class="hljs-title function_">from</span>(raw, <span class="hljs-function">(<span class="hljs-params">char</span>) =&gt;</span> char.<span class="hljs-title function_">charCodeAt</span>(<span class="hljs-number">0</span>));
}

<span class="hljs-keyword">const</span> bytes = <span class="hljs-title function_">urlBase64ToUint8Array</span>(<span class="hljs-string">&#x27;BAEC_-8&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toStandardBase64</span>(<span class="hljs-string">&#x27;BAEC_-8&#x27;</span>)); <span class="hljs-comment">// BAEC/+8=</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes.<span class="hljs-property">length</span>); <span class="hljs-comment">// 5</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 4,1,2,255,239</span>
</code></pre></div>
<p><code>&#x27;BAEC_-8&#x27;</code> 只是演示用的短字符串。转换分两步：先补齐 <code>=</code> 让长度是 4 的倍数，再把 <code>-</code>、<code>_</code> 换回标准 Base64 的 <code>+</code>、<code>/</code>，然后用 <code>atob</code> 解码成字节。真实的公钥要长得多，RFC 8292 规定它是 P-256 公钥的未压缩形式。</p>
<h2>第二步：服务器用 VAPID 签名后发消息</h2>
<p>RFC 8292 定义了 VAPID。服务器持有一对 ECDSA P-256 密钥，算法标识是 ES256。每次向 <code>endpoint</code> 发消息，服务器生成一个 JWT，其中 <code>aud</code> 必须是 <code>endpoint</code> 的源，<code>exp</code> 不能超过请求时间之后 24 小时，<code>sub</code> 建议写一个 <code>mailto:</code> 或 <code>https:</code> 的联系地址。JWT 放在请求头里：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">Authorization: vapid t=&lt;JWT&gt;, k=&lt;base64url 编码的公钥&gt;
</code></pre></div>
<p>RFC 8292 说明了这样做的两个目的。一是服务器可以主动向推送服务表明身份。二是订阅一旦绑定了公钥，推送服务就必须拒绝没有有效 VAPID 签名的消息，别人拿到 <code>endpoint</code> 也不能冒充你发消息。</p>
<p>消息内容本身还要用订阅里的 <code>p256dh</code> 和 <code>auth</code> 加密。实际开发中，签名和加密一般交给服务端的 Web Push 库完成，前端要做的是把完整的订阅对象交给服务器。</p>
<h2>第三步：Service Worker 处理 push 事件</h2>
<p>消息到达后，浏览器会在需要时启动 Service Worker，并派发 <code>push</code> 事件。MDN 说明这个事件只在 Service Worker 里可用，<code>event.data</code> 是 <code>PushMessageData</code>，可以用 <code>json()</code> 读出服务器发的数据。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sw.js</span>
<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;push&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> data = event.<span class="hljs-property">data</span> ? event.<span class="hljs-property">data</span>.<span class="hljs-title function_">json</span>() : {};

  event.<span class="hljs-title function_">waitUntil</span>(
    <span class="hljs-variable language_">self</span>.<span class="hljs-property">registration</span>.<span class="hljs-title function_">showNotification</span>(data.<span class="hljs-property">title</span> ?? <span class="hljs-string">&#x27;新消息&#x27;</span>, {
      <span class="hljs-attr">body</span>: data.<span class="hljs-property">body</span>,
      <span class="hljs-attr">data</span>: { <span class="hljs-attr">url</span>: data.<span class="hljs-property">url</span> },
    }),
  );
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;notificationclick&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-property">notification</span>.<span class="hljs-title function_">close</span>();
  event.<span class="hljs-title function_">waitUntil</span>(clients.<span class="hljs-title function_">openWindow</span>(event.<span class="hljs-property">notification</span>.<span class="hljs-property">data</span>.<span class="hljs-property">url</span>));
});
</code></pre></div>
<p>为什么要用 <code>event.waitUntil()</code> 包住 <code>showNotification()</code>？因为 Service Worker 处理完事件就可能被浏览器停掉。MDN 对 <code>waitUntil()</code> 的解释是，它告诉浏览器还有工作在进行，在传入的 Promise 完成前不要终止 Service Worker。不包的话，通知可能还没显示出来，Service Worker 就被回收了。</p>
<p><code>notificationclick</code> 处理用户点击通知，这里用 <code>clients.openWindow()</code> 打开消息对应的页面。MDN 说明 <code>openWindow()</code> 需要本源的某个窗口有临时用户激活，Firefox 只允许在通知点击事件里打开窗口，所以打开页面的逻辑放在 <code>notificationclick</code> 里。</p>
<h2>订阅失效和安全</h2>
<p>订阅不是永久有效的。<code>PushSubscription.expirationTime</code> 是订阅的过期时间，没有就为 <code>null</code>。推送服务让订阅失效或即将失效时，Service Worker 会收到 <code>pushsubscriptionchange</code> 事件，这时要重新订阅，并把新订阅发给服务器。用户想关闭通知时，调用 <code>subscription.unsubscribe()</code>，服务器也要删掉对应的记录。</p>
<p>MDN 在安全方面提醒了两点。第一，<code>endpoint</code> 是一个能力 URL，知道它就能向你的应用发消息，所以要保密。第二，实现订阅接口时要防范 CSRF，否则别人可以诱导用户提交伪造的订阅。</p>
<h2>各平台支持到什么程度</h2>
<p>MDN 把 Push API 标为 Baseline Widely available，从 2023 年 3 月起在主流浏览器都可用。</p>
<p>iOS 和 iPadOS 的情况要单独说。WebKit 官方博客介绍，iOS 和 iPadOS 16.4 加入了 Web Push，但只面向添加到主屏幕的网页应用；网页要提供 manifest，并把 <code>display</code> 设成 <code>standalone</code> 或 <code>fullscreen</code>；申请权限必须响应用户的直接操作；用的是 Push API、Notifications API 和 Service Worker 这套 W3C 标准，不需要加入 Apple 开发者计划。</p>
<p>所以在 iPhone 的 Safari 标签页里，<code>subscribe()</code> 是用不了的，要先引导用户添加到主屏幕。功能检测可以像<a href="/questions/mobile-pwa/">《PWA 由哪些能力组成，是否所有浏览器体验都一致？》</a>里那样，先判断 <code>&#x27;serviceWorker&#x27; in navigator</code> 和 <code>&#x27;PushManager&#x27; in window</code>，检测到了再显示订阅按钮。</p>
<h2>常见追问</h2>
<p><strong>为什么不在页面加载时直接请求通知权限？</strong></p>
<blockquote>
<p>用户还不知道你要推什么就被弹窗打断，体验不好，浏览器也在限制这种行为。MDN 提到 Firefox 72 起不允许不是由用户操作触发的通知，iOS 也要求响应用户的直接操作。更好的做法是在用户关心的地方放一个按钮，比如“订单状态变化时通知我”，点击后再调用 <code>subscribe()</code>。</p>
</blockquote>
<p><strong>endpoint 泄露了会怎样？VAPID 能防住吗？</strong></p>
<blockquote>
<p><code>endpoint</code> 是推送服务给这个订阅的地址，知道它就能尝试发消息，所以 MDN 要求保密。订阅时如果传了 <code>applicationServerKey</code>，RFC 8292 要求推送服务拒绝没有有效 VAPID 签名的消息，别人没有你的私钥就发不进来。所以 VAPID 私钥只能放在服务器上，不能出现在前端代码里。</p>
</blockquote>
<p><strong>push 事件里可以不显示通知、只在后台同步数据吗？</strong></p>
<blockquote>
<p>在 Chrome 和 Edge 里不行，它们要求订阅时设 <code>userVisibleOnly: true</code>，也就是承诺每条消息都会让用户看见。所以 <code>push</code> 事件里应该总是调用 <code>showNotification()</code>，后台更新数据可以顺带做，但不能代替通知。</p>
</blockquote>`};export{e as default};