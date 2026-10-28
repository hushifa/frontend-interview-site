var e={answerHtml:`<h2>简答</h2>
<ul>
<li>描述普通对象、函数签名时两者基本等价，都按结构比较。</li>
<li>只有 <code>type</code> 能写联合（<code>&#x27;a&#x27; | &#x27;b&#x27;</code>）、元组、条件类型、映射类型、<code>typeof</code> 结果的别名。</li>
<li>同名 <code>interface</code> 会自动合并成员，可以用来扩展第三方类型（如 <code>Window</code>）；同名 <code>type</code> 会报重复声明错误。</li>
<li><code>interface B extends A</code> 中属性不兼容时直接报错；<code>A &amp; B</code> 冲突时属性变成 <code>never</code>，在使用处才发现。</li>
<li>团队约定常见做法：对象契约用 <code>interface</code>，其他用 <code>type</code>；保持一致比选哪个更重要。</li>
</ul>
<h2>两者都能写</h2>
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
<p>它们都只存在于编译期，不能 <code>new User()</code>，也不能 <code>value instanceof User</code>。</p>
<h2>只有 type 能做的</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">UserId</span> = <span class="hljs-built_in">string</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Point</span> = <span class="hljs-keyword">readonly</span> [<span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>];
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Result</span>&lt;T&gt; = { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">value</span>: T } | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">error</span>: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Keys</span> = keyof <span class="hljs-title class_">User</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Getters</span> = { [K <span class="hljs-keyword">in</span> keyof <span class="hljs-title class_">User</span> &amp; <span class="hljs-built_in">string</span> <span class="hljs-keyword">as</span> <span class="hljs-string">\`get<span class="hljs-subst">\${Capitalize&lt;K&gt;}</span>\`</span>]: <span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">User</span>[K] };
</code></pre></div>
<h2>声明合并</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">ReadingOptions</span> {
  <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> | <span class="hljs-string">&#x27;dark&#x27;</span>;
}
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">ReadingOptions</span> {
  <span class="hljs-attr">fontSize</span>: <span class="hljs-built_in">number</span>;
}
<span class="hljs-keyword">const</span> <span class="hljs-attr">options</span>: <span class="hljs-title class_">ReadingOptions</span> = { <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span>, <span class="hljs-attr">fontSize</span>: <span class="hljs-number">16</span> };
</code></pre></div>
<p>合并要求同名属性类型一致，否则报错。合并规则和模块增补见《TypeScript 声明合并和模块扩展有哪些边界？》。</p>
<h2>extends 与交叉</h2>
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
<p><code>extends</code> 在声明处报错，更容易定位。复杂的多层交叉还会让错误信息难读、类型检查变慢；需要组合时优先 <code>interface extends</code>。</p>
<h2>其他</h2>
<ul>
<li><code>class X implements T</code> 对 interface 和对象 type 都可用，只做检查，不生成代码。</li>
<li>编辑器悬停时，interface 显示名字，type 有时会展开成完整结构。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样让两个都是 string 的 ID 不能互相赋值？用品牌类型：<code>type UserId = string &amp; { readonly __brand: &#x27;UserId&#x27; }</code>。</li>
<li><code>interface</code> 能扩展 <code>type</code> 吗？能，只要该 <code>type</code> 是对象类型而不是联合。</li>
</ul>`};export{e as default};