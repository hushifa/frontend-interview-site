var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Path2D 可以同时用于绘制和命中检测，保证几何只定义一次。</li>
<li>isPointInPath 的检测点不受当前变换矩阵再次变换，Path2D 则按当前变换参与测试，两者要用同一套坐标。</li>
<li>重叠对象按逆绘制顺序检测，第一个命中的可交互对象胜出。</li>
<li>对象很多时先用包围盒或空间索引粗筛，再做精确几何检测。</li>
</ul>
<p>Canvas 上看见十个图形，页面里通常仍只有一个 canvas 元素。浏览器不会自动把点击事件分发给“第三个圆”，应用需要根据保存的几何信息，判断点击位置属于哪个对象。</p>
<p>命中测试应先统一坐标，再筛选候选对象，最后按业务定义决定选谁。直接比较 event.clientX 与绘图坐标，往往会在页面滚动、CSS 缩放或高 DPI 下出错。</p>
<h2>Path2D 可以复用绘制几何</h2>
<p>下面在未缩放的内部坐标中创建圆形路径：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> canvas = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;canvas&#x27;</span>);
<span class="hljs-keyword">const</span> context = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
<span class="hljs-keyword">const</span> circle = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Path2D</span>();
circle.<span class="hljs-title function_">arc</span>(<span class="hljs-number">50</span>, <span class="hljs-number">50</span>, <span class="hljs-number">20</span>, <span class="hljs-number">0</span>, <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * <span class="hljs-number">2</span>);
context.<span class="hljs-title function_">fill</span>(circle);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(context.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">50</span>, <span class="hljs-number">50</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(context.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">80</span>, <span class="hljs-number">50</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>isPointInPath 检查填充区域，不是对最终像素颜色做检测。路径即使没有实际填充，也可以参与判断；透明度、遮挡和裁剪后的可见效果还需要业务额外考虑。</p>
<p>只画线的路径通常使用 isPointInStroke，结果会受到线宽、端点和连接方式等状态影响。可以为触摸交互设置比视觉线条更宽的命中范围，但应与相邻对象的选择规则协调。</p>
<h2>检测点不会自动套用当前矩阵</h2>
<p>isPointInPath 的 x、y 表示待检查点，参数本身不受当前变换矩阵再次变换。传入的 Path2D 则按当前上下文变换参与测试。两者混淆会导致“画在哪里”和“点哪里算命中”不一致。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">context.<span class="hljs-title function_">setTransform</span>(<span class="hljs-number">2</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>, <span class="hljs-number">2</span>, <span class="hljs-number">100</span>, <span class="hljs-number">0</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(context.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">200</span>, <span class="hljs-number">100</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(context.<span class="hljs-title function_">isPointInPath</span>(circle, <span class="hljs-number">50</span>, <span class="hljs-number">50</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>圆心从局部的 50、50 变到位图的 200、100。此时应传位图坐标；另一种可行做法是把点击点用逆矩阵转回局部坐标，再在单位矩阵下检测原始路径。不要同时反变换点又保留同一场景变换，让补偿发生两次。</p>
<p>client 坐标通常先减去 canvas 的内容区域位置，再按内部位图尺寸与显示尺寸之比换算。边框、内边距和复杂 CSS 变换需要单独处理，简单 getBoundingClientRect 比例不能覆盖所有情况。</p>
<h2>重叠对象通常从上往下找</h2>
<p>如果绘制顺序是背景、圆形、按钮，那么按钮在视觉上最上层。单选交互一般按逆绘制顺序测试，第一个命中的可交互对象胜出；否则可能点击按钮时选中了底下的大背景。</p>
<p>但透明图层、锁定对象、穿透操作或多选可能有不同规则。这些是业务语义，不是 isPointInPath 自动决定的。应在对象模型里记录是否可选和层级，而不是只根据像素可见性猜测。</p>
<p>填充路径存在孔洞时，还要使用与绘制一致的 nonzero 或 evenodd 规则。描边状态也应与目标对象一致，不能让上一个对象的 lineWidth 影响当前检测。</p>
<h2>对象很多时先做粗筛</h2>
<p>逐个复杂路径检测会随着对象数量增长。可以先检查包围盒，再用网格、四叉树等空间索引缩小候选，最后做精确几何检测。</p>
<p>包围盒通过不代表一定命中，例如圆的外接矩形四角不属于圆。相反，空间索引若没有随着对象移动、缩放或删除更新，会让正确图形根本进不了候选集合。</p>
<p>像素颜色拾取也是一种方法，但要维护独立绘制、处理抗锯齿和读回开销，跨源污染还可能禁止像素读取。它不是对所有场景都比几何检测简单。</p>
<p>最后，命中判断只回答“指针选中了什么”。拖动状态、捕获、取消以及键盘操作仍需另外实现。重要图形操作应有文字或普通控件入口，不能因为 Canvas 能点中就认为所有用户都能使用。</p>`};export{e as default};