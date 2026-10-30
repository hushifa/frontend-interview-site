var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 <code>import &#x27;demo-kit/format&#x27;</code> 时，Node.js 要回答三个问题：包在哪、选哪个文件、按什么格式执行。先从当前目录往上逐级找 <code>node_modules/demo-kit</code>；找到后读它的 package.json，有 <code>exports</code> 就只按 <code>exports</code> 匹配，没列出的子路径抛出 <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>，<code>main</code> 不再起作用。<code>exports</code> 和 <code>imports</code> 字段具体怎样写，见<a href="/questions/eng-package-exports/">《package.json 的 exports 和 imports 分别解决什么问题？》</a>。</p>
<p>匹配时，条件按对象键的书写顺序检查，第一个满足的生效。<code>import</code> 语句满足 <code>import</code> 条件，<code>require()</code> 满足 <code>require</code> 条件，所以同一个入口可以给出不同文件。</p>
<p>选中文件以后，格式由扩展名和最近的 package.json 里的 <code>type</code> 决定，<code>exports</code> 不改变文件格式。Node.js 原生 ESM 里的相对导入还必须写完整的扩展名。</p>
<p>Node.js 20.19+、22.12+ 默认允许 <code>require()</code> 加载 ES 模块，但模块图里有顶层 await 时会抛出 <code>ERR_REQUIRE_ASYNC_MODULE</code>。</p>
</blockquote>
<h2>用一个包走一遍解析</h2>
<p>下面这个包同时给 ESM 和 CommonJS 用户提供入口：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;demo-kit&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;import&quot;: &quot;./dist/index.js&quot;,
      &quot;require&quot;: &quot;./dist/index.cjs&quot;
    },
    &quot;./format&quot;: &quot;./dist/format.js&quot;
  }
}
</code></pre></div>
<p>在 Node.js 22 中实测：</p>
<table><thead><tr><th>导入方式</th><th>结果</th></tr></thead><tbody><tr><td><code>import &#x27;demo-kit&#x27;</code></td><td>加载 <code>dist/index.js</code></td></tr><tr><td><code>require(&#x27;demo-kit&#x27;)</code></td><td>加载 <code>dist/index.cjs</code></td></tr><tr><td><code>import &#x27;demo-kit/format&#x27;</code></td><td>加载 <code>dist/format.js</code></td></tr><tr><td><code>import &#x27;demo-kit/dist/internal.js&#x27;</code></td><td><code>ERR_PACKAGE_PATH_NOT_EXPORTED</code></td></tr></tbody></table>
<p>以 <code>require(&#x27;demo-kit&#x27;)</code> 为例：Node.js 找到 <code>node_modules/demo-kit</code>，读到 <code>exports</code>，子路径是 <code>.</code>，进入它的条件对象，<code>import</code> 不满足，<code>require</code> 满足，选中 <code>dist/index.cjs</code>；扩展名是 <code>.cjs</code>，按 CommonJS 执行。最后一行文件明明在包里，却因为 <code>exports</code> 没列出而导入不了。</p>
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
<h2>常见追问</h2>
<p><strong>为什么 ESM 必须写扩展名？</strong></p>
<blockquote>
<p>Node.js 的 ESM 按 URL 规则查找文件，写什么就找什么，不会像 CommonJS 那样依次尝试 <code>.js</code>、<code>.json</code> 和目录下的 <code>index.js</code>。</p>
</blockquote>
<p><strong>发布前怎样验证 exports？</strong></p>
<blockquote>
<p>建一个独立的消费项目，分别用 <code>import</code>、<code>require</code> 和 TypeScript 导入每个公开路径，再确认被排除的路径确实会报错。</p>
</blockquote>`};export{e as default};