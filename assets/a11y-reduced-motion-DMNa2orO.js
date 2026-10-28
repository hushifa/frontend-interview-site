var e={answerHtml:`<h2>简答</h2>
<ul>
<li>前庭功能障碍的用户在看到大面积移动、缩放、视差时可能头晕、恶心，系统里的“减少动态效果”就是为他们设置的。</li>
<li>CSS 用 <code>@media (prefers-reduced-motion: reduce)</code>，JavaScript 用 <code>matchMedia(&#x27;(prefers-reduced-motion: reduce)&#x27;)</code>。</li>
<li>减少不等于全部删除：把位移和缩放改成淡入淡出或直接切换，加载指示和焦点变化仍然要有。</li>
<li>自动播放、超过 5 秒的动画要能暂停（WCAG 2.2.2）；由交互触发的动画要能关闭（WCAG 2.3.3，AAA）。</li>
<li>设置可能在页面打开期间变化，长生命周期的动画要监听 <code>change</code> 事件。</li>
</ul>
<h2>CSS</h2>
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
<p>减少模式下保留透明度变化，去掉位移。</p>
<p>也可以反过来写：默认无动画，只在用户没有要求减少时启用：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: no-preference) {
  <span class="hljs-selector-class">.hero</span> {
    <span class="hljs-attribute">animation</span>: float <span class="hljs-number">6s</span> ease-in-out infinite;
  }
}
</code></pre></div>
<h2>JavaScript</h2>
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
<p>示例只设置了动画过程，没有使用 <code>fill: &#x27;forwards&#x27;</code>。动画结束后元素回到自身样式，后续通过 CSS 或脚本设置的 <code>transform</code> 不会被动画结果覆盖。</p>
<h2>哪些需要处理</h2>
<ul>
<li>视差滚动、整页缩放过渡、背景视频、无限循环的装饰动画。</li>
<li>滚动到锚点时的平滑滚动：<code>scroll-behavior: smooth</code> 也应在减少模式下改为 <code>auto</code>。</li>
<li>Canvas、WebGL 场景中的相机移动。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>用户没设置系统选项，但觉得动画多怎么办？可以在网站设置里提供“减少动画”开关，与系统偏好叠加使用。</li>
</ul>`};export{e as default};