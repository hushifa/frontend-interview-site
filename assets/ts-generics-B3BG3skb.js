var e={answerHtml:`<h2>简答</h2>
<ul>
<li>泛型让类型在调用时确定，保留&quot;输入什么类型就返回什么类型&quot;这类关系；用 <code>any</code> 会丢掉这种关系。</li>
<li><code>T extends { length: number }</code> 约束 T 必须有 <code>length</code>，函数内部可以使用它；满足约束的新对象不一定是调用方选择的 T。</li>
<li><code>K extends keyof T</code> 让 key 只能是 T 的键，返回 <code>T[K]</code> 精确对应该键的属性类型。</li>
<li>能推断时不必手写类型实参；只出现一次的类型参数通常没有意义。</li>
<li><code>&lt;T = string&gt;</code> 设置默认值；<code>&lt;const T&gt;</code> 保留字面量类型；<code>NoInfer&lt;T&gt;</code> 让某个参数只做检查、不参与推断。</li>
</ul>
<h2>保留关系</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> identity&lt;T&gt;(<span class="hljs-attr">value</span>: T): T {
  <span class="hljs-keyword">return</span> value;
}
<span class="hljs-keyword">const</span> result = <span class="hljs-title function_">identity</span>([<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;CSS&#x27;</span>]); <span class="hljs-comment">// string[]</span>
</code></pre></div>
<h2>约束</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> longer&lt;T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">length</span>: <span class="hljs-built_in">number</span> }&gt;(<span class="hljs-attr">first</span>: T, <span class="hljs-attr">second</span>: T): T {
  <span class="hljs-keyword">return</span> first.<span class="hljs-property">length</span> &gt;= second.<span class="hljs-property">length</span> ? first : second;
}
<span class="hljs-title function_">longer</span>(<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;TypeScript&#x27;</span>); <span class="hljs-comment">// string</span>
<span class="hljs-title function_">longer</span>([<span class="hljs-number">1</span>], [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>]);          <span class="hljs-comment">// number[]</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> ensureLength&lt;T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">length</span>: <span class="hljs-built_in">number</span> }&gt;(<span class="hljs-attr">value</span>: T, <span class="hljs-attr">minimum</span>: <span class="hljs-built_in">number</span>): T {
  <span class="hljs-keyword">if</span> (value.<span class="hljs-property">length</span> &gt;= minimum) <span class="hljs-keyword">return</span> value;
  <span class="hljs-comment">// @ts-expect-error 仅有 length 的对象不一定是调用方选择的 T</span>
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">length</span>: minimum };
}
</code></pre></div>
<p>调用方可能把 T 定为 <code>string</code>，<code>{ length: 5 }</code> 不是字符串。</p>
<h2>keyof 与索引访问</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> getProperty&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt;(<span class="hljs-attr">object</span>: T, <span class="hljs-attr">key</span>: K): T[K] {
  <span class="hljs-keyword">return</span> <span class="hljs-built_in">object</span>[key];
}
<span class="hljs-keyword">const</span> user = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">24</span> };
<span class="hljs-keyword">const</span> age = <span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&#x27;age&#x27;</span>); <span class="hljs-comment">// number</span>
<span class="hljs-comment">// @ts-expect-error missing 不是 user 的键</span>
<span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&#x27;missing&#x27;</span>);
</code></pre></div>
<h2>默认值、const 与 NoInfer</h2>
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
<p>没有 <code>NoInfer</code> 时，<code>&#x27;c&#x27;</code> 也会参与推断，T 变成 <code>&#x27;a&#x27; | &#x27;b&#x27; | &#x27;c&#x27;</code>，错误被隐藏。</p>
<h2>边界</h2>
<ul>
<li>泛型不做运行时检查。<code>fetchJson&lt;User&gt;(url)</code> 内部若只是 <code>as T</code>，类型参数只是调用方的期望；应该接收一个解析函数 <code>(input: unknown) =&gt; T</code>。</li>
<li>读取数组首项应返回 <code>T | undefined</code>。</li>
<li>一个类型参数只出现一次（如 <code>&lt;T&gt;(x: T): void</code>）时，直接写 <code>unknown</code> 更清楚。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>泛型约束和函数重载怎么选？输入输出有统一的关系用泛型；几种离散的调用形式各自返回不同类型用重载，见<a href="/questions/ts-function-variance/">《函数重载、联合参数与泛型怎样选择？函数类型何时可赋值？》</a>。</li>
<li>为什么 TSX 里写 <code>&lt;T&gt;(x: T) =&gt; x</code> 报错？会被当成 JSX 标签，写成 <code>&lt;T,&gt;</code> 或 <code>&lt;T extends unknown&gt;</code>。</li>
</ul>`};export{e as default};