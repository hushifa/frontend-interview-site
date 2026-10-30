var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>exports</code> 写在 <code>package.json</code> 里，规定别人能从这个包导入哪些路径。写了它以后，没列出来的内部文件就导入不了，包的公开接口就清楚了。</p>
<p>它还能按条件选文件，比如 <code>import</code> 时给 ESM 版本，<code>require</code> 时给 CommonJS 版本，这叫条件导出。<code>imports</code> 则是给包自己内部用的别名，以 <code>#</code> 开头，用来代替很长的相对路径。</p>
<p>有了 <code>exports</code>，Node.js 和现代打包工具都会优先用它，<code>main</code> 只留给不认识 <code>exports</code> 的旧工具。</p>
<p>要注意，增加或删除 <code>exports</code> 的条目，会改变别人能导入的路径，属于要谨慎处理的 API 变更。</p>
</blockquote>
<h2>一个双入口包长什么样</h2>
<p>下面这个工具包同时提供 ESM 和 CommonJS 两个版本，还公开了一个 <code>date</code> 子路径。</p>
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
<p>使用者写 <code>import { x } from &#x27;@acme/utils&#x27;</code>，拿到的是 <code>dist/index.js</code>；写 <code>require(&#x27;@acme/utils&#x27;)</code>，拿到的是 <code>dist/index.cjs</code>。同一个入口，按导入方式给了不同的文件。</p>
<p><code>import &#x27;@acme/utils/date&#x27;</code> 可以用，因为它列在 <code>exports</code> 里。可是 <code>import &#x27;@acme/utils/dist/internal.js&#x27;</code> 会报 <code>ERR_PACKAGE_PATH_NOT_EXPORTED</code>，因为这个路径没有公开。</p>
<p>包自己的代码里可以写 <code>import { helper } from &#x27;#internal/helper&#x27;</code>，<code>imports</code> 会把它映射到 <code>./src/internal/helper.js</code>，不用再写 <code>../../</code>。</p>
<h2>条件为什么要注意顺序</h2>
<p>条件是按对象里书写的顺序匹配的，第一个满足的就生效，后面的不再看。</p>
<p>所以 <code>types</code> 要放在第一位，TypeScript 才能找到声明文件。<code>default</code> 要放在最后当兜底，放前面的话它总会先匹配上。<code>node</code>、<code>browser</code>、<code>development</code>、<code>production</code> 这些条件满不满足，由运行环境或打包工具决定，比如 Vite 会根据目标环境设置相应的条件。</p>
<p>另外，TypeScript 要按 <code>exports</code> 来解析，<code>moduleResolution</code> 需要设成 <code>node16</code>、<code>nodenext</code> 或 <code>bundler</code>。</p>
<h2>和 type、main 是什么关系</h2>
<p><code>&quot;type&quot;: &quot;module&quot;</code> 让包里的 <code>.js</code> 文件按 ESM 解析，这时 CommonJS 文件要用 <code>.cjs</code> 扩展名。反过来，<code>&quot;type&quot;: &quot;commonjs&quot;</code> 时，ESM 文件要用 <code>.mjs</code>。</p>
<p><code>main</code> 是旧的单入口字段。有 <code>exports</code> 时它会被忽略，保留它只是为了兼容不支持 <code>exports</code> 的旧工具。</p>
<h2>同时发布两个版本有什么风险</h2>
<p>同一个包的 ESM 版本和 CommonJS 版本，可能在一个应用里同时被加载。这时它们各自有一份模块状态，比如单例、缓存、<code>instanceof</code> 用到的类，就会出现两份，互相不认识。</p>
<p>如果包有模块级的状态，可以让两个入口共用同一份实现，或者干脆只提供 ESM。新版 Node.js 已经能用 <code>require()</code> 加载同步的 ESM，Node.js 拿到导入路径后怎样一步步选中文件、<code>require(esm)</code> 有什么限制，见<a href="/questions/node-module-resolution/">《Node.js 怎样解析一个包的导入路径？require(esm) 有什么限制？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么加了 <code>exports</code> 以后，别人的代码报错了？</strong></p>
<blockquote>
<p>因为对方深层导入了一个没有公开的文件。要么把这些路径加进 <code>exports</code>，要么把这次改动当成破坏性变更，发布大版本。</p>
</blockquote>
<p><strong><code>./package.json</code> 为什么要单独导出？</strong></p>
<blockquote>
<p>有些工具会读取包的 <code>package.json</code>。有了 <code>exports</code> 以后，没导出的路径都会被拒绝，包括 <code>package.json</code> 本身，所以要单独列出来。</p>
</blockquote>`};export{e as default};