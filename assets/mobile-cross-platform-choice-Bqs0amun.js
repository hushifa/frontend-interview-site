var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>公司要做一个外卖产品，问“用 Flutter、React Native 还是小程序”，其实是在问两件事：产品要不要一个用户下载安装的独立 App，以及团队用什么技术最顺手。小程序是在微信这类宿主 App 里运行的，不用安装，靠社交分享获客；Flutter 和 React Native 做出来的是真正的 Android、iOS 应用。</p>
<p>三者渲染方式不同。Flutter 不用系统自带的控件，用自己的控件集和随应用打包的 Impeller 引擎绘制界面，发布时编译成机器码，所以各平台外观一致。React Native 用 JavaScript 写 React 组件，运行时创建对应的原生视图，看起来和原生应用一样。小程序的逻辑层在单独的 JS 运行时里，界面用 WebView 渲染，两者分开在不同线程。</p>
<p>所以选型可以这样排：主要靠微信生态获客、功能轻，选小程序；要独立 App、团队熟悉 React、想和 Web 共享知识，选 React Native；对界面一致性、复杂动画要求高，愿意学 Dart，选 Flutter。</p>
<p>要注意没有一种能“一次编写到处运行”。Flutter Web 官方明说不适合文字为主的内容站，SEO 也不是它的重点；React Native 碰到平台差异仍要分别处理；小程序受宿主平台的审核、包体积和 API 限制。很多团队是“App 用一种跨端方案，小程序单独做或用 Taro、uni-app 这类框架转换”。</p>
</blockquote>
<h2>三者各自是怎样画出界面的</h2>
<p><strong>Flutter 自己绘制。</strong> 官方架构文档说，Flutter 绕开了系统的 UI 控件库，用自己的控件集；绘制界面的 Dart 代码编译成原生代码，用 Impeller 渲染。Impeller 随应用一起发布，所以即使用户手机的系统没更新，应用也能用上新的渲染改进。开发时，Flutter 应用跑在支持状态保持热重载的虚拟机里；发布时直接编译成 x64 或 ARM 机器码，面向 Web 时编译成 JavaScript。</p>
<p><strong>React Native 映射到原生视图。</strong> 官方文档的说法是：在 Android 和 iOS 上，界面的基本单位是视图；用 React Native 时，你用 JavaScript 写 React 组件，运行时 React Native 会创建对应的 Android 和 iOS 视图，所以应用的外观、手感和性能都和其他原生应用一样。React Native 的新架构从 0.76 起在所有项目中默认开启，支持同步读取布局信息等能力。和浏览器 React 的写法差异见<a href="/questions/mobile-rn/">《React Native 与浏览器里的 React 有哪些共同点和差异？》</a>，新架构的细节见<a href="/questions/mobile-rn-bridge/">《React Native 原生桥接和新架构应该怎样理解？》</a>。</p>
<p><strong>小程序是宿主里的双线程模型。</strong> 微信官方文档说明：网页开发中脚本和渲染是互斥的，长时间运行的脚本会让页面失去响应；而小程序把两者分开，运行在不同线程中，分别叫逻辑层和视图层。视图层用 WebView 渲染，逻辑层用单独的 JS 运行时，每个页面一个 WebView。小程序基础库内嵌在微信客户端里，不同版本的客户端运行不同版本的基础库。Web、小程序和跨端框架的运行边界见<a href="/questions/mobile-mini-program-platform-differences/">《Web、微信小程序和跨端框架的运行边界有什么不同？》</a>。</p>
<h2>从哪些维度比较</h2>
<table><thead><tr><th>维度</th><th>Flutter</th><th>React Native</th><th>小程序</th></tr></thead><tbody><tr><td>语言</td><td>Dart</td><td>JavaScript / TypeScript + React</td><td>JavaScript + WXML/WXSS（以微信为例）</td></tr><tr><td>界面怎样出来</td><td>自带控件，Impeller 绘制</td><td>创建平台原生视图</td><td>WebView 渲染，逻辑层分离</td></tr><tr><td>平台外观</td><td>各平台一致，需要时自己仿原生风格</td><td>跟随平台原生控件</td><td>跟随宿主组件</td></tr><tr><td>发布形态</td><td>独立 App（另支持 Web、桌面）</td><td>独立 App</td><td>宿主内运行，不用安装</td></tr><tr><td>获客</td><td>应用商店</td><td>应用商店</td><td>宿主生态分享、搜索、扫码</td></tr><tr><td>调用原生能力</td><td>platform channel、FFI</td><td>原生模块</td><td>只能用宿主提供的 API</td></tr><tr><td>更新</td><td>走应用商店审核</td><td>走应用商店审核</td><td>走宿主平台审核，基础库由宿主升级</td></tr></tbody></table>
<p>调用原生能力这一项，Flutter 的 platform channel 是在 Dart 和宿主应用的平台代码之间传消息，数据序列化成标准格式后，在 Kotlin 或 Swift 里反序列化成对应的类型。React Native 则通过原生模块暴露平台 API。小程序没有这条路，只能用宿主提供的 API，宿主不支持的能力就做不了。</p>
<h2>什么情况下选哪一个</h2>
<p>先看业务渠道。用户主要从微信群、公众号、扫码进来，用完即走，小程序的门槛最低。用户要长期使用、需要推送、后台运行、深度调用硬件，就要独立 App。</p>
<p>再看团队。团队以 React 为主，React Native 的学习成本最低，组件写法、状态管理、Hooks 都能沿用。团队愿意接受 Dart，又非常看重各平台界面一致、动画流畅，Flutter 更合适。</p>
<p>最后看 Web。Flutter 的 Web FAQ 写得很直接：现阶段 Flutter 不适合以文字为主、流式布局的静态网站，比如博客文章；Flutter Web 侧重动态的应用体验，SEO 不是它的强项。如果同一个产品还需要被搜索引擎收录的官网或内容页，这些页面通常要用传统 Web 技术单独做。</p>
<p>技术选型怎样在面试里讲，见<a href="/questions/project-tech-selection/">《面试官问“为什么选这个技术栈”，应该怎样回答技术选型？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Flutter 的性能一定比 React Native 好吗？</strong></p>
<blockquote>
<p>不能这样一概而论。Flutter 发布时编译成机器码、自己绘制，避开了和系统控件之间的转换；React Native 新架构也改进了 JS 和原生之间的通信，能同步读取布局。实际性能更多取决于列表、图片、动画怎么写，要用真机和具体页面去测。</p>
</blockquote>
<p><strong>能不能一套代码同时出 App 和小程序？</strong></p>
<blockquote>
<p>可以借助 Taro、uni-app 这类框架把同一套代码编译到多个平台，但它们是在各平台的能力之上做转换，平台独有的组件和 API 仍要写条件分支。跨的平台越多，能共用的部分越少。</p>
</blockquote>
<p><strong>已有原生 App，能逐步引入跨端吗？</strong></p>
<blockquote>
<p>可以。Flutter 文档专门有“把 Flutter 嵌入现有应用”的方式，React Native 也支持集成到已有的原生应用。常见做法是先把一两个独立的页面用跨端实现，验证稳定后再扩大范围。</p>
</blockquote>`};export{e as default};