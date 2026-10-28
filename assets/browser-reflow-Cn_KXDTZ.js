var e={answerHtml:`<h2>简答</h2>
<ul>
<li>修改样式让布局失效后立即读取尺寸，会迫使浏览器同步执行布局，这就是强制同步布局。</li>
<li>在循环里交替读写尺寸会反复触发布局，形成布局抖动。</li>
<li>先批量读取、再批量写入可以避免抖动，但要保持原有业务语义。</li>
<li>requestAnimationFrame 只改变执行时机，不会自动隔离读写；减少需要布局的工作同样有效。</li>
</ul>
<p>给元素设置新宽度后，浏览器通常不必立刻重新计算页面上所有受影响的位置，可以先记下变化，把多个修改合并处理。但如果 JavaScript 下一句就要求“现在这个元素到底多宽”，而现有布局结果已经失效，浏览器为了返回正确答案，就可能必须马上计算布局。</p>
<p>这就是强制同步布局：<strong>脚本中的读取，迫使本来可以稍后完成的布局在当前同步执行过程中发生。</strong></p>
<p>布局本身是正常渲染工作，不是错误。真正容易拖慢页面的是反复“修改 → 强制求新结果 → 再修改 → 再求结果”，让一轮更新出现许多次本可合并的布局，也就是布局抖动。</p>
<h2>一组卡片为什么会触发多次布局</h2>
<p>假设卡片使用确定的 border-box 宽度，且各卡片的宽度不依赖前一张卡片的更新：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">120px</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">12px</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid;
}
</code></pre></div>
<p>把每张卡片增宽 10px，可以写成下面这样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">widenOneByOne</span>(<span class="hljs-params">cards</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> card <span class="hljs-keyword">of</span> cards) {
    card.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${card.offsetWidth + <span class="hljs-number">10</span>}</span>px\`</span>;
  }
}
</code></pre></div>
<p>单看一轮循环，是先读再写；问题出在相邻两轮之间：上一张刚写完宽度，下一张又读取 <code>offsetWidth</code>。如果浏览器需要更新受影响的布局才能返回新结果，就会在循环中反复计算。</p>
<p>更合适的实现是先读完，再统一写：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">widenTogether</span>(<span class="hljs-params">cards</span>) {
  <span class="hljs-keyword">const</span> elements = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(cards);
  <span class="hljs-keyword">const</span> widths = elements.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">card</span>) =&gt;</span> card.<span class="hljs-property">offsetWidth</span>);

  elements.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">card, index</span>) =&gt;</span> {
    card.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${widths[index] + <span class="hljs-number">10</span>}</span>px\`</span>;
  });
}
</code></pre></div>
<p>调用时传入实际卡片集合，例如 <code>document.querySelectorAll(&#x27;.card&#x27;)</code>。在上面的 CSS 条件下，两种写法都把每张卡片的宽度从 120px 改为 130px；第二种避免在这组写入之间反复要求新的几何结果。</p>
<p>第一次读取前若本来已有未处理的布局变化，批量读取仍可能先触发一次同步计算，最后的写入也仍需后续布局。优化目标是减少重复工作，不是让需要改变尺寸的页面完全不布局。</p>
<h2>批量读写必须保持业务语义</h2>
<p>假如下一张卡片的尺寸本来就需要基于前一张修改后的结果计算，把所有读取搬到最前面就可能改变答案。不能机械地为了“读写分离”而破坏尺寸依赖。</p>
<p>通常可以重新设计布局，让 CSS 的 Flex、Grid 或约束关系直接表达需求，减少脚本逐个求尺寸。确实必须读取修改后的几何结果时，一次有目的的同步布局可能是合理成本，关键是避免不必要的循环强制计算。</p>
<p>示例特意使用 <code>box-sizing: border-box</code>，因为 <code>offsetWidth</code> 包含 padding 和 border。若默认 content-box，却把这个值直接写回 CSS width，再加上 padding 和 border，元素会比预期多长一截。性能优化不能掩盖盒模型错误。</p>
<h2>哪些读取值得关注</h2>
<p><code>offsetWidth</code>、<code>offsetHeight</code>、<code>getBoundingClientRect()</code> 等需要返回几何结果。如果布局已有效，读取可能直接使用已有结果；如果前面有相关样式或 DOM 变化，就可能触发同步样式与布局更新。</p>
<p><code>getComputedStyle()</code> 至少涉及计算样式，但并非每次调用、每个属性、每种场景都强制完整布局。属性类型、布局依赖和浏览器实现都会影响它的成本，不应把 API 名单当成“调用一次一定重排一次”的定律。</p>
<p>几种尺寸的含义也不同：<code>offsetWidth</code> 是取整后的布局边框盒宽度，<code>getBoundingClientRect()</code> 的矩形会反映变换后的视觉边界等因素。元素 <code>transform: scale(2)</code> 后，两者可能不同；不能因为某个读取快一些，就随意替换成语义不同的测量。</p>
<p>修改颜色、透明度或其他不改变几何关系的属性，也不必然让布局失效。是否发生强制布局，应观察实际操作链，而不是只看“这段代码有读也有写”。</p>
<h2>requestAnimationFrame 不会自动隔离读写</h2>
<p>rAF 可以把动画更新安排在合适的渲染时机，但下面的结构仍然有原来的问题：在一个 rAF 回调里执行很多轮“写宽度、读尺寸”。浏览器仍要满足读取，不能因为回调名字是动画帧就返回过期布局。</p>
<p>即使你自己的回调先读后写，另一个组件也可能在同一帧更早的回调中修改了布局。较复杂页面可以统一管理读写阶段，避免多个组件互相打断，但应基于真实瓶颈决定是否值得引入调度层。</p>
<p>也不要把“一次 rAF”当成“画面已经画完”。rAF 回调本来就参与渲染更新前的工作，把昂贵测量和计算塞进去，仍可能错过这一帧。</p>
<h2>除了合并操作，还可以减少需要做的工作</h2>
<p>大列表可以使用窗口化渲染，让未显示的大量条目不参与当前布局；合理的 CSS containment 可以缩小依赖范围；避免不必要的 DOM 更新，则能从源头减少失效。</p>
<p>如果只是把元素视觉平移，transform 往往比持续改变影响正常流的位置更合适。但 transform 通常不会推开旁边的内容，不能替代需要重新排版的真实宽高变化。为性能而换属性之前，先确认交互结果一致。</p>
<p>最后应在 Performance 中找出实际 Layout 和样式计算记录，并沿调用栈定位触发读取的代码。对比同样的数据、视口和操作，观察重复布局是否减少，以及交互延迟是否改善。不要拿一次本机循环耗时直接宣称在所有浏览器上固定快多少倍。</p>`};export{e as default};