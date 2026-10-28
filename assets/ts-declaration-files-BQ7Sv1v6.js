var e={answerHtml:`<h2>简答</h2>
<ul>
<li>.d.ts 只描述类型，不包含实现，编译后不产生代码。</li>
<li>声明写了某个导出，不代表 JavaScript 真的导出了它，准确性由发布者负责。</li>
<li>包通过 package.json 的 types 或 exports 条件暴露类型入口，没有自带类型的库使用 @types 包。</li>
<li>declare global 和模块增补可以扩展已有类型。</li>
</ul>
<p>TypeScript 调用一个 JavaScript 库时，需要知道它导出了什么、函数接受哪些参数、返回什么值。.d.ts 就是提供这类信息的声明文件。</p>
<p>它像一份可被编译器理解的接口说明，不是运行时代码。声明里写有某个函数，不代表对应 JavaScript 一定导出了这个函数；声明准确与否，是发布者必须维护的契约。</p>
<h2>为已有 JavaScript 模块描述类型</h2>
<p>下面三个文件展示实现、声明与调用方的关系。真正运行时仍需要把 format-count.js 一起提供给消费者：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// format-count.js</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">formatCount</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(value) || value &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;数量必须是非负安全整数&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${value}</span> 项\`</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// format-count.d.ts</span>
<span class="hljs-comment">/** 将非负安全整数格式化为数量文案。 */</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">formatCount</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span>;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// consumer.ts</span>
<span class="hljs-keyword">import</span> { formatCount } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./format-count.js&#x27;</span>;

<span class="hljs-keyword">const</span> label = <span class="hljs-title function_">formatCount</span>(<span class="hljs-number">3</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(label.<span class="hljs-title function_">toUpperCase</span>()); <span class="hljs-comment">// 3 项</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">wrongCall</span>(<span class="hljs-params"></span>) {
  <span class="hljs-comment">// @ts-expect-error 声明要求 number，不接受字符串参数</span>
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">formatCount</span>(<span class="hljs-string">&#x27;3&#x27;</span>);
}
</code></pre></div>
<p>编译器根据声明拒绝字符串参数，并知道 label 可以使用字符串方法。运行时执行的仍是 JavaScript 实现，包括它对非负安全整数的真实检查。</p>
<p>number 类型本身也不排除负数、小数或 Infinity，所以声明文件并没有替代实现中的业务校验。文档与错误处理仍需说明这些限制。</p>
<h2>声明写错，会造成两种相反的问题</h2>
<p>如果把实际返回字符串的 formatCount 错写成返回 number，编译器可能允许调用 toFixed，运行时却报错。若实际允许某个参数形式、声明却没有描述，合法调用又会被编译器错误拒绝。</p>
<p>这就是为什么添加 any 只能暂时绕过问题，不能证明库的类型已经修好。正确做法是核对对应版本的实现、文档与测试，描述真实导出和行为。</p>
<p>异步接口也一样：一个 Promise 声明不说明请求一定成功，也不说明拒绝原因永远是某个 Error 子类。TypeScript 的常见函数签名不会自动编码所有可能抛错路径，调用方仍需按协议处理失败。</p>
<h2>模块声明与全局声明要区分</h2>
<p>有 import 或 export 的声明文件通常处于模块作用域，导出的类型供模块消费者使用。没有模块标记的环境声明则可能向全局提供名字，例如：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// globals.d.ts</span>
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">APP_VERSION</span>: <span class="hljs-built_in">string</span>;
</code></pre></div>
<p>这只告诉编译器宿主会提供 APP_VERSION，不会在页面中执行赋值。若构建工具、脚本或宿主没有实际注入它，直接读取仍会在运行时失败。</p>
<p>想从模块文件中扩展全局类型，需要使用 declare global 结构。为一个已有包补类型时，也要区分新建环境模块声明与对已有模块做增补，避免不小心遮住原来的导出。</p>
<p>对 SVG、CSS 模块等资源写 declare module，同样只是解释导入值的类型。真正把资源变成 URL、类名映射或其他值的，是构建工具或运行环境中的加载机制，不是 .d.ts。</p>
<h2>编译器怎样找到声明</h2>
<p>相对模块导入可以解析到对应的声明文件；npm 包可以通过 package.json 中的 types 或 exports 条件暴露类型入口；一些没有自带类型的库使用独立的 @types 包。具体查找路径还受 moduleResolution 等配置影响。</p>
<p>包的运行时格式与声明格式必须一致。在现代 Node 模式下，.d.mts、.d.cts 以及 package.json 的 type 会参与区分 ESM 与 CommonJS 声明语义，不能仅凭文件里看见一个 export 就忽略包格式。</p>
<p>只在源码仓库中通过 paths 别名找到类型，不代表安装后的消费者也能找到它。声明中若泄漏仅本仓库存在的别名或未发布的内部文件，使用者仍会遇到解析错误。</p>
<h2>自动生成声明，也需要检查公开边界</h2>
<p>TypeScript 源码可以通过 declaration 生成声明，或配合 emitDeclarationOnly 只输出类型产物。已有 JavaScript 也可以结合 JSDoc 与相关编译选项生成声明。</p>
<p>自动生成能减少手工同步，但不保证公开 API 天然好用。过度推导可能把内部实现类型暴露出去，引用不该要求消费者安装的依赖，或生成难以理解的复杂签名。发布前应检查入口及声明的依赖关系，而不只是确认某个 .d.ts 文件存在。</p>
<p>复制声明到 dist 不是完整发布验证；exports 条件、双格式类型和消费者测试见《TypeScript 库发布时怎样组织类型声明和入口？》。</p>
<h2>skipLibCheck 不能修复声明与实现不一致</h2>
<p>skipLibCheck 可以跳过部分声明文件内部的检查，但调用方使用这些声明时，仍然依赖其提供的信息。它不会自动替换错误签名，也不会让缺失的运行时方法出现。</p>
<p>升级类型后出现新诊断，可能是声明修正后暴露了原有误用，也可能是类型包与运行库版本不配套。应先检查契约变化，再决定修改代码、升级依赖或修补声明。</p>
<p>好的声明文件应该让合法调用自然得到正确推导，让非法调用尽早报错，并与真正发布的 JavaScript 一起演进。自动补全能显示方法，只是这份契约已经被读取，尚不足以证明功能真的存在。</p>`};export{e as default};