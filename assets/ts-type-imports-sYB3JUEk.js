var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>import type { User } from &#x27;./model&#x27;</code> 编译后整条删除，<code>model</code> 不会因此被加载执行。</li>
<li><code>verbatimModuleSyntax</code> 下，<code>import { type User } from &#x27;./model&#x27;</code> 会编译成 <code>import {} from &#x27;./model&#x27;</code>，模块仍被加载并执行顶层代码。</li>
<li>开启 <code>verbatimModuleSyntax</code> 后，只用作类型却没写 <code>type</code> 的导入报 <code>TS1484</code>，从而保证源码中的导入与输出一一对应。</li>
<li>Node.js 类型剥离、esbuild、SWC 逐文件转换，无法判断导入的名字是不是类型，所以项目需要开启 <code>verbatimModuleSyntax</code>，配合 TS 5.8 的 <code>erasableSyntaxOnly</code>。</li>
<li>需要执行副作用（注册插件、引入样式）时写 <code>import &#x27;./register.js&#x27;</code>，不要依赖其他导入碰巧被保留。</li>
</ul>
<h2>三种写法的输出</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// model.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">interface</span> <span class="hljs-title class_">User</span> {
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
}
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> version = <span class="hljs-string">&#x27;1.0&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;model 已执行&#x27;</span>);
</code></pre></div>
<table><thead><tr><th>源码</th><th><code>verbatimModuleSyntax: true</code> 的输出</th></tr></thead><tbody><tr><td><code>import type { User } from &#x27;./model.js&#x27;</code></td><td>删除</td></tr><tr><td><code>import { type User } from &#x27;./model.js&#x27;</code></td><td><code>import {} from &#x27;./model.js&#x27;</code></td></tr><tr><td><code>import { User } from &#x27;./model.js&#x27;</code></td><td>报错 TS1484</td></tr><tr><td><code>import { version, type User } from &#x27;./model.js&#x27;</code></td><td><code>import { version } from &#x27;./model.js&#x27;</code></td></tr></tbody></table>
<p>未开启时，TypeScript 会分析每个导入是否只作类型用，自动删掉未作为值使用的导入（导入省略），上面前三行都会被删除。</p>
<h2>为什么单文件转换器需要它</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">User</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./model.ts&#x27;</span>;
</code></pre></div>
<p>Node.js 直接运行这一行时报 <code>SyntaxError</code>：<code>model.ts</code> 并没有导出名为 <code>User</code> 的值。转换器只看到当前文件，不知道 <code>User</code> 是接口。写成 <code>import type</code> 或 <code>import { type User }</code> 后才能运行。</p>
<h2>Node.js 原生运行 TypeScript</h2>
<p>Node.js 22.18+、23.6+ 默认开启类型剥离，24.12+、25.2+ 标为稳定。它的限制：</p>
<ul>
<li>只删除类型，不转换语法：<code>enum</code>、带运行时代码的 <code>namespace</code>、构造函数参数属性、<code>import x = require()</code> 会报错；装饰器无法解析。</li>
<li>不读取 tsconfig，<code>paths</code> 不生效，用 <code>package.json</code> 的 <code>imports</code>（<code>#src/*</code>）替代。</li>
<li>导入必须写 <code>.ts</code> 扩展名。</li>
<li>不处理 <code>node_modules</code> 中的 <code>.ts</code> 文件。</li>
</ul>
<p>推荐的类型检查配置：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;compilerOptions&quot;: {
    &quot;noEmit&quot;: true,
    &quot;target&quot;: &quot;esnext&quot;,
    &quot;module&quot;: &quot;nodenext&quot;,
    &quot;rewriteRelativeImportExtensions&quot;: true,
    &quot;erasableSyntaxOnly&quot;: true,
    &quot;verbatimModuleSyntax&quot;: true
  }
}
</code></pre></div>
<p><code>erasableSyntaxOnly</code> 让 tsc 对上述不可擦除语法报 <code>TS1294</code>。</p>
<h2>其他细节</h2>
<ul>
<li><code>import type</code> 导入的类只能用作类型，不能 <code>new</code>，也不能用于 <code>instanceof</code>。</li>
<li><code>export type { User }</code> 只导出类型；重新导出类型时也要标 <code>type</code>。</li>
<li><code>verbatimModuleSyntax</code> 不会把 ESM 语法改写成 <code>require</code>，CommonJS 文件中写 <code>import</code> 会报错，要用 <code>import x = require()</code> 或把文件改成 ESM。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 <code>isolatedModules</code> 的关系？<code>isolatedModules</code> 只禁止单文件无法正确转换的写法；<code>verbatimModuleSyntax</code> 规定导入导出按写法保留，取代了旧的 <code>importsNotUsedAsValues</code> 和 <code>preserveValueImports</code>。两者常一起开启。</li>
<li>会影响 tree shaking 吗？<code>import {}</code> 会让打包器认为模块可能有副作用，除非包在 <code>package.json</code> 中声明了 <code>&quot;sideEffects&quot;: false</code>。</li>
</ul>`};export{e as default};