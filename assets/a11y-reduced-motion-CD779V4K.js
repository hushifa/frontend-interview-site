var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>prefers-reduced-motion: reduce</code> 表示减少动态效果，不是不想看到任何状态变化。</li>
<li>先区分传达状态的变化和装饰性运动，减少的是大范围位移、视差、循环等装饰运动。</li>
<li>用媒体查询保留最终可见状态，去掉滑入距离和循环动画，不要让页面突然跳变。</li>
<li>Canvas、WebGL、视频和 JavaScript 动画不会自动跟随媒体查询，要在脚本中读取偏好。</li>
</ul>
<p>有些用户在看到大范围缩放、视差、旋转或持续移动时会感到眩晕、恶心或注意力被打断。系统通常允许用户打开“减少动态效果”，浏览器再通过 <code>prefers-reduced-motion</code> 媒体特性把这个偏好暴露给页面。</p>
<p>这项设置不是“用户不想看到任何变化”。用户仍然需要知道菜单打开了、请求完成了、焦点移动到了哪里，以及一个操作是否成功。设计目标是减少会造成不适的运动和不必要的连续变化，同时保留状态和反馈的可理解性。</p>
<h2>先区分状态变化和装饰运动</h2>
<p>关闭所有 transition 可能让页面突然跳变，反而使焦点、内容位置和操作结果更难理解。更好的做法是先给动画分类：</p>
<ul>
<li>用于传达空间关系的短暂运动，例如抽屉从右侧进入，可以缩短距离、改为淡入或直接切换；</li>
<li>会持续自动播放的背景、视差、弹跳和旋转，通常应暂停、降低频率或移除；</li>
<li>表示处理状态的变化，不能只删掉动画，还要保留“正在保存”“已完成”等文字或语义状态；</li>
<li>与用户直接拖拽、滚动或按键同步的反馈，要保证操作仍然能被观察到，并提供停止或退出方式。</li>
</ul>
<p>减少动态效果是一个设计分支，不是把动画时长改成零的单一 CSS 补丁。对于会改变内容顺序、焦点位置或交互结果的效果，必须单独检查简化后的流程。</p>
<h2>CSS 动画应该提供可读的静态替代</h2>
<p>可以用媒体查询覆盖装饰动画和大范围位移。下面的例子保留面板出现后的可见状态，只删除滑入距离和循环脉冲：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.panel</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">12px</span>);
  <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">180ms</span> ease, transform <span class="hljs-number">180ms</span> ease;
}

<span class="hljs-selector-class">.panel</span><span class="hljs-selector-attr">[data-open=<span class="hljs-string">&quot;true&quot;</span>]</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">0</span>);
}

<span class="hljs-selector-class">.sync-indicator</span> {
  <span class="hljs-attribute">animation</span>: pulse <span class="hljs-number">1.2s</span> ease-in-out infinite;
}

<span class="hljs-keyword">@keyframes</span> pulse {
  <span class="hljs-number">0%</span>, <span class="hljs-number">100%</span> { <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0.45</span>; }
  <span class="hljs-number">50%</span> { <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>; }
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.panel</span> {
    <span class="hljs-attribute">transition-duration</span>: <span class="hljs-number">1ms</span>;
    <span class="hljs-attribute">transform</span>: none;
  }

  <span class="hljs-selector-class">.sync-indicator</span> {
    <span class="hljs-attribute">animation</span>: none;
  }
}
</code></pre></div>
<p>这里使用极短的过渡时间是为了让依赖 <code>transitionend</code> 的旧代码仍有机会收到事件，但不能把它当作所有项目的固定写法。如果业务逻辑依赖动画结束来提交状态，应该把状态更新从 CSS 事件中分离出来；否则用户偏好一变，功能可能因为没有等到事件而卡住。能直接删除动画且不依赖事件的组件，应优先使用 <code>transition: none</code> 或 <code>animation: none</code>，减少不必要的样式计算。</p>
<p>媒体查询只描述当前环境的偏好。它不会替开发者决定哪些动画会造成风险，也不会自动处理通过 Canvas、WebGL、视频或第三方组件绘制的运动。对于这些内容需要在自己的渲染循环或播放器控制层实现降级。</p>
<h2>JavaScript 动画不能只在初始化时判断一次</h2>
<p>通过 <code>matchMedia</code> 可以读取偏好并监听系统设置变化。监听很重要：用户可能在页面打开后才修改系统设置，页面应该停止新的动画并让当前动画进入可理解的终态。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> motionQuery = <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">matchMedia</span>(<span class="hljs-string">&#x27;(prefers-reduced-motion: reduce)&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">applyMotionPreference</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">documentElement</span>.<span class="hljs-property">dataset</span>.<span class="hljs-property">reducedMotion</span> = motionQuery.<span class="hljs-property">matches</span>
    ? <span class="hljs-string">&#x27;true&#x27;</span>
    : <span class="hljs-string">&#x27;false&#x27;</span>;
}

<span class="hljs-title function_">applyMotionPreference</span>();
motionQuery.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, applyMotionPreference);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">shouldAnimate</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> !motionQuery.<span class="hljs-property">matches</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">moveCard</span>(<span class="hljs-params">card, targetX</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(targetX)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;目标位置必须是有限数值&#x27;</span>);
  }

  <span class="hljs-keyword">if</span> (!<span class="hljs-title function_">shouldAnimate</span>()) {
    card.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translateX(<span class="hljs-subst">\${targetX}</span>px)\`</span>;
    <span class="hljs-keyword">return</span>;
  }

  card.<span class="hljs-title function_">animate</span>(
    [
      { <span class="hljs-attr">transform</span>: <span class="hljs-title function_">getComputedStyle</span>(card).<span class="hljs-property">transform</span> },
      { <span class="hljs-attr">transform</span>: <span class="hljs-string">\`translateX(<span class="hljs-subst">\${targetX}</span>px)\`</span> },
    ],
    { <span class="hljs-attr">duration</span>: <span class="hljs-number">180</span>, <span class="hljs-attr">easing</span>: <span class="hljs-string">&#x27;ease-out&#x27;</span>, <span class="hljs-attr">fill</span>: <span class="hljs-string">&#x27;forwards&#x27;</span> },
  );
}
</code></pre></div>
<p>示例中的直接跳到目标位置仍然表达了“卡片移动完成”，只是没有播放一段连续运动。生产代码还应保存 <code>change</code> 监听器并在组件销毁时移除，避免单页应用反复挂载后积累监听器。若使用 <code>requestAnimationFrame</code>，减少动态效果分支必须阻止后续帧继续调度，而不是只跳过本帧的绘制；否则后台仍可能持续占用 CPU。</p>
<h2>轮播和自动播放要提供真正的控制</h2>
<p>自动轮播同时涉及运动、时间和内容可达性。检测到减少动态效果时，可以默认暂停轮播，或者把切换改成无动画的手动分页。无论采用哪种策略，都要让用户知道当前页、前后页按钮和暂停状态，并且按钮本身可用键盘操作。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> reduceMotion = <span class="hljs-title function_">matchMedia</span>(<span class="hljs-string">&#x27;(prefers-reduced-motion: reduce)&#x27;</span>);
<span class="hljs-keyword">const</span> carousel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;[data-carousel]&#x27;</span>);
<span class="hljs-keyword">let</span> timer = <span class="hljs-literal">null</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">stopAutoplay</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (timer !== <span class="hljs-literal">null</span>) {
    <span class="hljs-built_in">clearInterval</span>(timer);
    timer = <span class="hljs-literal">null</span>;
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">syncAutoplay</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title function_">stopAutoplay</span>();
  <span class="hljs-keyword">if</span> (!reduceMotion.<span class="hljs-property">matches</span> &amp;&amp; !<span class="hljs-variable language_">document</span>.<span class="hljs-property">hidden</span> &amp;&amp; carousel?.<span class="hljs-property">dataset</span>.<span class="hljs-property">paused</span> !== <span class="hljs-string">&#x27;true&#x27;</span>) {
    timer = <span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> carousel?.<span class="hljs-title function_">dispatchEvent</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Event</span>(<span class="hljs-string">&#x27;nextslide&#x27;</span>)), <span class="hljs-number">5000</span>);
  }
}

reduceMotion.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, syncAutoplay);
<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, syncAutoplay);
<span class="hljs-title function_">syncAutoplay</span>();
</code></pre></div>
<p>这段代码只演示调度边界，实际轮播还需要处理悬停、键盘焦点、触摸拖拽、窗口失焦和组件卸载。暂停自动播放不能依赖鼠标悬停，因为键盘和触屏用户可能无法触发该事件。对于包含重要文字的轮播，还应提供稳定的静态阅读方式，避免内容只在短时间内出现。</p>
<h2>页面转场与滚动行为要一起考虑</h2>
<p><code>scroll-behavior: smooth</code>、View Transitions API、路由转场和滚动驱动动画都可能造成大范围移动。减少动态效果时，应让滚动直接到目标位置，并把页面更新后的焦点放到合理的标题或主容器上。不能为了“没有动画”而让焦点丢失或把用户送到页面顶部。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">html</span> {
  <span class="hljs-attribute">scroll-behavior</span>: smooth;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-tag">html</span> {
    <span class="hljs-attribute">scroll-behavior</span>: auto;
  }
}
</code></pre></div>
<p>如果脚本调用 <code>element.scrollIntoView({ behavior: &#x27;smooth&#x27; })</code>，CSS 媒体查询不会在所有情况下替脚本参数改写。调用处应读取同一个媒体查询并选择 <code>behavior: &#x27;auto&#x27;</code>。同理，View Transitions 的伪元素动画需要在减少动态效果分支中明确覆盖，而不能假设浏览器会自动取消自定义动画。</p>
<h2>不要把系统偏好当成唯一的停止方式</h2>
<p>用户可能在浏览器设置中没有开启减少动态效果，但仍然被某个动画困扰。因此，持续运动、视频背景和复杂视差应提供暂停、停止或关闭入口，并记住用户在当前产品中的选择。这个产品开关与系统媒体查询不是互斥关系：系统偏好可以作为默认值，用户明确操作后再按产品规则覆盖。</p>
<p>还要避免用闪烁或快速交替吸引注意力。<code>prefers-reduced-motion</code> 不能替代对闪烁频率和面积的检查；可能诱发癫痫的内容需要依据 WCAG 对闪烁的要求单独评估。加载动画也不能无限旋转而没有超时、错误和完成状态。</p>
<h2>如何验收才算做对</h2>
<p>只在开发者工具里勾选一次媒体查询还不够，至少要检查以下流程：</p>
<ul>
<li>系统开启减少动态效果后，首页、弹窗、路由切换、轮播、拖拽和加载反馈是否仍然能理解；</li>
<li>页面加载后再切换系统偏好，正在运行的动画是否停止或进入稳定终态，是否留下半透明、遮挡或不可操作的元素；</li>
<li>键盘和读屏用户是否能获得与动画同等的信息，焦点是否随着内容变化保持可预测；</li>
<li>页面隐藏、切换标签页、组件卸载后是否停止定时器、动画帧、观察器和媒体播放；</li>
<li>Canvas、WebGL、视频和第三方组件是否有独立的暂停或降级策略；</li>
<li>不依赖动画结束事件的业务逻辑，网络请求、表单提交和错误恢复是否仍按同样规则完成。</li>
</ul>
<p>减少动态效果的合格实现，不是页面看起来“完全不动”，而是用户仍能理解状态、完成任务并控制持续运动，同时降低不必要的视觉刺激和资源消耗。动画只是表达手段，状态、焦点和可操作性才是功能本身。</p>`};export{e as default};