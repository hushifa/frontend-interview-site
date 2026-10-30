var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如监控大屏要画一天的秒级数据，八万多个点一次 <code>setOption</code> 进去，页面会卡一下。ECharts 有几类配置专门处理这种情况。</p>
<p>第一类是少画一些。折线图开 <code>sampling: &#x27;lttb&#x27;</code>，数据点远多于像素时按算法挑点，保留趋势和极值；<code>dataZoom</code> 让图上只显示一段窗口，窗口外的数据被过滤掉。第二类是画得更省。散点图开 <code>large: true</code>，超过 <code>largeThreshold</code>（默认 2000）后走大数据优化，代价是不能再给单个数据项设样式。</p>
<p>第三类是分开画。<code>progressive</code> 让 ECharts 每帧只画一部分图形，分多帧画完，不会长时间堵住主线程；数据量超过 <code>progressiveThreshold</code> 时默认自动开启。数据大到几十 MB，可以用 <code>appendData</code> 分批追加，已经画好的部分不会清掉。</p>
<p>渲染器方面，官方手册的经验值是数据超过 1000 就推荐 Canvas，SVG 的优势是内存占用少、放大不模糊。还要注意 <code>appendData</code> 目前不支持用了 <code>dataset</code> 的系列，也只有散点图、<code>lines</code> 等少数系列支持增量渲染。</p>
</blockquote>
<h2>折线图点太多：用 sampling 降采样</h2>
<p>一条折线有十万个点，可图表只有一千多像素宽，大部分点画出来是叠在一起的。配置项文档对 <code>sampling</code> 的说明就是：数据量远大于像素大小时使用的降采样策略，开启后能提高性能；默认关闭，所有点都会画。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> option = {
  <span class="hljs-attr">xAxis</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;time&#x27;</span> },
  <span class="hljs-attr">yAxis</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;value&#x27;</span> },
  <span class="hljs-attr">series</span>: [{ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;line&#x27;</span>, <span class="hljs-attr">data</span>: points, <span class="hljs-attr">sampling</span>: <span class="hljs-string">&#x27;lttb&#x27;</span>, <span class="hljs-attr">showSymbol</span>: <span class="hljs-literal">false</span> }],
};
</code></pre></div>
<p><code>sampling</code> 可选的值决定怎样从一组点里挑出代表值。<code>&#x27;lttb&#x27;</code> 用 Largest-Triangle-Three-Bucket 算法筛点，文档说它能保留趋势和极值，所以画曲线时最常用。另外还有 <code>&#x27;average&#x27;</code>、<code>&#x27;min&#x27;</code>、<code>&#x27;max&#x27;</code>、<code>&#x27;sum&#x27;</code> 取平均、最小、最大和求和，以及 5.5.0 起新增的 <code>&#x27;minmax&#x27;</code>。</p>
<p>为什么不直接用 <code>&#x27;average&#x27;</code>？因为取平均会把尖峰抹平，监控曲线上最该看到的异常点可能就没了。要的是汇总量（比如每段的请求总数）时，才适合 <code>&#x27;sum&#x27;</code>。</p>
<h2>散点图点太多：用 large</h2>
<p>散点图没有“连成线”的概念，降采样就会丢点。它对应的配置是 <code>large</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> option = {
  <span class="hljs-attr">xAxis</span>: {},
  <span class="hljs-attr">yAxis</span>: {},
  <span class="hljs-attr">series</span>: [{ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;scatter&#x27;</span>, <span class="hljs-attr">data</span>: points, <span class="hljs-attr">large</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">largeThreshold</span>: <span class="hljs-number">2000</span> }],
};
</code></pre></div>
<p>文档说明，<code>large</code> 默认是 <code>false</code>，数据量大导致性能问题时可以打开；打开后数据量达到 <code>largeThreshold</code>（默认 2000）才启用优化。代价写得很清楚：开启以后，不能再单独给某个数据项设置样式。所以“某几个点要标红”这类需求，要拆成另一个系列来画。</p>
<h2>一次画不完：progressive 分帧渲染</h2>
<p>就算每个点画得很快，几十万个点一起画，主线程还是会被占住，页面这段时间没法响应点击。<code>progressive</code> 换了个思路：每一帧（约 16 毫秒）只画一部分。</p>
<p>文档对散点图的说明是，<code>progressive</code> 指定开启渐进渲染时一帧内渲染的图形数量，默认 400；ECharts 4 起支持渐进渲染，按帧一块一块地处理和渲染数据，避免阻塞浏览器的 UI 线程。数据量超过 <code>progressiveThreshold</code>（默认 3000）时会自动开启，设成 <code>progressive: 0</code> 则永久关闭。</p>
<p>所以大多数情况下不用手动开。要调的是两件事：觉得图出现得太慢，可以把每帧数量调大；出现“一块块冒出来”的效果不合适，比如截图导出，可以设成 0 关掉。</p>
<h2>只看一段：dataZoom 缩小显示范围</h2>
<p>用户其实很少同时看完整的十万个点，更常见的是先看全局、再放大某一段。<code>dataZoom</code> 组件就是做窗口的：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> option = {
  <span class="hljs-attr">dataZoom</span>: [{ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;inside&#x27;</span>, <span class="hljs-attr">start</span>: <span class="hljs-number">90</span>, <span class="hljs-attr">end</span>: <span class="hljs-number">100</span>, <span class="hljs-attr">filterMode</span>: <span class="hljs-string">&#x27;filter&#x27;</span> }],
  <span class="hljs-attr">xAxis</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;time&#x27;</span> },
  <span class="hljs-attr">yAxis</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;value&#x27;</span> },
  <span class="hljs-attr">series</span>: [{ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;line&#x27;</span>, <span class="hljs-attr">data</span>: points, <span class="hljs-attr">sampling</span>: <span class="hljs-string">&#x27;lttb&#x27;</span> }],
};
</code></pre></div>
<p><code>start</code> 和 <code>end</code> 是百分比，这里初始只显示最后 10%。<code>filterMode</code> 默认是 <code>&#x27;filter&#x27;</code>，文档说明窗口外的数据会被过滤掉，因此另一条轴会按过滤后的数据自动调整范围。</p>
<h2>数据太大一次传不完：appendData</h2>
<p>前面的配置都假设数据已经在内存里了。如果是地理数据这种动辄几十上百 MB 的，下载和解析本身就要很久。<code>echartsInstance.appendData</code> 用来分批追加：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">chart.<span class="hljs-title function_">appendData</span>({ <span class="hljs-attr">seriesIndex</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">data</span>: nextChunk });
</code></pre></div>
<p>文档说明，用 <code>appendData</code> 时已经渲染的图形不会被清掉，而是继续渲染新的图形。所以可以下载一块、追加一块，用户先看到一部分。</p>
<p>它有两个限制。第一，系列用了 <code>dataset</code> 时暂不支持 <code>appendData</code>。第二，不是所有系列都支持增量渲染，ECharts 本体只有散点图和 <code>lines</code>，echarts-gl 里有 <code>scatterGL</code>、<code>linesGL</code> 和 <code>polygons3D</code>。所以折线图不能靠它分批加载。</p>
<h2>Canvas 还是 SVG</h2>
<p><code>echarts.init</code> 的第三个参数里 <code>renderer</code> 可以是 <code>&#x27;canvas&#x27;</code> 或 <code>&#x27;svg&#x27;</code>，默认是 Canvas：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> chart = echarts.<span class="hljs-title function_">init</span>(dom, <span class="hljs-literal">null</span>, { <span class="hljs-attr">renderer</span>: <span class="hljs-string">&#x27;svg&#x27;</span> });
</code></pre></div>
<p>官方手册的建议是，图形元素多的图更适合 Canvas，比如热力图、大量数据的折线和散点；数据超过 1000（经验值）时总是推荐 Canvas。SVG 的优势是内存占用更少，这对移动端很重要，放大也不会模糊；如果低端 Android 上图表实例很多导致浏览器崩溃，换 SVG 可能更好。两者的通用差异见<a href="/questions/graphics-canvas-svg/">《Canvas 和 SVG 怎样选择？》</a>。</p>
<h2>常见追问</h2>
<p><strong>sampling 会不会让 tooltip 显示的值不准？</strong></p>
<blockquote>
<p>会有影响。降采样以后画出来的是挑出来的代表点，不是全部原始点，所以要精确查看某个时刻的值时，要用 <code>dataZoom</code> 放大，或者在交互上另外查原始数据。选 <code>&#x27;lttb&#x27;</code> 能保留趋势和极值，但它仍然是筛过的点。</p>
</blockquote>
<p><strong>开了 large 以后，为什么给单个点设置的颜色不生效了？</strong></p>
<blockquote>
<p>这是文档写明的代价，开启大数据优化后不能再单独定制数据项的样式。需要突出的点放到另一个不开 <code>large</code> 的系列里，叠加在上面。</p>
</blockquote>
<p><strong>progressive 和 appendData 有什么区别？</strong></p>
<blockquote>
<p><code>progressive</code> 解决的是“数据都在，但一次画不完”，ECharts 自己把绘制拆到多帧。<code>appendData</code> 解决的是“数据还没全拿到”，由应用分批把数据交给图表，已画的部分保留。</p>
</blockquote>`};export{e as default};