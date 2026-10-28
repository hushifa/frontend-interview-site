var e={answerHtml:`<h2>简答</h2>
<ul>
<li>视觉样式只回答&quot;长什么样&quot;；设计系统还要定义组件怎样交互、用什么语义元素、支持哪些状态和参数。</li>
<li>组成部分通常包括：设计 token、基础组件、使用规范与文档、测试，以及版本和迁移流程。</li>
<li>基础组件要内置键盘操作、焦点管理和可访问名称，避免每个业务团队重复实现、各自出错。</li>
<li>组件的参数、事件和插槽就是它的公开 API，改动要按版本发布并提供迁移说明。</li>
<li>业务组件建立在基础组件之上，放在业务仓库，不要都塞进设计系统。</li>
</ul>
<h2>只有样式会出什么问题</h2>
<p>假设设计系统只提供一套 <code>.btn-primary</code> 样式：</p>
<ul>
<li>有人给 <code>&lt;div&gt;</code> 加上这个类当按钮用，键盘无法聚焦，屏幕阅读器读不出它是按钮。</li>
<li>加载状态、禁用状态各团队自己实现，有的禁用后还能提交，有的加载时没有反馈。</li>
<li>图标按钮缺少可访问名称，读屏只能读出&quot;按钮&quot;。</li>
</ul>
<p>这些都是行为和语义问题，样式统一了也解决不了。</p>
<h2>组件契约</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx">&lt;<span class="hljs-title class_">Button</span> variant=<span class="hljs-string">&quot;primary&quot;</span> loading={saving} onClick={save}&gt;
  保存
&lt;/<span class="hljs-title class_">Button</span>&gt;
<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">IconButton</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;删除&quot;</span> <span class="hljs-attr">icon</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">TrashIcon</span> /&gt;</span>} onClick={remove} /&gt;</span>
</code></pre></div>
<p>契约包括：</p>
<ul>
<li><strong>语义</strong>：<code>Button</code> 渲染原生 <code>&lt;button&gt;</code>，默认 <code>type=&quot;button&quot;</code>，防止在表单里意外提交。</li>
<li><strong>状态</strong>：<code>loading</code> 时设置 <code>aria-busy</code> 并阻止重复点击，同时保留按钮宽度避免布局跳动。</li>
<li><strong>必填信息</strong>：<code>IconButton</code> 把 <code>label</code> 设为必填参数，类型检查直接阻止缺少可访问名称的写法。</li>
<li><strong>扩展点</strong>：允许传入哪些原生属性、能否覆盖样式，都要明确。</li>
</ul>
<h2>各部分的职责</h2>
<table><thead><tr><th>部分</th><th>职责</th></tr></thead><tbody><tr><td>设计 token</td><td>颜色、间距、字号、圆角等设计决策的单一来源</td></tr><tr><td>基础组件</td><td>按钮、输入框、对话框等通用交互，内置语义和可访问性</td></tr><tr><td>文档</td><td>何时使用、何时不用、示例和反例</td></tr><tr><td>测试</td><td>交互测试、可访问性检查、视觉回归</td></tr><tr><td>版本发布</td><td>语义化版本、变更日志、迁移指南、废弃周期</td></tr></tbody></table>
<p>复杂组件（组合框、菜单、对话框）可以参考 WAI-ARIA APG 的模式实现键盘交互，但 APG 示例不是生产级组件库，仍需在真实读屏软件中测试。</p>
<h2>演进</h2>
<ul>
<li>新增参数保持向后兼容；修改默认行为或删除参数要升主版本。</li>
<li>废弃前先在开发模式下给出警告，留出迁移时间，必要时提供代码转换脚本。</li>
<li>统计各业务对组件的使用情况，判断改动影响面。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>设计系统团队和业务团队怎样分工？设计系统负责通用组件和规范，业务团队负责业务组件；业务中反复出现的模式再沉淀回设计系统。</li>
<li>直接用现成组件库可以吗？可以作为基础，仍需要在其上统一 token、补充规范，并锁定版本管理升级。</li>
</ul>`};export{e as default};