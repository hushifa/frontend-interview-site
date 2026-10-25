var e={answerHtml:`<p>图片还在屏幕下方时，提前一点开始加载；列表快到底时，准备下一页。这类功能需要知道“某个元素与可见区域有没有接近或相交”，但不必在每次 scroll 中遍历所有元素并同步测量位置。</p>
<p>IntersectionObserver 让浏览器观察元素与根区域的交叉变化，异步把结果通知应用。它适合预加载触发点、无限列表哨兵和粗粒度可见性统计，<strong>不能单凭一次回调证明人已经看到了或读懂了内容</strong>。</p>
<h2>三个常用配置分别控制什么</h2>
<p><code>root</code> 指定参考区域。为 null 时通常以视口为参考；指定元素时，常用于内部滚动列表，应选择与目标有合适祖先关系的容器。目标的实际交叉还会受到祖先裁剪等因素影响，不只是两个矩形简单相交。</p>
<p><code>rootMargin</code> 调整用于判断的根边界。比如 <code>200px 0px</code> 向上、向下扩展 200px，目标尚未进入屏幕时就可能触发。这对预加载有用，却不能作为“已经出现在真实视口”的曝光证据。它也不会改变页面实际的 padding 或可见区域，更不会自动取消中间祖先的裁剪。</p>
<p><code>threshold</code> 是交叉比例阈值，可以是 0 到 1 的一个值或数组。比如 <code>[0, 0.5, 1]</code> 关注跨越这些比例的情况，不是每滚动一个像素就通知，也不是“每隔多少毫秒通知”。选项名是单数 threshold，实例上读取阈值列表的属性则叫 thresholds。</p>
<p>比例通常是交叉面积除以目标元素的边界矩形面积，不是“占屏幕多少”。如果目标比根区域大很多，就可能永远无法达到 1；用 threshold 1 等待一个超高文章完整进入小视口，条件本身就不合理。</p>
<h2>观察一个元素后，会先得到当前状态</h2>
<p>调用 <code>observe()</code> 后，会安排初始交叉状态的通知，即使元素在屏幕外也可能收到记录。因此回调被执行不代表目标一定进入了视口，必须检查记录里的实际字段。</p>
<ul>
<li><code>target</code> 是被观察的元素。</li>
<li><code>isIntersecting</code> 表示交叉状态。</li>
<li><code>intersectionRatio</code> 是交叉比例。</li>
<li><code>boundingClientRect</code>、<code>intersectionRect</code> 和 <code>rootBounds</code> 提供相应的几何信息。</li>
<li><code>time</code> 是产生该记录时的时间戳，可用于分析先后，而不是业务处理完成时间。</li>
</ul>
<p>设置 threshold 为 0.5 后，仍可能收到低于 0.5 的初始记录。需要“至少显示一半”时，应明确判断 <code>entry.isIntersecting &amp;&amp; entry.intersectionRatio &gt;= 0.5</code>，不能把配置阈值误当成回调的自动过滤器。</p>
<p>还有一个细节：根与目标刚好接触边界时，可能 <code>isIntersecting</code> 为 true，但交叉面积和比例为 0。不要把这两个字段简单等同。零面积目标也有特殊比例规则，曝光目标应有明确尺寸。相关定义可查 <a href="https://w3c.github.io/IntersectionObserver/">Intersection Observer 规范</a>。</p>
<h2>一个接近视口后只标记一次的示例</h2>
<p>下面不发请求，只给接近区域的元素加 class，便于看清观察与清理过程。实际项目可以据此启动对应的轻量准备工作。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">markApproaching</span>(<span class="hljs-params">elements, root = <span class="hljs-literal">null</span></span>) {
  <span class="hljs-keyword">const</span> targets = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(elements);

  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;IntersectionObserver&#x27;</span> <span class="hljs-keyword">in</span> globalThis)) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> target <span class="hljs-keyword">of</span> targets) target.<span class="hljs-property">classList</span>.<span class="hljs-title function_">add</span>(<span class="hljs-string">&#x27;is-near&#x27;</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  }

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntersectionObserver</span>(<span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
      <span class="hljs-keyword">if</span> (!entry.<span class="hljs-property">isIntersecting</span>) <span class="hljs-keyword">continue</span>;
      entry.<span class="hljs-property">target</span>.<span class="hljs-property">classList</span>.<span class="hljs-title function_">add</span>(<span class="hljs-string">&#x27;is-near&#x27;</span>);
      observer.<span class="hljs-title function_">unobserve</span>(entry.<span class="hljs-property">target</span>);
    }
  }, {
    root,
    <span class="hljs-attr">rootMargin</span>: <span class="hljs-string">&#x27;200px 0px&#x27;</span>,
    <span class="hljs-attr">threshold</span>: <span class="hljs-number">0</span>,
  });

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> target <span class="hljs-keyword">of</span> targets) observer.<span class="hljs-title function_">observe</span>(target);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>在 DOM 就绪后传入真实元素集合，销毁组件时调用返回函数。一个 observer 可以观察多个目标，回调中的 entries 也可能包含多个记录，所以不能只处理第一项就认为其他目标会自动补发。</p>
<p>这里的“一次”来自主动 <code>unobserve()</code>，不是 threshold 0 自带单次语义。清理 observer 不会移除已经加上的 class，也不会自动取消此前启动的网络请求；如果业务需要取消，还要单独管理请求生命周期。</p>
<p>普通图片懒加载优先考虑 <code>&lt;img loading=&quot;lazy&quot;&gt;</code> 等原生能力。只有确实需要自定义提前距离、内部滚动区域或额外业务协调时，再决定是否使用观察器，避免为简单功能维护一套完整加载状态机。</p>
<h2>无限列表不能把一次回调当成一次可靠请求</h2>
<p>观察列表末尾的哨兵时，进入区域可以触发加载，但需要防止请求未完成就重复触发，也要区分没有更多数据、请求失败和条件已经变化。</p>
<p>常见状态至少包含当前是否加载、是否还有下一页，以及本次请求对应的筛选条件或序号。旧筛选条件的结果晚到时，不应追加到新列表中。失败后也应有明确的重试入口，而不是一直显示空白。</p>
<p>如果追加内容后哨兵仍在交叉区域内，交叉状态可能根本没有跨阈值，不保证自动再来一次回调。希望继续加载直到填满视口时，需要单独判断这种情况，并控制连续请求的上限；不能依赖 observer 恰好不停触发来补齐列表。</p>
<h2>几何可见与有效曝光差在哪里</h2>
<p>基础交叉观察通常不能完整判断目标是否被其他元素遮挡、是否透明、标签页是否在后台，也不知道用户的注意力。rootMargin 提前触发的内容更可能还没真正显示。</p>
<p>若业务把“至少一半面积、前台停留一秒”定义为曝光，就应组合比例、页面可见性、持续时长和去重，离开条件成立时取消或重算计时。快速掠过、切后台和恢复页面都要有明确规则，不能只在进入时启动一个不再检查条件的定时器。</p>
<p>部分实现提供 trackVisibility 等额外可见性能力，但支持范围与计算代价不同，应单独做特性检测和兼容策略；即便报告可见，也不能证明人实际阅读。</p>
<p>回调最终仍在主线程执行。API 帮你减少手动持续测量，不会替你消除回调里昂贵的 JSON 解析、DOM 更新或请求风暴。需要精确到每一帧、每个像素的动画，也不宜把这种异步阈值通知当成连续滚动时钟。</p>`};export{e as default};