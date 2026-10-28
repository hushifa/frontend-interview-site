var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先算每个项目的 <code>flex-basis</code>，再用容器尺寸减去它们的总和，得到剩余空间。</li>
<li>剩余空间为正时，按 <code>flex-grow</code> 的比例分给各项目；为负时，按 <code>flex-shrink × flex-basis</code> 的比例分摊收缩量。</li>
<li>flex 项目默认 <code>min-width: auto</code>，不会缩到比最长单词或图片更窄；需要能缩时设 <code>min-width: 0</code>。</li>
<li><code>flex: 1</code> 等于 <code>1 1 0%</code>，各项目平分全部空间；<code>flex: auto</code> 等于 <code>1 1 auto</code>，先按内容占位再分剩余。</li>
<li><code>flex: none</code> 等于 <code>0 0 auto</code>，项目保持内容尺寸，不伸也不缩。</li>
</ul>
<h2>放大</h2>
<p>容器 600px，两个项目 <code>flex-basis</code> 都是 100px，<code>flex-grow</code> 分别为 1 和 2：</p>
<ul>
<li>剩余空间：600 − 200 = 400px。</li>
<li>第一个：100 + 400 × 1/3 ≈ 233px；第二个：100 + 400 × 2/3 ≈ 367px。</li>
</ul>
<h2>收缩</h2>
<p>容器 300px，两个项目 <code>flex-basis</code> 分别是 200px 和 400px，<code>flex-shrink</code> 都是 1：</p>
<ul>
<li>需要收缩：600 − 300 = 300px。</li>
<li>收缩权重：200 × 1 = 200，400 × 1 = 400。</li>
<li>第一个缩 300 × 200/600 = 100px，得 100px；第二个缩 200px，得 200px。</li>
</ul>
<p>收缩乘以 basis，是为了让大项目多缩、小项目少缩，避免小项目先被压没。</p>
<h2>min-width: auto 的影响</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.main</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<p><code>.main</code> 里有很长的代码行或表格时，不加 <code>min-width: 0</code> 它不会缩到小于内容宽度，整行会溢出容器。项目被约束卡住后，浏览器会把剩下的空间重新分给其他项目。</p>
<h2>常见写法</h2>
<table><thead><tr><th>写法</th><th>含义</th></tr></thead><tbody><tr><td><code>flex: 1</code></td><td>平分空间，忽略内容宽度</td></tr><tr><td><code>flex: auto</code></td><td>内容大的项目分得更多</td></tr><tr><td><code>flex: none</code></td><td>固定为内容尺寸</td></tr><tr><td><code>flex: 0 0 240px</code></td><td>固定 240px 的侧栏</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li><code>flex-basis</code> 和 <code>width</code> 哪个优先？两者都设置时 <code>flex-basis</code>（非 <code>auto</code>）优先，<code>flex-basis: auto</code> 时才使用 <code>width</code>。</li>
</ul>`};export{e as default};