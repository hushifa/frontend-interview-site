var e={answerHtml:`<h2>简答</h2>
<ul>
<li>白屏没有浏览器原生事件，只能在约定时间点做启发式判断：根节点是否为空、视口采样点是否只有容器元素。</li>
<li>用 <code>document.elementFromPoint(x, y)</code> 取视口坐标下最上层的元素，命中的全是 <code>html</code>、<code>body</code>、<code>#app</code> 这类容器时，该点视为空白；<code>pointer-events: none</code> 或不可见的元素不会被命中。</li>
<li>判定为白屏后要附带同一会话的 JS 错误、资源加载失败和接口异常，否则只知道&quot;白了&quot;而不知道原因。</li>
<li>骨架屏、加载中状态、后台标签页、慢网络和合法的空列表都会被误判，需要白名单、重试检查和可见性过滤。</li>
</ul>
<h2>根节点检查</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">rootIsEmpty</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> root = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">getElementById</span>(<span class="hljs-string">&#x27;app&#x27;</span>);
  <span class="hljs-keyword">return</span> !root || root.<span class="hljs-property">childElementCount</span> === <span class="hljs-number">0</span>;
}
</code></pre></div>
<p>SPA 渲染失败时根节点通常保持空白，这是成本最低的信号。它的盲区是：应用渲染出了一个空壳布局或全屏错误遮罩，根节点有子元素但用户看到的仍是空白。</p>
<h2>视口采样</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CONTAINERS</span> = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;BODY&#x27;</span>]);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">isBlankScreen</span>(<span class="hljs-params">rootId = <span class="hljs-string">&#x27;app&#x27;</span></span>) {
  <span class="hljs-keyword">const</span> w = <span class="hljs-variable language_">window</span>.<span class="hljs-property">innerWidth</span>;
  <span class="hljs-keyword">const</span> h = <span class="hljs-variable language_">window</span>.<span class="hljs-property">innerHeight</span>;
  <span class="hljs-keyword">const</span> points = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">1</span>; i &lt;= <span class="hljs-number">9</span>; i += <span class="hljs-number">1</span>) {
    points.<span class="hljs-title function_">push</span>([(w * i) / <span class="hljs-number">10</span>, h / <span class="hljs-number">2</span>]); <span class="hljs-comment">// 横向中线</span>
    <span class="hljs-keyword">if</span> (i !== <span class="hljs-number">5</span>) points.<span class="hljs-title function_">push</span>([w / <span class="hljs-number">2</span>, (h * i) / <span class="hljs-number">10</span>]); <span class="hljs-comment">// 纵向中线，跳过已采样的中心点</span>
  }
  <span class="hljs-keyword">const</span> emptyCount = points.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">[x, y]</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> top = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">elementFromPoint</span>(x, y);
    <span class="hljs-keyword">return</span> !top || <span class="hljs-variable constant_">CONTAINERS</span>.<span class="hljs-title function_">has</span>(top.<span class="hljs-property">tagName</span>) || top.<span class="hljs-property">id</span> === rootId;
  }).<span class="hljs-property">length</span>;
  <span class="hljs-keyword">return</span> emptyCount === points.<span class="hljs-property">length</span>;
}
</code></pre></div>
<p>采样点全部落在容器上才判定为白屏，阈值可按业务放宽（如 90%）。采样只看元素层级，不看像素，因此透明或纯白背景的大块元素会被当成&quot;有内容&quot;。反过来，设置了 <code>pointer-events: none</code> 或 <code>visibility: hidden</code> 的元素不会被命中，采样会穿过它落到下层。</p>
<h2>检查时机</h2>
<ul>
<li>在 <code>load</code> 后延迟几秒执行，留出接口和渲染时间。</li>
<li>首次判定为空白时间隔一段再查一两次，连续空白才上报，过滤慢网络。</li>
<li><code>document.visibilityState === &#x27;hidden&#x27;</code> 时跳过，后台标签页的渲染可能被浏览器推迟。</li>
<li>路由切换后也可以检查，SPA 的白屏常发生在懒加载分包失败时。</li>
</ul>
<h2>定位原因</h2>
<p>白屏上报应带上下文：</p>
<ul>
<li>最近的 JS 错误和未处理 Promise 拒绝，采集方式见<a href="/questions/monitoring-error-capture/">《前端怎样全局捕获 JS 错误、Promise 拒绝和资源加载失败？》</a>。</li>
<li>脚本或 CSS 加载失败，尤其是 CDN 上的入口文件与懒加载分包。</li>
<li>关键接口的状态码和耗时。</li>
<li>页面 URL、发布版本、浏览器版本。</li>
</ul>
<p>常见根因是入口脚本因 CDN 故障或缓存了旧 HTML 而 404、首屏渲染抛错且没有错误边界、浏览器不支持产物使用的语法。</p>
<h2>误报来源</h2>
<ul>
<li>骨架屏和 loading 占位：把骨架屏的选择器加入&quot;仍在加载&quot;白名单，检查到它时延后再查。</li>
<li>合法空状态：搜索无结果、空购物车本身就几乎是空白，应让这类页面渲染明确的空状态元素。</li>
<li>全屏 Canvas、视频或 iframe：采样点命中的就是这些元素，需要按业务确认它们是否已绘制内容。</li>
<li>用户很快离开：页面还没渲染完就切走，检查前先确认页面仍可见。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>能用截图比像素吗？可以在合成监控或测试环境里做，线上用户端截图成本高、涉及隐私，一般不采用。</li>
<li>白屏率怎么算？以检测到白屏的页面访问数除以完成检查的访问数，排除被跳过的后台访问。</li>
<li>有了错误边界还需要白屏检测吗？需要，资源加载失败和入口脚本未执行时错误边界根本没有运行。</li>
</ul>`};export{e as default};