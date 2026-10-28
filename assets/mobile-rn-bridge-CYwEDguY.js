var e={answerHtml:`<p>React Native 应用需要调用相机、蓝牙、支付 SDK 或高性能图像处理时，JavaScript 代码不能直接调用 Android/iOS 的对象。它需要通过模块和渲染系统把数据、命令和事件跨越 JavaScript 与原生运行时边界。</p>
<p>这个边界不是普通函数调用：数据可能需要序列化、线程需要切换、设备权限可能拒绝、原生对象可能比 JS 组件活得更久。理解桥接模型，才能判断一个功能是适合 JavaScript 实现，还是需要原生模块。</p>
<h2>旧 Bridge 的核心成本是消息和序列化</h2>
<p>传统架构常把 JS 与原生之间的调用组织成异步消息。一次调用可能包含方法名、模块名和参数，返回值或事件再通过另一条消息回来。大量小消息、频繁传递大数组和每帧传输图片都会造成序列化、复制和线程调度成本。</p>
<p>因此不要在滚动或动画的每一帧把完整对象发送到原生；应批量处理、传递 ID/坐标、使用原生侧动画或适合的缓冲区。桥接 API 返回成功，也不一定代表系统设备已经完成操作，业务仍需要明确确认和错误语义。</p>
<h2>新架构改变了连接方式，不取消平台边界</h2>
<p>React Native 新架构包含 JSI、TurboModules 和 Fabric 等组成部分：JSI 提供更直接的 JavaScript 与 C++/原生运行时互操作能力，TurboModules 组织按需加载的原生模块，Fabric 负责新的渲染器和组件管线。</p>
<p>这些能力可以减少某些旧消息桥的开销，但不意味着任意 JS 对象都能零成本共享，也不保证所有第三方库已经兼容。模块仍要处理线程、生命周期、异常、平台实现差异和数据所有权；项目升级时要锁定 React Native 版本和依赖支持矩阵。</p>
<p>不要把“同步调用更快”理解成“可以在任意 JS 代码里同步访问摄像头或数据库”。主线程阻塞、平台 API 的异步性质和用户权限仍然存在；耗时工作要放到正确的原生线程或后台机制，并通过可取消的结果回传。</p>
<h2>原生模块的 API 要设计成业务契约</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">NativeScanner</span> = {
  <span class="hljs-title function_">start</span>(<span class="hljs-attr">options</span>: { <span class="hljs-attr">formats</span>: <span class="hljs-built_in">string</span>[] }): <span class="hljs-title class_">Promise</span>&lt;{ <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span> }&gt;;
  <span class="hljs-title function_">stop</span>(<span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>): <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">void</span>&gt;;
  <span class="hljs-title function_">addListener</span>(<span class="hljs-attr">event</span>: <span class="hljs-string">&#x27;result&#x27;</span>, <span class="hljs-attr">listener</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: { id: <span class="hljs-built_in">string</span>; text: <span class="hljs-built_in">string</span> }</span>) =&gt;</span> <span class="hljs-built_in">void</span>): { <span class="hljs-title function_">remove</span>(): <span class="hljs-built_in">void</span> };
};
</code></pre></div>
<p>这是 JS 侧契约示意：方法参数、事件结构、停止入口和监听移除都要明确。原生实现仍要在平台侧校验格式、权限和状态，不能相信 JS 只会传合法值；事件也可能在组件卸载后迟到，JS 侧应通过订阅生命周期和任务代次丢弃过期结果。</p>
<p>原生资源要有成对生命周期：相机轨道、定位监听、蓝牙连接、文件句柄、计时器和后台任务不能只在“开始成功”时创建，却没有卸载、页面失焦、权限撤销和错误路径的释放。</p>
<p>上述 TypeScript 类型不会自动生成原生实现，也不是完整的 TurboModule Codegen Spec。正式接入要按所用 React Native 版本的规范定义可支持的类型、注册模块、生成平台代码并实现 Android/iOS 方法；普通类型别名不产生任何运行时权限检查。</p>
<p>例如 start 的 Promise 返回扫描任务 ID，可以表示“任务已建立”，不必代表已经识别出二维码；结果事件才承载后续数据。stop 的确认也应定义是“已请求停止”还是“资源已释放”，否则 JS 立即再次启动可能与原生清理发生竞争。</p>
<h2>线程和 UI 更新需要明确所有权</h2>
<p>React Native 的 JS 线程、UI/渲染线程和平台线程职责不同。原生回调不一定在 JS 线程执行，直接操作不属于当前线程的对象可能崩溃；JS 线程长任务也会让输入和状态更新延迟。</p>
<p>高频传感器、动画和图像处理应尽量在合适的原生/工作线程处理，向 JS 发送必要的摘要或节流后的事件。不要为了“让 React 状态实时”把每个传感器样本都 setState；要定义采样、丢弃和背压策略。</p>
<p>线程切换也影响错误传播。原生异常、Promise rejection、模块销毁和应用进入后台不能靠一个全局 try/catch 统一解决。错误对象应转换成稳定的业务错误码，日志保留平台、模块和版本信息，同时过滤令牌和个人数据。</p>
<h2>权限和安全边界仍由平台落实</h2>
<p>桥接模块可以调用系统能力，但权限必须在 Android/iOS 清单、运行时授权和原生实现中配置。JS 端隐藏按钮不等于禁止调用；原生模块和服务端仍要校验当前用户、设备状态和资源权限。</p>
<p>不要把长期密钥写进 JS bundle 或原生包，也不要把任意 URL、文件路径和命令交给通用桥接接口。文件、深链、WebView、推送和第三方 SDK 都要设定允许来源、输入范围和审计边界。</p>
<h2>兼容性和发布需要双向考虑</h2>
<p>JS 包可以更新而原生二进制尚未更新，或者旧版本原生模块收到新字段。桥接协议应支持能力检测、版本协商和向后兼容；新增可选字段通常比改变现有字段含义安全。热更新也不能绕过应用商店和系统对原生能力、权限的限制。</p>
<p>测试至少覆盖 Android/iOS、Debug/Release、冷启动、后台恢复、权限拒绝、设备断开、原生模块缺失、重复订阅、组件卸载和低端设备。JavaScript 单测只能验证一部分协议，真机集成测试才能发现线程、权限、渲染和系统生命周期差异。</p>
<p>选择桥接方案时，先测量数据量、频率、延迟和维护成本。简单设置读取可能适合普通 TurboModule；高频动画、相机帧和大规模数据要评估原生渲染、JSI 或明确支持当前架构的后台执行库。React Native 不是浏览器，不能默认存在浏览器的 new Worker API；具体线程与运行时方案必须按平台和库说明接入。新架构提供更好的工具，但不会消除平台差异和资源生命周期。</p>`};export{e as default};