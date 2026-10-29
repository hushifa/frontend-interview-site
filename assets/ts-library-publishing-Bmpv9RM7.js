var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>发布一个 TS 写的库，使用者既要拿到能运行的 JS，也要拿到 <code>.d.ts</code> 类型声明。现在的做法是在 <code>package.json</code> 的 <code>exports</code> 里，给每个入口写一个条件对象，<code>types</code> 指向声明，<code>default</code> 指向 JS，并且 <code>types</code> 要写在第一位，因为 TypeScript 是按顺序匹配条件的。</p>
<p>声明的模块格式必须跟 JS 一致。在 <code>&quot;type&quot;: &quot;module&quot;</code> 的包里，<code>.js</code> 是 ESM，对应的 <code>.d.ts</code> 也按 ESM 解释；CommonJS 入口要配 <code>.d.cts</code>。只写一份声明给两种格式共用，CommonJS 使用者拿到的默认导出类型就是错的。</p>
<p>写了 <code>exports</code> 以后，没列出来的子路径使用者导入不了，所以公开的子路径要一个个声明。<code>.d.ts</code> 里也不能引用 <code>paths</code> 别名或只在仓库里才有的类型，用到的第三方类型包要放进 <code>dependencies</code> 或 <code>peerDependencies</code>。</p>
<p>发布前最可靠的检查，是用 <code>npm pack</code> 打出包，在一个独立项目里安装，分别用 <code>moduleResolution: bundler</code> 和 <code>nodenext</code> 跑一遍类型检查。</p>
</blockquote>
<h2>只发 ESM 时怎么写</h2>
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
<p><code>&quot;.&quot;</code> 代表包的主入口，使用者写 <code>import ... from &#x27;@example/count-label&#x27;</code> 时就走这里。TypeScript 先匹配到 <code>types</code>，拿 <code>index.d.ts</code> 当类型；运行时 Node 或打包工具匹配到 <code>default</code>，加载 <code>index.js</code>。<code>files</code> 限定只发布 <code>dist</code> 目录。</p>
<p>配套的 tsconfig 用 <code>module: nodenext</code>、<code>declaration: true</code>、<code>outDir: dist</code>。现在的 Node.js 已经允许 <code>require</code> 加载不含顶层 <code>await</code> 的 ESM，所以新库只发 ESM 通常就够了。</p>
<h2>同时发 ESM 和 CommonJS</h2>
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
<p><code>import</code> 和 <code>require</code> 两个条件各自配一套 JS 和声明。为什么不能共用一份 <code>.d.ts</code>？因为 TypeScript 会按 ESM 去理解它，可 CommonJS 消费者实际拿到的是另一种格式的模块，默认导出的形状对不上。Are the Types Wrong 这个工具把这种情况叫 “Masquerading as ESM”。</p>
<p>双格式还有一个风险：同一个进程里两份代码都被加载了，各自有一份模块状态，单例会变成两个，<code>instanceof</code> 判断也会失效。这叫双包风险，也是推荐新库只发 ESM 的原因之一。</p>
<h2>子路径要一个个声明</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;exports&quot;: {
    &quot;.&quot;: { &quot;types&quot;: &quot;./dist/index.d.ts&quot;, &quot;default&quot;: &quot;./dist/index.js&quot; },
    &quot;./utils&quot;: { &quot;types&quot;: &quot;./dist/utils.d.ts&quot;, &quot;default&quot;: &quot;./dist/utils.js&quot; },
    &quot;./package.json&quot;: &quot;./package.json&quot;
  }
}
</code></pre></div>
<p>这样使用者可以导入 <code>@example/count-label/utils</code>。要是有人写 <code>import &#x27;@example/count-label/dist/internal.js&#x27;</code>，就会因为不在 <code>exports</code> 里而失败。这看起来是限制，其实是好事：内部文件没人能直接依赖，你就可以放心重构。</p>
<h2>发布前怎么检查</h2>
<ol>
<li><code>npm pack --dry-run</code> 看实际会打包哪些文件。</li>
<li><code>npx publint</code> 检查 <code>exports</code> 写的路径和文件是否对得上。</li>
<li><code>npx @arethetypeswrong/cli --pack</code> 检查各种解析模式下类型是否正确。</li>
<li>在独立项目里 <code>npm install ../count-label-1.0.0.tgz</code>，用包名导入，运行 <code>tsc --noEmit</code> 和真实代码。</li>
</ol>
<p>最后一步最关键。在库自己的仓库里测试，走的是相对路径，<code>exports</code> 写错了也发现不了；只有装成依赖、按包名导入，才是使用者真正的路径。</p>
<h2>类型也是版本契约的一部分</h2>
<p>删掉一个导出的类型、把参数收窄、调换重载顺序，都可能让使用者编译失败。所以这些改动要按语义化版本算作破坏性变更。复杂的公开类型可以写类型测试锁住，见<a href="/questions/ts-type-testing/">《TypeScript 复杂类型应该怎样测试？》</a>。</p>
<h2>常见追问</h2>
<p><strong>还需要顶层的 <code>types</code> 字段吗？</strong></p>
<blockquote>
<p>只是为了不支持 <code>exports</code> 的旧解析模式 <code>node10</code> 才保留。TypeScript 7 已经删除了这个模式。</p>
</blockquote>
<p><strong><code>typesVersions</code> 是做什么的？</strong></p>
<blockquote>
<p>它给不同版本的 TypeScript 提供不同的声明。现在主要用来在旧解析模式下兼容子路径。</p>
</blockquote>`};export{e as default};