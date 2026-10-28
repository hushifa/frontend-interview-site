var e={answerHtml:`<h2>简答</h2>
<ul>
<li>每个子包一个 tsconfig，用 <code>references: [{ &quot;path&quot;: &quot;../core&quot; }]</code> 声明依赖；根 tsconfig 设 <code>&quot;files&quot;: []</code>，只列出所有子项目。</li>
<li>被引用的项目必须开启 <code>composite</code>，它要求输出声明文件、明确列出输入文件，下游通过 <code>.d.ts</code> 了解上游类型，而不是重新检查上游源码。</li>
<li><code>tsc -b</code> 按依赖顺序构建，用 <code>.tsbuildinfo</code> 判断哪些项目已是最新并跳过。</li>
<li>TypeScript 5.6 起，上游有错误时 <code>tsc -b</code> 继续构建整个项目图并尽量输出；CI 中需要旧行为时加 <code>--stopBuildOnErrors</code>。</li>
<li>项目引用只管类型检查和 tsc 输出，包名解析靠 pnpm/npm 工作区和 <code>package.json</code> 的 <code>exports</code>。</li>
</ul>
<h2>最小结构</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">tsconfig.json          // 根：只聚合
packages/core/tsconfig.json
packages/app/tsconfig.json  // 引用 core
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// tsconfig.json
{
  &quot;files&quot;: [],
  &quot;references&quot;: [{ &quot;path&quot;: &quot;./packages/core&quot; }, { &quot;path&quot;: &quot;./packages/app&quot; }]
}
</code></pre></div>
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
<p><code>composite</code> 会自动开启 <code>declaration</code>；<code>declarationMap</code> 让编辑器从 <code>.d.ts</code> 跳转回源码。</p>
<h2>常用命令</h2>
<table><thead><tr><th>命令</th><th>作用</th></tr></thead><tbody><tr><td><code>tsc -b</code></td><td>按依赖构建所有过期项目</td></tr><tr><td><code>tsc -b --verbose</code></td><td>打印每个项目为何构建或跳过</td></tr><tr><td><code>tsc -b --watch</code></td><td>监听整个项目图</td></tr><tr><td><code>tsc -b --clean</code></td><td>删除 tsc 生成的输出</td></tr><tr><td><code>tsc -b --force</code></td><td>忽略缓存，全部重建</td></tr><tr><td><code>tsc -b --stopBuildOnErrors</code></td><td>上游出错时跳过下游</td></tr></tbody></table>
<p>对 app 单独执行 <code>tsc -p packages/app</code> 不会先构建 core，core 的声明不存在时会报错。</p>
<h2>5.6 的行为变化</h2>
<p>5.6 之前，<code>tsc -b</code> 相当于隐式开启 <code>noEmitOnError</code>，遇到第一个有错误的项目就停止，下游完全不检查。5.6 起会继续检查和输出下游，错误照常报告且退出码非零，并且总是写出 <code>.tsbuildinfo</code>。判断构建成功要看退出码，不能看 <code>dist</code> 里有没有文件。</p>
<h2>带来的好处</h2>
<ul>
<li>大仓库只重新检查改动的包及其下游。</li>
<li>强制依赖方向：app 只能通过 core 的公开声明使用它，引用了未声明依赖的项目会报错。</li>
<li>编辑器按项目加载，内存占用更低。</li>
</ul>
<h2>与其他工具的分工</h2>
<table><thead><tr><th>问题</th><th>负责者</th></tr></thead><tbody><tr><td><code>import &#x27;@acme/core&#x27;</code> 解析到哪个目录</td><td>工作区链接 + <code>exports</code></td></tr><tr><td>浏览器产物</td><td>Vite、Rollup 等打包器</td></tr><tr><td>类型检查与声明输出</td><td><code>tsc -b</code></td></tr></tbody></table>
<p>依赖关系不能有循环。拆分粒度按稳定的模块边界，不必每个目录一个项目。</p>
<h2>常见追问</h2>
<ul>
<li><code>.tsbuildinfo</code> 能在 CI 中缓存吗？可以，但必须连同输出目录一起缓存，只恢复 <code>.tsbuildinfo</code> 会让 tsc 误以为声明已存在。</li>
<li>和 monorepo 任务工具（Turborepo、Nx）的关系？它们负责跨语言的任务编排和缓存，可以调用 <code>tsc -b</code>，两者不冲突。</li>
</ul>`};export{e as default};