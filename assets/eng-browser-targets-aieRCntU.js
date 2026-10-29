var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器兼容要分两类问题看。一类是语法，比如旧浏览器看不懂 <code>?.</code>；另一类是 API，比如旧浏览器里数组根本没有 <code>toSorted</code> 方法。</p>
<p>构建工具的编译目标，也就是 target，只管第一类，它会把新语法改写成旧浏览器能解析的写法。第二类要靠 polyfill，也就是在运行时补上缺失的方法，或者先做特性检测再降级。TypeScript 的 <code>lib</code> 只影响类型检查，不会给浏览器添加任何 API。</p>
<p>CSS 新特性、HTTPS 这类安全上下文要求，也不归 JavaScript 的 target 管，要分别处理。</p>
<p>所以“支持哪些浏览器”最好写成一份具体的列表，构建配置和 polyfill 都从它推导，再在列表里的最低版本上实际测一遍。</p>
</blockquote>
<h2>语法和 API 是两类问题</h2>
<p>先看两行代码，它们在旧浏览器里出问题的原因完全不同。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> name = user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span>;
<span class="hljs-keyword">const</span> sorted = list.<span class="hljs-title function_">toSorted</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);
</code></pre></div>
<p>第一行是语法问题。旧浏览器的解析器不认识 <code>?.</code>，整个文件都会解析失败。把 target 设得足够低，构建工具会把它改写成普通的条件判断，问题就解决了。</p>
<p>第二行的语法很普通，旧浏览器能正常解析。可是运行到这里时，数组上找不到 <code>toSorted</code>，就会抛出 TypeError。构建工具默认不会替你注入这个方法的实现。</p>
<p>所以经常有人遇到“target 已经降低了，旧浏览器还是报错”。这时报错往往来自缺失的 API，而不是语法。</p>
<h2>各项配置分别管什么</h2>
<p>构建 target，比如 Vite 的 <code>build.target</code>，管的是语法怎样降级、怎样压缩，它不关心内置 API 是否存在。</p>
<p>TypeScript 的 <code>lib</code> 决定哪些 API 能通过类型检查。它只是类型声明，不会改变产物，也不会改变运行环境。所以 <code>lib</code> 里写了 ES2023，代码里用 <code>toSorted</code> 不报类型错误，但浏览器没有实现照样运行失败。</p>
<p>polyfill，比如 core-js，是在运行时把缺失的 API 补上。可是有些能力补不出来，比如新的 CSS 布局、硬件相关的 API。</p>
<p>Browserslist 是一份浏览器列表，让支持它的工具共用同一个范围。工具本身不读它的话，写了也没用。</p>
<p>Vite 的默认 <code>build.target</code> 是 <code>&#x27;baseline-widely-available&#x27;</code>。意思是每个大版本固定一个日期，取那时 Baseline 广泛可用的浏览器版本，Vite 8 对应 Chrome 111、Firefox 114、Safari 16.4。需要支持更旧的浏览器时，官方提供 <code>@vitejs/plugin-legacy</code>，它会额外生成一份旧浏览器产物，并按需注入 polyfill。</p>
<h2>polyfill 该怎样引入</h2>
<p>全量引入 polyfill，等于让所有用户为少数旧浏览器多下载一大块代码。所以常见做法是按目标浏览器和实际用到的 API 按需注入。</p>
<p>对于可有可无的增强功能，更好的办法是特性检测：先判断浏览器有没有这个能力，没有就走降级路径，而不是补一个不完整的实现。还有一些能力本来就没法 polyfill，比如 Service Worker、WebGPU、新的 CSS 选择器，只能检测后降级。</p>
<h2>CSS 和运行环境的限制</h2>
<p>CSS 新语法由 PostCSS、Lightning CSS 这类工具单独处理。它们可以加前缀，也能降级一部分写法。但 <code>:has()</code>、容器查询这类能力，在不支持的浏览器里补不出来，要用 <code>@supports</code> 写回退样式。</p>
<p>还有一类问题跟构建完全无关。剪贴板、Service Worker、Web Crypto 的 <code>subtle</code> 等 API 要求安全上下文，也就是 HTTPS 或 localhost。开发时在 localhost 一切正常，部署到 HTTP 的内网地址就失效了，这时改 target 没有任何用处。</p>
<h2>怎样定义支持范围</h2>
<p>“支持主流浏览器”这句话没法检查。要改成具体的列表，比如“最近两个大版本的 Chrome、Edge、Firefox、Safari，以及 iOS Safari 16.4+”，写进 Browserslist 或构建配置。</p>
<p>然后，构建配置和 polyfill 策略都从这份列表推导出来。CI 里至少在列表的最低版本上跑一遍关键流程。对列表之外的浏览器，给出明确的降级体验或提示。</p>
<h2>常见追问</h2>
<p><strong>为什么类型检查通过了，线上却报 <code>xxx is not a function</code>？</strong></p>
<blockquote>
<p>因为 TypeScript 的 <code>lib</code> 里声明了这个 API，类型检查就放行了。可是 <code>lib</code> 只是类型声明，目标浏览器实际没有实现这个方法，运行时就找不到它。</p>
</blockquote>
<p><strong>只靠 target 能解决兼容问题吗？</strong></p>
<blockquote>
<p>不行。target 只负责把新语法改写成旧写法。缺失的内置 API 要靠 polyfill 或特性检测，CSS 和安全上下文的问题也要单独处理。</p>
</blockquote>`};export{e as default};