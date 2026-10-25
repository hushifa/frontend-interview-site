var e={answerHtml:`<p>Flat Config 主要用一个配置数组组织哪些文件采用哪些规则。对某个文件，ESLint 找出适用的配置对象并按相应顺序合并，而不是把每个对象都当成一个互相独立、最后只剩一项的配置。</p>
<p>迁移不只是把 .eslintrc 改名为 eslint.config.js。插件与解析器如何提供、环境变量、文件匹配、忽略和配置查找，都需要按当前版本的规则调整。</p>
<h2>一个现代配置例子</h2>
<p>下面使用当前支持 defineConfig、globalIgnores 和相应 extends 形式的 ESLint，文件名为 eslint.config.mjs，并安装匹配版本的 @eslint/js：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> js <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@eslint/js&#x27;</span>;
<span class="hljs-keyword">import</span> { defineConfig, globalIgnores } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;eslint/config&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>([
  <span class="hljs-title function_">globalIgnores</span>([<span class="hljs-string">&#x27;dist/**&#x27;</span>]),
  {
    <span class="hljs-attr">files</span>: [<span class="hljs-string">&#x27;src/**/*.js&#x27;</span>],
    <span class="hljs-attr">plugins</span>: { js },
    <span class="hljs-attr">extends</span>: [<span class="hljs-string">&#x27;js/recommended&#x27;</span>],
    <span class="hljs-attr">languageOptions</span>: {
      <span class="hljs-attr">ecmaVersion</span>: <span class="hljs-string">&#x27;latest&#x27;</span>,
      <span class="hljs-attr">sourceType</span>: <span class="hljs-string">&#x27;module&#x27;</span>,
      <span class="hljs-attr">globals</span>: {
        <span class="hljs-attr">console</span>: <span class="hljs-string">&#x27;readonly&#x27;</span>,
      },
    },
    <span class="hljs-attr">rules</span>: {
      <span class="hljs-string">&#x27;no-console&#x27;</span>: <span class="hljs-string">&#x27;warn&#x27;</span>,
    },
  },
  {
    <span class="hljs-attr">files</span>: [<span class="hljs-string">&#x27;src/**/*.test.js&#x27;</span>],
    <span class="hljs-attr">rules</span>: {
      <span class="hljs-string">&#x27;no-console&#x27;</span>: <span class="hljs-string">&#x27;off&#x27;</span>,
    },
  },
]);
</code></pre></div>
<p>普通 src 下的 JavaScript 使用推荐规则，并对 console 提示警告。测试文件同时匹配后一个对象，因此只把相应 no-console 设置覆盖为 off，其余适用规则仍然保留。</p>
<p>示例只声明了 console 这个全局，不代表已经配置所有浏览器或 Node 全局。实际项目应按运行环境补充，避免靠关闭 no-undef 掩盖环境配置错误。</p>
<h2>插件对象与规则命名是怎样关联的</h2>
<p>Flat Config 通常直接导入插件对象，再通过 plugins 建立命名空间，规则或预设按对应名称引用。解析器也通常作为对象放在 languageOptions.parser 等适当位置。</p>
<p>这与旧配置里大量按包名字符串解析的习惯不同，但也不能说“Flat Config 永远没有 extends”。现代 ESLint 的 defineConfig 支持相应预设扩展形式，上例就使用了注册后的 js/recommended。</p>
<p>迁移时要核对所用 ESLint 与插件版本提供的配置格式。旧的 plugin:xxx/recommended 字符串、旧预设对象和新的 flat 预设不应无条件互换；必要时使用适当兼容工具或按文档转换。</p>
<h2>files 和顺序共同决定某条规则是否生效</h2>
<p>后面的对象只有在它适用于当前文件时，才会参与覆盖。把一个测试专用对象放在最后，不意味着它会成为所有文件的最后默认值。</p>
<p>文件模式的相对基准也要按配置来源与工具规则理解。Monorepo 中从不同目录执行或对不同包执行检查时，应查看最终解析到的配置，而不是只看仓库根目录有一个文件就认为所有包相同。</p>
<p>配置查找行为也可能随主要版本调整，尤其不能把旧 .eslintrc 的目录层叠经验直接套到所有 Flat Config 版本。</p>
<h2>全局忽略与局部排除不是一回事</h2>
<p>globalIgnores 清楚地表达哪些文件整体不应进入检查。放在某个同时含有 rules 等字段的配置对象里的 ignores，通常只是影响这个对象是否适用于文件，并不等于其他配置也都忽略它。</p>
<p>旧的 .eslintignore 不会在 Flat Config 中按原方式自动生效，原有模式需要迁移。像 temp.js 与 **/temp.js 的匹配范围也不同，不能只复制文本就认定行为一样。</p>
<p>点文件的默认处理与旧系统也有差异，若确实需要忽略，应显式说明。生成目录、测试文件和配置文件都应根据用途决定，而不是发现报错就把整个 src 排除。</p>
<h2>TypeScript 需要的不只是增加后缀</h2>
<p>把 files 写成包含 .ts，并不会让默认 JavaScript 解析器自动理解所有 TypeScript 语法。需要对应解析器、规则与配置；使用依赖类型信息的规则时，还要考虑项目范围和性能。</p>
<p>同样，ESLint 规则不等于 TypeScript 完整类型检查，也不等于测试。它们可以互补，但检查通过分别证明的事情不同。</p>
<p>格式化需求可以与 Prettier 等工具分工，避免多个工具对同一格式反复改写。规则报错时先判断是代码问题、环境缺失、插件格式不匹配还是忽略范围错误，再决定修复位置。</p>
<h2>怎样确认迁移结果没有悄悄变弱</h2>
<p>可以对代表性文件查看 --print-config 的结果，再运行具体规则检查：普通源码、测试、脚本和生成文件都应有预期行为。</p>
<p>尤其要确认实际检查到了文件、没有因模式错误全部跳过，且重要规则仍启用。只看到进程退出成功，不代表它检查了你以为的范围。</p>
<p>配置与依赖版本应跟随项目维护，让本地编辑器和 CI 使用一致入口。一个可解释的配置，比把大量规则关闭后得到一片绿色更有价值。</p>`};export{e as default};