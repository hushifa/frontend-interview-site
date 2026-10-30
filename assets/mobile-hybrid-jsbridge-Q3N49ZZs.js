var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个电商 App，商品详情页是原生写的，活动页却是网页。App 里放一个 WebView 加载活动页，这就是 Hybrid 开发。网页要调用分享、扫码这些原生能力，就需要一条通道，这条通道叫 JSBridge。</p>
<p>网页调原生有两种做法。一种是 URL Scheme 拦截：网页跳转 <code>myapp://share?...</code> 这样的自定义地址，原生在导航回调里拦下来解析，Android 是 <code>shouldOverrideUrlLoading</code>，iOS 是 <code>decidePolicyFor</code>。另一种是注入对象：Android 用 <code>addJavascriptInterface</code> 把 Java 对象挂到页面上，iOS 用 <code>WKScriptMessageHandler</code>，网页调用 <code>window.webkit.messageHandlers.名字.postMessage()</code>。反过来，原生调网页都是执行一段脚本，Android 用 <code>evaluateJavascript</code>，iOS 用 <code>evaluateJavaScript</code>。</p>
<p>注入对象直接调方法，iOS 还能直接传对象和数组；URL 拦截不用提前注入，但参数要编码进 URL。两种方式都是异步的，所以一般给每次调用分配 ID，原生处理完按 ID 回调。</p>
<p>要注意安全。Android 官方明确警告，<code>addJavascriptInterface</code> 等于让 JavaScript 控制 App，只有页面里的 HTML 和 JS 都是自己写的才能用。所以 WebView 要限制能加载的地址，敏感能力按来源开放。</p>
</blockquote>
<h2>Hybrid 应用是怎样组成的</h2>
<p>Hybrid 应用的外壳是原生 App，部分页面用 WebView 显示网页。网页部分由 WebView 加载，原生部分负责需要系统能力的功能。</p>
<p>网页跑在 WebView 里，本身只能用浏览器提供的 API。要拍照、读通讯录、调起原生分享，就得让网页和原生代码互相传消息。JSBridge 就是双方约定的一套调用格式：网页说“调用 share，参数是什么，回调 ID 是几”，原生执行完再把结果按 ID 送回网页。</p>
<h2>网页怎样调用原生：URL Scheme 拦截</h2>
<p>WebView 里的页面要跳转时，原生可以先拿到这个地址，决定放行还是拦下。Android 的官方指南是：给 WebView 设置自定义的 <code>WebViewClient</code>，重写 <code>shouldOverrideUrlLoading</code>，返回 <code>false</code> 让 WebView 正常加载，返回 <code>true</code> 表示自己处理。iOS 是 <code>WKNavigationDelegate</code> 的 <code>webView(_:decidePolicyFor:decisionHandler:)</code>，文档说明 WebView 在交互发生后、开始加载内容前调用它，实现了这个方法就必须在某个时刻调用 <code>decisionHandler</code>，告诉它允许还是取消。</p>
<p>所以只要约定一个自定义协议，网页跳转 <code>myapp://share?...</code>，原生在回调里发现是这个协议，就解析地址、执行对应的能力，并取消这次导航。下面模拟原生侧的解析和网页侧按 ID 收结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 原生侧拦截到的地址，按自定义协议解析出方法名和参数。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">parseBridgeUrl</span>(<span class="hljs-params">href</span>) {
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(href);
  <span class="hljs-keyword">if</span> (url.<span class="hljs-property">protocol</span> !== <span class="hljs-string">&#x27;myapp:&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">method</span>: url.<span class="hljs-property">hostname</span>,
    <span class="hljs-attr">id</span>: <span class="hljs-title class_">Number</span>(url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;id&#x27;</span>)),
    <span class="hljs-attr">params</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(url.<span class="hljs-property">searchParams</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;params&#x27;</span>) ?? <span class="hljs-string">&#x27;{}&#x27;</span>),
  };
}

<span class="hljs-keyword">const</span> href = <span class="hljs-string">&#x27;myapp://share?id=1&amp;params=&#x27;</span> + <span class="hljs-built_in">encodeURIComponent</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;订单&#x27;</span> }));
<span class="hljs-keyword">const</span> call = <span class="hljs-title function_">parseBridgeUrl</span>(href);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(call.<span class="hljs-property">method</span>); <span class="hljs-comment">// share</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(call.<span class="hljs-property">params</span>.<span class="hljs-property">title</span>); <span class="hljs-comment">// 订单</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseBridgeUrl</span>(<span class="hljs-string">&#x27;https://example.com/share&#x27;</span>) === <span class="hljs-literal">null</span>); <span class="hljs-comment">// true</span>

<span class="hljs-comment">// 网页侧按 ID 等待结果，原生处理完调用 onNativeReply 带回同一个 ID。</span>
<span class="hljs-keyword">const</span> pending = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">function</span> <span class="hljs-title function_">onNativeReply</span>(<span class="hljs-params">json</span>) {
  <span class="hljs-keyword">const</span> { id, result } = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(json);
  <span class="hljs-keyword">const</span> resolve = pending.<span class="hljs-title function_">get</span>(id);
  <span class="hljs-keyword">if</span> (!resolve) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;unknown&#x27;</span>;
  pending.<span class="hljs-title function_">delete</span>(id);
  <span class="hljs-title function_">resolve</span>(result);
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;ok&#x27;</span>;
}
<span class="hljs-keyword">const</span> received = [];
pending.<span class="hljs-title function_">set</span>(call.<span class="hljs-property">id</span>, <span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> received.<span class="hljs-title function_">push</span>(result));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">onNativeReply</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">result</span>: <span class="hljs-string">&#x27;已分享&#x27;</span> }))); <span class="hljs-comment">// ok</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">onNativeReply</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">result</span>: <span class="hljs-string">&#x27;重复&#x27;</span> }))); <span class="hljs-comment">// unknown</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(received.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 已分享</span>
</code></pre></div>
<p>为什么参数要先 <code>JSON.stringify</code> 再 <code>encodeURIComponent</code>？因为参数要塞进 URL 的查询字符串里，里面的引号、<code>&amp;</code>、中文都得编码，否则地址会被截断或解析错。普通的 <code>https:</code> 地址解析结果是 <code>null</code>，所以打印 <code>true</code>，原生就放行，让 WebView 正常加载。</p>
<p>后半段是另一个方向。原生处理完分享，执行网页事先挂好的 <code>onNativeReply</code>，把同一个 ID 带回来，网页就找到对应的回调。同一个 ID 第二次回来时已经被删掉了，返回 <code>unknown</code>，这样重复的回复不会让回调执行两次。</p>
<p>Android 文档还提到一个细节：WebView 只对有效的 URL 调用 <code>shouldOverrideUrlLoading</code>，像 <code>&lt;a href=&quot;showProfile&quot;&gt;</code> 这样不合法的地址可能根本不会触发回调。所以自定义协议要写成 <code>myapp://...</code> 这样完整的格式。</p>
<h2>网页怎样调用原生：注入对象</h2>
<p>注入对象是原生主动往页面里放一个对象，网页直接调它的方法，不用绕导航。</p>
<p>Android 的 <code>addJavascriptInterface(object, name)</code> 把一个 Java 对象注入 WebView，官方文档说明：对象会注入页面的所有 frame，包括 iframe；目标 API 17 及以上时，只有加了 <code>@JavascriptInterface</code> 注解的公共方法能被 JavaScript 调用；注入的对象要等页面下次加载后才出现，注入前要先开启 JavaScript。官方指南的例子是网页调用 <code>Android.showToast(&#x27;Hello&#x27;)</code> 弹出原生提示。</p>
<p>iOS 的做法是消息处理器。原生用 <code>WKUserContentController</code> 的 <code>add(_:name:)</code> 安装一个实现了 <code>WKScriptMessageHandler</code> 的对象，<code>name</code> 在同一个 controller 里必须唯一且不能为空。网页调用 <code>window.webkit.messageHandlers.名字.postMessage(数据)</code>，WebKit 就会回调 <code>userContentController(_:didReceive:)</code>，从 <code>message</code> 里能拿到内容和发消息的 frame。普通处理器只收不回；需要直接回复时，Apple 文档建议改用 <code>WKScriptMessageHandlerWithReply</code>。</p>
<h2>原生怎样调用网页</h2>
<p>两端都是在当前页面里执行一段脚本。Android 的 <code>evaluateJavascript(script, callback)</code> 在当前页面上下文里异步执行，必须在 UI 线程调用，回调也在 UI 线程。iOS 的 <code>evaluateJavaScript(_:completionHandler:)</code> 执行完不管成功失败都会调回调，回调总在主线程。</p>
<p>拼脚本时，数据要先编码成 JSON 再放进去，比如执行 <code>onNativeReply(\${JSON.stringify(json)})</code>，不要把字符串直接拼进代码，否则数据里有引号就会破坏脚本，还可能被注入代码。</p>
<h2>两种调用方式怎么选</h2>
<p>URL 拦截不需要原生提前注入任何东西，页面一加载就能用，但所有参数都要编码进 URL，传大数据不方便。</p>
<p>注入对象直接调方法，iOS 的 <code>postMessage</code> 收到的消息体可以是数字、字符串、日期、数组、字典和 null，比塞进 URL 方便。不管用哪种，请求和响应都靠上面那样的 ID 配对。小程序 web-view 不能自己实现 bridge，只能用 JSSDK，见<a href="/questions/mini-jsbridge/">《小程序 web-view 里的网页怎样和小程序通信？JSBridge 要做哪些安全校验？》</a>。</p>
<h2>安全上要注意什么</h2>
<p>Android 官方指南的警告是：<code>addJavascriptInterface</code> 让 JavaScript 能控制 App，如果 WebView 里的 HTML 不可信，比如部分内容来自未知的人，攻击者就能执行你的客户端代码。所以除非 WebView 里的 HTML 和 JS 全是自己写的，否则不要用它，也不要让用户在 WebView 里跳转到不受控制的第三方网页。</p>
<p>URL 拦截同样要校验。任何页面都能跳转 <code>myapp://</code>，所以原生要先检查当前页面是不是可信的地址，再执行能力。解析地址要用 <code>URL</code> 这类解析器比较协议和主机名，不能只比字符串前缀。来源校验、最小能力和参数校验的细节，在<a href="/questions/mini-jsbridge/">《小程序 web-view 里的网页怎样和小程序通信？JSBridge 要做哪些安全校验？》</a>里有展开。</p>
<h2>常见追问</h2>
<p><strong>为什么页面一打开就调用注入对象，有时会报 undefined？</strong></p>
<blockquote>
<p>Android 文档说明，<code>addJavascriptInterface</code> 注入的对象要等页面下次加载后才出现。如果原生在页面加载之后才注入，当前页面就拿不到。所以要在加载地址之前注入，网页侧调用前也要判断对象存不存在，没有就排队等就绪通知或降级。</p>
</blockquote>
<p><strong>原生执行 evaluateJavascript 能拿到网页函数的返回值吗？</strong></p>
<blockquote>
<p>能拿到脚本的执行结果。Android 的回调会收到执行返回的值，iOS 的回调参数是结果或者错误。不过网页里的异步操作要等 Promise 完成，这时更常见的做法是网页处理完再主动发一条消息回原生。</p>
</blockquote>
<p><strong>Hybrid 页面和跳到系统浏览器打开有什么区别？</strong></p>
<blockquote>
<p>在 WebView 里打开，网页能通过 JSBridge 用 App 的能力。Android 文档提到，为了安全，系统浏览器不和 App 共享应用数据。所以第三方链接一般交给系统浏览器打开，不在带 bridge 的 WebView 里加载。</p>
</blockquote>`};export{e as default};