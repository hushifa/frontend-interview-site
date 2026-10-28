var e={answerHtml:`<h2>简答</h2>
<ul>
<li>主流程是：解析 HTML 得到 DOM，解析 CSS 得到 CSSOM，两者合成渲染树，再经过布局、绘制和合成显示到屏幕。</li>
<li>CSS 会阻塞渲染；没有 <code>async</code>、<code>defer</code> 或 <code>type=&quot;module&quot;</code> 的同步脚本会阻塞 HTML 解析。</li>
<li>预加载扫描器会在解析被阻塞时提前发现后续资源并发起请求。</li>
<li>修改布局属性会重新触发布局，只改 <code>transform</code>、<code>opacity</code> 通常只需要合成。</li>
</ul>
<h2>解析：DOM 与 CSSOM</h2>
<p>HTML 解析器边下载边解析，生成 DOM。遇到外链样式表时，浏览器下载并解析成 CSSOM。DOM 可以增量构建，CSSOM 要等样式表完整解析，因为后面的规则可能覆盖前面的规则。</p>
<p>遇到同步 <code>&lt;script&gt;</code> 时，解析器暂停，等脚本下载并执行完再继续。脚本可能读取样式，所以它前面的样式表也要先加载完。这就是&quot;CSS 阻塞脚本执行，脚本阻塞 HTML 解析&quot;。</p>
<p>解析暂停期间，预加载扫描器（preload scanner）继续扫描后面的标记，提前请求图片、脚本和样式。用 JavaScript 动态插入的资源扫描器看不到，所以关键资源应写在 HTML 里，或用 <code>&lt;link rel=&quot;preload&quot;&gt;</code> 声明。</p>
<h2>渲染树、布局、绘制、合成</h2>
<ol>
<li><strong>渲染树</strong>：只包含要显示的节点。<code>display: none</code> 的元素不进入渲染树，<code>visibility: hidden</code> 的元素会进入并占位。</li>
<li><strong>布局（Layout/Reflow）</strong>：计算每个盒子的位置和尺寸。</li>
<li><strong>绘制（Paint）</strong>：把文字、颜色、边框、阴影等记录成绘制指令，按图层分别绘制。</li>
<li><strong>合成（Composite）</strong>：合成线程把各图层按顺序叠加并输出到屏幕。</li>
</ol>
<p>首次渲染后，改变几何属性（宽高、边距、字体大小）要重新布局；只改颜色、背景需要重绘；只改 <code>transform</code>、<code>opacity</code> 且元素已在独立图层上时，可以只在合成线程完成，不占用主线程。</p>
<h2>脚本加载方式</h2>
<table><thead><tr><th>写法</th><th>下载</th><th>执行时机</th></tr></thead><tbody><tr><td><code>&lt;script&gt;</code></td><td>阻塞解析</td><td>下载完立即执行</td></tr><tr><td><code>async</code></td><td>并行</td><td>下载完立即执行，顺序不保证</td></tr><tr><td><code>defer</code></td><td>并行</td><td>HTML 解析完成后、<code>DOMContentLoaded</code> 之前按顺序执行</td></tr><tr><td><code>type=&quot;module&quot;</code></td><td>并行</td><td>默认同 <code>defer</code></td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li><code>DOMContentLoaded</code> 和 <code>load</code> 的区别：前者在 HTML 解析完且 defer 脚本执行后触发，后者等图片、样式等子资源全部加载完。</li>
<li>为什么把 <code>&lt;script&gt;</code> 放在 <code>body</code> 末尾：避免阻塞前面内容的解析，现在更推荐 <code>defer</code>。</li>
</ul>`};export{e as default};