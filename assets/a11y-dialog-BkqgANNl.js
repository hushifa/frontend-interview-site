var e={answerHtml:`<p>模态对话框不只是页面上盖了一块带阴影的面板。打开以后，用户应该清楚自己进入了什么内容，焦点落在合理位置，背景暂时不可操作，完成或取消后还能回到原来的工作流程。</p>
<p>如果视觉上出现遮罩，键盘却能一路 Tab 到遮罩下面的按钮，或者读屏用户根本不知道有一个对话框打开，就还没有实现完整的模态行为。</p>
<h2>打开时，焦点放在哪里要由内容决定</h2>
<p>短设置表单通常可以聚焦第一个需要填写的字段。较长的说明、表格或列表，可以先把焦点放在顶部标题或适合的静态元素上，让用户从内容起点理解结构，而不是直接跳到下面的操作按钮。</p>
<p>涉及删除、支付等难以撤销的操作时，初始焦点可以优先放在较不具破坏性的动作上。不要一概认定“打开弹窗就必须聚焦确认按钮”。</p>
<p>静态标题需要被脚本聚焦时，可以为它设置 tabindex -1。原生 dialog 元素本身不要随意添加 tabindex；应优先为合适的内部元素设置 autofocus 或按需要移动焦点。</p>
<h2>对话框要有名称，但不必朗读整篇正文</h2>
<p>可见标题通常通过 aria-labelledby 成为对话框的可访问名称。没有可见标题时才根据设计提供合适的 aria-label，而不是让读屏用户只听到一个没有主题的“对话框”。</p>
<p>aria-describedby 可以关联简短说明，但复杂或很长的正文不应全部拼成一次描述。让用户按标题、段落、列表等语义结构阅读，通常比进入弹窗时连续朗读几千字更可控。</p>
<p>自定义容器设置 <code>role=&quot;dialog&quot;</code>、<code>aria-modal=&quot;true&quot;</code> 只表达语义，不会自动限制焦点、阻止背景点击或管理键盘。只有实际行为确实是模态时，才应声明相应模态语义。</p>
<h2>优先让原生 dialog 承担基础模态行为</h2>
<p>使用 showModal() 打开的 dialog 会进入浏览器的模态处理，并使相关背景内容 inert。show() 或只添加 open 属性不具有同样的模态行为，不能混用后还假定背景被阻止。</p>
<p>下面是一个仅在当前页面保存邮箱选择的例子，没有发送网络请求：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings-heading&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>个人设置<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;open-settings&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>修改联系邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings-result&quot;</span>&gt;</span>尚未修改邮箱。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">dialog</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings-dialog&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;settings-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings-title&quot;</span>&gt;</span>修改联系邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;dialog&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;settings-email&quot;</span>&gt;</span>联系邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings-email&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;reader@example.com&quot;</span> <span class="hljs-attr">required</span> <span class="hljs-attr">autofocus</span> /&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;save&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;cancel&quot;</span> <span class="hljs-attr">formnovalidate</span>&gt;</span>取消<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">dialog</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindSettingsDialog</span>(<span class="hljs-params">openButton, dialog, result, fallback</span>) {
  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> email = dialog.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#settings-email&#x27;</span>);
  <span class="hljs-keyword">let</span> savedEmail = email.<span class="hljs-property">value</span>;

  openButton.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (dialog.<span class="hljs-property">open</span>) <span class="hljs-keyword">return</span>;
    email.<span class="hljs-property">value</span> = savedEmail;
    dialog.<span class="hljs-property">returnValue</span> = <span class="hljs-string">&#x27;&#x27;</span>;
    dialog.<span class="hljs-title function_">showModal</span>();
  }, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });

  dialog.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;close&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (dialog.<span class="hljs-property">returnValue</span> === <span class="hljs-string">&#x27;save&#x27;</span>) {
      savedEmail = email.<span class="hljs-property">value</span>;
      result.<span class="hljs-property">textContent</span> = <span class="hljs-string">\`当前联系邮箱：<span class="hljs-subst">\${savedEmail}</span>\`</span>;
    }

    <span class="hljs-keyword">if</span> (openButton.<span class="hljs-property">isConnected</span> &amp;&amp; !openButton.<span class="hljs-property">disabled</span>) openButton.<span class="hljs-title function_">focus</span>();
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">activeElement</span> !== openButton) fallback?.<span class="hljs-title function_">focus</span>();
  }, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    listeners.<span class="hljs-title function_">abort</span>();
    <span class="hljs-keyword">if</span> (dialog.<span class="hljs-property">open</span>) dialog.<span class="hljs-title function_">close</span>();
  };
}
</code></pre></div>
<p>DOM 就绪后，将示例中的触发按钮、dialog、结果段落和 settings-heading 传给函数。浏览器负责表单约束验证，合法提交后，method=dialog 让对话框关闭，并把提交按钮的 value 写入 returnValue；它不把数据提交到服务器。</p>
<p>保存是这个表单的首个提交按钮，使输入框中的原生 Enter 隐式提交对应保存。不要只调整按钮视觉顺序，却忽略默认提交按钮也可能随结构改变。</p>
<p>取消按钮设置 formnovalidate，因此输入为空或格式错误时，用户仍然能取消。Escape 通常通过浏览器的关闭请求流程关闭对话框，不应为了简单方便把它无条件禁止。</p>
<p>每次打开先清空 returnValue，是为了不把上一次保存留下的值误当成本次 Escape 关闭后的保存结果；重新填入 savedEmail 则保证取消的编辑不会变成下一次打开的已保存值。</p>
<h2>Tab、Shift+Tab 与关闭应该形成完整闭环</h2>
<p>模态交互应让用户在内部有效控件之间前后移动，而不把焦点落到背景控件。应验证首尾位置、动态出现的字段、禁用按钮和内容滚动，而不是只看第一个 input 能否获得焦点。</p>
<p>原生 dialog 或成熟组件库能承担很多基础行为，但仍需在目标浏览器测试。背景不可交互也不等于所有滚动手势都自动符合设计，移动端、长内容和固定元素需要单独检查。</p>
<p>除了 Escape，应有可发现的关闭或取消按钮。点遮罩关闭是否启用取决于场景，不应把它当成所有对话框的唯一退出方式。不同关闭方式的结果也应区分，避免点击关闭图标却意外保存。</p>
<p>如果触发按钮仍存在，关闭后通常回到它；若它因操作已被删除，则选择下一条记录、适合的标题或其他合理位置。示例提供了后备焦点目标，不会盲目对已经离开文档的按钮调用 focus 后就认为完成恢复。</p>
<h2>真正异步保存时，不要照搬自动关闭表单</h2>
<p>如果点击保存还要等待接口，通常需要拦截提交、执行校验和请求，并在成功后明确关闭；失败则保留对话框与用户输入，提供可理解的错误与重试方式。</p>
<p>原生 method=dialog 的示例适合演示本地选择，不意味着点击提交后关闭就代表服务端保存成功。请求取消、重复提交、组件销毁和过期结果也需要应用层处理。</p>
<p>嵌套模态框还要管理层级，关闭最上层后应恢复到下层的合理位置，而不是总跳回最外层触发按钮。复杂场景优先使用已经验证过焦点与弹层行为的组件库，避免自己用一份静态选择器列表拼出不完整的焦点陷阱。</p>
<p>最终验收应从触发按钮开始，用键盘完成打开、错误输入、取消、保存和恢复，并用真实读屏确认名称、状态和错误描述。DOM 上有 role 和 ARIA，只是可访问性的一部分。</p>`};export{e as default};