var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>margin-left</code> 永远是左边。可是阿拉伯语是从右往左写的，同样的设计，间距应该在右边。逻辑属性不说左右，说的是“开始”和“结束”：<code>margin-inline-start</code> 在中文、英文里等于 <code>margin-left</code>，在 <code>dir=&quot;rtl&quot;</code> 的阿拉伯语里等于 <code>margin-right</code>。</p>
<p>这里有两个方向。inline 方向是文字排列的方向，block 方向是一行行往下堆的方向。竖排（<code>writing-mode: vertical-rl</code>）时，inline 变成上下方向，<code>inline-size</code> 对应的就是高度。</p>
<p>常用的对照是：<code>width</code> 对应 <code>inline-size</code>，<code>padding-left</code> 对应 <code>padding-inline-start</code>，<code>top</code> 对应 <code>inset-block-start</code>，<code>text-align: left</code> 对应 <code>text-align: start</code>。</p>
<p>好处是方向只由 HTML 的 <code>dir</code> 属性决定，样式里不用再为 RTL 写一套覆盖规则。要注意，和书写方向无关的东西，比如阴影、固定在屏幕角落的按钮，继续用物理属性。</p>
</blockquote>
<h2>同一套样式，左右自动翻转</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.message</span> {
  <span class="hljs-attribute">padding-inline</span>: <span class="hljs-number">16px</span>;
  <span class="hljs-attribute">margin-block-end</span>: <span class="hljs-number">8px</span>;
  <span class="hljs-attribute">border-inline-start</span>: <span class="hljs-number">4px</span> solid steelblue;
  <span class="hljs-attribute">text-align</span>: start;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;message&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;ltr&quot;</span>&gt;</span>Saved<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;message&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;rtl&quot;</span>&gt;</span>تم الحفظ<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p>两条消息用的是同一个类。英文那条，色条在左边；阿拉伯语那条，色条自动跑到右边，文字也右对齐。</p>
<p>如果写的是 <code>border-left</code> 和 <code>text-align: left</code>，阿拉伯语那条的色条还在左边，在从右往左读的人看来就是在“结尾”，要另外写一套 <code>[dir=&quot;rtl&quot;]</code> 的覆盖样式。</p>
<h2>简写怎么读</h2>
<p><code>margin-inline: 0 auto</code> 两个值依次是开始和结束。<code>inset-inline: 0</code> 同时设置行内方向的两侧，横排时就是左右。<code>padding-block: 8px</code> 同时设置块方向的两侧，横排时就是上下。</p>
<p>容易误会的是 <code>margin: 1px 2px 3px 4px</code> 这种四个值的简写，它仍然是物理方向，上右下左，不会跟着书写方向变。</p>
<h2>哪些地方不用改</h2>
<p>和书写方向无关的视觉效果，可以继续用物理属性。比如阴影的偏移、背景图的位置、固定在屏幕右下角的悬浮按钮。</p>
<p>图标要不要镜像，看它的含义。箭头、返回按钮表示方向，通常要镜像；时钟、播放按钮不表示阅读方向，不镜像。需要翻转图标时用 <code>:dir(rtl)</code> 来写。</p>
<p><code>transform: translateX()</code> 没有逻辑版本，RTL 下要单独处理方向。</p>
<h2>常见追问</h2>
<p><strong>flex 和 grid 布局要不要改成逻辑写法？</strong></p>
<blockquote>
<p>不用。<code>flex-direction: row</code>、<code>justify-content: flex-start</code> 本来就跟着书写方向走，RTL 下会自动从右往左排。</p>
</blockquote>`};export{e as default};