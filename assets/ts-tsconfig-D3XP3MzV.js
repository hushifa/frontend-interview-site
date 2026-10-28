var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>strict</code> 是一组检查（<code>strictNullChecks</code>、<code>noImplicitAny</code>、<code>strictFunctionTypes</code> 等）的总开关，TypeScript 6.0 起默认为 <code>true</code>；但 <code>noUncheckedIndexedAccess</code>、<code>exactOptionalPropertyTypes</code> 不在其中，需要单独开启。</li>
<li><code>target</code> 决定输出的语法版本，<code>lib</code> 决定能使用哪些内置 API 的类型；两者都不会补充运行时缺少的 API。</li>
<li><code>module</code> 和 <code>moduleResolution</code> 要和真实运行环境一致：交给打包工具用 <code>bundler</code>，Node.js 直接运行用 <code>nodenext</code>。</li>
<li>TypeScript 6.0 把 <code>types</code> 默认值改为 <code>[]</code>，Node、测试框架的全局类型需要在 <code>types</code> 中显式列出。</li>
<li>TypeScript 7.0 删除了 <code>target: es5</code>、<code>moduleResolution: node10/classic</code>、<code>baseUrl</code>、<code>outFile</code>、<code>downlevelIteration</code>、<code>module: amd/umd/system</code>，以及把 <code>esModuleInterop</code> 设为 <code>false</code>。</li>
</ul>
<h2>打包工具项目的起点</h2>
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
<p><code>noEmit: true</code> 表示 tsc 只做类型检查，转换交给 Vite 或 esbuild。<code>strict</code> 写出来是为了兼容 6.0 之前的版本。</p>
<h2>索引访问</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> <span class="hljs-attr">list</span>: <span class="hljs-built_in">string</span>[] = [];
<span class="hljs-keyword">const</span> first = list[<span class="hljs-number">0</span>];
first.<span class="hljs-title function_">toUpperCase</span>();
</code></pre></div>
<p>默认配置下 <code>first</code> 的类型是 <code>string</code>，上面的代码能通过检查，运行时却抛错。开启 <code>noUncheckedIndexedAccess</code> 后 <code>first</code> 是 <code>string | undefined</code>，必须先判断。它对 <code>Record&lt;string, T&gt;</code> 的读取同样生效；<code>for...of</code> 和数组方法的回调参数不受影响。</p>
<h2>精确可选属性</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> P = { <span class="hljs-attr">name</span>?: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">p</span>: P = { <span class="hljs-attr">name</span>: <span class="hljs-literal">undefined</span> }; <span class="hljs-comment">// exactOptionalPropertyTypes 下报错</span>
</code></pre></div>
<p>开启后，&quot;属性缺失&quot;和&quot;属性值为 <code>undefined</code>&quot;被区分开。这影响 <code>&#x27;name&#x27; in p</code>、<code>Object.keys</code> 和 PATCH 请求中&quot;不修改&quot;与&quot;清空&quot;的语义。确实需要显式 <code>undefined</code> 时写 <code>name?: string | undefined</code>。</p>
<h2>target 与 lib</h2>
<ul>
<li><code>target: es2022</code> 时，可选链、类字段等原样输出；改成 <code>es2015</code> 会被降级。</li>
<li><code>lib</code> 中包含 <code>es2023</code> 只说明可以调用 <code>findLast</code>，目标浏览器没有该方法时仍会运行时出错，需要 core-js 等 polyfill。</li>
<li>不写 <code>lib</code> 时根据 <code>target</code> 推导默认值；写了就完全替换，DOM 项目要记得加 <code>dom</code>。</li>
</ul>
<h2>TypeScript 6/7 的默认值变化</h2>
<table><thead><tr><th>选项</th><th>6.0 前默认</th><th>6.0 起默认</th></tr></thead><tbody><tr><td><code>strict</code></td><td><code>false</code></td><td><code>true</code></td></tr><tr><td><code>target</code></td><td><code>es5</code></td><td>最新 ES 版本（当前为 es2025）</td></tr><tr><td><code>module</code></td><td>视 target 而定</td><td><code>esnext</code></td></tr><tr><td><code>types</code></td><td>自动包含所有 <code>@types/*</code></td><td><code>[]</code></td></tr><tr><td><code>rootDir</code></td><td>推断</td><td>tsconfig 所在目录</td></tr><tr><td><code>noUncheckedSideEffectImports</code></td><td><code>false</code></td><td><code>true</code></td></tr></tbody></table>
<p>6.0 中可以用 <code>&quot;ignoreDeprecations&quot;: &quot;6.0&quot;</code> 暂时屏蔽弃用错误，7.0 中这些选项直接报 <code>TS5108</code> / <code>TS5102</code>。迁移 <code>baseUrl</code> 的方式是改写 <code>paths</code> 为相对 tsconfig 的路径，或改用 <code>package.json</code> 的 <code>imports</code>（<code>#src/*</code>）。</p>
<p>在存在 tsconfig 的目录执行 <code>tsc foo.ts</code> 会报 <code>TS5112</code>，需要加 <code>--ignoreConfig</code>。</p>
<h2>检查与构建分开</h2>
<p>Vite、esbuild、SWC 只删除类型，不做类型检查，所以构建成功不代表类型正确。CI 中要单独运行 <code>tsc --noEmit</code>（多项目用 <code>tsc -b</code>）。</p>
<h2>常见追问</h2>
<ul>
<li><code>skipLibCheck</code> 要不要开？大多数应用项目开启，可以跳过 <code>node_modules</code> 中 <code>.d.ts</code> 的检查以加快速度；库作者应关闭以发现自己声明中的错误。</li>
<li>Node.js 原生运行 TS 要哪些选项？<code>erasableSyntaxOnly</code>、<code>verbatimModuleSyntax</code>、<code>module: nodenext</code>、<code>rewriteRelativeImportExtensions</code>，见《import type 和 verbatimModuleSyntax 如何影响模块输出？》。</li>
</ul>`};export{e as default};