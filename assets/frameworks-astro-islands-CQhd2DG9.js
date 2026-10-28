var e={answerHtml:`<h2>简答</h2>
<ul>
<li>没有 <code>client:*</code> 指令的组件只在服务端（或构建时）渲染为 HTML，浏览器不会收到它的 JavaScript。</li>
<li>加了指令的组件是交互岛屿，各自独立加载和 hydration。</li>
<li>激活时机：<code>client:load</code> 页面加载时，<code>client:idle</code> 浏览器空闲时，<code>client:visible</code> 进入视口时，<code>client:media</code> 媒体查询匹配时，<code>client:only</code> 跳过服务端渲染只在客户端渲染。</li>
<li>不同岛屿可以用 React、Vue、Svelte 等不同框架，但岛屿之间不共享 Context，需要通过外部 store、URL 或事件通信。</li>
<li>适合博客、文档、营销页、电商详情页；整页高度交互、状态紧密耦合的应用，收益有限。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">astro</div><pre><code class="hljs language-astro">---
import Header from &#x27;../components/Header.astro&#x27;;
import SearchBox from &#x27;../components/SearchBox.jsx&#x27;;
import Comments from &#x27;../components/Comments.vue&#x27;;
---

&lt;Header /&gt;
&lt;article&gt;
  &lt;h1&gt;文章标题&lt;/h1&gt;
  &lt;p&gt;正文是纯 HTML，不需要 JavaScript。&lt;/p&gt;
&lt;/article&gt;
&lt;SearchBox client:load /&gt;
&lt;Comments client:visible /&gt;
</code></pre></div>
<ul>
<li><code>Header</code> 和正文只输出 HTML。</li>
<li><code>SearchBox</code> 页面一打开就可以用。</li>
<li><code>Comments</code> 滚动到评论区时才下载代码并激活。</li>
</ul>
<h2>激活前的交互</h2>
<p>岛屿激活之前，服务端渲染的 HTML 已经可见但还不能响应事件。延后激活的组件里如果放了重要按钮，用户点击可能没有反应。处理方式：</p>
<ul>
<li>首屏关键交互用 <code>client:load</code>。</li>
<li>尽量让基础功能不依赖脚本，例如用真正的 <code>&lt;a&gt;</code> 链接和 <code>&lt;form&gt;</code> 提交。</li>
</ul>
<h2>岛屿之间共享状态</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// store.js</span>
<span class="hljs-keyword">import</span> { atom } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;nanostores&#x27;</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> cartCount = <span class="hljs-title function_">atom</span>(<span class="hljs-number">0</span>);
</code></pre></div>
<p>React 岛屿和 Vue 岛屿各自订阅同一个 store。Astro 官方文档推荐 Nano Stores 这类与框架无关的状态库。</p>
<h2>服务器岛屿</h2>
<p><code>server:defer</code> 指令让某个组件在页面主体之外单独在服务端渲染，例如个性化的用户头像，页面其余部分可以被缓存。它需要服务端运行时，纯静态托管无法使用。</p>
<h2>常见追问</h2>
<ul>
<li>和 SSR + 全量 hydration 有什么区别？传统 SSR 框架会在客户端激活整个页面的组件树；Islands 只激活标记的部分，其余部分的组件代码根本不会发到浏览器。</li>
<li>多个框架会让体积变大吗？会，每种框架的运行时都要下载，应尽量统一。</li>
</ul>`};export{e as default};