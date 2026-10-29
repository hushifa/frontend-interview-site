var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>泛型就是把类型也当成参数。写函数时先用 <code>T</code> 占个位，调用的时候再确定 <code>T</code> 是什么，一般由编译器自动推断。这样“传进字符串数组就返回字符串数组”这种关系能保留下来；要是用 <code>any</code>，这层关系就没了。</p>
<p>约束用 <code>extends</code>。<code>T extends { length: number }</code> 表示 T 至少要有 <code>length</code>，函数里就能放心用它。<code>K extends keyof T</code> 让 key 只能是 T 的键，再返回 <code>T[K]</code>，就能拿到这个键对应的精确类型。</p>
<p>泛型还有几个常用能力。<code>&lt;T = string&gt;</code> 给类型参数设默认值；<code>&lt;const T&gt;</code>（5.0）让推断保留字面量；<code>NoInfer&lt;T&gt;</code>（5.4）让某个参数只做检查、不参与推断。</p>
<p>要注意，满足约束的对象不一定就是调用方选的那个 T，不能随手构造一个返回。泛型也不做运行时检查。另外，只出现一次的类型参数通常没意义，直接写 <code>unknown</code> 更清楚。</p>
</blockquote>
<h2>泛型保留了什么关系</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> identity&lt;T&gt;(<span class="hljs-attr">value</span>: T): T {
  <span class="hljs-keyword">return</span> value;
}
<span class="hljs-keyword">const</span> result = <span class="hljs-title function_">identity</span>([<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;CSS&#x27;</span>]); <span class="hljs-comment">// string[]</span>
</code></pre></div>
<p>调用时没写 <code>&lt;string[]&gt;</code>，编译器根据参数推断出 <code>T</code> 是 <code>string[]</code>，返回值也就是 <code>string[]</code>。如果把参数和返回值都写成 <code>any</code>，<code>result</code> 就是 <code>any</code>，后面写错了也没人提醒。</p>
<h2>用 extends 加约束</h2>
<p>如果函数里要用 <code>length</code>，就得告诉编译器 T 一定有这个属性：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> longer&lt;T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">length</span>: <span class="hljs-built_in">number</span> }&gt;(<span class="hljs-attr">first</span>: T, <span class="hljs-attr">second</span>: T): T {
  <span class="hljs-keyword">return</span> first.<span class="hljs-property">length</span> &gt;= second.<span class="hljs-property">length</span> ? first : second;
}
<span class="hljs-title function_">longer</span>(<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;TypeScript&#x27;</span>); <span class="hljs-comment">// &#x27;HTML&#x27; | &#x27;TypeScript&#x27;</span>
<span class="hljs-title function_">longer</span>([<span class="hljs-number">1</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]);          <span class="hljs-comment">// number[]</span>
</code></pre></div>
<p>字符串和数组都有 <code>length</code>，所以都能传。返回类型仍是调用时推断出的 T，传字符串字面量得到字面量联合，传数组得到 <code>number[]</code>。</p>
<p>可是约束只说了“至少有什么”，不代表随便一个有 <code>length</code> 的对象都能当 T：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> ensureLength&lt;T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">length</span>: <span class="hljs-built_in">number</span> }&gt;(<span class="hljs-attr">value</span>: T, <span class="hljs-attr">minimum</span>: <span class="hljs-built_in">number</span>): T {
  <span class="hljs-keyword">if</span> (value.<span class="hljs-property">length</span> &gt;= minimum) <span class="hljs-keyword">return</span> value;
  <span class="hljs-comment">// @ts-expect-error 仅有 length 的对象不一定是调用方选择的 T</span>
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">length</span>: minimum };
}
</code></pre></div>
<p>为什么这里报错？因为调用方可能把 T 定成 <code>string</code>，而 <code>{ length: 5 }</code> 不是字符串。函数承诺返回 T，就只能返回真的属于 T 的值。</p>
<h2>keyof 配合索引访问</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> getProperty&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt;(<span class="hljs-attr">object</span>: T, <span class="hljs-attr">key</span>: K): T[K] {
  <span class="hljs-keyword">return</span> <span class="hljs-built_in">object</span>[key];
}
<span class="hljs-keyword">const</span> user = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">24</span> };
<span class="hljs-keyword">const</span> age = <span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&#x27;age&#x27;</span>); <span class="hljs-comment">// number</span>
<span class="hljs-comment">// @ts-expect-error missing 不是 user 的键</span>
<span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&#x27;missing&#x27;</span>);
</code></pre></div>
<p><code>keyof T</code> 是 T 所有键组成的联合，这里是 <code>&#x27;name&#x27; | &#x27;age&#x27;</code>。K 被限制在这个范围里，传错键名直接报错。<code>T[K]</code> 叫索引访问类型，意思是“T 里键 K 对应的类型”，所以传 <code>&#x27;age&#x27;</code> 得到的是 <code>number</code>，而不是笼统的 <code>string | number</code>。</p>
<h2>默认值、const 和 NoInfer</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ApiResponse</span>&lt;T = <span class="hljs-built_in">unknown</span>&gt; = { <span class="hljs-attr">data</span>: T; <span class="hljs-attr">status</span>: <span class="hljs-built_in">number</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">raw</span>: <span class="hljs-title class_">ApiResponse</span> = { <span class="hljs-attr">data</span>: <span class="hljs-literal">null</span>, <span class="hljs-attr">status</span>: <span class="hljs-number">200</span> }; <span class="hljs-comment">// T 为 unknown</span>

<span class="hljs-keyword">function</span> routes&lt;<span class="hljs-keyword">const</span> T <span class="hljs-keyword">extends</span> <span class="hljs-keyword">readonly</span> <span class="hljs-built_in">string</span>[]&gt;(<span class="hljs-attr">paths</span>: T): T {
  <span class="hljs-keyword">return</span> paths;
}
<span class="hljs-keyword">const</span> r = <span class="hljs-title function_">routes</span>([<span class="hljs-string">&#x27;/a&#x27;</span>, <span class="hljs-string">&#x27;/b&#x27;</span>]); <span class="hljs-comment">// readonly [&#x27;/a&#x27;, &#x27;/b&#x27;]</span>

<span class="hljs-keyword">function</span> createState&lt;T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">string</span>&gt;(<span class="hljs-attr">states</span>: T[], <span class="hljs-attr">initial</span>: <span class="hljs-title class_">NoInfer</span>&lt;T&gt;) {
  <span class="hljs-keyword">return</span> initial;
}
<span class="hljs-comment">// @ts-expect-error &#x27;c&#x27; 不在 states 推断出的 &#x27;a&#x27; | &#x27;b&#x27; 中</span>
<span class="hljs-title function_">createState</span>([<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>], <span class="hljs-string">&#x27;c&#x27;</span>);
</code></pre></div>
<p><code>ApiResponse</code> 不写类型实参时，T 就用默认的 <code>unknown</code>。<code>routes</code> 的 <code>const T</code> 让编译器像加了 <code>as const</code> 一样推断，得到只读元组 <code>readonly [&#x27;/a&#x27;, &#x27;/b&#x27;]</code>，而不是 <code>string[]</code>。</p>
<p><code>NoInfer</code> 解决的是另一个问题。没有它的话，<code>&#x27;c&#x27;</code> 也会参与推断，T 变成 <code>&#x27;a&#x27; | &#x27;b&#x27; | &#x27;c&#x27;</code>，错误就被藏起来了。加上 <code>NoInfer</code> 以后，T 只从 <code>states</code> 推断，<code>initial</code> 只负责被检查。</p>
<h2>泛型管不到的地方</h2>
<p>泛型不做运行时检查。<code>fetchJson&lt;User&gt;(url)</code> 里如果只是 <code>as T</code>，这个 <code>User</code> 只是调用方的期望，接口真返回什么它不知道。更好的写法是接收一个解析函数 <code>(input: unknown) =&gt; T</code>，让它去真正校验。</p>
<p>还有两个小习惯。读取数组第一项的函数，返回类型应该是 <code>T | undefined</code>，因为数组可能是空的。一个类型参数只出现一次，比如 <code>&lt;T&gt;(x: T): void</code>，它没有连接任何关系，直接写 <code>unknown</code> 更清楚。</p>
<h2>常见追问</h2>
<p><strong>泛型约束和函数重载怎么选？</strong></p>
<blockquote>
<p>输入和输出有统一的关系，用泛型；几种固定的调用方式各自返回不同类型，用重载，见<a href="/questions/ts-function-variance/">《函数重载、联合参数与泛型怎样选择？函数类型何时可赋值？》</a>。</p>
</blockquote>
<p><strong>为什么在 TSX 里写 <code>&lt;T&gt;(x: T) =&gt; x</code> 会报错？</strong></p>
<blockquote>
<p>因为 <code>&lt;T&gt;</code> 会被当成 JSX 标签。写成 <code>&lt;T,&gt;</code> 或 <code>&lt;T extends unknown&gt;</code> 就能区分开。</p>
</blockquote>`};export{e as default};