var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>inert</code> 让整棵子树退出指针操作、顺序焦点导航和辅助技术遍历，适合在打开抽屉或模态层时禁用背景。</li>
<li>它不会移动焦点，也不会在关闭后恢复焦点，这些要自己记录和处理。</li>
<li><code>aria-hidden=&quot;true&quot;</code> 只从辅助技术树隐藏内容，不禁用交互，隐藏可聚焦元素会造成冲突。</li>
<li>视觉遮罩不能阻止键盘操作，能用原生 <code>dialog.showModal()</code> 时优先使用。</li>
</ul>
<p>打开一个侧边抽屉或自定义模态层时，视觉上给背景加一层遮罩并不能阻止键盘用户继续操作背景按钮。把背景设为 <code>pointer-events: none</code> 也不够，因为它主要影响指针命中，不会自动移除 Tab 焦点或辅助技术语义。<code>inert</code> 用来表达一整棵子树在当前交互阶段暂时不可操作：用户不能通过常规方式点击、聚焦或找到其中的内容。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">main</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;page-content&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>删除账户<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">aside</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirm-panel&quot;</span> <span class="hljs-attr">hidden</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;confirm-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirm-title&quot;</span>&gt;</span>确认删除<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>确认<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>取消<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">aside</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> page = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#page-content&#x27;</span>);
<span class="hljs-keyword">const</span> panel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#confirm-panel&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">openPanel</span>(<span class="hljs-params"></span>) {
  page.<span class="hljs-property">inert</span> = <span class="hljs-literal">true</span>;
  panel.<span class="hljs-property">hidden</span> = <span class="hljs-literal">false</span>;
  panel.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;button&#x27;</span>).<span class="hljs-title function_">focus</span>();
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">closePanel</span>(<span class="hljs-params">previousFocus</span>) {
  panel.<span class="hljs-property">hidden</span> = <span class="hljs-literal">true</span>;
  page.<span class="hljs-property">inert</span> = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">if</span> (previousFocus?.<span class="hljs-property">isConnected</span>) previousFocus.<span class="hljs-title function_">focus</span>();
}
</code></pre></div>
<p>这段代码只演示背景状态和焦点恢复。生产实现还要管理 Escape、关闭按钮、滚动、异步结果和重复打开；如果能使用原生 <code>&lt;dialog&gt;.showModal()</code>，优先让浏览器承担基础模态行为，而不是自己拼一套不完整的焦点陷阱。</p>
<h2>inert 影响的是一整棵交互子树</h2>
<p>元素带有 <code>inert</code> 时，它的后代通常不会参与用户的指针操作、顺序焦点导航和辅助技术遍历。它仍然可以被 CSS 显示，文本也仍在 DOM 中；<code>inert</code> 不是 <code>display: none</code>，也不是删除节点。这个区别很重要：背景可以保持原来的布局，关闭抽屉后再恢复交互。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">page.<span class="hljs-property">inert</span> = <span class="hljs-literal">true</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(page.<span class="hljs-property">inert</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>属性和 property 可以互相反映，但组件应把它当作状态的一部分统一管理。不要只给视觉遮罩加 inert，却让真正的背景内容留在可操作区域；也不要把抽屉本身和背景一起设为 inert。使用 <code>querySelectorAll(&#x27;button&#x27;)</code> 手动逐个禁用很容易漏掉链接、输入、iframe、Shadow DOM 或后来动态插入的元素。</p>
<p><code>inert</code> 不会替你把焦点移到新打开的面板，也不会自动在关闭后恢复焦点。打开前应记录触发元素，打开后把焦点放到合理的标题、字段或按钮，关闭时检查触发元素是否仍在文档中，再选择后备焦点位置。迟到的异步回调不能在面板已经关闭后把焦点抢回去。</p>
<h2>aria-hidden 只表达可访问性可见性</h2>
<p><code>aria-hidden=&quot;true&quot;</code> 主要是从辅助技术树中隐藏内容，不是通用的交互禁用机制：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>仍然可能被键盘脚本聚焦<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>如果一个可聚焦元素或它的祖先被 aria-hidden 隐藏，用户可能遇到“焦点在一个读屏不可见控件上”的冲突。不能用 aria-hidden 代替 inert，也不能为了消除重复朗读，把仍可操作的真实内容隐藏起来。装饰图标、重复的视觉文本和关闭后的内容，才是 aria-hidden 更常见的用途。</p>
<p>同样，<code>aria-modal=&quot;true&quot;</code> 只是向辅助技术声明模态语义，不会自动阻止背景点击、Tab 或脚本操作。声明语义必须和实际行为一致；如果背景仍可操作，就不应随意标成模态。</p>
<h2>disabled 只适合支持它的表单控件</h2>
<p><code>disabled</code> 有原生表单语义，适用于 button、input、select、textarea、fieldset 等支持的控件：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">fieldset</span> <span class="hljs-attr">disabled</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>邮箱 <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;reader@example.com&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">fieldset</span>&gt;</span>
</code></pre></div>
<p>它会影响控件的焦点、交互和表单提交，但不能给普通 <code>div</code>、链接或整个页面提供相同的子树级行为。一个 disabled 的按钮也不等于背景里所有链接都变成不可操作；复杂遮罩仍需要 inert 或原生模态机制。</p>
<p>禁用控件通常不会出现在 FormData 中，readonly 控件则可能仍参与提交。组件在“正在保存”时如果把整个 form 设为 disabled，要确认是否会意外丢失需要提交的字段，以及用户是否还有取消或恢复的路径。业务状态、表单数据和无障碍状态必须分别考虑。</p>
<h2>pointer-events 和视觉隐藏只处理很窄的一层</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.backdrop</span> {
  <span class="hljs-attribute">pointer-events</span>: none;
}
</code></pre></div>
<p><code>pointer-events: none</code> 可以让鼠标或触摸事件穿透某个元素，但不会自动改变 Tab 顺序、读屏语义、脚本调用 <code>focus()</code> 的结果或表单提交。<code>visibility: hidden</code>、透明度和 <code>display: none</code> 也各有不同的布局、动画和可访问性影响，不能互相替换。</p>
<p>例如，一个关闭动画中的面板可能暂时 <code>opacity: 0</code>，但仍占据布局、捕获焦点或被读屏读取。动画状态应和 <code>inert</code>、<code>aria-hidden</code>、<code>hidden</code>、<code>pointer-events</code> 以及业务状态一起更新，避免出现“看不见但能操作”或“看得见但无法退出”的状态。</p>
<h2>原生 dialog 的模态背景有特殊规则</h2>
<p><code>dialog.showModal()</code> 会进入浏览器的模态处理，相关背景内容会以 inert 的方式被限制；<code>dialog.show()</code> 和单独设置 <code>open</code> 不具有同样的模态语义。不要为了自定义遮罩而给原生模态 dialog 的整棵页面再无条件设置 inert，否则可能把 dialog 自身、焦点恢复或关闭流程一起禁用。</p>
<p>如果项目使用自定义抽屉而不是 dialog，应该明确它是模态还是非模态：</p>
<ul>
<li>模态：背景不能操作，打开后焦点进入面板，关闭后回到触发点；</li>
<li>非模态：背景仍可操作，面板必须有独立名称、关闭方式和可预测的焦点行为；</li>
<li>临时加载锁：只锁定真正不能重复操作的区域，保留取消、错误恢复和辅助说明。</li>
</ul>
<p><code>inert</code> 是实现这些策略的工具，不是产品交互规则本身。移动端滚动、固定底部操作栏、嵌套抽屉和多个弹层同时打开时，焦点和滚动所有权要由更高层状态管理。</p>
<h2>Shadow DOM、动态内容和异步状态</h2>
<p>把宿主元素设为 inert 会影响其交互子树，但组件内部仍需测试 Shadow DOM、slot、表单关联控件和自定义事件的实际行为。动态插入的后代通常会继承当前的 inert 语义，但组件不能只在初始化时扫描一次元素，再假设未来的状态永远正确。</p>
<p>异步保存、网络错误和组件卸载可能交错发生：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">saveAndClose</span>(<span class="hljs-params">panel, page, save</span>) {
  panel.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>, <span class="hljs-string">&#x27;true&#x27;</span>);
  panel.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;[data-submit]&#x27;</span>).<span class="hljs-property">disabled</span> = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">save</span>();
    panel.<span class="hljs-property">hidden</span> = <span class="hljs-literal">true</span>;
    page.<span class="hljs-property">inert</span> = <span class="hljs-literal">false</span>;
  } <span class="hljs-keyword">catch</span> (error) {
    panel.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;[data-error]&#x27;</span>).<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;保存失败，请重试。&#x27;</span>;
  } <span class="hljs-keyword">finally</span> {
    panel.<span class="hljs-title function_">removeAttribute</span>(<span class="hljs-string">&#x27;aria-busy&#x27;</span>);
  }
}
</code></pre></div>
<p>示例只锁定提交按钮，而不是把整个 panel inert；用户仍需要能看到错误、修改输入和点击重试。若业务要在保存期间锁定整个区域，应保留取消或明确的超时恢复，并确保失败路径不会留下永久 inert。<code>aria-busy</code> 表达正在更新，不等于阻止交互；二者不要混为一谈。</p>
<h2>兼容性、测试和安全边界</h2>
<p>现代浏览器普遍支持 inert，但旧 WebView、测试环境和复杂组件组合仍应按项目目标版本验证。若需要回退，优先使用经过测试的 polyfill 或原生 dialog，而不是手写一份只禁用 button 的替代实现。能力检测可用于选择增强路径：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> supportsInert = <span class="hljs-string">&#x27;inert&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-title class_">HTMLElement</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>;
</code></pre></div>
<p><code>inert</code> 不是权限控制和安全边界。恶意脚本仍可调用接口、修改 DOM、移除属性或直接发请求；服务端必须独立做身份、权限和 CSRF 校验。它也不会阻止键盘辅助软件、浏览器开发者工具或脚本改变页面状态。</p>
<p>验收至少包括：</p>
<ul>
<li>打开、关闭、Escape、取消、保存失败和异步超时；</li>
<li>Tab/Shift+Tab、屏幕阅读器、动态插入控件和 Shadow DOM；</li>
<li>鼠标、触摸、键盘和脚本 focus 的行为是否一致；</li>
<li>多个弹层、移动端滚动、页面隐藏和组件卸载；</li>
<li>aria-hidden、aria-modal、disabled、hidden 和 inert 是否与真实交互一致；</li>
<li>旧浏览器回退，以及服务端权限不依赖前端“禁用”状态。</li>
</ul>
<p><code>inert</code> 解决的是“这棵内容树当前不应被用户交互和辅助技术发现”，而 <code>aria-hidden</code>、<code>disabled</code> 和 <code>pointer-events</code> 各自只解决更窄的问题。把焦点、滚动、语义、表单和异步生命周期统一建模，才能避免遮罩看起来正确、实际操作却仍然混乱。</p>`};export{e as default};