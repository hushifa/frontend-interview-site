var e={answerHtml:`<p>tsconfig 不能只当成一份“把报错关掉就能运行”的配置。它同时控制几类不同问题：编译器怎样检查代码、相信哪些环境 API、怎样解释模块，以及是否输出 JavaScript。</p>
<p>选项名称相近，不代表可以互相替代。比如提高 lib 可以让编译器认识新 API，却不会给旧浏览器安装实现；关闭严格检查可以减少诊断，却不会把实际缺失的数据补齐。</p>
<h3>一个由打包工具处理的浏览器项目起点</h3>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;compilerOptions&quot;: {
    &quot;target&quot;: &quot;ES2022&quot;,
    &quot;lib&quot;: [&quot;ES2023&quot;, &quot;DOM&quot;, &quot;DOM.Iterable&quot;],
    &quot;module&quot;: &quot;ESNext&quot;,
    &quot;moduleResolution&quot;: &quot;Bundler&quot;,
    &quot;strict&quot;: true,
    &quot;noUncheckedIndexedAccess&quot;: true,
    &quot;exactOptionalPropertyTypes&quot;: true,
    &quot;verbatimModuleSyntax&quot;: true,
    &quot;isolatedModules&quot;: true,
    &quot;noEmit&quot;: true
  },
  &quot;include&quot;: [&quot;src&quot;],
  &quot;exclude&quot;: [&quot;dist&quot;, &quot;node_modules&quot;]
}
</code></pre></div>
<p>这份配置假设后续由 Vite 等工具处理浏览器模块与产物，TypeScript 负责检查，所以使用 noEmit。它不是所有项目的通用最优配置，尤其不能直接套给原生 Node 模块或需要生成声明的库。</p>
<p>target、lib 的值还应根据目标设备与兼容策略选择，示例故意把输出语法与可用类型库分开，方便理解两者职责。</p>
<h3>strict 是一组选项，不是所有检查的总开关</h3>
<p>strict 开启一组严格类型检查，例如 strictNullChecks、noImplicitAny、strictFunctionTypes 等。具体包含项会随 TypeScript 演进，应在升级时查看变化。</p>
<p>noUncheckedIndexedAccess、exactOptionalPropertyTypes、noUnusedLocals 等并不因为 strict:true 就全部自动启用。可以按项目需要额外开启，但应理解它们解决的是哪类问题，而不是把每一个 true 都当成没有成本的质量提升。</p>
<p>未使用变量检查更多是代码维护约束；空值、索引和函数兼容性则直接影响类型模型。把这几类规则分开看，更容易解释哪些错误是潜在运行时问题，哪些属于项目风格。</p>
<h3>索引访问需要面对“可能根本没有这个值”</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> <span class="hljs-attr">scores</span>: <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">number</span>&gt; = { <span class="hljs-attr">math</span>: <span class="hljs-number">90</span> };
<span class="hljs-keyword">const</span> score = scores[<span class="hljs-string">&#x27;history&#x27;</span>];

<span class="hljs-comment">// @ts-expect-error 开启 noUncheckedIndexedAccess 后，score 可能为 undefined</span>
score.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>);

<span class="hljs-keyword">if</span> (score !== <span class="hljs-literal">undefined</span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(score.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>));
}
</code></pre></div>
<p>Record&lt;string,number&gt; 不会在运行时创建每一个字符串键。开启该选项后，未被声明为确定存在的索引访问会包含 undefined，提醒调用方处理缺失。</p>
<p>普通数组按索引访问也可能越界，不能仅凭数组元素类型是 number 就认定 items[0] 一定存在。明确的非空元组或其他控制关系可以提供更强的信息，但编译器并不会理解所有业务上的长度约定。</p>
<h3>精确可选属性区分缺席与显式 undefined</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Preferences</span> = { <span class="hljs-attr">theme</span>?: <span class="hljs-string">&#x27;light&#x27;</span> | <span class="hljs-string">&#x27;dark&#x27;</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">absent</span>: <span class="hljs-title class_">Preferences</span> = {};

<span class="hljs-comment">// @ts-expect-error exactOptionalPropertyTypes 开启时，存在的 theme 需要符合声明</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">explicit</span>: <span class="hljs-title class_">Preferences</span> = { <span class="hljs-attr">theme</span>: <span class="hljs-literal">undefined</span> };
</code></pre></div>
<p>开启 exactOptionalPropertyTypes 后，可选属性不自动等同于“存在时也可随意写 undefined”。如果确实允许这种值，应把 undefined 明确加入属性类型。</p>
<p>这能更准确表达对象展开、存在性检查和部分更新接口中的区别。但直接读取可选字段仍可能得到 undefined，因为键可以不存在；它不是保证所有读取都非空的选项。</p>
<h3>target 控制语法目标，lib 提供类型声明</h3>
<p>将 target 设为较旧版本，会影响 TypeScript 自己输出时采用哪些语法转换。若 noEmit:true，最终 JavaScript 由其他构建工具生成，它们的目标设置也需要单独核对。</p>
<p>lib 决定编译器预先知道哪些环境接口。DOM 提供浏览器类型，ES2023 提供相应标准 API 的声明，选择它不代表运行环境一定实现了所有这些接口。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> sorted = [<span class="hljs-number">3</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>].<span class="hljs-title function_">toSorted</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sorted.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3</span>
</code></pre></div>
<p>有合适的 lib 时这段代码可以通过检查，但较旧运行环境若没有 toSorted，仍会失败。降低 target 也不会自动把这个方法调用变成 polyfill。需要由兼容性方案、依赖或替代实现解决，而不是靠让编译器“认识”这个名字。</p>
<h3>module 与 moduleResolution 要匹配真正的加载器</h3>
<p>module 描述模块语法输出与相关检查环境，moduleResolution 描述查找依赖与类型入口的方式。Bundler 模式面向相应打包工具，NodeNext 更贴近现代 Node 的 ESM/CommonJS 与包入口规则。</p>
<p>不能为了让某个扩展名或包子路径不再报错就随意切换模式。开发环境能找到类型、生产环境却解析不到模块，往往来自这两套预期不一致。</p>
<p>paths 可以帮助 TypeScript 解析别名，但通常不会直接把输出中的导入字符串改写成真实路径。构建器或运行时还需要对应解析支持。verbatimModuleSyntax 则让类型导入与值导入的保留更明确，不负责替你修复错误的包入口。</p>
<h3>文件范围与输出控制也要分清</h3>
<p>include、files、exclude 决定项目入口文件如何被选中，但被导入的文件仍可能进入依赖图。exclude node_modules 不表示编译器永远不会读取依赖的声明；排除一个源码目录也不能阻止别处 import 其中的文件。</p>
<p>rootDir 主要影响输出路径结构与相关约束，不是文件扫描白名单。outDir 指定输出位置，不能代替 include/exclude 设计，避免把旧产物再次作为输入。</p>
<p>noEmit 表示根本不输出；noEmitOnError 则是在有错误时不输出。项目引用的构建模式还有自己的版本行为与依赖策略，应单独确认，不能把这些选项混成同一个“只检查”开关。</p>
<h3>构建成功与类型检查成功应分别作为证据</h3>
<p>很多前端工具能快速移除类型语法并生成可运行 JavaScript，但并没有完整执行 TypeScript 类型检查。CI 中应运行明确的检查命令，并检查退出状态，不能只看页面构建完成。</p>
<p>需要排查最终生效配置时，可以使用 tsc --showConfig；模块解析异常时，再有针对性地使用解析诊断。不要一遇到依赖类型错误就开 skipLibCheck：它可能减少声明检查成本，但不会修复错误契约或运行库与类型不一致。</p>
<p>一份可维护的配置应该能回答：代码最终在哪里运行，谁输出产物，谁补兼容能力，哪些边界需要更严格检查。先把这些问题说明白，再选择具体选项，通常比复制最长的配置清单更可靠。</p>`};export{e as default};