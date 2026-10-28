var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>content-visibility: auto</code> 让浏览器跳过屏幕外内容的部分渲染工作，DOM 和应用状态仍然保留。</li>
<li>要配合 <code>contain-intrinsic-block-size: auto &lt;估计值&gt;</code> 提供占位尺寸，减少滚动条和布局跳动。</li>
<li>它不会停止脚本、计时器、订阅或网络请求；上万行的数据表仍应考虑真正的虚拟化。</li>
<li><code>hidden</code> 值持续跳过内容且不会按用户相关性自动恢复，不是 <code>auto</code> 的另一种写法。</li>
</ul>
<p>一篇很长的文章可能有几十个章节。用户打开页面时只看到第一屏，但浏览器通常还需要为后面的内容做很多布局与绘制准备。<code>content-visibility: auto</code> 给浏览器一个机会：当某段内容暂时与用户无关时，可以跳过它的一部分后代渲染工作，等接近需要时再处理。</p>
<p>它优化的是浏览器渲染成本，<strong>不是把内容从应用中卸载</strong>。这一区别决定了它适合哪些页面，以及为什么有时加上属性后，脚本执行和内存占用并没有明显下降。</p>
<h2>给长文档的章节建立渲染边界</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;chapter&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>浏览器缓存<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>这里是实际的章节正文，可以包含多段解释、图片和示例。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.chapter</span> {
  <span class="hljs-attribute">content-visibility</span>: auto;
  <span class="hljs-attribute">contain-intrinsic-block-size</span>: auto <span class="hljs-number">36rem</span>;
}

<span class="hljs-keyword">@media</span> print {
  <span class="hljs-selector-class">.chapter</span> {
    <span class="hljs-attribute">content-visibility</span>: visible;
    <span class="hljs-attribute">contain-intrinsic-block-size</span>: none;
  }
}
</code></pre></div>
<p>适合把这种样式应用到有一定体量的多个章节，而不是每一个 span 都单独设置，也不是只给整页最大的根容器设置后就期待里面每个小块都独立跳过。</p>
<p>浏览器决定内容何时与用户相关，包括可见性、焦点、查找定位等因素。不能假设它严格在“距离视口 0px”这一刻才开始渲染，也不能依赖一个跨浏览器固定的预渲染距离。</p>
<h2>为什么还要给一个估计高度</h2>
<p>如果内容被跳过后没有合适尺寸，页面可能暂时低估它占据的空间，滚动条、后续章节位置都会不稳定。contain-intrinsic-block-size 提供块方向上的占位尺寸信息，在常见横排布局中对应高度方向。</p>
<p><code>auto 36rem</code> 中的 36rem 是还没有可用记忆尺寸时的后备估计；auto 允许在适用情况下使用浏览器记住的实际内容尺寸。它不是把整个章节永久固定成 36rem 高，也不限制真实内容只能占这个高度。</p>
<p>选择块轴长属性，是因为常见长文章主要需要估计章节高度，不必同时给两个轴都安排相同的估计值。若使用 contain-intrinsic-size 简写，应理解各个值怎样映射到尺寸，不能把它当成普通的 margin 简写。</p>
<p>估计值越接近该类章节的实际大小，首次展开时越不容易出现明显偏移。极短与极长章节共用一个随意的大数字，可能让滚动位置变化更明显。图片仍应预留自身比例，异步插入的内容仍可能改变尺寸，这些不会由该属性自动解决。</p>
<h2>三种处理方式，保留的东西不同</h2>
<table><thead><tr><th>方式</th><th>DOM 与应用状态</th><th>主要代价与能力</th></tr></thead><tbody><tr><td><code>content-visibility: auto</code></td><td>仍然保留</td><td>浏览器可跳过部分后代渲染，内容仍可参与查找和相关访问流程</td></tr><tr><td><code>display: none</code></td><td>DOM 仍在，但对应子树不生成正常显示盒</td><td>内容不作为当前可见交互区域；脚本并不会因此自动停止</td></tr><tr><td>虚拟列表卸载部分节点</td><td>取决于列表实现，部分 DOM 不存在</td><td>可以减少 DOM 规模，但需另行处理占位、焦点、搜索和状态恢复</td></tr></tbody></table>
<p>对于有上万行、每行都挂着大量节点和订阅的数据表，仅减少绘制可能远远不够，真正的虚拟化更合适。对于需要整篇正文可被查找、链接定位、辅助技术访问的文章，保留 DOM 的浏览器渲染优化则可能更容易接入。</p>
<p><code>content-visibility: hidden</code> 也不是 auto 的另一种拼写。hidden 持续跳过后代内容显示，不会按同样的用户相关性自动恢复，访问性行为也不同；元素本身的盒子及占位还要结合尺寸约束判断。不要为了省资源就把本应可读的章节设成 hidden。</p>
<h2>哪些工作不会自动停下来</h2>
<p>元素仍在 DOM 中，React 等框架的状态更新、事件监听、计时器、WebSocket 订阅和业务计算不会仅因该 CSS 自动取消。已经启动的网络请求也不会自动中止，图片是否延迟加载仍需要结合 loading 等机制。</p>
<p>Canvas 绘制循环尤其容易被误解：浏览器暂时不显示后代，并不意味着应用自己每帧运行的绘图 JavaScript 也停了。支持相应事件的环境可以通过 contentvisibilityautostatechange 及其 skipped 状态感知跳过状态，再由应用明确暂停或恢复不必要的绘制；这需要另外实现资源生命周期。</p>
<h2>主动测量可能把省掉的工作又要回来</h2>
<p>如果脚本不断读取被跳过后代的精确几何信息，浏览器为了回答这些问题，可能不得不执行原本推迟的布局。一个页面一边希望延后离屏内容渲染，一边每次滚动又测量全部后代，优化收益就可能被抵消。</p>
<p>应先确认是否真的需要那些读数，能否改为测量章节外层、利用观察器或在内容进入工作范围后再处理。不能简单把所有 getBoundingClientRect 调用都判成错误，但要理解它与延后布局之间的成本关系。</p>
<h2>验证不能只看第一屏更快了</h2>
<p>content-visibility:auto 的内容仍应对用户查找、焦点导航和辅助技术保持可用，不应为性能给整章附加 aria-hidden。页面中原本就有条件隐藏的元素，应继续保持它们正确的语义，而不是把“离屏”统一当成“无须访问”。</p>
<p>实际验收应覆盖锚点跳转、浏览器查找、Tab 导航、返回原滚动位置与打印。示例在打印时显式恢复 visible，是为了让打印路径清楚地面对完整内容；仍应检查真实分页结果。</p>
<p>性能上比较改动前后的 Layout、Paint、主线程工作和内存，再观察首次滚到后面章节时是否卡顿、占位是否明显跳动。它能把部分工作推迟到需要时，但不会让全部工作消失；合理的边界与尺寸估计，决定了这笔推迟是否值得。</p>`};export{e as default};