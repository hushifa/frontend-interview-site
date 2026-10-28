var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Flat Config 用一个 <code>eslint.config.js</code> 导出配置对象数组，按 <code>files</code> 匹配文件，后面的对象覆盖前面的。</li>
<li>插件和共享配置通过 <code>import</code> 引入真实的 JS 对象，不再按字符串名称查找，依赖关系一目了然。</li>
<li>ESLint 10 已删除旧的 <code>.eslintrc</code> 格式；配置文件改为从每个被检查文件所在目录向上查找。</li>
<li><code>globalIgnores()</code> 声明全局忽略，<code>extends</code> 可以在单个配置对象里复用预设（ESLint 9.22+）。</li>
<li>迁移后用 <code>--print-config</code> 查看某个文件的最终配置，确认规则真正生效。</li>
</ul>
<h2>一个完整配置</h2>
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
<ul>
<li><code>files</code> 决定对象作用于哪些文件；没写 <code>files</code> 的对象作用于所有被检查的文件。</li>
<li>两个对象都匹配 <code>scripts/build.js</code> 时，后一个的 <code>no-console: &#x27;off&#x27;</code> 覆盖前一个。</li>
<li>只含 <code>ignores</code> 的对象（或 <code>globalIgnores()</code>）是全局忽略；和其他键写在一起的 <code>ignores</code> 只是把文件排除出这个对象。</li>
</ul>
<h2>和 eslintrc 的主要区别</h2>
<table><thead><tr><th>eslintrc</th><th>Flat Config</th></tr></thead><tbody><tr><td>多个 <code>.eslintrc</code> 沿目录层层合并</td><td>一份配置文件，数组顺序决定优先级</td></tr><tr><td><code>extends: &#x27;plugin:react/recommended&#x27;</code> 按名称解析</td><td><code>import</code> 进来直接放进数组或 <code>extends</code></td></tr><tr><td><code>env: { browser: true }</code></td><td><code>languageOptions.globals</code></td></tr><tr><td><code>parser</code>、<code>parserOptions</code> 在顶层</td><td>放在 <code>languageOptions</code> 下</td></tr><tr><td><code>.eslintignore</code> 文件</td><td>配置中的 <code>ignores</code> / <code>globalIgnores()</code></td></tr></tbody></table>
<h2>ESLint 10 的变化</h2>
<ul>
<li>不再支持 <code>.eslintrc*</code>，设置 <code>ESLINT_USE_FLAT_CONFIG=false</code> 也无法恢复。</li>
<li>查找 <code>eslint.config.*</code> 时，从每个被检查文件的目录开始向上查找，而不是只看当前工作目录。依赖旧行为的仓库可以用 <code>--config</code> 显式指定。</li>
<li><code>/* eslint-env */</code> 注释会被报告为错误，应删除并改用 <code>languageOptions.globals</code>。</li>
<li>需要 Node.js 20.19.0+、22.13.0+ 或 24+。</li>
</ul>
<p>官方提供 <code>npx @eslint/migrate-config .eslintrc.json</code> 把旧配置转换成 Flat Config，转换结果仍需人工检查。</p>
<h2>迁移时怎样验证</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npx eslint --print-config src/main.ts
npx eslint --inspect-config
</code></pre></div>
<p>第一条输出某个文件最终生效的完整配置，第二条打开可视化的配置查看器。迁移前后各跑一次全量检查，对比报告数量的变化，避免某条规则因为 <code>files</code> 没匹配上而悄悄失效。</p>
<h2>常见追问</h2>
<ul>
<li>monorepo 里每个包要不要单独配置？ESLint 10 会为每个文件找最近的 <code>eslint.config.*</code>，可以在包内放配置；也可以在根配置里用 <code>files</code> 区分。</li>
<li>为什么 TypeScript 文件没被检查？Flat Config 默认只匹配 <code>.js</code>、<code>.mjs</code>、<code>.cjs</code>，其他扩展名要在 <code>files</code> 中声明。</li>
</ul>`};export{e as default};