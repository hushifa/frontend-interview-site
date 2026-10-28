var e={answerHtml:`<h2>简答</h2>
<ul>
<li>包配置了 <code>exports</code> 后，Node.js 只允许导入其中列出的路径，导入未导出的子路径会抛出 <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>；<code>exports</code> 优先于 <code>main</code>。</li>
<li>条件导出按对象键的书写顺序匹配，第一个满足的条件生效，<code>default</code> 应放在最后。</li>
<li>文件的模块格式由扩展名和最近 package.json 的 <code>type</code> 决定，<code>exports</code> 只负责选路径。</li>
<li>Node.js 20.19+、22.12+ 默认允许 <code>require()</code> 加载 ES 模块；模块图里有顶层 await 时会抛出 <code>ERR_REQUIRE_ASYNC_MODULE</code>。</li>
<li>Node.js 原生 ESM 中的相对导入必须写完整的文件扩展名。</li>
</ul>
<h2>一个双格式包</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;demo-kit&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;types&quot;: &quot;./dist/index.d.ts&quot;,
      &quot;import&quot;: &quot;./dist/index.js&quot;,
      &quot;require&quot;: &quot;./dist/index.cjs&quot;
    },
    &quot;./format&quot;: &quot;./dist/format.js&quot;,
    &quot;./internal/*&quot;: null
  }
}
</code></pre></div>
<p>在 Node.js 22 中实测：</p>
<table><thead><tr><th>导入方式</th><th>结果</th></tr></thead><tbody><tr><td><code>import &#x27;demo-kit&#x27;</code></td><td>加载 <code>dist/index.js</code></td></tr><tr><td><code>require(&#x27;demo-kit&#x27;)</code></td><td>加载 <code>dist/index.cjs</code></td></tr><tr><td><code>import &#x27;demo-kit/format&#x27;</code></td><td>加载 <code>dist/format.js</code></td></tr><tr><td><code>import &#x27;demo-kit/dist/internal.js&#x27;</code></td><td><code>ERR_PACKAGE_PATH_NOT_EXPORTED</code></td></tr></tbody></table>
<p><code>&quot;./internal/*&quot;: null</code> 显式排除一组子路径。<code>types</code> 条件供 TypeScript 使用，按 TypeScript 的要求放在第一个。</p>
<p><code>exports</code> 是模块解析层面的封装：代码仍然可以用绝对路径直接读取包里的文件，它不能用来隐藏秘密。</p>
<h2>条件的匹配规则</h2>
<p>Node.js 内置认识 <code>import</code>、<code>require</code>、<code>module-sync</code>、<code>node</code>、<code>default</code> 等条件。解析时从上到下检查对象键，第一个匹配的条件生效。<code>default</code> 总能匹配，放在前面会让后面的分支永远选不中。</p>
<p>打包工具会额外识别 <code>browser</code>、<code>development</code> 等条件。同一个包在 Vite 里能用，不代表 Node.js 直接运行时会选到同一个文件，发布前要在两种环境里分别测试。</p>
<h2>模块格式与 require(esm)</h2>
<p><code>.mjs</code> 总是 ESM，<code>.cjs</code> 总是 CommonJS，<code>.js</code> 由最近的 package.json 的 <code>type</code> 决定。把 ESM 文件放在 <code>require</code> 条件下面，并不会把它变成 CommonJS。</p>
<p>Node.js 20.19+ 和 22.12+ 默认允许 <code>require()</code> 同步加载 ES 模块，可以用 <code>process.features.require_module</code> 检测：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sync.mjs: export const v = 2;</span>
<span class="hljs-comment">// tla.mjs:  export const v = await Promise.resolve(1);</span>
<span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./sync.mjs&#x27;</span>).<span class="hljs-property">v</span>; <span class="hljs-comment">// 2</span>
<span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./tla.mjs&#x27;</span>);    <span class="hljs-comment">// 抛出 ERR_REQUIRE_ASYNC_MODULE</span>
</code></pre></div>
<p>这让很多库可以只发布 ESM。仍需支持更早版本时，才需要同时提供 CommonJS 产物。同时发布两种格式时，要注意&quot;双包风险&quot;：同一进程里 <code>import</code> 和 <code>require</code> 可能各加载一份实现，模块级状态、单例和 <code>instanceof</code> 判断会出现两套。</p>
<h2>包内部别名</h2>
<p>包内代码之间的别名用 <code>imports</code> 字段定义，键以 <code>#</code> 开头，例如 <code>#logger</code>，Node.js 运行时会读取它。TypeScript 的 <code>paths</code> 只影响类型检查，运行时不起作用。<code>exports</code> 与 <code>imports</code> 的设计细节见《package.json 的 exports 和 imports 分别解决什么问题？》。</p>
<h2>常见追问</h2>
<ul>
<li><strong>为什么 ESM 必须写扩展名？</strong> Node.js 的 ESM 解析按 URL 规则查找文件，不会像 CommonJS 那样依次尝试 <code>.js</code>、<code>.json</code> 和目录下的 <code>index.js</code>。</li>
<li><strong>发布前怎样验证 exports？</strong> 在一个独立的消费项目里分别用 <code>import</code>、<code>require</code> 和 TypeScript 导入每个公开路径，并确认被排除的路径会报错。</li>
</ul>`};export{e as default};