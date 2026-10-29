var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>App 里经常嵌着网页，网页想调用拍照、分享这类原生能力，就需要一个和 App 传话的通道，这就是 JSBridge。它是双向的：网页调宿主的能力，宿主把结果或事件传回网页。这里的宿主指 App 原生代码或小程序。</p>
<p>网页调宿主常见三种方式：宿主往页面里注入一个 JS 对象，比如 Android 的 <code>addJavascriptInterface</code>；用平台提供的消息接口，比如 Android 的 <code>addWebMessageListener</code>、iOS 的 <code>window.webkit.messageHandlers</code>；或者拦截一个自定义协议的 URL。反过来，宿主调网页就是在 WebView 里执行一段 JS。两边只能传可序列化的数据，异步调用要靠回调 ID 或 Promise 把请求和响应对上。</p>
<p>微信小程序的 web-view 更受限。网页不能直接调小程序 API，只能用 JSSDK 提供的 <code>wx.miniProgram.navigateTo</code>、<code>postMessage</code> 等接口，而且 <code>postMessage</code> 的消息只在后退、组件销毁、分享等特定时机才送到。</p>
<p>安全上要把网页当成不可信的输入。只对可信页面开放 bridge，能拿到来源时逐条检查来源，只开放白名单里的能力，逐个校验参数，敏感操作再加用户确认或服务端校验。</p>
</blockquote>
<h2>网页怎样调用宿主</h2>
<p>最直接的是注入对象。Android 用 <code>webView.addJavascriptInterface(obj, &quot;bridge&quot;)</code> 把一个 Java 对象挂到页面上，网页直接调它的方法。官方文档说明了几个细节：对象会注入到页面的所有 frame，包括 iframe；目标 API 17（Android 4.2）及以上时，只有加了 <code>@JavascriptInterface</code> 注解的公共方法能被调用；注入要等到下一次页面加载后才生效；JS 的调用发生在 WebView 的后台线程上。</p>
<p>可是注入对象拿不到“是谁在调用”。所以 AndroidX 提供了带来源的消息接口 <code>WebViewCompat.addWebMessageListener(webView, &quot;bridge&quot;, allowedOriginRules, listener)</code>。它只往 origin 符合规则的 frame 里注入对象。网页调用 <code>bridge.postMessage(data)</code>，原生的 <code>onPostMessage</code> 回调能拿到 <code>sourceOrigin</code> 和 <code>isMainFrame</code>，再通过 <code>replyProxy.postMessage</code> 回复。用之前要先用 <code>WebViewFeature.isFeatureSupported(WEB_MESSAGE_LISTENER)</code> 检查支不支持。</p>
<p>iOS 用的是消息处理器。用 <code>userContentController.add(handler, name: &quot;bridge&quot;)</code> 安装一个实现了 <code>WKScriptMessageHandler</code> 的处理器，网页调用 <code>window.webkit.messageHandlers.bridge.postMessage(data)</code>，WebKit 就会回调 <code>userContentController(_:didReceive:)</code>。<code>name</code> 在同一个 <code>WKUserContentController</code> 里必须唯一，也不能为空，函数定义在页面默认的 content world，也就是 <code>WKContentWorld.page</code>。</p>
<p>收到的 <code>WKScriptMessage.body</code> 只允许 <code>NSNumber</code>、<code>NSString</code>、<code>NSDate</code>、<code>NSArray</code>、<code>NSDictionary</code>、<code>NSNull</code> 这几种类型。消息上的 <code>frameInfo</code> 表示发消息的那个 frame，可以读到 <code>isMainFrame</code> 和 <code>securityOrigin</code>，后者包含协议、主机名、端口（iOS 9+）。</p>
<p>普通处理器只能收消息，不能直接回复。iOS 14 起可以用带回复的处理器：用 <code>addScriptMessageHandler(_:contentWorld:name:)</code> 安装 <code>WKScriptMessageHandlerWithReply</code>，函数会定义在指定 content world 的所有 frame 里。原生在 <code>userContentController(_:didReceive:replyHandler:)</code> 里调用 <code>replyHandler(reply, nil)</code> 回复；出错时 <code>reply</code> 传 <code>nil</code>，再给一个错误字符串。<code>reply</code> 同样只能是上面那几种类型。不需要回复时，用 <code>WKScriptMessageHandler</code> 就够了。</p>
<p>iOS 还能预先注入脚本，在页面里提前挂好 bridge 的封装。用 <code>WKUserScript(source:injectionTime:forMainFrameOnly:)</code>：<code>atDocumentStart</code> 在文档元素创建后、其他内容加载前注入，<code>atDocumentEnd</code> 在文档加载完成后、其他子资源加载前注入；<code>forMainFrameOnly</code> 为 <code>true</code> 只注入主 frame，为 <code>false</code> 注入所有 frame。官方要求在创建 WebView 之前，就把脚本加到配置的 <code>WKUserContentController</code> 里。</p>
<p>最后一种是 URL 拦截。网页跳转一个自定义协议的地址，比如 <code>myapp://share?...</code>，宿主在导航回调里拦下来解析。这种方式受 URL 长度限制，现在多当兼容方案用。</p>
<h2>宿主怎样调用网页</h2>
<p>宿主在 WebView 里执行一段 JS，比如调用网页事先挂好的 <code>window.onNativeEvent(json)</code>。</p>
<p>Android 用 <code>evaluateJavascript(script, callback)</code>。它在当前页面上下文里异步执行，必须在 UI 线程调用，回调也在 UI 线程。iOS 用 <code>webView.evaluateJavaScript(script, completionHandler:)</code>，另外还有 async 版本。执行结束后不管成功失败都会调回调，回调总在主线程运行，参数是执行结果或错误。</p>
<p>拼脚本时要先把数据编码成 JSON，不要把字符串直接拼进代码里。否则数据里带个引号，脚本就坏了，还可能被注入代码。</p>
<h2>怎样把请求和响应对上</h2>
<p>消息接口大多是“发出去就不管”的。网页同时发了好几个请求，宿主回来的结果要知道是哪一个的。常见做法是给每次调用分配一个 ID：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 网页侧：给每次调用分配 ID，宿主处理完后按 ID 回调</span>
<span class="hljs-keyword">const</span> pending = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">let</span> seq = <span class="hljs-number">0</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">callNative</span>(<span class="hljs-params">method, params</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> id = ++seq;
    pending.<span class="hljs-title function_">set</span>(id, { resolve, reject });
    <span class="hljs-variable language_">window</span>.<span class="hljs-property">webkit</span>.<span class="hljs-property">messageHandlers</span>.<span class="hljs-property">bridge</span>.<span class="hljs-title function_">postMessage</span>({ id, method, params });
  });
}

<span class="hljs-comment">// 宿主执行 window.__bridgeReply({ id, error, result }) 回传结果</span>
<span class="hljs-variable language_">window</span>.<span class="hljs-property">__bridgeReply</span> = <span class="hljs-function">(<span class="hljs-params">{ id, error, result }</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> task = pending.<span class="hljs-title function_">get</span>(id);
  <span class="hljs-keyword">if</span> (!task) <span class="hljs-keyword">return</span>;
  pending.<span class="hljs-title function_">delete</span>(id);
  error ? task.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(error)) : task.<span class="hljs-title function_">resolve</span>(result);
};
</code></pre></div>
<p><code>callNative</code> 把 <code>resolve</code> 和 <code>reject</code> 按 ID 存进 <code>pending</code>，宿主处理完调用 <code>__bridgeReply</code> 带回同一个 ID，就能找到对应的 Promise。</p>
<p>实际项目里还要加超时，清理一直没回的 <code>pending</code>。另外网页如果是在普通浏览器里打开的，宿主根本不存在，也要给出降级。</p>
<h2>小程序 web-view 有哪些限制</h2>
<p>web-view 加载的网页，要先在小程序管理后台配置业务域名，个人类型的小程序暂不支持。</p>
<p>网页引入 JSSDK 以后，只能用 <code>wx.miniProgram.navigateTo</code>、<code>navigateBack</code>、<code>switchTab</code>、<code>reLaunch</code>、<code>redirectTo</code>、<code>postMessage</code>、<code>getEnv</code> 等接口，以及部分 JSSDK 能力，比如图片、定位、扫一扫。</p>
<p>最容易踩坑的是 <code>wx.miniProgram.postMessage</code>，它不会实时送到。组件的 <code>bindmessage</code> 只在小程序后退、组件销毁、分享、复制链接这些时机才触发，<code>e.detail.data</code> 是多次消息组成的数组。所以需要实时交互时，常见做法是让网页跳转到小程序页面，或者通过服务端中转。</p>
<p>网页可以用 <code>window.__wxjs_environment === &#x27;miniprogram&#x27;</code> 或 <code>wx.miniProgram.getEnv</code> 判断自己是不是跑在小程序里。</p>
<h2>安全上要校验什么</h2>
<p>WebView 里可能加载第三方页面、广告 iframe，页面本身也可能有 XSS。只要 bridge 对所有页面开放，攻击者就能调用宿主的能力。所以要从下面几方面收紧。</p>
<p>先是校验来源。能拿到调用方来源时，就检查发起调用的页面或 frame 的 origin 在不在白名单里。</p>
<p><code>addJavascriptInterface</code> 会注入到所有 frame，回调里又拿不到调用方的 origin，所以只能靠控制加载哪些页面来限制，比如只加载白名单地址、拦截跳转。需要按来源区分时，改用 <code>addWebMessageListener</code>：用 <code>allowedOriginRules</code> 限定注入范围，官方建议只用 HTTPS 规则，通配符 <code>*</code> 会注入所有 frame，这时消息要当成不可信数据处理；然后在 <code>onPostMessage</code> 里再检查 <code>sourceOrigin</code> 和 <code>isMainFrame</code>。</p>
<p>iOS 在处理器里检查 <code>message.frameInfo.isMainFrame</code>，以及 <code>message.frameInfo.securityOrigin</code> 的协议、主机名、端口。<code>WKUserScript</code> 不需要进 iframe 时，设 <code>forMainFrameOnly: true</code>。</p>
<p>比较来源时，只比 URL 前缀是不够的，<code>https://trusted.com.evil.com</code> 这样的地址就能绕过。应该先解析，再比较协议和主机名。</p>
<p>然后是最小能力。按页面来源开放不同的方法集合，不要提供“执行任意命令”“读写任意文件”这种通用方法。</p>
<p>参数也要逐一校验：类型、长度、枚举值都要查；文件路径、跳转地址同样按白名单检查。</p>
<p>敏感操作要二次确认。支付、获取手机号这类操作，由宿主弹出原生确认框，关键结果以服务端校验为准，不要相信网页传回来的“已支付”。</p>
<p>最后是限制导航。WebView 只允许跳转到白名单域名，防止页面被导航到恶意站点以后，继续使用 bridge。</p>
<p>Electron 里的 preload 和 IPC 是同一类问题，见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎么判断 bridge 是否已就绪？</strong></p>
<blockquote>
<p>宿主注入通常有时间差。可以让宿主在注入完成后派发一个自定义事件，网页监听到这个事件再调用。在微信 web-view 里，可以监听 <code>WeixinJSBridgeReady</code>。</p>
</blockquote>
<p><strong>addJavascriptInterface 在旧系统上有什么风险？</strong></p>
<blockquote>
<p>官方文档指出，目标 API 16（Android 4.1）及以下的应用，或者运行在 Android 4.2 以下设备上的应用，页面 JS 可以通过反射访问注入的对象，以宿主的权限执行 Java 代码。所以包含不可信内容的 WebView 要格外小心。</p>
</blockquote>
<p><strong>用 prompt、alert 拦截来通信可以吗？</strong></p>
<blockquote>
<p>早期有人这么做，但它会和真正的弹窗冲突，而且是同步的，会卡住页面。应该优先用平台提供的消息接口。</p>
</blockquote>`};export{e as default};