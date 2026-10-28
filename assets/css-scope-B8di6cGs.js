var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>@scope (.card) to (.content)</code> 只匹配 <code>.card</code> 内部、且不在 <code>.content</code> 内的元素，适合“组件样式不要漏进插槽内容”的场景。</li>
<li>作用域内的普通选择器相当于前面加了 <code>:where(:scope)</code>，不增加优先级；显式写 <code>:scope</code> 会加一个类选择器的优先级。</li>
<li>层叠时先比较重要性、层和优先级，再比较作用域根的远近（scoping proximity），最后才比较源码顺序。</li>
<li>自 2026 年 3 月起 <code>@scope</code> 进入 Baseline，旧浏览器会整体忽略这条规则。</li>
<li>它只限制选择器的匹配范围；Shadow DOM 则让外部选择器匹配不到影子树内的元素。</li>
</ul>
<h2>上限和下限</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@scope</span> (.card) to (.card-content) {
  <span class="hljs-selector-tag">img</span> {
    <span class="hljs-attribute">border-radius</span>: <span class="hljs-number">8px</span>;
  }

  <span class="hljs-selector-pseudo">:scope</span> {
    <span class="hljs-attribute">padding</span>: <span class="hljs-number">16px</span>;
  }
}
</code></pre></div>
<p>卡片自身的图片会有圆角，用户放进 <code>.card-content</code> 的图片不受影响。以前要做到这一点，通常靠 BEM 命名或更长的子选择器。</p>
<h2>远近规则</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@scope</span> (.light) {
  <span class="hljs-selector-tag">p</span> { <span class="hljs-attribute">color</span>: black; }
}

<span class="hljs-keyword">@scope</span> (.dark) {
  <span class="hljs-selector-tag">p</span> { <span class="hljs-attribute">color</span>: white; }
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;dark&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;light&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>黑色文字<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>两条规则优先级相同，<code>.light</code> 离 <code>&lt;p&gt;</code> 只有一层，所以它胜出，即使 <code>.dark</code> 写在后面。若某条规则的优先级更高，它仍然会赢，远近只在优先级相同时起作用。</p>
<h2>内联作用域</h2>
<p>在 <code>&lt;style&gt;</code> 里直接写不带前导的 <code>@scope</code>，作用域根就是这个 <code>&lt;style&gt;</code> 的父元素：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">style</span>&gt;</span><span class="css">
    <span class="hljs-keyword">@scope</span> {
      <span class="hljs-selector-tag">h2</span> { <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1.25rem</span>; }
    }
  </span><span class="hljs-tag">&lt;/<span class="hljs-name">style</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>只影响本区块的标题<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<h2>和其他方案对比</h2>
<ul>
<li>CSS Modules 在构建时改写类名，任何浏览器都可用，但需要构建工具。</li>
<li>Shadow DOM 的封装更强，外部选择器默认匹配不到内部元素，但继承属性（如 <code>color</code>、<code>font</code>）和自定义属性仍会传入，代价是主题和全局样式需要通过自定义属性或 <code>::part</code> 传入。</li>
<li><code>@scope</code> 不需要构建，也不改变 DOM 结构，适合给普通 HTML 组件限定范围。</li>
</ul>
<p>MDN 提示 <code>@scope</code> 内 <code>&amp;</code> 的优先级在不同引擎和版本中有差异，依赖它的写法要查兼容表。</p>
<h2>常见追问</h2>
<ul>
<li><code>@scope</code> 和层叠层怎样配合？层先于优先级和远近比较，可以把组件样式放进 <code>@layer components</code>，再在层内用 <code>@scope</code> 限定范围。</li>
</ul>`};export{e as default};