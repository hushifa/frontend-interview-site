var e={answerHtml:`<h2>简答</h2>
<ul>
<li>设计 token 是设计决策的命名数据（颜色、间距、字号等），由同一份来源生成 CSS、iOS、Android 等多个平台的代码。</li>
<li>常见分层：基础 token（<code>blue-600</code>）→ 语义 token（<code>color-action-primary</code>）→ 必要时的组件 token（<code>button-bg</code>）。</li>
<li>组件引用语义 token，换主题时只改语义层的映射，组件代码不用动。</li>
<li>CSS 自定义属性是 token 在 Web 端最常见的输出形式，能在运行时切换主题。</li>
<li>分层要有实际用途，不需要为每个组件都建一层 token。</li>
</ul>
<h2>散落的变量有什么问题</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.button</span> { <span class="hljs-attribute">background</span>: <span class="hljs-number">#2563eb</span>; }
<span class="hljs-selector-class">.link</span>   { <span class="hljs-attribute">color</span>: <span class="hljs-number">#2563eb</span>; }
<span class="hljs-selector-class">.badge</span>  { <span class="hljs-attribute">background</span>: <span class="hljs-built_in">var</span>(--blue); }
</code></pre></div>
<p>同一种&quot;主操作色&quot;出现了多种写法。要改品牌色或加深色模式时，只能全局搜索，还分不清哪些 <code>#2563eb</code> 是主操作色、哪些只是恰好相同的蓝色。</p>
<h2>分层示例</h2>
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
<p>深色主题只覆盖语义层，<code>.button</code> 不需要任何修改。</p>
<h2>求值时机</h2>
<p>自定义属性在使用它的元素上计算。上例中 <code>--color-action-primary: var(--blue-600)</code> 定义在 <code>:root</code>，子元素继承的是 <code>:root</code> 上已经算好的值。如果在某个子树里重新定义 <code>--blue-600</code>，子树中的 <code>--color-action-primary</code> 不会跟着变，因为它已在 <code>:root</code> 解析完毕。需要在局部换主题时，应在该元素上重新声明语义 token。</p>
<h2>单一来源与生成</h2>
<p>大型项目通常把 token 写在 JSON 中，由 Style Dictionary 等工具生成 CSS 变量、Sass 变量、TypeScript 常量和移动端资源。W3C 社区组 Design Tokens Community Group 在 2025 年 10 月发布了格式规范的首个稳定版，设计工具和代码工具可以用同一种格式交换 token。</p>
<h2>避免过度抽象</h2>
<ul>
<li>只有一个组件用到的值不必做成全局 token。</li>
<li>组件 token 只在需要单独调整某个组件、又不影响其他组件时才加。</li>
<li>名称描述用途（<code>color-danger</code>），不描述外观（<code>color-red</code>），否则换颜色时名字就错了。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>token 和 Tailwind 主题配置是什么关系？Tailwind 主题本身就是一套 token，可以由同一份来源生成。</li>
<li>怎么防止开发者直接写颜色值？用 Stylelint 规则禁止在业务样式中出现硬编码颜色。</li>
</ul>`};export{e as default};