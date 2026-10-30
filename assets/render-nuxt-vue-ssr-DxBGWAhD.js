var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户打开一篇商品详情页，服务器先把 Vue 组件执行一遍，生成带有商品名、价格的完整 HTML 发给浏览器，用户马上就能看到内容。接着浏览器下载同一份 JavaScript，Vue 再创建一次同样的应用，把组件和已有的 DOM 对上，绑定点击事件，页面从这时起才能交互。前一步叫服务端渲染（SSR），后一步叫 hydration，也叫激活。</p>
<p>在 Vue 里，服务端用 <code>createSSRApp</code> 创建应用、<code>renderToString</code> 生成 HTML；客户端也用 <code>createSSRApp</code> 而不是 <code>createApp</code>，挂载时 Vue 会复用已有的 DOM 而不是重新创建。因为同一份代码要在两边各跑一次，服务端没有交互和 DOM 更新，<code>onMounted</code> 这类钩子只在客户端执行，用到 <code>window</code> 的代码要放进这类钩子里。</p>
<p>Nuxt 把这套流程都包好了。默认就是这种“通用渲染”，页面按文件自动生成路由，<code>useFetch</code>、<code>useAsyncData</code> 在服务端取到的数据会写进页面的 payload，客户端 hydration 时直接复用、不再请求；服务器由 Nitro 引擎提供，可以部署到 Node、Serverless、边缘环境，或者预渲染成静态文件。</p>
<p>要注意两个坑。一是服务器上模块只初始化一次，写在模块顶层的状态会被所有请求共享，用户数据可能串到别人那里，Nuxt 里应该用 <code>useState</code> 或 Pinia。二是两边第一次渲染的结果必须一致，否则会出现 hydration mismatch。</p>
</blockquote>
<h2>最小的 Vue SSR</h2>
<p>先看 Vue 官方文档里最简单的例子，在 Node.js 里把一个组件渲染成字符串：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 在 Node.js 里运行，package.json 需要 &quot;type&quot;: &quot;module&quot;</span>
<span class="hljs-keyword">import</span> { createSSRApp } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>
<span class="hljs-keyword">import</span> { renderToString } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue/server-renderer&#x27;</span>

<span class="hljs-keyword">const</span> app = <span class="hljs-title function_">createSSRApp</span>({
  <span class="hljs-attr">data</span>: <span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> }),
  <span class="hljs-attr">template</span>: <span class="hljs-string">\`&lt;button @click=&quot;count++&quot;&gt;{{ count }}&lt;/button&gt;\`</span>,
})

<span class="hljs-title function_">renderToString</span>(app).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">html</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(html) <span class="hljs-comment">// 输出 &lt;button&gt;1&lt;/button&gt;</span>
})
</code></pre></div>
<p>用 Vue 3.5.44 在 Node.js 里运行，打印的是 <code>&lt;button&gt;1&lt;/button&gt;</code>。<code>@click</code> 去哪了？服务端只生成 HTML 字符串，事件监听没法写进 HTML，所以被丢掉了。把这段 HTML 放进页面发给浏览器，按钮能看见，但点了没反应。</p>
<p><code>renderToString</code> 返回一个 Promise，因为组件里可能有异步的数据获取要等。Vue 也支持用 Node.js Stream 或 Web Streams 流式输出。实际项目会把这段代码放进服务器的请求处理函数里，每个请求创建一个新的应用实例，再把生成的 HTML 套进完整的页面模板。</p>
<h2>浏览器里怎样“激活”</h2>
<p>要让按钮能点，浏览器里也要运行同一个应用：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 在浏览器里运行</span>
<span class="hljs-keyword">import</span> { createSSRApp } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>

<span class="hljs-keyword">const</span> app = <span class="hljs-title function_">createSSRApp</span>({
  <span class="hljs-comment">// 和服务端相同的组件</span>
})

app.<span class="hljs-title function_">mount</span>(<span class="hljs-string">&#x27;#app&#x27;</span>)
</code></pre></div>
<p>为什么这里也用 <code>createSSRApp</code>？用 <code>createApp</code> 挂载会把 <code>#app</code> 里的内容当成空白，重新创建 DOM。<code>createSSRApp</code> 挂载时进入 hydration 模式：Vue 创建和服务端一样的应用，把每个组件和它应该控制的已有 DOM 节点对应起来，再绑定事件监听器。DOM 不用重新创建，用户看到的内容也不会闪一下。</p>
<p>实际项目通常把创建应用的代码放进一个共享文件，比如 <code>app.js</code> 导出 <code>createApp()</code> 函数，服务端和客户端入口都调用它。这也是“通用”或“同构”这个说法的来源：大部分代码两边都要运行。</p>
<h2>同一份代码在两边运行要注意什么</h2>
<p>服务端渲染时没有用户交互，也没有 DOM 更新，所以 Vue 默认在 SSR 时关闭了响应式，提高性能。<code>onMounted</code>、<code>onUpdated</code> 这类钩子在服务端不会被调用，只在客户端执行。</p>
<p>这带来一个问题：写在 <code>setup()</code> 或 <code>&lt;script setup&gt;</code> 顶层的代码两边都会执行。如果在这里 <code>setInterval</code>，服务端上永远等不到卸载钩子去清理它，定时器会一直留着。官方建议把这类有副作用的代码放进 <code>onMounted</code>。同样，<code>window</code>、<code>document</code> 这些浏览器才有的对象也应该在 <code>onMounted</code> 里访问。</p>
<p>更隐蔽的是跨请求状态污染。前端常把共享状态写在模块顶层，比如 <code>export const store = reactive({ user: null })</code>。浏览器里每次打开页面模块都重新初始化，没问题；服务器上模块只在启动时初始化一次，所有请求共用同一个 <code>store</code>。给一个用户写进去的数据，可能被下一个用户的请求读到。正确做法是每个请求创建一份新的状态，挂到这次请求的应用实例上。</p>
<p>两边第一次渲染的结果还必须一致。服务端和客户端读到的时间、随机数不同，或者 HTML 嵌套不合法被浏览器修正了，都会导致 hydration mismatch，Vue 会尝试修正 DOM，但有性能损失，详见<a href="/questions/render-hydration/">《Hydration mismatch 为什么发生，应该怎样修复？》</a>。</p>
<h2>Nuxt 帮你做了什么</h2>
<p>手写 SSR 要自己处理服务器、构建、路由、数据预取、状态传递和 HTML 模板。Nuxt 把这些都做好了，默认开启的就是通用渲染。Nuxt 文档用这个组件说明哪些代码在哪里运行：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup lang=&quot;ts&quot;&gt;
const counter = ref(0) // 服务端和客户端都会执行

const handleClick = () =&gt; {
  counter.value++ // 只在客户端执行
}
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;p&gt;Count: {{ counter }}&lt;/p&gt;
    &lt;button @click=&quot;handleClick&quot;&gt;Increment&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;
</code></pre></div>
<p>首次请求时，<code>counter</code> 在服务端初始化并渲染进 <code>&lt;p&gt;</code>，<code>handleClick</code> 的函数体不会执行。到了浏览器 hydration 时，<code>counter</code> 又初始化一次，<code>handleClick</code> 绑定到按钮上，所以它的函数体总是在浏览器里运行。文档还说明，页面和路由中间件在服务端和 hydration 时都会运行；插件可以指定只在一端运行；组件也可以强制只在客户端渲染。</p>
<p>数据获取是 Nuxt 解决的另一个问题。在 <code>setup</code> 里直接用 <code>$fetch</code> 请求，服务端渲染时请求一次，客户端 hydration 时又请求一次。<code>useFetch</code> 和 <code>useAsyncData</code> 会把服务端拿到的数据放进 payload，跟着页面一起发给浏览器，客户端 hydration 时直接从 payload 读，不再重复请求，详见<a href="/questions/framework-nuxt-data/">《Nuxt 的 useFetch 和 useAsyncData 怎样避免重复请求？》</a>。</p>
<p>跨请求状态污染在 Nuxt 里同样存在。官方文档明确警告，不要在 <code>&lt;script setup&gt;</code> 或 <code>setup()</code> 外面定义 <code>const state = ref()</code>，否则服务器上所有请求会共享这份状态，还可能导致内存泄漏，应该写成 <code>const useX = () =&gt; useState(&#x27;x&#x27;)</code>。<code>useState</code> 的值在服务端渲染后会序列化成 JSON 传给客户端，所以不能放类、函数、Symbol 这类无法序列化的值。</p>
<h2>不是只有 SSR 一种模式</h2>
<p>Nuxt 的服务器引擎叫 Nitro，生产构建会把应用和服务器打包进 <code>.output</code> 目录，可以部署到 Node.js、Serverless、边缘环境，也可以纯静态托管。</p>
<p>渲染模式可以整体切换，也可以按路由配置。在 <code>nuxt.config.ts</code> 里设置 <code>ssr: false</code> 就变成只在客户端渲染的单页应用；用 <code>nuxt generate</code> 可以在构建时把每个页面预渲染成静态 HTML。更细的是用 <code>routeRules</code> 按路由混合：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineNuxtConfig</span>({
  <span class="hljs-attr">routeRules</span>: {
    <span class="hljs-string">&#x27;/&#x27;</span>: { <span class="hljs-attr">prerender</span>: <span class="hljs-literal">true</span> }, <span class="hljs-comment">// 构建时生成静态页面</span>
    <span class="hljs-string">&#x27;/products/**&#x27;</span>: { <span class="hljs-attr">swr</span>: <span class="hljs-number">3600</span> }, <span class="hljs-comment">// 服务端缓存一小时，过期后后台重新生成</span>
    <span class="hljs-string">&#x27;/admin/**&#x27;</span>: { <span class="hljs-attr">ssr</span>: <span class="hljs-literal">false</span> }, <span class="hljs-comment">// 只在浏览器渲染</span>
  },
})
</code></pre></div>
<p><code>swr</code> 会在服务端或反向代理上缓存响应，过期后先返回旧内容，再在后台重新生成。还有一个 <code>isr</code> 选项，行为相同，但能把响应放进 CDN 缓存，文档说明目前只在 Netlify、Vercel 这类支持的平台上可用。几种渲染方式的取舍详见<a href="/questions/render-ssr-ssg/">《CSR、SSR、SSG 和混合渲染如何选择？》</a>。</p>
<h2>常见追问</h2>
<p><strong>SSR 之后页面一定更快吗？</strong></p>
<blockquote>
<p>首屏内容出现得更快，因为浏览器拿到的就是完整 HTML，不用等 JavaScript 下载执行完。但页面能交互要等 hydration 结束，JavaScript 一样要下载。服务器每次请求都要渲染，CPU 负载更高，部署也需要能运行 Node.js 的环境。Vue 文档建议先想清楚是否真的需要，内部后台这类首屏多几百毫秒无所谓的场景用 SSR 就是过度设计。</p>
</blockquote>
<p><strong>只为了几个营销页面的 SEO，要上 SSR 吗？</strong></p>
<blockquote>
<p>Vue 文档的建议是，如果只是为了首页、关于页、联系页这类少量页面的 SEO，用 SSG 预渲染更合适。它们的数据对每个用户都一样，构建时生成一次就行，部署成本也低。</p>
</blockquote>
<p><strong>Nuxt 里怎样让某个组件只在浏览器里渲染？</strong></p>
<blockquote>
<p>用 <code>&lt;ClientOnly&gt;</code> 把它包起来，它的默认插槽内容不会进入服务端构建，只在浏览器里挂载后渲染。也可以把组件文件命名为 <code>.client.vue</code>。依赖浏览器 API 且导入时就有副作用的库，要确保只在客户端导入，因为打包工具不会摇树优化掉有副作用的模块。</p>
</blockquote>`};export{e as default};