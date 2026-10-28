var e={answerHtml:`<h2>简答</h2>
<ul>
<li>普通 <code>&lt;script src&gt;</code>：解析到这里就停下，下载并执行完才继续，放在 head 里会推迟页面显示。</li>
<li><code>defer</code>：下载不阻塞解析，在 HTML 解析完、<code>DOMContentLoaded</code> 之前按书写顺序执行。</li>
<li><code>async</code>：下载不阻塞解析，下载完马上执行，多个 async 脚本谁先下载完谁先执行。</li>
<li><code>type=&quot;module&quot;</code>：默认像 <code>defer</code>，可以加 <code>async</code>；支持 <code>import</code>、自动严格模式、顶层变量不进全局，同一模块只执行一次。</li>
<li>依赖页面 DOM 或其他脚本的代码用 <code>defer</code> 或模块；独立的统计、广告脚本用 <code>async</code>。</li>
</ul>
<h2>时间线</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">普通：  解析 ──停──[下载][执行]── 继续解析
defer： 解析 ─────────────────────── 完成 → [执行]
          └──[下载]──┘
async： 解析 ─────停──[执行]── 继续解析
          └──[下载]┘
</code></pre></div>
<h2>写法</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">head</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/app.js&quot;</span> <span class="hljs-attr">defer</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;module&quot;</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/main.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://analytics.example.com/a.js&quot;</span> <span class="hljs-attr">async</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">head</span>&gt;</span>
</code></pre></div>
<ul>
<li><code>defer</code> 和 <code>async</code> 只对外部脚本生效，内联脚本写了也没用；内联模块脚本可以加 <code>async</code>。</li>
<li>模块脚本跨源加载需要 CORS 响应头。</li>
<li>动态创建的 <code>&lt;script&gt;</code> 默认就是 async，需要顺序时设置 <code>script.async = false</code>。</li>
</ul>
<h2>下载不阻塞不等于不卡</h2>
<p>脚本执行仍然占用主线程。大的打包文件即使用了 <code>defer</code>，执行时也会推迟交互。减少首屏 JavaScript、按路由拆分代码，比调整属性更重要。</p>
<h2>预加载</h2>
<ul>
<li><code>&lt;link rel=&quot;modulepreload&quot; href=&quot;/chunk.js&quot;&gt;</code> 提前下载并解析模块依赖。</li>
<li><code>&lt;link rel=&quot;preload&quot; as=&quot;script&quot;&gt;</code> 提前下载普通脚本，但不会执行。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>脚本放在 body 末尾和 head 里加 defer 有什么区别？两者都不阻塞解析。<code>defer</code> 让浏览器更早发现并开始下载脚本，所以通常更快。</li>
</ul>`};export{e as default};