var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>描述一个普通对象或函数签名时，<code>type</code> 和 <code>interface</code> 基本一样，都按结构比较，编译后也都会被删掉。</p>
<p>区别主要在能力上。只有 <code>type</code> 能写联合（比如 <code>&#x27;a&#x27; | &#x27;b&#x27;</code>）、元组、条件类型、映射类型，以及给 <code>typeof</code> 的结果起别名。只有 <code>interface</code> 能同名合并，写两次同名 interface，成员会合到一起，所以常用来扩展第三方类型，比如 <code>Window</code>；同名的 <code>type</code> 会报重复声明。</p>
<p>组合类型时也有差别。<code>interface B extends A</code> 如果属性类型冲突，在声明处就报错；用 <code>A &amp; B</code> 交叉，冲突的属性会悄悄变成 <code>never</code>，到用的时候才发现。</p>
<p>实际项目里，常见约定是对象契约用 <code>interface</code>，其他用 <code>type</code>。团队里保持一致，比选哪个更重要。</p>
</blockquote>
<h2>两者都能写的</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">User</span> {
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">age</span>?: <span class="hljs-built_in">number</span>;
}

<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserRecord</span> = {
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">age</span>?: <span class="hljs-built_in">number</span>;
};

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Formatter</span> {
  (<span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span>): <span class="hljs-built_in">string</span>;
}
<span class="hljs-keyword">type</span> <span class="hljs-title class_">FormatFunction</span> = <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>) =&gt;</span> <span class="hljs-built_in">string</span>;
</code></pre></div>
<p>对象和函数签名，两种写法都行，效果一样。要注意它们都只在编译期存在，编译后就没了，所以不能 <code>new User()</code>，也不能写 <code>value instanceof User</code>。</p>
<h2>只有 type 能做的</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">UserId</span> = <span class="hljs-built_in">string</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Point</span> = <span class="hljs-keyword">readonly</span> [<span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>];
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Result</span>&lt;T&gt; = { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">value</span>: T } | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">error</span>: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Keys</span> = keyof <span class="hljs-title class_">User</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Getters</span> = { [K <span class="hljs-keyword">in</span> keyof <span class="hljs-title class_">User</span> &amp; <span class="hljs-built_in">string</span> <span class="hljs-keyword">as</span> <span class="hljs-string">\`get<span class="hljs-subst">\${Capitalize&lt;K&gt;}</span>\`</span>]: <span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">User</span>[K] };
</code></pre></div>
<p>给原始类型起别名、元组、联合、<code>keyof</code> 的结果、映射类型，这些都不是“一个对象有哪些属性”，interface 没法表达，只能用 <code>type</code>。</p>
<h2>同名 interface 会合并</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">ReadingOptions</span> {
  <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> | <span class="hljs-string">&#x27;dark&#x27;</span>;
}
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">ReadingOptions</span> {
  <span class="hljs-attr">fontSize</span>: <span class="hljs-built_in">number</span>;
}
<span class="hljs-keyword">const</span> <span class="hljs-attr">options</span>: <span class="hljs-title class_">ReadingOptions</span> = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-attr">fontSize</span>: <span class="hljs-number">16</span> };
</code></pre></div>
<p>两段声明被合成了一个，所以 <code>options</code> 要同时有 <code>theme</code> 和 <code>fontSize</code>。合并时同名属性的类型必须一致，不然报错。更多合并规则和模块增补见<a href="/questions/ts-declaration-merging/">《TypeScript 声明合并和模块扩展有哪些边界？》</a>。</p>
<h2>extends 和交叉类型，冲突时有什么不同</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">TextValue</span> {
  <span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span>;
}

<span class="hljs-comment">// @ts-expect-error 子接口不能把 value 改成不兼容的 number</span>
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">NumberValue</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_">TextValue</span> {
  <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span>;
}

<span class="hljs-keyword">type</span> <span class="hljs-title class_">ImpossibleValue</span> = <span class="hljs-title class_">TextValue</span> &amp; { <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span> };
<span class="hljs-comment">// @ts-expect-error value 是 string &amp; number，即 never</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">impossible</span>: <span class="hljs-title class_">ImpossibleValue</span> = { <span class="hljs-attr">value</span>: <span class="hljs-number">1</span> };
</code></pre></div>
<p>用 <code>extends</code> 把 <code>value</code> 改成 <code>number</code>，在声明 <code>NumberValue</code> 的那一行就报错，一眼能看出问题在哪。</p>
<p>用交叉类型 <code>&amp;</code> 就不一样了。声明 <code>ImpossibleValue</code> 时什么都不报，因为交叉的意思是“同时满足两边”，<code>value</code> 要同时是 <code>string</code> 和 <code>number</code>，结果就成了 <code>never</code>。直到真的去创建对象时才报错，而且错误离原因很远。多层交叉还会让错误信息难读、类型检查变慢，所以需要组合对象类型时，优先用 <code>interface extends</code>。</p>
<h2>其他小差别</h2>
<p><code>class X implements T</code> 对 interface 和对象形式的 type 都能用，它只做检查，不生成代码。另外在编辑器里悬停时，interface 显示的是名字，type 有时会展开成完整的结构。</p>
<h2>常见追问</h2>
<p><strong>怎样让两个都是 string 的 ID 不能互相赋值？</strong></p>
<blockquote>
<p>用品牌类型，比如 <code>type UserId = string &amp; { readonly __brand: &#x27;UserId&#x27; }</code>。普通字符串没有这个品牌字段，就不能直接当 <code>UserId</code> 用。</p>
</blockquote>
<p><strong>interface 能 extends 一个 type 吗？</strong></p>
<blockquote>
<p>能，只要这个 type 是对象类型。如果它是联合类型，就不行。</p>
</blockquote>`};export{e as default};