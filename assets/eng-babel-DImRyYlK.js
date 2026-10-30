var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>项目里写了 <code>const add = (a, b) =&gt; a + b</code> 和 <code>user?.name</code>，要在老浏览器上运行，就得把它们改写成老浏览器认识的写法，这是 Babel 做的事。它的工作分三步：解析，把源码变成一棵抽象语法树，也就是 AST；转换，让插件遍历这棵树、修改节点；生成，把改完的树重新输出成代码，同时可以生成 Source Map。</p>
<p>转换全靠插件，每个插件只管一种语法，比如箭头函数插件只把箭头函数节点换成普通函数节点。插件太多不好配，所以有了 preset，它是一组插件的集合，最常用的是 <code>@babel/preset-env</code>，按你配置的目标浏览器自动挑出需要的插件。顺序上，插件按配置从前往后执行，preset 则从后往前执行。</p>
<p>要分清的是语法和 API。箭头函数、可选链、class 是语法，Babel 能把它们改写成等价的旧代码；<code>Promise</code>、<code>Array.prototype.includes</code>、<code>Object.fromEntries</code> 是运行时才有的对象和方法，改写代码变不出来，需要用 polyfill 在运行时补上实现，通常用 core-js。<code>preset-env</code> 的 <code>useBuiltIns: &quot;usage&quot;</code> 能按代码里实际用到的 API 自动引入对应的 polyfill。</p>
<p>要注意，Babel 默认只转换语法，不会自动补 API，也不做类型检查。用 Babel 编译 TypeScript 时，它只是把类型注解删掉，类型错误要另外用 <code>tsc</code> 检查。</p>
</blockquote>
<h2>一段代码经过了什么</h2>
<p>以箭头函数为例：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 输入</span>
<span class="hljs-keyword">const</span> <span class="hljs-title function_">add</span> = (<span class="hljs-params">a, b</span>) =&gt; a + b;

<span class="hljs-comment">// 输出（目标浏览器不支持箭头函数时）</span>
<span class="hljs-keyword">var</span> add = <span class="hljs-keyword">function</span> <span class="hljs-title function_">add</span>(<span class="hljs-params">a, b</span>) {
  <span class="hljs-keyword">return</span> a + b;
};
</code></pre></div>
<p>解析阶段，<code>@babel/parser</code> 把这行代码变成 AST，里面有一个 <code>VariableDeclaration</code> 节点，它的初始值是一个 <code>ArrowFunctionExpression</code> 节点。转换阶段，箭头函数插件的访问器遇到 <code>ArrowFunctionExpression</code> 就把它替换成 <code>FunctionExpression</code>，表达式体改成带 <code>return</code> 的语句块；另一个插件把 <code>const</code> 改成 <code>var</code>。生成阶段，<code>@babel/generator</code> 把新的树打印成代码。</p>
<p>为什么不用字符串替换，而要先转成 AST？因为代码的结构靠字符串很难判断，比如 <code>=&gt;</code> 可能出现在字符串或注释里，箭头函数里的 <code>this</code> 还要特殊处理。AST 上每个节点都知道自己是什么，插件只需关心它要改的那种节点。</p>
<h2>写一个最简单的插件</h2>
<p>插件本质上是一个返回 <code>visitor</code> 对象的函数，<code>visitor</code> 的键是要处理的节点类型：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">removeConsole</span>(<span class="hljs-params">{ types: t }</span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">visitor</span>: {
      <span class="hljs-title class_">CallExpression</span>(path) {
        <span class="hljs-keyword">const</span> callee = path.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;callee&#x27;</span>);
        <span class="hljs-keyword">if</span> (callee.<span class="hljs-title function_">isMemberExpression</span>() &amp;&amp; t.<span class="hljs-title function_">isIdentifier</span>(callee.<span class="hljs-property">node</span>.<span class="hljs-property">object</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;console&#x27;</span> })) {
          path.<span class="hljs-title function_">remove</span>();
        }
      },
    },
  };
}
</code></pre></div>
<p>Babel 遍历 AST 时，每遇到一个函数调用节点就调用 <code>CallExpression</code>。如果调用的是 <code>console.xxx(...)</code>，就把这个节点删掉。生产构建里去掉 <code>console</code> 的插件就是这个思路。</p>
<h2>只转语法为什么还会报错</h2>
<p>假设代码里用了 <code>[1, 2].includes(2)</code>，目标是一个不支持 <code>includes</code> 的老浏览器。Babel 转换后代码原封不动，因为 <code>includes</code> 只是一次普通的方法调用，语法上没有新东西。运行时老浏览器的数组原型上找不到 <code>includes</code>，就报 <code>is not a function</code>。</p>
<p>这类问题要靠 polyfill：在代码运行前，先给 <code>Array.prototype</code> 补上一个 <code>includes</code> 实现。用 <code>preset-env</code> 配合 <code>useBuiltIns: &quot;usage&quot;</code> 和 core-js，Babel 扫描到代码里用了 <code>includes</code>，就自动在文件开头插入对应的 core-js 引入。目标浏览器怎么配、polyfill 怎么取舍，见<a href="/questions/eng-browser-targets/">《browserslist、编译目标和 polyfill 注入分别怎样配置？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Babel 和 webpack 是什么关系？</strong></p>
<blockquote>
<p>webpack 负责从入口出发找出所有模块并打包，它自己只认识 JavaScript 和 JSON。遇到需要转换的文件，就交给 <code>babel-loader</code>，由 Babel 转换完再交回 webpack 继续打包。</p>
</blockquote>
<p><strong>现在还需要 Babel 吗？</strong></p>
<blockquote>
<p>很多场景已经被更快的工具替代了，比如 Vite 开发时用 esbuild 转换，也有项目用 SWC。可是需要自定义 AST 转换时，Babel 的插件生态仍然最丰富，React Compiler 等工具也以 Babel 插件的形式提供。</p>
</blockquote>
<p><strong>polyfill 会污染全局吗？</strong></p>
<blockquote>
<p>会。普通的 core-js 引入会直接修改 <code>Array.prototype</code> 这些全局对象，应用项目里一般没问题。写给别人用的库最好不要污染全局，可以用 <code>@babel/plugin-transform-runtime</code> 配合 <code>corejs</code> 选项，把 API 调用改写成从模块里导入的实现。</p>
</blockquote>`};export{e as default};