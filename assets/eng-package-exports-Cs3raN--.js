var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>exports</code> 定义包对外公开哪些入口；声明后，使用者只能导入列出的路径，内部文件不再能被深层引用。</li>
<li>条件导出按 <code>import</code>、<code>require</code>、<code>types</code>、<code>browser</code>、<code>default</code> 等条件选择不同文件，同一个入口可以同时提供 ESM 和 CommonJS 版本。</li>
<li><code>imports</code> 定义只在包内部使用的 <code>#</code> 开头别名，替代冗长的相对路径。</li>
<li>存在 <code>exports</code> 时，Node.js 和现代打包工具都优先使用它，<code>main</code> 只作为旧工具的回退。</li>
<li>增加或删除 <code>exports</code> 条目会改变可导入的路径，属于需要谨慎处理的 API 变更。</li>
</ul>
<h2>一个双入口包</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;@acme/utils&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;types&quot;: &quot;./dist/index.d.ts&quot;,
      &quot;import&quot;: &quot;./dist/index.js&quot;,
      &quot;require&quot;: &quot;./dist/index.cjs&quot;
    },
    &quot;./date&quot;: {
      &quot;types&quot;: &quot;./dist/date.d.ts&quot;,
      &quot;import&quot;: &quot;./dist/date.js&quot;,
      &quot;require&quot;: &quot;./dist/date.cjs&quot;
    },
    &quot;./package.json&quot;: &quot;./package.json&quot;
  },
  &quot;imports&quot;: {
    &quot;#internal/*&quot;: &quot;./src/internal/*.js&quot;
  },
  &quot;main&quot;: &quot;./dist/index.cjs&quot;
}
</code></pre></div>
<ul>
<li><code>import { x } from &#x27;@acme/utils&#x27;</code> 得到 <code>dist/index.js</code>；<code>require(&#x27;@acme/utils&#x27;)</code> 得到 <code>dist/index.cjs</code>。</li>
<li><code>import &#x27;@acme/utils/date&#x27;</code> 可用；<code>import &#x27;@acme/utils/dist/internal.js&#x27;</code> 会报 <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>。</li>
<li>包内代码写 <code>import { helper } from &#x27;#internal/helper&#x27;</code>，不需要 <code>../../</code> 相对路径。</li>
</ul>
<h2>条件的顺序</h2>
<p>条件按对象中书写的顺序匹配，第一个满足的生效。因此：</p>
<ul>
<li><code>types</code> 放在第一位，TypeScript 才能找到声明文件。</li>
<li><code>default</code> 放在最后，作为兜底。</li>
<li><code>node</code>、<code>browser</code>、<code>development</code>、<code>production</code> 等条件由运行环境或打包工具决定是否满足，Vite 会根据目标环境设置相应条件。</li>
</ul>
<p>TypeScript 要按 <code>exports</code> 解析，需要 <code>moduleResolution</code> 为 <code>node16</code>、<code>nodenext</code> 或 <code>bundler</code>。</p>
<h2>和 type、main 的关系</h2>
<ul>
<li><code>&quot;type&quot;: &quot;module&quot;</code> 让 <code>.js</code> 文件按 ESM 解析，CommonJS 文件用 <code>.cjs</code> 扩展名；反之 <code>&quot;type&quot;: &quot;commonjs&quot;</code> 时 ESM 文件用 <code>.mjs</code>。</li>
<li><code>main</code> 是旧的单入口字段。有 <code>exports</code> 时它被忽略，保留它只是为了兼容不支持 <code>exports</code> 的旧工具。</li>
</ul>
<h2>双版本的风险</h2>
<p>同一个包的 ESM 和 CommonJS 版本可能在一个应用中被同时加载，各自持有一份模块状态（例如单例、缓存、<code>instanceof</code> 判断的类）。如果包有模块级状态，可以让两个入口共用同一份实现，或者只提供 ESM。Node.js 22.12+ 和 20.19+ 已支持 <code>require()</code> 同步 ESM 模块，新包只发布 ESM 的成本比以前低。</p>
<h2>常见追问</h2>
<ul>
<li>为什么加了 <code>exports</code> 后别人的代码报错？对方深层导入了未公开的文件，需要把这些路径加进 <code>exports</code>，或者作为破坏性变更发布大版本。</li>
<li><code>./package.json</code> 为什么要单独导出？有些工具会读取包的 <code>package.json</code>，不导出时会被拒绝访问。</li>
</ul>`};export{e as default};