var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>点“保存”以后右上角冒出“保存成功”，三秒后自动消失，这就是 Toast。它和普通组件最大的不同是调用方式：业务代码希望在任何地方写一行 <code>toast.success(&#x27;保存成功&#x27;)</code> 就能弹出来，包括接口拦截器这种根本不在组件里的地方，而不是每个页面都放一个组件、自己管显示状态。</p>
<p>所以我会把它拆成两层。一层是和界面无关的 store，里面存着当前要显示的提示列表，对外提供 <code>show</code>、<code>close</code> 和 <code>subscribe</code>；另一层是挂在应用根节点的容器组件，订阅 store，列表一变就重新渲染。<code>show</code> 返回一个 id，调用方可以拿它提前关闭，比如“上传中”在上传完成后换成“上传成功”。</p>
<p>细节上要处理几件事：同时显示的条数要有上限，多出来的排队；自动关闭的计时在鼠标悬停时暂停；关闭要能重复调用而不出错；位置用固定定位，层级要高于页面内容和弹窗。</p>
<p>无障碍也要考虑。提示区域用 <code>role=&quot;status&quot;</code>，读屏软件会在用户空闲时播报，而且这个容器要在页面加载时就存在，不能和内容一起插入。错误提示不要几秒就消失，用户可能来不及读，重要的错误应该留着让用户手动关闭。</p>
</blockquote>
<h2>为什么要把状态放在组件外面</h2>
<p>如果 Toast 是普通组件，就得在每个页面里放一个，用 <code>useState</code> 控制显示。可是接口拦截器里的统一错误提示、工具函数里的提示，都拿不到组件的状态。</p>
<p>所以把提示列表放进一个独立的 store。它只是普通的 JS 对象，任何地方都能 <code>import</code> 调用。界面层只负责订阅它、渲染它。这样调用方不关心界面用的是 React 还是 Vue，测试 store 时也不需要渲染任何东西。</p>
<h2>先写与界面无关的队列</h2>
<p>下面的 store 最多同时显示 <code>max</code> 条，多出来的进等待队列，有一条关闭就从队列里补上一条。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 与界面无关的 Toast 队列：最多同时显示 max 条，多出来的排队</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createToastStore</span>(<span class="hljs-params">{ max = <span class="hljs-number">3</span> } = {}</span>) {
  <span class="hljs-keyword">let</span> nextId = <span class="hljs-number">1</span>;
  <span class="hljs-keyword">let</span> visible = [];
  <span class="hljs-keyword">const</span> waiting = [];
  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">notify</span> = (<span class="hljs-params"></span>) =&gt; listeners.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">listener</span>) =&gt;</span> <span class="hljs-title function_">listener</span>(visible));

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">show</span>(<span class="hljs-params">message, { type = <span class="hljs-string">&#x27;info&#x27;</span>, duration = <span class="hljs-number">3000</span> } = {}</span>) {
    <span class="hljs-keyword">const</span> toast = { <span class="hljs-attr">id</span>: nextId++, message, type, duration };
    <span class="hljs-keyword">if</span> (visible.<span class="hljs-property">length</span> &lt; max) visible = [...visible, toast];
    <span class="hljs-keyword">else</span> waiting.<span class="hljs-title function_">push</span>(toast);
    <span class="hljs-title function_">notify</span>();
    <span class="hljs-keyword">return</span> toast.<span class="hljs-property">id</span>; <span class="hljs-comment">// 返回 id，调用方可以提前关闭</span>
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">close</span>(<span class="hljs-params">id</span>) {
    <span class="hljs-keyword">const</span> before = visible.<span class="hljs-property">length</span>;
    visible = visible.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">toast</span>) =&gt;</span> toast.<span class="hljs-property">id</span> !== id);
    <span class="hljs-keyword">if</span> (visible.<span class="hljs-property">length</span> === before) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 已经关闭过，忽略重复调用</span>
    <span class="hljs-keyword">if</span> (waiting.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) visible = [...visible, waiting.<span class="hljs-title function_">shift</span>()];
    <span class="hljs-title function_">notify</span>();
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">listener</span>) {
    listeners.<span class="hljs-title function_">add</span>(listener);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> listeners.<span class="hljs-title function_">delete</span>(listener);
  }

  <span class="hljs-keyword">return</span> { show, close, subscribe };
}

<span class="hljs-keyword">const</span> store = <span class="hljs-title function_">createToastStore</span>({ <span class="hljs-attr">max</span>: <span class="hljs-number">2</span> });
<span class="hljs-keyword">let</span> current = [];
store.<span class="hljs-title function_">subscribe</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> { current = list; });

<span class="hljs-keyword">const</span> first = store.<span class="hljs-title function_">show</span>(<span class="hljs-string">&#x27;保存成功&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;success&#x27;</span> });
store.<span class="hljs-title function_">show</span>(<span class="hljs-string">&#x27;网络较慢&#x27;</span>);
store.<span class="hljs-title function_">show</span>(<span class="hljs-string">&#x27;已复制&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(current.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">toast</span>) =&gt;</span> toast.<span class="hljs-property">message</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// 保存成功|网络较慢</span>

store.<span class="hljs-title function_">close</span>(first);
store.<span class="hljs-title function_">close</span>(first); <span class="hljs-comment">// 重复关闭不会多放出一条</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(current.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">toast</span>) =&gt;</span> toast.<span class="hljs-property">message</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// 网络较慢|已复制</span>
</code></pre></div>
<p>上限是 2，所以第三条“已复制”进了等待队列，第一次输出只有两条。关闭第一条后，“已复制”被补上来。</p>
<p>为什么要特意处理重复关闭？因为一条提示可能同时被自动计时器和用户点击关闭。如果 <code>close</code> 不检查，第二次调用也会从等待队列里多放出一条，显示的条数就超过上限了。</p>
<p><code>visible</code> 每次变化都生成新数组，而不是原地修改。这是为了让界面层能用引用比较判断是否需要重新渲染，React 的 <code>useSyncExternalStore</code> 就要求快照在没有变化时保持同一个引用，见<a href="/questions/react-external-store/">《useSyncExternalStore 为什么要求稳定的快照？》</a>。</p>
<h2>界面层怎样订阅和渲染</h2>
<p>在应用根节点放一个容器，订阅 store，用 Portal 渲染到 <code>body</code> 下，避免被某个父元素的 <code>overflow: hidden</code> 裁掉：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">ToastViewport</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> toasts = <span class="hljs-title function_">useSyncExternalStore</span>(subscribeToasts, getToasts);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">createPortal</span>(
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span> <span class="hljs-attr">className</span>=<span class="hljs-string">&quot;toast-viewport&quot;</span>&gt;</span>
      {toasts.map((toast) =&gt; (
        <span class="hljs-tag">&lt;<span class="hljs-name">ToastItem</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{toast.id}</span> <span class="hljs-attr">toast</span>=<span class="hljs-string">{toast}</span> <span class="hljs-attr">onClose</span>=<span class="hljs-string">{()</span> =&gt;</span> closeToast(toast.id)} /&gt;
      ))}
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>,
    <span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>,
  );
}
</code></pre></div>
<p><code>ToastViewport</code> 要在应用启动时就渲染，即使列表是空的。原因在后面的无障碍部分。</p>
<p>自动关闭的计时放在每一条 <code>ToastItem</code> 里：挂载时按 <code>duration</code> 开始计时，到时调用 <code>onClose</code>；鼠标移入或键盘焦点进入时暂停，离开时继续；卸载时清掉定时器。<code>duration</code> 为 0 表示不自动关闭。</p>
<p>层级是一个常见问题。Toast 要显示在弹窗上方，可是原生 <code>dialog</code> 用 <code>showModal()</code> 打开后处在浏览器的顶层（top layer），普通元素的 <code>z-index</code> 再大也盖不住它。一种办法是让 Toast 容器也用 Popover API，<code>showPopover()</code> 会把元素放进顶层，<code>popover=&quot;manual&quot;</code> 不会因为点击外部或按 Esc 被关掉，也不会关掉别的 popover。顶层元素按进入的先后叠放，所以弹窗打开以后再显示的 Toast 会盖在弹窗上面。弹窗的挂载方式见<a href="/questions/design-modal-component/">《弹窗组件怎样设计？》</a>。</p>
<h2>读屏用户能知道提示出现了吗</h2>
<p>视觉用户看到右上角冒出一条提示，读屏用户却可能完全不知道。所以容器要设成 live region，内容变化时读屏会自动播报。</p>
<p><code>role=&quot;status&quot;</code> 自带 <code>aria-live=&quot;polite&quot;</code>，读屏会等用户空闲时再播报，适合“保存成功”这类提示。要注意，MDN 说明读屏一般只播报 live region 里内容的变化，最可靠的方式是让容器在初始页面里就存在，再往里面添加内容。如果每次弹出 Toast 时才创建带 <code>role=&quot;status&quot;</code> 的元素，第一条提示很可能不会被读出来。这也是为什么 <code>ToastViewport</code> 要一开始就渲染。</p>
<p>紧急的错误可以用 <code>role=&quot;alert&quot;</code>，它会打断当前播报。不要给 Toast 移动焦点，否则会打断用户正在做的操作。live region 的更多细节见<a href="/questions/a11y-live-region/">《aria-live 怎样用于动态状态播报？》</a>。</p>
<p>自动消失的时长也是无障碍问题。WCAG 的“时间可调整”要求，内容设定的时间限制要能关闭、调整或延长。所以包含重要信息或操作按钮（比如“撤销”）的提示，不要几秒就消失，至少要在悬停或获得焦点时暂停，错误信息最好一直显示到用户手动关闭。</p>
<h2>常见追问</h2>
<p><strong>同一条提示被连续触发很多次怎么办？</strong></p>
<blockquote>
<p>比如网络断开时每个请求都报“网络异常”，屏幕上会叠一堆一样的提示。可以给 <code>show</code> 增加一个 <code>key</code> 参数，相同 <code>key</code> 的提示已经在显示时，不新增，只更新内容或重新开始计时。</p>
</blockquote>
<p><strong>Toast 和 Modal 怎样选？</strong></p>
<blockquote>
<p>Toast 用于不需要用户回应的反馈，比如“已保存”“已复制”，它不打断操作，过一会儿自己消失。需要用户确认或做选择的，比如“确定删除吗”，要用弹窗，因为用户必须回应才能继续。错误如果需要用户处理，也不应该只用一个几秒就消失的 Toast。</p>
</blockquote>`};export{e as default};