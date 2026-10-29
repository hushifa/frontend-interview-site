var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>React Native 里，JS 代码要调用手机的原生能力，比如读电量、渲染视图，就得和原生代码通信。旧架构靠一座叫 Bridge 的“桥”，两边互相发 JSON 消息，每次都要序列化，而且是异步的，没法同步拿到结果。</p>
<p>新架构换了做法。JSI 让 JS 能直接拿到原生对象的引用并同步调用；TurboModules 是新的原生模块系统，用到时才加载；Fabric 是新的渲染系统；Codegen 根据类型声明生成两边的接口代码。</p>
<p>版本上，0.76 起新架构默认启用，0.82 起它成了唯一架构，写 <code>newArchEnabled=false</code> 也会被忽略。不过 0.82 还保留了旧架构的 API 和兼容层，多数旧库还能跑。</p>
<p>要注意，同步调用会卡住 JS 线程，耗时操作还是应该返回 Promise。</p>
</blockquote>
<h2>旧架构的 Bridge 有什么问题</h2>
<p>旧架构下，JS 和原生之间隔着一座桥，消息异步、成批地来回传：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>JS 线程  ──JSON 消息（异步、批量）──▶  原生
         ◀──────────────────────────
</code></pre></div>
<p>因为每次调用都要转成 JSON，数据一大，比如图片、长列表，开销就很明显。又因为是异步的，JS 没法同步读原生的值，比如想量一下视图尺寸，只能等回调。另外，所有原生模块在启动时就初始化，模块一多，启动就慢。</p>
<h2>新架构由哪几部分组成</h2>
<p>新架构把这几个问题拆开解决，每一块管一件事：</p>
<table><thead><tr><th>组件</th><th>作用</th></tr></thead><tbody><tr><td>JSI</td><td>C++ 接口，JS 引擎可以直接调用原生方法、持有原生对象，不经过 JSON</td></tr><tr><td>TurboModules</td><td>新的原生模块系统，首次使用时才加载，可以同步调用</td></tr><tr><td>Fabric</td><td>新渲染系统，在 C++ 中维护视图树，支持 React 并发特性和同步布局测量</td></tr><tr><td>Codegen</td><td>根据 JS/TS 接口规范生成原生侧的类型和绑定代码</td></tr><tr><td>Bridgeless 模式</td><td>完全不初始化旧 Bridge，随新架构一起启用</td></tr></tbody></table>
<p>可以这样理解：JSI 是底层的“直连通道”，TurboModules 和 Fabric 分别是走这条通道的模块系统和渲染系统，Codegen 保证两边对接口的理解一致。</p>
<h2>写一个 TurboModule 要做什么</h2>
<p>先用 TypeScript 写一份接口规范，说明这个模块有哪些方法、参数和返回值是什么类型。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// specs/NativeDeviceInfo.ts</span>
<span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">TurboModule</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-native&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">TurboModuleRegistry</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-native&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Spec</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_">TurboModule</span> {
  <span class="hljs-title function_">getBatteryLevel</span>(): <span class="hljs-built_in">number</span>;
  <span class="hljs-title function_">getModel</span>(): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">string</span>&gt;;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title class_">TurboModuleRegistry</span>.<span class="hljs-property">getEnforcing</span>&lt;<span class="hljs-title class_">Spec</span>&gt;(<span class="hljs-string">&#x27;NativeDeviceInfo&#x27;</span>);
</code></pre></div>
<p>Codegen 读这份规范，生成 iOS 和 Android 两边要实现的接口。原生实现的方法签名如果和规范对不上，编译时就会失败，而不是等到运行时才出错。这就是“类型契约”的意思。</p>
<p><code>getBatteryLevel</code> 声明成同步返回，适合这种很轻的调用。<code>getModel</code> 返回 Promise。耗时的操作都应该这样写，因为同步调用会卡住 JS 线程。</p>
<h2>现在各版本是什么情况</h2>
<p>0.76 起，新架构默认启用。0.81 是最后一个还能切回旧架构的版本。0.82 只运行新架构，关闭新架构的配置会被忽略；但旧架构的 API 和兼容层还保留着，用来减少破坏性变更。</p>
<p>所以还没迁移的项目，官方建议先升级到 0.81（或 Expo SDK 54），打开新架构验证一遍，再升到 0.82。</p>
<h2>迁移时要检查什么</h2>
<p>先看第三方原生库有没有声明支持新架构。兼容层能让多数旧库继续运行，但不保证它们能用上同步调用和 Fabric 的特性。</p>
<p>再看自己写的原生模块，是否依赖旧 Bridge 的初始化顺序或者线程上的假设。</p>
<p>最后，别因为能同步调用了，就把网络、磁盘这类耗时操作改成同步方法，它们会阻塞 JS 线程。</p>
<h2>常见追问</h2>
<p><strong>JSI 和 WebView 的 postMessage 有什么区别？</strong></p>
<blockquote>
<p>JSI 是同一个进程里的直接函数调用。<code>postMessage</code> 是在两个不同上下文之间异步传消息，要等对方收到再回。</p>
</blockquote>
<p><strong>Expo 项目需要关心这些吗？</strong></p>
<blockquote>
<p>Expo SDK 自带的模块已经支持新架构。如果要写自定义原生模块，可以用 Expo Modules API，它同样是基于 JSI 的。</p>
</blockquote>`};export{e as default};