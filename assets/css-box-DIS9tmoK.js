var e={answerHtml:`<h2>简答</h2>
<ul>
<li>盒子从里到外是内容区、padding、border、margin。</li>
<li><code>content-box</code> 下 width 只给内容区，<code>border-box</code> 下 width 包含 padding 和 border，两者都不含 margin。</li>
<li><code>width: 100%</code> 再加 padding 容易溢出，改用 border-box 通常能解决。</li>
<li>常见全局约定是给 <code>*</code>、<code>::before</code>、<code>::after</code> 设 <code>box-sizing: border-box</code>，初始值仍是 content-box。</li>
</ul>
<p>一个元素写了 <code>width: 300px</code>，浏览器画出来却可能宽 342px。原因不一定是 width 没生效，而是声明的 300px 只分配给了内容区域，内边距和边框还需要额外占空间。</p>
<p>CSS 盒子从里到外可以分成内容区、padding、border、margin。<code>box-sizing</code> 决定 width、height 等尺寸约束主要针对哪一层盒子，并不会把这几层本身删除。</p>
<h2>用同一组数值算两遍</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;box content&quot;</span>&gt;</span>content-box<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;box border&quot;</span>&gt;</span>border-box<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.box</span> {
  <span class="hljs-attribute">width</span>: <span class="hljs-number">300px</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">20px</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#64748b</span>;
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">10px</span>;
}

<span class="hljs-selector-class">.content</span> {
  <span class="hljs-attribute">box-sizing</span>: content-box;
}

<span class="hljs-selector-class">.border</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
}
</code></pre></div>
<p>先限定为普通布局、没有其他最小最大宽度或 Flex 收缩的情况：</p>
<table><thead><tr><th>项目</th><th>content-box</th><th>border-box</th></tr></thead><tbody><tr><td>声明 width</td><td>300px</td><td>300px</td></tr><tr><td>内容区宽度</td><td>300px</td><td>258px</td></tr><tr><td>左右 padding 合计</td><td>40px</td><td>40px</td></tr><tr><td>左右 border 合计</td><td>2px</td><td>2px</td></tr><tr><td>border box 宽度</td><td>342px</td><td>300px</td></tr><tr><td>再计入左右 margin 后的水平占用</td><td>362px</td><td>320px</td></tr></tbody></table>
<p>content-box 下，<code>300 + 40 + 2 = 342</code>；border-box 下，先从 300 中扣掉 40 和 2，剩余 258 给内容。两种模式都没有把 margin 放进 width。</p>
<p>所以 border-box 更容易表达“这个组件包含边框和留白后，总共宽 300px”。它并不是没有 padding，而是把 padding 算在同一份宽度预算中。</p>
<h2>为什么 100% 加 padding 经常溢出</h2>
<p>一个普通块盒子写 <code>width: 100%</code> 时，百分比通常根据包含块的宽度计算。假设父级内容区为 500px，在 content-box 下，子级再加左右各 20px padding，就会至少需要 540px，加边框后还会更宽。</p>
<p>改为 border-box 后，500px 包含了 padding 和 border，通常能解决这一类溢出。常见的全局约定是：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css">*,
*<span class="hljs-selector-pseudo">::before</span>,
*<span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
}
</code></pre></div>
<p>伪元素也会生成盒子，所以一并设置可以减少装饰结构里的尺寸意外。box-sizing 的初始值是 content-box，不过浏览器默认样式可能已经为部分控件设置 border-box，不能假定所有元素最终计算值都与初始值相同。</p>
<p>普通非替换块在正常流中的 <code>width: auto</code>，本来就会结合 margin、padding、border 分配可用宽度。它和“明确写 100% 后再向外加 padding”不是同一个计算过程，因此并不是每个撑满父级的块都需要声明 width:100%。</p>
<h2>border-box 为什么仍然可能比 width 大</h2>
<p>内容区尺寸不能被减成负数。假设 <code>width: 10px</code>，左右 padding 已经共 40px，边框又共 2px，即使使用 border-box，浏览器也不能把内容区算成 -32px。内容区会以 0 为下限，最终盒子仍需要容纳这些内边距和边框。</p>
<p>此外，width 不总是最终使用宽度的唯一来源：</p>
<ul>
<li><code>min-width</code>、<code>max-width</code> 可以限制结果。</li>
<li>Flex 项可能增长、收缩，且自动最小尺寸受内容影响。</li>
<li>Grid 轨道分配和项目对齐会改变可用空间。</li>
<li>长文本、不换行内容和图片可能超出内容区，形成溢出，即便盒子自身宽度没变。</li>
</ul>
<p>因此“border-box 下最终一定等于 CSS 文件里的 width”仍然是过度概括。应区分盒子的布局尺寸变大，还是内容在固定盒子里面溢出。</p>
<h2>两列、间隙和测量还要另算</h2>
<p>两个 border-box 元素各写 width:50%，已经分完父级宽度；如果中间再加 gap 或外边距，仍然可能超出。border-box 不会自动从每个 50% 中扣除额外间隙。Grid 的 fr、Flex 的空间分配或明确的 calc 才负责这一层安排。</p>
<p>调试时看 DevTools 的盒模型和计算样式，而不只看规则中的 width。<code>getBoundingClientRect().width</code> 通常反映变换后的 border box 几何范围，包含 padding、border，但不包含 margin；如果有 scale 或 rotate，它也不能直接当成未变换时的内容宽度。</p>
<p>布局计算、绘制变换与滚动条也会影响不同 DOM 测量接口的结果。先说清自己要测哪一层盒子，再选择接口，才能避免把正常的盒模型差异误判成浏览器计算错误。</p>`};export{e as default};