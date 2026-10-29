var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>订单状态有“待支付、已支付、已取消”几种取值，可以写 <code>enum OrderStatus</code>，也可以写 <code>type OrderStatus = &#x27;pending&#x27; | &#x27;paid&#x27; | &#x27;cancelled&#x27;</code>。区别在于 enum 会编译出一个真实的 JavaScript 对象，联合类型编译后什么都不剩。</p>
<p>普通 enum 适合需要在运行时遍历取值或按名字取值的场景，数字枚举还会生成反向映射，能从值查到名字。<code>const enum</code> 不生成对象，而是在使用的地方直接替换成常量值，体积更小。</p>
<p>可是 <code>const enum</code> 依赖编译器读到别的文件，Babel、esbuild 这类一次只处理一个文件的工具做不到，所以 <code>isolatedModules</code> 下引用外部声明的 <code>const enum</code> 会报错。TypeScript 5.8 加的 <code>erasableSyntaxOnly</code> 更进一步，所有 enum 声明都会报错，因为它们没法通过“删掉类型”变回 JavaScript。</p>
<p>所以新项目通常用字符串字面量联合；需要运行时取值列表时，用 <code>as const</code> 对象再推出联合类型。要注意的是，字符串枚举和普通字符串不能互相赋值，接口返回的 <code>&#x27;paid&#x27;</code> 不能直接当成 <code>OrderStatus.Paid</code> 用。</p>
</blockquote>
<h2>enum 编译后变成了什么</h2>
<p>先看一段 TypeScript 和它编译出的 JavaScript。下面的输出来自 TypeScript 7.0.2（<code>--target es2020 --module esnext</code>）：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">enum</span> <span class="hljs-title class_">Status</span> { <span class="hljs-title class_">Idle</span>, <span class="hljs-title class_">Loading</span> }
<span class="hljs-keyword">export</span> <span class="hljs-keyword">enum</span> <span class="hljs-title class_">Color</span> { <span class="hljs-title class_">Red</span> = <span class="hljs-string">&#x27;RED&#x27;</span> }
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-keyword">enum</span> <span class="hljs-title class_">Dir</span> { <span class="hljs-title class_">Up</span>, <span class="hljs-title class_">Down</span> }
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Status</span>.<span class="hljs-property">Loading</span>, <span class="hljs-title class_">Status</span>[<span class="hljs-number">1</span>], <span class="hljs-title class_">Dir</span>.<span class="hljs-property">Down</span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">var</span> <span class="hljs-title class_">Status</span>;
(<span class="hljs-keyword">function</span> (<span class="hljs-params">Status</span>) {
    <span class="hljs-title class_">Status</span>[<span class="hljs-title class_">Status</span>[<span class="hljs-string">&quot;Idle&quot;</span>] = <span class="hljs-number">0</span>] = <span class="hljs-string">&quot;Idle&quot;</span>;
    <span class="hljs-title class_">Status</span>[<span class="hljs-title class_">Status</span>[<span class="hljs-string">&quot;Loading&quot;</span>] = <span class="hljs-number">1</span>] = <span class="hljs-string">&quot;Loading&quot;</span>;
})(<span class="hljs-title class_">Status</span> || (<span class="hljs-title class_">Status</span> = {}));
<span class="hljs-keyword">export</span> <span class="hljs-keyword">var</span> <span class="hljs-title class_">Color</span>;
(<span class="hljs-keyword">function</span> (<span class="hljs-params">Color</span>) {
    <span class="hljs-title class_">Color</span>[<span class="hljs-string">&quot;Red&quot;</span>] = <span class="hljs-string">&quot;RED&quot;</span>;
})(<span class="hljs-title class_">Color</span> || (<span class="hljs-title class_">Color</span> = {}));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Status</span>.<span class="hljs-property">Loading</span>, <span class="hljs-title class_">Status</span>[<span class="hljs-number">1</span>], <span class="hljs-number">1</span> <span class="hljs-comment">/* Dir.Down */</span>);
</code></pre></div>
<p>数字枚举 <code>Status</code> 这一行写法有点绕：<code>Status[&quot;Idle&quot;] = 0</code> 先存“名字到值”，这个赋值表达式的结果是 0，再拿它做键存“值到名字”。这就是官方文档说的反向映射。字符串枚举 <code>Color</code> 没有反向映射。<code>Dir</code> 是 <code>const enum</code>，整个声明消失了，<code>Dir.Down</code> 直接变成了 <code>1</code>。</p>
<p>把编译结果放进 node 运行，就能看到反向映射带来的副作用：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">var</span> <span class="hljs-title class_">Status</span>;
(<span class="hljs-keyword">function</span> (<span class="hljs-params">Status</span>) {
  <span class="hljs-title class_">Status</span>[<span class="hljs-title class_">Status</span>[<span class="hljs-string">&#x27;Idle&#x27;</span>] = <span class="hljs-number">0</span>] = <span class="hljs-string">&#x27;Idle&#x27;</span>;
  <span class="hljs-title class_">Status</span>[<span class="hljs-title class_">Status</span>[<span class="hljs-string">&#x27;Loading&#x27;</span>] = <span class="hljs-number">1</span>] = <span class="hljs-string">&#x27;Loading&#x27;</span>;
})(<span class="hljs-title class_">Status</span> || (<span class="hljs-title class_">Status</span> = {}));

<span class="hljs-keyword">var</span> <span class="hljs-title class_">Color</span>;
(<span class="hljs-keyword">function</span> (<span class="hljs-params">Color</span>) {
  <span class="hljs-title class_">Color</span>[<span class="hljs-string">&#x27;Red&#x27;</span>] = <span class="hljs-string">&#x27;RED&#x27;</span>;
})(<span class="hljs-title class_">Color</span> || (<span class="hljs-title class_">Color</span> = {}));

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Status</span>.<span class="hljs-property">Loading</span>);       <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Status</span>[<span class="hljs-number">1</span>]);            <span class="hljs-comment">// Loading</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(<span class="hljs-title class_">Status</span>));  <span class="hljs-comment">// [ &#x27;0&#x27;, &#x27;1&#x27;, &#x27;Idle&#x27;, &#x27;Loading&#x27; ]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(<span class="hljs-title class_">Color</span>));   <span class="hljs-comment">// [ &#x27;Red&#x27; ]</span>
</code></pre></div>
<p>如果想用 <code>Object.keys</code> 生成下拉选项，数字枚举会多出 <code>&#x27;0&#x27;</code>、<code>&#x27;1&#x27;</code> 两个键，要先过滤掉。字符串枚举没有这个问题。</p>
<h2>const enum 为什么会和 isolatedModules 冲突</h2>
<p><code>const enum</code> 的内联要求编译器知道成员的值。tsc 编译整个项目，能读到声明；可 Babel、esbuild、以及 TypeScript 自己的 <code>ts.transpileModule</code> 一次只看一个文件，遇到从别的文件来的 <code>Numbers.Zero</code>，并不知道它等于几，也没法内联。运行时又没有 <code>Numbers</code> 这个对象，就会报错。</p>
<p><code>isolatedModules</code> 的作用是提前把这种代码标出来。官方文档的说法是：开启后，引用环境 <code>const enum</code>（ambient const enum，基本就是 <code>.d.ts</code> 里的 <code>const enum</code>）的成员会报错。它本身不改变代码的编译输出。另外从 TSConfig 参考可以看到，开启 <code>isolatedModules</code> 时 <code>preserveConstEnums</code> 默认为 true，项目自己写的 <code>const enum</code> 会保留一份运行时对象，上面那个例子用 <code>--isolatedModules</code> 编译，<code>Dir.Down</code> 就不再内联，而是保留成 <code>Dir.Down</code>。</p>
<p>官方文档还专门写了“Const enum pitfalls”：如果你发布的库在 <code>.d.ts</code> 里带 <code>const enum</code>，下游开了 <code>isolatedModules</code> 就用不了；而且下游编译时内联的是 A 版本的值，运行时装的却可能是 B 版本，值不一致会走错分支。文档给的两种办法是干脆不用 <code>const enum</code>，或者用 <code>preserveConstEnums</code> 并在发布的 <code>.d.ts</code> 里去掉 <code>const</code>。</p>
<h2>erasableSyntaxOnly 为什么连普通 enum 也不让写</h2>
<p>Node.js 从 23.6 起默认支持直接运行 TypeScript 文件，做法是把类型语法擦掉。这要求文件里的 TypeScript 专有语法都没有运行时含义。enum 会生成对象，删掉就丢了代码，所以不支持。</p>
<p>TypeScript 5.8 为此加了 <code>erasableSyntaxOnly</code>。开启后，<code>enum</code>、带运行时代码的 <code>namespace</code>、类的参数属性、<code>import =</code>/<code>export =</code> 和 <code>&lt;number&gt;x</code> 这种尖括号断言都会报错。用上面的文件实际验证，三个 enum 声明（包括 <code>const enum</code>）都报 <code>TS1294: This syntax is not allowed when &#x27;erasableSyntaxOnly&#x27; is enabled.</code></p>
<h2>不用 enum 时怎样写</h2>
<p>官方文档“Objects vs Enums”一节的建议是：很多时候一个 <code>as const</code> 对象就够了。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> <span class="hljs-title class_">Role</span> = { <span class="hljs-title class_">Admin</span>: <span class="hljs-string">&#x27;admin&#x27;</span>, <span class="hljs-title class_">User</span>: <span class="hljs-string">&#x27;user&#x27;</span> } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">type</span> <span class="hljs-title class_">Role</span> = (<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Role</span>)[keyof <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Role</span>]; <span class="hljs-comment">// &#x27;admin&#x27; | &#x27;user&#x27;</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">can</span>(<span class="hljs-params"><span class="hljs-attr">role</span>: <span class="hljs-title class_">Role</span></span>) {}
<span class="hljs-title function_">can</span>(<span class="hljs-title class_">Role</span>.<span class="hljs-property">Admin</span>);
<span class="hljs-title function_">can</span>(<span class="hljs-string">&#x27;user&#x27;</span>); <span class="hljs-comment">// 也可以，直接写字面量</span>
</code></pre></div>
<p>对象在运行时还在，能遍历、能按名字取值；类型由对象推出来，两者不会写得不一致。只需要类型、不需要运行时列表时，直接写 <code>type Size = &#x27;sm&#x27; | &#x27;md&#x27;</code> 最简单。这两种写法都能被擦除，开着 <code>erasableSyntaxOnly</code> 也没问题。</p>
<p>还有一个差别容易被忽略：字符串枚举是“名义上”的，<code>const c: Color = &#x27;RED&#x27;</code> 会报错，必须写 <code>Color.Red</code>。接口返回的是普通字符串，用字符串枚举时就得做一次转换或断言；用字面量联合则可以直接比较。</p>
<h2>常见追问</h2>
<p><strong>现在还有必要用 enum 吗？</strong></p>
<blockquote>
<p>项目只用 tsc 编译、没有开 <code>isolatedModules</code> 和 <code>erasableSyntaxOnly</code>，用普通 enum 没有问题。但如果项目由 Vite、esbuild 或 Babel 转译，或者想用 Node.js 直接运行 <code>.ts</code>，联合类型和 <code>as const</code> 对象的限制更少。</p>
</blockquote>
<p><strong>数字枚举能接受任意数字吗？</strong></p>
<blockquote>
<p>字面量不行。用 TypeScript 7.0.2 编译时， <code>const s: Status = 5</code> 报 <code>Type &#x27;5&#x27; is not assignable to type &#x27;Status&#x27;</code>，只接受枚举里声明过的值。</p>
</blockquote>
<p><strong><code>declare enum</code> 和 <code>const enum</code> 有什么不同？</strong></p>
<blockquote>
<p><code>declare enum</code> 是环境枚举，只描述“运行时某处已经有这个对象”，不生成代码。<code>const enum</code> 则是让编译器内联它的值。两者组合成的 <code>declare const enum</code> 就是上文说的最容易出问题的环境 const enum。</p>
</blockquote>`};export{e as default};