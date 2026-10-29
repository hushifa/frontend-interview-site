var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>import type { User } from &#x27;./model&#x27;</code> 表示只导入类型，编译后整条语句被删掉，<code>model</code> 不会因此被加载执行。而开启 <code>verbatimModuleSyntax</code> 后，<code>import { type User } from &#x27;./model&#x27;</code> 只删掉 <code>User</code> 这个名字，留下 <code>import {} from &#x27;./model&#x27;</code>，模块还是会被加载，顶层代码照样执行。</p>
<p><code>verbatimModuleSyntax</code> 的意思是“导入按原样保留”：没标 <code>type</code> 的名字一律保留，所以只当类型用却没写 <code>type</code> 的导入会报 <code>TS1484</code>。这保证了源码里的导入和输出一一对应。</p>
<p>为什么需要它？Node.js 类型剥离、esbuild、SWC 都是一个文件一个文件地转换，看不到别的文件，判断不了导入的名字是不是类型。所以要靠你显式标出来，通常再配合 TS 5.8 的 <code>erasableSyntaxOnly</code>。</p>
<p>要注意，需要执行副作用，比如注册插件、引入样式，就直接写 <code>import &#x27;./register.js&#x27;</code>，不要指望别的导入碰巧被保留下来。</p>
</blockquote>
<h2>几种写法分别输出什么</h2>
<p>先看一个既有类型、又有值、还有副作用的模块：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// model.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">interface</span> <span class="hljs-title class_">User</span> {
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
}
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> version = <span class="hljs-string">&#x27;1.0&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;model 已执行&#x27;</span>);
</code></pre></div>
<p>不同的导入写法，在 <code>verbatimModuleSyntax: true</code> 下输出不同：</p>
<table><thead><tr><th>源码</th><th><code>verbatimModuleSyntax: true</code> 的输出</th></tr></thead><tbody><tr><td><code>import type { User } from &#x27;./model.js&#x27;</code></td><td>删除</td></tr><tr><td><code>import { type User } from &#x27;./model.js&#x27;</code></td><td><code>import {} from &#x27;./model.js&#x27;</code></td></tr><tr><td><code>import { User } from &#x27;./model.js&#x27;</code></td><td>报错 TS1484</td></tr><tr><td><code>import { version, type User } from &#x27;./model.js&#x27;</code></td><td><code>import { version } from &#x27;./model.js&#x27;</code></td></tr></tbody></table>
<p>第一种整条删掉，“model 已执行”不会打印。第二种只删名字，留下的空导入仍会加载 <code>model</code>，所以会打印。第四种只删 <code>User</code>，保留 <code>version</code>。</p>
<p>如果不开这个选项，TypeScript 会自己分析每个导入是不是只当类型用，把没当值用的导入删掉，这叫导入省略。这时前三行都会被删掉，有没有副作用就取决于编译器的分析，不直观。</p>
<h2>为什么单文件转换器离不开它</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">User</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./model.ts&#x27;</span>;
</code></pre></div>
<p>用 Node.js 直接运行这一行会报 <code>SyntaxError</code>，说 <code>model.ts</code> 没有导出名为 <code>User</code> 的值。原因是 Node 只是把类型删掉，它只看当前文件，不知道 <code>User</code> 是个接口，就把它当成值去导入，而运行时的 <code>model.ts</code> 里根本没有这个值。写成 <code>import type</code> 或 <code>import { type User }</code>，Node 才知道要删掉它。</p>
<h2>Node.js 直接运行 TypeScript 有哪些限制</h2>
<p>Node.js 22.18+、23.6+ 默认开启类型剥离，24.12+、25.2+ 标记为稳定。它的做法是只把类型删掉，所以有这些限制：</p>
<ul>
<li>只删类型，不转换语法。<code>enum</code>、带运行时代码的 <code>namespace</code>、构造函数参数属性、<code>import x = require()</code> 都会报错；装饰器无法解析。</li>
<li>不读取 tsconfig，所以 <code>paths</code> 不生效，可以用 <code>package.json</code> 的 <code>imports</code>（<code>#src/*</code>）替代。</li>
<li>导入必须写 <code>.ts</code> 扩展名。</li>
<li>不处理 <code>node_modules</code> 里的 <code>.ts</code> 文件。</li>
</ul>
<p>配合它做类型检查，推荐这样配置：</p>
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
<p><code>erasableSyntaxOnly</code> 会让 tsc 对上面那些不能直接擦掉的语法报 <code>TS1294</code>，在写代码时就发现问题，而不是等到运行。</p>
<h2>其他细节</h2>
<p>用 <code>import type</code> 导入的类只能当类型用，不能 <code>new</code>，也不能用来做 <code>instanceof</code>。只导出类型时写 <code>export type { User }</code>，重新导出类型也要标 <code>type</code>。</p>
<p>另外，<code>verbatimModuleSyntax</code> 不会把 ESM 语法改写成 <code>require</code>。在 CommonJS 文件里写 <code>import</code> 会报错，要么用 <code>import x = require()</code>，要么把文件改成 ESM。</p>
<h2>常见追问</h2>
<p><strong>它和 <code>isolatedModules</code> 是什么关系？</strong></p>
<blockquote>
<p><code>isolatedModules</code> 只是禁止那些单文件转换不了的写法。<code>verbatimModuleSyntax</code> 更进一步，规定导入导出按写法保留，它取代了旧的 <code>importsNotUsedAsValues</code> 和 <code>preserveValueImports</code>。两个选项经常一起开。</p>
</blockquote>
<p><strong>会影响 tree shaking 吗？</strong></p>
<blockquote>
<p>会有一点。留下来的 <code>import {}</code> 会让打包器认为这个模块可能有副作用，不敢删掉，除非包在 <code>package.json</code> 里声明了 <code>&quot;sideEffects&quot;: false</code>。</p>
</blockquote>`};export{e as default};