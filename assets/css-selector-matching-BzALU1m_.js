var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如 <code>.nav li a</code>，人是从左往右读的：先找 <code>.nav</code>，再找里面的 <code>li</code>，再找 <code>a</code>。浏览器算样式时的问题却是反过来的：手里拿着一个元素，要知道哪些规则命中它。所以它先看这个元素是不是 <code>a</code>，是的话再往上找祖先里有没有 <code>li</code>、有没有 <code>.nav</code>。</p>
<p>这样做省事，是因为选择器规范本来就这样定义：元素先要命中最右边那一段，前面每一段再按组合符的关系去命中它的祖先或兄弟。页面上大多数规则在最右一段就对不上，直接排除，不用往上走。如果从左往右，找到 <code>.nav</code> 以后还要遍历它的整棵子树，大多数分支最后都白找了。</p>
<p>Blink 在这之上还做了两层优化：按最右一段的 id、类名、标签把规则分桶，一个元素只需要看和自己相关的那几个桶；再用一个类似布隆过滤器的祖先过滤器，提前丢掉“要求某个祖先、但祖先里根本没有”的规则。</p>
<p>所以选择器写法通常不是性能的首要问题。真要优化，先在 DevTools 的 Performance 面板打开 Selector Stats，找出耗时长、尝试次数多但命中少的选择器，再改写。常见方向是少用 <code>body *</code> 这种命中大量元素的写法，<code>:has()</code> 的锚点和内部选择器都要尽量收窄。</p>
</blockquote>
<h2>规范是怎样定义“命中”的</h2>
<p>Selectors Level 4 说，选择器是一个判断式：给它一个元素，回答这个元素命中还是不命中。对于 <code>.nav li a</code> 这种由组合符连起来的复杂选择器，规范的定义是：元素要命中最后那一段复合选择器，并且前面每一段也分别命中一个元素，这些元素之间满足组合符要求的关系。</p>
<p>这个定义天然是从右往左的。拿到一个元素，先拿最右边的 <code>a</code> 去比；比上了，再看空格这个后代组合符，往祖先里找 <code>li</code>；找到了，再往更上面找 <code>.nav</code>。最右边那一段在规范里叫“主体”（subject），就是这条选择器最终要选中的元素。</p>
<h2>为什么从右往左更快</h2>
<p>样式计算的工作是给页面上每个元素找到所有命中的规则。假设页面有几千条规则，对每个元素都要回答“这几千条里哪些命中我”。</p>
<p>从右往左时，大部分规则在第一步就被排除了。一个 <code>&lt;span&gt;</code> 去比 <code>.nav li a</code>，最右边是 <code>a</code>，对不上，这条规则就结束了，不需要往上走。只有最右一段对上了，才需要沿着祖先链往上查，祖先链的长度也就是 DOM 的深度。</p>
<p>反过来从左往右，找到一个 <code>.nav</code> 以后，要往下遍历它的所有后代找 <code>li</code>，再在每个 <code>li</code> 下面找 <code>a</code>。可是大多数路径最后找不到 <code>a</code>，这些遍历都白做了。</p>
<h2>Blink 在此之上做了哪些优化</h2>
<p>Chromium 的 Blink 引擎在源码注释里写了它的做法。第一层是分桶：<code>RuleSet</code> 把规则按 id、类名、标签、属性等分组存放，用的是最右一段里的这些值，比如 <code>.foo[baz]</code> 会按类名 <code>foo</code> 和属性 <code>baz</code> 来分组；没法归类的规则放进“通用”组。这样算一个元素的样式时，只需要看它自己的 id、类名、标签对应的那几组，加上通用组。</p>
<p>第二层是祖先过滤器 <code>SelectorFilter</code>。遍历 DOM 时，Blink 把一路上每个祖先的 id、标签、类名、属性做哈希存进一个位集合，相当于只有一个哈希函数的布隆过滤器。比如规则是 <code>article #b</code>，而当前元素的祖先里根本没有 <code>&lt;article&gt;</code>，查一下过滤器就能确定这条规则不可能命中，直接丢掉。过滤器有误报，通过的规则还要正常检查，但不会漏掉该命中的规则。源码注释提到，按 2022 年实际网页的统计，它能在早期丢掉 60% 到 70% 的规则。</p>
<p>另外 Blink 存储选择器时，组合符连接的各段也是按从右往左的顺序排的，<code>.a.b #c</code> 存下来时 <code>#c</code> 在前、<code>.a.b</code> 在后，匹配时顺着这个顺序往下走就行。</p>
<h2>选择器性能应该怎么看</h2>
<p>有了分桶和祖先过滤器，大部分选择器的差别很小，不必凭感觉去改写。真正需要关注的是两类情况。</p>
<p>一类是命中的元素太多。MDN 的例子是 <code>body * { font-size: 14px; display: flex; }</code>，它让 <code>body</code> 里每个元素都参与这条规则，而 <code>font-size</code> 这类属性本来就会继承，不需要每个元素都写一遍。MDN 也建议能写 <code>.headline</code> 就不要写 <code>body div#main-content article.post h2.headline</code>，后者解析和维护成本都更高。</p>
<p>另一类是 DOM 变化时需要大范围重新检查的选择器，典型的是 <code>:has()</code>。MDN 提到，<code>body:has(.sidebar)</code> 这种锚点太宽的写法，页面里任何变化都要重新检查；<code>.ancestor:has(.foo)</code> 内部不加约束，可能要遍历整棵子树，改成 <code>:has(&gt; .foo)</code> 能缩小范围。<code>:has()</code> 的用法见<a href="/questions/css-has-selector/">《:has() 怎样根据后代或相邻元素设置样式？》</a>。</p>
<p>要找出哪些选择器真的慢，用 Chromium 内核浏览器的 DevTools。在 Performance 面板的设置里勾选 “Enable CSS selector stats (slow)”，录制后点一个 Recalculate Style 事件，下面的 Selector Stats 表格会列出每个选择器的耗时（Elapsed）、尝试匹配的元素数（Match Attempts）、实际命中数（Match Count）和走慢路径的未命中比例。微软 Edge 文档的建议是，重点看耗时长、尝试次数多、命中却很少、慢路径比例高的选择器。改完以后再录一次，确认 Recalculate Style 的时间确实降了。</p>
<h2>常见追问</h2>
<p><strong>ID 选择器一定比类选择器快吗？</strong></p>
<blockquote>
<p>从 Blink 的实现看，id 和类名都能用来分桶，元素只会去比和自己 id、类名对应的那几组规则，两者都能很快排除无关规则。实际页面里，选择器之间的这点差别通常比不上“命中元素太多”或“DOM 频繁变化引起大范围重算”带来的影响，所以应该用 Selector Stats 实测，而不是按选择器类型下结论。</p>
</blockquote>
<p><strong>样式重算一般在什么时候发生？</strong></p>
<blockquote>
<p>规则的适用范围可能变化时就要重算，比如增删 DOM 元素、修改 <code>class</code> 或 <code>id</code> 属性、鼠标移动或焦点变化影响了 <code>:hover</code> 这类状态。重算之后如果几何信息变了，还会接着触发布局，见<a href="/questions/browser-reflow-repaint/">《重排和重绘有什么区别？哪些操作会触发它们？》</a>。</p>
</blockquote>`};export{e as default};