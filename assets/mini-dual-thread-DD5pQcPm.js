var e={answerHtml:`<h2>简答</h2>
<ul>
<li>小程序分为逻辑层（AppService）和视图层：开发者的 JS 运行在逻辑层的 JS 引擎里，WXML 和 WXSS 在视图层的 WebView 中渲染。</li>
<li>逻辑层不在浏览器里运行，没有 <code>window</code>、<code>document</code>，不能直接操作 DOM，只能通过 <code>setData</code> 把数据发给视图层。</li>
<li>分层一方面为了管控，开发者代码只能运行在逻辑层；另一方面避免业务 JS 和 WebView 渲染挤在同一线程。</li>
<li>两层之间每次通信都有序列化和传输开销，高频交互（如跟手拖动）要经过两次跨层通信，容易卡顿。</li>
<li>WXS 响应事件让少量逻辑在视图层执行；Skyline 渲染引擎改用独立渲染线程，界面更不容易被逻辑阻塞，也不必每个页面新建 WebView。</li>
</ul>
<h2>两层分别运行在哪里</h2>
<p>官方文档列出了各平台的运行环境：</p>
<table><thead><tr><th>平台</th><th>逻辑层</th><th>视图层</th></tr></thead><tbody><tr><td>iOS / iPadOS / macOS</td><td>JavaScriptCore</td><td>WKWebView</td></tr><tr><td>Android</td><td>V8</td><td>微信 XWeb（基于 Chromium）</td></tr><tr><td>Windows</td><td>Chromium 内核</td><td>Chromium 内核</td></tr></tbody></table>
<p>iOS 上的 JavaScriptCore 无法开启 JIT，同等条件下逻辑层性能低于其他平台。开发者工具只用于调试，性能和表现以真机为准。</p>
<h2>为什么要拆成两层</h2>
<p>在普通 WebView 中，JS 执行、DOM 构建、样式计算、布局和绘制都在同一线程，JS 跑得太久就会阻塞渲染。小程序把业务 JS 放进独立的逻辑层，页面渲染不再直接被业务代码阻塞。</p>
<p>同时，官方说明分层的目的是&quot;管控&quot;：开发者代码拿不到 DOM，就不能随意跳转外部页面、读取页面内容或调用未授权的能力，平台能统一控制组件和 API。</p>
<h2>一次交互的完整链路</h2>
<p>以手指拖动元素 B 跟随移动为例：</p>
<ol>
<li><code>touchmove</code> 事件从视图层发送到逻辑层。</li>
<li>逻辑层处理事件，调用 <code>setData</code> 改变 B 的位置。</li>
<li>数据回到视图层，触发重新渲染。</li>
</ol>
<p>每次移动都要经过两次跨层通信和一次渲染，通信耗时较大，<code>setData</code> 渲染时还会阻塞其他脚本，所以动画会跟不上手指。</p>
<h2>WXS 和 Skyline 的改进</h2>
<ul>
<li><strong>WXS 响应事件</strong>：WXS 函数在视图层执行，可以直接响应内置组件事件，用 <code>ComponentDescriptor</code> 设置组件的样式和 class，不经过逻辑层。它目前只能响应内置组件事件，不支持自定义组件事件。</li>
<li><strong>Skyline</strong>：创建独立的渲染线程负责布局、合成和绘制，并在 AppService 中划出单独上下文运行原来 WebView 承担的 JS 逻辑和 DOM 树创建。界面更不容易被逻辑阻塞，也不需要每个页面新建一个 WebView。原有 WXS 在 Skyline 下被移到 AppService，查询页面信息的接口会变成异步，官方另外提供 Worklet 机制做高性能动画。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不能在小程序里用 jQuery 或依赖 DOM 的库？逻辑层没有 <code>document</code>，库在初始化时访问 DOM 就会报错。</li>
<li>每个页面都是一个独立的 WebView 吗？WebView 渲染模式下页面有各自的 WebView；在某些平台上这些 WebView 共享同一线程，所以后台页面的渲染也会影响前台。setData 的具体优化见<a href="/questions/mini-setdata/">《setData 为什么会慢？如何优化小程序的数据更新？》</a>。</li>
</ul>`};export{e as default};