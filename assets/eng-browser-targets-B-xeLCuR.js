var e={answerHtml:`<h2>简答</h2>
<ul>
<li>编译目标（target）只决定语法怎样降级，例如把可选链改写成条件判断。</li>
<li>新的内置 API（如 <code>Array.prototype.toSorted</code>）属于运行时能力，语法转换不会补上，需要 polyfill 或特性检测。</li>
<li>TypeScript 的 <code>lib</code> 只影响类型检查，不会给运行环境增加任何 API。</li>
<li>CSS 新特性、安全上下文要求和权限限制都不归 JavaScript 构建目标管。</li>
<li>支持范围要写成可执行的浏览器列表，并在这些浏览器里实际测试。</li>
</ul>
<h2>语法和 API 是两类问题</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> name = user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span>;
<span class="hljs-keyword">const</span> sorted = list.<span class="hljs-title function_">toSorted</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);
</code></pre></div>
<p>第一行是语法。把 target 设得足够低，构建工具会把 <code>?.</code> 改写成旧浏览器能解析的代码。第二行是对内置方法的调用，语法很普通，旧浏览器能解析，但运行时找不到 <code>toSorted</code> 就会抛 TypeError。构建工具默认不会为它注入实现。</p>
<p>所以&quot;降低 target 后旧浏览器还是报错&quot;很常见：报错往往来自缺失的 API，而不是语法。</p>
<h2>各项配置分别管什么</h2>
<table><thead><tr><th>配置</th><th>影响</th><th>不影响</th></tr></thead><tbody><tr><td>构建 target（Vite <code>build.target</code>、esbuild/Oxc 目标）</td><td>语法降级和压缩方式</td><td>内置 API 是否存在</td></tr><tr><td>TypeScript <code>lib</code></td><td>哪些 API 能通过类型检查</td><td>产物和运行环境</td></tr><tr><td>polyfill（如 core-js）</td><td>在运行时补齐缺失 API</td><td>无法补齐的能力（如新的 CSS 布局、硬件 API）</td></tr><tr><td>Browserslist</td><td>让支持它的工具共享同一份浏览器列表</td><td>工具自身不读它时无效</td></tr></tbody></table>
<p>Vite 的默认构建目标面向支持原生 ES 模块和动态导入的浏览器。需要更旧的浏览器时，官方提供 <code>@vitejs/plugin-legacy</code>，它会额外生成旧浏览器产物并按需注入 polyfill。</p>
<h2>polyfill 的取舍</h2>
<p>全量引入 polyfill 会让所有用户为少数旧浏览器承担体积。常见做法：</p>
<ul>
<li>按目标浏览器和实际用到的 API 按需注入。</li>
<li>对可选增强功能用特性检测，缺失时走降级路径，而不是补一个不完整的实现。</li>
<li>有些能力没法 polyfill，例如 Service Worker、WebGPU、新的 CSS 选择器，只能检测后降级。</li>
</ul>
<h2>CSS 和环境限制</h2>
<p>CSS 新语法由 PostCSS、Lightning CSS 等单独处理，可以加前缀或降级部分写法，但 <code>:has()</code>、容器查询这类能力在不支持的浏览器里补不出来，要用 <code>@supports</code> 提供回退。</p>
<p>剪贴板、Service Worker、Web Crypto 的 <code>subtle</code> 等 API 要求安全上下文（HTTPS 或 localhost）。开发时在 localhost 正常，部署到 HTTP 内网地址就失效，这和构建目标无关。</p>
<h2>怎样定义支持范围</h2>
<p>把&quot;支持主流浏览器&quot;改成可检查的列表，例如&quot;最近两个大版本的 Chrome、Edge、Firefox、Safari，以及 iOS Safari 16.4+&quot;，写进 Browserslist 或构建配置。然后：</p>
<ol>
<li>构建配置和 polyfill 策略都从这份列表推导。</li>
<li>CI 里至少在列表的最低版本上跑一遍关键流程。</li>
<li>对列表外的浏览器给出明确的降级体验或提示。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>为什么类型检查通过，线上却报 <code>xxx is not a function</code>？因为 <code>lib</code> 声明了 API，但目标浏览器没有实现。</li>
<li>可以只靠 target 解决兼容吗？不行，target 只处理语法。</li>
</ul>`};export{e as default};