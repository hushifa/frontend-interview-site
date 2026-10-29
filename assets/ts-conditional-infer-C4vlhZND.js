var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>条件类型可以理解成类型版的三元表达式：<code>T extends U ? X : Y</code>，T 能赋值给 U 就得到 X，否则得到 Y。这里的 <code>extends</code> 意思是“能不能赋值过去”，跟类的继承没关系。</p>
<p><code>infer</code> 是在匹配的时候顺便声明一个待推断的类型变量。比如 <code>T extends Promise&lt;infer V&gt; ? V : T</code>，匹配成功时 V 就是 Promise 里面包着的类型。内置的 <code>ReturnType</code>、<code>Parameters</code>、<code>Awaited</code> 都是这么写出来的。</p>
<p>如果条件左边直接是类型参数 <code>T</code>，传进来 <code>A | B</code> 这样的联合，它会把 A 和 B 分开各算一遍，再把结果合起来，这叫分布式条件类型。<code>Exclude</code>、<code>Extract</code>、<code>NonNullable</code> 就是靠这个特性实现的。</p>
<p>要注意两点。不想分开算，就把两边包成元组，写 <code>[T] extends [U]</code>。另外 <code>never</code> 会被当成空的联合，分布式计算的结果还是 <code>never</code>，所以判断是不是 <code>never</code> 要写 <code>[T] extends [never]</code>。</p>
</blockquote>
<h2>条件类型怎么读</h2>
<p>先看最基本的写法。下面的 <code>MessageOf</code> 判断传进来的类型有没有 <code>message</code> 属性，有就把它的类型取出来。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MessageOf</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">message</span>: <span class="hljs-built_in">unknown</span> } ? T[<span class="hljs-string">&#x27;message&#x27;</span>] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> A = <span class="hljs-title class_">MessageOf</span>&lt;{ <span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span> }&gt;; <span class="hljs-comment">// string</span>
<span class="hljs-keyword">type</span> B = <span class="hljs-title class_">MessageOf</span>&lt;{ <span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span> }&gt;;      <span class="hljs-comment">// never</span>
</code></pre></div>
<p><code>{ message: string }</code> 能赋值给 <code>{ message: unknown }</code>，所以走问号后面的分支，得到 <code>string</code>。<code>{ id: number }</code> 没有 <code>message</code>，赋值不过去，走冒号后面的分支，得到 <code>never</code>。读条件类型时，把 <code>extends</code> 换成“能不能赋值给”去念，就不容易和继承搞混。</p>
<h2>infer 怎样把一部分类型抠出来</h2>
<p>很多时候我们不只想知道“是不是数组”，还想知道“数组里装的是什么”。<code>infer</code> 就是干这个的：在要匹配的结构里留一个空位，起个名字，匹配成功后这个名字就代表填进空位的类型。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ElementOf</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-title function_">readonly</span> (infer <span class="hljs-title class_">Item</span>)[] ? <span class="hljs-title class_">Item</span> : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> C = <span class="hljs-title class_">ElementOf</span>&lt;<span class="hljs-built_in">number</span>[]&gt;;              <span class="hljs-comment">// number</span>
<span class="hljs-keyword">type</span> D = <span class="hljs-title class_">ElementOf</span>&lt;<span class="hljs-keyword">readonly</span> [<span class="hljs-string">&#x27;ok&#x27;</span>, <span class="hljs-number">1</span>]&gt;;    <span class="hljs-comment">// &#x27;ok&#x27; | 1</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyReturnType</span>&lt;T&gt; = T <span class="hljs-title function_">extends</span> (...<span class="hljs-attr">args</span>: <span class="hljs-built_in">any</span>[]) =&gt; infer R ? R : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> E = <span class="hljs-title class_">MyReturnType</span>&lt;<span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span></span>) =&gt;</span> <span class="hljs-built_in">string</span>&gt;; <span class="hljs-comment">// string</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">UnwrapPromise</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-title class_">Promise</span>&lt;infer V&gt; ? <span class="hljs-title class_">UnwrapPromise</span>&lt;V&gt; : T;
<span class="hljs-keyword">type</span> F = <span class="hljs-title class_">UnwrapPromise</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">number</span>&gt;&gt;&gt;; <span class="hljs-comment">// number</span>
</code></pre></div>
<p><code>ElementOf</code> 在数组元素的位置放了 <code>infer Item</code>，所以 <code>number[]</code> 匹配后 Item 就是 <code>number</code>。<code>MyReturnType</code> 把空位放在返回值上，取出的就是返回类型，这基本就是内置 <code>ReturnType</code> 的写法。<code>UnwrapPromise</code> 还调用了自己，一层层剥开嵌套的 Promise，直到不再是 Promise 为止。</p>
<p><code>infer</code> 后面还能加约束，比如 <code>T extends [infer H extends string, ...unknown[]] ? H : never</code>，只有第一个元素是字符串时才匹配。另外，对有重载的函数用 <code>ReturnType</code>，取到的是最后一个重载签名的返回类型。</p>
<h2>传入联合类型时为什么会“分开算”</h2>
<p>看下面两个几乎一样的类型，只差在 <code>T</code> 外面有没有包一层方括号，结果却不一样。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ToArray</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span> ? T[] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> G = <span class="hljs-title class_">ToArray</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>&gt;; <span class="hljs-comment">// string[] | number[]</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">ToArrayTogether</span>&lt;T&gt; = [T] <span class="hljs-keyword">extends</span> [<span class="hljs-built_in">unknown</span>] ? T[] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> H = <span class="hljs-title class_">ToArrayTogether</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>&gt;; <span class="hljs-comment">// (string | number)[]</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyExclude</span>&lt;T, U&gt; = T <span class="hljs-keyword">extends</span> U ? <span class="hljs-built_in">never</span> : T;
<span class="hljs-keyword">type</span> I = <span class="hljs-title class_">MyExclude</span>&lt;<span class="hljs-string">&#x27;a&#x27;</span> | <span class="hljs-string">&#x27;b&#x27;</span> | <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-string">&#x27;a&#x27;</span>&gt;; <span class="hljs-comment">// &#x27;b&#x27; | &#x27;c&#x27;</span>
</code></pre></div>
<p><code>ToArray</code> 的条件左边直接是 <code>T</code>，TypeScript 会把 <code>string | number</code> 拆开，分别算出 <code>string[]</code> 和 <code>number[]</code>，再合成联合，这就是分布式条件类型。<code>ToArrayTogether</code> 把 <code>T</code> 包进了元组，左边不再是“光秃秃的类型参数”，所以联合被当成一个整体，得到的是 <code>(string | number)[]</code>。</p>
<p><code>MyExclude</code> 正好利用了分开算：<code>&#x27;a&#x27;</code> 能赋给 <code>&#x27;a&#x27;</code>，结果是 <code>never</code>；<code>&#x27;b&#x27;</code>、<code>&#x27;c&#x27;</code> 赋不过去，保留下来。联合里的 <code>never</code> 会自动消失，最后剩下 <code>&#x27;b&#x27; | &#x27;c&#x27;</code>。</p>
<p>记住触发条件：只有条件左边直接是被传入的类型参数时才会分布，写成 <code>T[] extends ...</code> 或 <code>[T] extends ...</code> 都不会。</p>
<h2>为什么判断 never 要包一层</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">IsNeverWrong</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">never</span> ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">IsNever</span>&lt;T&gt; = [T] <span class="hljs-keyword">extends</span> [<span class="hljs-built_in">never</span>] ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> J = <span class="hljs-title class_">IsNeverWrong</span>&lt;<span class="hljs-built_in">never</span>&gt;; <span class="hljs-comment">// never</span>
<span class="hljs-keyword">type</span> K = <span class="hljs-title class_">IsNever</span>&lt;<span class="hljs-built_in">never</span>&gt;;      <span class="hljs-comment">// true</span>
</code></pre></div>
<p>按直觉，<code>IsNeverWrong&lt;never&gt;</code> 应该是 <code>true</code>，结果却是 <code>never</code>。原因是 <code>never</code> 在分布式计算里被当作一个成员都没有的联合，没有成员可算，结果就是空的，也就是 <code>never</code>。包成 <code>[T]</code> 关掉分布以后，<code>[never]</code> 能赋给 <code>[never]</code>，才得到 <code>true</code>。</p>
<p><code>any</code> 也有特殊行为：它作为被检查的类型时，两个分支都会取，<code>any extends string ? 1 : 2</code> 得到 <code>1 | 2</code>。</p>
<h2>什么时候不该写复杂的条件类型</h2>
<p>递归条件类型能处理嵌套结构，比如写一个深层的 <code>Readonly</code>。可是它会拖慢类型检查，报错信息也很难读。内置工具类型够用时优先用内置的；业务代码里，一个简单的重载或联合类型往往比一段类型体操更好维护。</p>
<h2>常见追问</h2>
<p><strong>怎样把联合类型转成交叉类型？</strong></p>
<blockquote>
<p>利用函数参数位置的推断。先把每个成员变成以它为参数的函数，再从这些函数的参数位置推断，结果就是交叉：<code>(U extends any ? (x: U) =&gt; void : never) extends (x: infer I) =&gt; void ? I : never</code>。这是因为参数位置是逆变的，多个候选会被合成交叉而不是联合。</p>
</blockquote>
<p><strong>模板字面量类型里能用 infer 吗？</strong></p>
<blockquote>
<p>能。比如 <code>T extends \`\${infer Head}/\${infer Rest}\` ? Head : T</code>，可以把 <code>&#x27;a/b/c&#x27;</code> 这样的路径拆出第一段 <code>&#x27;a&#x27;</code>，配合递归就能把整条路径拆开。</p>
</blockquote>`};export{e as default};