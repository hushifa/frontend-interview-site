var e={answerHtml:`<p>Flex 可以把一行项目理解成“先确定各自的起点，再处理多出来或不够用的空间”。<code>flex-basis</code> 决定起点，<code>flex-grow</code> 决定有空余时怎么增加，<code>flex-shrink</code> 决定空间不足时怎么减少。</p>
<p>它们处理的是<strong>主轴尺寸</strong>。<code>flex-direction: row</code> 的常见横排页面中是宽度；改成 <code>column</code> 后则通常是高度。换行布局中，每一行分别分配空间，上一行的项目宽度不会自动成为下一行的统一列宽。</p>
<h3>从基础尺寸开始</h3>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.item</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">1</span> <span class="hljs-number">1</span> <span class="hljs-number">200px</span>;
}
</code></pre></div>
<p>三个值依次是 <code>grow</code>、<code>shrink</code>、<code>basis</code>。这表示以 <code>200px</code> 为基础，允许增长，也允许收缩，并不是承诺最终宽度永远是 <code>200px</code>。</p>
<p><code>flex-basis: auto</code> 会参考主轴对应的尺寸属性，例如横向布局里的 <code>width</code>；如果该尺寸也是 <code>auto</code>，就进一步根据内容确定基础尺寸。明确写了非 <code>auto</code> 的 <code>flex-basis</code> 时，计算基础尺寸主要使用它，而不能把另一个 <code>width</code> 当成最终固定宽度。</p>
<h3>多出的空间怎么分</h3>
<p>假设容器内容宽度是 <code>600px</code>，两个项目的基础宽度都是 <code>100px</code>，没有外边距、边框、内边距和间隙，也没有最小/最大尺寸干预。剩余空间是 <code>600 - 100 - 100 = 400px</code>。</p>
<p>A 的 <code>flex-grow</code> 是 1，B 是 3，则多出的 <code>400px</code> 按 1:3 分配：</p>
<table><thead><tr><th>项目</th><th>基础宽度</th><th>分到的空间</th><th>最终宽度</th></tr></thead><tbody><tr><td>A</td><td>100px</td><td>100px</td><td>200px</td></tr><tr><td>B</td><td>100px</td><td>300px</td><td>400px</td></tr></tbody></table>
<p>注意分配比例作用于<strong>增加量</strong>，不是最终宽度。因此 <code>grow</code> 为 1 和 3，不代表两个项目最终宽度就是 1:3。</p>
<p>当增长系数总和小于 1 时，Flex 还有部分填充规则，可能留下未分配空间。例如单个项目 <code>flex-grow: 0.5</code> 不一定吃完所有空余。上面的比例计算以常见的系数总和不小于 1 为前提。</p>
<h3>不够用的空间为什么不是平均减</h3>
<p>换一个例子：容器只有 <code>300px</code>，A 的基础宽度为 <code>200px</code>，B 为 <code>400px</code>，两者的 <code>flex-shrink</code> 都为 1。总共需要收缩 <code>300px</code>。</p>
<p>收缩的权重需要乘上基础尺寸：A 是 <code>1 × 200</code>，B 是 <code>1 × 400</code>，所以减少量按 1:2 分配。A 减少 <code>100px</code> 后剩 <code>100px</code>，B 减少 <code>200px</code> 后剩 <code>200px</code>。</p>
<p>可以在横排浏览器页面中运行这个完整的简化例子：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;shrink-demo&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;a&quot;</span>&gt;</span>A<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;b&quot;</span>&gt;</span>B<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.shrink-demo</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">300px</span>;
}

<span class="hljs-selector-class">.shrink-demo</span> &gt; <span class="hljs-selector-tag">div</span> {
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
}

<span class="hljs-selector-class">.shrink-demo</span> <span class="hljs-selector-class">.a</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">0</span> <span class="hljs-number">1</span> <span class="hljs-number">200px</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#e2e8f0</span>;
}

<span class="hljs-selector-class">.shrink-demo</span> <span class="hljs-selector-class">.b</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">0</span> <span class="hljs-number">1</span> <span class="hljs-number">400px</span>;
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#cbd5e1</span>;
}
</code></pre></div>
<p>如果两项的 <code>shrink</code> 不同，继续按“收缩系数 × 基础尺寸”计算相对权重。设置为 0 就是不参与收缩，但不意味着其他项目一定能挤出足够空间，容器仍可能溢出。</p>
<p>真实算法还会处理 <code>min-width</code>、<code>max-width</code> 等限制：某项达到限制后会被冻结，剩下的空间重新分配。不能忽略约束，把上面的算式当成所有页面的完整求解公式。</p>
<h3><code>flex: 1</code> 之后为什么长文字还是撑开容器</h3>
<p>常见的 Flex 项目默认 <code>min-width: auto</code>，其自动最小尺寸可能受内容影响。一个不能断开的长网址或 <code>white-space: nowrap</code> 的标题，就可能使它不能缩到你希望的宽度。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.row</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-selector-class">.content</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
}

<span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">white-space</span>: nowrap;
  <span class="hljs-attribute">text-overflow</span>: ellipsis;
}

<span class="hljs-selector-class">.actions</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">0</span> <span class="hljs-number">0</span> auto;
}
</code></pre></div>
<p>假设 <code>.content</code> 与 <code>.actions</code> 是 <code>.row</code> 的直接子项，<code>.title</code> 在 <code>.content</code> 内。<code>min-width: 0</code> 允许内容区真正缩小；标题的三个溢出属性才负责把放不下的文字显示成省略号。只写省略号而没有解决父级最小宽度，可能没有效果。纵向 Flex 滚动区域中则经常需要检查相应的 <code>min-height: 0</code>。</p>
<p>常见简写可这样区分：<code>flex: initial</code> 是 <code>0 1 auto</code>，可以缩小但不主动增长；<code>flex: auto</code> 是 <code>1 1 auto</code>，从自身尺寸出发伸缩；<code>flex: none</code> 是 <code>0 0 auto</code>，不参与伸缩。</p>
<p>浏览器中 <code>flex: 1</code> 通常展开为 <code>1 1 0%</code>。在主轴尺寸明确的常见布局中，零基础尺寸有助于按增长系数分配空间；但 <code>0%</code> 和明确的 <code>0px</code> 并不总是等价。容器主轴尺寸不确定时，百分比基础尺寸可能按内容处理。再加上内容最小尺寸、内边距等因素，不能把 <code>flex: 1</code> 简化成“永远等宽”。</p>`};export{e as default};