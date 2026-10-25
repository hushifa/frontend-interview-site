var e={answerHtml:`<p>同一张照片在电脑上显示 960 CSS 像素宽，在手机上只显示 358 CSS 像素宽。如果两边都下载 3000 像素宽的原图，手机会浪费流量和解码资源；如果都用 400 像素的小图，宽屏或高像素密度屏幕又可能模糊。</p>
<p>响应式图片把决定拆开：开发者提供合适的候选资源，并告诉浏览器图片大概会显示多大，浏览器再结合设备像素比、缓存等条件选择资源。另一个独立问题是手机是否需要不同的裁切构图，这由 <code>picture</code> 很好地表达。</p>
<h3>用 w 候选描述同一构图的不同尺寸</h3>
<p>假设页面没有侧栏，图片居中，两侧总共保留 32px，最大展示宽度为 960px：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;hero&quot;</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/hero-960.jpg&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;
    /images/hero-480.jpg 480w,
    /images/hero-960.jpg 960w,
    /images/hero-1440.jpg 1440w,
    /images/hero-1920.jpg 1920w
  &quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(min-width: 992px) 960px, calc(100vw - 32px)&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1920&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;1080&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;讲师在白板前说明浏览器的渲染流程&quot;</span>
/&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>;
}

<span class="hljs-selector-class">.hero</span> {
  <span class="hljs-attribute">display</span>: block;
  <span class="hljs-attribute">width</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-number">100%</span> - <span class="hljs-number">32px</span>);
  <span class="hljs-attribute">max-width</span>: <span class="hljs-number">960px</span>;
  <span class="hljs-attribute">height</span>: auto;
  <span class="hljs-attribute">margin-inline</span>: auto;
}
</code></pre></div>
<p>这些路径代表项目需要实际准备的图片文件，候选应保持相同构图和比例。<code>480w</code> 表示该文件真实的固有像素宽度是 480，不是“展示为 480px”，也不是 480KB。不能随意把一个 960 像素的文件标成 <code>480w</code>。</p>
<p><code>sizes</code> 从左往右找第一个满足的媒体条件。视口达到 992px 时，图片槽位按 960 CSS 像素估计；更窄时，按视口宽度减 32px 估计。这与示例 CSS 一致，浏览器无需等待完整布局后才有信息挑选资源。</p>
<p>比如视口宽 390 CSS 像素，槽位约为 358px。在 DPR 为 2 的设备上，理想资源宽度约为 <code>358 × 2 = 716</code> 像素，浏览器可能选择 960w 候选。但这只是帮助理解选择的计算依据，不是强制要求所有浏览器、缓存和网络条件下都发同一个请求。</p>
<p><strong>sizes 不负责设置元素宽度，CSS 才负责实际布局。</strong> 如果页面改成两栏，而 sizes 仍说图片占整屏，浏览器就可能多下载一倍宽度的图片。普通 w 候选使用场景若遗漏 sizes，通常会按接近 <code>100vw</code> 的默认槽位处理，放在小卡片里就容易浪费。</p>
<h3>固定展示尺寸可使用 x 候选</h3>
<p>头像始终显示 48 CSS 像素时，可以按像素密度提供候选：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/avatar-48.png&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/images/avatar-48.png 1x, /images/avatar-96.png 2x&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;48&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;48&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;用户头像&quot;</span>
/&gt;</span>
</code></pre></div>
<p>这里 1x、2x 描述候选对应的像素密度，不需要用 sizes 再计算一个随布局变化的槽位。w 和 x 描述符不要混在同一个 srcset 列表里。展示宽度会大幅变化的文章图，通常更适合 w 加 sizes。</p>
<h3>picture：先选构图或格式，再选资源</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">picture</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span>
    <span class="hljs-attr">media</span>=<span class="hljs-string">&quot;(max-width: 600px)&quot;</span>
    <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/images/speaker-portrait.jpg&quot;</span>
    <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;800&quot;</span>
    <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;1000&quot;</span>
  /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">source</span>
    <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/avif&quot;</span>
    <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/images/speaker-wide.avif&quot;</span>
    <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1600&quot;</span>
    <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;900&quot;</span>
  /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">img</span>
    <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/speaker-wide.jpg&quot;</span>
    <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1600&quot;</span>
    <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;900&quot;</span>
    <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;讲师演示前端调试工具&quot;</span>
    <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;display: block; width: 100%; height: auto&quot;</span>
  /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">picture</span>&gt;</span>
</code></pre></div>
<p>窄屏首先命中竖幅裁切，突出讲师；其他情况下，支持 AVIF 的环境选择横幅 AVIF，否则使用最后的 JPEG。这同时展示了艺术裁切和格式回退，不过实际项目也可以只做其中一种。</p>
<p>浏览器按 source 的顺序、媒体条件和类型支持等规则选合适的集合，不是把所有 source 都下载一遍再比较画质。每个 source 还可以使用自己的 srcset 和 sizes，从而在选定构图后继续选择分辨率。</p>
<p><code>img</code> 不是可省略的占位标签：它承担实际图像元素、替代文本和回退资源。source 被选中后如果资源本身损坏或返回错误，也不能把 picture 当成保证自动逐项尝试的网络容灾方案。</p>
<h3>尺寸提示、懒加载和优先级要配合</h3>
<p>为 img 提供与资源比例对应的 width、height，可以在下载前预留空间。CSS 的 <code>width: 100%; height: auto</code> 仍然允许响应式缩放，不代表图片必须按属性中的像素尺寸显示。</p>
<p>不同裁切比例切换时，只保留一组横幅尺寸可能造成空间预留错误。可以像示例一样给对应 source 提供宽高提示，并结合目标浏览器验证；必要时用匹配媒体条件的 <code>aspect-ratio</code> 布局明确预留比例。</p>
<p>首屏关键图，特别是可能成为 LCP 的图片，不应统一设置 <code>loading=&quot;lazy&quot;</code>。非首屏图可使用懒加载降低初始请求量；确实需要提前获取的关键图片，可以评估 <code>fetchpriority=&quot;high&quot;</code>，但不应给所有图片都标高优先级。</p>
<p>验证时查看 <code>img.currentSrc</code> 和 Network 实际请求，并核对 CSS 展示宽度、设备像素比和下载体积。缩小窗口后浏览器可能继续复用已经下载的大图，因此测试不同尺寸应结合冷缓存和重新导航。即便候选选对，图片的压缩质量、解码成本和实际内容仍需要单独优化。</p>`};export{e as default};