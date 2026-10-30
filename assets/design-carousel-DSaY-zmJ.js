var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>首页的 banner 轮播，几张图横着排在一条轨道上，轨道用 <code>transform: translateX</code> 移动，每次露出一张。难点是“无缝循环”：从最后一张往后翻，要像是自然地滑到第一张，而不是倒着滑回去。</p>
<p>常用做法是在首尾各复制一张：真实顺序是 1、2、3，轨道上放 3、1、2、3、1。从真实的 3 往后滑到复制的 1，等过渡结束，关掉过渡，瞬间把位置换到真实的 1，因为两张图一样，用户看不出来。</p>
<p>自动播放靠定时器切换下标，但 WAI-ARIA 的轮播模式要求必须有暂停和继续的按钮，键盘焦点进入轮播、鼠标悬停时也要停止轮播。页面切到后台时，按 <code>visibilitychange</code> 暂停，回来再继续。</p>
<p>要注意几个细节。跳回真实位置要在 <code>transitionend</code> 里做，但过渡被打断时这个事件不会触发，要同时监听 <code>transitioncancel</code>；用户开了“减少动态效果”时应关掉滑动动画；容器和每一张要按 APG 标上 <code>aria-roledescription</code>，自动播放期间 <code>aria-live</code> 设为 <code>off</code>。</p>
</blockquote>
<h2>首尾复制为什么能做到无缝</h2>
<p>先看下标怎样换算。轨道上的位置比真实下标多 1，因为最前面多了一张复制的最后一张。下面的例子模拟连续往后翻和往前翻，看每一步轨道位置、是否需要瞬间跳回，以及最终显示的是哪张。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> slides = [<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;B&#x27;</span>, <span class="hljs-string">&#x27;C&#x27;</span>];
<span class="hljs-keyword">const</span> track = [slides[slides.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>], ...slides, slides[<span class="hljs-number">0</span>]];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(track.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// C,A,B,C,A</span>

<span class="hljs-keyword">let</span> position = <span class="hljs-number">1</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">go</span>(<span class="hljs-params">step</span>) {
  position += step;
  <span class="hljs-keyword">const</span> shown = track[position];
  <span class="hljs-keyword">let</span> jump = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-comment">// 过渡结束后才做这一步：滑到复制的那张，就无过渡地换到真实的那张。</span>
  <span class="hljs-keyword">if</span> (position === track.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>) {
    position = <span class="hljs-number">1</span>;
    jump = <span class="hljs-string">&#x27;，跳回 1&#x27;</span>;
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (position === <span class="hljs-number">0</span>) {
    position = slides.<span class="hljs-property">length</span>;
    jump = <span class="hljs-string">&#x27;，跳回 &#x27;</span> + slides.<span class="hljs-property">length</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;显示 &#x27;</span> + shown + jump;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">go</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 显示 B</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">go</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 显示 C</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">go</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 显示 A，跳回 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">go</span>(-<span class="hljs-number">1</span>)); <span class="hljs-comment">// 显示 C，跳回 3</span>
</code></pre></div>
<p>第三次往后翻，轨道滑到第 4 格，那里是复制的 A。用户看到的是 C 自然地滑到 A，接着代码把位置换回第 1 格的真实 A。两张一样，所以这次跳转看不出来。往前翻也是同理，从真实的 A 往前滑到第 0 格复制的 C，再换到第 3 格真实的 C。</p>
<p>在浏览器里，“换回真实位置”要分两步：先把过渡关掉再改 <code>transform</code>，然后在下一帧重新打开过渡，否则浏览器会把这次跳转也做成动画，用户就会看到画面倒着滑回去。</p>
<h2>为什么跳回要放在 transitionend 里</h2>
<p>如果滑动一开始就跳，动画还没播完画面就变了。所以要等过渡结束，也就是 <code>transitionend</code> 事件触发时再跳。</p>
<p>可是 MDN 写明，过渡在完成前被移除，比如 <code>display</code> 被设成 <code>none</code>，<code>transitionend</code> 不会触发；触发了 <code>transitioncancel</code> 就不会再触发 <code>transitionend</code>。轮播被隐藏或者动画被打断时，如果只听 <code>transitionend</code>，位置就会停在复制的那张上，下一次再往后翻就越界了。所以两个事件都要监听，并且在处理函数里按当前位置判断是否需要跳回。</p>
<p>用户快速连点“下一张”时，前一次过渡还没结束就开始了下一次。简单的做法是在过渡进行中忽略点击，或者在点击时先把位置规范到真实范围内再继续。</p>
<p>另一种不复制的做法是只渲染当前张和左右相邻的一两张，下标按 <code>(index + n) % n</code> 取模，每次切换后重新排列这几张。它不需要复制 DOM，适合每张内容很重的情况，代价是要自己管理这几张的位置和进出动画。</p>
<h2>自动播放要满足哪些要求</h2>
<p>自动播放就是一个定时器，每隔几秒调用一次 <code>go(1)</code>。可是 WAI-ARIA 的 Carousel 模式对它有明确要求。</p>
<p>第一，自动轮播必须提供一个停止和重新开始的按钮，最好用原生 <code>button</code>。按钮的文字随状态变化，比如“停止轮播”和“开始轮播”，因为文字已经说明了状态，就不要再加 <code>aria-pressed</code>。这个按钮在轮播内部的 Tab 顺序里排第一个。</p>
<p>第二，键盘焦点进入轮播里的任何元素时，轮播要停止，并且只有用户点了开始按钮才恢复；鼠标悬停在轮播上时也要停止。原因是用户正在读某一张，内容突然换掉会打断阅读。</p>
<p>第三，点击上一张、下一张或者停止按钮后，焦点留在按钮上，方便连续按。</p>
<p>另外，MDN 说明用户切换标签页、最小化浏览器时页面会触发 <code>visibilitychange</code>，<code>document.hidden</code> 变成 <code>true</code>，这时适合停掉用户不需要在后台运行的任务。轮播在后台没人看，可以在这里清掉定时器，回到前台再继续。用户在系统里开了“减少动态效果”时，<code>prefers-reduced-motion: reduce</code> 会匹配，这时应关掉滑动过渡，直接切换。</p>
<h2>ARIA 怎样标注</h2>
<p>APG 规定的标注方式如下：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">aria-roledescription</span>=<span class="hljs-string">&quot;carousel&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;热门活动&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>停止轮播<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;上一张&quot;</span>&gt;</span>‹<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;下一张&quot;</span>&gt;</span>›<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">aria-live</span>=<span class="hljs-string">&quot;off&quot;</span> <span class="hljs-attr">aria-atomic</span>=<span class="hljs-string">&quot;false&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;group&quot;</span> <span class="hljs-attr">aria-roledescription</span>=<span class="hljs-string">&quot;slide&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;1 / 3&quot;</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;group&quot;</span> <span class="hljs-attr">aria-roledescription</span>=<span class="hljs-string">&quot;slide&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;2 / 3&quot;</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;group&quot;</span> <span class="hljs-attr">aria-roledescription</span>=<span class="hljs-string">&quot;slide&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;3 / 3&quot;</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<p>容器的角色用 <code>region</code> 或 <code>group</code>，<code>section</code> 有可访问名称时就是 <code>region</code>；名称里不要再写“carousel”或“轮播”，因为 <code>aria-roledescription</code> 已经说了。每一张是 <code>role=&quot;group&quot;</code> 加 <code>aria-roledescription=&quot;slide&quot;</code>，没有独特标题时可以用“3 / 10”这样的位置当名称，因为 <code>group</code> 不支持 <code>aria-setsize</code> 和 <code>aria-posinset</code>。</p>
<p><code>aria-live</code> 要跟着自动播放切换：自动轮播时设成 <code>off</code>，否则屏幕阅读器每几秒就会播报一次；停止以后改成 <code>polite</code>，用户手动翻页时才会读出新内容。首尾复制出来的那两张不是真实内容，应该加 <code>aria-hidden=&quot;true&quot;</code> 并让里面的链接不可聚焦，否则屏幕阅读器会读到重复的内容。</p>
<h2>常见追问</h2>
<p><strong>手机上的滑动手势怎样做？</strong></p>
<blockquote>
<p>用 Pointer Events 记录按下时的位置，移动时让轨道跟着手指偏移，此时关掉过渡；松开时看偏移距离或速度是否超过阈值，超过就翻页，否则回到原位，再把过渡打开。还要设置 <code>touch-action: pan-y</code>，让纵向滚动仍交给浏览器。</p>
</blockquote>
<p><strong>轮播里的图片怎样优化加载？</strong></p>
<blockquote>
<p>第一张可能是首屏最大内容，应该正常加载；其余几张用 <code>loading=&quot;lazy&quot;</code> 或者在即将切换到时再加载。复制出来的那两张不是真实内容，也可以等到需要显示时再加载。</p>
</blockquote>`};export{e as default};