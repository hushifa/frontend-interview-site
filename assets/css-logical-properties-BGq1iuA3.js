var e={answerHtml:`<h2>简答</h2>
<ul>
<li>inline 方向是文字排列的方向，block 方向是行堆叠的方向；<code>start</code> 和 <code>end</code> 分别指起点和终点。</li>
<li>横排中文和英文里，<code>margin-inline-start</code> 等于 <code>margin-left</code>；阿拉伯语（<code>dir=&quot;rtl&quot;</code>）里等于 <code>margin-right</code>。</li>
<li>竖排（<code>writing-mode: vertical-rl</code>）时，inline 变为上下方向，<code>inline-size</code> 对应高度。</li>
<li>常用对照：<code>width</code> → <code>inline-size</code>，<code>padding-left</code> → <code>padding-inline-start</code>，<code>top</code> → <code>inset-block-start</code>，<code>text-align: left</code> → <code>text-align: start</code>。</li>
<li>方向由 HTML 的 <code>dir</code> 属性设置，样式里不需要再为 RTL 写一套覆盖规则。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.message</span> {
  <span class="hljs-attribute">padding-inline</span>: <span class="hljs-number">16px</span>;
  <span class="hljs-attribute">margin-block-end</span>: <span class="hljs-number">8px</span>;
  <span class="hljs-attribute">border-inline-start</span>: <span class="hljs-number">4px</span> solid steelblue;
  <span class="hljs-attribute">text-align</span>: start;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;message&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;ltr&quot;</span>&gt;</span>Saved<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;message&quot;</span> <span class="hljs-attr">dir</span>=<span class="hljs-string">&quot;rtl&quot;</span>&gt;</span>تم الحفظ<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p>两条消息的色条分别出现在左侧和右侧，不需要额外样式。</p>
<h2>简写</h2>
<ul>
<li><code>margin-inline: 0 auto</code> 依次是 start 和 end。</li>
<li><code>inset-inline: 0</code> 同时设置左右两侧（横排时）。</li>
<li><code>padding-block: 8px</code> 同时设置上下。</li>
</ul>
<p>注意 <code>margin: 1px 2px 3px 4px</code> 这类四值简写仍然是物理方向。</p>
<h2>不需要转换的地方</h2>
<ul>
<li>和书写方向无关的视觉效果，例如阴影偏移、背景位置、以屏幕为基准的固定悬浮按钮，可以继续用物理属性。</li>
<li>图标是否需要镜像要看含义：箭头、返回按钮通常镜像，时钟、播放按钮不镜像。用 <code>:dir(rtl)</code> 处理图标翻转。</li>
<li><code>transform: translateX()</code> 没有逻辑版本，RTL 下需要单独处理方向。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>flex 和 grid 需要改吗？不需要。<code>flex-direction: row</code>、<code>justify-content: flex-start</code> 本身就跟随书写方向，RTL 下自动从右往左排。</li>
</ul>`};export{e as default};