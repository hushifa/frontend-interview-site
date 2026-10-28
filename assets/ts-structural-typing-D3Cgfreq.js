var e={answerHtml:`<h2>简答</h2>
<ul>
<li>结构类型：A 拥有 B 要求的全部成员（类型兼容），A 就能赋给 B，名字不同也没关系。</li>
<li>额外属性检查只针对直接写出的对象字面量，<code>greet({ name, role })</code> 报错，先赋给变量再传就不报。</li>
<li>类型变窄不会删除字段，<code>Object.keys</code> 仍能看到未声明的属性，所以它返回 <code>string[]</code>。</li>
<li>类的 <code>private</code>、<code>protected</code> 成员和 <code>#私有字段</code> 会让结构相同的类不兼容。</li>
<li>两个都是 <code>string</code> 的 ID 默认可以互换，需要区分时用品牌类型，并通过校验函数创建。</li>
</ul>
<h2>额外属性检查</h2>
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
<p>直接写出的字面量多出字段，通常是拼写错误或接口理解错误，所以编译器报错。变量可能在其他地方被正常使用，多出字段是合理的。</p>
<p>要把数据真正限制为某些字段（如发给接口、写日志），需要复制白名单字段生成新对象。</p>
<h2>品牌类型</h2>
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
<p>品牌只存在于类型层，运行时仍是普通字符串。唯一的 <code>as</code> 放在校验函数里，其他地方无法绕过。</p>
<h2>类的私有成员</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">class</span> <span class="hljs-title class_">A</span> { <span class="hljs-keyword">private</span> x = <span class="hljs-number">1</span>; }
<span class="hljs-keyword">class</span> <span class="hljs-title class_">B</span> { <span class="hljs-keyword">private</span> x = <span class="hljs-number">1</span>; }
<span class="hljs-comment">// @ts-expect-error 私有成员来自不同声明，不兼容</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">a</span>: A = <span class="hljs-keyword">new</span> <span class="hljs-title function_">B</span>();
</code></pre></div>
<h2>函数兼容</h2>
<p>参数少的函数可以赋给参数多的函数类型，例如 <code>arr.forEach((x) =&gt; ...)</code> 忽略了 <code>index</code> 参数。参数类型的兼容方向见《函数重载、联合参数与泛型怎样选择？函数类型何时可赋值？》。</p>
<p>可选属性与 <code>exactOptionalPropertyTypes</code> 的关系见《strict、noUncheckedIndexedAccess 和 target 如何配置？》。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 <code>{}</code> 能接受字符串？<code>string</code> 具有 <code>{}</code> 要求的全部成员（没有成员），且 <code>{}</code> 只排除 <code>null</code> 和 <code>undefined</code>。</li>
<li>怎样关闭额外属性检查？加索引签名 <code>[key: string]: unknown</code>，但这会扩大可接受的范围，拼写错误也不再报错。</li>
</ul>`};export{e as default};