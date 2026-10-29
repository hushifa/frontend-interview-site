var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>传统打包工具启动时要先把整个应用打包好，项目越大越慢。Vite 开发时不先打包，而是让浏览器通过原生 ES 模块自己按需请求文件，服务器只转换被请求到的那些模块。</p>
<p>第三方依赖是例外，Vite 会预先把它们打包成少量 ESM 文件并缓存，免得浏览器请求成百上千个小文件。改了代码以后，热更新只替换改动的模块，所以速度不会随项目变大而明显变慢。</p>
<p>可是生产环境还要打包。合并请求、tree shaking、压缩、代码分割、带哈希的缓存文件名，都要构建完才能做到。</p>
<p>版本上要注意，Vite 8 的生产构建用的是 Rolldown；Vite 7 及之前，开发时用 esbuild，生产构建用 Rollup。</p>
</blockquote>
<h2>开发服务器做了什么</h2>
<p>Vite 启动时几乎不处理业务代码，真正的工作发生在浏览器请求的时候。</p>
<p>浏览器先加载 <code>index.html</code>，看到 <code>&lt;script type=&quot;module&quot; src=&quot;/src/main.ts&quot;&gt;</code>，就去请求 <code>/src/main.ts</code>。Vite 收到请求，把 TypeScript 的类型去掉、把导入路径改写好，再返回给浏览器。浏览器读到里面的 <code>import</code>，接着请求下一批模块。</p>
<p>所以没访问到的路由，它的代码根本不会被转换。这就是启动快的原因。</p>
<h2>为什么要预构建依赖</h2>
<p><code>node_modules</code> 里的包有两个问题。第一，很多包还是 CommonJS 格式，浏览器没法直接执行。第二，一个包可能拆成几百个内部模块，浏览器逐个请求会很慢。</p>
<p>所以 Vite 首次启动时会扫描依赖，把它们转换并合并成少量 ESM 文件，缓存在 <code>node_modules/.vite</code> 里，这一步叫依赖预构建。依赖或锁文件变了，它会重新预构建。</p>
<h2>热更新为什么快</h2>
<p>热更新，也就是 HMR，指改了代码以后页面不刷新，只替换改动的部分。</p>
<p>改了一个文件后，Vite 沿着导入关系往上找，找到一个能接受热更新的边界，比如一个 React 或 Vue 组件。然后只让浏览器重新请求这部分模块，页面状态保留不变。找不到这样的边界，才整页刷新。</p>
<p>所以热更新的工作量只跟改动范围有关，跟项目总大小关系不大。</p>
<h2>为什么生产还要打包</h2>
<p>开发时按需请求很舒服，可是放到线上，用户的网络就成了瓶颈。</p>
<p>首先是请求数量。不打包的应用首屏可能要发几百个模块请求，导入链越深，来回的次数越多，就算用了 HTTP/2 也会明显变慢。</p>
<p>其次是体积。tree shaking 会去掉没用到的代码，压缩器会缩小文件，开发模式都不做这些。</p>
<p>然后是缓存。打包后的文件名带内容哈希，没改动的块可以让浏览器长期缓存。</p>
<p>最后是兼容性。构建会按 <code>build.target</code> 降级语法，处理 CSS 和静态资源。默认值 <code>&#x27;baseline-widely-available&#x27;</code> 指每个大版本固定一个日期时 Baseline 广泛可用的浏览器，Vite 8 以 2026-01-01 为准，对应 Chrome 111、Firefox 114、Safari 16.4 等。</p>
<p>Vite 8 的生产构建由 Rolldown 完成；Vite 7 及之前，开发时用 esbuild，生产构建用 Rollup。Vite 8 要求 Node.js 20.19+ 或 22.12+。</p>
<h2>开发和生产不一样会带来什么</h2>
<p>开发和生产走的是两条不同的处理路径，所以个别问题只会在其中一种模式下出现，比如 CommonJS 互操作、CSS 顺序、动态导入路径。</p>
<p>改法是提交前跑一次 <code>vite build</code>，再用 <code>vite preview</code> 在本地检查构建产物。</p>
<h2>常见追问</h2>
<p><strong>为什么首次启动或者依赖变化后会慢一些？</strong></p>
<blockquote>
<p>因为要重新做依赖预构建。做完以后命中缓存，之后启动就快了。</p>
</blockquote>
<p><strong>Vite 能用于非浏览器场景吗？</strong></p>
<blockquote>
<p>可以，它有 SSR 模式和库模式。但开发服务器“按需请求”的优势，主要体现在浏览器应用上。</p>
</blockquote>`};export{e as default};