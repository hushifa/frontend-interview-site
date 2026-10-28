var e={answerHtml:`<h2>简答</h2>
<ul>
<li>开发时 Vite 不先打包整个应用，而是让浏览器通过原生 ES 模块按需请求文件，服务器只转换被请求到的模块。</li>
<li>第三方依赖会预先打包成少量 ESM 文件并缓存，避免浏览器请求成百上千个小文件。</li>
<li>热更新只替换改动的模块及其边界，速度不随应用规模明显变慢。</li>
<li>生产环境仍要打包：合并请求、tree shaking、压缩、代码分割和带哈希的缓存文件名都需要构建完成。</li>
<li>Vite 8 的生产构建使用 Rolldown；Vite 7 及之前开发时用 esbuild、生产构建用 Rollup。当前版本要求 Node.js 20.19+ 或 22.12+。</li>
</ul>
<h2>开发服务器做了什么</h2>
<p>传统打包工具启动时要先分析和打包所有模块，应用越大启动越慢。Vite 启动时几乎不处理业务代码：</p>
<ol>
<li>浏览器加载 <code>index.html</code>，遇到 <code>&lt;script type=&quot;module&quot; src=&quot;/src/main.ts&quot;&gt;</code>。</li>
<li>浏览器请求 <code>/src/main.ts</code>，Vite 把 TypeScript 去掉类型、改写导入路径后返回。</li>
<li>浏览器根据其中的 <code>import</code> 继续请求下一批模块。</li>
</ol>
<p>没访问到的路由，代码根本不会被转换。</p>
<h2>依赖预构建</h2>
<p><code>node_modules</code> 里的包存在两个问题：很多仍是 CommonJS，浏览器无法直接执行；一个包可能拆成几百个内部模块，逐个请求很慢。Vite 首次启动时扫描依赖，把它们转换并合并成少量 ESM 文件，放到 <code>node_modules/.vite</code> 中缓存。依赖或锁文件变化时会重新预构建。</p>
<h2>热更新</h2>
<p>修改一个文件后，Vite 沿导入关系向上找到接受热更新的边界（例如一个 React 或 Vue 组件），只让浏览器重新请求这部分模块，同时保留页面状态。找不到边界时才整页刷新。</p>
<h2>为什么生产还要打包</h2>
<ul>
<li><strong>请求数量</strong>：未打包的应用首屏可能要发起几百个模块请求，导入链越深，往返次数越多，即使用 HTTP/2 也明显变慢。</li>
<li><strong>体积</strong>：tree shaking 去掉未使用的代码，压缩器减小文件，开发模式都不做这些。</li>
<li><strong>缓存</strong>：文件名带内容哈希，未改动的块可以长期缓存。</li>
<li><strong>兼容性</strong>：按 <code>build.target</code> 降级语法，处理 CSS 和静态资源。</li>
</ul>
<h2>开发和生产的差异</h2>
<p>开发与生产走的是不同的处理路径，个别问题只在一种模式下出现，例如 CommonJS 互操作、CSS 顺序、动态导入路径。提交前运行 <code>vite build</code> 并用 <code>vite preview</code> 在本地检查产物。</p>
<h2>常见追问</h2>
<ul>
<li>为什么首次启动或依赖变化后会慢一些？需要重新预构建依赖，之后命中缓存就快了。</li>
<li>Vite 能用于非浏览器场景吗？可以用 SSR 模式和库模式构建，但开发服务器的&quot;按需请求&quot;优势主要体现在浏览器应用上。</li>
</ul>`};export{e as default};