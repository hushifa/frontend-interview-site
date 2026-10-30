var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户反馈“点了提交没反应”，开发者想看他当时到底做了什么，rrweb 这类工具就能把那段操作“回放”出来。它录下来的不是视频，而是 DOM 数据：开始时把整个页面的 DOM 序列化成一份全量快照，之后只记录变化。</p>
<p>全量快照里每个节点都有一个数字 id。之后 rrweb 用 <code>MutationObserver</code> 记录节点增删、属性和文字的变化，再监听鼠标、滚动、输入、窗口大小这些事件，每条增量事件只写节点 id。回放时先在 iframe 里按快照重建 DOM，再按时间顺序把增量事件一条条应用上去。</p>
<p>这样录下来的是 JSON，比录视频小得多，回放时还能看到真实的 DOM 结构。页面原来的脚本在回放时不会执行，界面变化全部来自录下来的事件。</p>
<p>要注意隐私。rrweb 默认只把密码框的值替换成 <code>*</code>，其他输入要开 <code>maskAllInputs</code> 或配置 <code>maskInputOptions</code>；带 <code>rr-block</code> 类的元素整块不录，回放时显示为同样大小的占位；<code>rr-mask</code> 类的元素文字会被打码。最好在采集端就脱敏，不要把敏感数据发出去再处理。</p>
</blockquote>
<h2>全量快照记录了什么</h2>
<p>rrweb 的文档解释了为什么要自己写序列化：直接克隆出的 DOM 只能留在内存里，不能变成 JSON 发到服务器。所以全量快照会逐个节点遍历 DOM，把每个节点写成包含类型、标签名、属性、子节点的普通对象，并给它分配一个唯一的数字 id。</p>
<p>序列化时还要处理几件事，否则回放会出错。<code>script</code> 元素会换成占位的 <code>noscript</code>，脚本内容丢掉，因为回放时页面脚本不能执行。相对路径会改成绝对路径，因为回放页面的地址和原页面不同，CSS 里的相对路径也要转换。外部样式表会读出已解析的规则写成内联样式，这样内网或 localhost 的样式也能正确回放。输入框里用户输入的值不在 HTML 里，序列化时也会读出来存成属性。</p>
<h2>增量快照怎样记录变化</h2>
<p>全量快照之后，rrweb 只记录变化。文档列出的增量来源有：DOM 变化（节点增删、属性变化、文字变化）、鼠标移动、鼠标交互（点击、双击、聚焦、触摸等）、页面或元素滚动、窗口大小变化、输入。</p>
<p>DOM 变化靠 <code>MutationObserver</code>。它是浏览器提供的接口，DOM 改变后会批量回调一次，告诉你哪些节点增加、删除，哪些属性改了。rrweb 在一次回调里做了去重：同一个节点只记录一次；同一批里先加后删的节点直接丢掉；同一属性只保留最后的值。</p>
<p>有些变化 <code>MutationObserver</code> 看不到。代码直接给 <code>input.value</code> 赋值不会触发它，所以 rrweb 还劫持了这些属性的 setter。鼠标移动非常频繁，rrweb 最多每 20 毫秒取一次坐标，最多每 500 毫秒发送一批。</p>
<p>每条增量事件只引用节点 id。录制端和回放端各维护一张“id 到节点”的映射表，节点增删时同步更新，回放时按 id 找到要操作的节点。</p>
<h2>用一个小例子看快照加增量</h2>
<p>下面用普通对象模拟 DOM，演示“全量快照分配 id，增量事件按 id 修改”的过程。真实的 rrweb 结构更复杂，这里只看思路。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> nextId = <span class="hljs-number">1</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">snapshot</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">id</span>: nextId++,
    <span class="hljs-attr">tag</span>: node.<span class="hljs-property">tag</span>,
    <span class="hljs-attr">text</span>: node.<span class="hljs-property">text</span>,
    <span class="hljs-attr">children</span>: (node.<span class="hljs-property">children</span> || []).<span class="hljs-title function_">map</span>(snapshot),
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">rebuild</span>(<span class="hljs-params">tree</span>) {
  <span class="hljs-keyword">const</span> map = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  (<span class="hljs-keyword">function</span> <span class="hljs-title function_">walk</span>(<span class="hljs-params">n</span>) {
    map.<span class="hljs-title function_">set</span>(n.<span class="hljs-property">id</span>, n);
    n.<span class="hljs-property">children</span>.<span class="hljs-title function_">forEach</span>(walk);
  })(tree);
  <span class="hljs-keyword">return</span> map;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">applyEvent</span>(<span class="hljs-params">map, event</span>) {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;add&#x27;</span>) {
    <span class="hljs-keyword">const</span> node = { ...event.<span class="hljs-property">node</span>, <span class="hljs-attr">children</span>: [] };
    map.<span class="hljs-title function_">get</span>(event.<span class="hljs-property">parentId</span>).<span class="hljs-property">children</span>.<span class="hljs-title function_">push</span>(node);
    map.<span class="hljs-title function_">set</span>(node.<span class="hljs-property">id</span>, node);
  }
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;text&#x27;</span>) map.<span class="hljs-title function_">get</span>(event.<span class="hljs-property">id</span>).<span class="hljs-property">text</span> = event.<span class="hljs-property">text</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;remove&#x27;</span>) {
    <span class="hljs-keyword">const</span> parent = map.<span class="hljs-title function_">get</span>(event.<span class="hljs-property">parentId</span>);
    parent.<span class="hljs-property">children</span> = parent.<span class="hljs-property">children</span>.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> c.<span class="hljs-property">id</span> !== event.<span class="hljs-property">id</span>);
    map.<span class="hljs-title function_">delete</span>(event.<span class="hljs-property">id</span>);
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">n</span>) {
  <span class="hljs-keyword">const</span> inner = n.<span class="hljs-property">text</span> !== <span class="hljs-literal">undefined</span> ? n.<span class="hljs-property">text</span> : n.<span class="hljs-property">children</span>.<span class="hljs-title function_">map</span>(render).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`&lt;<span class="hljs-subst">\${n.tag}</span>&gt;<span class="hljs-subst">\${inner}</span>&lt;/<span class="hljs-subst">\${n.tag}</span>&gt;\`</span>;
}

<span class="hljs-keyword">const</span> full = <span class="hljs-title function_">snapshot</span>({ <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;ul&#x27;</span>, <span class="hljs-attr">children</span>: [{ <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;li&#x27;</span>, <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;苹果&#x27;</span> }, { <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;li&#x27;</span>, <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;香蕉&#x27;</span> }] });
<span class="hljs-keyword">const</span> incremental = [
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;add&#x27;</span>, <span class="hljs-attr">parentId</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">node</span>: { <span class="hljs-attr">id</span>: <span class="hljs-number">4</span>, <span class="hljs-attr">tag</span>: <span class="hljs-string">&#x27;li&#x27;</span>, <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;橙子&#x27;</span> } },
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text&#x27;</span>, <span class="hljs-attr">id</span>: <span class="hljs-number">2</span>, <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;青苹果&#x27;</span> },
  { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;remove&#x27;</span>, <span class="hljs-attr">parentId</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">id</span>: <span class="hljs-number">3</span> },
];

<span class="hljs-keyword">const</span> replayMap = <span class="hljs-title function_">rebuild</span>(<span class="hljs-title function_">structuredClone</span>(full));
<span class="hljs-keyword">const</span> root = replayMap.<span class="hljs-title function_">get</span>(<span class="hljs-number">1</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(root)); <span class="hljs-comment">// &lt;ul&gt;&lt;li&gt;苹果&lt;/li&gt;&lt;li&gt;香蕉&lt;/li&gt;&lt;/ul&gt;</span>
incremental.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-title function_">applyEvent</span>(replayMap, event));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">render</span>(root)); <span class="hljs-comment">// &lt;ul&gt;&lt;li&gt;青苹果&lt;/li&gt;&lt;li&gt;橙子&lt;/li&gt;&lt;/ul&gt;</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(replayMap.<span class="hljs-property">size</span>); <span class="hljs-comment">// 3</span>
</code></pre></div>
<p>全量快照给 <code>ul</code> 分配了 1，两个 <code>li</code> 分别是 2 和 3。三条增量事件都没有保存节点本身的引用，只写了 id，所以能变成 JSON 存下来。回放端先重建映射表，再按 id 找到节点应用变化，最后得到和录制时一样的结果，映射表里也同步删掉了 3 号节点。</p>
<p>这也说明了为什么回放必须从全量快照开始：只有增量事件，就不知道 2 号节点是什么。rrweb 文档也说，默认情况下回放需要全部事件。</p>
<h2>录制和回放的基本用法</h2>
<p>文档推荐安装 <code>@rrweb/record</code> 和 <code>@rrweb/replay</code>，原来的 <code>rrweb</code> 包已标为弃用。<code>record</code> 返回一个停止函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { record } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@rrweb/record&#x27;</span>;

<span class="hljs-keyword">const</span> events = [];
<span class="hljs-keyword">const</span> stop = <span class="hljs-title function_">record</span>({
  <span class="hljs-title function_">emit</span>(<span class="hljs-params">event</span>) {
    events.<span class="hljs-title function_">push</span>(event);
  },
  <span class="hljs-attr">maskAllInputs</span>: <span class="hljs-literal">true</span>,
  <span class="hljs-attr">blockClass</span>: <span class="hljs-string">&#x27;rr-block&#x27;</span>,
});
</code></pre></div>
<p>回放时用 <code>Replayer</code>，调用 <code>play()</code> 开始，也可以传毫秒数从某个时间点开始。需要带进度条的界面，可以用基于它的 <code>rrweb-player</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Replayer</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@rrweb/replay&#x27;</span>;
<span class="hljs-keyword">import</span> <span class="hljs-string">&#x27;@rrweb/replay/dist/style.css&#x27;</span>;

<span class="hljs-keyword">const</span> replayer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Replayer</span>(events);
replayer.<span class="hljs-title function_">play</span>();
</code></pre></div>
<p>如果一直录、只想保留最近一段，可以用 <code>checkoutEveryNth</code> 或 <code>checkoutEveryNms</code> 定期重新生成全量快照，<code>emit</code> 的第二个参数 <code>isCheckout</code> 会告诉你新快照开始了，这时可以丢掉更早的事件。因为增量事件是一条链，文档说保留的长度不精确：设 <code>checkoutEveryNth: 200</code>，最后会留下 200 到 400 条事件。文档也说多数情况下不需要配置它。</p>
<h2>隐私脱敏怎样配置</h2>
<p>rrweb 的默认值只遮住密码框：<code>maskInputOptions</code> 默认是 <code>{ password: true }</code>，<code>maskAllInputs</code> 默认是 <code>false</code>。所以手机号、身份证这类普通输入框默认会被原样录下来，要主动开启脱敏。几个常用选项的作用如下：</p>
<ul>
<li><code>maskAllInputs: true</code>：所有输入框的值都替换成 <code>*</code>。</li>
<li><code>maskInputOptions</code>：按输入框类型选择要脱敏的类别。</li>
<li><code>blockClass</code>（默认 <code>rr-block</code>）和 <code>blockSelector</code>：匹配的元素整块不录，回放时显示为同样大小的占位。</li>
<li><code>maskTextClass</code>（默认 <code>rr-mask</code>）：匹配元素及其子元素里的文字被打码。</li>
<li><code>ignoreClass</code>（默认 <code>rr-ignore</code>）：不记录匹配元素的输入事件。</li>
<li><code>maskInputFn</code>、<code>maskTextFn</code>：自定义脱敏函数。</li>
</ul>
<p>这些处理都发生在录制端，敏感内容不会出现在事件数据里。如果先原样上报再在服务端打码，敏感数据就已经离开了用户的浏览器。</p>
<p>回放端也有安全问题。回放的 iframe 默认在沙箱里不能运行脚本，文档提醒，<code>UNSAFE_replayCanvas</code> 会给 iframe 加上 <code>allow-scripts</code>，去掉这层保护，所以不安全。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接录视频？</strong></p>
<blockquote>
<p>录视频要一直截图编码，耗性能，数据也大。rrweb 记录的是 DOM 变化，页面不动时几乎没有数据，回放时还能看到真实的 DOM 结构。代价是有些内容录不全，比如 Canvas 默认不录，要开 <code>recordCanvas</code>。</p>
</blockquote>
<p><strong>回放时页面的接口请求、脚本会重新执行吗？</strong></p>
<blockquote>
<p>不会。序列化时脚本已经换成了 <code>noscript</code>，回放时也不执行 JavaScript，文档说正因如此才要记录脚本造成的所有 DOM 变化。界面上的变化全部来自录下来的事件。</p>
</blockquote>
<p><strong>Sentry 的会话回放和 rrweb 是什么关系？</strong></p>
<blockquote>
<p>两者解决的是同一类问题，接入和采样配置见<a href="/questions/monitoring-sentry/">《错误监控平台怎样接入？以 Sentry 为例讲 SDK 初始化、Source Map 上传、release 关联和采样》</a>。用 rrweb 自建时，事件存储、采样和上报都要自己做。</p>
</blockquote>`};export{e as default};