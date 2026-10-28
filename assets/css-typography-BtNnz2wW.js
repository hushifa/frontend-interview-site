var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>line-height</code> 写无单位数值（如 <code>1.6</code>），子元素按自己的字号重新计算；写 <code>px</code> 或 <code>em</code> 会把父元素算好的固定值继承下去。</li>
<li>正文行宽用 <code>max-inline-size: 65ch</code> 一类的限制，过长的行会让读者找不到下一行的开头。</li>
<li>长 URL 撑破布局时用 <code>overflow-wrap: anywhere</code>；<code>word-break: break-all</code> 会在任意字母间断开，会影响英文可读性。</li>
<li><code>word-break: keep-all</code> 让中日韩文字按词或标点断行，<code>line-break: strict</code> 控制标点避头尾。</li>
<li>可变字体优先用 <code>font-weight</code>、<code>font-stretch</code>、<code>font-style</code> 控制；<code>font-variation-settings</code> 是低层属性，会覆盖这些高层属性，而且多次声明时整体替换，不会按轴合并。</li>
</ul>
<h2>行高</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">line-height</span>: <span class="hljs-number">1.6</span>;
}

<span class="hljs-selector-tag">h1</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">2.5rem</span>;
  <span class="hljs-attribute">line-height</span>: <span class="hljs-number">1.2</span>;
}
</code></pre></div>
<p>如果 <code>body</code> 写 <code>line-height: 24px</code>，<code>h1</code> 的 40px 字号也只有 24px 行高，多行标题会重叠。</p>
<h2>断行</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.content</span> {
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
}

<span class="hljs-selector-class">.cjk-title</span> {
  <span class="hljs-attribute">word-break</span>: keep-all;
}

<span class="hljs-selector-class">.code</span> {
  <span class="hljs-attribute">white-space</span>: pre;
  <span class="hljs-attribute">overflow-x</span>: auto;
}
</code></pre></div>
<p><code>overflow-wrap: break-word</code> 和 <code>anywhere</code> 都只在没有其他断点时才断开单词，区别在于 <code>anywhere</code> 断开后的软换行机会会参与最小内容尺寸计算，flex 和 grid 项目里更不容易撑开容器。</p>
<p><code>hyphens: auto</code> 能为英文加连字符，需要正确的 <code>lang</code> 属性，浏览器才知道用哪种语言的断词规则。</p>
<h2>字体栈</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-family</span>: system-ui, -apple-system, <span class="hljs-string">&#x27;Segoe UI&#x27;</span>, <span class="hljs-string">&#x27;PingFang SC&#x27;</span>,
    <span class="hljs-string">&#x27;Microsoft YaHei&#x27;</span>, sans-serif;
}
</code></pre></div>
<p>先写西文字体再写中文字体，英文和数字使用西文字形，汉字落到中文字体。中文 Web 字体体积大，正文通常直接用系统字体。字体加载策略见《font-display 怎样影响字体加载期间的文字显示？》。</p>
<h2>可变字体</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Inter&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&#x27;/inter.woff2&#x27;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&#x27;woff2&#x27;</span>);
  <span class="hljs-attribute">font-weight</span>: <span class="hljs-number">100</span> <span class="hljs-number">900</span>;
}

<span class="hljs-selector-tag">strong</span> {
  <span class="hljs-attribute">font-weight</span>: <span class="hljs-number">650</span>;
}
</code></pre></div>
<p><code>@font-face</code> 里声明 <code>font-weight</code> 的范围后，任意数值都能用。只有自定义轴（如 <code>GRAD</code>）才需要 <code>font-variation-settings</code>。</p>
<h2>常见追问</h2>
<ul>
<li>为什么文字底部和容器有空隙？行高是在字形上下平均分配的，加上字体自身的上下留白，视觉上不居中。<code>text-box: trim-both cap alphabetic</code> 可以裁掉多余的空白，支持情况要查兼容表。</li>
</ul>`};export{e as default};