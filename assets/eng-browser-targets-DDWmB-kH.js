var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>配置的起点是一份 browserslist：用自己网站的访问统计和业务要求定出支持范围，写在 <code>package.json</code> 或 <code>.browserslistrc</code> 里，Babel、Autoprefixer 这类工具都读它，范围只在一个地方定义。</p>
<p>然后要分两类问题看。一类是语法，比如旧浏览器看不懂 <code>?.</code>；另一类是 API，比如旧浏览器里数组根本没有 <code>toSorted</code> 方法。</p>
<p>构建工具的编译目标，也就是 target，只管第一类，它会把新语法改写成旧浏览器能解析的写法。第二类要靠 polyfill，也就是在运行时补上缺失的方法，或者先做特性检测再降级。TypeScript 的 <code>lib</code> 只影响类型检查，不会给浏览器添加任何 API。</p>
<p>CSS 新特性、HTTPS 这类安全上下文要求，也不归 JavaScript 的 target 管，要分别处理。所以这几项配置要从同一份浏览器列表推导，各管各的，再在列表里的最低版本上实际测一遍。</p>
</blockquote>
<h2>支持范围怎样用数据定</h2>
<p>支持范围应该来自自己用户的实际情况，而不是凭感觉。browserslist 的查询除了全球使用率，还支持 <code>&gt; 0.5% in my stats</code> 这类按自定义统计数据计算的写法，README 里列出了从 Google Analytics、Plausible 等平台导出数据的工具。</p>
<p>如果没有统计数据，browserslist 提供了 <code>defaults</code>，等于 <code>&gt; 0.5%, last 2 versions, Firefox ESR, not dead</code>，README 说它对大多数用户是合理的配置。<code>not dead</code> 用来排除超过 24 个月没有官方支持或更新的浏览器。想自己调整时，README 建议包含 <code>last 2 versions, not dead, &gt; 0.2%</code>，原因是只写 <code>last n versions</code> 不会包含仍然流行的老版本，只按使用率筛选又会让流行的浏览器越来越流行。</p>
<p>README 还提醒了两点：不要因为不认识某个浏览器就把它删掉，比如 Opera Mini 在非洲有上亿用户；只有在给只有一种浏览器的设备做应用时，才直接写 <code>last 2 Chrome versions</code> 这样的指定版本。另外它支持按 Baseline 查询，比如 <code>baseline widely available</code>，选出能支持所有“广泛可用”特性的浏览器版本。</p>
<h2>怎样把范围写进 browserslist</h2>
<p>配置写在 <code>package.json</code> 的 <code>browserslist</code> 字段或项目根目录的 <code>.browserslistrc</code> 文件里：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">&gt; 0.5%
last 2 versions
not dead
</code></pre></div>
<p>在项目目录运行 <code>npx browserslist</code>，就能看到这份配置实际选出了哪些浏览器和版本。这一步很有用，因为 <code>&gt; 0.5%</code> 这类条件选出来的结果并不直观，团队讨论时直接看列表更清楚。</p>
<p>browserslist 的版本数据来自 caniuse-lite，会随时间过时。README 推荐用 <code>update-browserslist-db</code> 更新数据，所以同一份配置隔一段时间选出的版本会变，这是期望的行为，配置描述的是规则而不是固定版本号。</p>
<h2>语法和 API 是两类问题</h2>
<p>先看两行代码，它们在旧浏览器里出问题的原因完全不同。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> name = user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span>;
<span class="hljs-keyword">const</span> sorted = list.<span class="hljs-title function_">toSorted</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a - b);
</code></pre></div>
<p>第一行是语法问题。旧浏览器的解析器不认识 <code>?.</code>，整个文件都会解析失败。把 target 设得足够低，构建工具会把它改写成普通的条件判断，问题就解决了。</p>
<p>第二行的语法很普通，旧浏览器能正常解析。可是运行到这里时，数组上找不到 <code>toSorted</code>，就会抛出 TypeError。构建工具默认不会替你注入这个方法的实现。</p>
<p>所以经常有人遇到“target 已经降低了，旧浏览器还是报错”。这时报错往往来自缺失的 API，而不是语法。线上遇到这类报错怎样定位，见<a href="/questions/eng-browser-compat/">《遇到浏览器兼容问题怎样排查和降级？》</a>。</p>
<h2>各项配置分别管什么</h2>
<p>构建 target，比如 Vite 的 <code>build.target</code>，管的是语法怎样降级，它不关心内置 API 是否存在。</p>
<p>TypeScript 的 <code>lib</code> 决定哪些内置 API 的类型声明可用。它只是类型声明，不会改变产物，也不会改变运行环境。所以 <code>lib</code> 里写了 ES2023，代码里用 <code>toSorted</code> 不报类型错误，但浏览器没有实现照样运行失败。</p>
<p>polyfill，比如 core-js，是在运行时把缺失的 API 补上。可是有些能力补不出来，比如新的 CSS 布局。</p>
<p>Browserslist 是一份浏览器列表，让支持它的工具共用同一个范围。工具本身不读它的话，写了也没用。</p>
<p>Vite 8 的默认 <code>build.target</code> 是 <code>&#x27;baseline-widely-available&#x27;</code>。意思是每个大版本固定一个日期，取那时 Baseline 广泛可用的浏览器版本，文档列出的是 <code>[&#x27;chrome111&#x27;, &#x27;edge111&#x27;, &#x27;firefox114&#x27;, &#x27;safari16.4&#x27;, &#x27;ios16.4&#x27;]</code>。自定义 target 最低可以写到 <code>es2015</code>。需要支持更旧的浏览器时，官方提供 <code>@vitejs/plugin-legacy</code>，它会额外生成一份旧浏览器产物和对应的语言特性 polyfill，只在不支持原生 ESM 的浏览器里加载。</p>
<h2>polyfill 该怎样引入</h2>
<p>全量引入 polyfill，等于让所有用户为少数旧浏览器多下载一大块代码。所以常见做法是按目标浏览器和实际用到的 API 按需注入。</p>
<p>对于可有可无的增强功能，更好的办法是特性检测：先判断浏览器有没有这个能力，没有就走降级路径，而不是补一个不完整的实现。有些能力本来就没法 polyfill，只能检测后降级。特性检测的写法见<a href="/questions/eng-browser-compat/">《遇到浏览器兼容问题怎样排查和降级？》</a>。</p>
<h2>CSS 和运行环境的限制</h2>
<p>CSS 新语法由 PostCSS、Lightning CSS 这类工具单独处理。它们可以加前缀，也能降级一部分写法。但 <code>:has()</code>、容器查询这类能力，在不支持的浏览器里补不出来，要用 <code>@supports</code> 写回退样式。</p>
<p>还有一类问题跟构建完全无关。MDN 说明，Service Worker 只能在安全上下文里注册，剪贴板、Web Crypto 的 <code>subtle</code> 等 API 也有同样的要求。安全上下文包括 HTTPS 和 <code>http://localhost</code>，但不包括 <code>http://192.168.1.10</code> 这样的内网 HTTP 地址。所以开发时在 localhost 一切正常，部署到 HTTP 的内网地址就失效了，这时改 target 没有任何用处。</p>
<h2>常见追问</h2>
<p><strong>为什么类型检查通过了，线上却报 <code>xxx is not a function</code>？</strong></p>
<blockquote>
<p>因为 TypeScript 的 <code>lib</code> 里声明了这个 API，类型检查就放行了。可是 <code>lib</code> 只是类型声明，目标浏览器实际没有实现这个方法，运行时就找不到它。</p>
</blockquote>
<p><strong>只靠 target 能解决兼容问题吗？</strong></p>
<blockquote>
<p>不行。target 只负责把新语法改写成旧写法。缺失的内置 API 要靠 polyfill 或特性检测，CSS 和安全上下文的问题也要单独处理。</p>
</blockquote>`};export{e as default};