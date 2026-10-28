var e={answerHtml:`<h2>简答</h2>
<ul>
<li>JSBridge 是 WebView 中网页 JS 与宿主（App 原生代码或小程序）之间的通信层：网页调用宿主能力，宿主把结果或事件回传给网页。</li>
<li>网页调宿主常见三种方式：宿主注入的 JS 对象（Android <code>addJavascriptInterface</code>）、平台提供的消息接口（Android <code>addWebMessageListener</code>、iOS <code>window.webkit.messageHandlers</code>，iOS 14+ 可用带回复的处理器）、拦截自定义协议 URL；宿主调网页则在 WebView 中执行一段 JS（Android <code>evaluateJavascript</code>、iOS <code>evaluateJavaScript</code>）。</li>
<li>两边只能传可序列化的数据，异步调用要用回调 ID 或 Promise 把请求和响应对应起来。</li>
<li>微信小程序的 web-view 不能直接调用小程序 API，只能用 JSSDK 提供的 <code>wx.miniProgram.navigateTo</code>、<code>postMessage</code> 等接口，<code>postMessage</code> 的消息也只在后退、组件销毁、分享等特定时机送达。</li>
<li>安全上要把网页当作不可信输入：宿主只在可信页面开放 bridge，能拿到来源时（Android <code>sourceOrigin</code>、iOS <code>frameInfo.securityOrigin</code>）逐条检查，只开放白名单能力、逐个校验参数，敏感操作再经过用户确认或服务端校验。</li>
</ul>
<h2>通信的两个方向</h2>
<p><strong>网页调用宿主</strong>：</p>
<ul>
<li>注入对象：Android 用 <code>webView.addJavascriptInterface(obj, &quot;bridge&quot;)</code> 把 Java 对象挂到页面上，网页直接调用它的方法。官方文档说明：对象会注入到页面的所有 frame（包括 iframe）；目标 API 17（Android 4.2）及以上时只有加了 <code>@JavascriptInterface</code> 注解的公共方法可调用；注入要到下一次页面加载后才生效；JS 调用发生在 WebView 的后台线程上。</li>
<li>带来源的消息接口：AndroidX 的 <code>WebViewCompat.addWebMessageListener(webView, &quot;bridge&quot;, allowedOriginRules, listener)</code> 只向 origin 匹配规则的 frame 注入对象，网页调用 <code>bridge.postMessage(data)</code>，原生回调 <code>onPostMessage</code> 会拿到 <code>sourceOrigin</code>、<code>isMainFrame</code>，并通过 <code>replyProxy.postMessage</code> 回复。使用前要用 <code>WebViewFeature.isFeatureSupported(WEB_MESSAGE_LISTENER)</code> 检查。</li>
<li>消息处理器：iOS 用 <code>userContentController.add(handler, name: &quot;bridge&quot;)</code> 安装实现 <code>WKScriptMessageHandler</code> 的处理器，网页调用 <code>window.webkit.messageHandlers.bridge.postMessage(data)</code>，WebKit 回调 <code>userContentController(_:didReceive:)</code>。<code>name</code> 在同一个 <code>WKUserContentController</code> 内必须唯一且不能为空，函数定义在页面的默认 content world（<code>WKContentWorld.page</code>）。收到的 <code>WKScriptMessage.body</code> 只允许 <code>NSNumber</code>、<code>NSString</code>、<code>NSDate</code>、<code>NSArray</code>、<code>NSDictionary</code>、<code>NSNull</code>；<code>frameInfo</code> 是发消息的 frame，可读取 <code>isMainFrame</code> 和 <code>securityOrigin</code>（协议、主机名、端口；iOS 9+）。</li>
<li>带回复的消息处理器（iOS 14+）：用 <code>addScriptMessageHandler(_:contentWorld:name:)</code> 安装 <code>WKScriptMessageHandlerWithReply</code>，函数会定义在指定 content world 的所有 frame 中。原生在 <code>userContentController(_:didReceive:replyHandler:)</code> 里调用 <code>replyHandler(reply, nil)</code> 回复，出错时 <code>reply</code> 传 <code>nil</code> 并给出错误字符串；<code>reply</code> 同样限于上述几种类型。不需要回复时用 <code>WKScriptMessageHandler</code> 即可。</li>
<li>预先注入脚本：iOS 的 <code>WKUserScript(source:injectionTime:forMainFrameOnly:)</code> 可以在页面里先挂好 bridge 封装。<code>atDocumentStart</code> 在文档元素创建后、其他内容加载前注入，<code>atDocumentEnd</code> 在文档加载完成后、其他子资源加载前注入；<code>forMainFrameOnly</code> 为 <code>true</code> 只注入主 frame，为 <code>false</code> 注入所有 frame。官方要求在创建 WebView 之前把脚本加到配置的 <code>WKUserContentController</code> 中。</li>
<li>URL 拦截：网页跳转一个自定义协议地址（如 <code>myapp://share?...</code>），宿主在导航回调中拦截并解析。这种方式受 URL 长度限制，现在多作为兼容方案。</li>
</ul>
<p><strong>宿主调用网页</strong>：宿主在 WebView 中执行 JS，例如调用网页事先挂好的 <code>window.onNativeEvent(json)</code>。Android 用 <code>evaluateJavascript(script, callback)</code>，它在当前页面上下文中异步执行，必须在 UI 线程调用，回调也在 UI 线程。iOS 用 <code>webView.evaluateJavaScript(script, completionHandler:)</code>（另有 async 版本），执行结束后无论成功或失败都会调用回调，回调总在主线程运行，参数是执行结果或错误。拼接脚本时要把数据先编码成 JSON，不要直接把字符串拼进代码。</p>
<h2>一个最小的请求-响应封装</h2>
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
<p>实际项目还需要超时清理 <code>pending</code>，并在宿主不存在时（普通浏览器里打开）给出降级。</p>
<h2>小程序 web-view 的边界</h2>
<ul>
<li>web-view 加载的网页要在小程序管理后台配置业务域名，个人类型小程序暂不支持。</li>
<li>网页引入 JSSDK 后，只能使用 <code>wx.miniProgram.navigateTo</code>、<code>navigateBack</code>、<code>switchTab</code>、<code>reLaunch</code>、<code>redirectTo</code>、<code>postMessage</code>、<code>getEnv</code> 等接口，以及部分 JSSDK 能力（如图片、定位、扫一扫）。</li>
<li><code>wx.miniProgram.postMessage</code> 不会实时送达，组件的 <code>bindmessage</code> 只在小程序后退、组件销毁、分享、复制链接等时机触发，<code>e.detail.data</code> 是多次消息组成的数组。需要实时交互时，常见做法是让网页跳转到小程序页面，或通过服务端中转。</li>
<li>网页可以通过 <code>window.__wxjs_environment === &#x27;miniprogram&#x27;</code> 或 <code>wx.miniProgram.getEnv</code> 判断自己是否运行在小程序中。</li>
</ul>
<h2>安全校验</h2>
<p>WebView 里可能加载第三方页面、广告 iframe，或者页面存在 XSS。只要 bridge 对所有页面开放，攻击者就能调用宿主能力。</p>
<ul>
<li><strong>校验来源</strong>：能拿到调用方来源时，检查发起页面或 frame 的 origin 是否在白名单内。<code>addJavascriptInterface</code> 注入到所有 frame，回调里拿不到调用方 origin，只能靠控制加载的页面（只加载白名单地址、拦截跳转）来限制。需要按来源区分时改用 <code>addWebMessageListener</code>：用 <code>allowedOriginRules</code> 限定注入范围（官方建议只用 HTTPS 规则，通配符 <code>*</code> 会注入所有 frame，消息要按不可信数据处理），并在 <code>onPostMessage</code> 里再检查 <code>sourceOrigin</code> 和 <code>isMainFrame</code>。iOS 在处理器里检查 <code>message.frameInfo.isMainFrame</code> 和 <code>message.frameInfo.securityOrigin</code> 的协议、主机名、端口；<code>WKUserScript</code> 不需要进入 iframe 时设 <code>forMainFrameOnly: true</code>。只比较 URL 前缀容易被 <code>https://trusted.com.evil.com</code> 之类的地址绕过，应解析后比较协议和主机名。</li>
<li><strong>最小能力</strong>：按页面来源开放不同的方法集合，不提供&quot;执行任意命令&quot;&quot;读写任意文件&quot;之类的通用方法。</li>
<li><strong>校验参数</strong>：类型、长度、枚举值逐一检查；文件路径、跳转地址同样按白名单校验。</li>
<li><strong>敏感操作二次确认</strong>：支付、获取手机号等操作由宿主弹出原生确认，关键结果以服务端校验为准，不信任网页传回的&quot;已支付&quot;状态。</li>
<li><strong>限制导航</strong>：WebView 只允许跳转白名单域名，防止页面被导航到恶意站点后继续使用 bridge。</li>
</ul>
<p>Electron 中的 preload 和 IPC 是同一类问题，见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>怎么判断 bridge 是否已就绪？宿主注入通常有时机差，可以由宿主在注入完成后派发一个自定义事件，网页监听该事件后再调用；微信 web-view 中可以监听 <code>WeixinJSBridgeReady</code>。</li>
<li><code>addJavascriptInterface</code> 在旧系统上有什么风险？官方文档指出，目标 API 16（Android 4.1）及以下的应用，或运行在 Android 4.2 以下设备上的应用，页面 JS 可以通过反射访问注入对象，以宿主权限执行 Java 代码；包含不可信内容的 WebView 中要格外谨慎。</li>
<li>用 <code>prompt</code>、<code>alert</code> 拦截做通信可以吗？早期有这种做法，但会和真实弹窗冲突，且同步阻塞页面，优先使用平台提供的消息接口。</li>
</ul>`};export{e as default};