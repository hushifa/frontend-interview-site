var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个几千个模块的老项目，用 webpack 跑 <code>npm run dev</code> 要先等它把整个应用打包一遍；换成 Vite，开发服务器几乎马上就起来了。Vite 为什么启动快，原生 ESM 按需转换和依赖预构建怎样工作，见<a href="/questions/eng-vite/">《Vite 开发模式为什么启动快，生产环境为什么仍需要构建？》</a>。这道题讲的是项目里怎样选。</p>
<p>配置上，webpack 把转换交给 loader、把扩展交给 plugin，几乎什么都要显式配置；Vite 对 TypeScript、CSS、静态资源有默认处理，<code>index.html</code> 就是入口，配置少很多。生态上，webpack 历史更久，有大量现成的 loader 和 plugin，还有 Module Federation 这类内置能力。</p>
<p>迁移成本主要来自三处：项目里自定义的 loader 和 plugin 要找替代或重写；开发和生产在 Vite 里走不同流程，要用生产构建验证；Vite 只转译 TypeScript、不做类型检查，CI 要补上 <code>tsc --noEmit</code>。</p>
<p>所以新的常规 React、Vue 应用多数可以直接用 Vite。已有的大型 webpack 项目，如果依赖了特殊的 loader、Module Federation 这类能力，先测一下开发服务器的启动和热更新时间，确认它真是瓶颈，再决定要不要迁移。</p>
</blockquote>
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