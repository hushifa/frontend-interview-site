var e={answerHtml:`<h2>简答</h2>
<ul>
<li>字号和主要间距用 <code>rem</code>，用户在浏览器设置里调大默认字号时页面会一起放大；用 <code>px</code> 写死字号会忽略这一设置。</li>
<li><code>em</code> 相对当前元素的字号，按钮内边距用 <code>em</code>，按钮变大时内边距一起变大；嵌套使用时会逐层叠加。</li>
<li>百分比的参照因属性而异：<code>width</code> 参照包含块宽度，<code>padding</code> 和 <code>margin</code> 也参照包含块宽度（包括上下方向），<code>transform: translate</code> 参照元素自身。</li>
<li>移动端 <code>100vh</code> 等于工具栏收起时的大视口，页面初次加载时底部会被遮住；<code>100svh</code> 是工具栏展开时的小视口，<code>100dvh</code> 随工具栏实时变化。</li>
<li>边框、阴影等不需要随字号缩放的细节用 <code>px</code>。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">html</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">100%</span>;
}

<span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-selector-class">.button</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1.125rem</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">0.5em</span> <span class="hljs-number">1em</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid;
}

<span class="hljs-selector-class">.hero</span> {
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">100s</span>vh;
}
</code></pre></div>
<p>把根字号设成 <code>62.5%</code> 让 1rem 等于 10px 的写法会改变用户的默认字号基准，现在一般不推荐。</p>
<h2>视口单位怎么选</h2>
<table><thead><tr><th>单位</th><th>含义</th><th>适合</th></tr></thead><tbody><tr><td><code>svh</code></td><td>工具栏全部展开时的高度</td><td>首屏必须完整可见</td></tr><tr><td><code>lvh</code></td><td>工具栏全部收起时的高度</td><td>背景、装饰</td></tr><tr><td><code>dvh</code></td><td>当前实际高度，会变化</td><td>全屏应用外壳</td></tr></tbody></table>
<p><code>dvh</code> 在滚动时会随工具栏变化，元素高度跟着跳动，所以不要在长页面的普通区块上使用。</p>
<h2>其他常用单位</h2>
<ul>
<li><code>ch</code>：当前字体中“0”的宽度，<code>max-inline-size: 65ch</code> 常用于控制正文行宽。</li>
<li><code>lh</code>：当前行高，适合按行数设置高度。</li>
<li><code>cqi</code>：容器查询单位，相对查询容器的行内尺寸。</li>
<li><code>vw</code> 包含滚动条宽度，<code>width: 100vw</code> 在有滚动条的桌面上会出现横向滚动。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>字号要不要随屏幕缩放？可以用 <code>clamp(1rem, 0.9rem + 0.5vw, 1.25rem)</code>，但必须包含 <code>rem</code> 部分，否则用户放大页面时字号不会变。</li>
</ul>`};export{e as default};