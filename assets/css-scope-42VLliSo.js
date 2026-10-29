var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写卡片组件时，想给卡片里的图片加圆角，但用户放进卡片正文的图片不要受影响。<code>@scope (.card) to (.card-content)</code> 就能做到：只匹配 <code>.card</code> 里面、又不在 <code>.card-content</code> 里面的元素。</p>
<p>它不会提高优先级。作用域里的普通选择器，相当于前面加了 <code>:where(:scope)</code>，优先级不变；明确写出 <code>:scope</code> 才会加一个类选择器的优先级。</p>
<p>两条规则冲突时，先比重要性、层和优先级，都打平了，再比作用域根离元素有多近，这叫作用域远近（scoping proximity），最后才比源码顺序。</p>
<p><code>@scope</code> 自 2026 年 3 月起进入 Baseline，旧浏览器会把整条规则忽略掉。另外它只是限制选择器的匹配范围，不像 Shadow DOM 那样让外部选择器完全匹配不到里面的元素。</p>
</blockquote>
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
<p><code>.card</code> 是上限，也就是作用域的根；<code>.card-content</code> 是下限，到这里就停。所以卡片自己的图片有圆角，用户放进 <code>.card-content</code> 的图片不受影响。<code>:scope</code> 指的就是作用域根 <code>.card</code> 本身。</p>
<p>以前要做到这一点，通常靠 BEM 命名，比如 <code>.card__img</code>，或者写更长的子选择器。</p>
<h2>两个作用域打架时听谁的</h2>
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
<p>文字是黑色的。按以前的规则，两条优先级相同，后写的 <code>.dark</code> 应该赢，文字该是白色。</p>
<p>可是 <code>@scope</code> 多了一步比较：看谁的作用域根离 <code>&lt;p&gt;</code> 更近。<code>.light</code> 是 <code>&lt;p&gt;</code> 的父元素，只隔一层；<code>.dark</code> 隔了两层。所以 <code>.light</code> 赢，跟书写顺序无关。这正符合直觉，浅色区域里的文字就该按浅色主题来。</p>
<p>不过远近只在优先级打平时才起作用。如果某条规则的优先级更高，它还是会赢。</p>
<h2>直接写在 style 标签里</h2>
<p>在 <code>&lt;style&gt;</code> 里写不带括号的 <code>@scope</code>，作用域根就是这个 <code>&lt;style&gt;</code> 的父元素：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">style</span>&gt;</span><span class="css">
    <span class="hljs-keyword">@scope</span> {
      <span class="hljs-selector-tag">h2</span> { <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1.25rem</span>; }
    }
  </span><span class="hljs-tag">&lt;/<span class="hljs-name">style</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>只影响本区块的标题<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<h2>和 CSS Modules、Shadow DOM 怎么选</h2>
<p>CSS Modules 在构建时改写类名，所有浏览器都能用，但需要构建工具。</p>
<p>Shadow DOM 隔离得最彻底，外面的选择器默认匹配不到里面的元素。不过 <code>color</code>、<code>font</code> 这类继承属性和自定义属性还是会传进去。代价是外部的全局类和元素选择器进不去，主题要靠继承属性、自定义属性或 <code>::part</code> 传进去。</p>
<p><code>@scope</code> 不需要构建，也不改变 DOM 结构，适合给普通的 HTML 组件限定样式范围。</p>
<p>还有一点：MDN 提示，<code>@scope</code> 里 <code>&amp;</code> 的优先级在不同浏览器引擎和版本里不一样，依赖它的写法要先查兼容表。</p>
<h2>常见追问</h2>
<p><strong><code>@scope</code> 和层叠层怎么配合？</strong></p>
<blockquote>
<p>层的比较比优先级和远近都早。所以可以先把组件样式放进 <code>@layer components</code>，再在层里用 <code>@scope</code> 限定范围，层管先后，<code>@scope</code> 管范围。</p>
</blockquote>`};export{e as default};