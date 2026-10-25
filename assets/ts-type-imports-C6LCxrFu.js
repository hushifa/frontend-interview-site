var e={answerHtml:`<p>一个 TypeScript 模块可能同时导出接口和真实函数。接口只参与类型检查，函数则可能需要在运行时加载。import type 用语法明确说明“这份依赖只用来解释类型”，避免把是否保留导入完全交给后续使用情况推断。</p>
<p>这不仅影响输出大小，也可能影响模块顶层副作用是否执行。因此类型依赖与初始化依赖应分别表达。</p>
<h3>先准备一个同时有类型和运行时代码的模块</h3>
<p>以下文件使用 ESM，并在编译时启用 verbatimModuleSyntax：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// model.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">interface</span> <span class="hljs-title class_">User</span> {
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
}
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> version = <span class="hljs-string">&#x27;1.0&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;model 已执行&#x27;</span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// type-only.ts</span>
<span class="hljs-keyword">import</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">User</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./model.js&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">user</span>: <span class="hljs-title class_">User</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-property">name</span>); <span class="hljs-comment">// Lin</span>
</code></pre></div>
<p>整条 import type 会被擦除。若没有其他路径加载 model，运行 type-only 的编译产物不会执行 model 的那条日志。类型检查时仍然需要找到它的声明信息，但这不是运行时模块求值。</p>
<p>ESM 输出中可能保留 export {} 来维持当前文件的模块身份，这也不等于重新加载 model。</p>
<h3>普通 import 中的 type 成员可能留下空导入</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// inline-type.ts</span>
<span class="hljs-keyword">import</span> { <span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./model.js&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">user</span>: <span class="hljs-title class_">User</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user.<span class="hljs-property">name</span>);
</code></pre></div>
<p>在 verbatimModuleSyntax 规则下，类型成员被移除，但普通 import 语句可以保留为 <code>import {} from &#x27;./model.js&#x27;</code>。这个空导入仍然会加载并求值模块，所以运行时先输出“model 已执行”，再输出 Lin。</p>
<p>因此 <code>import type { User }</code> 与 <code>import { type User }</code> 在只导入类型成员时，不能一概认为输出完全一样。如果目标明确是纯类型依赖，整条 import type 更直接；如果有必要执行模块，则应显式表达那个目的。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// mixed.ts</span>
<span class="hljs-keyword">import</span> { version, <span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./model.js&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">user</span>: <span class="hljs-title class_">User</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${version}</span>:<span class="hljs-subst">\${user.name}</span>\`</span>); <span class="hljs-comment">// 1.0:Lin</span>
</code></pre></div>
<p>这时输出会保留 version 的运行时导入，移除 User 的类型部分。模块执行日志仍然发生，是因为确实存在值依赖。</p>
<h3>初始化副作用不要寄托在类型导入上</h3>
<p>某个模块可能负责注册插件、安装补丁或初始化全局能力。如果这些行为是必要依赖，应使用明确的副作用导入，例如 <code>import &#x27;./register.js&#x27;</code>，而不是期待某个接口引用碰巧保留导入。</p>
<p>类型导入被移除后，编译器也不允许把它直接当作运行时值使用。类同时有类型和构造器两种含义，若用 import type 导入类名，可以用来标注实例类型，却不能据此 new 一个实例。需要构造器、instanceof 或静态方法时，应导入实际值。</p>
<p>导出也有类似区别：export type 明确只暴露类型，普通值导出则需要对应运行时实体。只看名字是否大写，不能准确区分这两种用途。</p>
<h3>verbatimModuleSyntax 让模块格式错误更早暴露</h3>
<p>该选项保留未标记为类型的相应模块语法，而不是在不匹配的模块环境中悄悄把 ESM import/export 改写成 CommonJS require。</p>
<p>例如在按 CommonJS 解释的文件里编写不适合该设置的 ESM 值语法，会得到诊断。应统一 package.json 的 type、文件扩展名、module 与 moduleResolution，不能为了消除错误就随意关闭规则。</p>
<p>确实面向 CommonJS 的代码，可以采用符合 TypeScript 与宿主约定的 CommonJS 表达方式或调整模块输出策略。正确配置的目标是让源码意图与运行时格式一致，不是让所有语法在任何文件里都被强行接受。</p>
<h3>类型检查器、转换器和打包器分别承担不同工作</h3>
<p>Vite、Babel、SWC 等链路可能按文件转换 TypeScript，而不进行完整跨文件类型检查。显式类型导入能减少它们判断导入性质的歧义，但不能因此省略独立的类型检查。</p>
<p>该选项也不是 tree shaking 的替代。TypeScript 保留一个值导入后，打包器还可能根据实际使用和副作用规则进一步优化；如果副作用声明不准确，最终结果仍可能偏离意图。</p>
<p>同样，编译器能找到模块类型，不代表浏览器能解析某个裸包名或路径别名。类型导入消失后不需要运行时解析，但真正保留下来的导入必须有可用的运行时目标。</p>
<h3>验证时要同时看输出和执行顺序</h3>
<p>可以编译上面的三个入口，检查 JavaScript 中是否仍有指向 model 的 import，再分别运行入口观察日志。只看 TypeScript 文件中“这个名字只用于类型”，不足以判断最终是否执行了依赖模块。</p>
<p>升级编译器或调整 verbatimModuleSyntax 时，应重点检查纯类型导入、混合导入、副作用入口与模块格式。把这些意图写清楚，通常比依赖历史导入擦除选项和偶然的转换行为更容易维护。</p>`};export{e as default};