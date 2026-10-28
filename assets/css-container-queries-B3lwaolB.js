var e={answerHtml:`<h2>简答</h2>
<ul>
<li>媒体查询看页面环境（视口、打印、用户偏好），容器查询看组件实际获得了多少空间。</li>
<li><code>container-type: inline-size</code> 建立行内轴尺寸查询容器，单写 <code>container-name</code> 不会建立。</li>
<li>查询的尺寸来自祖先，规则作用于里面的元素，所以需要一个从布局获得宽度的外层容器，避免循环依赖。</li>
<li>不要随手用 <code>container-type: size</code>，它会对两个轴都施加尺寸包含。</li>
</ul>
<p>假设一张课程卡片会同时出现在首页主栏和右侧推荐栏。电脑屏幕很宽，但右侧推荐栏仍然很窄。如果只写 <code>@media (min-width: 60rem)</code>，两处卡片都会采用“大屏布局”，推荐栏中的图片和文字就可能挤在一起。</p>
<p><strong>媒体查询知道页面所处的环境，容器查询知道组件获得了多少空间。</strong> 选择哪一种，要看影响设计的因素来自哪里。</p>
<h2>页面环境交给媒体查询</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.page</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">2rem</span>;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">min-width</span>: <span class="hljs-number">60rem</span>) {
  <span class="hljs-selector-class">.page</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr) <span class="hljs-number">18rem</span>;
  }
}
</code></pre></div>
<p>这段规则表示：视口达到一定宽度，页面才分成主栏和侧栏。对于屏幕媒体，<code>width</code> 查询的是视口宽度，并不是显示器的物理宽度。</p>
<p>媒体查询也不只管宽度。打印用 <code>@media print</code>，减少动画可查询 <code>prefers-reduced-motion</code>，深色偏好可查询 <code>prefers-color-scheme</code>。这些都不是某个卡片容器的尺寸，仍然应使用媒体查询。</p>
<h2>组件内部根据容器改变排版</h2>
<p>下面的卡片默认上下排列；外层容器足够宽时，图片和正文才左右排列。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;course-slot&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;course-card&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;course-cover&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/course.webp&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;&quot;</span> /&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;course-body&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>浏览器渲染原理<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>从 HTML 解析到布局与绘制，理解页面如何显示出来。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.course-slot</span> {
  <span class="hljs-attribute">container-type</span>: inline-size;
  <span class="hljs-attribute">container-name</span>: course;
}

<span class="hljs-selector-class">.course-card</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-selector-class">.course-cover</span> {
  <span class="hljs-attribute">display</span>: block;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">100%</span>;
  <span class="hljs-attribute">height</span>: auto;
}

<span class="hljs-selector-class">.course-body</span> {
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
}

<span class="hljs-keyword">@container</span> course (<span class="hljs-attribute">min-width</span>: <span class="hljs-number">32rem</span>) {
  <span class="hljs-selector-class">.course-card</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">10rem</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  }
}
</code></pre></div>
<p>这里的 <code>32rem</code> 判断的是名为 <code>course</code> 的查询容器宽度，不是整个视口。主栏和侧栏各放一份这段结构，就能在同一个屏幕上出现不同的卡片排版。图片路径需要换成项目实际提供的文件，图片本身不影响查询机制。</p>
<p><code>container-type: inline-size</code> 建立行内轴尺寸查询容器。在通常的横排文本中，行内轴对应水平方向。<code>container-name</code> 只给容器命名，<strong>单独写名字不能建立尺寸查询所需的包含关系</strong>。也可以把两行合成 <code>container: course / inline-size</code>。</p>
<p>不写容器名时，浏览器会为目标元素寻找最近的、支持所查询尺寸特征的祖先容器。命名可以避免组件嵌套后误用内层容器；但名字不是全局 ID，多个区域可以使用同一个容器名。</p>
<h2>为什么需要额外的外层容器</h2>
<p>查询的尺寸来自祖先，规则影响里面的元素。如果让一张卡片因为“自己很宽”而变窄，又因为“自己变窄”而变宽，就会产生循环依赖。尺寸包含会限制后代内容对容器相应内在尺寸的影响，让浏览器能够确定布局。</p>
<p>因此应让 <code>.course-slot</code> 从页面的 Grid、Flex 或正常流获得宽度，再让内部卡片适配它。不要为了查高度随手改成 <code>container-type: size</code>：这会引入两个轴的尺寸包含，如果容器原本完全依靠内容撑高，又没有其他尺寸安排，可能得到意外的高度。</p>
<p>实现时保留可用的基础单列布局。旧环境忽略容器查询时，用户仍然能阅读内容；支持查询的环境再增强布局。媒体查询与容器查询可以同时生效，前者决定页面怎么分配区域，后者决定组件如何利用分到的空间。</p>`};export{e as default};