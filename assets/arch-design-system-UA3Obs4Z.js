var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>视觉样式只回答“长什么样”。可是一个按钮还要回答很多别的问题：能不能用键盘按、屏幕阅读器读出来是什么、加载中能不能重复点。设计系统要把这些都定下来。</p>
<p>所以设计系统一般包括几部分：设计 token 管颜色间距这些设计决策，基础组件管通用交互，再加上使用文档、测试，以及版本发布和迁移流程。</p>
<p>基础组件的价值在于把键盘操作、焦点管理、可访问名称一次做对，业务团队直接用，不用每个团队各写一遍、各出各的错。组件的参数、事件和插槽就是它对外的 API，改动要按版本发布，并给出迁移说明。</p>
<p>要注意分清边界。业务组件建立在基础组件之上，应该放在业务仓库里，不要什么都往设计系统里塞。</p>
</blockquote>
<h2>只有样式会出什么问题</h2>
<p>假设设计系统只给了一个 <code>.btn-primary</code> 类，看看各团队会怎么用。</p>
<p>有人把这个类加在 <code>&lt;div&gt;</code> 上当按钮。看起来一模一样，可是键盘没法聚焦到它，屏幕阅读器也读不出这是个按钮。加载状态和禁用状态各团队自己写，有的禁用了还能提交，有的加载时一点反馈都没有。图标按钮没有文字，读屏软件只能读出“按钮”两个字，用户根本不知道它是干什么的。</p>
<p>这些都是行为和语义上的问题。样式统一得再好，也解决不了它们。</p>
<h2>组件契约要约定什么</h2>
<p>组件契约，就是组件对使用者做出的承诺：传什么参数、会渲染成什么、在各种状态下怎么表现。先看用法：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx">&lt;<span class="hljs-title class_">Button</span> variant=<span class="hljs-string">&quot;primary&quot;</span> loading={saving} onClick={save}&gt;
  保存
&lt;/<span class="hljs-title class_">Button</span>&gt;
<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">IconButton</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;删除&quot;</span> <span class="hljs-attr">icon</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">TrashIcon</span> /&gt;</span>} onClick={remove} /&gt;</span>
</code></pre></div>
<p>使用者只写了这几行，背后的契约要包括这些内容。</p>
<p>语义上，<code>Button</code> 渲染原生的 <code>&lt;button&gt;</code>，并且默认 <code>type=&quot;button&quot;</code>。因为表单里的按钮默认是提交按钮，不写这个，放进表单就可能意外提交。</p>
<p>状态上，<code>loading</code> 为真时设置 <code>aria-busy</code>，同时阻止重复点击，还要保留按钮宽度，免得文字变成转圈图标时布局跳一下。</p>
<p>必填信息上，<code>IconButton</code> 把 <code>label</code> 设成必填参数。这样漏写可访问名称的代码，类型检查阶段就会报错，不用等上线后被读屏用户发现。</p>
<p>扩展点上，允许传哪些原生属性、能不能覆盖样式，都要写清楚。不说清楚，使用者就会各自想办法绕。</p>
<h2>各部分分别负责什么</h2>
<table><thead><tr><th>部分</th><th>职责</th></tr></thead><tbody><tr><td>设计 token</td><td>颜色、间距、字号、圆角等设计决策的单一来源</td></tr><tr><td>基础组件</td><td>按钮、输入框、对话框等通用交互，内置语义和可访问性</td></tr><tr><td>文档</td><td>何时使用、何时不用、示例和反例</td></tr><tr><td>测试</td><td>交互测试、可访问性检查、视觉回归</td></tr><tr><td>版本发布</td><td>语义化版本、变更日志、迁移指南、废弃周期</td></tr></tbody></table>
<p>组合框、菜单、对话框这类复杂组件，键盘交互可以参考 WAI-ARIA APG 里的模式来实现。APG 是 W3C 整理的无障碍交互模式指南，但它的示例不是生产级组件库，做完以后仍然要在真实的读屏软件里测试。</p>
<h2>组件改了，怎样不把业务搞坏</h2>
<p>新增参数时保持向后兼容，旧代码不用动。如果要修改默认行为或删掉参数，就要升主版本，因为这会让已有代码的表现发生变化。</p>
<p>要废弃一个参数，不要直接删。先在开发模式下打警告，留出迁移时间，必要时提供代码转换脚本帮业务批量改。同时统计各业务对组件的使用情况，这样改之前就知道影响面有多大。</p>
<h2>常见追问</h2>
<p><strong>设计系统团队和业务团队怎样分工？</strong></p>
<blockquote>
<p>设计系统团队负责通用组件和规范，业务团队负责业务组件。业务里反复出现的模式，确认是通用的，再沉淀回设计系统。</p>
</blockquote>
<p><strong>直接用现成的组件库可以吗？</strong></p>
<blockquote>
<p>可以拿来当基础。但还需要在它上面统一 token、补充自己的使用规范，并锁定版本、有计划地升级。</p>
</blockquote>`};export{e as default};