var e={answerHtml:`<p>服务端渲染页面首屏很快，客户端接管时却出现“文本内容不匹配”、按钮失去状态或整棵子树被重新渲染。Hydration 不是把服务端 HTML 再生成一遍，而是让客户端框架把已有 DOM 与它第一次计算出的虚拟结构对应起来。因此服务端输出和客户端首次渲染必须在同一输入下得到一致结果。</p>
<h2>首次渲染需要确定性</h2>
<p>下面这些值如果在服务端和浏览器分别计算，很容易不同：</p>
<ul>
<li><code>Date.now()</code>、<code>new Date()</code> 和本地时区；</li>
<li><code>Math.random()</code> 或未固定种子的随机 ID；</li>
<li>只在浏览器存在的 <code>window</code>、<code>document</code>、<code>localStorage</code>；</li>
<li>服务端和客户端拿到的异步数据不同；</li>
<li>根据窗口宽度、媒体查询或用户代理直接分支；</li>
<li>依赖环境变量、默认语言或排序规则的格式化。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 容易产生不一致：两端渲染时刻可能不同</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Clock</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">time</span>&gt;</span>{new Date().toLocaleTimeString()}<span class="hljs-tag">&lt;/<span class="hljs-name">time</span>&gt;</span></span>;
}
</code></pre></div>
<p>更稳妥的做法是由服务端把确定的时间、语言和数据放进序列化 payload，客户端首次渲染使用同一份值；需要读取浏览器环境的逻辑放到挂载后的 Effect 或客户端专属边界中。这样做不是为了掩盖差异，而是明确“首次 HTML”和“接管后更新”的时间边界。</p>
<h2>浏览器专属状态不能参与服务端首次结构</h2>
<p>例如主题、窗口宽度和本地存储中的草稿在服务端不可知。可以先渲染稳定的占位状态，客户端挂载后读取并更新；如果必须避免闪烁，可以在 HTML 生成前使用受信任的 cookie 或内联初始化脚本，但脚本仍要经过 CSP 和输入校验。不要在渲染阶段直接访问 <code>window</code>，即使通过 <code>typeof window !== &#x27;undefined&#x27;</code> 包住，也可能让两端树形结构不同。</p>
<h2>异步数据要共享快照并处理失效</h2>
<p>服务端请求到的列表可能在 HTML 生成后已经变化。客户端如果重新请求并在首次渲染前使用新结果，就会出现不同结构。常见方案是把服务端数据和版本写入 payload，客户端先复用它，再在接管完成后重新验证。数据包含用户权限时，服务端和客户端都要使用同一会话上下文，不能把服务端私有字段暴露到公开 HTML。</p>
<p>请求失败、超时和部分数据也必须有稳定的占位结构。不能让服务端显示“加载失败”而客户端立刻显示真实列表，再把警告当成无害噪声；这会造成可访问性、焦点和事件绑定的不确定行为。</p>
<h2>随机 ID 和列表 key 需要跨端稳定</h2>
<p>标签的 id 与 aria-describedby 会成为真实 HTML 属性，需要在两端一致。优先使用框架支持的跨端 ID 机制或复用服务端生成的值，不能在渲染阶段两边各生成一次随机值。</p>
<p>列表 key 则是框架协调节点身份的提示，React 不会将它作为普通 DOM 属性输出，不能依靠修改 key 修复浏览器已经存在的错误 HTML。可变列表应使用稳定记录 ID；数组下标在插入、删除和重排时可能错误复用状态，随机 key 则可能导致重复挂载。静态列表使用下标不必然导致 hydration 警告，首次节点内容和后续身份维护是两个相关但不同的问题。</p>
<h2>原始 HTML 一样，解析后的 DOM 也可能不同</h2>
<p>浏览器会按 HTML 解析规则修复不合法嵌套。比如服务端输出：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>订单说明<span class="hljs-tag">&lt;<span class="hljs-name">div</span>&gt;</span>配送地址<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p>div 不能作为 p 的普通子元素，浏览器解析时会提前结束段落。框架客户端若仍预期“p 包含 div”，接管的节点树就不一致。类似地，表格中省略 tbody 也可能使解析器补入节点。</p>
<p>修复应改变结构，例如使用外层 div 包含独立 p 和地址区域，而不是抑制警告。排查时同时比较网络响应原文、浏览器解析后的 Elements 树与客户端组件结构；浏览器扩展或接管前执行的脚本也可能改变 DOM。页面截图相似不能证明节点层级一致。</p>
<h2>排查时先定位第一处差异</h2>
<ol>
<li>保存服务端返回的原始 HTML，和浏览器首次渲染前的预期结构比较。</li>
<li>查找第一条警告对应的元素，不要先给整棵树加 <code>suppress</code> 或静默选项。</li>
<li>搜索渲染路径中的时间、随机、环境 API、语言格式化和异步数据。</li>
<li>在服务端和客户端记录脱敏后的输入摘要、locale、数据版本和组件路径。</li>
<li>在固定时区、语言、数据和窗口尺寸下复现，再逐一恢复动态输入。</li>
</ol>
<p>框架警告可能只指出附近节点，真正原因在更上游的条件分支。开发环境和生产构建的编译、默认值及压缩行为也可能不同，应使用生产构建复现一次。</p>
<h2>什么时候可以接受局部差异</h2>
<p>时间、广告或纯装饰内容确实可能在接管后更新，但应把差异限制在明确的客户端边界，并确保初始语义、布局和可交互控件一致。框架提供的 suppress 选项通常只适合已知且局部的文本差异，不能用来掩盖整棵子树、权限内容或用户数据不一致。</p>
<p>如果组件依赖浏览器环境且无法提供稳定的服务端结构，可以让它只在客户端挂载，或使用稳定占位符。代价是首屏 HTML 和 SEO 信息减少，因此应把这一选择限制在确实需要浏览器能力的部分。</p>
<h2>性能、安全和兼容性边界</h2>
<p>Hydration 失败后框架可能丢弃服务端节点并重新创建，增加主线程工作、布局和输入延迟。频繁警告还会掩盖真正的错误。把用户输入、权限状态或服务端异常直接序列化到 HTML 也可能造成 XSS 或敏感数据泄露，序列化必须使用框架安全机制并限制字段。</p>
<p>不同框架对恢复策略、错误提示和局部更新的行为不同，必须按当前版本官方文档验证。SSR 页面还要在禁用 JavaScript、慢网络、浏览器扩展和辅助技术环境下检查基础内容；Hydration 只是接管机制，不是对页面语义或业务权限的保证。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://react.dev/reference/react-dom/client/hydrateRoot">React · hydrateRoot</a></li>
<li><a href="https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch">Vue · SSR Hydration</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat">MDN · Date and time formats</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/parsing.html">WHATWG · HTML parsing</a></li>
</ul>`};export{e as default};