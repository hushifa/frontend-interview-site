var e={answerHtml:`<p>ES Modules，也就是 ESM，是 JavaScript 的标准模块系统，用 import、export 表达模块关系。CommonJS 则通过 require、module.exports 等接口组织模块，广泛存在于 Node.js 和历史工具链中。</p>
<p>差异不仅是关键字不同，还包括依赖怎样发现、变量怎样暴露、模块何时执行，以及宿主怎样解析路径。浏览器原生支持 ESM，不会在普通页面脚本中自动提供 Node 风格的 require。</p>
<h3>ESM 导入通常连接到导出的绑定</h3>
<p>下面两个文件放在同一目录，以 Node.js 执行 main.mjs，或者通过正确配置的浏览器模块入口加载：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// counter.mjs</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
  count += <span class="hljs-number">1</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.mjs</span>
<span class="hljs-keyword">import</span> { count, increment } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./counter.mjs&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 0</span>
<span class="hljs-title function_">increment</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>import 的 count 不是在导入时拍下的一份数字快照，而是连接到导出模块的绑定。导出方更新 count，导入方随后读取就能看到新值。</p>
<p>导入方不能直接给这个导入绑定重新赋值。但如果导出的值本身是可变对象，仍可能修改其属性；“导入绑定不可赋值”不等于导出对象自动冻结。</p>
<p>默认导出还要看具体写法。<code>export default count</code> 导出的是该表达式求值所得的默认值；<code>export { count as default }</code> 则把 count 作为默认导出绑定。不能只凭都有 default 就认定后续更新行为完全一致。</p>
<h3>CommonJS 也不只是“把数据复制一份”</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// counter.cjs</span>
<span class="hljs-built_in">exports</span>.<span class="hljs-property">count</span> = <span class="hljs-number">0</span>;
<span class="hljs-built_in">exports</span>.<span class="hljs-property">increment</span> = <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-built_in">exports</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// main.cjs</span>
<span class="hljs-keyword">const</span> counter = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;./counter.cjs&#x27;</span>);
<span class="hljs-keyword">const</span> { count } = counter;
counter.<span class="hljs-title function_">increment</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(counter.<span class="hljs-property">count</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>require 得到的是 module.exports 当时导出的值。这里是一个对象，调用方可以继续观察该对象属性的变化。解构出的 count 则是一次普通属性读取后保存的数字，不会自动变成实时绑定。</p>
<p>因此“CommonJS 是值拷贝，ESM 是引用”过于粗糙。CommonJS 导出对象仍可以共享，getter 也能提供动态读取；真正不同的是标准模块绑定与普通 JavaScript 值访问的语义。</p>
<p>模块内的 exports 起初只是 module.exports 的别名。给 exports 添加属性通常是在修改同一个导出对象；直接写 <code>exports = 新对象</code> 只改了局部变量，不会把 module.exports 一起替换。需要整体更换导出值时应明确使用 module.exports，并了解已取得旧对象的调用方不会因此自动改持有新对象。</p>
<h3>静态 import 的分析阶段与运行时求值不同</h3>
<p>ESM 静态导入必须出现在相应顶层语法位置，模块依赖可以在执行正文前被识别、加载与链接。依赖图建立后，才按模块求值规则执行；不是读到某一行 import 时才把那一行当普通函数调用。</p>
<p>这有利于工具分析，但不保证所有代码都能被 tree shaking 删除。顶层副作用、导入方式、包的副作用声明和打包器能力都会影响结果。仅仅把文件后缀改成 mjs，不会自动消灭无用代码。</p>
<p>动态 import() 是表达式，返回 Promise，可以按条件加载模块。浏览器和打包工具常用它作为按需加载入口，但实际是否产生独立文件、怎样预加载，取决于工具配置与代码形式。</p>
<p>CommonJS 的 require 是执行过程中的调用，可以放在条件分支里；通常同步加载并执行所需模块。它也有缓存：相同已解析模块通常不会每次 require 都重新执行。但缓存身份由解析结果决定，不能把不同路径、不同包副本一概当成同一个模块。</p>
<h3>Node.js 的文件判定要明确配置</h3>
<p>.mjs 明确表示 ESM，.cjs 明确表示 CommonJS。对于 .js，最近相关 package.json 的 type 等环境规则会影响解释方式，现代 Node 还可能对没有明确标记的输入进行语法判定。为可维护性，应显式声明包类型，而不是依赖某一版本的兜底推断。</p>
<p>Node 的原生 ESM 相对导入通常需要明确扩展名，包解析也遵循其规则。Vite 等工具可能提供别名、扩展名补全和包入口处理，这些便利不能直接当成浏览器或 Node 原生加载器的统一行为。</p>
<p>浏览器中的裸包名导入，例如 import from &#x27;some-package&#x27;，通常需要 import map 或构建工具参与。文件能在开发服务器工作，并不证明直接放到任意静态页面也能按同样方式解析。</p>
<h3>互操作必须看方向和版本</h3>
<p>ESM 导入 CommonJS 时，默认导入通常对应 module.exports 的值。Node 可以从一些常见写法静态推断可用的命名导出，但这种推断并非覆盖所有动态写法，推断出的命名导出也不等同于完整的 ESM 实时绑定。遇到兼容问题，显式读取默认导出对象通常更容易理解。</p>
<p>CommonJS 中可以使用动态 import() 加载 ESM，结果是 Promise。现代 Node 也支持在满足条件时通过 require 加载同步 ESM 图，但带顶层 await 的异步模块图不能简单当成同步 require 处理。旧版本对这种能力的支持不同，不能再把“require 永远不能加载 ESM”写成所有当前环境的定律。</p>
<p>原生 ESM 中没有自动提供的 require、exports 和 module.exports；需要 Node 的 CommonJS 解析入口时，可以按文档使用 createRequire。模块自身地址可以从 import.meta.url 获取，Node 的路径辅助能力还应按目标版本选用，不要随意把 URL 字符串当作所有平台的本地路径。</p>
<h3>循环依赖不是换个语法就安全</h3>
<p>ESM 能链接循环依赖，但读取尚未初始化的词法绑定仍可能触发暂时性死区错误。CommonJS 在循环加载中可能向对方提供尚未执行完的导出对象，因此调用方可能看到不完整状态。</p>
<p>两者都不承诺“循环里的所有模块已经初始化完成，再开始任何顶层访问”。如果模块彼此都在顶层马上读取对方的结果，最好重构依赖，或把实际使用延后到明确的初始化阶段。</p>
<p>选择模块形式时，应结合目标宿主、发布格式、依赖生态和构建规则。真正要保持一致的是模块边界与可预测的初始化流程，而不是把几个看起来相似的导入写法混用到刚好能运行。</p>`};export{e as default};