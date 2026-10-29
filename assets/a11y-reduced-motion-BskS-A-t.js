var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>有一类用户前庭功能有障碍，看到大面积的移动、缩放、视差，可能会头晕、恶心。系统设置里的“减少动态效果”就是为他们准备的，网页可以读到这个设置：CSS 用 <code>@media (prefers-reduced-motion: reduce)</code>，JavaScript 用 <code>matchMedia(&#x27;(prefers-reduced-motion: reduce)&#x27;)</code>。</p>
<p>减少不等于全部删掉。把位移和缩放换成淡入淡出，或者直接切换；加载指示、焦点变化这些反馈仍然要有，状态变化本身不能丢。</p>
<p>WCAG 里有两条相关要求。自动播放、持续超过 5 秒的动画要能暂停（2.2.2）；由交互触发的动画要能关闭（2.3.3，AAA 级）。</p>
<p>还要注意，用户可能在页面开着的时候改设置，所以长时间运行的动画要监听 <code>change</code> 事件。</p>
</blockquote>
<h2>CSS 怎么写</h2>
<p>下面是一个卡片入场动画，默认从下往上滑入并淡入。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">transition</span>: transform <span class="hljs-number">300ms</span>, opacity <span class="hljs-number">300ms</span>;
}

<span class="hljs-selector-class">.card</span><span class="hljs-selector-class">.enter</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">24px</span>);
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.card</span> {
    <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">150ms</span>;
  }

  <span class="hljs-selector-class">.card</span><span class="hljs-selector-class">.enter</span> {
    <span class="hljs-attribute">transform</span>: none;
  }
}
</code></pre></div>
<p>开启减少模式后，位移被去掉了，只保留透明度变化。用户还是能看出卡片“出现了”，只是不会看到它在动。</p>
<p>也可以反过来写：默认没有动画，只在用户没要求减少时才启用。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: no-preference) {
  <span class="hljs-selector-class">.hero</span> {
    <span class="hljs-attribute">animation</span>: float <span class="hljs-number">6s</span> ease-in-out infinite;
  }
}
</code></pre></div>
<p>这种写法的好处是，不支持这个媒体查询的环境默认就是安静的。</p>
<h2>JavaScript 怎么写</h2>
<p>用脚本播放动画时，先查一下偏好。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> query = <span class="hljs-title function_">matchMedia</span>(<span class="hljs-string">&#x27;(prefers-reduced-motion: reduce)&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">playIntro</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">if</span> (query.<span class="hljs-property">matches</span>) {
    element.<span class="hljs-property">style</span>.<span class="hljs-property">opacity</span> = <span class="hljs-string">&#x27;1&#x27;</span>;
    <span class="hljs-keyword">return</span>;
  }
  element.<span class="hljs-title function_">animate</span>(
    [{ <span class="hljs-attr">opacity</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">transform</span>: <span class="hljs-string">&#x27;scale(0.9)&#x27;</span> }, { <span class="hljs-attr">opacity</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">transform</span>: <span class="hljs-string">&#x27;none&#x27;</span> }],
    { <span class="hljs-attr">duration</span>: <span class="hljs-number">400</span>, <span class="hljs-attr">easing</span>: <span class="hljs-string">&#x27;ease-out&#x27;</span> },
  );
}

query.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-comment">// 偏好变化时停止正在运行的循环动画</span>
});
</code></pre></div>
<p>要求减少时，直接把元素设成最终状态，跳过缩放动画。<code>change</code> 监听用来处理用户中途改了设置的情况。</p>
<p>你可能注意到这里没写 <code>fill: &#x27;forwards&#x27;</code>。这是故意的：动画结束后元素回到自身的样式，之后再通过 CSS 或脚本设置 <code>transform</code> 时，不会被动画的结果盖住。</p>
<h2>哪些动画需要处理</h2>
<p>视差滚动、整页缩放过渡、背景视频、无限循环的装饰动画，都属于要处理的范围。Canvas、WebGL 场景里的镜头移动也一样。</p>
<p>容易漏掉的是平滑滚动。点锚点时的 <code>scroll-behavior: smooth</code> 也是一种大幅移动，减少模式下应该改成 <code>auto</code>。</p>
<h2>常见追问</h2>
<p><strong>用户没开系统选项，但觉得动画太多怎么办？</strong></p>
<blockquote>
<p>可以在网站自己的设置里提供一个“减少动画”开关，和系统偏好一起生效，任何一边要求减少就减少。</p>
</blockquote>`};export{e as default};