var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>商品详情页上“介绍、规格、评价”三个切换按钮是 Tabs，FAQ 页面上点一下标题展开答案的是手风琴。两者看起来都是“点标题、显示内容”，可访问性的写法却不一样。</p>
<p>Tabs 由三个 role 组成：外层 <code>role=&quot;tablist&quot;</code>，每个标签 <code>role=&quot;tab&quot;</code>，每块内容 <code>role=&quot;tabpanel&quot;</code>。当前选中的 tab 设 <code>aria-selected=&quot;true&quot;</code>，其余为 <code>false</code>；tab 用 <code>aria-controls</code> 指向自己的面板，面板用 <code>aria-labelledby</code> 指回 tab。手风琴的每个标题是一个 <code>button</code>，外面包一个标题元素（比如 <code>h3</code>），按钮上用 <code>aria-expanded</code> 表示面板展开还是收起，用 <code>aria-controls</code> 指向面板。</p>
<p>键盘行为也不同。Tabs 整组只占一个 Tab 位置，Tab 进去落在当前选中的 tab 上，在组内用左右方向键切换，到头会绕回；再按 Tab 就离开 tablist，进入面板。手风琴的每个标题按钮都在页面的 Tab 顺序里，用 Enter 或 Space 展开、收起。</p>
<p>要注意两点。Tabs 只有在面板能立刻显示时，才适合“焦点移到哪个 tab 就显示哪个面板”的自动激活；面板要加载数据的，改成按 Enter 或 Space 才激活。手风琴的面板加不加 <code>role=&quot;region&quot;</code> 要看数量，能同时展开的面板超过大约 6 个时就别加了，否则地标区域太多。</p>
</blockquote>
<h2>Tabs 的结构怎么写</h2>
<p>先看一组横向的 Tabs。重点看三处：tab 之间怎样互相指向、谁有 <code>tabindex=&quot;0&quot;</code>、面板怎样关联到 tab。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tablist&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;商品信息&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tab&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;tab-intro&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;panel-intro&quot;</span>&gt;</span>介绍<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tab&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;tab-spec&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;false&quot;</span> <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;panel-spec&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>规格<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tab&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;tab-review&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;false&quot;</span> <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;panel-review&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>评价<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tabpanel&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;panel-intro&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;tab-intro&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;0&quot;</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tabpanel&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;panel-spec&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;tab-spec&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;0&quot;</span> <span class="hljs-attr">hidden</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tabpanel&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;panel-review&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;tab-review&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;0&quot;</span> <span class="hljs-attr">hidden</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>tablist 需要一个名字。页面上有可见的标题就用 <code>aria-labelledby</code> 指向它，没有就用 <code>aria-label</code>。<code>role=&quot;tab&quot;</code> 说明它是一组标签中的一个，<code>aria-selected</code> 说明它有没有被选中。</p>
<p>为什么只有选中的 tab 是 <code>tabindex=&quot;0&quot;</code>，其余是 <code>-1</code>？因为 APG 规定 Tab 键进入 tablist 时，焦点落在当前选中的 tab 上，组内的移动交给方向键。如果每个 tab 都能被 Tab 到，键盘用户穿过一组十个标签就要按十次 Tab。这种“组内只留一个 Tab 位置”的做法叫 roving tabindex，和<a href="/questions/a11y-tree/">《可访问的树控件需要怎样处理键盘和层级状态？》</a>里的做法一样。</p>
<p>面板上的 <code>tabindex=&quot;0&quot;</code> 是有条件的。APG 的说法是：面板里没有可聚焦元素，或者面板里第一个有内容的元素不能聚焦时，才给面板加 <code>tabindex=&quot;0&quot;</code>，这样按 Tab 离开 tablist 后能落到面板上。如果面板一开头就是一个链接或输入框，焦点直接落到那里就行，面板本身不用加。</p>
<h2>Tabs 的键盘行为</h2>
<p>APG 列出的按键如下，横向和纵向的区别只在方向键：</p>
<ul>
<li>左、右方向键：移到上一个、下一个 tab，在首尾之间绕回。</li>
<li>上、下方向键：只在 <code>aria-orientation=&quot;vertical&quot;</code> 的纵向 tablist 里起作用；横向的 tablist 不处理它们，留给页面滚动。</li>
<li>Home、End：跳到第一个、最后一个 tab。APG 标为可选。</li>
<li>Enter 或 Space：如果焦点移过去时没有自动激活，按它激活当前 tab。</li>
<li>Delete：只有允许关闭标签时才需要，APG 同样标为可选。</li>
</ul>
<p>方向键绕回的逻辑容易写错，下面把它写成一个纯函数，单独验证一下：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">nextTabIndex</span>(<span class="hljs-params">current, total, key</span>) {
  <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;ArrowRight&#x27;</span>) <span class="hljs-keyword">return</span> (current + <span class="hljs-number">1</span>) % total;
  <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;ArrowLeft&#x27;</span>) <span class="hljs-keyword">return</span> (current - <span class="hljs-number">1</span> + total) % total;
  <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;Home&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>;
  <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;End&#x27;</span>) <span class="hljs-keyword">return</span> total - <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> current;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">nextTabIndex</span>(<span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-string">&#x27;ArrowRight&#x27;</span>)); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">nextTabIndex</span>(<span class="hljs-number">0</span>, <span class="hljs-number">3</span>, <span class="hljs-string">&#x27;ArrowLeft&#x27;</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">nextTabIndex</span>(<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-string">&#x27;End&#x27;</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">nextTabIndex</span>(<span class="hljs-number">1</span>, <span class="hljs-number">3</span>, <span class="hljs-string">&#x27;ArrowDown&#x27;</span>)); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>最后一行要注意：横向 tablist 收到 <code>ArrowDown</code> 时什么也不做，焦点留在原地，页面照常滚动。真正接到 <code>keydown</code> 里时，算出新下标后要做三件事：把旧 tab 改成 <code>tabindex=&quot;-1&quot;</code>，新 tab 改成 <code>tabindex=&quot;0&quot;</code>，再调用新 tab 的 <code>focus()</code>。</p>
<h2>自动激活还是手动激活</h2>
<p>焦点移到一个 tab 上，面板要不要马上切过去？APG 给的判断标准是面板能不能“没有明显延迟”地显示。内容已经在页面里的，可以用自动激活，方向键走到哪个 tab，就显示哪个面板，同时更新 <code>aria-selected</code>。</p>
<p>如果面板要请求接口才能显示，自动激活会让用户每按一次方向键都触发一次加载，在标签之间移动会变得很慢。这时改成手动激活：方向键只移动焦点，按 Enter 或 Space 才切换面板和 <code>aria-selected</code>。</p>
<h2>手风琴的结构怎么写</h2>
<p>手风琴没有 <code>tablist</code> 这样的容器 role，每一项就是“标题按钮 + 面板”：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">h3</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;faq-1-btn&quot;</span> <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;faq-1-panel&quot;</span>&gt;</span>
    怎样申请退款？
  <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">h3</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;faq-1-panel&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;region&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;faq-1-btn&quot;</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">h3</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;faq-2-btn&quot;</span> <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;false&quot;</span> <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;faq-2-panel&quot;</span>&gt;</span>
    多久能到账？
  <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">h3</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;faq-2-panel&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;region&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;faq-2-btn&quot;</span> <span class="hljs-attr">hidden</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>APG 要求标题按钮外面包一个 <code>heading</code>，可以直接用 <code>h3</code> 这样的原生标题元素，级别按页面的信息结构选。标题里只放这个按钮，标题里只放这个按钮，其他常驻的元素（比如一个菜单按钮）要放到标题外面。</p>
<p><code>aria-expanded</code> 放在按钮上，不放在面板上。面板显示时为 <code>true</code>，隐藏时为 <code>false</code>。如果手风琴规定必须有一项展开、不允许收起，APG 建议在展开项的按钮上设 <code>aria-disabled=&quot;true&quot;</code>，告诉用户这个按钮现在点了也收不起来。</p>
<h2>面板要不要加 role=&quot;region&quot;</h2>
<p><code>role=&quot;region&quot;</code> 加 <code>aria-labelledby</code> 会把面板变成一个有名字的地标区域。APG 认为，面板里有子标题或者嵌套手风琴时，这能帮读屏用户看清结构。</p>
<p>可是地标太多反而难用。APG 的建议是，能同时展开的面板超过大约 6 个时，不要给面板加 <code>region</code>。所以上面的例子只有两项，可以加；一个有 30 个问题、可以全部展开的 FAQ 就别加了。</p>
<h2>手风琴的键盘行为</h2>
<p>手风琴的键盘行为比 Tabs 简单。每个标题按钮都在页面的 Tab 顺序里，Tab 和 Shift + Tab 在按钮和面板里的可聚焦元素之间移动。在收起的标题上按 Enter 或 Space 会展开面板；如果手风琴一次只允许展开一项，同时收起原来展开的那项。在已展开的标题上按 Enter 或 Space，只有在实现支持收起时才会收起。</p>
<h2>能不能直接用 details 元素</h2>
<p>简单的展开收起可以用原生的 <code>&lt;details&gt;</code> 和 <code>&lt;summary&gt;</code>，不写脚本就能展开收起。MDN 还介绍了 <code>name</code> 属性：给几个 <code>&lt;details&gt;</code> 设同一个 <code>name</code>，它们就成了一组，打开一个会自动关掉另一个，正好是“一次只展开一项”的手风琴。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">details</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;faq&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">summary</span>&gt;</span>怎样申请退款？<span class="hljs-tag">&lt;/<span class="hljs-name">summary</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">details</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">details</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;faq&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">summary</span>&gt;</span>多久能到账？<span class="hljs-tag">&lt;/<span class="hljs-name">summary</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>……<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">details</span>&gt;</span>
</code></pre></div>
<p>它的限制是结构固定：MDN 写明 <code>&lt;details&gt;</code> 不允许设置 <code>role</code>，<code>&lt;summary&gt;</code> 也不是包在标题元素里的按钮。需要 APG 那种“标题加按钮”的结构，或者要控制展开状态以外的行为时，还是自己按 APG 来写。</p>
<h2>常见追问</h2>
<p><strong>Tabs 和手风琴该怎么选？</strong></p>
<blockquote>
<p>看用户是不是需要同时看多块内容。Tabs 一次只显示一个面板，适合几块并列、互相切换的内容，比如商品的介绍和规格。手风琴可以同时展开多项，适合 FAQ 这种一项一项往下读的内容。</p>
</blockquote>
<p><strong>选中的 tab 为什么用 aria-selected，不用 aria-expanded？</strong></p>
<blockquote>
<p>因为 APG 的 Tabs 模式就规定用 <code>aria-selected</code>。一组 tab 里同时只有一个被选中，选中的含义是“当前显示的是它的面板”。<code>aria-expanded</code> 是给手风琴标题这类“控制一块内容展开收起”的按钮用的。两个模式在 APG 里各有规定，不要混用。</p>
</blockquote>`};export{e as default};