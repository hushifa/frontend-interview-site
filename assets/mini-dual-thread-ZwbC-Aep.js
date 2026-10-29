var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>小程序把代码分在两个地方跑。你写的 JS 跑在逻辑层（AppService）的 JS 引擎里；WXML 和 WXSS 在视图层的 WebView 里渲染。</p>
<p>逻辑层不是浏览器，没有 <code>window</code>、<code>document</code>，不能直接改 DOM。想改界面，只能用 <code>setData</code> 把数据发给视图层。</p>
<p>为什么要这样分？一是为了管控，开发者的代码只能待在逻辑层，碰不到页面；二是让业务 JS 和页面渲染不挤在同一个线程里。代价是两边每次通信都要序列化和传输，像跟手拖动这种高频交互，一次移动要跨两次层，容易卡。</p>
<p>微信后来有两种改进。WXS 响应事件让少量逻辑直接在视图层执行；Skyline 渲染引擎改用独立的渲染线程，界面更不容易被逻辑卡住，也不用每个页面都新建 WebView。</p>
</blockquote>
<h2>两层分别跑在哪里</h2>
<p>官方文档列出了各平台的运行环境：</p>
<table><thead><tr><th>平台</th><th>逻辑层</th><th>视图层</th></tr></thead><tbody><tr><td>iOS / iPadOS / macOS</td><td>JavaScriptCore</td><td>WKWebView</td></tr><tr><td>Android</td><td>V8</td><td>微信 XWeb（基于 Chromium）</td></tr><tr><td>Windows</td><td>Chromium 内核</td><td>Chromium 内核</td></tr></tbody></table>
<p>iOS 上的 JavaScriptCore 开不了 JIT，也就是没法把热点代码即时编译成机器码加速。所以同等条件下，iOS 的逻辑层性能比其他平台低。另外，开发者工具只用来调试，性能和表现都要以真机为准。</p>
<h2>为什么要拆成两层</h2>
<p>在普通 WebView 里，JS 执行、DOM 构建、样式计算、布局、绘制都在同一个线程上。JS 跑得太久，页面就渲染不了。小程序把业务 JS 放进独立的逻辑层，页面渲染就不会直接被业务代码卡住。</p>
<p>另一个原因是管控，这是官方明确说的。开发者代码拿不到 DOM，就没法随便跳到外部页面、读取页面内容，或者调用没授权的能力。这样平台就能统一控制组件和 API。</p>
<h2>一次拖动要走几步</h2>
<p>以手指拖着元素 B 移动为例，每移动一下都要走完这几步：</p>
<ol>
<li><code>touchmove</code> 事件从视图层发到逻辑层。</li>
<li>逻辑层处理事件，调用 <code>setData</code> 改 B 的位置。</li>
<li>数据回到视图层，触发重新渲染。</li>
</ol>
<p>所以每次移动都有两次跨层通信，加一次渲染。通信本身耗时就不小，<code>setData</code> 渲染时还会阻塞其他脚本，结果动画跟不上手指。</p>
<h2>WXS 和 Skyline 改进了什么</h2>
<p>WXS 响应事件的思路是：既然来回跑太慢，就让一部分逻辑直接在视图层执行。WXS 函数可以直接响应内置组件的事件，用 <code>ComponentDescriptor</code> 设置组件的样式和 class，不经过逻辑层。不过它目前只能响应内置组件事件，不支持自定义组件事件。</p>
<p>Skyline 改得更彻底。它创建一个独立的渲染线程负责布局、合成和绘制，又在 AppService 里划出一个单独的上下文，运行原来由 WebView 承担的 JS 逻辑和 DOM 树创建。这样界面更不容易被逻辑卡住，也不需要每个页面新建一个 WebView。</p>
<p>要注意的是，在 Skyline 下原来的 WXS 被移到了 AppService，查询页面信息的接口会变成异步。做高性能动画，官方另外提供了 Worklet 机制。</p>
<h2>常见追问</h2>
<p><strong>为什么小程序里不能用 jQuery 或依赖 DOM 的库？</strong></p>
<blockquote>
<p>因为逻辑层没有 <code>document</code>。这些库一初始化就去访问 DOM，马上就报错。</p>
</blockquote>
<p><strong>每个页面都是一个独立的 WebView 吗？</strong></p>
<blockquote>
<p>在 WebView 渲染模式下，页面有各自的 WebView。但在某些平台上，这些 WebView 共用同一个线程，所以后台页面的渲染也会影响前台。setData 的具体优化见<a href="/questions/mini-setdata/">《setData 为什么会慢？如何优化小程序的数据更新？》</a>。</p>
</blockquote>`};export{e as default};