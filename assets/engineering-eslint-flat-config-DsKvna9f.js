var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>旧的 <code>.eslintrc</code> 可以在每个目录放一份，沿着目录层层合并，很难看清最终用了什么。Flat Config 只有一个 <code>eslint.config.js</code>，导出一个配置对象的数组，每个对象用 <code>files</code> 说明自己管哪些文件，后面的对象覆盖前面的。</p>
<p>插件和共享配置也改成用 <code>import</code> 引进来的真实 JS 对象，不再按字符串名字去查找，所以依赖关系一眼就能看清。</p>
<p>版本上，ESLint 10 已经删除了旧的 <code>.eslintrc</code> 格式，查找配置文件也改成从每个被检查文件的目录往上找。<code>globalIgnores()</code> 用来声明全局忽略，<code>extends</code> 从 ESLint 9.22 起可以在单个配置对象里复用预设。</p>
<p>迁移以后要用 <code>--print-config</code> 看某个文件最终生效的配置，确认规则真的生效了。</p>
</blockquote>
<h2>先看一个完整配置</h2>
<p>下面这份配置对所有 JS 和 TS 文件用推荐规则，再给 <code>scripts</code> 目录单独放宽。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// eslint.config.js</span>
<span class="hljs-keyword">import</span> { defineConfig, globalIgnores } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;eslint/config&#x27;</span>;
<span class="hljs-keyword">import</span> js <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@eslint/js&#x27;</span>;
<span class="hljs-keyword">import</span> globals <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;globals&#x27;</span>;
<span class="hljs-keyword">import</span> tseslint <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;typescript-eslint&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>([
  <span class="hljs-title function_">globalIgnores</span>([<span class="hljs-string">&#x27;dist/&#x27;</span>, <span class="hljs-string">&#x27;coverage/&#x27;</span>]),
  {
    <span class="hljs-attr">files</span>: [<span class="hljs-string">&#x27;**/*.{js,ts}&#x27;</span>],
    <span class="hljs-attr">extends</span>: [js.<span class="hljs-property">configs</span>.<span class="hljs-property">recommended</span>, tseslint.<span class="hljs-property">configs</span>.<span class="hljs-property">recommended</span>],
    <span class="hljs-attr">languageOptions</span>: { <span class="hljs-attr">globals</span>: globals.<span class="hljs-property">browser</span> },
    <span class="hljs-attr">rules</span>: { <span class="hljs-string">&#x27;no-console&#x27;</span>: <span class="hljs-string">&#x27;warn&#x27;</span> },
  },
  {
    <span class="hljs-attr">files</span>: [<span class="hljs-string">&#x27;scripts/**/*.js&#x27;</span>],
    <span class="hljs-attr">languageOptions</span>: { <span class="hljs-attr">globals</span>: globals.<span class="hljs-property">node</span> },
    <span class="hljs-attr">rules</span>: { <span class="hljs-string">&#x27;no-console&#x27;</span>: <span class="hljs-string">&#x27;off&#x27;</span> },
  },
]);
</code></pre></div>
<p><code>files</code> 决定这个对象作用于哪些文件。没写 <code>files</code> 的对象，作用于所有被检查的文件。</p>
<p><code>scripts/build.js</code> 同时被第二个和第三个对象匹配到。数组里后面的优先，所以第三个对象的 <code>no-console: &#x27;off&#x27;</code> 覆盖了前面的 <code>&#x27;warn&#x27;</code>。</p>
<h2>ignores 写在哪里，效果不一样</h2>
<p>这里有个容易混的地方。一个对象如果只有 <code>ignores</code> 这一个键，或者用 <code>globalIgnores()</code>，它就是全局忽略，这些文件完全不检查。</p>
<p>可是 <code>ignores</code> 和 <code>files</code>、<code>rules</code> 等其他键写在一起时，它只是把某些文件排除出这个对象，别的对象照样会检查它们。</p>
<h2>和 eslintrc 有哪些区别</h2>
<p>最根本的区别是合并方式。eslintrc 由多个 <code>.eslintrc</code> 沿目录层层合并；Flat Config 只有一份配置文件，数组顺序决定优先级。</p>
<p>引用预设的方式也变了。以前写 <code>extends: &#x27;plugin:react/recommended&#x27;</code>，ESLint 按名字去解析；现在用 <code>import</code> 引进来，直接放进数组或 <code>extends</code>。</p>
<p>几个常用配置项挪了位置。以前的 <code>env: { browser: true }</code> 改成 <code>languageOptions.globals</code>；顶层的 <code>parser</code>、<code>parserOptions</code> 放到了 <code>languageOptions</code> 下面；<code>.eslintignore</code> 文件改成配置里的 <code>ignores</code> 或 <code>globalIgnores()</code>。</p>
<h2>ESLint 10 带来了什么变化</h2>
<p>ESLint 10 不再支持 <code>.eslintrc*</code>，设置 <code>ESLINT_USE_FLAT_CONFIG=false</code> 也恢复不了。</p>
<p>查找 <code>eslint.config.*</code> 时，它从每个被检查文件所在的目录开始往上找，而不是只看当前工作目录。依赖旧行为的仓库，可以用 <code>--config</code> 显式指定配置文件。</p>
<p><code>/* eslint-env */</code> 注释会被报告为错误，要删掉，改用 <code>languageOptions.globals</code>。运行环境需要 Node.js 20.19.0+、22.13.0+ 或 24+。</p>
<p>官方提供 <code>npx @eslint/migrate-config .eslintrc.json</code>，可以把旧配置转换成 Flat Config，但转换结果仍然要人工检查。</p>
<h2>迁移时怎样验证</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npx eslint --print-config src/main.ts
npx eslint --inspect-config
</code></pre></div>
<p>第一条命令输出某个文件最终生效的完整配置，第二条打开一个可视化的配置查看器。</p>
<p>为什么要专门验证？因为 <code>files</code> 没匹配上时 ESLint 不会报错，某条规则可能就悄悄失效了。所以迁移前后各跑一次全量检查，对比报告数量的变化。</p>
<h2>常见追问</h2>
<p><strong>monorepo 里每个包要不要单独配置？</strong></p>
<blockquote>
<p>ESLint 10 会为每个文件找离它最近的 <code>eslint.config.*</code>，所以可以在包里放自己的配置。也可以只用根配置，靠 <code>files</code> 区分不同的包。</p>
</blockquote>
<p><strong>为什么 TypeScript 文件没被检查？</strong></p>
<blockquote>
<p>Flat Config 默认只匹配 <code>.js</code>、<code>.mjs</code>、<code>.cjs</code>。其他扩展名要在 <code>files</code> 里声明，比如 <code>**/*.ts</code>。</p>
</blockquote>`};export{e as default};