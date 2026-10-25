var e={answerHtml:`<p>懒加载不是让资源变小，而是推迟下载或执行。如果被推迟的内容恰好是用户马上要看的，节省的首屏工作就会变成用户眼前的等待。</p>
<p>例如用户打开题库后立即展开第一题，页面这时才下载答案、Markdown 解析器和高亮库，再解析、渲染。初始 JavaScript 虽然减少了，首次展开却要承担完整链路。之后再点其他题很快，只能说明部分依赖已经缓存，不能证明首次体验没有问题。</p>
<h3>先分清“首屏关键”与“暂时不需要”</h3>
<p>首屏大图可能成为 LCP 元素。如果给它加 loading=&quot;lazy&quot;，浏览器可能要等布局判断接近视口后才发起请求，增加资源发现延迟。关键图片通常应让 HTML 尽早暴露地址，并根据实际情况提高优先级：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/hero.webp&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1200&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;600&quot;</span>
  <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;产品使用场景&quot;</span>
/&gt;</span>
</code></pre></div>
<p>下方相册、低频弹窗或用户不一定访问的编辑器，则更适合按需加载。判断依据是实际页面结构和访问路径，而不是统一给所有图片、路由和组件加 lazy。</p>
<p>fetchpriority 只是相对优先级提示，不会让慢网变快，也不能绕过资源还未被发现的问题。不要把每张图都标成 high，否则关键资源仍要与其他资源竞争。</p>
<h3>图片延后加载仍要正确选尺寸和占位</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/gallery-640.webp&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/images/gallery-640.webp 640w, /images/gallery-1280.webp 1280w&quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(max-width: 700px) 100vw, 640px&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1280&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;720&quot;</span>
  <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;组件布局示例&quot;</span>
/&gt;</span>
</code></pre></div>
<p>width/height 为浏览器提供比例信息，减少图片出现时挤动周围内容；CSS 仍可让图片响应式缩放。sizes 应反映真实布局，不能随意复制，否则浏览器可能选择过大的候选图。</p>
<p>原生 lazy 的加载距离和策略由浏览器决定，不是“刚好进入视口才请求”的精确承诺。自定义 IntersectionObserver 加载也应留提前量，让滚动到图片之前有机会下载完成。</p>
<p>懒加载不能替代压缩、合适格式和正确尺寸。推迟下载一张不必要的超大图，最终仍然要支付它的带宽与解码成本。</p>
<h3>避免把依赖串成点击后的瀑布</h3>
<p>如果必须先下载组件，再执行组件代码后才发现数据请求，首次操作就经历串行等待。可以让已知的数据和模块并行准备，或者在明确的用户意图出现时预取，例如键盘聚焦或指针进入入口。</p>
<p>低频的大型功能仍值得拆分；小而高频的内容可能直接随页面提供更合算。静态题解这类内容，还可以在构建阶段完成 Markdown 解析与高亮，浏览器只加载展示结果，避免首次展开再下载处理库。</p>
<p>预取也要有预算。不能因为担心首次等待，就在首屏一次性预取所有低频模块；这会重新挤占关键资源，浪费用户流量。触控用户也没有鼠标悬停，所以预取不能成为功能正常工作的必要前提。</p>
<h3>加载态要覆盖失败，而不只是转圈</h3>
<p>动态 import 和数据请求都可能失败。组件应有错误提示、重试入口和取消或忽略过期结果的机制。发布后旧页面引用已删除的 chunk 也可能加载失败，这与性能慢是不同问题，不能无限重试同一个失效地址。</p>
<p>对图片要保留合适的 alt 和错误体验；不要为了自定义懒加载把全部真实地址藏在 data 属性里，却没有考虑脚本失败后的展示路径。打印和长页面快速滚动也值得检查。</p>
<p>评估时同时测冷缓存首屏、首次展开、后续展开与弱网，查看请求发现时间、下载、执行和渲染各占多少。只有用户完成任务的等待减少，才说明懒加载策略选对了；bundle 文件数量变多本身不是收益。</p>`};export{e as default};