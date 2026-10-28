var e={answerHtml:`<h2>简答</h2>
<ul>
<li>JSBridge 是 WebView 中网页 JS 与宿主（App 原生代码或小程序）之间的通信层：网页调用宿主能力，宿主把结果或事件回传给网页。</li>
<li>网页调宿主常见三种方式：宿主注入的 JS 对象、平台提供的消息处理器（如 iOS 的 <code>window.webkit.messageHandlers</code>）、拦截自定义协议 URL；宿主调网页则是在 WebView 中执行一段 JS。</li>
<li>两边只能传可序列化的数据，异步调用要用回调 ID 或 Promise 把请求和响应对应起来。</li>
<li>微信小程序的 web-view 不能直接调用小程序 API，只能用 JSSDK 提供的 <code>wx.miniProgram.navigateTo</code>、<code>postMessage</code> 等接口，<code>postMessage</code> 的消息也只在后退、组件销毁、分享等特定时机送达。</li>
<li>安全上要把网页当作不可信输入：宿主只在可信页面开放 bridge、只开放白名单能力、逐个校验参数，敏感操作再经过用户确认或服务端校验。</li>
</ul>
<h2>通信的两个方向</h2>
<p><strong>网页调用宿主</strong>：</p>
<ul>
<li>注入对象：宿主把一个原生对象挂到页面的 <code>window</code> 上，网页直接调用它的方法。</li>
<li>消息处理器：iOS 的 WKWebView 中注册处理器后，网页调用 <code>window.webkit.messageHandlers.&lt;name&gt;.postMessage(data)</code>，原生侧收到消息对象。</li>
<li>URL 拦截：网页跳转一个自定义协议地址（如 <code>myapp://share?...</code>），宿主在导航回调中拦截并解析。这种方式受 URL 长度限制，现在多作为兼容方案。</li>
</ul>
<p><strong>宿主调用网页</strong>：宿主在 WebView 中执行 JS，例如调用网页事先挂好的 <code>window.onNativeEvent(json)</code>。拼接脚本时要把数据先编码成 JSON，不要直接把字符串拼进代码。</p>
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
<li><strong>校验来源</strong>：能拿到调用方来源时，检查发起页面或 frame 的 origin 是否在白名单内。注入 JS 对象这种方式通常拿不到调用方 origin，注入后同一 WebView 中的页面和 frame 都可能调用，所以要靠控制加载的页面（只加载白名单地址、拦截跳转）来限制，或改用能提供来源信息的消息机制。具体平台 API 以 Android 与 Apple 官方文档为准。只比较 URL 前缀容易被 <code>https://trusted.com.evil.com</code> 之类的地址绕过，应解析后比较协议和主机名。</li>
<li><strong>最小能力</strong>：按页面来源开放不同的方法集合，不提供&quot;执行任意命令&quot;&quot;读写任意文件&quot;之类的通用方法。</li>
<li><strong>校验参数</strong>：类型、长度、枚举值逐一检查；文件路径、跳转地址同样按白名单校验。</li>
<li><strong>敏感操作二次确认</strong>：支付、获取手机号等操作由宿主弹出原生确认，关键结果以服务端校验为准，不信任网页传回的&quot;已支付&quot;状态。</li>
<li><strong>限制导航</strong>：WebView 只允许跳转白名单域名，防止页面被导航到恶意站点后继续使用 bridge。</li>
</ul>
<p>Electron 中的 preload 和 IPC 是同一类问题，见<a href="/questions/mobile-electron-security/">《Electron 应用的主进程、渲染进程和 IPC 有哪些安全边界？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>怎么判断 bridge 是否已就绪？宿主注入通常有时机差，可以由宿主在注入完成后派发一个自定义事件，网页监听该事件后再调用；微信 web-view 中可以监听 <code>WeixinJSBridgeReady</code>。</li>
<li>用 <code>prompt</code>、<code>alert</code> 拦截做通信可以吗？早期有这种做法，但会和真实弹窗冲突，且同步阻塞页面，优先使用平台提供的消息接口。</li>
</ul>`};export{e as default};