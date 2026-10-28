var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>@scope</code> 让一组规则只在作用域根和可选的 <code>to (...)</code> 边界之间匹配，解决的是选择器匹配范围。</li>
<li>它不会阻止继承和自定义属性，也不隔离 DOM、事件或运行时模块。</li>
<li><code>@scope</code> 不改变特异性；特异性相同时，作用域根离元素更近的规则胜出。</li>
<li>可以与 CSS Modules、<code>@layer</code> 组合，分别负责类名、匹配范围和层叠顺序。</li>
</ul>
<p>大型页面里常见一个问题：卡片组件里的 <code>.title</code>、后台页面里的 <code>.title</code> 和文章内容里的 <code>.title</code> 互相覆盖。给每个选择器加更长的前缀可以暂时解决，但会让特异性越来越高，组件迁移和覆盖变得困难。</p>
<p><code>@scope</code> 让一组 CSS 规则只在指定的作用域根和边界内匹配。它解决的是选择器匹配范围，不能把 CSS 变成 JavaScript 模块，也不能自动隔离 DOM、事件或自定义属性。</p>
<h2>作用域根限制规则从哪里开始匹配</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@scope</span> (.article-card) {
  <span class="hljs-selector-pseudo">:scope</span> {
    <span class="hljs-attribute">padding</span>: <span class="hljs-number">1rem</span>;
  }

  <span class="hljs-selector-class">.title</span> {
    <span class="hljs-attribute">margin-block</span>: <span class="hljs-number">0</span> <span class="hljs-number">0.5rem</span>;
    <span class="hljs-attribute">color</span>: <span class="hljs-number">#1f2937</span>;
  }
}
</code></pre></div>
<p><code>.title</code> 只匹配 <code>.article-card</code> 作用域内的后代，不会误伤页面其他区域。<code>:scope</code> 表示作用域根本身。作用域根可以是一个选择器列表，规则也可以使用 <code>to (...)</code> 指定嵌套边界：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@scope</span> (.article-card) to (.article-card__footer) {
  <span class="hljs-selector-class">.title</span> {
    <span class="hljs-attribute">color</span>: <span class="hljs-number">#111827</span>;
  }
}
</code></pre></div>
<p>这里标题规则不会穿过 <code>.article-card__footer</code> 边界继续匹配。边界是选择器匹配范围，不代表元素被移动、隐藏或获得真正的 Shadow DOM 隔离。</p>
<h2>@scope 不会阻止继承和自定义属性</h2>
<p>作用域内的元素仍然继承父级的 <code>color</code>、字体和自定义属性；全局元素规则也可能参与最终计算。组件如果需要主题变量，仍要设计 token 的来源和覆盖关系；<code>@scope</code> 只是减少了选择器的误匹配。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-attr">--surface</span>: white;
  <span class="hljs-attr">--text</span>: <span class="hljs-number">#111827</span>;
}

<span class="hljs-keyword">@scope</span> (.panel) {
  <span class="hljs-selector-class">.content</span> {
    <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--text);
    <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--surface);
  }
}
</code></pre></div>
<p>把一个节点移到另一个作用域后，它匹配的规则可能改变；动态增加 class、Portal、Shadow DOM 和 iframe 也有各自边界。不要把作用域名称当作权限或数据隔离机制。</p>
<h2>@scope、@layer、CSS Modules 和 Shadow DOM 不是一回事</h2>
<table><thead><tr><th>机制</th><th>主要解决</th><th>不自动解决</th></tr></thead><tbody><tr><td><code>@scope</code></td><td>选择器匹配范围</td><td>DOM、事件、继承和运行时模块隔离</td></tr><tr><td><code>@layer</code></td><td>层叠优先顺序</td><td>命名空间和组件边界</td></tr><tr><td>CSS Modules</td><td>构建时类名局部化</td><td>裸元素规则、继承和运行时隔离</td></tr><tr><td>Shadow DOM</td><td>DOM/CSS 子树边界</td><td>跨边界通信、主题和所有无障碍问题</td></tr></tbody></table>
<p>它们可以组合：CSS Modules 负责类名，<code>@scope</code> 负责局部规则范围，<code>@layer</code> 负责公共样式和业务覆盖的顺序。选择器仍可能与未分层的全局规则竞争，不能只因为用了 <code>@scope</code> 就停止检查最终计算样式。</p>
<p><code>@scope</code> 不改变选择器的特异性。层叠在比较完特异性之后，还有一步独立的“作用域接近程度”：特异性相同时，作用域根离元素更近的规则胜出。遇到覆盖异常，应同时查看作用域、层、特异性、源顺序和继承，而不是继续增加选择器长度。</p>
<h2>迁移组件时要保留语义和降级</h2>
<p>可以先把某个组件的规则包进 <code>@scope</code>，再在支持的浏览器中验证作用域边界。旧浏览器不支持时，内部规则不会自动变成另一种隔离机制；要使用 CSS Modules、构建工具转换或保留足够安全的前缀作为降级。</p>
<p>不要把整站所有样式一次性包进一个巨大作用域。作用域根太宽，收益有限；作用域边界与组件 DOM 结构不一致，又会让规则难以理解。每个作用域应对应一个稳定的组件边界，并明确是否允许业务方覆盖。</p>
<p>动态主题、Portal 和浮层通常需要跨越原组件 DOM 的实际挂载位置。浮层规则如果依赖原来的作用域根，传送到外部容器后可能不再匹配；这时应在目标容器设计公共浮层样式，或把作用域和挂载策略一起定义。</p>
<h2>验证不只看源码是否“包起来了”</h2>
<p>测试应覆盖同名 class 的邻近组件、嵌套作用域、边界元素、主题变量、Portal、Shadow DOM 和旧浏览器降级。开发者工具中检查 computed style 和匹配规则，确认实际元素没有被作用域外的规则意外覆盖。</p>
<p><code>@scope</code> 的浏览器支持会随版本变化，实验性实现不能直接当成所有目标 WebView 都支持。它适合逐步改善样式架构，但不能代替组件契约、设计 token、可访问交互和真实设备验证。</p>`};export{e as default};