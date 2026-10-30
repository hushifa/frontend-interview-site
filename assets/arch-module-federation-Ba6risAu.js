var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>订单团队维护一个订单页，主站想直接用它，又不想每次订单更新都重新打包主站。用 Module Federation，订单应用在构建配置里声明“我暴露 <code>./OrderPage</code>”，主站声明“我要用 <code>orders</code> 这个远程应用”，运行时主站就像写 <code>import(&#x27;orders/OrderPage&#x27;)</code> 一样把它加载进来。</p>
<p>它的关键是共享依赖。双方都声明 <code>react</code> 为共享且是单例，页面上就只加载一份 React。粒度也很灵活，可以共享一个组件、一个工具函数，也可以是整个页面。</p>
<p>远程模块是运行时加载的，所以要注意两件事。一是加载失败时主站要有错误边界和降级内容；二是官方不提供样式隔离，远程组件和主站在同一个文档里，要靠 CSS Modules 等约定避免冲突。</p>
<p>它适合技术栈统一、想细粒度共享代码的团队。要接入技术栈不同的老系统、看重隔离时，和 qiankun、无界怎么选，见<a href="/questions/arch-microfrontend-compare/">《qiankun、无界和 Module Federation 怎么选？JS 沙箱、样式隔离和通信有什么不同？》</a>。</p>
</blockquote>
<h2>Module Federation 怎样配置</h2>
<p>微前端适合解决什么问题、有哪几类集成方式，见<a href="/questions/architecture-microfrontend/">《微前端适合解决什么组织和部署问题？》</a>。这里只看 Module Federation 本身。</p>
<p>Module Federation 由 webpack 5 在 2019 年引入。官方文档把后来的 Module Federation 2.0 和 webpack 5 内置版本区分开：2.0 除了模块导出、加载和依赖共享，还提供动态类型提示、Manifest、Federation Runtime 和运行时插件系统，并支持 Rspack 和 webpack。</p>
<p>提供模块的一方叫生产者，下面是订单应用：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 生产者：orders 应用</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">ModuleFederationPlugin</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;orders&#x27;</span>,
  <span class="hljs-attr">exposes</span>: { <span class="hljs-string">&#x27;./OrderPage&#x27;</span>: <span class="hljs-string">&#x27;./src/OrderPage.tsx&#x27;</span> },
  <span class="hljs-attr">shared</span>: { <span class="hljs-attr">react</span>: { <span class="hljs-attr">singleton</span>: <span class="hljs-literal">true</span> }, <span class="hljs-string">&#x27;react-dom&#x27;</span>: { <span class="hljs-attr">singleton</span>: <span class="hljs-literal">true</span> } },
});
</code></pre></div>
<p>使用模块的一方叫消费者。按官方 <code>remotes</code> 文档，配置了 <code>remotes</code> 就可以视为消费者，值的格式是“生产者名称 + <code>@</code> + 入口地址”，入口可以是 <code>remoteEntry.js</code>，也可以是 <code>mf-manifest.json</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 消费者：主站</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">ModuleFederationPlugin</span>({
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;shell&#x27;</span>,
  <span class="hljs-attr">remotes</span>: { <span class="hljs-attr">orders</span>: <span class="hljs-string">&#x27;orders@https://orders.example.com/mf-manifest.json&#x27;</span> },
  <span class="hljs-attr">shared</span>: { <span class="hljs-attr">react</span>: { <span class="hljs-attr">singleton</span>: <span class="hljs-literal">true</span> }, <span class="hljs-string">&#x27;react-dom&#x27;</span>: { <span class="hljs-attr">singleton</span>: <span class="hljs-literal">true</span> } },
});

<span class="hljs-comment">// 主站代码里</span>
<span class="hljs-keyword">const</span> <span class="hljs-title class_">OrderPage</span> = <span class="hljs-title class_">React</span>.<span class="hljs-title function_">lazy</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;orders/OrderPage&#x27;</span>));
</code></pre></div>
<p>入口用 <code>mf-manifest.json</code> 时，官方说明会额外获得动态类型提示、资源预加载和 Chrome 调试工具支持。</p>
<h2>shared 的几个选项怎样理解</h2>
<p><code>singleton</code> 表示共享作用域里只允许一个版本。官方文档的描述是：开启后双方的共享依赖只加载一次，版本不一致时加载较高的版本，并给版本较低的一方警告；不开启时，版本不同就各自加载自己的。</p>
<p><code>requiredVersion</code> 声明要求的版本。实际版本低于要求时，控制台会警告，并使用共享依赖里可用的最小版本。</p>
<p><code>eager</code> 设为 true 会把共享依赖打进入口文件，入口会变大，文档提醒谨慎使用。正常情况下应该用异步入口，按需加载共享模块。</p>
<p>还有一个容易漏掉的坑：文档专门提醒，只把 <code>react-dom</code> 设为共享时，代码里 <code>import { createRoot } from &#x27;react-dom/client&#x27;</code> 这种子路径导入不会自动共享，会多加载一份 React DOM，破坏 React 的单例要求。</p>
<h2>不只是加载组件</h2>
<p>Module Federation 2.0 的 Bridge 能力可以加载整个应用级模块并管理挂载和卸载，官方说明支持在 React 应用里加载 Vue 应用等跨框架场景。远程模块和主站跑在同一个运行环境里，不做 JS 沙箱，样式也要自己约定隔离，官方的样式隔离文档推荐 CSS Modules、BEM 这类方案。</p>
<h2>常见追问</h2>
<p><strong>Module Federation 的远程模块加载失败怎么办？</strong></p>
<blockquote>
<p>主站用 <code>React.lazy</code> 加载时，要外包一层错误边界，显示降级内容或重试按钮，不能让整页白屏。远程应用和主站之间暴露的模块名和 props 要当作接口来维护，做到向后兼容。</p>
</blockquote>
<p><strong>怎样确认 React 只加载了一份？</strong></p>
<blockquote>
<p>双方都把 <code>react</code> 和 <code>react-dom</code> 声明成 <code>singleton</code>，并注意 <code>react-dom/client</code> 这类子路径导入也要按官方说明一起共享。版本不一致时，开启 singleton 会加载较高的版本并警告低版本一方，看控制台警告就能发现问题。</p>
</blockquote>`};export{e as default};