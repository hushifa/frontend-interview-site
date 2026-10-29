var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>同一张图，手机上显示 390px 宽，桌面上显示 720px 宽，都下载 1920px 的大图就浪费了。<code>srcset</code> 把几种尺寸都列出来，比如 <code>a-480.jpg 480w, a-960.jpg 960w</code>，<code>w</code> 表示这个文件实际有多宽。</p>
<p>光有文件宽度还不够，浏览器还得知道图片显示多宽。因为浏览器要在 CSS 加载之前就开始选图，那时它还不知道布局，所以要用 <code>sizes</code> 告诉它，比如 <code>(width &gt; 800px) 50vw, 100vw</code>。浏览器用显示宽度乘以设备像素比，挑出足够清晰的最小文件。</p>
<p>显示尺寸固定的图片，比如头像，用 <code>1x</code>、<code>2x</code> 描述就够了，不需要 <code>sizes</code>。想提供 AVIF 这种新格式，或者手机上换一张裁成方形的图，用 <code>&lt;picture&gt;</code> 加 <code>&lt;source&gt;</code>。</p>
<p>要注意，<code>&lt;picture&gt;</code> 最后的 <code>&lt;img&gt;</code> 是回退，必须保留。首屏的大图不要懒加载。</p>
</blockquote>
<h2>浏览器到底会选哪张</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero-960.jpg&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero-480.jpg 480w, /hero-960.jpg 960w, /hero-1920.jpg 1920w&quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(width &gt; 1024px) 50vw, 100vw&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1920&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;1080&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;团队在办公室讨论&quot;</span>
&gt;</span>
</code></pre></div>
<p>手机宽 390px，像素比是 3。屏幕不到 1024px，按 <code>100vw</code> 算，图片显示 390px，需要 390 × 3 ≈ 1170px 的文件。960w 不够，所以选 1920w。</p>
<p>桌面宽 1440px，像素比是 1。超过 1024px，按 <code>50vw</code> 算，图片显示 720px，需要 720px 的文件，选 960w 就够了。</p>
<p>如果不写 <code>sizes</code> 会怎样？浏览器默认按 <code>100vw</code> 算。桌面上就会以为图片要显示 1440px 宽，去下载 1920w 的大图，可实际只显示了一半。</p>
<p><code>width</code> 和 <code>height</code> 写的是图片的原始尺寸。浏览器据此提前算出宽高比，图片还没到就占好位置，下面的内容不会跳。</p>
<h2>picture：换格式和换裁切</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">picture</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span> <span class="hljs-attr">media</span>=<span class="hljs-string">&quot;(width &lt; 600px)&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/avif&quot;</span> <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero-square.avif&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span> <span class="hljs-attr">media</span>=<span class="hljs-string">&quot;(width &lt; 600px)&quot;</span> <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero-square.jpg&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/avif&quot;</span> <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/webp&quot;</span> <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero.webp&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero.jpg&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;团队在办公室讨论&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1920&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;1080&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">picture</span>&gt;</span>
</code></pre></div>
<p>浏览器从上往下看，用第一个条件满足的 <code>&lt;source&gt;</code>。</p>
<p>所以顺序很重要。带 <code>media</code> 的方形裁切必须排在前面。假如把通用的 <code>/hero.avif</code> 放到第一个，支持 AVIF 的手机一看格式满足，就直接选中了横版大图，后面的方形版本根本轮不到。</p>
<p><code>alt</code>、<code>loading</code> 这些属性只写在 <code>&lt;img&gt;</code> 上，<code>&lt;source&gt;</code> 只负责提供候选文件。</p>
<h2>加载顺序怎么安排</h2>
<p>首屏的大图通常是 LCP 元素，也就是首屏最大的那块内容。它不要加 <code>loading=&quot;lazy&quot;</code>，可以加 <code>fetchpriority=&quot;high&quot;</code> 让它优先下载。</p>
<p>首屏以下的图片加 <code>loading=&quot;lazy&quot;</code>，滚到附近才下载。</p>
<p><code>decoding=&quot;async&quot;</code> 允许浏览器异步解码图片，减少对主线程的阻塞。</p>
<h2>常见追问</h2>
<p><strong>CSS 背景图怎么做响应式？</strong></p>
<blockquote>
<p>用 <code>image-set()</code>，比如 <code>background-image: image-set(&#x27;a.avif&#x27; type(&#x27;image/avif&#x27;), &#x27;a.jpg&#x27; type(&#x27;image/jpeg&#x27;))</code>，浏览器会挑它支持的格式。</p>
</blockquote>`};export{e as default};