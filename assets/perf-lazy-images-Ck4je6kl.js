var e={answerHtml:`<h2>懒加载把成本推迟到什么时候</h2>
<p>打开题库后，用户马上展开第一题。如果题解、Markdown 解析器和代码高亮库都在点击后才下载，首屏确实少了代码，但用户要在第一次展开时支付模块发现、下载、解析和渲染的全部等待。之后展开其他题很快，可能只是依赖已经进入缓存。</p>
<p>因此懒加载不是“越多越好”，而是把低概率、非关键资源从当前路径移开。首屏大图、首个交互需要的内容和用户几乎必然打开的模块，延后反而可能损害体验。</p>
<h2>关键图片不要盲目 lazy</h2>
<p>首屏主图可能是 LCP 元素，应让浏览器尽早发现并提供尺寸：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/hero.webp&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1200&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;600&quot;</span>
  <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;产品使用场景&quot;</span>
/&gt;</span>
</code></pre></div>
<p>下方相册、低频弹窗和编辑器更适合延后。<code>fetchpriority</code> 只是相对优先级提示，不会让网络变快；每张图都设为 high 只会让关键资源互相竞争。真正的选择依据是实际访问路径、LCP 和设备网络数据。</p>
<h2>图片懒加载仍要稳定布局</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/images/card-640.webp&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/images/card-640.webp 640w, /images/card-1280.webp 1280w&quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(max-width: 700px) 100vw, 640px&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1280&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;720&quot;</span>
  <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;组件布局示例&quot;</span>
/&gt;</span>
</code></pre></div>
<p><code>width</code> 和 <code>height</code> 让浏览器预留比例空间，减少图片到达时的 CLS。<code>srcset</code> 和 <code>sizes</code> 必须反映真实布局，否则可能下载过大的候选图。原生 <code>loading=&quot;lazy&quot;</code> 的提前距离由浏览器决定，不是精确的“进入视口才加载”；自定义 IntersectionObserver 也应留提前量。</p>
<p>懒加载不能替代压缩、合适格式和响应式尺寸。推迟一张超大图片，只是把带宽和解码成本移到了后面。</p>
<h2>避免把首次交互变成串行瀑布</h2>
<p>如果点击后必须先下载组件、组件启动后才请求数据、数据返回后才加载高亮语言，用户会遇到多次串行等待。已知用户意图出现时，可以让模块和数据并行准备，或在聚焦入口、即将进入视口时预取。</p>
<p>预取也有预算。触控设备没有鼠标悬停，预取不能成为功能正常工作的必要前提；首屏一次性预取所有低频模块，又会挤占关键资源。小而高频的组件有时直接随首屏提供，比拆成懒块更快。</p>
<p>静态题解还可以在构建阶段完成 Markdown 解析和代码高亮，浏览器只加载展示结果。是否这样做，要比较构建产物、缓存复用和内容更新方式，而不是只看代码拆得更细。</p>
<h2>加载失败和旧版本要有恢复路径</h2>
<p>动态 import、图片和数据请求都可能失败。界面需要错误说明、重试和取消/忽略过期结果的策略。旧页面引用已经删除的异步 chunk 时，继续无限重试没有意义，应提示刷新并保护未保存输入。</p>
<p>自定义懒加载不能把真实地址全部藏在 <code>data-*</code> 后再假设脚本永远成功；脚本失败时仍应有合理的图片占位、alt 和错误状态。长页面快速滚动、打印和弱网也是验收场景。</p>
<p>评估时至少比较冷缓存首屏、首次展开、后续展开和弱网：看资源发现、下载、执行、渲染以及用户完成任务的等待。bundle 文件数量变多不是收益本身，只有真实关键路径变快才说明懒加载策略正确。</p>`};export{e as default};