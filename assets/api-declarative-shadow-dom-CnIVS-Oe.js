var e={answerHtml:`<p>传统 Shadow DOM 通常在浏览器执行 JavaScript 后才创建：自定义元素构造器调用 <code>attachShadow()</code>，再把模板插入根节点。这样组件在脚本下载和执行前没有内部结构，服务端渲染的 HTML 也无法直接包含封装后的 Shadow DOM。</p>
<p>Declarative Shadow DOM（声明式 Shadow DOM）允许 HTML 解析器直接把一个带 <code>shadowrootmode</code> 的 <code>&lt;template&gt;</code> 变成 Shadow Root：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">user-card</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">template</span> <span class="hljs-attr">shadowrootmode</span>=<span class="hljs-string">&quot;open&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">style</span>&gt;</span><span class="css">
      <span class="hljs-selector-pseudo">:host</span> { <span class="hljs-attribute">display</span>: block; <span class="hljs-attribute">padding</span>: <span class="hljs-number">12px</span>; <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#ccc</span>; }
      <span class="hljs-selector-class">.name</span> { <span class="hljs-attribute">font-weight</span>: <span class="hljs-number">600</span>; }
    </span><span class="hljs-tag">&lt;/<span class="hljs-name">style</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;name&quot;</span>&gt;</span>服务端输出的用户名<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">template</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">user-card</span>&gt;</span>
</code></pre></div>
<p>浏览器支持该能力时，模板内容会成为 <code>user-card</code> 的 Shadow Root，模板元素本身不再作为普通 light DOM 节点保留。组件的内部样式在解析后即可生效，不必等待客户端脚本创建根。这样服务端可以输出可见内容和封装样式，减少首屏空白，并为后续自定义元素升级保留结构。</p>
<h2>声明式模板和普通 template 不是同一回事</h2>
<p>普通 <code>&lt;template&gt;</code> 的内容默认处于惰性文档片段中，不会自动渲染：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">template</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>这段内容不会直接显示<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">template</span>&gt;</span>
</code></pre></div>
<p>只有识别 <code>shadowrootmode=&quot;open&quot;</code> 或 <code>shadowrootmode=&quot;closed&quot;</code> 的浏览器，才把对应模板当作声明式 Shadow DOM。旧浏览器可能把它当普通 template，用户看不到模板里的主要内容；因此不能把模板本身当成完整的跨浏览器渐进增强方案，需要提供兼容路径或服务端输出可用的 light DOM。</p>
<p><code>open</code> 允许脚本通过 <code>element.shadowRoot</code> 获取根，<code>closed</code> 则不暴露这个属性。两者都不是安全沙箱，也不能阻止同一页面中的脚本读取、修改或观察组件逻辑。选择 open/closed 是封装和调试 API 设计，不是权限控制。</p>
<h2>自定义元素升级时怎样接管已存在的 Shadow Root</h2>
<p>声明式 Shadow DOM 的价值之一是：HTML 可以先显示结构，随后自定义元素类再接管交互。构造器不能无条件在已有根上再次创建第二个 Shadow Root；在支持的实现中，使用相同模式调用 <code>attachShadow()</code> 可以取得并清空已存在的声明式根，从而让组件完成 hydration：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">UserCard</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">HTMLElement</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">super</span>();
    <span class="hljs-keyword">const</span> root = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachShadow</span>({ <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;open&#x27;</span> });
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">nameElement</span> = root.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;.name&#x27;</span>);
  }

  <span class="hljs-title function_">connectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-variable language_">this</span>.<span class="hljs-property">handleClick</span>);
  }

  <span class="hljs-title function_">disconnectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-variable language_">this</span>.<span class="hljs-property">handleClick</span>);
  }

  handleClick = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">dispatchEvent</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">CustomEvent</span>(<span class="hljs-string">&#x27;user-card-activated&#x27;</span>, {
      <span class="hljs-attr">bubbles</span>: <span class="hljs-literal">true</span>,
      <span class="hljs-attr">composed</span>: <span class="hljs-literal">true</span>,
    }));
  };
}

customElements.<span class="hljs-title function_">define</span>(<span class="hljs-string">&#x27;user-card&#x27;</span>, <span class="hljs-title class_">UserCard</span>);
</code></pre></div>
<p>构造器中拿到的根必须与声明式模板的 mode 匹配；不要把 <code>closed</code> 的根改成 <code>open</code> 来“修复”升级。真实框架集成还要处理服务端输出和客户端状态是否一致、重复绑定事件、属性初始值以及异步数据到达顺序。Shadow DOM 已经存在并不代表交互逻辑自动完成，hydration 仍需有明确的组件状态模型。</p>
<p>如果浏览器不支持声明式根，<code>attachShadow()</code> 的行为和模板仍会走兼容路径。应用可以在自定义元素升级时检测 <code>this.shadowRoot</code>、创建普通 Shadow Root，并从模板或服务器数据恢复结构；但不要假设旧浏览器已经解析并保存了 <code>shadowrootmode</code> 的内容。兼容策略应由构建目标和实际浏览器测试决定。</p>
<h2>SSR 输出要区分可见结构和交互状态</h2>
<p>声明式 Shadow DOM 让服务端能输出样式和文本，但服务端仍不能替浏览器保存任意运行时对象、事件监听器和用户权限。下列内容可以作为首屏结构：</p>
<ul>
<li>已经脱敏、允许当前用户看到的文字和图片；</li>
<li>组件的语义结构、slot 占位和初始展示状态；</li>
<li>不依赖浏览器测量结果的 CSS 和可访问名称。</li>
</ul>
<p>下列内容要在客户端根据可信状态重新验证：</p>
<ul>
<li>登录权限、支付按钮是否可用和用户特有操作；</li>
<li>依赖 <code>window</code>、设备能力、尺寸或当前时间的结果；</li>
<li>事件监听、网络连接、计时器和 Worker；</li>
<li>不能直接信任的服务端输出或用户输入。</li>
</ul>
<p>Shadow DOM 不会让输出数据自动保密。只要内容出现在 HTML、可访问树、客户端属性或脚本能读到的状态里，用户就可能看到它。服务端必须在生成 HTML 前完成授权和字段筛选，不能把“组件内部”当成隐藏敏感信息的方法。</p>
<h2>slot 和 light DOM 的边界仍然存在</h2>
<p>声明式根内部可以使用 slot，让外部 light DOM 内容参与显示：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">notice-box</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">slot</span>=<span class="hljs-string">&quot;title&quot;</span>&gt;</span>保存结果<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>内容来自宿主页面。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">template</span> <span class="hljs-attr">shadowrootmode</span>=<span class="hljs-string">&quot;open&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">style</span>&gt;</span><span class="css"><span class="hljs-selector-pseudo">:host</span> { <span class="hljs-attribute">display</span>: block; }</span><span class="hljs-tag">&lt;/<span class="hljs-name">style</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">slot</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;title&quot;</span>&gt;</span>提示<span class="hljs-tag">&lt;/<span class="hljs-name">slot</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">slot</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">slot</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">template</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">notice-box</span>&gt;</span>
</code></pre></div>
<p>slot 是内容分发，不是复制 DOM。外部节点仍属于 light DOM，内部 CSS 不能随意选择其后代；继承、自定义属性和事件的 composed/bubbles 规则仍影响组件接口。服务端渲染 slot 时要确保 name、顺序和无障碍阅读顺序一致，不能只根据视觉位置猜测屏幕阅读器会怎样朗读。</p>
<p>自定义事件如果要穿过 Shadow Root，需要显式设置 <code>composed: true</code>，但 detail 中不要放未经筛选的内部对象、DOM 节点或敏感数据。事件 API 是组件公共契约的一部分，应记录名称、目标、detail 结构和取消语义。</p>
<h2>资源和样式并不会自动零成本</h2>
<p>Shadow DOM 隔离选择器范围，有助于组件样式不互相污染，但每个组件模板仍会产生解析、样式计算和布局成本。大量重复内联 <code>&lt;style&gt;</code>、大规模服务器输出和深层 slot 结构可能增加 HTML 体积和渲染工作。共享样式表、构建时抽取和组件按需加载是否更合适，要结合浏览器支持和实际性能测量决定。</p>
<p>声明式根中的样式会随着 HTML 到达而解析，仍可能造成样式更新和布局变化。给图片和媒体预留尺寸、控制自定义字体加载、避免首屏脚本修改服务端结构，通常比单独追求“使用 Shadow DOM”更能改善体验。Shadow DOM 不能替代资源提示、缓存、骨架策略和性能预算。</p>
<h2>与框架 SSR 和 hydration 的关系</h2>
<p>React、Vue、Svelte 或其他框架可以把自定义元素当作输出目标，但框架的 hydration 机制和 Declarative Shadow DOM 的升级机制不是同一个协议。需要明确：</p>
<ul>
<li>服务端输出的 <code>&lt;template shadowrootmode&gt;</code> 是否会被框架保留或重新渲染；</li>
<li>客户端是否会再次创建节点，导致事件重复或 DOM 不匹配；</li>
<li>属性字符串、property 对象和自定义事件如何从框架边界传递；</li>
<li>不支持声明式 Shadow DOM 的浏览器是否有同等可用的渲染路径；</li>
<li>路由导航和局部更新时，旧 Shadow Root 的事件与资源是否正确清理。</li>
</ul>
<p>不要仅凭一个静态 HTML 示例宣布框架支持。应在目标框架版本中验证首屏、刷新、客户端导航、错误恢复、无 JavaScript、脚本延迟和自定义元素升级顺序。服务端组件输出的内容仍需要按框架和浏览器的实际协议处理，不能把 <code>template</code> 当成任意框架的通用 hydration 格式。</p>
<h2>安全、无障碍和兼容性验收</h2>
<p>声明式 Shadow DOM 不是 XSS 防护。服务端输出到模板中的用户内容必须按文本节点或安全渲染规则处理，不能把用户输入直接拼入 <code>innerHTML</code>。Shadow Root 的封装也不能阻止同源恶意脚本修改宿主、监听事件或调用组件公开方法。</p>
<p>无障碍验收要从用户任务开始：宿主的 label、标题、错误文本和焦点是否可获得；slot 内容是否有正确阅读顺序；关闭或禁用状态是否同步到语义属性；组件在无 JavaScript 时是否仍提供合理的静态内容。Shadow DOM 的边界可能影响选择器和测试工具查找，测试应使用用户可见语义和公开契约，而不是依赖内部 class 名。</p>
<p>目标浏览器和 WebView 对 Declarative Shadow DOM、closed root、模板流式解析以及相关序列化能力的支持存在差异。应做能力检测并保留回退，不要把未知属性被忽略的行为当成可靠降级。至少测试：</p>
<ul>
<li>支持和不支持声明式 Shadow DOM 的浏览器；</li>
<li>SSR 首屏、脚本延迟、无脚本和自定义元素晚注册；</li>
<li><code>open</code>/<code>closed</code>、slot、事件穿透和表单关联组件；</li>
<li>页面导航、组件移除、重复升级和异步数据迟到；</li>
<li>用户输入转义、权限变化、键盘焦点和屏幕阅读器。</li>
</ul>
<p>Declarative Shadow DOM 的核心价值是把 Shadow DOM 纳入 HTML/SSR 管线，让组件在客户端脚本执行前就能拥有封装结构。它不替代自定义元素生命周期、框架 hydration、服务端授权和渐进增强；只有把结构输出、状态接管、事件清理和兼容回退一起设计，首屏收益才不会变成新的维护问题。</p>`};export{e as default};