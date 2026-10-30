var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个大型 webpack 项目，生产构建要十几分钟，开发服务器冷启动要几分钟，改一行代码等热更新也要好几秒。Rspack 的官方介绍就是从这个问题来的：它最早是为了解决字节跳动大型项目的构建性能问题，有的项目生产构建要十分钟甚至半小时。</p>
<p>这类工具提速主要靠三点。用 Rust 写，编译成原生代码运行；利用多核并行，JavaScript 在多线程上的能力比较弱；把 TypeScript、JSX、CSS 这些常用的转换直接内置进来，减少在 Rust 和 JavaScript 之间来回调用插件的开销。</p>
<p>三者的区别在于兼容谁。Rspack 兼容 webpack 的 API，大部分社区 loader 和常用插件都能直接用，适合老的 webpack 项目迁移。Turbopack 内置在 Next.js 里，Next.js 16 起是默认打包工具，靠增量计算和按需打包提速，支持 webpack loader 但不支持 webpack 插件。Rolldown 兼容 Rollup 和 Vite 的插件接口，主要作为 Vite 的底层打包工具。</p>
<p>要注意，换工具不等于自动变快。用 JavaScript 写的插件还是要在 JavaScript 里执行，插件多了一样会慢；Rolldown 的文档就提到，10 个 JavaScript 插件能让构建时间增加 3 到 4 倍，所以它提供了在 Rust 侧过滤的钩子写法。迁移时还要逐个确认插件是否兼容。</p>
</blockquote>
<h2>为什么 JavaScript 写的打包工具会慢</h2>
<p>Rspack 的文档总结了大项目对构建工具的几个要求：<code>npm run dev</code> 一小时可能要跑很多次，启动超过 10 到 15 秒就会影响效率；<code>npm run build</code> 在 CI 里跑，大项目可能花 20 到 30 分钟，打包往往占了主要部分。</p>
<p>慢在哪里？webpack 和 Rollup 都用 JavaScript 写。JavaScript 对多线程的支持比较弱，解析、转换、压缩几千个模块，大部分时间只用到一个核。webpack 的钩子系统带来了庞大的 loader 和插件生态，可是 Rspack 文档也指出，这些第三方包经常成为性能瓶颈，有时是作者不了解 webpack 内部，有时是钩子系统本身限制了算法能怎样协作。</p>
<p>所以这些新工具的思路很一致：核心用 Rust 实现，能并行的地方并行，常用功能内置成原生代码，尽量少调用 JavaScript。</p>
<h2>Rspack：兼容 webpack 的 Rust 版本</h2>
<p>Rspack 官方的定位是基于 Rust 的打包工具，用现代化的 webpack API，可以直接替换 webpack。迁移指南说它的配置按 webpack 设计，API 和配置与 webpack 5 对齐。</p>
<p>兼容到什么程度？官方文档说，Rspack 1.0 在 2024 年 8 月发布，覆盖了 webpack 的大部分 API 和功能；社区里几乎所有的 loader 都能用；下载量最高的 50 个 webpack 插件里，超过 85% 能在 Rspack 里使用或者有替代方案。插件配置也和 webpack 一样，比如 <code>webpack-bundle-analyzer</code> 可以直接写进 <code>plugins</code>。</p>
<p>和 webpack 比，它多做了几件事：Babel 和 PostCSS 这类常用工作，提供了 <code>builtin:swc-loader</code>、<code>builtin:lightningcss-loader</code> 这样的内置 loader，用 Rust 实现；热更新用专门的增量编译策略。所以典型的迁移方式是，先把 webpack 换成 <code>@rspack/core</code>，配置基本不动，再把 <code>babel-loader</code> 换成内置的 <code>builtin:swc-loader</code>。</p>
<p>如果想要 Vite 那种开箱即用的体验，Rspack 官方推荐用基于它的 Rsbuild。webpack 本身的 loader 和 plugin 机制见<a href="/questions/eng-vite-vs-webpack/">《Vite 和 webpack 有什么区别？项目里应该怎样选？》</a>。</p>
<h2>Turbopack：内置在 Next.js 里的增量打包工具</h2>
<p>Next.js 文档的说法是，Turbopack 是一个为 JavaScript 和 TypeScript 优化的增量打包工具，用 Rust 编写，内置在 Next.js 中。Next.js 16 起，它是所有应用的默认打包工具，不需要额外配置；要用 webpack，就给 <code>next dev</code> 和 <code>next build</code> 加 <code>--webpack</code> 参数。</p>
<p>它的提速思路和前两者有些不同，文档列了几点。统一的模块图：Next.js 同时要产出客户端和服务端的代码，Turbopack 用一张图管理所有环境，不用拼接几个编译器的结果。开发时也打包：有的工具开发时不打包、直接用浏览器的原生 ESM，小项目很好，大项目请求太多反而慢，Turbopack 开发时也打包，只是做了优化。增量计算：工作分散到多个核上，结果缓存到函数级别，做过的不再重做，缓存还能落盘在多次运行之间复用。按需打包：只打包开发服务器实际请求到的内容，减少首次编译时间和内存。</p>
<p>迁移时要注意兼容性。文档写明 Turbopack 不支持 webpack 插件，依赖 webpack 插件系统集成的第三方工具要找替代品，或者继续用 webpack；webpack loader 是支持的，可以在 <code>next.config</code> 的 <code>turbopack.rules</code> 里配置。另外 Next.js 文档介绍的都是它内置在 Next.js 里的用法。</p>
<h2>Rolldown：兼容 Rollup 的 Vite 底层打包工具</h2>
<p>Rolldown 的官方介绍说，它主要是为了做 Vite 的底层打包工具，用一个统一的工具替代 Vite 之前同时依赖的 esbuild 和 Rollup。理由有三点：性能上，它用 Rust 编写，和 esbuild 在同一水平，比 Rollup 快 10 到 30 倍；生态上，它支持和 Rollup、Vite 相同的插件接口，Vite 已有的插件生态可以继续用；功能上，它内置了 Vite 需要但 esbuild 和 Rollup 不太可能实现的能力。</p>
<p>所以 Rolldown 的功能范围更接近 esbuild：TypeScript、JSX 转换、Node.js 风格的模块解析、ESM 和 CJS 互操作、<code>define</code>、<code>inject</code> 都是内置的，同时保留了 Rollup 的插件接口和相近的 tree shaking 能力。它也可以单独用，在大多数情况下能直接替代 Rollup。</p>
<p>Vite 8 的生产构建由 Rolldown 完成，旧版本用 Rollup，见<a href="/questions/eng-vite/">《Vite 开发模式为什么启动快，生产环境为什么仍需要构建？》</a>。</p>
<h2>用 Rust 写的工具，插件为什么还会拖慢构建</h2>
<p>插件是用户用 JavaScript 写的，Rust 核心每处理一个模块，都要调用一次每个插件的钩子，在两种语言之间传数据。Rolldown 的文档举了一个例子：一个只处理 <code>.css</code> 文件的插件，也会被每个 <code>.js</code>、<code>.ts</code> 文件调用一次，插件一多，开销成倍增加，10 个插件能让构建时间变成 3 到 4 倍。</p>
<p>它的解决办法是钩子过滤器：把“只处理哪些文件”的条件写成数据，交给 Rust 侧判断，不匹配的模块根本不会调用 JavaScript。下面是 Rolldown 文档里的写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">myPlugin</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;example&#x27;</span>,
    <span class="hljs-attr">transform</span>: {
      <span class="hljs-attr">filter</span>: {
        <span class="hljs-attr">id</span>: <span class="hljs-regexp">/\\.data$/</span>,
      },
      <span class="hljs-title function_">handler</span>(<span class="hljs-params">code</span>) {
        <span class="hljs-comment">// 只有文件名以 .data 结尾的模块才会进到这里</span>
        <span class="hljs-keyword">return</span> transformedCode;
      },
    },
  };
}
</code></pre></div>
<p>以前的写法是在 <code>transform</code> 函数里自己判断 <code>id</code>，不匹配就提前 <code>return</code>。结果一样，可是函数已经被调用了一次，跨语言调用的开销已经付出去了。改成 <code>filter</code> 以后，判断发生在 Rust 侧，不需要的调用直接省掉。这也说明了这类工具的一个共同点：性能好的前提是尽量让工作留在原生代码里。</p>
<h2>怎样选</h2>
<p>多数情况下，选择取决于你已经在用什么。老的 webpack 项目构建慢，迁移成本最低的是 Rspack，配置和大部分插件能沿用。用 Next.js 的项目，Turbopack 已经是默认的，主要工作是确认没有依赖 webpack 插件。用 Vite 的项目，升级到 Vite 8 就用上了 Rolldown，主要确认用到的插件兼容。</p>
<p>这些工具的速度对比都来自各自官方的基准测试，项目结构、插件数量不同，实际效果差别很大。迁移前最好在自己的项目上实测冷启动、热更新和生产构建的时间，同时比对产物体积和功能是否一致。</p>
<h2>常见追问</h2>
<p><strong>Rust 写的工具为什么比 JavaScript 写的快？</strong></p>
<blockquote>
<p>Rspack 文档给的理由主要是两点。一是 Rust 本身就是为性能设计的语言，在速度和内存管理的基准测试里都名列前茅，编译器还能避免 C++ 这类原生语言的常见错误。二是能充分利用多核，解析、转换、压缩可以并行做，JavaScript 在多线程上的支持比较弱，webpack 这类工具大部分时间只用一个核。</p>
</blockquote>
<p><strong>esbuild 也很快，为什么还要 Rolldown？</strong></p>
<blockquote>
<p>esbuild 用 Go 编写，速度很快，Rspack 文档也提到它除了少数 JavaScript 插件，几乎所有操作都在 Go 里实现。可是它缺少 HMR 和 webpack 的 <code>splitChunks</code> 那种细粒度的代码分割。Rolldown 的定位是在保持接近 esbuild 速度的同时，兼容 Rollup 的插件接口，并提供手动代码分割这类 Vite 需要的功能。</p>
</blockquote>
<p><strong>Rspack 和 Turbopack 都是 Rust 写的，区别在哪？</strong></p>
<blockquote>
<p>Rspack 文档的说法是，Turbopack 重新设计了架构和配置，带来一些好处，但对依赖 webpack 生态的项目来说迁移成本更高。Rspack 则尽量兼容 webpack 的配置和插件。另外 Turbopack 是内置在 Next.js 里使用的，Rspack 是独立的打包工具，可以用在任何项目里。</p>
</blockquote>`};export{e as default};