var e={answerHtml:`<h2>简答</h2>
<ul>
<li>冲突的根源是浏览器和页面都想处理同一个触摸移动：浏览器要滚动，页面要横滑或拖动。</li>
<li>用 <code>touch-action</code> 提前划分：横滑卡片设 <code>pan-y pinch-zoom</code>，纵向滚动和双指缩放留给浏览器，横向移动交给页面。</li>
<li>移动距离超过阈值（如 10px）后再判断方向并锁定，避免轻微抖动被误判为手势。</li>
<li>浏览器接管滚动时会发送 <code>pointercancel</code>，卡片要回到原位。</li>
<li>每个手势都要有可点击的替代操作（如&quot;删除&quot;按钮），满足 WCAG 2.5.1 对路径手势的要求。</li>
</ul>
<h2>横滑删除卡片</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindSwipe</span>(<span class="hljs-params">card, { threshold = <span class="hljs-number">10</span>, onSwipe }</span>) {
  <span class="hljs-keyword">let</span> id = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> startX = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> startY = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> locked = <span class="hljs-literal">null</span>; <span class="hljs-comment">// &#x27;x&#x27; 或 &#x27;y&#x27;</span>

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">reset</span> = (<span class="hljs-params"></span>) =&gt; {
    id = <span class="hljs-literal">null</span>;
    locked = <span class="hljs-literal">null</span>;
    card.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">&#x27;&#x27;</span>;
  };

  card.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerdown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (id !== <span class="hljs-literal">null</span> || !e.<span class="hljs-property">isPrimary</span>) <span class="hljs-keyword">return</span>;
    id = e.<span class="hljs-property">pointerId</span>;
    startX = e.<span class="hljs-property">clientX</span>;
    startY = e.<span class="hljs-property">clientY</span>;
  });

  card.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointermove&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (e.<span class="hljs-property">pointerId</span> !== id) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> dx = e.<span class="hljs-property">clientX</span> - startX;
    <span class="hljs-keyword">const</span> dy = e.<span class="hljs-property">clientY</span> - startY;

    <span class="hljs-keyword">if</span> (!locked) {
      <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">hypot</span>(dx, dy) &lt; threshold) <span class="hljs-keyword">return</span>;
      locked = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(dx) &gt; <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(dy) ? <span class="hljs-string">&#x27;x&#x27;</span> : <span class="hljs-string">&#x27;y&#x27;</span>;
      <span class="hljs-keyword">if</span> (locked === <span class="hljs-string">&#x27;x&#x27;</span>) card.<span class="hljs-title function_">setPointerCapture</span>(id);
    }
    <span class="hljs-keyword">if</span> (locked === <span class="hljs-string">&#x27;x&#x27;</span>) card.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translateX(<span class="hljs-subst">\${dx}</span>px)\`</span>;
  });

  card.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerup&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (e.<span class="hljs-property">pointerId</span> !== id) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> dx = e.<span class="hljs-property">clientX</span> - startX;
    <span class="hljs-keyword">const</span> swiped = locked === <span class="hljs-string">&#x27;x&#x27;</span> &amp;&amp; <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">abs</span>(dx) &gt; card.<span class="hljs-property">offsetWidth</span> / <span class="hljs-number">3</span>;
    <span class="hljs-title function_">reset</span>();
    <span class="hljs-keyword">if</span> (swiped) <span class="hljs-title function_">onSwipe</span>(dx &gt; <span class="hljs-number">0</span> ? <span class="hljs-string">&#x27;right&#x27;</span> : <span class="hljs-string">&#x27;left&#x27;</span>);
  });

  card.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointercancel&#x27;</span>, reset);
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> { <span class="hljs-attribute">touch-action</span>: pan-y pinch-zoom; }
</code></pre></div>
<ul>
<li>移动不足阈值时什么都不做，点击卡片仍正常触发 click。</li>
<li>锁定为横向后才捕获指针，之后的移动都由卡片处理。</li>
<li>锁定为纵向时不做处理；<code>touch-action</code> 已允许浏览器纵向滚动。</li>
<li>只跟踪主指针（<code>isPrimary</code>），第二根手指不会打断当前手势。</li>
<li>松手时位移超过卡片宽度的三分之一才算滑动成功，否则复位。</li>
</ul>
<p>只写 <code>pan-y</code> 会把双指缩放也交给页面，用户就无法放大查看内容，所以保留 <code>pinch-zoom</code>。</p>
<h2>其他常见问题</h2>
<ul>
<li><strong>惯性和动画</strong>：松手后用 CSS transition 让卡片滑出或回弹，速度可以按最后几次 <code>pointermove</code> 的位移和时间估算。</li>
<li><strong>双指缩放</strong>：自己实现缩放时，记录两个 <code>pointerId</code> 的位置，用两点距离的比值计算缩放比例，并设置 <code>touch-action: none</code>。</li>
<li><strong>系统手势</strong>：iOS 从屏幕左边缘右滑是返回，页面无法阻止，关键手势不要放在屏幕边缘。</li>
<li><strong>滚动穿透</strong>：弹层内滚动到底时继续滑动会带动背景滚动，可以给弹层容器设置 <code>overscroll-behavior: contain</code>。</li>
</ul>
<h2>替代操作</h2>
<p>手势是隐藏的交互，用户不一定知道可以滑动，读屏用户和使用开关设备的用户也难以完成。卡片上应提供可见或可通过菜单访问的&quot;删除&quot;按钮，手势只作为快捷方式。WCAG 2.2 的 2.5.7 也要求拖动操作提供单指点击的替代方式。</p>
<p>Pointer Events 的基础模型和指针捕获见《Pointer Events 为什么适合统一鼠标、触摸和触控笔交互？》。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不在 <code>pointermove</code> 里 <code>preventDefault()</code> 阻止滚动？滚动是否发生由 <code>touch-action</code> 在手势开始时决定，之后调用无效。</li>
<li>用手势库还是自己写？简单横滑可以自己实现；复杂手势（缩放、旋转、多手势组合）可以用成熟库，但仍要设置正确的 <code>touch-action</code>。</li>
</ul>`};export{e as default};