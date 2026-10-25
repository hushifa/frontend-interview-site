var e={answerHtml:`<p>给正文开头加一条装饰线，中文页面通常会写 <code>border-left</code>。页面翻译成阿拉伯语后，正文从右向左阅读，装饰线往往也应移到右边。若一直使用物理方向，就要为 RTL 再写一套覆盖规则。</p>
<p>逻辑属性允许直接表达“正文起始侧的边框”：<code>border-inline-start</code>。浏览器再根据元素的书写模式和文字方向，决定这条边实际位于左边、右边，还是竖排时的上边或下边。</p>
<h3>inline 和 block 到底指哪两个方向</h3>
<p><code>inline</code> 是一行文字延伸的轴，<code>block</code> 是一行接一行、一个段落接一个段落堆叠的轴。这两个词描述的是方向，和元素是否写了 <code>display: inline</code> 或 <code>display: block</code> 不是一回事。</p>
<p><code>writing-mode</code> 决定横排还是竖排等书写模式，<code>direction</code> 决定相应的行内文字方向。下面列出三种明确设置下的映射：</p>
<table><thead><tr><th>模式</th><th>inline-start</th><th>inline-end</th><th>block-start</th><th>block-end</th></tr></thead><tbody><tr><td><code>horizontal-tb</code>、<code>ltr</code></td><td>左</td><td>右</td><td>上</td><td>下</td></tr><tr><td><code>horizontal-tb</code>、<code>rtl</code></td><td>右</td><td>左</td><td>上</td><td>下</td></tr><tr><td><code>vertical-rl</code>、<code>ltr</code></td><td>上</td><td>下</td><td>右</td><td>左</td></tr></tbody></table>
<p>因此不能永远把 <code>inline</code> 翻译成“水平”、把 <code>block</code> 翻译成“垂直”。在 <code>vertical-rl</code> 中，每一列文字沿纵向排列，下一列在前一列左侧。</p>
<h3>同一份样式服务不同阅读方向</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;note&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;ltr&quot;</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;zh-CN&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>学习安排<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>每天阅读一个专题，再用小例子验证理解。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;note&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;rtl&quot;</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;ar&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>خطة التعلم<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>اقرأ موضوعًا كل يوم.<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.note</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
  <span class="hljs-attribute">max-inline-size</span>: <span class="hljs-number">40rem</span>;
  <span class="hljs-attribute">margin-inline</span>: auto;
  <span class="hljs-attribute">margin-block</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">padding-block</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">padding-inline</span>: <span class="hljs-number">1.5rem</span>;
  <span class="hljs-attribute">border-inline-start</span>: <span class="hljs-number">4px</span> solid <span class="hljs-number">#2563eb</span>;
  <span class="hljs-attribute">text-align</span>: start;
}

<span class="hljs-selector-class">.note</span> <span class="hljs-selector-tag">h2</span> {
  <span class="hljs-attribute">margin-block</span>: <span class="hljs-number">0</span> <span class="hljs-number">0.5rem</span>;
}

<span class="hljs-selector-class">.note</span> <span class="hljs-selector-tag">p</span> {
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<p>第一块内容的装饰线在左侧，第二块在右侧；<code>text-align: start</code> 也随文字方向对齐到开头。对 HTML 内容，应优先用 <code>dir</code> 属性表达方向，用 <code>lang</code> 表达语言。<code>lang=&quot;ar&quot;</code> 本身不会自动替你设置整个布局的 <code>dir=&quot;rtl&quot;</code>。</p>
<p><code>padding-inline</code> 同时控制行内两侧，<code>padding-block</code> 控制块方向两侧。需要两侧不同值时，像 <code>padding-inline: 1rem 2rem</code> 这样的顺序是 start、end，不是固定的左、右。</p>
<h3>常见属性怎样对应</h3>
<p>横排从左到右时，可以用下面的对应关系帮助理解，但写完后要记得它们会随书写模式变化：</p>
<table><thead><tr><th>物理写法</th><th>对应的逻辑表达</th></tr></thead><tbody><tr><td><code>width</code>、<code>height</code></td><td><code>inline-size</code>、<code>block-size</code></td></tr><tr><td><code>min-width</code>、<code>max-width</code></td><td><code>min-inline-size</code>、<code>max-inline-size</code></td></tr><tr><td><code>margin-left</code></td><td><code>margin-inline-start</code></td></tr><tr><td><code>padding-top</code></td><td><code>padding-block-start</code></td></tr><tr><td><code>right</code></td><td><code>inset-inline-end</code></td></tr><tr><td><code>text-align: left</code></td><td><code>text-align: start</code></td></tr></tbody></table>
<p><code>inset-inline-end</code> 仍然是定位偏移属性，需要配合 <code>position</code> 等布局条件使用；换了名字不会让普通流元素自动移动。<code>inline-size</code> 也仍然受 <code>box-sizing</code>、最小最大尺寸、Flex/Grid 等规则影响，不是绕过盒模型的新尺寸单位。</p>
<h3>为什么不应该机械替换所有 left 和 right</h3>
<p>逻辑方向适合表达阅读与内容流相关的设计：正文缩进、列表间距、按钮旁的说明、侧边栏起始侧边框等。某个图像热点必须固定在图片物理左上角，或者画布坐标确实以屏幕左上角为原点，就仍然可能适合物理属性。</p>
<p>逻辑属性也不会自动镜像所有东西。<code>translateX()</code> 中的 X 是物理横轴，背景位置、渐变角度、某些图标方向等还需按语义单独处理。前进后退箭头可能需要随阅读方向调整，但播放、时钟或品牌标志通常不能无脑翻转。</p>
<p>不要为了 RTL 再随意加 <code>row-reverse</code> 或大量 <code>order</code>。Flex 的 <code>row</code> 本来就沿行内轴排列，已经受 <code>direction</code> 影响；再反转一次可能抵消需要的效果。视觉顺序变化还可能与 DOM 阅读顺序和键盘焦点顺序不一致。</p>
<p>最后，物理属性和逻辑属性有机会映射到同一条边。例如横排 LTR 下同时设置 <code>margin-left</code> 和 <code>margin-inline-start</code>，它们会按层叠规则竞争，并不是逻辑属性天然更优先。迁移时应移除不再需要的旧声明，在 LTR、RTL 以及实际支持的竖排模式下分别核对。</p>`};export{e as default};