var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>项目越写越大，<code>npm run build</code> 从几十秒变成好几分钟，打出来的主包好几 MB，这时要分两件事看：构建速度和产物体积。两者的优化手段不一样，但第一步都是先测量，不要凭感觉改配置。</p>
<p>构建速度上，收益最大的通常是缓存。webpack 5 设置 <code>cache: { type: &#x27;filesystem&#x27; }</code> 后，会把编译结果缓存到磁盘，第二次构建只处理变化的模块。其次是让 loader 少干活：用 <code>include</code> 只处理 <code>src</code> 目录，不去转换 <code>node_modules</code>；把 <code>babel-loader</code> 换成 <code>esbuild-loader</code> 或 <code>swc-loader</code>，它们用 Go 和 Rust 实现，转换快很多。再往后可以用 <code>thread-loader</code> 把耗时的 loader 放到 worker 池里并行，但官方文档提醒，每个 worker 启动有开销，主进程和 worker 之间传数据也有成本，所以 worker 不要开太多，只给耗时很长的 loader 用。</p>
<p>产物体积上，先用 <code>webpack-bundle-analyzer</code> 看清楚包里是什么。常见的大头是整包引入的依赖，比如 lodash、moment、图表库，换成按需引入或更小的替代品；首屏用不到的页面和组件用动态 <code>import()</code> 拆出去；用 <code>splitChunks</code> 把第三方依赖单独打包，业务代码改了也不影响它的缓存；生产模式默认开启 Tree shaking 和压缩，要保证代码是 ES 模块写法，依赖声明了 <code>sideEffects</code>。</p>
<p>要注意，开发环境和生产环境的目标不同。开发时要的是启动和热更新快，可以关掉压缩、用便宜的 Source Map；生产时才需要完整的压缩和优化。</p>
</blockquote>
<h2>先测量再优化</h2>
<p>构建速度可以用 <code>speed-measure-webpack-plugin</code> 看每个 loader 和插件各花了多久，或者用 webpack 自带的 <code>--profile</code> 参数。体积用 <code>webpack-bundle-analyzer</code>，它会生成一张图，每个模块占多大一目了然。</p>
<p>为什么一定要先测？因为构建慢的原因可能完全出乎意料，比如某个 loader 意外地处理了 <code>node_modules</code> 里的几千个文件，或者一个插件在每次构建时做了大量 I/O。不测就上 <code>thread-loader</code>，可能不仅没变快，还因为进程开销更慢了。</p>
<h2>一份常见的优化配置</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = {
  <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;production&#x27;</span>,
  <span class="hljs-attr">cache</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;filesystem&#x27;</span> },
  <span class="hljs-attr">module</span>: {
    <span class="hljs-attr">rules</span>: [
      {
        <span class="hljs-attr">test</span>: <span class="hljs-regexp">/\\.[jt]sx?$/</span>,
        <span class="hljs-attr">include</span>: path.<span class="hljs-title function_">resolve</span>(__dirname, <span class="hljs-string">&#x27;src&#x27;</span>),
        <span class="hljs-attr">loader</span>: <span class="hljs-string">&#x27;esbuild-loader&#x27;</span>,
        <span class="hljs-attr">options</span>: { <span class="hljs-attr">target</span>: <span class="hljs-string">&#x27;es2018&#x27;</span> },
      },
    ],
  },
  <span class="hljs-attr">optimization</span>: {
    <span class="hljs-attr">splitChunks</span>: {
      <span class="hljs-attr">chunks</span>: <span class="hljs-string">&#x27;all&#x27;</span>,
      <span class="hljs-attr">cacheGroups</span>: {
        <span class="hljs-attr">vendor</span>: { <span class="hljs-attr">test</span>: <span class="hljs-regexp">/[\\\\/]node_modules[\\\\/]/</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;vendor&#x27;</span> },
      },
    },
  },
};
</code></pre></div>
<p><code>cache.type: &#x27;filesystem&#x27;</code> 的缓存存在 <code>node_modules/.cache/webpack</code> 下。依赖或配置变了要让缓存失效，webpack 会自动追踪配置文件本身；如果构建还依赖别的文件，要在 <code>cache.buildDependencies</code> 里声明。CI 环境里每次都是全新的目录，要把这个缓存目录保存下来，缓存才有用。</p>
<p><code>splitChunks</code> 把 <code>node_modules</code> 里的代码拆成单独的 <code>vendor</code> 包。第三方依赖很少变，文件名里的哈希也就不变，用户再次访问时可以直接用浏览器缓存，只需下载变化的业务代码。不过所有依赖打成一个包可能很大，实际项目常再把大的库单独拆出来。</p>
<h2>常见追问</h2>
<p><strong>为什么 Tree shaking 没有生效？</strong></p>
<blockquote>
<p>常见原因是代码被转成了 CommonJS，比如 Babel 配置里把 <code>modules</code> 设成了 <code>commonjs</code>；或者依赖没有声明 <code>sideEffects: false</code>，webpack 不敢删；或者是 <code>export default</code> 一个大对象，用到其中一个属性也会把整个对象留下。详见<a href="/questions/engineering-treeshaking/">《Tree shaking 如何工作？为什么有些代码无法移除？》</a>。</p>
</blockquote>
<p><strong>DllPlugin 现在还需要吗？</strong></p>
<blockquote>
<p>多数项目可以先不用。DllPlugin 把不常变的依赖放到单独的编译里预先打包，webpack 的构建性能文档仍然列出了它，并说明它能提高编译速度，但会让构建流程更复杂。webpack 5 的持久化缓存也能让二次构建跳过没变的模块，配置简单得多，一般先开缓存，测量后仍然不够快再考虑 DllPlugin。</p>
</blockquote>
<p><strong>换成 Vite 是不是就不用优化了？</strong></p>
<blockquote>
<p>Vite 开发时不打包，启动和热更新的问题基本解决了。可是生产构建仍然要打包，产物体积的问题依然存在，依赖太大、没做代码分割，换了工具也一样大。</p>
</blockquote>`};export{e as default};