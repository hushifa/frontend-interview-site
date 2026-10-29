var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>映射类型可以理解成类型层面的 for 循环：<code>{ [K in keyof T]: X }</code> 把 T 的每个键都拿出来，生成一个新属性，<code>T[K]</code> 是原来那个属性的类型。还能顺便改修饰符，<code>-readonly</code>、<code>-?</code> 去掉只读和可选，<code>+readonly</code>、<code>+?</code> 加上（加号可省略），用 <code>as</code> 子句还能改名或过滤键。</p>
<p><code>Partial</code>、<code>Required</code>、<code>Readonly</code>、<code>Pick</code>、<code>Omit</code>、<code>Record</code> 都是这样写出来的。建模时常见的用法是先 <code>Pick</code> 出允许修改的字段，再套 <code>Partial</code>，得到一个更新接口的参数类型。</p>
<p>要注意三点。第一，<code>Partial</code>、<code>Readonly</code> 这些只改顶层，嵌套对象不受影响。第二，<code>Pick</code> 要求键必须存在，<code>Omit</code> 却接受任意字符串，拼错了不报错；用在联合类型上还会丢掉分支差异。第三，它们只改类型，<code>Omit&lt;User, &#x27;password&#x27;&gt;</code> 类型的变量运行时可能还带着 <code>password</code>，要真去掉字段必须构造新对象。</p>
</blockquote>
<h2>内置工具是怎么写出来的</h2>
<p>把几个内置工具自己写一遍，就能看清映射类型的用法：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MyPartial</span>&lt;T&gt; = { [K <span class="hljs-keyword">in</span> keyof T]?: T[K] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyRequired</span>&lt;T&gt; = { [K <span class="hljs-keyword">in</span> keyof T]-?: T[K] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyReadonly</span>&lt;T&gt; = { <span class="hljs-keyword">readonly</span> [K <span class="hljs-keyword">in</span> keyof T]: T[K] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyPick</span>&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt; = { [P <span class="hljs-keyword">in</span> K]: T[P] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyRecord</span>&lt;K <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PropertyKey</span>, V&gt; = { [P <span class="hljs-keyword">in</span> K]: V };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyOmit</span>&lt;T, K <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PropertyKey</span>&gt; = <span class="hljs-title class_">Pick</span>&lt;T, <span class="hljs-title class_">Exclude</span>&lt;keyof T, K&gt;&gt;;
</code></pre></div>
<p><code>MyPartial</code> 遍历所有键，每个属性加上 <code>?</code>。<code>MyRequired</code> 用 <code>-?</code> 把问号去掉。<code>MyPick</code> 只遍历你给的那几个键。<code>MyOmit</code> 稍微绕一点：先用 <code>Exclude</code> 从所有键里去掉不要的，再 <code>Pick</code> 剩下的。注意它的 K 约束是 <code>PropertyKey</code>，不是 <code>keyof T</code>，这就是 <code>Omit</code> 拼错键也不报错的原因。</p>
<h2>怎样设计一个更新接口的参数</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = {
  <span class="hljs-keyword">readonly</span> <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">profile</span>: { <span class="hljs-attr">city</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">postalCode</span>: <span class="hljs-built_in">string</span> };
  <span class="hljs-attr">password</span>: <span class="hljs-built_in">string</span>;
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserPatch</span> = <span class="hljs-title class_">Partial</span>&lt;<span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;name&#x27;</span> | <span class="hljs-string">&#x27;profile&#x27;</span>&gt;&gt;;

<span class="hljs-keyword">const</span> <span class="hljs-attr">rename</span>: <span class="hljs-title class_">UserPatch</span> = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span> };
<span class="hljs-comment">// @ts-expect-error 更新契约没有开放 id</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">changeId</span>: <span class="hljs-title class_">UserPatch</span> = { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;user_2&#x27;</span> };
<span class="hljs-comment">// @ts-expect-error Partial 只作用于顶层，profile 提供时仍需完整</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">incompleteProfile</span>: <span class="hljs-title class_">UserPatch</span> = { <span class="hljs-attr">profile</span>: { <span class="hljs-attr">city</span>: <span class="hljs-string">&#x27;上海&#x27;</span> } };
</code></pre></div>
<p>先 <code>Pick</code> 再 <code>Partial</code>，意思是“只能改 name 和 profile，而且可以只改其中一个”。如果直接写 <code>Partial&lt;User&gt;</code>，<code>id</code> 和 <code>password</code> 也会被放进更新参数里，这通常不是你想要的。</p>
<p>第三个例子可能出乎意料：<code>UserPatch</code> 都是可选的了，为什么 <code>profile</code> 只写 <code>city</code> 还报错？因为 <code>Partial</code> 只把顶层的 <code>profile</code> 变成了可选，<code>profile</code> 里面的 <code>city</code>、<code>postalCode</code> 还是必需的。需要深层可选时，要自己写一个递归的 <code>DeepPartial</code>。</p>
<h2>为什么 Omit 不能用来脱敏</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">full</span>: <span class="hljs-title class_">User</span>;
<span class="hljs-keyword">const</span> <span class="hljs-attr">visible</span>: <span class="hljs-title class_">Omit</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;password&#x27;</span>&gt; = full; <span class="hljs-comment">// 运行时仍是 full，带着 password</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toPublicUser</span>(<span class="hljs-params"><span class="hljs-attr">user</span>: <span class="hljs-title class_">User</span></span>): <span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;id&#x27;</span> | <span class="hljs-string">&#x27;name&#x27;</span>&gt; {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">id</span>: user.<span class="hljs-property">id</span>, <span class="hljs-attr">name</span>: user.<span class="hljs-property">name</span> }; <span class="hljs-comment">// 白名单构造新对象</span>
}
</code></pre></div>
<p><code>visible</code> 的类型里没有 <code>password</code>，可它和 <code>full</code> 是同一个对象，<code>password</code> 一直都在。类型只是让你“看不见”它，把 <code>visible</code> 发给接口或写进日志，密码照样出去。所以真要去掉敏感字段，必须像 <code>toPublicUser</code> 这样，按白名单把需要的字段复制到一个新对象里。</p>
<h2>Omit 用在联合类型上会怎样</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Shape</span> = { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;circle&#x27;</span>; <span class="hljs-attr">radius</span>: <span class="hljs-built_in">number</span> } | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;square&#x27;</span>; <span class="hljs-attr">side</span>: <span class="hljs-built_in">number</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">NoKind</span> = <span class="hljs-title class_">Omit</span>&lt;<span class="hljs-title class_">Shape</span>, <span class="hljs-string">&#x27;kind&#x27;</span>&gt;; <span class="hljs-comment">// {}，只保留了公共键</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">DistributiveOmit</span>&lt;T, K <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PropertyKey</span>&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span> ? <span class="hljs-title class_">Omit</span>&lt;T, K&gt; : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Fixed</span> = <span class="hljs-title class_">DistributiveOmit</span>&lt;<span class="hljs-title class_">Shape</span>, <span class="hljs-string">&#x27;kind&#x27;</span>&gt;; <span class="hljs-comment">// { radius: number } | { side: number }</span>
</code></pre></div>
<p>本来只想去掉 <code>kind</code>，结果得到了空对象 <code>{}</code>。原因是 <code>keyof</code> 一个联合，只能拿到各分支共有的键，这里只有 <code>kind</code>，去掉以后就什么都不剩了。改法是借助分布式条件类型，让 <code>Omit</code> 对每个分支分别执行，再合起来。</p>
<h2>用 as 改名或过滤键</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Getters</span>&lt;T&gt; = {
  [K <span class="hljs-keyword">in</span> keyof T <span class="hljs-keyword">as</span> K <span class="hljs-keyword">extends</span> <span class="hljs-built_in">string</span> ? <span class="hljs-string">\`get<span class="hljs-subst">\${Capitalize&lt;K&gt;}</span>\`</span> : <span class="hljs-built_in">never</span>]: <span class="hljs-function">() =&gt;</span> T[K];
};
<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserGetters</span> = <span class="hljs-title class_">Getters</span>&lt;<span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;id&#x27;</span> | <span class="hljs-string">&#x27;name&#x27;</span>&gt;&gt;;
<span class="hljs-comment">// { readonly getId: () =&gt; string; getName: () =&gt; string }，同态映射保留 id 的 readonly</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">OnlyStrings</span>&lt;T&gt; = { [K <span class="hljs-keyword">in</span> keyof T <span class="hljs-keyword">as</span> T[K] <span class="hljs-keyword">extends</span> <span class="hljs-built_in">string</span> ? K : <span class="hljs-built_in">never</span>]: T[K] };
</code></pre></div>
<p><code>as</code> 后面写的是新的键名。<code>Getters</code> 把 <code>id</code> 变成 <code>getId</code>，值变成返回原类型的函数。<code>id</code> 原来是 <code>readonly</code>，结果里 <code>getId</code> 也是 <code>readonly</code>，因为这种基于 <code>keyof T</code> 的映射（叫同态映射）会保留原来的修饰符。<code>as</code> 的结果是 <code>never</code> 时，这个键就被删掉，<code>OnlyStrings</code> 就是这样只留下值为字符串的属性。</p>
<h2>常见追问</h2>
<p><strong><code>Record&lt;string, T&gt;</code> 和索引签名有什么不同？</strong></p>
<blockquote>
<p>基本是一样的。但 <code>Record&lt;&#x27;a&#x27; | &#x27;b&#x27;, T&gt;</code> 就不同了，它要求 <code>a</code> 和 <code>b</code> 两个键都必须存在。</p>
</blockquote>
<p><strong>为什么 <code>Object.keys(obj)</code> 返回 <code>string[]</code>，而不是 <code>(keyof T)[]</code>？</strong></p>
<blockquote>
<p>因为 TypeScript 是结构类型，一个对象实际上可以带着类型里没声明的额外键。如果返回 <code>(keyof T)[]</code>，就等于承诺没有别的键，这个承诺不一定成立。</p>
</blockquote>`};export{e as default};