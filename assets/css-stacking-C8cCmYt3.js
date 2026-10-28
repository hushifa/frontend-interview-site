var e={answerHtml:`<h2>简答</h2>
<ul>
<li>层叠上下文像一个整体图层：内部元素先在里面排序，再作为一个整体和外部兄弟比较。</li>
<li>创建层叠上下文的常见条件：定位元素加非 <code>auto</code> 的 <code>z-index</code>、<code>opacity</code> 小于 1、<code>transform</code>、<code>filter</code>、<code>isolation: isolate</code>、flex/grid 项目加 <code>z-index</code>、<code>position: fixed</code> 或 <code>sticky</code>。</li>
<li>父元素 <code>z-index: 1</code>、旁边元素 <code>z-index: 2</code> 时，子元素写 <code>z-index: 9999</code> 也只能在父元素内部最高。</li>
<li><code>z-index</code> 只对定位元素、flex 项目和 grid 项目生效，普通静态块写了没用。</li>
<li>元素被裁剪时问题可能是祖先的 <code>overflow</code>，和 z-index 无关。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">header</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;position: relative; z-index: 1&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;dropdown&quot;</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;position: absolute; z-index: 9999&quot;</span>&gt;</span>菜单<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">header</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">main</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;position: relative; z-index: 2&quot;</span>&gt;</span>内容<span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>
</code></pre></div>
<p><code>.dropdown</code> 和 <code>main</code> 不在同一个上下文里比较，比较的是 <code>header</code>（1）和 <code>main</code>（2），所以菜单被内容盖住。</p>
<p>修复方式：</p>
<ul>
<li>提高 <code>header</code> 的 <code>z-index</code>，让它整体排在 <code>main</code> 之上。</li>
<li>去掉 <code>main</code> 不必要的 <code>z-index</code>，让它不再创建上下文。</li>
<li>把下拉菜单渲染到更外层，或使用 popover，它进入顶层（top layer），排在所有层叠上下文之上。</li>
</ul>
<h2>上下文内的绘制顺序</h2>
<p>同一层叠上下文里，从下到上依次是：上下文根的背景和边框 → 负 <code>z-index</code> 的子上下文 → 普通块 → 浮动 → 行内内容 → <code>z-index: auto</code> 或 0 的定位元素 → 正 <code>z-index</code> 的子上下文。</p>
<h2>排查</h2>
<ul>
<li>从被遮挡的元素往上找，看哪个祖先创建了层叠上下文。浏览器开发者工具的 3D View 或 Layers 面板可以直接看到层次。</li>
<li>检查祖先的 <code>overflow: hidden</code>，元素可能被裁剪而不是被覆盖。</li>
<li>用 <code>isolation: isolate</code> 主动为组件创建上下文，组件内部的 z-index 就不会和外部冲突。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样管理项目里的 z-index？用少量具名的层级变量（如 <code>--z-dropdown</code>、<code>--z-modal</code>），弹层尽量使用 dialog 和 popover。</li>
</ul>`};export{e as default};