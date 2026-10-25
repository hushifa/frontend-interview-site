var e={answerHtml:`<p>普通的 <code>.card img</code> 选择卡片里的图片；<code>.card:has(img)</code> 选择<strong>里面存在图片的卡片</strong>。变化的关键不只是“往上找父元素”，而是可以用一个元素与周围元素的关系，决定要不要选中它自己。</p>
<p><code>:has()</code> 括号里写的是相对选择器，以括号外面的元素为锚点。例如 <code>.card:has(&gt; img)</code> 中，<code>&gt; img</code> 从当前卡片出发寻找直接子图片；满足条件后，被设置样式的仍然是 <code>.card</code>。</p>
<h3>不同组合符表达不同关系</h3>
<table><thead><tr><th>选择器</th><th>选中了谁</th></tr></thead><tbody><tr><td><code>.card:has(img)</code></td><td>任意深度后代中有图片的卡片</td></tr><tr><td><code>.card:has(&gt; img)</code></td><td>直接子元素中有图片的卡片</td></tr><tr><td><code>h2:has(+ p)</code></td><td>后面紧接着一个同级段落的二级标题</td></tr><tr><td><code>li:has(~ li.active)</code></td><td>后续兄弟中存在活动列表项的列表项</td></tr></tbody></table>
<p><code>h2:has(+ p)</code> 能用来调整标题与紧随正文之间的距离，它没有选择 <code>p</code>，也没有要求 <code>p</code> 是 <code>h2</code> 的子元素。因此把 <code>:has()</code> 只叫作“父选择器”会漏掉相邻、后续兄弟等用法。</p>
<h3>让原生选项的状态带动整张卡片</h3>
<p>以前要给选中的套餐卡片加边框，常见做法是监听单选框变化，再用 JavaScript 同步一个 <code>.selected</code> 类。现在可以直接查询单选框状态：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">fieldset</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;plans&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">legend</span>&gt;</span>选择学习节奏<span class="hljs-tag">&lt;/<span class="hljs-name">legend</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;plan&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;radio&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;pace&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;daily&quot;</span> <span class="hljs-attr">checked</span> /&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>每天一题<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;plan&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;radio&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;pace&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;weekly&quot;</span> /&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>每周专题<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">fieldset</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.plan</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">align-items</span>: center;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">0.5rem</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">margin-block</span>: <span class="hljs-number">0.5rem</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">2px</span> solid <span class="hljs-number">#cbd5e1</span>;
  <span class="hljs-attribute">border-radius</span>: <span class="hljs-number">0.5rem</span>;
}

<span class="hljs-selector-class">.plan</span><span class="hljs-selector-pseudo">:has</span>(&gt; <span class="hljs-selector-tag">input</span><span class="hljs-selector-pseudo">:checked</span>) {
  <span class="hljs-attribute">border-color</span>: <span class="hljs-number">#1d4ed8</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#eff6ff</span>;
}

<span class="hljs-selector-class">.plan</span><span class="hljs-selector-pseudo">:has</span>(&gt; <span class="hljs-selector-tag">input</span><span class="hljs-selector-pseudo">:focus-visible</span>) {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">2px</span> solid <span class="hljs-number">#1d4ed8</span>;
  <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">3px</span>;
}
</code></pre></div>
<p>原生单选框仍然提供互斥选择、表单值和键盘交互，<code>:has()</code> 只让卡片外观跟随这些真实状态。用户用鼠标点标签，或者通过键盘切换选项，都无需额外维护一份“选中卡片”的样式状态。</p>
<p>这里保留了单选框本身。即便目标浏览器不支持 <code>:has()</code> 而忽略增强规则，仍能通过单选框判断选中状态；不能先把原生控件完全隐藏，再让必要反馈只依赖某个选择器。</p>
<h3>“有任意一个”和“两个都要有”怎样写</h3>
<p><code>.card:has(img, video)</code> 中的逗号表示或：有图片或者有视频就匹配。<code>.card:has(img):has(video)</code> 则要求两个条件同时成立，图片和视频可以在不同后代分支中。</p>
<p>否定的位置也会改变含义：</p>
<ul>
<li><code>.card:not(:has(img))</code>：卡片没有图片后代。</li>
<li><code>.card:has(:not(img))</code>：卡片至少有一个不是图片的后代。</li>
</ul>
<p>一张同时包含图片和段落的卡片不满足第一条，却满足第二条，因为段落不是图片。空卡片满足第一条，但不满足第二条，因为它根本没有后代。</p>
<p>不能把 <code>:has()</code> 再嵌套进另一个 <code>:has()</code>。例如要找“包含带图片文章的区块”，应根据真实关系写成 <code>section:has(article img)</code> 等合法选择器，而不是 <code>section:has(article:has(img))</code>。伪元素如 <code>::before</code> 也不能按普通后代元素放进 <code>:has()</code> 查询。</p>
<h3>权重和性能不能忽略</h3>
<p><code>:has()</code> 的特异性贡献取参数列表中最高的那一个。<code>.card:has(.cover, #hero)</code> 中，<code>.card</code> 贡献一个类，参数里的 <code>#hero</code> 贡献一个 ID，合计为 <code>1-1-0</code>。即便当前卡片只是因为含有 <code>.cover</code> 而匹配，参数中的 ID 仍然影响这条选择器的权重。</p>
<p>如果希望整条默认样式容易覆盖，可以按设计使用 <code>:where(.card:has(...))</code> 把这一部分特异性归零，而不是不断给业务覆盖规则叠加 class。</p>
<p>浏览器需要在相关 DOM 或状态改变后更新匹配结果。<code>:has()</code> 并非天然不能用于动态页面，但 <code>body:has(...)</code>、<code>*:has(...)</code> 等过宽锚点可能扩大需要检查的范围。明确到具体组件，关系明确时使用 <code>&gt;</code>、<code>+</code> 等限制，再用真实交互测量样式计算成本，比一律禁用或一律替代 JavaScript 更合理。</p>
<p>它很适合让样式响应结构、选中态和焦点态；业务中的权限、库存、异步提交结果仍应由数据与程序管理，不能把 CSS 匹配当成业务规则的唯一实现。</p>`};export{e as default};