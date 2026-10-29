var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>设计 token 就是给设计决策起了名字的数据，比如颜色、间距、字号。它们写在一份来源里，再由工具生成 CSS、iOS、Android 各个平台的代码。</p>
<p>token 通常分层。最底下是基础 token，比如 <code>blue-600</code>，只表示一个具体的值；上面是语义 token，比如 <code>color-action-primary</code>，表示“主操作用的颜色”；必要时再加组件 token，比如 <code>button-bg</code>。</p>
<p>分层的好处是，组件只引用语义 token。换主题、做深色模式时，只改语义层指向哪个基础值，组件代码一行都不用动。在 Web 端，token 最常见的输出形式就是 CSS 自定义属性，也就是 CSS 变量，可以在运行时切换主题。</p>
<p>要注意别过度设计。分层要有实际用处，不需要给每个组件都建一层 token。</p>
</blockquote>
<h2>散落的变量有什么问题</h2>
<p>下面三处其实都是“主操作色”，写法却各不相同：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.button</span> { <span class="hljs-attribute">background</span>: <span class="hljs-number">#2563eb</span>; }
<span class="hljs-selector-class">.link</span>   { <span class="hljs-attribute">color</span>: <span class="hljs-number">#2563eb</span>; }
<span class="hljs-selector-class">.badge</span>  { <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--blue); }
</code></pre></div>
<p>要改品牌色或者加深色模式时，只能全局搜索。更麻烦的是，搜出来的 <code>#2563eb</code> 里，哪些是主操作色，哪些只是碰巧也用了这个蓝色，根本分不清。</p>
<h2>分层以后是什么样</h2>
<p>下面把基础值和语义分开写，再加一个深色主题：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  <span class="hljs-comment">/* 基础 token：可用的原始值 */</span>
  <span class="hljs-attr">--blue-600</span>: <span class="hljs-number">#2563eb</span>;
  <span class="hljs-attr">--blue-400</span>: <span class="hljs-number">#60a5fa</span>;
  <span class="hljs-attr">--gray-50</span>: <span class="hljs-number">#f9fafb</span>;
  <span class="hljs-attr">--gray-900</span>: <span class="hljs-number">#111827</span>;

  <span class="hljs-comment">/* 语义 token：表达用途 */</span>
  <span class="hljs-attr">--color-action-primary</span>: <span class="hljs-built_in">var</span>(--blue-<span class="hljs-number">600</span>);
  <span class="hljs-attr">--color-surface</span>: <span class="hljs-built_in">var</span>(--gray-<span class="hljs-number">50</span>);
  <span class="hljs-attr">--color-text</span>: <span class="hljs-built_in">var</span>(--gray-<span class="hljs-number">900</span>);
}

<span class="hljs-selector-attr">[data-theme=<span class="hljs-string">&#x27;dark&#x27;</span>]</span> {
  <span class="hljs-attr">--color-action-primary</span>: <span class="hljs-built_in">var</span>(--blue-<span class="hljs-number">400</span>);
  <span class="hljs-attr">--color-surface</span>: <span class="hljs-built_in">var</span>(--gray-<span class="hljs-number">900</span>);
  <span class="hljs-attr">--color-text</span>: <span class="hljs-built_in">var</span>(--gray-<span class="hljs-number">50</span>);
}

<span class="hljs-selector-class">.button</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--color-action-primary);
  <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--color-surface);
}
</code></pre></div>
<p>深色主题只覆盖了语义层，把“主操作色”指向另一个蓝色。<code>.button</code> 没有任何修改，颜色就跟着变了。</p>
<h2>在子树里改基础 token，为什么不生效</h2>
<p>自定义属性是在使用它的元素上计算的，计算好的值再继承给子元素。</p>
<p>上面的例子里，<code>--color-action-primary: var(--blue-600)</code> 定义在 <code>:root</code> 上，所以在 <code>:root</code> 就已经算成了 <code>#2563eb</code>，子元素继承的是这个算好的颜色值。</p>
<p>这时如果你在某个子树里重新定义 <code>--blue-600</code>，想让这一块换个颜色，会发现子树里的 <code>--color-action-primary</code> 不跟着变。原因就是它早在 <code>:root</code> 上解析完了，继承下来的是结果，不是那句 <code>var(--blue-600)</code>。</p>
<p>改法是在这个元素上直接重新声明语义 token，比如在这块区域上写 <code>--color-action-primary: ...</code>。</p>
<h2>token 从哪里来</h2>
<p>大型项目通常把 token 写在 JSON 里，用 Style Dictionary 这类工具生成 CSS 变量、Sass 变量、TypeScript 常量和移动端资源，这样各平台用的是同一份来源。</p>
<p>W3C 社区组 Design Tokens Community Group 在 2025 年 10 月发布了 token 格式规范的首个稳定版。有了统一格式，设计工具和代码工具就能互相交换 token。</p>
<h2>怎样避免过度抽象</h2>
<p>只有一个组件用到的值，不必做成全局 token。组件 token 也只在一种情况下才加：需要单独调整某个组件，又不想影响其他组件。</p>
<p>起名字要描述用途，比如 <code>color-danger</code>，不要描述外观，比如 <code>color-red</code>。否则哪天危险色改成了橙色，名字就错了。</p>
<h2>常见追问</h2>
<p><strong>token 和 Tailwind 的主题配置是什么关系？</strong></p>
<blockquote>
<p>Tailwind 的主题配置本身就是一套 token，可以和其他平台一样，由同一份来源生成。</p>
</blockquote>
<p><strong>怎么防止开发者在业务代码里直接写颜色值？</strong></p>
<blockquote>
<p>用 Stylelint 加规则，禁止业务样式里出现硬编码的颜色。</p>
</blockquote>`};export{e as default};