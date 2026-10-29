var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>点“删除”按钮，页面中间弹出一个框问“确定删除吗？”，背景变暗点不了，按 Esc 能关，点“确定”后框消失、继续执行删除。要把这个弹窗做成全项目通用的组件，主要考虑挂在哪里、怎么调用、焦点怎么管。</p>
<p>挂载位置：弹窗如果渲染在按钮旁边，父元素的 <code>overflow: hidden</code> 会把它裁掉，<code>z-index</code> 也可能被父元素的层叠上下文压住。用原生 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code> 可以让它进入浏览器的顶层，直接盖在所有内容上面；用 React 等框架自己实现时，用 Portal 把它挂到 <code>body</code> 下。</p>
<p>调用方式：页面里常驻的表单弹窗用声明式的 <code>open</code> 属性控制；“确认一下”这种一次性的询问，封装成命令式的 <code>await confirm(&#x27;确定删除吗？&#x27;)</code>，返回 Promise，用户点确定得到 <code>true</code>，取消得到 <code>false</code>，调用的地方写起来像同步代码。</p>
<p>焦点管理：按 WAI-ARIA APG 的模态对话框模式，打开时焦点移进弹窗，Tab 只在弹窗里循环，Esc 关闭，关闭后焦点回到打开它的按钮。<code>showModal()</code> 会让弹窗外的内容变为惰性，这几条大部分浏览器会自动处理，自己实现就要逐条补上。</p>
</blockquote>
<h2>弹窗为什么要挂到别的地方</h2>
<p>弹窗如果就写在按钮旁边，会受到祖先元素的影响。祖先设了 <code>overflow: hidden</code>，弹窗超出部分被裁掉；祖先设了 <code>transform</code>、<code>opacity</code> 小于 1 等属性，会形成新的层叠上下文，弹窗的 <code>z-index</code> 写多大都只在这个上下文里比较，可能盖不过页面别处的元素。</p>
<p>原生方案是 <code>&lt;dialog&gt;</code> 加 <code>showModal()</code>。MDN 说明，模态对话框会显示在顶层（top layer），同时带一个 <code>::backdrop</code> 伪元素作为背景遮罩；文档里除了对话框和它的后代，其他元素都变成惰性，就像加了 <code>inert</code> 属性。顶层不受祖先 <code>overflow</code> 和 <code>z-index</code> 的影响，所以不管 <code>&lt;dialog&gt;</code> 写在 DOM 的哪里，打开后都在最上面。<code>dialog</code> 的完整用法见<a href="/questions/html-dialog-popover/">《dialog 和 Popover API 应该怎样使用？》</a>。</p>
<p>在 React 里自己实现时，用 <code>createPortal</code> 把弹窗渲染到 <code>document.body</code> 下的一个容器里。组件仍然在原来的组件树里，能拿到 Context，事件也按组件树冒泡，但 DOM 位置脱离了原来的祖先，见<a href="/questions/react-portal-forwardref/">《Portal、forwardRef 和 useImperativeHandle 分别解决什么问题？》</a>。</p>
<h2>声明式和命令式调用怎么选</h2>
<p>声明式是让父组件用一个状态控制显示：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> [open, setOpen] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);

<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Modal</span> <span class="hljs-attr">open</span>=<span class="hljs-string">{open}</span> <span class="hljs-attr">onClose</span>=<span class="hljs-string">{()</span> =&gt;</span> setOpen(false)} title=&quot;编辑资料&quot;&gt;
  <span class="hljs-tag">&lt;<span class="hljs-name">ProfileForm</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">Modal</span>&gt;</span></span>
</code></pre></div>
<p>适合内容复杂、需要和页面状态联动的弹窗，比如编辑表单。</p>
<p>可是“确认删除”这种场景，用声明式写要多一个状态、一个回调，删除逻辑被拆到两个地方。命令式调用把它变成一行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleDelete</span>(<span class="hljs-params">id</span>) {
  <span class="hljs-keyword">const</span> ok = <span class="hljs-keyword">await</span> <span class="hljs-title function_">confirm</span>({ <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;确定删除这条记录吗？&#x27;</span>, <span class="hljs-attr">okText</span>: <span class="hljs-string">&#x27;删除&#x27;</span> });
  <span class="hljs-keyword">if</span> (!ok) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">await</span> api.<span class="hljs-title function_">remove</span>(id);
}
</code></pre></div>
<p><code>confirm</code> 的实现思路是：创建一个容器挂到 <code>body</code> 下，在里面渲染一个声明式的确认弹窗，返回一个 Promise；用户点确定时 <code>resolve(true)</code>，点取消、按 Esc 或点遮罩时 <code>resolve(false)</code>，然后卸载组件、移除容器。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">confirm</span>(<span class="hljs-params">options</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> container = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;div&#x27;</span>);
    <span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>.<span class="hljs-title function_">append</span>(container);
    <span class="hljs-keyword">const</span> root = <span class="hljs-title function_">createRoot</span>(container);
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">close</span> = (<span class="hljs-params">result</span>) =&gt; {
      root.<span class="hljs-title function_">unmount</span>();
      container.<span class="hljs-title function_">remove</span>();
      <span class="hljs-title function_">resolve</span>(result);
    };
    root.<span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ConfirmDialog</span> {<span class="hljs-attr">...options</span>} <span class="hljs-attr">onOk</span>=<span class="hljs-string">{()</span> =&gt;</span> close(true)} onCancel={() =&gt; close(false)} /&gt;</span>);
  });
}
</code></pre></div>
<p>这里要注意一点：单独 <code>createRoot</code> 渲染的弹窗不在应用的组件树里，拿不到应用里的 Context（主题、语言、路由）。常见的解决办法是在应用根部放一个弹窗宿主组件，<code>confirm</code> 只是往宿主的队列里加一项，由宿主在应用树内渲染。</p>
<h2>焦点应该怎样管理</h2>
<p>WAI-ARIA APG 的模态对话框模式规定了键盘交互：对话框打开时，焦点移到对话框里的某个元素；Tab 移到对话框里的下一个可聚焦元素，到最后一个时回到第一个，Shift+Tab 反过来；Esc 关闭对话框。关闭时，焦点回到打开对话框的那个元素，除非那个元素已经不存在了，或者流程上移到别处更合理。</p>
<p>初始焦点放在哪里，APG 给了几条建议：一般放在第一个可聚焦元素上；内容很长或者结构复杂时，放在开头的标题或段落上（给它加 <code>tabindex=&quot;-1&quot;</code>）；如果是删除这类难以撤销的操作，放在最不具破坏性的按钮上，比如“取消”。MDN 的 <code>&lt;dialog&gt;</code> 文档也建议用 <code>autofocus</code> 标出打开后用户最可能操作的元素。</p>
<p>用原生 <code>&lt;dialog&gt;</code> 时，很多事浏览器已经做了。在 headless Chrome 里实测：按钮获得焦点后调用 <code>showModal()</code>，焦点自动移到了对话框里的第一个按钮；对话框匹配 <code>:modal</code>；调用 <code>close()</code> 后，焦点回到了原来的按钮。弹窗外的内容变为惰性，Tab 不会跑到背景上，Esc 也能关闭。</p>
<p>自己用 <code>div</code> 实现时，这些都要手写：打开前记下 <code>document.activeElement</code>，打开后把焦点移进去；把弹窗外的内容设为 <code>inert</code>，MDN 说明 <code>inert</code> 会让浏览器忽略这部分的用户输入事件，包括焦点事件和辅助技术的事件；监听 Esc 关闭；关闭后把焦点还给记下的元素。语义上还要加 <code>role=&quot;dialog&quot;</code>、<code>aria-modal=&quot;true&quot;</code>，用 <code>aria-labelledby</code> 指向标题，完整清单见<a href="/questions/a11y-dialog/">《一个可访问的模态对话框需要具备哪些行为？》</a>。</p>
<h2>还有哪些细节要考虑</h2>
<p>打开弹窗时背景页面不应该跟着滚动。常见做法是打开时给 <code>body</code> 加 <code>overflow: hidden</code>，关闭时恢复；滚动条消失会让页面宽度变化，可以用 <code>scrollbar-gutter: stable</code> 预留位置，MDN 说明这个属性用来给滚动条预留空间，避免不必要的布局变化。</p>
<p>多个弹窗叠加时，比如编辑弹窗里再弹一个确认框，要按打开顺序管理：Esc 只关最上面那个，关闭后焦点回到下面那个弹窗里的按钮。用原生 <code>showModal()</code> 时，后打开的对话框在顶层里排在后面，自然盖在上面。</p>
<p>关闭时如果有未保存的修改，要先询问用户。原生 <code>&lt;dialog&gt;</code> 可以监听 <code>cancel</code> 事件。MDN 说明它在用户发出关闭请求时触发，比如桌面上按 Esc、移动端按返回键，或者调用 <code>requestClose()</code>；这个事件可以取消，不取消的话对话框会关闭并触发 <code>close</code> 事件。所以在 <code>cancel</code> 里检查有没有未保存的修改，有就调用 <code>preventDefault()</code> 并给出提示。</p>
<h2>常见追问</h2>
<p><strong>点击遮罩要不要关闭弹窗？</strong></p>
<blockquote>
<p>看内容。纯展示信息的弹窗点遮罩关闭很方便；表单弹窗点遮罩关闭容易误触丢失输入，最好不关或者先确认。不管怎样，都要提供一个可见的关闭按钮，APG 也强烈建议对话框的 Tab 顺序里包含一个可见的关闭按钮。</p>
</blockquote>
<p><strong>弹窗组件要不要在关闭时销毁内容？</strong></p>
<blockquote>
<p>要看需求。销毁可以重置表单、释放资源；保留可以让用户再次打开时看到上次的内容。组件可以提供一个选项让调用方决定，默认关闭时销毁更不容易出现旧数据残留。</p>
</blockquote>
<p><strong>Toast 提示和弹窗是一回事吗？</strong></p>
<blockquote>
<p>不是。Toast 是不打断操作的短暂提示，不抢焦点，也不让背景变成惰性，通常用 <code>role=&quot;status&quot;</code> 这类实时区域让读屏念出来。弹窗是要求用户处理的模态界面。把 Toast 做成抢焦点的弹窗，会打断用户正在做的事。</p>
</blockquote>`};export{e as default};