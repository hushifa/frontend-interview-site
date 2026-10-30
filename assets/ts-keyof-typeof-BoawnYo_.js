var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如有一个配置对象 <code>config = { port: 3000, host: &#x27;localhost&#x27; }</code>，想写一个函数只接受它的键名。<code>typeof config</code> 能从这个变量拿到它的类型，<code>keyof</code> 再把类型的所有键取出来，<code>keyof typeof config</code> 就是 <code>&#x27;port&#x27; | &#x27;host&#x27;</code>。</p>
<p>三个工具各管一件事。<code>keyof T</code> 得到 <code>T</code> 所有键组成的联合类型。类型位置上的 <code>typeof x</code> 得到变量 <code>x</code> 的类型，它和 JavaScript 里运行时的 <code>typeof</code> 不是一回事，而且只能用在变量名或它的属性上。索引访问类型 <code>T[K]</code> 按键查属性的类型，比如 <code>Person[&#x27;age&#x27;]</code> 是 <code>number</code>；<code>K</code> 可以是联合类型，<code>T[number]</code> 还能取出数组元素的类型。</p>
<p>组合起来最常见的用途是“从值推出类型”，让值和类型只维护一份。比如 <code>const roles = [&#x27;admin&#x27;, &#x27;editor&#x27;] as const</code>，再写 <code>type Role = (typeof roles)[number]</code>，就得到 <code>&#x27;admin&#x27; | &#x27;editor&#x27;</code>。泛型里写 <code>K extends keyof T</code>，返回 <code>T[K]</code>，就能做到传错键名报错、返回值类型跟着键走。</p>
<p>索引签名 <code>[key: string]: number</code> 用来描述键名事先不知道的字典。要注意两点：一是有了字符串索引签名后，所有具名属性的类型都必须符合它；二是读一个不存在的键时，默认类型仍然是 <code>number</code>，不会提醒可能是 <code>undefined</code>，要开启 <code>noUncheckedIndexedAccess</code> 才会。</p>
</blockquote>
<h2>keyof 和 typeof 组合</h2>
<p>下面的代码都用 <code>tsc --strict</code> 验证过（TypeScript 7.0.2）。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Point</span> = { <span class="hljs-attr">x</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">y</span>: <span class="hljs-built_in">number</span> };
<span class="hljs-keyword">type</span> P = keyof <span class="hljs-title class_">Point</span>; <span class="hljs-comment">// &#x27;x&#x27; | &#x27;y&#x27;</span>

<span class="hljs-keyword">const</span> config = { <span class="hljs-attr">port</span>: <span class="hljs-number">3000</span>, <span class="hljs-attr">host</span>: <span class="hljs-string">&#x27;localhost&#x27;</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Config</span> = <span class="hljs-keyword">typeof</span> config; <span class="hljs-comment">// { port: number; host: string }</span>
<span class="hljs-keyword">type</span> <span class="hljs-title class_">ConfigKey</span> = keyof <span class="hljs-keyword">typeof</span> config; <span class="hljs-comment">// &#x27;port&#x27; | &#x27;host&#x27;</span>

<span class="hljs-keyword">function</span> getValue&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt;(<span class="hljs-attr">obj</span>: T, <span class="hljs-attr">key</span>: K): T[K] {
  <span class="hljs-keyword">return</span> obj[key];
}
<span class="hljs-keyword">const</span> port = <span class="hljs-title function_">getValue</span>(config, <span class="hljs-string">&#x27;port&#x27;</span>);
port.<span class="hljs-title function_">toFixed</span>();
<span class="hljs-comment">// @ts-expect-error &#x27;prot&#x27; 不是 config 的键</span>
<span class="hljs-title function_">getValue</span>(config, <span class="hljs-string">&#x27;prot&#x27;</span>);
</code></pre></div>
<p>为什么不能直接写 <code>keyof config</code>？因为 <code>keyof</code> 只接受类型，<code>config</code> 是一个值。要先用 <code>typeof</code> 把值变成类型，再交给 <code>keyof</code>。</p>
<p><code>getValue</code> 的返回值为什么是 <code>number</code>？调用时 <code>K</code> 被推断成 <code>&#x27;port&#x27;</code>，返回类型 <code>T[K]</code> 就是 <code>config</code> 类型里 <code>port</code> 的类型。换成 <code>&#x27;host&#x27;</code>，返回的就是 <code>string</code>。这样写，键名和返回值类型都由编译器检查。</p>
<p>类型位置的 <code>typeof</code> 有个限制：Handbook 说明它只能用在标识符（变量名）或它们的属性上。<code>typeof getValue(config, &#x27;port&#x27;)</code> 这种对函数调用结果取类型的写法会报语法错误，要拿返回值类型可以用 <code>ReturnType&lt;typeof getValue&gt;</code>。</p>
<h2>索引访问类型</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Person</span> = { <span class="hljs-attr">age</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">alive</span>: <span class="hljs-built_in">boolean</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Age</span> = <span class="hljs-title class_">Person</span>[<span class="hljs-string">&#x27;age&#x27;</span>]; <span class="hljs-comment">// number</span>
<span class="hljs-keyword">type</span> <span class="hljs-title class_">NameOrAge</span> = <span class="hljs-title class_">Person</span>[<span class="hljs-string">&#x27;age&#x27;</span> | <span class="hljs-string">&#x27;name&#x27;</span>]; <span class="hljs-comment">// number | string</span>
<span class="hljs-keyword">type</span> <span class="hljs-title class_">AnyValue</span> = <span class="hljs-title class_">Person</span>[keyof <span class="hljs-title class_">Person</span>]; <span class="hljs-comment">// number | string | boolean</span>

<span class="hljs-keyword">const</span> roles = [<span class="hljs-string">&#x27;admin&#x27;</span>, <span class="hljs-string">&#x27;editor&#x27;</span>, <span class="hljs-string">&#x27;viewer&#x27;</span>] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Role</span> = (<span class="hljs-keyword">typeof</span> roles)[<span class="hljs-built_in">number</span>]; <span class="hljs-comment">// &#x27;admin&#x27; | &#x27;editor&#x27; | &#x27;viewer&#x27;</span>
</code></pre></div>
<p><code>Person[keyof Person]</code> 是常见写法，表示“所有属性值类型的联合”。数组用 <code>number</code> 去索引，是因为数组的下标是数字，所以 <code>T[number]</code> 就是元素类型。<code>roles</code> 加了 <code>as const</code> 才会得到字面量联合，否则元素会被推断成 <code>string</code>，<code>as const</code> 的细节见<a href="/questions/ts-satisfies-const/">《as const、类型注解和 satisfies 有什么不同？》</a>。</p>
<p>方括号里只能写类型。Handbook 举过例子，<code>const key = &#x27;age&#x27;</code> 之后写 <code>Person[key]</code> 会报错，因为 <code>key</code> 是值；改成 <code>type key = &#x27;age&#x27;</code> 就可以。</p>
<h2>索引签名描述字典</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Mapish</span> = { [<span class="hljs-attr">k</span>: <span class="hljs-built_in">string</span>]: <span class="hljs-built_in">boolean</span> };
<span class="hljs-keyword">type</span> M = keyof <span class="hljs-title class_">Mapish</span>; <span class="hljs-comment">// string | number</span>

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Dictionary</span> {
  [<span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>]: <span class="hljs-built_in">number</span>;
  <span class="hljs-attr">length</span>: <span class="hljs-built_in">number</span>;
}
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Bad</span> {
  [<span class="hljs-attr">key</span>: <span class="hljs-built_in">string</span>]: <span class="hljs-built_in">number</span>;
  <span class="hljs-comment">// @ts-expect-error 2411：name 的类型必须符合索引签名</span>
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">scores</span>: <span class="hljs-title class_">Record</span>&lt;<span class="hljs-built_in">string</span>, <span class="hljs-built_in">number</span>&gt; = { <span class="hljs-attr">ada</span>: <span class="hljs-number">90</span> };
<span class="hljs-keyword">const</span> s = scores.<span class="hljs-property">bob</span>; <span class="hljs-comment">// 默认是 number，开启 noUncheckedIndexedAccess 后是 number | undefined</span>
</code></pre></div>
<p><code>keyof Mapish</code> 为什么是 <code>string | number</code>？Handbook 的解释是，JavaScript 对象的键总会被转成字符串，<code>obj[0]</code> 和 <code>obj[&#x27;0&#x27;]</code> 是同一个属性，所以字符串索引签名也接受数字键。</p>
<p><code>Bad</code> 为什么报错？字符串索引签名表示任何字符串键读出来都是 <code>number</code>，<code>obj.name</code> 也等于 <code>obj[&#x27;name&#x27;]</code>，所以 <code>name</code> 不能是 <code>string</code>。如果确实要混合，可以把签名写成 <code>number | string</code>。</p>
<p><code>scores.bob</code> 根本不存在，类型却是 <code>number</code>，直接调用 <code>s.toFixed()</code> 能编译通过，运行时会报错。开启 <code>noUncheckedIndexedAccess</code> 后，同样的代码会提示 <code>&#x27;s&#x27; is possibly &#x27;undefined&#x27;</code>。这个选项的取舍见<a href="/questions/ts-tsconfig/">《strict、noUncheckedIndexedAccess 和 target 如何配置？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>Record&lt;string, number&gt;</code> 和 <code>{ [key: string]: number }</code> 有区别吗？</strong></p>
<blockquote>
<p>用字符串作键时效果一样，<code>Record&lt;K, V&gt;</code> 是内置的工具类型。区别在于 <code>Record</code> 的键可以是有限的联合，比如 <code>Record&lt;&#x27;a&#x27; | &#x27;b&#x27;, number&gt;</code> 要求两个键都必须有；索引签名的键只能是 <code>string</code>、<code>number</code>、<code>symbol</code>、模板字符串模式或它们组成的联合。映射类型见<a href="/questions/ts-mapped-utility/">《映射类型与 Partial、Pick、Omit 如何用于接口建模？》</a>。</p>
</blockquote>
<p><strong>类型里的 <code>typeof</code> 和运行时的 <code>typeof</code> 怎么区分？</strong></p>
<blockquote>
<p>看它出现在哪里。写在类型注解、<code>type</code> 定义这些类型位置上，是 TypeScript 的类型运算，编译后会被删掉。写在 <code>if (typeof x === &#x27;string&#x27;)</code> 这类表达式里，是 JavaScript 运行时的运算符，返回一个字符串，TypeScript 还会根据它缩小类型。</p>
</blockquote>`};export{e as default};