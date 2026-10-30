var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>我们写的是 <code>&lt;p :class=&quot;cls&quot;&gt;{{ msg }}&lt;/p&gt;</code> 这样的模板，浏览器不认识它，Vue 运行时也不直接执行它。Vue 官方文档的说法是，模板会先被编译成渲染函数，也就是返回虚拟 DOM 树的函数。这一步可以在构建时提前做，也可以在浏览器里用运行时编译器即时做。</p>
<p>编译分三步，源码 <code>compiler-core</code> 的 <code>baseCompile</code> 里就是依次调用这三个函数。<code>baseParse</code> 把模板字符串解析成一棵模板 AST，记录每个元素的标签、属性、指令、文本和插值。<code>transform</code> 遍历这棵 AST，用一组转换插件处理 <code>v-if</code>、<code>v-for</code>、<code>v-on</code>、<code>v-bind</code>、<code>v-model</code> 等语法，并给每个节点生成代码生成需要的描述。<code>generate</code> 再把处理好的 AST 拼接成渲染函数的代码字符串。</p>
<p>编译期优化也是在 transform 里做的：它判断哪些节点永远不变，可以缓存；哪些节点的哪部分会变，打上 PatchFlags 这样的标记；再用 Block 收集动态节点。运行时据此跳过不会变的内容。</p>
<p>要注意，用 <code>.vue</code> 单文件组件时，模板在构建阶段就编译好了，官方默认的工具链用的是不含编译器的运行时版本；只有在浏览器里直接写模板时，才需要带编译器的完整版本，官方文档说它会让体积增加约 14kb。</p>
</blockquote>
<h2>先看编译结果</h2>
<p>用 <code>@vue/compiler-dom</code> 3.5.44 编译 <code>&lt;div&gt;&lt;h1&gt;标题&lt;/h1&gt;&lt;p :class=&quot;cls&quot;&gt;{{ msg }}&lt;/p&gt;&lt;/div&gt;</code>，选项为 <code>mode: &#x27;module&#x27;</code>、<code>prefixIdentifiers: true</code>、<code>hoistStatic: true</code>，得到：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createElementVNode <span class="hljs-keyword">as</span> _createElementVNode, toDisplayString <span class="hljs-keyword">as</span> _toDisplayString, normalizeClass <span class="hljs-keyword">as</span> _normalizeClass, openBlock <span class="hljs-keyword">as</span> _openBlock, createElementBlock <span class="hljs-keyword">as</span> _createElementBlock } <span class="hljs-keyword">from</span> <span class="hljs-string">&quot;vue&quot;</span>

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">_ctx, _cache</span>) {
  <span class="hljs-keyword">return</span> (<span class="hljs-title function_">_openBlock</span>(), <span class="hljs-title function_">_createElementBlock</span>(<span class="hljs-string">&quot;div&quot;</span>, <span class="hljs-literal">null</span>, [
    _cache[<span class="hljs-number">0</span>] || (_cache[<span class="hljs-number">0</span>] = <span class="hljs-title function_">_createElementVNode</span>(<span class="hljs-string">&quot;h1&quot;</span>, <span class="hljs-literal">null</span>, <span class="hljs-string">&quot;标题&quot;</span>, -<span class="hljs-number">1</span> <span class="hljs-comment">/* CACHED */</span>)),
    <span class="hljs-title function_">_createElementVNode</span>(<span class="hljs-string">&quot;p&quot;</span>, {
      <span class="hljs-attr">class</span>: <span class="hljs-title function_">_normalizeClass</span>(_ctx.<span class="hljs-property">cls</span>)
    }, <span class="hljs-title function_">_toDisplayString</span>(_ctx.<span class="hljs-property">msg</span>), <span class="hljs-number">3</span> <span class="hljs-comment">/* TEXT, CLASS */</span>)
  ]))
}
</code></pre></div>
<p>模板变成了一个普通的 JavaScript 函数。静态的 <code>&lt;h1&gt;</code> 被存进 <code>_cache[0]</code>，以后不再重新创建；<code>&lt;p&gt;</code> 末尾的 <code>3</code> 是 PatchFlags，表示只有文本和 class 会变；根节点用 <code>_createElementBlock</code> 创建，这就是 Block。这些都是三个阶段合作的产物，下面一个个看。</p>
<h2>parse：把字符串变成树</h2>
<p>parse 逐个字符扫描模板，认出开始标签、属性、文本、插值和结束标签，组装成一棵树。vuejs/core 里负责扫描的是 <code>tokenizer.ts</code>，文件头注明它改编自 htmlparser2。</p>
<p>用 3.5.44 的 <code>baseParse</code> 解析 <code>&lt;p v-if=&quot;ok&quot; :class=&quot;cls&quot;&gt;{{ msg }}&lt;/p&gt;</code>，根节点下的 <code>p</code> 是一个元素节点，<code>props</code> 里有两项，名字分别是 <code>if</code> 和 <code>bind</code>，子节点是一个插值节点，内容是 <code>msg</code>。这时的 AST 只是如实记录了模板写了什么，<code>v-if</code> 还只是一个属性，还没有变成条件判断，根节点的 <code>codegenNode</code> 也是 <code>undefined</code>。</p>
<h2>transform：理解语法，准备生成代码</h2>
<p>transform 才是编译器真正“理解”模板的地方。<code>getBaseTransformPreset</code> 返回的是一组节点转换插件，包括 <code>transformIf</code>、<code>transformFor</code>、<code>transformElement</code>、<code>transformText</code> 等，以及处理 <code>v-on</code>、<code>v-bind</code>、<code>v-model</code> 的指令转换插件。</p>
<p><code>traverseNode</code> 遍历时，会对每个节点依次调用这些插件。插件可以返回一个退出函数，等这个节点的所有子节点都处理完，再按相反的顺序执行退出函数。为什么要等子节点？因为像 <code>transformElement</code> 要判断一个元素是不是静态的、该打什么 PatchFlags，必须先知道它的子节点处理成了什么样。</p>
<p>同一个 <code>v-if</code> 的例子，transform 之后根节点的 <code>codegenNode</code> 变成了条件表达式类型，对应生成代码里的 <code>ok ? ... : ...</code>。transform 还会记下渲染函数需要从运行时导入哪些函数，比如 <code>toDisplayString</code>、<code>createElementBlock</code>。传了 <code>hoistStatic</code> 时，遍历完成后还会调用 <code>cacheStatic</code>，把静态节点标记出来缓存。</p>
<h2>generate：拼出代码</h2>
<p>到了 generate，需要的信息都已经在 AST 的 <code>codegenNode</code> 上了，它做的事情比较机械：先写导入语句，再写 <code>render</code> 函数，然后按节点描述递归输出 <code>_createElementVNode(...)</code>、三元表达式、数组等代码，最后返回代码字符串。</p>
<p>下面用一个只支持“元素里放文本和插值”的玩具编译器把三步串起来。它和 Vue 的真实实现差得很远，只用来看每一步的输入和输出：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params">template</span>) {
  <span class="hljs-keyword">const</span> match = template.<span class="hljs-title function_">match</span>(<span class="hljs-regexp">/^&lt;(\\w+)&gt;(.*)&lt;\\/\\1&gt;$/</span>);
  <span class="hljs-keyword">const</span> children = match[<span class="hljs-number">2</span>].<span class="hljs-title function_">split</span>(<span class="hljs-regexp">/(\\{\\{.*?\\}\\})/</span>).<span class="hljs-title function_">filter</span>(<span class="hljs-title class_">Boolean</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">part</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> exp = part.<span class="hljs-title function_">match</span>(<span class="hljs-regexp">/^\\{\\{\\s*(.+?)\\s*\\}\\}$/</span>);
    <span class="hljs-keyword">return</span> exp ? { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;INTERPOLATION&#x27;</span>, <span class="hljs-attr">content</span>: exp[<span class="hljs-number">1</span>] } : { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;TEXT&#x27;</span>, <span class="hljs-attr">content</span>: part };
  });
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ELEMENT&#x27;</span>, <span class="hljs-attr">tag</span>: match[<span class="hljs-number">1</span>], children };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">transform</span>(<span class="hljs-params">ast</span>) {
  <span class="hljs-comment">// 补上生成代码需要的信息：用到哪些运行时函数、节点有没有动态内容</span>
  <span class="hljs-keyword">const</span> helpers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;createElementVNode&#x27;</span>]);
  <span class="hljs-keyword">const</span> dynamic = ast.<span class="hljs-property">children</span>.<span class="hljs-title function_">some</span>(<span class="hljs-function">(<span class="hljs-params">child</span>) =&gt;</span> child.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;INTERPOLATION&#x27;</span>);
  <span class="hljs-keyword">if</span> (dynamic) helpers.<span class="hljs-title function_">add</span>(<span class="hljs-string">&#x27;toDisplayString&#x27;</span>);
  ast.<span class="hljs-property">codegen</span> = {
    <span class="hljs-attr">helpers</span>: [...helpers],
    <span class="hljs-attr">patchFlag</span>: dynamic ? <span class="hljs-string">&#x27;1 /* TEXT */&#x27;</span> : <span class="hljs-literal">null</span>,
    <span class="hljs-attr">children</span>: ast.<span class="hljs-property">children</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">child</span>) =&gt;</span>
      child.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;TEXT&#x27;</span> ? <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(child.<span class="hljs-property">content</span>) : <span class="hljs-string">\`toDisplayString(_ctx.<span class="hljs-subst">\${child.content}</span>)\`</span>,
    ),
  };
  <span class="hljs-keyword">return</span> ast;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">generate</span>(<span class="hljs-params">ast</span>) {
  <span class="hljs-keyword">const</span> { helpers, patchFlag, children } = ast.<span class="hljs-property">codegen</span>;
  <span class="hljs-keyword">const</span> args = [<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(ast.<span class="hljs-property">tag</span>), <span class="hljs-string">&#x27;null&#x27;</span>, children.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; + &#x27;</span>)];
  <span class="hljs-keyword">if</span> (patchFlag) args.<span class="hljs-title function_">push</span>(patchFlag);
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`import { <span class="hljs-subst">\${helpers.join(<span class="hljs-string">&#x27;, &#x27;</span>)}</span> } from &quot;vue&quot;\\n\`</span> +
    <span class="hljs-string">\`export function render(_ctx) {\\n  return createElementVNode(<span class="hljs-subst">\${args.join(<span class="hljs-string">&#x27;, &#x27;</span>)}</span>)\\n}\`</span>;
}

<span class="hljs-keyword">const</span> ast = <span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;&lt;p&gt;你好，{{ name }}&lt;/p&gt;&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(ast.<span class="hljs-property">children</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">child</span>) =&gt;</span> child.<span class="hljs-property">type</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">generate</span>(<span class="hljs-title function_">transform</span>(ast)));
</code></pre></div>
<p>用 Node.js 22 运行，输出是：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">TEXT,INTERPOLATION
import { createElementVNode, toDisplayString } from &quot;vue&quot;
export function render(_ctx) {
  return createElementVNode(&quot;p&quot;, null, &quot;你好，&quot; + toDisplayString(_ctx.name), 1 /* TEXT */)
}
</code></pre></div>
<p>parse 只认出了两个子节点，一个文本、一个插值。transform 判断出有动态内容，于是记下要导入 <code>toDisplayString</code>，并给节点打上 <code>TEXT</code> 标记。generate 照着这些信息把代码拼出来。</p>
<h2>编译发生在什么时候</h2>
<p>Vue 官方文档说明，编译可以在构建时提前完成，也可以在运行时用编译器即时完成。用 Vite 加 <code>@vitejs/plugin-vue</code> 写单文件组件时，模板在构建阶段就被编译成了渲染函数，浏览器拿到的已经是 JavaScript，不需要再带编译器。</p>
<p>如果不用构建步骤，直接在 HTML 里写模板，或者用内联的 JavaScript 字符串写模板，就要在浏览器里编译。官方文档说明，文件名以 <code>vue.runtime.*</code> 开头的是运行时版本，不含编译器；不带 <code>.runtime</code> 的是完整版本，含编译器，体积大约多 14kb。</p>
<h2>常见追问</h2>
<p><strong>为什么 Vue 要先编译，不直接写渲染函数？</strong></p>
<blockquote>
<p>也可以直接写渲染函数或 JSX。可是官方文档指出，模板的语法更确定，编译器容易做静态分析，所以能做很多编译期优化，这是 Vue 的虚拟 DOM 比纯运行时方案省事的原因。具体的优化见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
</blockquote>
<p><strong>编译出来的渲染函数什么时候执行？</strong></p>
<blockquote>
<p>组件挂载时，运行时调用渲染函数得到虚拟 DOM 树并创建真实 DOM，这个过程放在一个响应式 effect 里，会追踪用到的数据。数据变了就重新执行渲染函数，得到新的虚拟 DOM 再和旧的比较，见<a href="/questions/vue3-diff/">《Vue 3 的快速 diff 是怎样用最长递增子序列减少移动的？》</a>。</p>
</blockquote>`};export{e as default};