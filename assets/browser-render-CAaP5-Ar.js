var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器拿到 HTML 以后，先把它解析成一棵节点树，叫 DOM；把 CSS 解析成样式规则，叫 CSSOM。两者合起来得到渲染树，然后算每个元素的位置和大小，这叫布局；再把文字、颜色画出来，这叫绘制；最后把各个图层叠在一起显示到屏幕上，这叫合成。</p>
<p>这个过程会被阻塞。CSS 会阻塞渲染，因为没有样式就不知道页面长什么样；没有 <code>async</code>、<code>defer</code> 或 <code>type=&quot;module&quot;</code> 的同步脚本会阻塞 HTML 解析。</p>
<p>为了少等，浏览器有个预加载扫描器，解析被阻塞时，它继续往后扫，提前请求后面的资源。</p>
<p>页面显示出来以后，改了布局相关的属性要重新布局；只改 <code>transform</code>、<code>opacity</code>，通常只需要合成，成本最低。</p>
</blockquote>
<h2>解析：为什么脚本会卡住页面</h2>
<p>HTML 解析器是边下载边解析的，DOM 一点点长出来。遇到外链样式表，浏览器去下载，再解析成 CSSOM。DOM 可以增量构建，CSSOM 却要等样式表完整解析完，因为后面的规则可能覆盖前面的规则。</p>
<p>遇到同步的 <code>&lt;script&gt;</code>，解析器就停下来，等脚本下载并执行完再继续。为什么要停？因为脚本可能用 <code>document.write</code> 改 HTML，也可能读样式。又因为脚本可能读样式，它前面的样式表也得先加载完。所以就有了这句话：“CSS 阻塞脚本执行，脚本阻塞 HTML 解析”。</p>
<p>解析停下来的时候，预加载扫描器（preload scanner）会继续往后扫标记，提前请求图片、脚本和样式。可是用 JavaScript 动态插入的资源它看不到。所以关键资源应该直接写在 HTML 里，或者用 <code>&lt;link rel=&quot;preload&quot;&gt;</code> 声明。</p>
<h2>渲染树之后还有哪几步</h2>
<p>渲染树只包含要显示的节点。<code>display: none</code> 的元素不进入渲染树；<code>visibility: hidden</code> 的元素会进入，还占着位置，只是看不见。</p>
<p>接着是布局（Layout，也叫 Reflow），算出每个盒子的位置和尺寸。然后是绘制（Paint），把文字、颜色、边框、阴影记录成绘制指令，按图层分别绘制。最后是合成（Composite），合成线程把各个图层按顺序叠起来输出到屏幕。</p>
<p>页面显示以后再改样式，要走哪几步取决于改了什么。改几何属性，比如宽高、边距、字体大小，要重新布局；只改颜色、背景，需要重绘；只改 <code>transform</code>、<code>opacity</code>，而且元素已经在独立图层上，就可以只在合成线程完成，不占用主线程。</p>
<h2>script 的几种加载方式</h2>
<table><thead><tr><th>写法</th><th>下载</th><th>执行时机</th></tr></thead><tbody><tr><td><code>&lt;script&gt;</code></td><td>阻塞解析</td><td>下载完立即执行</td></tr><tr><td><code>async</code></td><td>并行</td><td>下载完立即执行，顺序不保证</td></tr><tr><td><code>defer</code></td><td>并行</td><td>HTML 解析完成后、<code>DOMContentLoaded</code> 之前按顺序执行</td></tr><tr><td><code>type=&quot;module&quot;</code></td><td>并行</td><td>默认同 <code>defer</code></td></tr></tbody></table>
<p><code>async</code> 和 <code>defer</code> 都不阻塞解析，区别在执行时机。<code>async</code> 下载完就执行，几个脚本谁先下载完谁先跑；<code>defer</code> 等 HTML 解析完，再按书写顺序执行。脚本之间有依赖时用 <code>defer</code>。</p>
<h2>常见追问</h2>
<p><strong><code>DOMContentLoaded</code> 和 <code>load</code> 有什么区别？</strong></p>
<blockquote>
<p><code>DOMContentLoaded</code> 在 HTML 解析完、<code>defer</code> 脚本执行完以后触发。<code>load</code> 还要等图片、样式这些子资源全部加载完，所以更晚。</p>
</blockquote>
<p><strong>为什么以前要把 <code>&lt;script&gt;</code> 放在 <code>body</code> 末尾？</strong></p>
<blockquote>
<p>为了不阻塞前面内容的解析，让页面先显示出来。现在更推荐在 <code>head</code> 里用 <code>defer</code>，既不阻塞解析，又能尽早开始下载。</p>
</blockquote>`};export{e as default};