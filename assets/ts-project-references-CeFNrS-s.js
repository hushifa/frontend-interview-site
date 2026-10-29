var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个仓库里有多个包，比如 app 依赖 core。项目引用的做法是每个包一个 tsconfig，在 app 的 tsconfig 里写 <code>references: [{ &quot;path&quot;: &quot;../core&quot; }]</code>，声明它依赖 core。根目录的 tsconfig 设 <code>&quot;files&quot;: []</code>，只负责把所有子项目列出来。</p>
<p>被引用的项目必须开启 <code>composite</code>。它要求输出声明文件、明确列出输入文件，这样下游通过上游的 <code>.d.ts</code> 了解类型，不用重新检查上游的源码。<code>tsc -b</code> 按依赖顺序构建，用 <code>.tsbuildinfo</code> 记录状态，判断哪些项目已经是最新的，直接跳过。</p>
<p>好处是大仓库只重新检查改动的包和它的下游，依赖方向也被强制下来。</p>
<p>要注意两点。TypeScript 5.6 起，上游有错误时 <code>tsc -b</code> 仍会继续构建下游，CI 里想要旧行为加 <code>--stopOnBuildErrors</code>。另外它只管类型检查和 tsc 输出，<code>import &#x27;@acme/core&#x27;</code> 解析到哪里，要靠 pnpm、npm 工作区和 <code>package.json</code> 的 <code>exports</code>。</p>
</blockquote>
<h2>最小的目录结构</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">tsconfig.json          // 根：只聚合
packages/core/tsconfig.json
packages/app/tsconfig.json  // 引用 core
</code></pre></div>
<p>根目录的配置只列出子项目，自己不包含任何文件：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// tsconfig.json
{
  &quot;files&quot;: [],
  &quot;references&quot;: [{ &quot;path&quot;: &quot;./packages/core&quot; }, { &quot;path&quot;: &quot;./packages/app&quot; }]
}
</code></pre></div>
<p>core 是被引用的一方，必须开 <code>composite</code>：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// packages/core/tsconfig.json
{
  &quot;compilerOptions&quot;: {
    &quot;module&quot;: &quot;nodenext&quot;,
    &quot;composite&quot;: true,
    &quot;declarationMap&quot;: true,
    &quot;rootDir&quot;: &quot;src&quot;,
    &quot;outDir&quot;: &quot;dist&quot;
  },
  &quot;include&quot;: [&quot;src&quot;]
}
</code></pre></div>
<p>app 通过 <code>references</code> 声明依赖 core：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// packages/app/tsconfig.json
{
  &quot;compilerOptions&quot;: {
    &quot;module&quot;: &quot;nodenext&quot;,
    &quot;composite&quot;: true,
    &quot;rootDir&quot;: &quot;src&quot;,
    &quot;outDir&quot;: &quot;dist&quot;
  },
  &quot;include&quot;: [&quot;src&quot;],
  &quot;references&quot;: [{ &quot;path&quot;: &quot;../core&quot; }]
}
</code></pre></div>
<p><code>composite</code> 会自动打开 <code>declaration</code>，所以 core 构建后会输出 <code>.d.ts</code>，app 检查时读的就是这些声明。<code>declarationMap</code> 额外生成映射文件，在编辑器里点“跳转到定义”时能跳回 core 的源码，而不是停在 <code>.d.ts</code> 上。</p>
<h2>常用命令</h2>
<table><thead><tr><th>命令</th><th>作用</th></tr></thead><tbody><tr><td><code>tsc -b</code></td><td>按依赖构建所有过期项目</td></tr><tr><td><code>tsc -b --verbose</code></td><td>打印每个项目为何构建或跳过</td></tr><tr><td><code>tsc -b --watch</code></td><td>监听整个项目图</td></tr><tr><td><code>tsc -b --clean</code></td><td>删除 tsc 生成的输出</td></tr><tr><td><code>tsc -b --force</code></td><td>忽略缓存，全部重建</td></tr><tr><td><code>tsc -b --stopOnBuildErrors</code></td><td>上游出错时跳过下游</td></tr></tbody></table>
<p>一个容易踩的坑：单独对 app 执行 <code>tsc -p packages/app</code>，它不会先去构建 core。core 的声明还没生成时，就会报找不到类型。要按依赖顺序构建，得用 <code>tsc -b</code>。</p>
<h2>5.6 改了什么</h2>
<p>5.6 之前，<code>tsc -b</code> 相当于隐式开启了 <code>noEmitOnError</code>，遇到第一个有错误的项目就停下来，下游完全不检查。5.6 起它会继续检查和输出下游，错误照常报告，退出码也是非零，并且总是写出 <code>.tsbuildinfo</code>。</p>
<p>所以现在判断构建是否成功，要看退出码，不能看 <code>dist</code> 里有没有文件。上游出错了，<code>dist</code> 里照样可能有东西。</p>
<h2>用了以后有什么好处</h2>
<p>最直接的是快：大仓库改了一个包，只需要重新检查这个包和依赖它的下游。其次是强制依赖方向，app 只能通过 core 公开的声明使用它，引用了没声明依赖的项目会报错。编辑器也会按项目加载，内存占用更低。</p>
<h2>它和其他工具怎么分工</h2>
<table><thead><tr><th>问题</th><th>负责者</th></tr></thead><tbody><tr><td><code>import &#x27;@acme/core&#x27;</code> 解析到哪个目录</td><td>工作区链接 + <code>exports</code></td></tr><tr><td>浏览器产物</td><td>Vite、Rollup 等打包器</td></tr><tr><td>类型检查与声明输出</td><td><code>tsc -b</code></td></tr></tbody></table>
<p>项目之间的依赖不能有循环。拆分粒度按稳定的模块边界来，不必每个目录都建一个项目。</p>
<h2>常见追问</h2>
<p><strong><code>.tsbuildinfo</code> 能在 CI 里缓存吗？</strong></p>
<blockquote>
<p>可以，但必须和输出目录一起缓存。只恢复 <code>.tsbuildinfo</code>，tsc 会以为声明文件已经存在而跳过构建，下游就找不到类型了。</p>
</blockquote>
<p><strong>它和 Turborepo、Nx 这些 monorepo 工具是什么关系？</strong></p>
<blockquote>
<p>它们负责跨语言的任务编排和缓存，可以在任务里调用 <code>tsc -b</code>，两者并不冲突。</p>
</blockquote>`};export{e as default};