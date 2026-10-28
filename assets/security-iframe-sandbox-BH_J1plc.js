var e={answerHtml:`<h2>简答</h2>
<ul>
<li>sandbox 从最少权限开始，空值会限制脚本、表单、弹窗和顶层导航。</li>
<li>allow-same-origin 只保留文档原本的源，不会让跨源页面变成同源。</li>
<li>同源内容同时开放 allow-scripts 和 allow-same-origin，可以移除沙箱，等于失效。</li>
<li>sandbox 还需配合 frame-ancestors 和 Permissions Policy。</li>
</ul>
<p>iframe 提供一个独立的浏览上下文，但不代表其中的内容天然没有权限。sandbox 用来进一步收紧这个上下文的能力，适合展示不完全可信的内容或约束第三方组件。</p>
<p>一个常见误解是“写了很多 allow-* 才更安全”。实际顺序恰好相反：<strong>空 sandbox 施加一组限制，每增加一个允许项，都在撤掉对应限制</strong>。</p>
<h2>从最少权限开始</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">iframe</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://preview.example.net/article/42&quot;</span>
  <span class="hljs-attr">title</span>=<span class="hljs-string">&quot;文章预览&quot;</span>
  <span class="hljs-attr">sandbox</span>
&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>
</code></pre></div>
<p>空 sandbox 会限制脚本、表单提交、弹窗、顶层导航等行为，并把文档视为特殊的不透明源。若预览只是展示静态内容，可能根本不需要开放脚本。</p>
<p>如果预览确实需要运行交互脚本，可以只放开脚本：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">iframe</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://preview.example.net/article/42&quot;</span>
  <span class="hljs-attr">title</span>=<span class="hljs-string">&quot;交互预览&quot;</span>
  <span class="hljs-attr">sandbox</span>=<span class="hljs-string">&quot;allow-scripts&quot;</span>
&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>
</code></pre></div>
<p>这不会同时放开表单提交或弹窗，也不会恢复正常来源身份。脚本能执行与脚本能访问哪些页面，是两种不同的权限。</p>
<h2>allow-same-origin 不会把跨源页面变成同源</h2>
<p>这个名字容易误导：它的作用是保留文档原本的来源，而不是让 iframe 与父页面强行同源。原本来自另一个源的文档，增加此项后依然受同源策略约束。</p>
<p>不加它时，沙箱文档使用不透明源，部分存储和依赖来源的 API 会受限。postMessage 消息中的 origin 也可能显示为字符串 <code>&quot;null&quot;</code>，不能因为看到 null 就认定消息来自某个特定可信 iframe。</p>
<p>不要把不透明源等同于“完全没有网络或凭证”。资源加载、导航和 Cookie 还有各自规则；sandbox 不是一条禁止所有请求的网络防火墙。</p>
<h2>同源页面同时开放脚本和来源尤其危险</h2>
<p>如果 iframe 内容与父页面同源，又同时设置 <code>allow-scripts allow-same-origin</code>，子页面脚本可能访问父页面中的 iframe 元素，移除 sandbox 属性，并通过重新加载摆脱原先的限制。</p>
<p>重点在于“同源、能执行脚本、能操作宿主元素”组合在一起。只说两个 token 永远不能同时出现也不准确：真正跨源的受信应用可能确实需要它们，但此时不能再把 sandbox 当作唯一隔离保障，应使用独立来源并审查后续导航和授权能力。</p>
<p>修改或移除 sandbox 属性并不会简单地让已经加载的文档当场获得全部新权限；相关限制与文档加载过程有关。验证逃逸或收紧效果时，应把后续导航、重新加载也纳入测试。</p>
<h2>弹窗和顶层导航应单独考虑</h2>
<p><code>allow-popups</code> 允许创建弹窗，但新窗口通常仍继承沙箱限制。<code>allow-popups-to-escape-sandbox</code> 允许新上下文不继承这些限制，不应为了修复一个链接就随手添加。</p>
<p><code>allow-top-navigation</code> 允许更广泛的顶层导航；如果业务只是用户点击按钮后跳转，可以评估更窄的 <code>allow-top-navigation-by-user-activation</code>。用户激活能降低静默跳转风险，却不能保证跳转目标可信，URL 仍需要业务校验。</p>
<p>同理，开放表单或下载也应有明确需求，不要复制一长串允许项作为默认配置。</p>
<h2>sandbox 之外还需要明确的边界</h2>
<p>sandbox 主要约束被嵌入内容的行为；CSP 的 frame-ancestors 决定谁能嵌入页面；Permissions Policy 可以进一步限制摄像头等能力。三者方向不同，不能互相替代。</p>
<p>父页面与 iframe 的通信仍要校验来源、窗口和消息结构。若内容允许单独在新标签页打开，iframe 元素上的 sandbox 不会自动跟随过去，因此不可信内容应部署在独立来源，必要时使用文档自己的响应头策略。</p>
<p>验证时不仅看内容能否显示，还要检查脚本、存储、表单、弹窗、父页面访问和导航行为。目标是只开放完成业务所需的能力，而不是看到报错就逐项取消所有限制。</p>`};export{e as default};