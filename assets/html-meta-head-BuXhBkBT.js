var e={answerHtml:`<h2>简答</h2>
<ul>
<li>head 里的信息决定字符解释、移动端视口、标题和分享摘要，应与正文一致。</li>
<li>字符编码声明要完整落在文档前 1024 字节内，放在 head 前部。</li>
<li><code>width=device-width, initial-scale=1</code> 设置视口，不要用 <code>user-scalable=no</code> 阻止用户放大。</li>
<li>页面语言写在 html 的 <code>lang</code> 上，canonical 要指向本页的正式地址。</li>
</ul>
<p>head 不是一段复制到每页就再也不用看的“SEO 模板”。浏览器会用它决定如何解释字符、怎样安排移动端视口、标签页显示什么标题；搜索引擎与分享平台则可能读取页面描述、规范地址和预览信息。</p>
<p>这些信息应该与页面正文一致。正文是一道 JavaScript 题，标题却仍然是首页名称，canonical 也指向首页，就会向读取页面的程序提供彼此冲突的信息。</p>
<h2>一个文章页的基础示例</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-meta">&lt;!doctype <span class="hljs-keyword">html</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">html</span> <span class="hljs-attr">lang</span>=<span class="hljs-string">&quot;zh-CN&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">head</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">charset</span>=<span class="hljs-string">&quot;utf-8&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">title</span>&gt;</span>普通函数与箭头函数的 this｜前端学习笔记<span class="hljs-tag">&lt;/<span class="hljs-name">title</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;description&quot;</span>
        <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;通过方法调用、函数拆出与箭头回调的例子，理解 this 的绑定方式及严格模式下的常见错误。&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;canonical&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;https://example.com/questions/js-this/&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;icon&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/favicon.svg&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;image/svg+xml&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:type&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;article&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:title&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;普通函数与箭头函数的 this&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:description&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;用可运行的例子理解 this，而不是只背结论。&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:url&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;https://example.com/questions/js-this/&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">property</span>=<span class="hljs-string">&quot;og:image&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;https://example.com/images/this-cover.png&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">head</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">body</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">main</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>普通函数与箭头函数的 this<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">main</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">body</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">html</span>&gt;</span>
</code></pre></div>
<p>example.com 和图片路径是示例，接入项目时要换成真实、可访问的正式地址。正文在此省略为一个标题，但实际页面必须提供与描述对应的内容；元信息不能替代正文。</p>
<h2>编码和视口首先影响能不能正常阅读</h2>
<p>字符编码应尽早声明，HTML 中的编码声明需要完整落在文档前 1024 字节内。把 charset 放在 head 前部，避免等到加载大量其他标记后才告诉浏览器怎样解释字符；服务端响应的编码信息也应保持一致。</p>
<p>viewport 中的 <code>width=device-width</code> 让移动端布局视口按设备宽度安排，<code>initial-scale=1</code> 指定初始缩放。它不是让所有布局自动变得响应式，固定宽度容器、长代码和大图片仍需处理。</p>
<p>不要为了让排版看起来固定而设置 <code>user-scalable=no</code>，或用最大缩放限制阻止用户放大文字。放大需求不应由错误的固定布局来限制。</p>
<p>示例中的 lang 位于 html 而不是 head，用于表达页面主要语言。它与字体、字符编码不是同一件事，也有助于辅助技术选择合适的朗读语言。</p>
<h2>title 和 description 应当描述当前页面</h2>
<p>title 出现在浏览器标签页等位置，也可能影响搜索结果标题。应让用户能区分不同页面，例如“这道题的标题 + 网站名称”，而不是几百页都叫“首页”。把关键词反复堆进标题会降低可读性，并不等于提高内容相关性。</p>
<p>description 是页面摘要，不是屏幕上必须显示的一段正文。搜索引擎可能采用它，也可能根据查询与正文生成其他摘要，因此不能承诺它会原样出现在每次搜索结果中。</p>
<p>标题、页面主标题和描述不必逐字相同，但应说明同一主题。给一篇基础题写一个夸张但正文没有兑现的描述，只会造成预期错位。</p>
<h2>canonical 表达首选地址，不是跳转规则</h2>
<p>同一篇内容可能通过带统计参数的 URL、不同路径形式等访问。<code>rel=&quot;canonical&quot;</code> 可以表达希望被视为首选的地址，帮助处理重复页面问题，但它不会把用户导航到那个地址，也不是搜索引擎必须无条件接受的命令。</p>
<p>需要真正跳转旧地址时，应使用相应的重定向机制。不同题目的详情页通常应该有各自的规范地址，不能为了省事把所有 canonical 都指向首页。分页、筛选等场景还要判断内容是否真的重复，而不是机械删除所有参数。</p>
<p>规范地址、内部链接、Sitemap 和实际可访问路径应尽量一致，避免一处写 HTTPS、一处写旧域名，或一处使用带尾斜杠的路径、另一处不断跳转。</p>
<h2>robots 元标签与 robots.txt 的职责不同</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;robots&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;noindex&quot;</span> /&gt;</span>
</code></pre></div>
<p>这请求合作的搜索引擎不要把当前页面放入搜索索引。它不是访问控制，也不会阻止普通用户或不遵守约定的程序读取内容。敏感内容仍需要真正的身份认证和权限控制。</p>
<p>robots.txt 主要用于告知爬虫哪些路径不应抓取。若先禁止抓取页面，爬虫可能根本读不到页面里的 noindex，所以“同时禁止抓取并写 noindex”并不等于它已经成功处理了这个索引指令。检查时还要关注响应头里的 X-Robots-Tag，不能只看 HTML。</p>
<p><code>nofollow</code> 与 <code>noindex</code> 也不是同一个指令：前者涉及链接跟随，后者涉及当前页面索引。允许抓取或显式写 index 也不能保证收录，更不能保证特定关键词下的排名。</p>
<p>上线时尤其要检查预览环境的 noindex 是否被复制到了正式站点。反过来，测试环境不该公开的内容，也不能仅靠 noindex 保护。</p>
<h2>分享卡片和网站图标分别处理</h2>
<p>Open Graph 的 og:title、og:description、og:image 等常用于社交分享预览；它们不是 canonical 或正常 title 的替代。分享平台可能缓存旧结果，更新标签后也不一定马上刷新已有卡片。</p>
<p>favicon 主要提供浏览器与部分搜索展示可用的站点图标。图标文件能访问、格式与尺寸符合目标平台要求，是被采用的基础，但不能保证刚部署就出现在每个搜索结果旁。</p>
<p>分享图片应使用实际可访问的地址，并适合目标平台的裁切比例。把本机路径、开发服务器地址或需要登录才能读取的图片写进去，页面自己看起来正常，也可能生成不了公开分享卡片。</p>
<h2>单页应用不能只更新可见正文</h2>
<p>客户端切换路由后，应同步 title、description、canonical 等对应当前页面的信息，并正确替换旧标签，避免不断追加导致同名元信息互相冲突。</p>
<p>对于搜索与分享都很重要的内容，静态生成或服务端输出完整正文和元信息通常更稳妥。不同抓取程序执行 JavaScript 的能力与时机不同，不能仅凭自己打开浏览器后看到正确标题，就认定初始响应里的内容也正确。</p>
<p>检查时既看页面加载后的 DOM，也看网络返回的初始 HTML，并分别核对首页、详情页、无效地址和预览环境。再结合站长平台的抓取结果判断收录问题，而不是只增加一串 meta keywords。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/robots">MDN · robots 元数据</a>、<a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport">MDN · viewport</a>。</p>`};export{e as default};