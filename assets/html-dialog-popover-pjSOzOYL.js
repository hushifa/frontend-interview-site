var e={answerHtml:`<h2>简答</h2>
<ul>
<li>背景在任务完成前不应被操作时用 <code>dialog.showModal()</code>，用户仍可操作背景时用 Popover API。</li>
<li><code>showModal()</code> 把对话框放入 top layer 并让外部内容不可交互；<code>show()</code> 或直接加 <code>open</code> 只是非模态。</li>
<li><code>&lt;form method=&quot;dialog&quot;&gt;</code> 提交时关闭对话框，提交按钮的 value 成为 <code>returnValue</code>。</li>
<li>每次打开都应从已保存的值恢复控件，取消后才不会留下未保存的修改。</li>
</ul>
<p>“出现在其他内容上面”只是视觉特征。一个要求先完成选择才能继续的设置对话框，和一段随时可以打开又关闭的补充说明，交互要求并不相同。</p>
<p>如果背景页面在当前任务完成前不应被操作，可以使用 dialog 的模态模式；如果用户仍可与背景内容交互，Popover API 更适合管理轻量的非模态浮层。二者都能与浏览器的 top layer 机制配合，但顶层显示与模态交互不是同一个概念。</p>
<h2>showModal 与 show 的差别</h2>
<p><code>dialog.showModal()</code> 打开模态对话框，将其放入 top layer，浏览器会让对话框以外的相关页面内容处于不可交互的状态，并提供相应的焦点与关闭机制。<code>dialog.show()</code> 打开的是非模态对话框，不会以同样方式阻断背景。</p>
<p>直接添加 open 属性也只是打开非模态对话框，不能把 <code>&lt;dialog open&gt;</code> 当作 showModal 的替代。给普通 div 加遮罩、巨大 z-index 或 <code>aria-modal=&quot;true&quot;</code>，也不会自动获得浏览器的模态交互实现。</p>
<h2>一个有明确保存与取消语义的设置框</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;open-settings&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>阅读设置<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">dialog</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;settings-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;dialog&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings-title&quot;</span>&gt;</span>阅读设置<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;density&quot;</span>&gt;</span>内容密度<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">select</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;density&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;density&quot;</span> <span class="hljs-attr">autofocus</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">option</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;comfortable&quot;</span>&gt;</span>舒适<span class="hljs-tag">&lt;/<span class="hljs-name">option</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">option</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;compact&quot;</span>&gt;</span>紧凑<span class="hljs-tag">&lt;/<span class="hljs-name">option</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">select</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;cancel&quot;</span> <span class="hljs-attr">formnovalidate</span>&gt;</span>取消<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;save&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">dialog</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;settings-status&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> opener = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#open-settings&#x27;</span>);
<span class="hljs-keyword">const</span> dialog = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#settings&#x27;</span>);
<span class="hljs-keyword">const</span> density = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#density&#x27;</span>);
<span class="hljs-keyword">const</span> status = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#settings-status&#x27;</span>);
<span class="hljs-keyword">let</span> savedDensity = <span class="hljs-string">&#x27;comfortable&#x27;</span>;

opener.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  density.<span class="hljs-property">value</span> = savedDensity;
  <span class="hljs-comment">// Escape 关闭不应沿用上一次保存留下的返回值。</span>
  dialog.<span class="hljs-property">returnValue</span> = <span class="hljs-string">&#x27;&#x27;</span>;
  dialog.<span class="hljs-title function_">showModal</span>();
});

dialog.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;close&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (dialog.<span class="hljs-property">returnValue</span> === <span class="hljs-string">&#x27;save&#x27;</span>) {
    savedDensity = density.<span class="hljs-property">value</span>;
    status.<span class="hljs-property">textContent</span> = savedDensity === <span class="hljs-string">&#x27;compact&#x27;</span>
      ? <span class="hljs-string">&#x27;已保存为紧凑布局。&#x27;</span>
      : <span class="hljs-string">&#x27;已保存为舒适布局。&#x27;</span>;
  } <span class="hljs-keyword">else</span> {
    status.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;已取消，设置未改变。&#x27;</span>;
  }
});
</code></pre></div>
<p><code>method=&quot;dialog&quot;</code> 使表单提交用于关闭所属对话框，而不是把数据发送到某个 URL。触发的提交按钮 value 会作为 returnValue。代码明确区分 save 与其他关闭路径，只有 save 才更新保存值。</p>
<p>每次打开都从已保存值恢复控件，因此用户取消修改后，下次不会看到一个未经保存的旧选择。returnValue 也显式清空，避免先保存、再打开、再按 Escape 时误把之前的 save 当成本次确认。</p>
<p>这个例子只保存当前页面内的设置，没有实现跨刷新持久化或远端请求。需要真正保存时，应把成功和失败流程接进来，而不是一关闭对话框就无条件宣称远端保存成功。</p>
<h2>名称、焦点与关闭方式仍需设计</h2>
<p>aria-labelledby 让对话框名称来自可见标题。简单设置中，autofocus 可以把初始焦点放到用户马上要操作的控件；长说明或不可逆操作则可能需要不同的初始焦点策略，不应总把焦点放在最危险的确认按钮上。</p>
<p>原生模态对话框默认支持 Escape 等关闭请求，并涉及 cancel 事件。取消该事件的默认行为可以阻止关闭，但不应无理由地把用户困在弹层里。关闭按钮、保存按钮和 Escape 的数据处理应保持一致而明确。</p>
<p>浏览器通常会处理关闭后的焦点恢复，但如果原触发按钮已经被删除或当前流程转到了新页面，应用仍需把焦点安排到合理的位置。不能只因为使用了原生 dialog 就省略真实键盘测试。</p>
<p>formnovalidate 让取消按钮不被表单必填等校验拦住。若对话框表单中有待填写的 required 字段，这个细节尤其重要。dialog.close() 是另一种直接关闭方式，它也不等于用户完成了表单校验或点击了保存。</p>
<p>不要依赖所有浏览器都默认“点遮罩就关闭”。新属性可能提供额外关闭策略，但需要确认目标版本；最基本的实现应始终提供清楚的退出控件。</p>
<h2>轻量说明可以只用声明式 Popover</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">popovertarget</span>=<span class="hljs-string">&quot;answer-help&quot;</span>&gt;</span>如何阅读题解<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;answer-help&quot;</span> <span class="hljs-attr">popover</span>=<span class="hljs-string">&quot;auto&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>先理解例子，再修改输入观察结果，不必逐字背诵。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">popovertarget</span>=<span class="hljs-string">&quot;answer-help&quot;</span>
          <span class="hljs-attr">popovertargetaction</span>=<span class="hljs-string">&quot;hide&quot;</span>&gt;</span>关闭说明<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>支持 Popover API 的浏览器可以直接根据 popovertarget 建立控制关系，不需要手写显示类名切换。auto 浮层支持相应的轻量关闭行为，例如点击外部或 Escape，并且与其他 auto 浮层的打开存在互斥规则及嵌套例外。</p>
<p><code>popover=&quot;manual&quot;</code> 则不提供同样的自动轻量关闭，需要显式控制。选择哪一种应由交互需求决定，不要把“手动”理解成更安全或更高级。</p>
<p>Popover API 创建的是非模态浮层，背景仍可交互。popover 属性本身也不会把一个 div 变成完整的菜单、列表框或工具提示；如果要实现这些控件，仍需相应语义和键盘规则。示例包含关闭按钮，不能随意加一个只适合纯提示内容的 tooltip 角色就结束。</p>
<h2>顶层解决覆盖问题，不包办整个弹层</h2>
<p>进入 top layer 后，内容不再像普通后代那样受祖先层叠上下文排序的限制，这能避免很多 z-index 无论多大都被盖住的问题。dialog 的模态模式还提供背景交互限制，Popover 则没有同样的模态承诺。</p>
<p>浮层出现在顶层，不代表它已经自动贴到设计稿要求的按钮旁边。尺寸、定位、窄屏溢出和动画仍需要样式设计；若使用 CSS 锚点定位等能力，还应单独检查兼容性。嵌套浮层、关闭顺序、滚动和焦点也应一起验证。</p>
<p>对不支持相关 API 的目标环境，应选择有能力匹配需求的回退实现，或让补充说明保持可读。仅凭样式看起来像弹层，不能证明其键盘和辅助技术体验已经等价。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/Popover_API">MDN · Popover API</a>。</p>`};export{e as default};