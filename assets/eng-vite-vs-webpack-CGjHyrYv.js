var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个几千个模块的老项目，用 webpack 跑 <code>npm run dev</code> 要先等它把整个应用打包一遍，页面才能打开；换成 Vite，开发服务器几乎马上就起来了。这就是两者最直观的区别，差别出在开发阶段怎么处理模块。</p>
<p>webpack 在开发时也是打包器，先从入口找出所有依赖、构建成 bundle，再交给浏览器。Vite 在开发时不打包业务代码，浏览器请求哪个模块，它就转换哪个模块返回，靠的是浏览器原生支持 ES 模块；第三方依赖则预先打包一次并缓存。所以 Vite 的启动时间基本不随项目变大而增加，改一个文件也只替换那一个模块。</p>
<p>到了生产环境，两者都要打包。Vite 8 用 Rolldown 打包，旧版本用 Rollup；webpack 用自己的打包流程。配置上，webpack 把转换交给 loader、把扩展交给 plugin，几乎什么都要显式配置；Vite 对 TypeScript、CSS、静态资源有默认处理，配置少很多。</p>
<p>选型时要注意，Vite 开发和生产走的是不同流程，偶尔会出现“开发正常、打包后出问题”，上线前要用生产构建验证。已有的大型 webpack 项目，如果依赖了特殊的 loader、Module Federation 这类能力，迁移成本要先评估清楚，不必为了快而强行迁移。</p>
</blockquote>
<h2>开发服务器的启动方式为什么不同</h2>
<p>webpack 的开发服务器启动时，要先从 <code>entry</code> 出发找出所有模块，每个模块都经过 loader 转换，然后打包好放在内存里。项目越大，这一步越慢。改了一个文件，webpack 也要重新构建受影响的部分，再把更新推给浏览器。</p>
<p>Vite 把这件事交给了浏览器。页面里写的是 <code>&lt;script type=&quot;module&quot;&gt;</code>，浏览器读到 <code>import</code> 就会自己发请求。Vite 只在收到请求时才转换那一个文件，比如去掉 TypeScript 类型，所以启动时几乎不用处理业务代码。Vite 文档的说法是，模块在浏览器请求时按需提供，启动因此几乎是瞬间完成，和应用大小关系不大。</p>
<p>那第三方依赖为什么要预构建？因为很多包还是 CommonJS 格式，浏览器不能直接当 ES 模块加载；还有的包内部拆成了大量小文件，Vite 文档举的例子是 <code>lodash-es</code> 有 600 多个内部模块，引入一个函数就可能让浏览器同时发出几百个请求。所以 Vite 会提前把依赖打包成少量 ESM 文件，缓存在 <code>node_modules/.vite</code> 里。详细过程见<a href="/questions/eng-vite/">《Vite 开发模式为什么启动快，生产环境为什么仍需要构建？》</a>。</p>
<h2>生产构建有什么不同</h2>
<p>生产环境不能也让浏览器一个个请求模块，因为嵌套的 <code>import</code> 会带来很多轮网络往返。所以两者都会打包，做 tree shaking、压缩、代码分割和带 hash 的文件名。</p>
<p>区别在于用的工具。webpack 开发和生产用的是同一套打包流程，只是 <code>mode</code> 不同。Vite 早期开发时用 esbuild 预构建依赖、生产用 Rollup 打包；Vite 8 换成了 Rolldown，开发的依赖预构建和生产打包都由它完成。不管哪个版本，Vite 开发时的“按需转换”和生产时的“打包”仍然是两条不同的路径。</p>
<h2>配置方式有什么不同</h2>
<p>webpack 的思路是一切可配置。处理 <code>.scss</code> 要自己配 <code>sass-loader</code>、<code>css-loader</code>、<code>style-loader</code>，生成 HTML 要配 <code>HtmlWebpackPlugin</code>，loader 和 plugin 的区别见<a href="/questions/eng-loader-plugin/">《webpack 的 loader 和 plugin 有什么区别？怎样手写一个？》</a>。</p>
<p>Vite 内置了常见需求：TypeScript、CSS Modules、PostCSS、静态资源导入开箱即用，<code>index.html</code> 本身就是入口。要扩展时写 Vite 插件，没有单独的 loader 概念。</p>
<p>TypeScript 是一个容易忽略的差别。Vite 只做转译，不做类型检查，文档建议另外运行 <code>tsc --noEmit</code>。webpack 项目用 <code>ts-loader</code> 时默认会做类型检查，用 <code>babel-loader</code> 或开启 <code>transpileOnly</code> 时则同样只转译。所以从 webpack 迁到 Vite 后，要记得在 CI 里补上类型检查。</p>
<h2>怎样选</h2>
<p>新项目、常规的 React 或 Vue 应用，用 Vite 通常更省事，开发体验也更好。</p>
<p>已经稳定运行的 webpack 大项目，如果大量使用自定义 loader、依赖 Module Federation 或者有特殊的产物要求，迁移的工作量和风险都不小。这时可以先测一下当前开发服务器的启动和热更新时间，确认它真的是瓶颈，再决定要不要迁移。</p>
<h2>常见追问</h2>
<p><strong>Vite 开发环境快，生产打包也一定比 webpack 快吗？</strong></p>
<blockquote>
<p>不一定能一概而论。生产打包两者都要处理全部模块，速度取决于用的打包器、插件和项目规模。Vite 的优势主要在开发阶段的启动和热更新，生产构建的速度要按项目实测。</p>
</blockquote>
<p><strong>为什么用 Vite 时会出现开发正常、打包后出错？</strong></p>
<blockquote>
<p>因为开发时浏览器加载的是一个个单独的模块，生产时是打包合并后的代码，两边的处理流程不一样。比如 CommonJS 依赖的转换方式、CSS 的加载顺序、动态导入的路径，都可能在两边表现不同。所以发布前要用 <code>vite build</code> 加 <code>vite preview</code> 在本地验证生产产物。</p>
</blockquote>`};export{e as default};