var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>媒体查询问的是“整个视口多宽、设备能不能悬停、用户是不是偏好深色”，适合决定页面骨架和全局偏好。</p>
<p>容器查询问的是“我所在的这个容器多宽”。一张卡片可能放在宽的主栏里，也可能放在窄的侧栏里，视口宽度一样，卡片能用的空间却不一样，这时就该用容器查询。</p>
<p>用之前要先给祖先元素写 <code>container-type: inline-size</code>，把它声明成容器。查询找的是最近的、符合条件的祖先容器，元素不能查询自己。另外还有 <code>cqi</code>、<code>cqw</code> 这类容器单位，按容器尺寸算，可以用在字号和间距上。</p>
<p>容器尺寸查询主流浏览器都支持了，可以直接用。要注意的是声明容器有代价，容器的宽度不再由内容撑开。</p>
</blockquote>
<h2>同一张卡片，在不同位置自动换布局</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card-slot</span> {
  <span class="hljs-attribute">container</span>: card / inline-size;
}

<span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">12px</span>;
}

<span class="hljs-keyword">@container</span> card (inline-size &gt; <span class="hljs-number">480px</span>) {
  <span class="hljs-selector-class">.card</span> {
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">160px</span> <span class="hljs-number">1</span>fr;
  }
}
</code></pre></div>
<p><code>.card-slot</code> 被声明成名叫 <code>card</code> 的容器。容器宽度超过 480px 时，卡片变成左边图片、右边文字的两列；不到 480px 就保持上下排列。</p>
<p>把同一个 <code>.card</code> 放进宽主栏，它是左右布局；放进窄侧栏，它是上下布局。不用为每个位置单独写一个类，组件自己根据空间做决定。</p>
<h2>为什么声明成容器后，宽度变成了 0</h2>
<p><code>container-type: inline-size</code> 会给容器加上一个限制，叫尺寸包含：容器在行内方向（横排文字时就是宽度）的尺寸不再由里面的内容决定。浏览器要先知道容器多宽，才能判断里面的查询，所以不能再反过来让内容撑开它。</p>
<p>所以容器如果本来是 <code>inline-block</code> 或浮动这类靠内容撑开宽度的盒子，宽度就可能变成 0。容器最好是一个宽度由外面决定的普通块。</p>
<p><code>container-type: size</code> 把两个方向都包含了，容器高度也不再由内容撑开，必须明确写高度，所以用得比较少。</p>
<h2>两种查询怎么一起用</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  * { <span class="hljs-attribute">transition</span>: none; }
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">width</span> &gt; <span class="hljs-number">1024px</span>) {
  <span class="hljs-selector-class">.layout</span> { <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">240px</span> <span class="hljs-number">1</span>fr; }
}
</code></pre></div>
<p>页面分几栏、导航长什么样、用户有什么偏好，继续交给媒体查询。栏里面的组件，交给容器查询。</p>
<p>还有一些信息只有媒体查询能拿到，比如是否在打印，以及指针类型 <code>hover</code>、<code>pointer</code>。这些跟容器没关系，是设备的属性。</p>
<h2>常见追问</h2>
<p><strong>容器样式查询又是什么？</strong></p>
<blockquote>
<p>它不看尺寸，看祖先上自定义属性的值。比如 <code>@container style(--theme: dark)</code>，父级设置了 <code>--theme: dark</code>，里面的组件就切换样式。详见<a href="/questions/css-container-style-query/">《容器样式查询怎样根据父级配置改变组件样式？》</a>。</p>
</blockquote>`};export{e as default};