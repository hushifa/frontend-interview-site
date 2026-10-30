var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>代码 <code>const total = price * count</code> 对工具来说只是一串字符，没法直接判断“这里声明了一个变量，值是一个乘法”。所以工具先把代码解析成一棵树，根节点是变量声明，下面挂着变量名 <code>total</code> 和乘法表达式，乘法下面再挂着 <code>price</code> 和 <code>count</code>。这棵树就是 AST，抽象语法树。</p>
<p>有了树，工具就能按节点类型精确地找代码、改代码，而不用拿正则去匹配字符串。字符串匹配分不清 <code>count</code> 是变量、是属性名还是写在注释里的字，AST 上每个节点都有明确的类型。</p>
<p>前端很多工具都建立在 AST 上。Babel 先把代码解析成 AST，由插件遍历并改写节点，再生成新代码，把新语法转成旧语法就是这样做的。ESLint 遍历 AST，在特定节点上检查写法并报告问题。Prettier 把代码解析成 AST 后丢掉原来的格式，按自己的规则重新打印。jscodeshift 这类 codemod 工具用来批量升级 API。</p>
<p>要注意，不同工具的 AST 格式不完全一样。ESLint 用的是 ESTree 格式，Babel 的 AST 基于 ESTree 但有自己的差异，写插件时要以对应工具的文档为准。另外 AST 一般不保留空格和格式，所以改写后的代码格式可能变化。</p>
</blockquote>
<h2>AST 长什么样</h2>
<p><code>const total = price * count;</code> 解析成 ESTree 格式的 AST，大致是下面这样（省略了位置信息）。可以把代码贴到 AST Explorer（astexplorer.net）上，选不同的解析器看完整的树。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">{
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;VariableDeclaration&#x27;</span>,
  <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;const&#x27;</span>,
  <span class="hljs-attr">declarations</span>: [
    {
      <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;VariableDeclarator&#x27;</span>,
      <span class="hljs-attr">id</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;Identifier&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;total&#x27;</span> },
      <span class="hljs-attr">init</span>: {
        <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;BinaryExpression&#x27;</span>,
        <span class="hljs-attr">operator</span>: <span class="hljs-string">&#x27;*&#x27;</span>,
        <span class="hljs-attr">left</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;Identifier&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;price&#x27;</span> },
        <span class="hljs-attr">right</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;Identifier&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;count&#x27;</span> },
      },
    },
  ],
}
</code></pre></div>
<p>每个节点都有一个 <code>type</code>，说明它是什么语法结构。<code>Identifier</code> 是标识符，也就是变量名；<code>BinaryExpression</code> 是二元运算，<code>left</code> 和 <code>right</code> 是运算的两边。</p>
<h2>工具是怎样遍历和改写 AST 的</h2>
<p>Babel 和 ESLint 都用“访问者”的方式处理 AST：你提供一个对象，键是节点类型，值是函数；工具从根节点开始深度优先地走遍整棵树，每遇到一种类型的节点，就调用对应的函数。下面手写一个简化版，先像 ESLint 那样只读，再像 Babel 那样改写，最后把树拼回代码。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// const total = price * count; 简化后的 AST（字段名参照 ESTree）</span>
<span class="hljs-keyword">const</span> ast = {
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;VariableDeclaration&#x27;</span>,
  <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;const&#x27;</span>,
  <span class="hljs-attr">declarations</span>: [
    {
      <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;VariableDeclarator&#x27;</span>,
      <span class="hljs-attr">id</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;Identifier&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;total&#x27;</span> },
      <span class="hljs-attr">init</span>: {
        <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;BinaryExpression&#x27;</span>,
        <span class="hljs-attr">operator</span>: <span class="hljs-string">&#x27;*&#x27;</span>,
        <span class="hljs-attr">left</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;Identifier&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;price&#x27;</span> },
        <span class="hljs-attr">right</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;Identifier&#x27;</span>, <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;count&#x27;</span> },
      },
    },
  ],
};

<span class="hljs-comment">// 深度优先遍历：遇到哪种类型的节点，就调用 visitor 上同名的函数</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">traverse</span>(<span class="hljs-params">node, visitor</span>) {
  <span class="hljs-keyword">if</span> (!node || <span class="hljs-keyword">typeof</span> node.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">return</span>;
  visitor[node.<span class="hljs-property">type</span>]?.(node);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> value <span class="hljs-keyword">of</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">values</span>(node)) {
    <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value)) value.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">child</span>) =&gt;</span> <span class="hljs-title function_">traverse</span>(child, visitor));
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (value &amp;&amp; <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;object&#x27;</span>) <span class="hljs-title function_">traverse</span>(value, visitor);
  }
}

<span class="hljs-comment">// 把 AST 重新拼回代码</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">generate</span>(<span class="hljs-params">node</span>) {
  <span class="hljs-keyword">switch</span> (node.<span class="hljs-property">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;VariableDeclaration&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${node.kind}</span> <span class="hljs-subst">\${node.declarations.map(generate).join(<span class="hljs-string">&#x27;, &#x27;</span>)}</span>;\`</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;VariableDeclarator&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${generate(node.id)}</span> = <span class="hljs-subst">\${generate(node.init)}</span>\`</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;BinaryExpression&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${generate(node.left)}</span> <span class="hljs-subst">\${node.operator}</span> <span class="hljs-subst">\${generate(node.right)}</span>\`</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;Identifier&#x27;</span>:
      <span class="hljs-keyword">return</span> node.<span class="hljs-property">name</span>;
  }
}

<span class="hljs-comment">// 像 ESLint 规则一样只读不改：收集用到的变量名</span>
<span class="hljs-keyword">const</span> names = [];
<span class="hljs-title function_">traverse</span>(ast, { <span class="hljs-title class_">Identifier</span>: <span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> names.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">name</span>) });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(names.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// total,price,count</span>

<span class="hljs-comment">// 像 Babel 插件一样改写节点：把 const 换成 var，把 count 改名为 quantity</span>
<span class="hljs-title function_">traverse</span>(ast, {
  <span class="hljs-title class_">VariableDeclaration</span>: <span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> { node.<span class="hljs-property">kind</span> = <span class="hljs-string">&#x27;var&#x27;</span>; },
  <span class="hljs-title class_">Identifier</span>: <span class="hljs-function">(<span class="hljs-params">node</span>) =&gt;</span> { <span class="hljs-keyword">if</span> (node.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;count&#x27;</span>) node.<span class="hljs-property">name</span> = <span class="hljs-string">&#x27;quantity&#x27;</span>; },
});
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">generate</span>(ast)); <span class="hljs-comment">// var total = price * quantity;</span>
</code></pre></div>
<p>第一次遍历只读节点，按深度优先的顺序依次碰到 <code>total</code>、<code>price</code>、<code>count</code>。第二次遍历直接修改节点的属性，生成出来的代码就变了。</p>
<p>真实的工具比这复杂得多。Babel 传给访问函数的不是节点本身，而是 <code>path</code>，它记录了节点的父节点、所在位置，还提供替换、删除节点的方法；作用域分析也靠它，所以改名时能区分同名的不同变量。可是“解析成树 → 按类型访问节点 → 生成代码”这个流程是一样的。</p>
<h2>Babel 怎样用 AST</h2>
<p>Babel 的处理分三步：解析（parse）、转换（transform）、生成（generate）。<code>@babel/parser</code> 把源码解析成 AST，插件在转换阶段改写节点，<code>@babel/generator</code> 再把 AST 输出成代码和 Source Map。</p>
<p>一个 Babel 插件就是返回 <code>visitor</code> 对象的函数，结构和上面的例子很像：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 把所有 == 换成 ===</span>
<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">visitor</span>: {
      <span class="hljs-title class_">BinaryExpression</span>(path) {
        <span class="hljs-keyword">if</span> (path.<span class="hljs-property">node</span>.<span class="hljs-property">operator</span> === <span class="hljs-string">&#x27;==&#x27;</span>) path.<span class="hljs-property">node</span>.<span class="hljs-property">operator</span> = <span class="hljs-string">&#x27;===&#x27;</span>;
      },
    },
  };
};
</code></pre></div>
<p>把箭头函数转成普通函数、把可选链展开成条件判断，原理都是找到对应节点，换成旧语法的节点。语法转换和 polyfill 的区别见<a href="/questions/eng-babel/">《Babel 是怎样把新语法转成旧语法的？语法转换和 polyfill 有什么区别？》</a>。</p>
<h2>ESLint 怎样用 AST</h2>
<p>ESLint 默认用 Espree 解析代码，得到 ESTree 格式的 AST。一条规则是一个对象，<code>meta</code> 描述规则信息，<code>create(context)</code> 返回访问者对象，在节点上发现问题时调用 <code>context.report()</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 禁止使用 alert()</span>
<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = {
  <span class="hljs-attr">meta</span>: {
    <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;suggestion&#x27;</span>,
    <span class="hljs-attr">messages</span>: { <span class="hljs-attr">noAlert</span>: <span class="hljs-string">&#x27;不要使用 alert，请改用页面内提示&#x27;</span> },
  },
  <span class="hljs-title function_">create</span>(<span class="hljs-params">context</span>) {
    <span class="hljs-keyword">return</span> {
      <span class="hljs-title class_">CallExpression</span>(node) {
        <span class="hljs-keyword">if</span> (node.<span class="hljs-property">callee</span>.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;Identifier&#x27;</span> &amp;&amp; node.<span class="hljs-property">callee</span>.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;alert&#x27;</span>) {
          context.<span class="hljs-title function_">report</span>({ node, <span class="hljs-attr">messageId</span>: <span class="hljs-string">&#x27;noAlert&#x27;</span> });
        }
      },
    };
  },
};
</code></pre></div>
<p>为什么不用正则搜 <code>alert(</code>？因为正则会把字符串 <code>&#x27;alert(&#x27;</code> 和注释里的字也当成调用，而 <code>obj.alert()</code> 的 <code>callee</code> 是 <code>MemberExpression</code>，按节点类型判断就不会误报。</p>
<p>和 Babel 不同，ESLint 规则一般只读不改。规则提供了 <code>fixer</code> 时，自动修复是按位置替换源码文本，而不是改 AST。</p>
<h2>其他用到 AST 的地方</h2>
<p>Prettier 把代码解析成 AST 后丢掉原有的格式，再按行宽等规则重新打印，所以它只改格式，不改代码的意思。</p>
<p>codemod 是批量改代码的脚本。比如一个库把 <code>oldApi()</code> 改名为 <code>newApi()</code>，项目里有几百处调用，可以用 jscodeshift 写一个转换脚本，按 AST 找到调用并替换，比手工改或全局替换文本更可靠。</p>
<p>此外，打包工具分析 <code>import</code> 和 <code>export</code> 做依赖图与 tree shaking、Vue 把模板编译成渲染函数、TypeScript 去掉类型注解，背后也都要先把代码解析成语法树。</p>
<h2>常见追问</h2>
<p><strong>为什么 ESLint 和 Babel 不能共用同一份 AST？</strong></p>
<blockquote>
<p>两者的 AST 格式有差异。ESLint 规则按 ESTree 格式写，Babel 的 AST 在一些节点上和 ESTree 不同，比如字面量节点的划分。所以要让 ESLint 读懂 Babel 才支持的语法，要用 <code>@babel/eslint-parser</code>，由它把 Babel 的 AST 转成 ESLint 能用的格式。</p>
</blockquote>
<p><strong>改写 AST 以后，代码格式会不会乱？</strong></p>
<blockquote>
<p>可能会。AST 通常不保存空格、换行这类信息，生成代码时由生成器决定格式。Babel 的产物一般给机器运行，格式不重要；codemod 修改的是要提交的源码，jscodeshift 底层用的 recast 会尽量保留没改动部分的原始格式，改完后通常再跑一次 Prettier。</p>
</blockquote>`};export{e as default};