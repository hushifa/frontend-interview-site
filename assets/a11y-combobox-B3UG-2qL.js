var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Combobox 就是城市选择框那种控件：可以打字过滤，也可以从弹出的候选里选。如果只是从固定选项里挑一个，用原生 <code>&lt;select&gt;</code> 就够了，不用自己写。</p>
<p>自己写时，输入框要设置 <code>role=&quot;combobox&quot;</code>、<code>aria-expanded</code>、<code>aria-controls</code>（指向列表）和 <code>aria-autocomplete=&quot;list&quot;</code>；列表是 <code>role=&quot;listbox&quot;</code>，每一项是 <code>role=&quot;option&quot;</code>。焦点一直留在输入框里，用 <code>aria-activedescendant</code> 指向当前高亮的选项 ID，这样用户能一边浏览候选一边继续打字。</p>
<p>键盘上，↓ 打开列表，↑ 和 ↓ 在候选之间移动，Enter 确认，Esc 关闭，再按一次可以清空。Tab 直接离开，不要把每个选项都放进 Tab 顺序。</p>
<p>最容易写错的是状态。输入的文字、高亮的候选、最终提交的值是三个不同的状态；异步结果返回时，还要丢掉过期的请求。</p>
</blockquote>
<h2>结构怎么写</h2>
<p>下面是一个列表展开、当前高亮“北京”的城市选择框。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;city&quot;</span>&gt;</span>城市<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span>
  <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city&quot;</span>
  <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;combobox&quot;</span>
  <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;true&quot;</span>
  <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;city-list&quot;</span>
  <span class="hljs-attr">aria-autocomplete</span>=<span class="hljs-string">&quot;list&quot;</span>
  <span class="hljs-attr">aria-activedescendant</span>=<span class="hljs-string">&quot;city-bj&quot;</span>
  <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;off&quot;</span>
&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-list&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;listbox&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;城市&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-bj&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>北京<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;city-sh&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;option&quot;</span> <span class="hljs-attr">aria-selected</span>=<span class="hljs-string">&quot;false&quot;</span>&gt;</span>上海<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;visually-hidden&quot;</span>&gt;</span>2 个结果<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p>焦点明明在输入框上，读屏怎么知道当前高亮的是北京？靠的就是 <code>aria-activedescendant</code>。它像一根指针，告诉辅助技术“现在活动的是 <code>city-bj</code> 这一项”，读屏就会读出“北京”，而键盘焦点不用离开输入框。</p>
<p><code>autocomplete=&quot;off&quot;</code> 关掉浏览器自带的历史提示，免得和自己的列表打架。最后那个 <code>role=&quot;status&quot;</code> 用来播报结果数量。</p>
<p>列表关闭时要真正隐藏（<code>hidden</code>），并移除 <code>aria-activedescendant</code>。高亮的那一项被过滤掉以后，也要清掉它，不能指向一个不存在的节点。</p>
<h2>为什么要分三种状态</h2>
<p>假设用户之前选了“上海”，现在输入“北”，再按 ↓ 高亮了“北京”。这时有三个值：输入文本是“北”，用来过滤；活动候选是北京，只是正在浏览；已选值仍然是上海，要等用户按 Enter 或点击，才变成北京。</p>
<p>如果只用一个字符串存这些，问题就来了。按方向键时会把用户输入的“北”覆盖掉；按 Esc 想撤销，也恢复不回去；慢请求返回的旧候选，还可能被当成用户的选择。</p>
<h2>容易出错的细节</h2>
<p>中文输入法在组合拼音时，按 Enter 是确认拼音，不是选候选。所以要判断 <code>event.isComposing</code>，组合过程中不要提交候选。</p>
<p>左右键、Home、End 不要拦截，它们在输入框里是用来移动光标的。</p>
<p>输入框一失焦就关闭列表，会出一个问题：用户用鼠标点选项时，输入框先失焦，列表先关了，选项的 <code>click</code> 来不及触发。可以在选项上监听 <code>pointerdown</code> 并调用 <code>preventDefault()</code>，让焦点留在输入框里。</p>
<p>结果数量变化时，用 <code>role=&quot;status&quot;</code> 的区域简短播报。“加载中”“无结果”只是提示，不要做成可以选的 option。候选文字用 <code>textContent</code> 插入，接口返回的内容不要当 HTML 处理。</p>
<h2>和 datalist 有什么区别</h2>
<p><code>&lt;datalist&gt;</code> 也能提供原生的建议列表，但样式没法定制，不同浏览器的过滤方式和读屏表现也不一致。只有需要高亮匹配、分组、异步加载时，才值得自己实现，或者用经过测试的组件库。</p>
<h2>常见追问</h2>
<p><strong>列表很长、要虚拟滚动怎么办？</strong></p>
<blockquote>
<p><code>aria-activedescendant</code> 指向的节点必须在 DOM 里，所以滚动时不能把当前活动项卸载掉。另外给选项加上 <code>aria-setsize</code> 和 <code>aria-posinset</code>，告诉读屏一共有多少项、当前是第几项。</p>
</blockquote>`};export{e as default};