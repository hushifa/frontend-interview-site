var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>订单团队维护一个订单页，主站想直接用它，又不想每次订单更新都重新打包主站。用 Module Federation，订单应用在构建配置里声明“我暴露 <code>./OrderPage</code>”，主站声明“我要用 <code>orders</code> 这个远程应用”，运行时主站就像写 <code>import(&#x27;orders/OrderPage&#x27;)</code> 一样把它加载进来。</p>
<p>它的关键是共享依赖。双方都声明 <code>react</code> 为共享且是单例，页面上就只加载一份 React。粒度也很灵活，可以共享一个组件、一个工具函数，也可以是整个页面。</p>
<p>qiankun 的思路不同。它基于 single-spa，以“子应用”为单位：主应用注册子应用的入口地址，qiankun 用 fetch 拉取子应用的 HTML 和脚本，子应用导出 <code>bootstrap</code>、<code>mount</code>、<code>unmount</code> 三个生命周期，由 qiankun 在路由匹配时调用。它默认开启 JS 沙箱，样式隔离可以选 Shadow DOM 或给选择器加前缀。</p>
<p>所以要注意怎么选：多个应用技术栈相同、想细粒度共享代码，Module Federation 更合适，但它官方不提供样式隔离，要自己约定；要接入技术栈不同的老系统、看重应用级隔离，qiankun 更省事，代价是子应用要改打包格式并给静态资源开 CORS。</p>
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
<h2>qiankun 怎样接入</h2>
<p>主应用注册子应用，然后启动：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { registerMicroApps, start } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;qiankun&#x27;</span>;

<span class="hljs-title function_">registerMicroApps</span>([
  { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;orders&#x27;</span>, <span class="hljs-attr">entry</span>: <span class="hljs-string">&#x27;//localhost:7100&#x27;</span>, <span class="hljs-attr">container</span>: <span class="hljs-string">&#x27;#subapp&#x27;</span>, <span class="hljs-attr">activeRule</span>: <span class="hljs-string">&#x27;/orders&#x27;</span> },
]);
<span class="hljs-title function_">start</span>();
</code></pre></div>
<p>子应用要在入口文件里导出三个生命周期。官方说明 <code>bootstrap</code> 只在初始化时调用一次，之后再进入只调用 <code>mount</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">bootstrap</span>(<span class="hljs-params"></span>) {}
<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">mount</span>(<span class="hljs-params">props</span>) { <span class="hljs-title function_">render</span>(props.<span class="hljs-property">container</span>); }
<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">unmount</span>(<span class="hljs-params"></span>) { <span class="hljs-comment">/* 卸载根组件，清理全局副作用 */</span> }
</code></pre></div>
<p>子应用的 webpack 配置还要把 <code>output.libraryTarget</code> 设成 <code>&#x27;umd&#x27;</code>，<code>library</code> 取一个唯一的名字，qiankun 才能拿到这些导出。因为 qiankun 用 fetch 拉取子应用的资源，官方 FAQ 写明这些静态资源必须支持 CORS。</p>
<p>隔离方面，<code>sandbox</code> 默认为 true，开启 JS 沙箱。设成 <code>{ strictStyleIsolation: true }</code> 时，qiankun 会把每个子应用的容器变成 Shadow DOM；<code>experimentalStyleIsolation: true</code> 则是实验性的方案，通过给子应用的选择器加上前缀来限制作用范围。</p>
<h2>两者放在一起比</h2>
<table><thead><tr><th>维度</th><th>Module Federation</th><th>qiankun</th></tr></thead><tbody><tr><td>共享单位</td><td>模块，可以是组件、函数或页面</td><td>子应用</td></tr><tr><td>接入方式</td><td>构建插件声明 exposes / remotes</td><td>注册入口地址，子应用导出生命周期</td></tr><tr><td>依赖共享</td><td><code>shared</code> 配置，内置版本协商</td><td>不提供模块级共享，各子应用自带依赖</td></tr><tr><td>JS 隔离</td><td>同一个运行环境，不隔离</td><td>默认开启沙箱</td></tr><tr><td>样式隔离</td><td>官方不内置，靠 BEM、CSS Modules 等约定</td><td>可选 Shadow DOM 或选择器前缀</td></tr><tr><td>对子应用的改造</td><td>用支持的构建工具加插件</td><td>打包成 umd、导出生命周期、资源开 CORS</td></tr></tbody></table>
<p>两者也不是二选一。Module Federation 2.0 的 Bridge 能力可以加载整个应用级模块并管理挂载和卸载，官方说明支持在 React 应用里加载 Vue 应用等跨框架场景。是否值得引入，仍然取决于团队要不要独立部署、技术栈是否统一。</p>
<h2>常见追问</h2>
<p><strong>Module Federation 的远程模块加载失败怎么办？</strong></p>
<blockquote>
<p>主站用 <code>React.lazy</code> 加载时，要外包一层错误边界，显示降级内容或重试按钮，不能让整页白屏。远程应用和主站之间暴露的模块名和 props 要当作接口来维护，做到向后兼容。</p>
</blockquote>
<p><strong>qiankun 的样式隔离为什么不是默认开启？</strong></p>
<blockquote>
<p>官方 API 里 <code>sandbox</code> 默认只开 JS 沙箱，样式隔离要显式配置。<code>strictStyleIsolation</code> 把子应用放进 Shadow DOM，外部样式进不来、内部样式出不去，依赖全局样式的组件可能表现不同；<code>experimentalStyleIsolation</code> 文档标明是实验性的。所以要按项目情况选择并逐页验证。</p>
</blockquote>
<p><strong>两个方案各自的共享依赖问题一样吗？</strong></p>
<blockquote>
<p>不一样。Module Federation 的风险是共享版本协商出错，加载了多份或版本不兼容；qiankun 默认各子应用自带依赖，风险是重复加载导致体积变大。</p>
</blockquote>`};export{e as default};