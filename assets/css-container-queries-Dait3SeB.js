var e={answerHtml:`<h2>简答</h2>
<ul>
<li>媒体查询回答“视口多宽、设备能不能悬停、用户是否偏好深色”，适合页面骨架和全局偏好。</li>
<li>容器查询回答“我所在的容器多宽”，适合会被放进侧栏、主栏、弹窗等不同位置的组件。</li>
<li>容器要先用 <code>container-type: inline-size</code> 声明，查询的是最近的、满足条件的祖先容器，元素不能查询自己。</li>
<li><code>cqi</code>、<code>cqw</code> 等容器单位按容器尺寸计算，可用于字号和间距。</li>
<li>容器尺寸查询已被主流浏览器支持，可以直接使用。</li>
</ul>
<h2>示例</h2>
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
<p>同一个 <code>.card</code> 放在宽主栏里变为左右布局，放在窄侧栏里保持上下布局，不需要为每个位置写单独的类。</p>
<h2>container-type 的代价</h2>
<p><code>inline-size</code> 会给容器加上行内方向的尺寸包含：容器宽度不再由内容决定。容器本身如果是 <code>inline-block</code> 或浮动这类靠内容撑开的盒子，宽度可能变成 0。容器通常应该是宽度由外部决定的块。</p>
<p><code>size</code> 同时包含两个方向，容器高度也不再由内容撑开，必须显式给高度，所以较少使用。</p>
<h2>一起使用</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  * { <span class="hljs-attribute">transition</span>: none; }
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">width</span> &gt; <span class="hljs-number">1024px</span>) {
  <span class="hljs-selector-class">.layout</span> { <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">240px</span> <span class="hljs-number">1</span>fr; }
}
</code></pre></div>
<p>页面级的栏数、导航形态和用户偏好继续用媒体查询；栏里的组件用容器查询。打印、指针类型（<code>hover</code>、<code>pointer</code>）这类设备信息只能用媒体查询。</p>
<h2>常见追问</h2>
<ul>
<li>容器样式查询是什么？<code>@container style(--theme: dark)</code> 按祖先的自定义属性值切换样式，不依赖尺寸，见《容器样式查询怎样根据父级配置改变组件样式？》。</li>
</ul>`};export{e as default};