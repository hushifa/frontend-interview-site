var e={answerHtml:`<h2>简答</h2>
<ul>
<li>只从固定选项中选择时用原生 <code>&lt;select&gt;</code>，不必手写 Combobox。</li>
<li>输入框设置 <code>role=&quot;combobox&quot;</code>、<code>aria-expanded</code>、<code>aria-controls</code>（指向列表）、<code>aria-autocomplete=&quot;list&quot;</code>；列表是 <code>role=&quot;listbox&quot;</code>，每项是 <code>role=&quot;option&quot;</code>。</li>
<li>DOM 焦点留在输入框，用 <code>aria-activedescendant</code> 指向当前高亮的选项 ID，用户可以边浏览边继续打字。</li>
<li>键盘：↓/↑ 打开并移动候选，Enter 确认，Esc 关闭（再按一次可清空），Tab 离开时不把每个选项都放进 Tab 顺序。</li>
<li>输入的文字、高亮的候选、最终提交的值是三个不同的状态，异步结果返回时要丢弃过期请求。</li>
</ul>
<h2>结构</h2>
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
<p>列表关闭时要真正隐藏（<code>hidden</code>），并移除 <code>aria-activedescendant</code>；高亮项被过滤掉后，也要清除它，不能指向不存在的节点。</p>
<h2>三种状态</h2>
<p>用户之前选了“上海”，现在输入“北”，按 ↓ 高亮“北京”：</p>
<ul>
<li>输入文本：“北”，用来过滤。</li>
<li>活动候选：北京，只是浏览中。</li>
<li>已选值：仍是上海，直到按 Enter 或点击才变成北京。</li>
</ul>
<p>只存一个字符串会导致：方向键覆盖了用户的输入、Esc 无法恢复、慢请求返回的旧候选被当成选择。</p>
<h2>容易出错的细节</h2>
<ul>
<li>中文输入法组合时按 Enter 是确认拼音，判断 <code>event.isComposing</code>，组合中不要提交候选。</li>
<li>不要拦截左右键、Home、End，它们在输入框里用于移动光标。</li>
<li>输入框失焦时立即关闭列表，会让鼠标点击选项的 <code>click</code> 来不及触发。可以在选项上监听 <code>pointerdown</code> 并 <code>preventDefault()</code>，保持焦点在输入框。</li>
<li>结果数量变化时用 <code>role=&quot;status&quot;</code> 的区域简短播报，“加载中”“无结果”不要做成可选择的 option。</li>
<li>候选文字用 <code>textContent</code> 插入，接口返回的内容不要当作 HTML。</li>
</ul>
<h2>和 datalist 的区别</h2>
<p><code>&lt;datalist&gt;</code> 能提供原生建议列表，但样式不能定制，不同浏览器的过滤和读屏行为也不一致。需要高亮匹配、分组、异步加载时，才值得自己实现，或者使用经过测试的组件库。</p>
<h2>常见追问</h2>
<ul>
<li>列表很长要虚拟滚动怎么办？<code>aria-activedescendant</code> 指向的节点必须在 DOM 中，滚动时不能卸载当前活动项，并给选项加 <code>aria-setsize</code> 和 <code>aria-posinset</code> 说明总数和位置。</li>
</ul>`};export{e as default};