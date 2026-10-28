var e={answerHtml:`<h2>简答</h2>
<ul>
<li>project references 把大仓库拆成多个 tsconfig 项目，用 references 声明依赖。</li>
<li>被引用的项目需要开启 composite，并输出声明文件。</li>
<li>tsc -b 按依赖顺序增量构建，只重建变化的项目。</li>
<li>TypeScript 5.6 起，上游有错误时 tsc -b 仍会继续构建。</li>
</ul>
<p>一个项目逐渐拆成 core、ui、app 等包后，问题不只是文件变多，还包括谁依赖谁、哪些包需要先构建，以及改动一个包后是否必须重新检查全部代码。</p>
<p>TypeScript 项目引用用 tsconfig 中的 references 表达这些依赖边界。被引用包通常向消费者提供声明产物，构建模式据此决定顺序和需要更新的项目。</p>
<h2>一个 core 被 app 使用的最小结构</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">example/
  package.json
  tsconfig.json
  packages/
    core/
      tsconfig.json
      src/index.ts
    app/
      tsconfig.json
      src/main.ts
</code></pre></div>
<p>根 package.json 让本例的 JavaScript 产物按 ESM 解释：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;private&quot;: true,
  &quot;type&quot;: &quot;module&quot;
}
</code></pre></div>
<p>根 tsconfig.json 只收集子项目，不再把全部源码当作自己的输入：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;files&quot;: [],
  &quot;references&quot;: [
    { &quot;path&quot;: &quot;./packages/core&quot; },
    { &quot;path&quot;: &quot;./packages/app&quot; }
  ]
}
</code></pre></div>
<p>core 的配置负责输出 JavaScript 与声明：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;compilerOptions&quot;: {
    &quot;target&quot;: &quot;ES2022&quot;,
    &quot;module&quot;: &quot;NodeNext&quot;,
    &quot;moduleResolution&quot;: &quot;NodeNext&quot;,
    &quot;strict&quot;: true,
    &quot;composite&quot;: true,
    &quot;declaration&quot;: true,
    &quot;declarationMap&quot;: true,
    &quot;noEmitOnError&quot;: true,
    &quot;rootDir&quot;: &quot;src&quot;,
    &quot;outDir&quot;: &quot;dist&quot;,
    &quot;tsBuildInfoFile&quot;: &quot;dist/tsconfig.tsbuildinfo&quot;
  },
  &quot;include&quot;: [&quot;src&quot;]
}
</code></pre></div>
<p>app 使用同样的边界设置，并显式引用 core：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;compilerOptions&quot;: {
    &quot;target&quot;: &quot;ES2022&quot;,
    &quot;module&quot;: &quot;NodeNext&quot;,
    &quot;moduleResolution&quot;: &quot;NodeNext&quot;,
    &quot;strict&quot;: true,
    &quot;composite&quot;: true,
    &quot;declaration&quot;: true,
    &quot;noEmitOnError&quot;: true,
    &quot;rootDir&quot;: &quot;src&quot;,
    &quot;outDir&quot;: &quot;dist&quot;,
    &quot;tsBuildInfoFile&quot;: &quot;dist/tsconfig.tsbuildinfo&quot;
  },
  &quot;include&quot;: [&quot;src&quot;],
  &quot;references&quot;: [{ &quot;path&quot;: &quot;../core&quot; }]
}
</code></pre></div>
<h2>引用关系与实际导入路径都要写清楚</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// packages/core/src/index.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">add</span>(<span class="hljs-params"><span class="hljs-attr">left</span>: <span class="hljs-built_in">number</span>, <span class="hljs-attr">right</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">number</span> {
  <span class="hljs-keyword">return</span> left + right;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// packages/app/src/main.ts</span>
<span class="hljs-keyword">import</span> { add } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;../../core/dist/index.js&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">add</span>(<span class="hljs-number">2</span>, <span class="hljs-number">3</span>)); <span class="hljs-comment">// 5</span>
</code></pre></div>
<p>示例直接使用相对产物路径，便于看清运行时实际要加载哪个文件。真实多包仓库通常使用包名、工作区链接与 package.json exports 管理入口，但 references 本身不会替你自动创建这些运行时映射。</p>
<p>在根目录运行 <code>npx tsc -b --verbose</code>，构建器会先处理 core，再构建需要它的 app。完成后可以运行 <code>node packages/app/dist/main.js</code>，得到 5。</p>
<p>单独对 app 执行普通的 <code>tsc -p</code>，不等于会自动把缺失的 core 产物一起构建出来。编辑器可能通过源码重定向提供便利，也不能把编辑器里正常跳转等同于干净环境已经具备产物。</p>
<h2>composite 为什么要求更明确的项目边界</h2>
<p>composite 让编译器能够推断引用项目的输入与输出。其约束包括明确的实现文件范围、声明输出要求，以及 rootDir 默认行为等。显式列出 rootDir、outDir 和 include，通常比依赖隐含目录关系更容易维护。</p>
<p>消费者通过引用访问库项目时，需要有能表达其公共接口的声明产物。不要把需要向下游提供声明的库随手设为 noEmit，然后期待依赖边界仍然自动成立。纯检查项目的聚合配置与真正依赖声明输出的多包构建，是不同用途，应按工具链分别设计。</p>
<p>declarationMap 让编辑器有机会从声明导航回对应源码，但还取决于源码或映射路径是否可访问。发布包只有映射、却没有可用源码，并不能保证消费者一定获得完整源码跳转体验。</p>
<h2>增量构建使用的是状态记录，不是简单跳过命令</h2>
<p>.tsbuildinfo 保存编译器的增量状态，可帮助下一次判断哪些项目和文件需要重新处理。再次运行 tsc -b，即使没有变化，仍会检查状态，只是可以避免重复完整构建。</p>
<p>缓存应与源码、配置、编译器版本和相关输出保持一致。CI 可以缓存这些文件，但不能只恢复一个状态文件而忽略所需声明产物，再假定消费者必然能编译。</p>
<p><code>tsc -b --watch</code> 适合持续观察项目图；<code>--force</code> 强制重新构建；<code>--clean</code> 清理编译器管理的对应输出，不等同于清理整个打包器产物目录。排查“为什么没重建”时，先看 verbose 说明，再考虑缓存与路径问题。</p>
<h2>出错后是否继续构建，要看版本和策略</h2>
<p>TypeScript 5.6 起，<code>tsc -b</code> 在上游存在错误时会继续构建项目图（可用 <code>--stopOnBuildErrors</code> 恢复旧行为），不能继续沿用“tsc -b 永远在第一个错误处完全停止”的旧结论。</p>
<p>当前版本可使用 <code>--stopBuildOnErrors</code> 控制上游出错后跳过下游构建；具体参数与行为应通过所用版本的 <code>tsc -b --help</code> 核对。noEmitOnError 则控制有错项目自己的输出，两者的职责不同。</p>
<p>即使某些产物已经生成，也必须检查构建退出状态，不能把“dist 里有文件”当作检查成功。旧声明残留还可能让编辑器或局部命令暂时看起来可用，因此干净环境的完整构建很重要。</p>
<h2>项目引用不能替代整个多包架构</h2>
<p>references 不会安装依赖，不会替 npm/pnpm 配置工作区，也不会自动打包浏览器代码。路径别名、包导出、运行时模块格式和构建器入口仍要分别对应。</p>
<p>项目图应尽量保持清晰的依赖方向，避免互相引用形成循环。粒度也不是越细越好：拆分应体现稳定的模块边界，而不是每个目录都单独建立一个项目增加维护成本。</p>
<p>验证时至少覆盖首次无产物构建、重复增量构建、上游接口变化、上游出错和实际执行产物。只验证仓库里已有缓存时的一次成功，不足以证明项目引用配置能够可靠地支持团队与 CI。</p>`};export{e as default};