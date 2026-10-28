var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>srcset=&quot;a-480.jpg 480w, a-960.jpg 960w&quot;</code> 用 <code>w</code> 描述每个文件的实际宽度。</li>
<li><code>sizes=&quot;(width &gt; 800px) 50vw, 100vw&quot;</code> 描述图片的显示宽度；浏览器在 CSS 加载前就要选图，所以需要这个提示。</li>
<li>浏览器用显示宽度乘以设备像素比，选出足够清晰的最小文件。</li>
<li>固定显示尺寸的图片（如头像）用 <code>1x</code>、<code>2x</code> 描述符即可，不需要 <code>sizes</code>。</li>
<li><code>&lt;picture&gt;</code> 的 <code>&lt;source type=&quot;image/avif&quot;&gt;</code> 提供新格式，<code>media</code> 条件用于在不同屏幕显示不同裁切；最后的 <code>&lt;img&gt;</code> 是回退，必须保留。</li>
</ul>
<h2>宽度描述符</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero-960.jpg&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero-480.jpg 480w, /hero-960.jpg 960w, /hero-1920.jpg 1920w&quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(width &gt; 1024px) 50vw, 100vw&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1920&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;1080&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;团队在办公室讨论&quot;</span>
&gt;</span>
</code></pre></div>
<p>手机宽 390px、像素比 3 时，需要约 1170px，浏览器选 1920w。桌面 1440px 宽、像素比 1，图片显示 720px，选 960w。没有 <code>sizes</code> 时默认按 <code>100vw</code> 计算，桌面上会下载过大的图片。</p>
<p><code>width</code> 和 <code>height</code> 让浏览器提前算出宽高比，图片到达前就占好位置，避免布局偏移。</p>
<h2>picture</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">picture</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/avif&quot;</span> <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/webp&quot;</span> <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero.webp&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span> <span class="hljs-attr">media</span>=<span class="hljs-string">&quot;(width &lt; 600px)&quot;</span> <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/hero-square.jpg&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero.jpg&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;团队在办公室讨论&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1920&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;1080&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">picture</span>&gt;</span>
</code></pre></div>
<p>浏览器按顺序使用第一个匹配的 <code>&lt;source&gt;</code>。<code>alt</code>、<code>loading</code> 等属性只写在 <code>&lt;img&gt;</code> 上。</p>
<h2>加载优先级</h2>
<ul>
<li>首屏的大图（通常是 LCP 元素）不要加 <code>loading=&quot;lazy&quot;</code>，可以加 <code>fetchpriority=&quot;high&quot;</code>。</li>
<li>首屏以下的图片加 <code>loading=&quot;lazy&quot;</code>，进入视口附近才下载。</li>
<li><code>decoding=&quot;async&quot;</code> 允许浏览器异步解码，减少对主线程的阻塞。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>CSS 背景图怎么做响应式？用 <code>image-set()</code>，例如 <code>background-image: image-set(&#x27;a.avif&#x27; type(&#x27;image/avif&#x27;), &#x27;a.jpg&#x27; type(&#x27;image/jpeg&#x27;))</code>。</li>
</ul>`};export{e as default};