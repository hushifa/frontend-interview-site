var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>exports</code> 是 package.json 里的一个字段，用来声明“这个包对外开放哪些入口”。配置了它以后，Node.js 只允许导入其中列出的路径，导入没列出的子路径会抛出 <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>。它的优先级比 <code>main</code> 高。</p>
<p>同一个入口还可以按条件指向不同文件，比如 <code>import</code> 时给 ESM 版本，<code>require</code> 时给 CommonJS 版本，这叫条件导出。条件按对象键的书写顺序匹配，第一个满足的生效，所以 <code>default</code> 要放在最后。</p>
<p>要分清的是，<code>exports</code> 只负责选哪个文件，不决定文件是什么格式。格式由扩展名和最近的 package.json 里的 <code>type</code> 决定。</p>
<p>另外两点：Node.js 20.19+、22.12+ 默认允许 <code>require()</code> 加载 ES 模块，但模块图里有顶层 await 时会抛出 <code>ERR_REQUIRE_ASYNC_MODULE</code>；Node.js 原生 ESM 里的相对导入必须写完整的扩展名。</p>
</blockquote>
<h2>先看一个双格式包</h2>
<p>下面这个包同时给 ESM 和 CommonJS 用户提供入口：</p>
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
<p>最后一行，文件明明就在包里，为什么导入不了？因为 <code>exports</code> 没有列出这个路径。一旦写了 <code>exports</code>，没列出来的就一律不对外。<code>&quot;./internal/*&quot;: null</code> 则是显式排除一组子路径。</p>
<p><code>types</code> 条件是给 TypeScript 用的，按 TypeScript 的要求放在第一个。</p>
<p>不过 <code>exports</code> 只是模块解析层面的封装。代码仍然可以用绝对路径直接读取包里的文件，所以它不能用来藏秘密。</p>
<h2>条件是按什么规则匹配的</h2>
<p>Node.js 内置认识 <code>import</code>、<code>require</code>、<code>module-sync</code>、<code>node</code>、<code>default</code> 等条件。解析时从上往下检查对象键，第一个匹配的条件生效，后面的就不看了。<code>default</code> 总能匹配，如果放在前面，后面的分支就永远选不中。</p>
<p>打包工具还会额外识别 <code>browser</code>、<code>development</code> 等条件。所以同一个包在 Vite 里能用，不代表 Node.js 直接运行时会选到同一个文件，发布前要在两种环境里分别测试。</p>
<h2>文件格式由谁决定</h2>
<p><code>.mjs</code> 总是 ESM，<code>.cjs</code> 总是 CommonJS，<code>.js</code> 看最近的 package.json 里的 <code>type</code>。把一个 ESM 文件放在 <code>require</code> 条件下面，它并不会因此变成 CommonJS。</p>
<p>那 CommonJS 代码能不能直接 <code>require</code> 一个 ES 模块？Node.js 20.19+ 和 22.12+ 默认允许同步加载，可以用 <code>process.features.require_module</code> 检测：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sync.mjs: export const v = 2;</span>
<span class="hljs-comment">// tla.mjs:  export const v = await Promise.resolve(1);</span>
<span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./sync.mjs&#x27;</span>).<span class="hljs-property">v</span>; <span class="hljs-comment">// 2</span>
<span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./tla.mjs&#x27;</span>);    <span class="hljs-comment">// 抛出 ERR_REQUIRE_ASYNC_MODULE</span>
</code></pre></div>
<p><code>require</code> 是同步的，可顶层 await 要异步等待，两者没法兼容，所以带顶层 await 的模块会报错。</p>
<p>有了这个能力，很多库可以只发布 ESM，只有还要支持更早版本时，才需要同时提供 CommonJS 产物。同时发布两种格式要注意“双包风险”：同一个进程里 <code>import</code> 和 <code>require</code> 可能各加载一份实现，模块级状态、单例和 <code>instanceof</code> 判断都会出现两套。</p>
<h2>包内部的别名怎么写</h2>
<p>包内代码之间的别名用 <code>imports</code> 字段定义，键以 <code>#</code> 开头，例如 <code>#logger</code>，Node.js 运行时会读取它。TypeScript 的 <code>paths</code> 只影响类型检查，运行时不起作用。<code>exports</code> 与 <code>imports</code> 的设计细节见<a href="/questions/eng-package-exports/">《package.json 的 exports 和 imports 分别解决什么问题？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 ESM 必须写扩展名？</strong></p>
<blockquote>
<p>Node.js 的 ESM 按 URL 规则查找文件，写什么就找什么，不会像 CommonJS 那样依次尝试 <code>.js</code>、<code>.json</code> 和目录下的 <code>index.js</code>。</p>
</blockquote>
<p><strong>发布前怎样验证 exports？</strong></p>
<blockquote>
<p>建一个独立的消费项目，分别用 <code>import</code>、<code>require</code> 和 TypeScript 导入每个公开路径，再确认被排除的路径确实会报错。</p>
</blockquote>`};export{e as default};