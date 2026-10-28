var e={answerHtml:`<h2>简答</h2>
<ul>
<li>旧架构通过 Bridge 异步传递 JSON 消息在 JS 和原生之间通信，每次调用都要序列化，且无法同步返回结果。</li>
<li>新架构用 JSI 让 JS 直接持有原生对象的引用并同步调用，TurboModules 按需加载原生模块，Fabric 是新的渲染系统，Codegen 根据类型声明生成两侧的接口代码。</li>
<li>新架构从 0.76 起默认启用；0.82 起成为唯一架构，<code>newArchEnabled=false</code> 会被忽略。</li>
<li>0.82 仍保留旧架构的 API 和兼容层，旧的第三方库多数能继续运行，旧架构代码计划在后续版本中逐步移除。</li>
<li>编写原生模块时先写 TypeScript 接口规范，由 Codegen 生成类型安全的胶水代码。</li>
</ul>
<h2>旧架构：Bridge</h2>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>JS 线程  ──JSON 消息（异步、批量）──▶  原生
         ◀──────────────────────────
</code></pre></div>
<ul>
<li>所有调用都要序列化成 JSON，大数据量（图片、列表）开销明显。</li>
<li>调用是异步的，JS 无法同步读取原生值，例如测量视图尺寸需要等待回调。</li>
<li>所有原生模块在启动时初始化，模块多时启动变慢。</li>
</ul>
<h2>新架构的组成</h2>
<table><thead><tr><th>组件</th><th>作用</th></tr></thead><tbody><tr><td>JSI</td><td>C++ 接口，JS 引擎可以直接调用原生方法、持有原生对象，不经过 JSON</td></tr><tr><td>TurboModules</td><td>新的原生模块系统，首次使用时才加载，可以同步调用</td></tr><tr><td>Fabric</td><td>新渲染系统，在 C++ 中维护视图树，支持 React 并发特性和同步布局测量</td></tr><tr><td>Codegen</td><td>根据 JS/TS 接口规范生成原生侧的类型和绑定代码</td></tr><tr><td>Bridgeless 模式</td><td>完全不初始化旧 Bridge，随新架构一起启用</td></tr></tbody></table>
<h2>编写一个 TurboModule</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// specs/NativeDeviceInfo.ts</span>
<span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">TurboModule</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-native&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">TurboModuleRegistry</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-native&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">interface</span> <span class="hljs-title class_">Spec</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_">TurboModule</span> {
  <span class="hljs-title function_">getBatteryLevel</span>(): <span class="hljs-built_in">number</span>;
  <span class="hljs-title function_">getModel</span>(): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">string</span>&gt;;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title class_">TurboModuleRegistry</span>.<span class="hljs-property">getEnforcing</span>&lt;<span class="hljs-title class_">Spec</span>&gt;(<span class="hljs-string">&#x27;NativeDeviceInfo&#x27;</span>);
</code></pre></div>
<p>Codegen 读取这个规范，生成 iOS 和 Android 侧需要实现的接口。原生实现的方法签名和规范不一致时编译失败，而不是运行时才出错。<code>getBatteryLevel</code> 声明为同步返回，适合轻量调用；耗时操作应返回 Promise，避免阻塞 JS 线程。</p>
<h2>版本现状</h2>
<ul>
<li><strong>0.76</strong>：新架构默认启用。</li>
<li><strong>0.81</strong>：最后一个仍可切换回旧架构的版本。</li>
<li><strong>0.82</strong>：只运行新架构，关闭新架构的配置被忽略；旧架构 API 和兼容层仍保留，以减少破坏性变更。</li>
</ul>
<p>还没有迁移的项目，官方建议先升级到 0.81（或 Expo SDK 54）开启新架构并验证，再升级到 0.82。</p>
<h2>迁移时要检查的地方</h2>
<ul>
<li>第三方原生库是否声明支持新架构；兼容层能让多数旧库继续运行，但不保证同步调用和 Fabric 特性。</li>
<li>自己的原生模块是否依赖旧 Bridge 的初始化顺序或线程假设。</li>
<li>同步调用会阻塞 JS 线程，不要把网络、磁盘等耗时操作改成同步方法。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>JSI 和 WebView 的 <code>postMessage</code> 有什么区别？JSI 是同进程内的直接函数调用，<code>postMessage</code> 是跨上下文的异步消息传递。</li>
<li>Expo 项目需要关心这些吗？Expo SDK 的模块已支持新架构；编写自定义原生模块时可以用 Expo Modules API，它同样基于 JSI。</li>
</ul>`};export{e as default};