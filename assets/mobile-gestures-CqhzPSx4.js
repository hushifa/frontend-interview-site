var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>手指在屏幕上一滑，浏览器想拿它去滚动页面，页面上的卡片又想拿它做横滑删除，两边抢同一个动作，这就是冲突。</p>
<p>解决办法是提前分好工。给卡片写 <code>touch-action: pan-y pinch-zoom</code>，意思是纵向滚动和双指缩放归浏览器，横向移动归页面。然后手指移动超过一个小阈值，比如 10px，再判断方向并锁定，免得手抖一下就被当成横滑。</p>
<p>浏览器一旦决定接管去滚动，会发一个 <code>pointercancel</code>，卡片要在这里回到原位。</p>
<p>还要注意，手势是藏起来的操作，用户不一定知道能滑。所以要同时给一个能点的“删除”按钮，这也是 WCAG 2.5.1 和 2.5.7 的要求。</p>
</blockquote>
<h2>先看横滑删除卡片怎么写</h2>
<p>下面这段代码给卡片绑定横滑。要看的是三件事：什么时候开始判断方向，什么时候接管指针，什么时候复位。</p>
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
<p>手指刚按下时，代码只记下起点，什么都不做。移动距离没超过阈值，也直接返回，所以轻点卡片时 click 还能正常触发。</p>
<p>超过阈值以后才比较横向和纵向谁大，锁定一个方向。锁成横向，就调用 <code>setPointerCapture</code>，意思是“之后这根手指的事件都交给卡片”，手指滑出卡片也不会丢。锁成纵向，代码就不管了，因为 <code>touch-action</code> 已经允许浏览器纵向滚动。</p>
<p><code>isPrimary</code> 用来只跟踪第一根手指，第二根手指按上来不会打断当前手势。松手时，位移超过卡片宽度的三分之一才算滑成功，否则复位。</p>
<h2>为什么不只写 pan-y</h2>
<p>只写 <code>pan-y</code>，浏览器就只保留纵向滚动，双指缩放也交给页面了。页面又没处理缩放，结果用户没法放大看内容。所以要加上 <code>pinch-zoom</code>，把缩放留给浏览器。</p>
<h2>为什么要处理 pointercancel</h2>
<p>浏览器可能在中途决定这个手势归它，比如开始滚动。这时它会发 <code>pointercancel</code>，之后不会再有 <code>pointerup</code>。如果不处理，卡片就停在半路。所以代码把 <code>pointercancel</code> 也接到 <code>reset</code> 上，让卡片回到原位。</p>
<h2>其他常见情况怎么处理</h2>
<p>松手后的惯性和动画，可以用 CSS transition 让卡片滑出或回弹。速度可以按最后几次 <code>pointermove</code> 的位移和时间来估算。</p>
<p>自己实现双指缩放时，要记下两个 <code>pointerId</code> 的位置，用两点距离的比值算缩放比例。这时浏览器不该再插手，所以设成 <code>touch-action: none</code>。</p>
<p>系统手势页面是拦不住的。比如 iOS 从屏幕左边缘右滑是返回，所以关键手势不要放在屏幕边缘。</p>
<p>还有滚动穿透：弹层里滚到底了还继续滑，背景页面会跟着滚。给弹层容器设 <code>overscroll-behavior: contain</code> 就能挡住。</p>
<h2>为什么一定要有替代操作</h2>
<p>手势是隐藏的交互，用户不一定知道可以滑。读屏用户和用开关设备的用户也很难做出滑动。所以卡片上要有看得见的、或者能从菜单里找到的“删除”按钮，手势只当快捷方式。</p>
<p>WCAG 2.5.1 要求依赖路径或多点的手势，要有单指、不需要走路径的替代方式。WCAG 2.2 新增的 2.5.7 要求拖动操作提供单指点击的替代方式。</p>
<p>Pointer Events 的基本模型和指针捕获见<a href="/questions/mobile-pointer-events/">《Pointer Events 为什么适合统一鼠标、触摸和触控笔交互？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么不在 pointermove 里调用 preventDefault() 阻止滚动？</strong></p>
<blockquote>
<p>因为滚不滚是在手势开始时，由 <code>touch-action</code> 决定的。手势开始以后再调用 <code>preventDefault()</code> 已经晚了，没有效果。所以要提前用 CSS 把分工写好。</p>
</blockquote>
<p><strong>用手势库还是自己写？</strong></p>
<blockquote>
<p>简单的横滑可以自己写。缩放、旋转、多种手势组合这类复杂情况，可以用成熟的库。但不管用不用库，<code>touch-action</code> 还是得自己设对。</p>
</blockquote>`};export{e as default};