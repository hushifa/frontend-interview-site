var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>改了一个按钮的颜色，保存以后页面马上变了，而且表单里填的内容、打开的弹窗都还在，这就是热模块替换，简称 HMR。它只替换改动的那个模块，不重新加载整个页面，所以页面状态能保留下来。</p>
<p>过程分两端。开发服务器这边监听文件变化，文件一改，就重新编译受影响的模块，然后通过一条 WebSocket 连接告诉浏览器“有更新了”。浏览器这边有一段 HMR 运行时代码，它收到通知后去下载更新后的模块，再把旧模块替换掉。</p>
<p>替换不是自动就能安全完成的，模块要声明自己能接受更新。HMR 运行时从改动的模块开始，沿着“谁导入了它”这条链往上找，找到第一个声明了接受更新的模块，就在那里执行替换。Vue 和 React 的组件之所以改完就能热更新，是因为对应的插件（vue-loader、React Fast Refresh 等）自动给组件加上了这段接受更新的代码。</p>
<p>要注意，一直找到入口都没有模块接受更新，HMR 就没法安全替换，只能退回整页刷新。改了 <code>main.js</code>、全局配置这类被很多模块依赖、又没人接受更新的文件，就会看到整页刷新。</p>
</blockquote>
<h2>模块怎样声明接受更新</h2>
<p>Vite 里写法是 <code>import.meta.hot.accept</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">let</span> count = <span class="hljs-number">1</span>;

<span class="hljs-keyword">if</span> (<span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">hot</span>) {
  <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">hot</span>.<span class="hljs-title function_">accept</span>(<span class="hljs-function">(<span class="hljs-params">newModule</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (newModule) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;新的 count：&#x27;</span>, newModule.<span class="hljs-property">count</span>);
  });
}
</code></pre></div>
<p><code>if (import.meta.hot)</code> 为什么要加？因为生产构建里没有 HMR，<code>import.meta.hot</code> 是 <code>undefined</code>，这段代码会被删掉，不会进入最终产物。webpack 对应的写法是 <code>module.hot.accept</code>。</p>
<p>声明接受更新以后，这个模块改动时，回调会拿到新模块，你决定怎样用新值替换旧状态。这就是为什么组件的热更新能保留状态：插件在回调里只替换组件的渲染函数，组件实例和它的状态不动。</p>
<h2>更新在模块之间怎样冒泡</h2>
<p>假设依赖关系是 <code>main.js → App.vue → utils.js</code>，你改了 <code>utils.js</code>：</p>
<p><code>utils.js</code> 自己没有声明接受更新，运行时就看导入它的 <code>App.vue</code>。<code>App.vue</code> 被 Vue 插件加上了接受更新的代码，于是在这里接住，重新执行 <code>App.vue</code> 和它依赖的新 <code>utils.js</code>，页面更新。</p>
<p>如果 <code>utils.js</code> 是被 <code>main.js</code> 直接导入的，而 <code>main.js</code> 没有声明接受更新，那就一路冒泡到入口也没人接住，运行时只能刷新整个页面。webpack 文档把这个过程描述为：从改动的模块沿着导入它的模块往上走，直到找到接受这次变化的模块。</p>
<h2>为什么 Vite 的热更新快</h2>
<p>webpack 改动一个文件后，要重新构建包含这个模块的打包块，项目越大越慢。Vite 开发时不打包，浏览器直接用原生 ES 模块按需请求，改了哪个文件，只需重新转换这一个文件，让浏览器重新请求它，所以热更新速度基本不随项目规模变慢。原理见<a href="/questions/eng-vite/">《Vite 开发模式为什么启动快，生产环境为什么仍需要构建？》</a>。</p>
<h2>常见追问</h2>
<p><strong>热更新后状态为什么有时会丢？</strong></p>
<blockquote>
<p>状态如果存在被替换的模块里，比如模块顶层的变量，替换后就是新模块的初始值。React Fast Refresh 会尽量保留函数组件的状态，<code>useState</code> 和 <code>useRef</code> 只要参数和 Hook 调用顺序没变，就保留原来的值。可是改了 Hook 的参数或调用顺序、文件除了组件还导出了别的东西、组件是 class 组件或匿名箭头函数，状态都会重置。</p>
</blockquote>
<p><strong>修改 CSS 为什么几乎总能热更新？</strong></p>
<blockquote>
<p>CSS 没有运行时状态，替换样式不会破坏任何东西。开发环境下样式通常以 <code>&lt;style&gt;</code> 标签插入，更新时直接替换标签内容就行，所以不需要模块声明接受更新。</p>
</blockquote>`};export{e as default};