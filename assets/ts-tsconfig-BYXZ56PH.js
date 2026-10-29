var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>tsconfig 里的选项分几类，各管一件事。<code>strict</code> 是一组检查的总开关，包括 <code>strictNullChecks</code>、<code>noImplicitAny</code>、<code>strictFunctionTypes</code> 等，TypeScript 6.0 起默认开启。但 <code>noUncheckedIndexedAccess</code>、<code>exactOptionalPropertyTypes</code> 不在这组里，要单独开。</p>
<p><code>target</code> 决定输出什么版本的语法，<code>lib</code> 决定能用哪些内置 API 的类型，两者都不会补上运行时缺的 API。<code>module</code> 和 <code>moduleResolution</code> 要跟真实运行环境一致：交给打包工具就用 <code>bundler</code>，Node.js 直接运行就用 <code>nodenext</code>。</p>
<p>版本变化也要知道。TypeScript 6.0 改了一批默认值，比如 <code>types</code> 默认变成 <code>[]</code>，Node、测试框架的全局类型要在 <code>types</code> 里显式列出。6.0 弃用的 <code>target: es5</code>、<code>moduleResolution: node10/classic</code>、<code>baseUrl</code>、<code>downlevelIteration</code>、<code>module: amd/umd/system/none</code> 到 TypeScript 7.0 不再支持，<code>esModuleInterop</code>、<code>alwaysStrict</code> 也不能再设为 <code>false</code>；<code>outFile</code> 在 6.0 就已经移除。</p>
<p>最后，Vite、esbuild 这类工具只删类型、不做检查，构建成功不代表类型正确，CI 里要单独跑 <code>tsc --noEmit</code>。</p>
</blockquote>
<h2>打包工具项目可以从这里起步</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;compilerOptions&quot;: {
    &quot;target&quot;: &quot;es2022&quot;,
    &quot;lib&quot;: [&quot;es2023&quot;, &quot;dom&quot;, &quot;dom.iterable&quot;],
    &quot;module&quot;: &quot;esnext&quot;,
    &quot;moduleResolution&quot;: &quot;bundler&quot;,
    &quot;types&quot;: [&quot;vite/client&quot;],
    &quot;strict&quot;: true,
    &quot;noUncheckedIndexedAccess&quot;: true,
    &quot;exactOptionalPropertyTypes&quot;: true,
    &quot;verbatimModuleSyntax&quot;: true,
    &quot;noEmit&quot;: true
  },
  &quot;include&quot;: [&quot;src&quot;]
}
</code></pre></div>
<p><code>noEmit: true</code> 表示 tsc 只做类型检查，不输出文件，转换交给 Vite 或 esbuild。6.0 起 <code>strict</code> 已经默认开启，这里还写出来，是为了兼容 6.0 之前的版本。</p>
<h2>读数组为什么会漏掉 undefined</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> <span class="hljs-attr">list</span>: <span class="hljs-built_in">string</span>[] = [];
<span class="hljs-keyword">const</span> first = list[<span class="hljs-number">0</span>];
first.<span class="hljs-title function_">toUpperCase</span>();
</code></pre></div>
<p>数组是空的，<code>list[0]</code> 明明是 <code>undefined</code>，可默认配置下 <code>first</code> 的类型是 <code>string</code>，这段代码能通过检查，运行时却抛错。原因是 TypeScript 默认假设按下标读一定能读到值。</p>
<p>开启 <code>noUncheckedIndexedAccess</code> 后，<code>first</code> 的类型变成 <code>string | undefined</code>，必须先判断才能用。它对 <code>Record&lt;string, T&gt;</code> 的读取也一样生效；<code>for...of</code> 和数组方法回调里的参数不受影响，因为那些值一定存在。</p>
<h2>“没有这个属性”和“属性是 undefined”一样吗</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> P = { <span class="hljs-attr">name</span>?: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">p</span>: P = { <span class="hljs-attr">name</span>: <span class="hljs-literal">undefined</span> }; <span class="hljs-comment">// exactOptionalPropertyTypes 下报错</span>
</code></pre></div>
<p>默认情况下，可选属性既可以不写，也可以显式写成 <code>undefined</code>，两者被当成一回事。开启 <code>exactOptionalPropertyTypes</code> 后，它们被区分开，<code>name?: string</code> 只表示“可以没有”，不允许显式赋 <code>undefined</code>。</p>
<p>这个区别在实际中有影响：<code>&#x27;name&#x27; in p</code>、<code>Object.keys</code> 的结果不一样，PATCH 请求里“不修改”和“清空”的含义也不一样。确实需要显式 <code>undefined</code> 时，写成 <code>name?: string | undefined</code>。</p>
<h2>target 和 lib 管不了运行时</h2>
<p><code>target: es2022</code> 时，可选链、类字段这些语法原样输出；改成 <code>es2015</code>，它们会被转换成旧写法。可 <code>target</code> 只转换语法，不补 API。</p>
<p><code>lib</code> 也一样。<code>lib</code> 里有 <code>es2023</code>，只说明你可以写 <code>findLast</code> 而不报类型错误；目标浏览器没有这个方法，运行时照样出错，这得靠 core-js 等 polyfill 补上。另外，不写 <code>lib</code> 时会根据 <code>target</code> 推出默认值；一旦写了就完全替换默认值，DOM 项目别忘了加 <code>dom</code>。</p>
<h2>TypeScript 6 和 7 改了哪些默认值</h2>
<table><thead><tr><th>选项</th><th>6.0 前默认</th><th>6.0 起默认</th></tr></thead><tbody><tr><td><code>strict</code></td><td><code>false</code></td><td><code>true</code></td></tr><tr><td><code>target</code></td><td><code>es5</code></td><td>最新的稳定 ES 版本（6.0 发布时为 es2025）</td></tr><tr><td><code>module</code></td><td>视 target 而定</td><td><code>esnext</code></td></tr><tr><td><code>types</code></td><td>自动包含所有 <code>@types/*</code></td><td><code>[]</code>（写 <code>[&quot;*&quot;]</code> 恢复旧行为）</td></tr><tr><td><code>rootDir</code></td><td>推断</td><td>tsconfig 所在目录</td></tr><tr><td><code>noUncheckedSideEffectImports</code></td><td><code>false</code></td><td><code>true</code></td></tr></tbody></table>
<p>6.0 弃用了前面提到的那批选项，可以先用 <code>&quot;ignoreDeprecations&quot;: &quot;6.0&quot;</code> 暂时屏蔽弃用错误；到 7.0 这些选项直接报错：整个选项被删的报 <code>TS5102</code>，某个取值被删的（如 <code>target=es5</code>）报 <code>TS5108</code>。迁移 <code>baseUrl</code> 的办法是把 <code>paths</code> 改成相对 tsconfig 的路径，或者改用 <code>package.json</code> 的 <code>imports</code>（<code>#src/*</code>）。</p>
<p>还有一个小变化：在有 tsconfig 的目录里执行 <code>tsc foo.ts</code> 会报 <code>TS5112</code>，需要加 <code>--ignoreConfig</code>。</p>
<h2>检查和构建要分开</h2>
<p>Vite、esbuild、SWC 转换 TS 时只删掉类型，不做类型检查，所以构建成功不代表类型正确。CI 里要单独运行 <code>tsc --noEmit</code>，多项目仓库用 <code>tsc -b</code>。</p>
<h2>常见追问</h2>
<p><strong><code>skipLibCheck</code> 要不要开？</strong></p>
<blockquote>
<p>大多数应用项目会开，它跳过 <code>node_modules</code> 里 <code>.d.ts</code> 的检查，速度更快。库作者最好关掉，这样能发现自己声明里的错误。</p>
</blockquote>
<p><strong>用 Node.js 直接运行 TS，需要哪些选项？</strong></p>
<blockquote>
<p>主要是 <code>erasableSyntaxOnly</code>、<code>verbatimModuleSyntax</code>、<code>module: nodenext</code> 和 <code>rewriteRelativeImportExtensions</code>，详见<a href="/questions/ts-type-imports/">《import type 和 verbatimModuleSyntax 如何影响模块输出？》</a>。</p>
</blockquote>`};export{e as default};