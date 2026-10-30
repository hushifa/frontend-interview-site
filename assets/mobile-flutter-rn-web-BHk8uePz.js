var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个产品既要上架 App，又要有网页版。可选的路子有三条：用 Flutter 写一套 Dart 代码，同时出 App 和 Web；用 React Native 写 App，网页另做或者借助 React Native Web；或者全部用 Web 技术，App 里再嵌 WebView 或做成 PWA。</p>
<p>差别在界面怎么画出来。Flutter 不用系统控件，自己绘制，发布到手机时编译成机器码，发布到 Web 时编译成 JavaScript 或 WebAssembly，再用 CanvasKit、Skwasm 渲染器通过 WebGL、WebGPU 画出来。React Native 在运行时创建对应的 Android、iOS 原生视图，Web 不是它官方维护的平台，靠社区的 React Native Web 映射到 React DOM。纯 Web 就是浏览器的 HTML 和 CSS。</p>
<p>所以先看 Web 端要做什么。Flutter 官方明确说，它不适合博客文章这类以文字为主的静态网站，SEO 也不是强项，适合单页应用和把已有的 Flutter App 搬上 Web。网页主要是内容、需要被搜索收录，就用传统 Web 做；Web 端也是一个功能复杂的应用，而且团队已经在写 Flutter，Flutter Web 才划算。</p>
<p>再看团队和原生能力。团队熟悉 React，React Native 能沿用组件写法；看重各平台界面一致，选 Flutter。要注意，一套代码跑多端也要处理平台差异，React Native 用 <code>.ios.js</code>、<code>.android.js</code>、<code>.native.js</code> 这类后缀区分平台文件。</p>
</blockquote>
<h2>三者各自怎样画出界面</h2>
<p><strong>Flutter 自己绘制。</strong> 官方架构文档说，Flutter 是一个跨平台 UI 工具包，目标是在 iOS、Android、Web、桌面之间复用代码。开发时，应用跑在支持状态保持热重载的虚拟机里；发布时直接编译成 x64 或 ARM 机器码，面向 Web 时编译成 JavaScript。Web 支持文档进一步说明，Web 端可以编译成 JavaScript，也可以用 <code>--wasm</code> 编译成 WebAssembly，界面通过 CanvasKit 和 Skwasm 渲染器、借助 WebGL 和 WebGPU 绘制。</p>
<p><strong>React Native 映射到原生视图。</strong> 官方文档的说法是，你用 JavaScript 写 React 组件，运行时 React Native 会创建对应的 Android 和 iOS 视图，所以应用的外观、手感和性能都和其他原生应用一样。React Native 官方的“树外平台”文档把 React Native Web 列为社区维护的平台，说明它是“用 React DOM 在 Web 上运行 React Native”。</p>
<p><strong>Web 就是浏览器本身。</strong> 页面由 HTML 和 CSS 描述，文字是真实的 DOM 节点，搜索引擎和读屏软件都能直接读。MDN 介绍 PWA 时说，它用 Web 技术构建，像网站一样一套代码跑在多个平台上，又像原生应用一样可以安装、离线运行、和设备集成。</p>
<p>三者和小程序的对比、各自的原生通信方式，见<a href="/questions/mobile-cross-platform-choice/">《Flutter、React Native 和小程序跨端方案怎样选？》</a>。</p>
<h2>Flutter Web 为什么不适合做内容站</h2>
<p>Flutter Web FAQ 写得很直接：Flutter 侧重动态的应用体验，Web 支持也一样，它优先考虑性能、保真度和一致性，所以输出的结果和搜索引擎索引需要的内容并不一致。FAQ 还说，现阶段 Flutter 不适合以文字为主、流式布局的静态网站，比如博客文章，因为这类内容更适合 Web 本来的文档模型。</p>
<p>FAQ 推荐的做法是把两部分分开：主要的应用体验用 Flutter 做，落地页、营销内容、帮助文档用对搜索友好的 HTML 做。想全程用 Dart 写传统 DOM 网站，可以用社区的 Jaspr，FAQ 提到 Dart 和 Flutter 的官网就迁移到了 Jaspr。</p>
<p>那 Flutter Web 适合什么？官方列出的场景是渐进式 Web 应用、单页应用和已有的 Flutter 移动应用。也就是说，Web 端是一个功能复杂、交互多的“应用”时，它才发挥优势。</p>
<h2>一套代码跑多端时怎样处理平台差异</h2>
<p>不管选哪条路，平台之间总有差别，比如 iOS 和 Android 的返回手势、Web 上没有的原生能力。React Native 用文件后缀来区分：遇到 <code>.ios.</code> 或 <code>.android.</code> 后缀，按运行的平台加载对应文件；<code>.native.js</code> 给 Android 和 iOS 共用，而 Web 打包工具会选择不带后缀的普通文件。下面模拟这个挑选过程：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 模拟打包工具挑文件：React Native 先找平台后缀，再找 .native，Web 打包工具只认普通文件名。</span>
<span class="hljs-keyword">const</span> files = [<span class="hljs-string">&#x27;Button.ios.js&#x27;</span>, <span class="hljs-string">&#x27;Button.android.js&#x27;</span>, <span class="hljs-string">&#x27;Container.native.js&#x27;</span>, <span class="hljs-string">&#x27;Container.js&#x27;</span>];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">resolve</span>(<span class="hljs-params">name, platform</span>) {
  <span class="hljs-keyword">const</span> candidates =
    platform === <span class="hljs-string">&#x27;web&#x27;</span> ? [<span class="hljs-string">\`<span class="hljs-subst">\${name}</span>.js\`</span>] : [<span class="hljs-string">\`<span class="hljs-subst">\${name}</span>.<span class="hljs-subst">\${platform}</span>.js\`</span>, <span class="hljs-string">\`<span class="hljs-subst">\${name}</span>.native.js\`</span>, <span class="hljs-string">\`<span class="hljs-subst">\${name}</span>.js\`</span>];
  <span class="hljs-keyword">return</span> candidates.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">file</span>) =&gt;</span> files.<span class="hljs-title function_">includes</span>(file)) ?? <span class="hljs-string">&#x27;找不到&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;Button&#x27;</span>, <span class="hljs-string">&#x27;ios&#x27;</span>)); <span class="hljs-comment">// Button.ios.js</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;Container&#x27;</span>, <span class="hljs-string">&#x27;android&#x27;</span>)); <span class="hljs-comment">// Container.native.js</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;Container&#x27;</span>, <span class="hljs-string">&#x27;web&#x27;</span>)); <span class="hljs-comment">// Container.js</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;Button&#x27;</span>, <span class="hljs-string">&#x27;web&#x27;</span>)); <span class="hljs-comment">// 找不到</span>
</code></pre></div>
<p>最后一行为什么找不到？因为 <code>Button</code> 只写了 iOS 和 Android 两个版本，Web 打包工具不认这两个后缀。所以想让代码也跑在 Web 上，每个模块都要有一个 Web 能用的版本。</p>
<p><code>Container</code> 的情况是 React Native 文档专门举的例子：一个模块在 Android 和 iOS 上没有差别，只是和 Web 或 Node.js 不同，就写成 <code>Container.native.js</code> 和 <code>Container.js</code> 两份。这样 Metro 打包时两个移动平台都用 <code>.native.js</code>，Webpack、Rollup 这类 Web 打包工具用普通文件。</p>
<p>Flutter 这边，Dart 代码本身各平台通用，要调用平台能力时，移动端和桌面端用 platform channel 和宿主代码传消息；FFI 能直接调 C 接口，但官方说明 FFI 不支持 Web，Web 上要用 JS 互操作库。</p>
<h2>什么情况下选哪一个</h2>
<p>先看 Web 端的角色。Web 端以内容为主、要靠搜索获客，用传统 Web 技术做，App 端再单独选型。Web 端和 App 端是同一个功能复杂的应用，Flutter 能用一套代码覆盖，是它最有优势的场景。</p>
<p>再看团队。团队以 React 为主，React Native 官网的说法是把 React 开发的长处带到原生开发里，组件写法可以沿用，网页版也可以继续用 React。团队愿意用 Dart，又看重各平台界面完全一致，选 Flutter。</p>
<p>最后看原生能力。需要深度调用硬件、后台运行时，Flutter 和 React Native 都能写原生模块；纯 Web 只能用浏览器开放的 API，能力缺口要靠 App 外壳通过 JSBridge 补上，见<a href="/questions/mobile-hybrid-jsbridge/">《Hybrid 开发是什么？JSBridge 的 URL Scheme 拦截和注入对象有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Flutter Web 能被搜索引擎收录吗？</strong></p>
<blockquote>
<p>Flutter 官方 FAQ 说，它的输出和搜索引擎索引需要的内容不一致，SEO 不是它的目标。所以官方建议把需要收录的落地页、营销和帮助内容用普通 HTML 做，或者用社区的 Jaspr 写传统 DOM 网站，应用部分再用 Flutter。</p>
</blockquote>
<p><strong>React Native 写的 App 能直接跑在浏览器里吗？</strong></p>
<blockquote>
<p>不能直接跑。React Native 的组件在手机上映射到原生视图，浏览器里没有这些视图。社区的 React Native Web 把这些组件映射到 React DOM，React Native 官方文档把它列为社区维护的平台。用到的第三方库如果依赖原生模块，在 Web 上也要另找替代。</p>
</blockquote>
<p><strong>PWA 能代替 App 吗？</strong></p>
<blockquote>
<p>看需求。MDN 说明 PWA 可以安装、离线运行、和设备集成，一套代码覆盖多个平台。可是它能用的能力取决于浏览器支持了哪些 Web API，各浏览器的体验也不完全一致，见<a href="/questions/mobile-pwa/">《PWA 由哪些能力组成，是否所有浏览器体验都一致？》</a>。需要应用商店分发或深度原生能力时，还是要 Flutter 或 React Native。</p>
</blockquote>`};export{e as default};