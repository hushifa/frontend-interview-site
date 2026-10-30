var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 React Native App 冷启动慢，用户点了图标要等好一会儿才看到第一屏。JavaScript 引擎怎样加载和执行 bundle 会影响这段时间。Hermes 就是 Meta 为了这个问题做的 JavaScript 引擎，专门面向资源有限的设备，优化启动速度、包体积和内存占用。</p>
<p>它和其他引擎最大的区别是提前编译。打 release 包时，Hermes 在构建阶段就把 JavaScript 源码编译成字节码，打进安装包里；App 启动时直接执行字节码，省掉了解析和编译这一步。官方文档说，对很多应用来说，和 JavaScriptCore 相比，Hermes 能缩短启动时间、减少内存占用、减小包体积。</p>
<p>现在不需要做什么就能用上。React Native 0.70 起 Hermes 成为默认引擎，从 0.69 开始每个 RN 版本都会配套构建一份 Hermes，保证版本兼容。在 JS 里检查 <code>global.HermesInternal</code> 是否存在，就能确认当前是不是 Hermes。</p>
<p>要注意两点。第一，性能对比要用 release 包，因为字节码是在 release 构建时生成的；用了非标准方式加载 bundle 时，<code>HermesInternal</code> 存在也不代表加载的是 <code>.hbc</code> 字节码文件。第二，RN 还支持 JavaScriptCore，但要按社区仓库的说明自己切换，不同引擎之间可能有细微差异，代码不要依赖某个引擎的特有行为。</p>
</blockquote>
<h2>启动快在哪里</h2>
<p>没有预编译时，引擎要在 App 启动时先处理 JavaScript 源码才能执行，这一步发生在用户刚点开 App、什么都还没显示的时候。</p>
<p>Hermes 的做法是把这一步挪到构建阶段。React Native 官方博客的说法是：Hermes 能提前把 JavaScript 源码编译成字节码，预编译好的字节码打包在安装包里，解释器在 App 启动时就不用再做这一步昂贵的工作。</p>
<p>官方衡量收益时看三个指标：TTI，这里定义为从点击图标到第一屏渲染完成的时间；安装包大小，Android 看 APK、iOS 看 IPA；以及内存占用。</p>
<h2>怎样确认在用 Hermes</h2>
<p>官方文档给的检查方法是读 <code>HermesInternal</code> 这个全局变量：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> <span class="hljs-title function_">isHermes</span> = (<span class="hljs-params"></span>) =&gt; !!<span class="hljs-variable language_">global</span>.<span class="hljs-property">HermesInternal</span>;
</code></pre></div>
<p>这里有个坑。如果用了非标准的方式加载 JS bundle，可能出现 <code>HermesInternal</code> 存在，但实际没有用上预编译字节码的情况。官方建议确认加载的是 <code>.hbc</code> 文件，并实际对比前后的性能。</p>
<p>对比性能一定要用 release 构建，比如 Android 用 <code>npm run android -- --mode=&quot;release&quot;</code>，iOS 用 <code>npm run ios -- --mode=&quot;Release&quot;</code>。官方文档说，release 构建会在构建时把 JavaScript 编译成 Hermes 字节码，提升设备上的启动速度。</p>
<h2>和 JavaScriptCore 是什么关系</h2>
<p>在 Hermes 之前，React Native 用的是 JavaScriptCore，也就是 Safari 背后的引擎。官方文档说，大多数情况下 RN 使用 Hermes；关掉 Hermes 时才使用 JavaScriptCore。而且在 iOS 上，因为 App 没有可写可执行内存，JavaScriptCore 不能使用 JIT。</p>
<p>想换回 JavaScriptCore，要按 <code>react-native-community/javascriptcore</code> 社区仓库的说明操作。官方提醒，这些运行环境很相似，但仍可能碰到不一致，所以最好不要依赖某个运行时的细节。</p>
<p>Hermes 只是 RN 架构里执行 JavaScript 的那一层，JS 和原生之间怎样通信、新架构改了什么，见<a href="/questions/mobile-rn-bridge/">《React Native 原生桥接和新架构应该怎样理解？》</a>；RN 和浏览器里的 React 有哪些异同，见<a href="/questions/mobile-rn/">《React Native 与浏览器里的 React 有哪些共同点和差异？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Hermes 怎样支持 <code>Intl</code>？</strong></p>
<blockquote>
<p>官方博客提到，如果把完整的国际化数据打进引擎，体积最多会增加 6MB。为了不让安装包变大，Hermes 在 iOS 上的 <code>Intl</code> 是通过调用系统自身提供的 API 实现的。</p>
</blockquote>
<p><strong>为什么从 0.69 起每个 RN 版本都配套构建 Hermes？</strong></p>
<blockquote>
<p>官方博客的解释是为了保证和每个 RN 版本完全兼容。官方文档也说，RN 自带一份配套的 Hermes，每发布一个 RN 版本都会构建对应的 Hermes。</p>
</blockquote>
<p><strong>开发时调试 JS 跑在哪里？</strong></p>
<blockquote>
<p>正常情况下就跑在 App 里的引擎上。官方文档还提到 Chrome 调试的情况：所有 JavaScript 在 Chrome 里用 V8 执行，通过 WebSocket 和原生通信，这时运行环境和真机不同，可能出现只在某一边才有的问题。</p>
</blockquote>`};export{e as default};