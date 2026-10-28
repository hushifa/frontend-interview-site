var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>exports</code> 中每个条件对象把 <code>types</code> 写在第一位，TypeScript 按顺序匹配条件。</li>
<li>声明格式随 JS 格式：<code>.js</code> 在 <code>&quot;type&quot;: &quot;module&quot;</code> 包中是 ESM，其声明 <code>.d.ts</code> 也按 ESM 解释；CommonJS 入口要配 <code>.d.cts</code>。</li>
<li>设置 <code>exports</code> 后，未列出的子路径不能被消费者导入，公开子路径要逐个声明。</li>
<li><code>.d.ts</code> 不能引用 <code>paths</code> 别名或只在仓库中存在的类型，引用的第三方类型包要放进 <code>dependencies</code> 或 <code>peerDependencies</code>。</li>
<li>用 <code>npm pack</code> 生成的包在独立项目中安装，分别用 <code>moduleResolution: bundler</code> 和 <code>nodenext</code> 检查。</li>
</ul>
<h2>只发 ESM</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;name&quot;: &quot;@example/count-label&quot;,
  &quot;version&quot;: &quot;1.0.0&quot;,
  &quot;type&quot;: &quot;module&quot;,
  &quot;files&quot;: [&quot;dist&quot;],
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;types&quot;: &quot;./dist/index.d.ts&quot;,
      &quot;default&quot;: &quot;./dist/index.js&quot;
    }
  }
}
</code></pre></div>
<p>tsconfig 使用 <code>module: nodenext</code>、<code>declaration: true</code>、<code>outDir: dist</code>。现在的 Node.js 允许 <code>require</code> 加载不含顶层 <code>await</code> 的 ESM，新库只发 ESM 通常就够了。</p>
<h2>双格式</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;exports&quot;: {
    &quot;.&quot;: {
      &quot;import&quot;: {
        &quot;types&quot;: &quot;./dist/esm/index.d.mts&quot;,
        &quot;default&quot;: &quot;./dist/esm/index.mjs&quot;
      },
      &quot;require&quot;: {
        &quot;types&quot;: &quot;./dist/cjs/index.d.cts&quot;,
        &quot;default&quot;: &quot;./dist/cjs/index.cjs&quot;
      }
    }
  }
}
</code></pre></div>
<p>两份 JS 都要配各自的声明。只写一份 <code>.d.ts</code> 同时给两种格式用，CommonJS 消费者会得到错误的默认导出类型（Are the Types Wrong 称为 &quot;Masquerading as ESM&quot;）。同一进程同时加载两份代码时，单例、<code>instanceof</code> 判断会失效，这叫双包风险。</p>
<h2>子路径</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;exports&quot;: {
    &quot;.&quot;: { &quot;types&quot;: &quot;./dist/index.d.ts&quot;, &quot;default&quot;: &quot;./dist/index.js&quot; },
    &quot;./utils&quot;: { &quot;types&quot;: &quot;./dist/utils.d.ts&quot;, &quot;default&quot;: &quot;./dist/utils.js&quot; },
    &quot;./package.json&quot;: &quot;./package.json&quot;
  }
}
</code></pre></div>
<p><code>import &#x27;@example/count-label/dist/internal.js&#x27;</code> 会因不在 <code>exports</code> 中而失败，这让内部文件可以自由重构。</p>
<h2>发布前检查</h2>
<ol>
<li><code>npm pack --dry-run</code> 查看实际打包的文件。</li>
<li><code>npx publint</code> 检查 <code>exports</code> 和文件是否对应。</li>
<li><code>npx @arethetypeswrong/cli --pack</code> 检查各种解析模式下的类型是否正确。</li>
<li>在独立项目中 <code>npm install ../count-label-1.0.0.tgz</code>，用包名导入，运行 <code>tsc --noEmit</code> 和实际代码。</li>
</ol>
<h2>类型也是版本契约</h2>
<p>删除导出类型、收窄参数、改变重载顺序都可能让消费者编译失败，应按语义化版本计入破坏性变更。复杂的公开类型可以写类型测试锁定，见<a href="/questions/ts-type-testing/">《TypeScript 复杂类型应该怎样测试？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>还需要顶层 <code>types</code> 字段吗？只为不支持 <code>exports</code> 的旧解析模式（<code>node10</code>）保留；TypeScript 7 已删除该模式。</li>
<li><code>typesVersions</code> 用来做什么？为不同 TypeScript 版本提供不同声明，现在多用于兼容旧解析模式下的子路径。</li>
</ul>`};export{e as default};