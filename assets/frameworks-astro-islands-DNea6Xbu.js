var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>想象一个页面大部分是静态的文字和图片，只有搜索框、评论区这几块需要交互。Astro 的做法是：整页都在服务端或构建时渲染成 HTML，默认一行 JavaScript 都不发；只有加了 <code>client:*</code> 指令的组件，才会在浏览器里加载代码并激活。这些能交互的小块就叫岛屿。</p>
<p>每个岛屿独立加载、独立 hydration，激活时机由指令决定：<code>client:load</code> 页面加载时，<code>client:idle</code> 浏览器空闲时，<code>client:visible</code> 进入视口时，<code>client:media</code> 媒体查询匹配时。<code>client:only</code> 比较特殊，它跳过服务端渲染，只在客户端渲染。</p>
<p>岛屿之间互相独立，所以可以一个用 React、一个用 Vue。代价是它们不共享 Context，要通信得靠外部 store、URL 或者事件。</p>
<p>所以它适合博客、文档、营销页、电商详情页这种内容为主的站点。如果整个页面都是交互、状态紧密耦合，收益就有限了。</p>
</blockquote>
<h2>先看一个页面</h2>
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
<p><code>Header</code> 和正文没有指令，只输出 HTML，浏览器不会收到它们的组件代码。<code>SearchBox</code> 用了 <code>client:load</code>，页面一打开就加载，马上能用。<code>Comments</code> 用了 <code>client:visible</code>，用户滚到评论区时才去下载代码并激活，没滚到就一直不加载。</p>
<h2>激活之前点了会怎样</h2>
<p>岛屿激活之前，它的 HTML 已经能看到了，但还不能响应事件。所以如果把一个重要按钮放进延后激活的组件里，用户点了可能没反应。</p>
<p>处理办法有两个。首屏的关键交互用 <code>client:load</code>，不要延后。另外尽量让基础功能不依赖脚本，比如用真正的 <code>&lt;a&gt;</code> 链接和 <code>&lt;form&gt;</code> 提交，这样脚本没加载完也能用。</p>
<h2>岛屿之间怎样共享状态</h2>
<p>岛屿之间没有共同的父组件，也就没法用 Context。办法是把状态放到一个跟框架无关的地方：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// store.js</span>
<span class="hljs-keyword">import</span> { atom } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;nanostores&#x27;</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> cartCount = <span class="hljs-title function_">atom</span>(<span class="hljs-number">0</span>);
</code></pre></div>
<p>React 岛屿和 Vue 岛屿各自订阅这同一个 store，一边改了，另一边就能收到。Astro 官方文档推荐的就是 Nano Stores 这类与框架无关的状态库。</p>
<h2>服务器岛屿是什么</h2>
<p>还有一种反过来的需求：页面大部分可以缓存，只有个性化的一小块，比如用户头像，必须按请求生成。<code>server:defer</code> 指令让这个组件和页面主体分开，单独在服务端渲染，页面其余部分照样可以缓存。它需要服务端运行时，纯静态托管用不了。</p>
<h2>常见追问</h2>
<p><strong>和 SSR 加全量 hydration 有什么区别？</strong></p>
<blockquote>
<p>传统 SSR 框架会在客户端把整个页面的组件树都激活一遍，所有组件代码都要下载。Islands 只激活标记过的部分，其余组件的代码根本不会发到浏览器。</p>
</blockquote>
<p><strong>用好几个框架会让体积变大吗？</strong></p>
<blockquote>
<p>会，每种框架的运行时都要单独下载，所以还是尽量统一用一个。</p>
</blockquote>`};export{e as default};