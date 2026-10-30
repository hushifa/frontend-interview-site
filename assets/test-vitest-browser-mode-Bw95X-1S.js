var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如测一个组件，它依赖元素的真实尺寸、CSS 布局或者焦点行为。在 jsdom 这种模拟环境里跑，测试通过了也不一定代表真实浏览器里没问题。Vitest Browser Mode 就是为这类情况准备的，它让测试直接在真实浏览器里运行。</p>
<p>区别在于运行环境。jsdom 和 happy-dom 是在 Node 里模拟出的浏览器环境，设置简单、启动快；可官方文档说，它们只是模拟，不是真实浏览器，差异可能让测试结果出现误报或漏报。Browser Mode 通过 Playwright 或 WebdriverIO 驱动 Chromium、Firefox、WebKit 等浏览器，测试里的 <code>window</code>、<code>document</code> 就是真实浏览器的。</p>
<p>用法上，配置里设置 <code>browser.enabled: true</code>，选一个 provider，再至少声明一个浏览器实例。交互要用 <code>vitest/browser</code> 提供的 <code>userEvent</code>，它会真正触发浏览器事件，而 <code>@testing-library/user-event</code> 只是模拟事件。</p>
<p>要注意代价和限制。启动时要拉起 provider 和浏览器，初始化比 jsdom 慢；它也不能完全替代 Playwright 这类端到端测试。另外 <code>alert</code>、<code>confirm</code> 会阻塞页面，Vitest 会默认 mock 掉，但最好自己显式 mock；<code>vi.spyOn</code> 不能直接监听 ES 模块的导出，要改用 <code>vi.mock(path, { spy: true })</code>。</p>
</blockquote>
<h2>jsdom 的问题在哪里</h2>
<p>测试环境默认是 <code>node</code>，测试里要用 <code>document</code> 时才切换成 <code>jsdom</code> 或 <code>happy-dom</code>，这部分见<a href="/questions/testing-unit-jest-vitest/">《前端单元测试怎么写？Jest 和 Vitest 有什么区别？》</a>。jsdom 用 JavaScript 实现了 DOM 和一部分浏览器 API，所以组件能挂载、能查询元素、能派发事件。</p>
<p>可它没有真实的渲染引擎。Vitest 官方文档的说法是：这些工具只模拟浏览器环境，不是真实浏览器，模拟环境和真实环境之间可能有差异，测试结果就可能出现误报或漏报。依赖布局、样式计算、真实焦点和原生事件顺序的代码，在这里测不准。</p>
<h2>怎样开启 Browser Mode</h2>
<p>最快的方式是运行 <code>npx vitest init browser</code>，让 Vitest 自动生成配置。手写时，配置大致是这样：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest/config&#x27;</span>;
<span class="hljs-keyword">import</span> { playwright } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@vitest/browser-playwright&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">test</span>: {
    <span class="hljs-attr">browser</span>: {
      <span class="hljs-attr">enabled</span>: <span class="hljs-literal">true</span>,
      <span class="hljs-attr">provider</span>: <span class="hljs-title function_">playwright</span>(),
      <span class="hljs-attr">instances</span>: [{ <span class="hljs-attr">browser</span>: <span class="hljs-string">&#x27;chromium&#x27;</span> }],
    },
  },
});
</code></pre></div>
<p>provider 有三种。<code>preview</code> 适合本地看一眼，但官方不建议依赖它，因为它是模拟事件，不走 Chrome DevTools 协议；在 CI 里要用 <code>playwright</code> 或 <code>webdriverio</code>。官方推荐先用 Playwright，因为它支持并行执行，跑得更快，可以驱动 Chromium、Firefox 和 WebKit。CI 上一般还要开 <code>headless: true</code>，或者命令行加 <code>--browser.headless</code>。</p>
<p>一个项目里通常既有纯函数测试，也有组件测试。纯函数没必要进浏览器，可以用 Vitest 的 <code>projects</code> 把两类测试分开，一部分跑 Node，一部分跑浏览器。</p>
<h2>写测试时要换掉什么</h2>
<p>交互要用 <code>vitest/browser</code> 导出的 <code>userEvent</code>，不要用 <code>@testing-library/user-event</code>。官方解释是后者只是模拟事件，前者会通过 provider 真正触发浏览器事件。组件测试应该围绕哪些用户行为，见<a href="/questions/testing-component/">《前端组件测试应该围绕哪些用户行为？》</a>。</p>
<p>模块 mock 也有差别。浏览器里的原生 ES 模块命名空间是密封的，<code>vi.spyOn(module, &#x27;method&#x27;)</code> 会直接报错，要改成 <code>vi.mock(&#x27;./module.js&#x27;, { spy: true })</code>。导出的变量也不能从外面直接改，只能通过模块自己导出的 setter 函数修改。</p>
<p><code>alert</code>、<code>confirm</code>、<code>print</code> 会阻塞页面，Vitest 就没法继续和页面通信了。Vitest 会给它们默认的 mock，官方仍建议在测试里自己 mock，让行为明确。</p>
<h2>常见追问</h2>
<p><strong>有了 Browser Mode，还需要 Playwright 端到端测试吗？</strong></p>
<blockquote>
<p>需要。官方文档明确说 Browser Mode 不能完全替代独立的端到端测试工具，建议和 WebdriverIO、Cypress 或 Playwright 搭配。Browser Mode 测的是单个组件或模块在真实浏览器里的行为，端到端测试走的是整个应用的完整流程，见<a href="/questions/test-e2e/">《如何减少 Playwright 端到端测试的不稳定？》</a>。</p>
</blockquote>
<p><strong>全部测试都搬进浏览器会怎样？</strong></p>
<blockquote>
<p>会变慢。每次运行都要启动 provider 和浏览器，官方也提到初始化时间比其他测试方式长。纯逻辑测试留在 Node，只把依赖真实 DOM、样式和事件的测试放进浏览器，更划算。</p>
</blockquote>
<p><strong>happy-dom 和 jsdom 选哪个？</strong></p>
<blockquote>
<p>两者都是模拟环境，官方文档对它们的评价一样：设置简单，但不是真实浏览器。如果关键行为在模拟环境里测不准，换另一个模拟环境解决不了根本问题，应该把那部分测试放进 Browser Mode。</p>
</blockquote>`};export{e as default};