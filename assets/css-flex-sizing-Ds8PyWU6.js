var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器先给每个项目一个初始大小，就是 <code>flex-basis</code>。容器的尺寸减去这些初始大小的总和，就是剩余空间。</p>
<p>剩余空间是正的，说明有多，按 <code>flex-grow</code> 的比例分给各项目。是负的，说明不够，要缩，按 <code>flex-shrink × flex-basis</code> 的比例分摊，大的多缩，小的少缩。</p>
<p>常用简写要记住：<code>flex: 1</code> 等于 <code>1 1 0%</code>，忽略内容大小，平分全部空间；<code>flex: auto</code> 等于 <code>1 1 auto</code>，先按内容占位再分剩下的；<code>flex: none</code> 等于 <code>0 0 auto</code>，保持内容尺寸，不伸也不缩。</p>
<p>最常踩的坑是 flex 项目默认 <code>min-width: auto</code>，不会缩得比最长的单词或图片还窄，内容就会溢出。想让它能缩，要写 <code>min-width: 0</code>。</p>
</blockquote>
<h2>空间有多时怎么分</h2>
<p>容器宽 600px，两个项目的 <code>flex-basis</code> 都是 100px，<code>flex-grow</code> 分别是 1 和 2。</p>
<p>两个项目先占掉 200px，剩余 600 − 200 = 400px。这 400px 按 1:2 分，第一个分到三分之一，第二个分到三分之二。所以第一个是 100 + 400 × 1/3 ≈ 233px，第二个是 100 + 400 × 2/3 ≈ 367px。</p>
<p>要注意，<code>flex-grow</code> 分的是剩余空间，不是总宽度。所以最后两个项目的宽度并不是 1:2。</p>
<h2>空间不够时怎么缩</h2>
<p>容器宽 300px，两个项目的 <code>flex-basis</code> 分别是 200px 和 400px，<code>flex-shrink</code> 都是 1。</p>
<p>两个加起来 600px，要缩掉 600 − 300 = 300px。收缩权重是 <code>flex-shrink</code> 乘以 <code>flex-basis</code>，第一个是 200 × 1 = 200，第二个是 400 × 1 = 400，比例 1:2。所以第一个缩 300 × 200/600 = 100px，剩 100px；第二个缩 200px，剩 200px。</p>
<p>为什么收缩要乘以 basis，不直接按 <code>flex-shrink</code> 平分？如果平分，两个项目各缩 150px，第一个只剩 50px，小的项目会先被压得没法看。乘上 basis 以后，大项目多缩、小项目少缩，缩完比例还是 1:2。</p>
<h2>内容为什么溢出了容器</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.main</span> {
  <span class="hljs-attribute">flex</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<p><code>.main</code> 里放了很长的代码行或者宽表格。不写 <code>min-width: 0</code> 时，你会发现它怎么都缩不下去，整行撑出了容器。</p>
<p>原因是 flex 项目的 <code>min-width</code> 默认是 <code>auto</code>，意思是最小不能比内容的最小宽度还窄。长代码行没法断开，它的最小宽度就是整行那么长。</p>
<p>写上 <code>min-width: 0</code>，项目就能缩到比内容窄，内容自己去滚动或者换行。另外，某个项目被最小宽度卡住缩不下去时，浏览器会把还需要缩的量重新分给其他项目。</p>
<h2>几种常见写法</h2>
<p><code>flex: 1</code> 让项目平分空间，不管内容多宽。<code>flex: auto</code> 让内容多的项目分得更多。<code>flex: none</code> 把项目固定为内容尺寸。<code>flex: 0 0 240px</code> 常用来做固定 240px 宽的侧栏，不伸也不缩。</p>
<h2>常见追问</h2>
<p><strong><code>flex-basis</code> 和 <code>width</code> 都写了，听谁的？</strong></p>
<blockquote>
<p><code>flex-basis</code> 不是 <code>auto</code> 时，听 <code>flex-basis</code> 的。只有 <code>flex-basis: auto</code> 时，才用 <code>width</code> 作为初始大小。</p>
</blockquote>`};export{e as default};