var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>公司要做一个外卖小程序，先上微信，之后还想上支付宝、抖音和 H5，问用原生小程序、Taro 还是 uni-app，这就是小程序跨端选型。国内的小程序平台不止一家，写法相近又不完全相同，跨端框架让你写一份代码，编译到多家平台。</p>
<p>Taro 支持用 React、Vue 等框架写，编译成微信、京东、百度、支付宝、字节跳动、QQ 小程序和 H5；uni-app 用 Vue 语法加微信小程序风格的 API，一份代码可以发布到多家小程序、Web 和 App。</p>
<p>所以可以这样排：只做微信一家、功能轻，原生小程序没有转换层，最直接；要上好几家小程序加 H5，团队写 React 选 Taro，写 Vue 选 uni-app。</p>
<p>要注意，平台独有的组件和 API 仍要写条件分支，跨的平台越多，能共用的部分越少。小程序还受宿主平台的审核、包体积和 API 限制。如果核心是独立 App，那是 Flutter、React Native 的选型问题。</p>
</blockquote>
<h2>小程序跨端框架在解决什么</h2>
<p>国内的小程序不止微信一家，支付宝、百度、抖音、QQ 等都有自己的小程序平台，写法相近又不完全相同。Taro 的 README 说它是“开放式跨端跨框架解决方案”，支持用 React、Vue 等框架开发微信、京东、百度、支付宝、字节跳动、QQ 小程序以及 H5、React Native 应用。uni-app 官方文档说它是“使用 Vue.js 开发所有前端应用的框架”，用“vue 语法 + 微信小程序 api”，一份代码可以发布到 iOS、Android、鸿蒙 Next、Web 和微信、支付宝、百度、抖音、飞书、QQ、快手、钉钉、淘宝、京东、小红书等小程序。</p>
<p>两者都能出 App，但主战场是小程序。反过来，Flutter 和 React Native 的主战场是 Android、iOS App，不能直接出小程序，它们之间以及和 Web 怎样选，见<a href="/questions/mobile-flutter-rn-web/">《Flutter、React Native 和 Web 跨端怎么选？一套代码能同时跑在 App 和浏览器里吗？》</a>。</p>
<h2>小程序为什么要单独考虑</h2>
<p>微信官方文档说明，小程序把脚本和渲染分开在不同线程，分别叫逻辑层和视图层。视图层用 WebView 渲染，逻辑层用单独的 JS 运行时，每个页面一个 WebView；基础库内嵌在微信客户端里，不同版本的客户端运行不同版本的基础库。</p>
<p>这决定了小程序的边界：没有 DOM 和 BOM，只能用宿主提供的组件和 API，宿主不支持的能力就做不了，发布要过宿主平台审核。所以 Web 代码不能原样搬进小程序，跨端框架要把 React、Vue 的写法转换成小程序能运行的结构。Web、小程序和跨端框架的运行边界见<a href="/questions/mobile-mini-program-platform-differences/">《Web、微信小程序和跨端框架的运行边界有什么不同？》</a>。</p>
<h2>平台差异怎样处理</h2>
<p>跨端框架都承认平台之间有差别，并提供写差异代码的办法。uni-app 用条件编译，在注释里写平台名，编译到别的平台时这段代码会被去掉：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// #ifdef MP-WEIXIN</span>
wx.<span class="hljs-title function_">requestSubscribeMessage</span>({ <span class="hljs-attr">tmplIds</span>: [<span class="hljs-string">&#x27;模板 ID&#x27;</span>] });
<span class="hljs-comment">// #endif</span>

<span class="hljs-comment">// #ifdef H5</span>
<span class="hljs-title function_">showSiteNotice</span>(); <span class="hljs-comment">// 网页端改用其他提醒方式</span>
<span class="hljs-comment">// #endif</span>
</code></pre></div>
<p><code>#ifdef</code> 表示只在这个平台保留，<code>#ifndef</code> 表示除了这个平台都保留，<code>MP</code> 代表所有小程序，<code>H5</code>（文档推荐写 <code>WEB</code>）代表网页，<code>APP</code> 代表 App。文档还提醒，平台名写错时 <code>#ifdef</code> 里的代码不会生效，<code>#ifndef</code> 里的反而会生效。</p>
<p>这类分支写得越多，“一套代码”的收益就越小。所以选型时要先列出各端都需要、又各端实现不同的功能，比如登录、支付、分享、订阅消息，估计条件分支有多少。</p>
<h2>从哪些维度比较</h2>
<table><thead><tr><th>维度</th><th>原生小程序</th><th>Taro</th><th>uni-app</th></tr></thead><tbody><tr><td>写法</td><td>WXML/WXSS + JS（以微信为例）</td><td>React、Vue 等</td><td>Vue</td></tr><tr><td>主要目标</td><td>单个宿主的小程序</td><td>多家小程序 + H5，也可出 App</td><td>多家小程序 + Web + App</td></tr><tr><td>转换层</td><td>没有</td><td>转换成各平台的组件和页面</td><td>编译成各平台的结构</td></tr><tr><td>平台差异</td><td>宿主提供的 API</td><td>各平台 API + 条件分支</td><td>各平台 API + 条件编译</td></tr></tbody></table>
<h2>什么情况下选哪一个</h2>
<p>先看业务渠道。用户主要从微信群、公众号、扫码进来，用完即走，小程序门槛最低；只做微信一家时，原生小程序开发最直接，没有转换层。要同时上好几家小程序，或者小程序和 H5 共用代码，才值得引入 Taro、uni-app。</p>
<p>再看要不要独立 App。用户要长期使用、需要推送、后台运行、深度调用硬件，就要独立 App。常见做法是分开选：小程序单独做或用 Taro、uni-app，App 另选 Flutter 或 React Native，见<a href="/questions/mobile-flutter-rn-web/">《Flutter、React Native 和 Web 跨端怎么选？一套代码能同时跑在 App 和浏览器里吗？》</a>。技术选型怎样在面试里讲，见<a href="/questions/project-tech-selection/">《面试官问“为什么选这个技术栈”，应该怎样回答技术选型？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Taro 和 uni-app 怎么选？</strong></p>
<blockquote>
<p>先看团队写什么。Taro 支持 React 和 Vue 等框架，React 团队能沿用熟悉的组件写法；uni-app 基于 Vue，API 风格沿用微信小程序。再对照两者官方文档列出的目标平台，确认要上的每一家小程序都在支持范围内。</p>
</blockquote>
<p><strong>已经有一个原生微信小程序，还要不要迁到跨端框架？</strong></p>
<blockquote>
<p>看是否真要上别的平台。只做微信时，迁移只是换了一层转换，收益很小；确定要上多家小程序时，再评估重写成本和条件分支的数量。</p>
</blockquote>
<p><strong>uni-app 的平台名写错了会怎样？</strong></p>
<blockquote>
<p>官方文档提醒，平台名写错时 <code>#ifdef</code> 里的代码不会生效，<code>#ifndef</code> 里的反而会生效，所以写错不会报错，只会悄悄走错分支。</p>
</blockquote>`};export{e as default};