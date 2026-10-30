var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户在小程序里点“立即支付”，小程序先把业务订单号发给自己的服务端。服务端调用微信支付的 JSAPI/小程序下单接口，拿到预支付交易会话标识 <code>prepay_id</code>，再按微信支付的签名规则算好签名，把 <code>timeStamp</code>、<code>nonceStr</code>、<code>package</code>、<code>signType</code>、<code>paySign</code> 返回给小程序。小程序用这几个参数调用 <code>wx.requestPayment</code>，拉起微信收银台。</p>
<p>金额、商品、签名都由服务端决定，是因为前端的东西用户都能改。小程序只负责拉起支付和展示结果，商户密钥和下单接口都不应该出现在前端。</p>
<p>用户付完或取消后回到小程序，<code>wx.requestPayment</code> 的回调会告诉你结果，比如 <code>requestPayment:fail cancel</code> 表示用户取消。前端拿到回调后，应该去问自己的服务端订单状态，再决定显示什么。</p>
<p>最要注意的是，微信支付文档明确说前端回调不保证绝对可靠，订单状态要以服务端的支付成功回调通知和查询订单接口为准。服务端收到回调要先验签，回调可能重复发送，处理逻辑要能重入。</p>
</blockquote>
<h2>整个流程分几步</h2>
<p>微信支付的开发指引把小程序支付分成下单、调起支付、用户支付三步，后面再加对账和退款。前后端的分工如下：</p>
<ol>
<li>小程序请求自己的服务端创建支付。服务端按业务订单查出金额，调用 <code>POST /v3/pay/transactions/jsapi</code> 下单，传入 <code>appid</code>、<code>mchid</code>、商品描述、商户订单号 <code>out_trade_no</code>、接收通知的 <code>notify_url</code>、以分为单位的金额，以及支付者的 <code>openid</code>。</li>
<li>下单成功返回 <code>prepay_id</code>。服务端用 <code>appId</code>、<code>timeStamp</code>、<code>nonceStr</code>、<code>package</code> 计算签名 <code>paySign</code>，连同这些字段返回给小程序。</li>
<li>小程序调用 <code>wx.requestPayment</code> 拉起收银台，用户完成支付或取消后回到小程序页面，收到回调。</li>
<li>用户支付成功后，微信支付向 <code>notify_url</code> 发送支付成功回调通知；小程序收到前端回调后，服务端调用查询订单接口确认状态。</li>
</ol>
<p><code>openid</code> 来自登录流程，服务端用 <code>wx.login</code> 的 code 换到它，过程见<a href="/questions/mini-login-flow/">《小程序登录流程是怎样的？wx.login、code2Session 和自定义登录态各做什么？》</a>。</p>
<h2>小程序这边要写什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">pay</span>(<span class="hljs-params">orderNo</span>) {
  <span class="hljs-keyword">const</span> params = <span class="hljs-keyword">await</span> <span class="hljs-title function_">request</span>({ <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/api/pay/prepare&#x27;</span>, <span class="hljs-attr">data</span>: { orderNo } })
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> wx.<span class="hljs-title function_">requestPayment</span>({
      <span class="hljs-attr">timeStamp</span>: params.<span class="hljs-property">timeStamp</span>,
      <span class="hljs-attr">nonceStr</span>: params.<span class="hljs-property">nonceStr</span>,
      <span class="hljs-attr">package</span>: params.<span class="hljs-property">package</span>,
      <span class="hljs-attr">signType</span>: <span class="hljs-string">&#x27;RSA&#x27;</span>,
      <span class="hljs-attr">paySign</span>: params.<span class="hljs-property">paySign</span>,
    })
  } <span class="hljs-keyword">catch</span> (err) {
    <span class="hljs-keyword">if</span> (err.<span class="hljs-property">errMsg</span> === <span class="hljs-string">&#x27;requestPayment:fail cancel&#x27;</span>) {
      <span class="hljs-comment">// 用户取消，订单保持未支付，可以让用户稍后重新支付</span>
    }
  }
  <span class="hljs-comment">// 不管回调说成功还是失败，都以服务端查到的状态为准</span>
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">request</span>({ <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/api/orders/status&#x27;</span>, <span class="hljs-attr">data</span>: { orderNo } })
}
</code></pre></div>
<p><code>wx.requestPayment</code> 支持 Promise 风格调用，所以可以 <code>await</code>。<code>package</code> 的格式是 <code>prepay_id=***</code>。<code>signType</code> 在小程序 API 文档里默认是 <code>MD5</code>，但 <code>MD5</code> 和 <code>HMAC-SHA256</code> 只适用于 v2 接口，<code>RSA</code> 只适用于 v3 接口，而微信支付 v3 文档要求这里只支持 <code>RSA</code>，所以用 v3 下单时要显式传 <code>RSA</code>。<code>timeStamp</code> 是秒级时间戳，部分系统取到的是毫秒，要转成 10 位秒数。</p>
<p>微信支付文档还提醒两点。一是签名必须用实际调起支付的小程序 <code>appid</code>，并且和下单时传入的一致，微信支付会校验。二是下单如果由前端按钮触发，按钮要做防抖，防止用户重复点击造成重复支付。</p>
<h2>为什么不能信前端回调</h2>
<p>前端回调是用户回到小程序时触发的。用户支付成功后可能马上杀掉了小程序，网络也可能刚好断开，回调就收不到；反过来，前端代码运行在用户设备上，返回的结果也可以被伪造。所以微信支付文档写明，前端回调不保证绝对可靠，不能只依赖它判断订单支付状态。</p>
<p>服务端有两个可信的来源。第一个是支付成功回调通知：用户成功支付后，微信支付用 POST 向下单时的 <code>notify_url</code> 发送通知，业务数据经过 AES-256-GCM 加密，要用 APIv3 密钥解密。第二个是查询订单接口：订单未支付时只能用商户订单号查询，返回的 <code>trade_state</code> 为 <code>SUCCESS</code> 才表示支付成功，<code>NOTPAY</code> 是未支付，<code>CLOSED</code> 是已关闭。</p>
<h2>服务端处理回调要注意什么</h2>
<p>收到回调后先验签。微信支付用请求头里的 <code>Wechatpay-Timestamp</code>、<code>Wechatpay-Nonce</code> 和请求体构造验签串，用 <code>Wechatpay-Serial</code> 对应的平台证书或微信支付公钥验证 <code>Wechatpay-Signature</code>，确认通知确实来自微信支付。文档还说，微信支付偶尔会发带错误签名的探测请求，检查商户有没有认真验签。</p>
<p>验签要在 5 秒内完成并应答：通过返回 200 或 204，不通过返回 4XX 或 5XX。文档建议应答后再异步处理更新订单这类业务，避免处理太久导致应答超时。应答失败或超时，微信支付会按递增的间隔重发，最多 15 次。即使应答成功，也可能因为网络原因收到重复通知，所以更新订单要做成幂等的，比如只在订单还是未支付时才改成已支付。</p>
<p>文档也说，商户系统不能只依赖回调通知，要结合查询接口。没收到回调时，服务端主动查单补上状态。</p>
<h2>常见追问</h2>
<p><strong>prepay_id 能一直用吗？</strong></p>
<blockquote>
<p>不能。<code>prepay_id</code> 有效期 2 小时，过期后要用原下单参数重新调用下单接口，换一个新的。订单本身如果没传支付结束时间 <code>time_expire</code>，默认 7 天内可以支付，超过就无法再支付。</p>
</blockquote>
<p><strong>用户取消支付后，订单怎么处理？</strong></p>
<blockquote>
<p>取消后订单还是未支付状态，用户可以重新发起支付。不再需要支付的订单，比如超时或用户取消了业务订单，服务端可以先查单确认仍未支付，再调用关闭订单接口，关单后按失败终态处理。</p>
</blockquote>
<p><strong>云开发能省掉哪些步骤？</strong></p>
<blockquote>
<p>小程序文档说明，使用云开发时，<code>wx.requestPayment</code> 需要的参数可以通过云开发微信支付统一下单接口免鉴权获取，调用微信支付服务端接口也可以免证书、免签名，并能接收异步支付结果回调。支付结果以服务端为准的原则不变。</p>
</blockquote>`};export{e as default};