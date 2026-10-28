var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>{ [K in keyof T]: X }</code> 为 T 的每个键生成一个属性，<code>T[K]</code> 取原属性类型。</li>
<li><code>-readonly</code>、<code>-?</code> 移除修饰符，<code>+readonly</code>、<code>+?</code>（或省略加号）添加修饰符。</li>
<li><code>Partial</code>、<code>Required</code>、<code>Readonly</code> 只改顶层，嵌套对象不受影响。</li>
<li><code>Pick&lt;T, K&gt;</code> 要求 K 是 T 的键；<code>Omit&lt;T, K&gt;</code> 的 K 可以是任意字符串，拼错不报错，用在联合类型上还会丢失分支差异。</li>
<li>这些工具只改变类型，<code>Omit&lt;User, &#x27;password&#x27;&gt;</code> 类型的变量运行时仍可能带着 <code>password</code>；要真正去掉字段必须构造新对象。</li>
</ul>
<h2>手写内置工具</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MyPartial</span>&lt;T&gt; = { [K <span class="hljs-keyword">in</span> keyof T]?: T[K] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyRequired</span>&lt;T&gt; = { [K <span class="hljs-keyword">in</span> keyof T]-?: T[K] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyReadonly</span>&lt;T&gt; = { <span class="hljs-keyword">readonly</span> [K <span class="hljs-keyword">in</span> keyof T]: T[K] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyPick</span>&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt; = { [P <span class="hljs-keyword">in</span> K]: T[P] };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyRecord</span>&lt;K <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PropertyKey</span>, V&gt; = { [P <span class="hljs-keyword">in</span> K]: V };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyOmit</span>&lt;T, K <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PropertyKey</span>&gt; = <span class="hljs-title class_">Pick</span>&lt;T, <span class="hljs-title class_">Exclude</span>&lt;keyof T, K&gt;&gt;;
</code></pre></div>
<h2>更新接口</h2>
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
<p>先 <code>Pick</code> 出允许修改的字段，再 <code>Partial</code>；直接 <code>Partial&lt;User&gt;</code> 会把 <code>id</code>、<code>password</code> 也放进更新契约。需要深层可选时自己写递归的 <code>DeepPartial</code>。</p>
<h2>Omit 不是脱敏</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">full</span>: <span class="hljs-title class_">User</span>;
<span class="hljs-keyword">const</span> <span class="hljs-attr">visible</span>: <span class="hljs-title class_">Omit</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;password&#x27;</span>&gt; = full; <span class="hljs-comment">// 运行时仍是 full，带着 password</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toPublicUser</span>(<span class="hljs-params"><span class="hljs-attr">user</span>: <span class="hljs-title class_">User</span></span>): <span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;id&#x27;</span> | <span class="hljs-string">&#x27;name&#x27;</span>&gt; {
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">id</span>: user.<span class="hljs-property">id</span>, <span class="hljs-attr">name</span>: user.<span class="hljs-property">name</span> }; <span class="hljs-comment">// 白名单构造新对象</span>
}
</code></pre></div>
<p>接口响应、日志中要去掉敏感字段时，必须像 <code>toPublicUser</code> 这样复制白名单字段。</p>
<h2>联合上的 Omit</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Shape</span> = { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;circle&#x27;</span>; <span class="hljs-attr">radius</span>: <span class="hljs-built_in">number</span> } | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;square&#x27;</span>; <span class="hljs-attr">side</span>: <span class="hljs-built_in">number</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">NoKind</span> = <span class="hljs-title class_">Omit</span>&lt;<span class="hljs-title class_">Shape</span>, <span class="hljs-string">&#x27;kind&#x27;</span>&gt;; <span class="hljs-comment">// {}，只保留了公共键</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">DistributiveOmit</span>&lt;T, K <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PropertyKey</span>&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span> ? <span class="hljs-title class_">Omit</span>&lt;T, K&gt; : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Fixed</span> = <span class="hljs-title class_">DistributiveOmit</span>&lt;<span class="hljs-title class_">Shape</span>, <span class="hljs-string">&#x27;kind&#x27;</span>&gt;; <span class="hljs-comment">// { radius: number } | { side: number }</span>
</code></pre></div>
<h2>键重映射</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Getters</span>&lt;T&gt; = {
  [K <span class="hljs-keyword">in</span> keyof T <span class="hljs-keyword">as</span> K <span class="hljs-keyword">extends</span> <span class="hljs-built_in">string</span> ? <span class="hljs-string">\`get<span class="hljs-subst">\${Capitalize&lt;K&gt;}</span>\`</span> : <span class="hljs-built_in">never</span>]: <span class="hljs-function">() =&gt;</span> T[K];
};
<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserGetters</span> = <span class="hljs-title class_">Getters</span>&lt;<span class="hljs-title class_">Pick</span>&lt;<span class="hljs-title class_">User</span>, <span class="hljs-string">&#x27;id&#x27;</span> | <span class="hljs-string">&#x27;name&#x27;</span>&gt;&gt;;
<span class="hljs-comment">// { readonly getId: () =&gt; string; getName: () =&gt; string }，同态映射保留 id 的 readonly</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">OnlyStrings</span>&lt;T&gt; = { [K <span class="hljs-keyword">in</span> keyof T <span class="hljs-keyword">as</span> T[K] <span class="hljs-keyword">extends</span> <span class="hljs-built_in">string</span> ? K : <span class="hljs-built_in">never</span>]: T[K] };
</code></pre></div>
<p><code>as</code> 返回 <code>never</code> 时该键被删除。</p>
<h2>常见追问</h2>
<ul>
<li><code>Record&lt;string, T&gt;</code> 和索引签名有何不同？基本等价；<code>Record&lt;&#x27;a&#x27; | &#x27;b&#x27;, T&gt;</code> 则要求两个键都存在。</li>
<li>为什么 <code>Object.keys(obj)</code> 返回 <code>string[]</code> 而不是 <code>(keyof T)[]</code>？结构类型允许对象带有类型中没有声明的额外键。</li>
</ul>`};export{e as default};