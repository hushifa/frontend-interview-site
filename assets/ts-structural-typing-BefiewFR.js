var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>TypeScript 判断 A 能不能赋给 B，看的是结构：A 有 B 要求的全部成员，而且类型兼容，就能赋值，两个类型名字不同也没关系，这叫结构类型。</p>
<p>不过有个例外叫额外属性检查。直接写出来的对象字面量，比如 <code>greet({ name, role })</code>，多了目标里没有的字段会报错；先赋给变量再传，就不报。因为直接写的字面量多出字段，多半是拼错了。</p>
<p>要注意，类型变窄不会删掉字段，多出来的属性运行时还在，<code>Object.keys</code> 照样能看到，这也是它返回 <code>string[]</code> 的原因。另外类的 <code>private</code>、<code>protected</code> 成员和 <code>#私有字段</code>，会让结构相同的两个类互不兼容。</p>
<p>两个都是 <code>string</code> 的 ID 默认可以互换。需要区分时用品牌类型，并且只通过校验函数来创建。</p>
</blockquote>
<h2>额外属性检查什么时候生效</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Named</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">greet</span>(<span class="hljs-params"><span class="hljs-attr">person</span>: <span class="hljs-title class_">Named</span></span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">return</span> person.<span class="hljs-property">name</span>;
}

<span class="hljs-keyword">const</span> detailed = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;admin&#x27;</span> };
<span class="hljs-title function_">greet</span>(detailed); <span class="hljs-comment">// 允许</span>

<span class="hljs-comment">// @ts-expect-error 对象字面量包含未声明的 role</span>
<span class="hljs-title function_">greet</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;admin&#x27;</span> });

<span class="hljs-keyword">const</span> <span class="hljs-attr">narrowed</span>: <span class="hljs-title class_">Named</span> = detailed;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(narrowed)); <span class="hljs-comment">// [&#x27;name&#x27;, &#x27;role&#x27;]</span>
</code></pre></div>
<p>同样多一个 <code>role</code>，传变量不报错，直接写字面量却报错，看起来不一致。原因是两种情况的含义不同：直接写出来的字面量只在这里用一次，多出的字段没人能读到，多半是拼写错误或者理解错了接口；而变量可能在别处正常使用 <code>role</code>，多带一个字段很合理。</p>
<p>最后两行说明另一件事：<code>narrowed</code> 的类型是 <code>Named</code>，可它和 <code>detailed</code> 是同一个对象，<code>role</code> 还在。类型标注只是让你看不见多出的字段，不会删掉它。所以要把数据真正限制在某些字段，比如发给接口、写日志，需要按白名单复制出一个新对象。</p>
<h2>两个 string 怎样区分开</h2>
<p>用户 ID 和订单 ID 都是字符串，结构类型下它们可以随便互换，传错了也不报错。品牌类型就是给其中一个加一个只在类型里存在的标记：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">userIdBrand</span>: unique <span class="hljs-built_in">symbol</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserId</span> = <span class="hljs-built_in">string</span> &amp; { <span class="hljs-keyword">readonly</span> [userIdBrand]: <span class="hljs-literal">true</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">makeUserId</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-title class_">UserId</span> {
  <span class="hljs-keyword">if</span> (!<span class="hljs-regexp">/^user_[0-9]+$/</span>.<span class="hljs-title function_">test</span>(value)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;用户 ID 格式不正确&#x27;</span>);
  <span class="hljs-keyword">return</span> value <span class="hljs-keyword">as</span> <span class="hljs-title class_">UserId</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">openUser</span>(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-title class_">UserId</span></span>): <span class="hljs-built_in">void</span> {}

<span class="hljs-title function_">openUser</span>(<span class="hljs-title function_">makeUserId</span>(<span class="hljs-string">&#x27;user_1&#x27;</span>));
<span class="hljs-comment">// @ts-expect-error 普通字符串不是 UserId</span>
<span class="hljs-title function_">openUser</span>(<span class="hljs-string">&#x27;order_1&#x27;</span>);
</code></pre></div>
<p>普通字符串没有那个标记，所以不能直接当 <code>UserId</code> 传。标记只存在于类型层，运行时 <code>UserId</code> 仍是普通字符串。整个程序里唯一的 <code>as UserId</code> 放在 <code>makeUserId</code> 里，并且先做了格式校验，其他地方就没法绕过校验造出一个 <code>UserId</code>。</p>
<h2>类的私有成员会打破结构类型</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">class</span> <span class="hljs-title class_">A</span> { <span class="hljs-keyword">private</span> x = <span class="hljs-number">1</span>; }
<span class="hljs-keyword">class</span> <span class="hljs-title class_">B</span> { <span class="hljs-keyword">private</span> x = <span class="hljs-number">1</span>; }
<span class="hljs-comment">// @ts-expect-error 私有成员来自不同声明，不兼容</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">a</span>: A = <span class="hljs-keyword">new</span> <span class="hljs-title function_">B</span>();
</code></pre></div>
<p><code>A</code> 和 <code>B</code> 的结构一模一样，却不能互相赋值。因为对 <code>private</code>、<code>protected</code> 成员，TypeScript 要求它们来自同一个声明，这时比较就不只看结构了。</p>
<h2>函数和可选属性</h2>
<p>函数也按结构比较。参数少的函数可以赋给参数多的函数类型，所以 <code>arr.forEach((x) =&gt; ...)</code> 不写 <code>index</code> 也没问题。参数类型的兼容方向见<a href="/questions/ts-function-variance/">《函数重载、联合参数与泛型怎样选择？函数类型何时可赋值？》</a>。</p>
<p>可选属性和 <code>exactOptionalPropertyTypes</code> 的关系见<a href="/questions/ts-tsconfig/">《strict、noUncheckedIndexedAccess 和 target 如何配置？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>{}</code> 类型能接收字符串？</strong></p>
<blockquote>
<p><code>{}</code> 没有要求任何成员，<code>string</code> 当然满足“拥有全部要求的成员”。<code>{}</code> 只排除 <code>null</code> 和 <code>undefined</code>。</p>
</blockquote>
<p><strong>怎样关闭额外属性检查？</strong></p>
<blockquote>
<p>给类型加索引签名 <code>[key: string]: unknown</code>。但这会扩大能接受的范围，拼写错误也不再报错，要谨慎使用。</p>
</blockquote>`};export{e as default};