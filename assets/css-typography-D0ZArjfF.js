var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>行高要写不带单位的数字，比如 <code>line-height: 1.6</code>。这样每个子元素按自己的字号重新算行高。写成 <code>px</code> 或 <code>em</code>，父元素算好的固定值会原样传给子元素，大标题就会挤在一起。</p>
<p>正文一行不要太长，用 <code>max-inline-size: 65ch</code> 这类写法限制，大约 60 到 75 个字母或 30 到 40 个汉字。行太长，读者读完一行很难找到下一行的开头。</p>
<p>断行有几个常用属性。长网址撑破布局用 <code>overflow-wrap: anywhere</code>；<code>word-break: break-all</code> 会在任意字母之间断开，影响英文阅读。<code>word-break: keep-all</code> 让中日韩文字按词或标点断行，<code>line-break: strict</code> 控制标点不出现在行首。</p>
<p>可变字体优先用 <code>font-weight</code>、<code>font-stretch</code>、<code>font-style</code> 控制。<code>font-variation-settings</code> 是底层属性，会覆盖这些常规属性，而且多次声明时是整体替换，不会按轴合并。</p>
</blockquote>
<h2>行高为什么要写无单位数字</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">line-height</span>: <span class="hljs-number">1.6</span>;
}

<span class="hljs-selector-tag">h1</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">2.5rem</span>;
  <span class="hljs-attribute">line-height</span>: <span class="hljs-number">1.2</span>;
}
</code></pre></div>
<p>假如 <code>body</code> 写的是 <code>line-height: 24px</code>，<code>h1</code> 又没有自己写行高，会怎样？<code>h1</code> 字号是 40px，继承来的行高却只有 24px，标题一换行，两行字就叠在一起了。</p>
<p>原因是 <code>px</code> 和 <code>em</code> 的行高在父元素上就算成了固定的像素值，子元素继承的是这个结果。无单位的 <code>1.6</code> 继承下去的是比例，每个元素按自己的字号乘一遍。</p>
<h2>长内容怎么断行</h2>
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
<p><code>overflow-wrap</code> 有 <code>break-word</code> 和 <code>anywhere</code> 两个值，都是只在找不到别的断点时才把单词断开。区别在于，<code>anywhere</code> 产生的断点会算进元素的最小内容宽度。所以在 flex 和 grid 项目里，<code>anywhere</code> 能让项目缩下去，不容易撑开容器；<code>break-word</code> 不行。</p>
<p>代码块一般不让它自动换行，用 <code>white-space: pre</code> 保留原样，横向滚动。</p>
<p>英文想要加连字符，用 <code>hyphens: auto</code>，但必须写对 <code>lang</code> 属性，浏览器才知道按哪种语言的规则断词。</p>
<h2>中英文混排的字体栈</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-family</span>: system-ui, -apple-system, <span class="hljs-string">&#x27;Segoe UI&#x27;</span>, <span class="hljs-string">&#x27;PingFang SC&#x27;</span>,
    <span class="hljs-string">&#x27;Microsoft YaHei&#x27;</span>, sans-serif;
}
</code></pre></div>
<p>为什么先写西文字体？浏览器按顺序找字形。西文字体里有字母和数字，没有汉字。所以英文和数字用西文字形显示，汉字找不到，就落到后面的中文字体。反过来写，中文字体里也有字母，英文就全变成中文字体里的字母了。</p>
<p>中文网页字体体积很大，正文通常直接用系统字体。字体加载策略见<a href="/questions/perf-font-loading/">《网页字体加载怎样优化？font-display、子集化、preload 和 size-adjust 各解决什么问题？》</a>。</p>
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
<p>一个可变字体文件里包含了连续的粗细变化。在 <code>@font-face</code> 里声明 <code>font-weight</code> 的范围是 100 到 900，范围内的任意数值都能用，比如 650。</p>
<p>只有字体的自定义轴，比如 <code>GRAD</code>，才需要用 <code>font-variation-settings</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么文字和容器底部之间总有一点空隙，看着不居中？</strong></p>
<blockquote>
<p>行高多出来的空间是平均分在字形上下的，再加上字体自身上下的留白，视觉上就不居中。<code>text-box: trim-both cap alphabetic</code> 可以把多余的空白裁掉，支持情况要先查兼容表。</p>
</blockquote>`};export{e as default};