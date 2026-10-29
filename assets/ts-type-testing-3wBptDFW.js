var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>类型测试测的是“编译器接受什么、拒绝什么”。正向测试是把结果赋给期望类型的变量，能检查结果至少这么精确；负向测试是在非法调用上面写 <code>// @ts-expect-error</code>，下一行必须有错误，没有错误它自己就报错。<code>@ts-ignore</code> 不行，它不管有没有错误都吞掉，不能用来测试。</p>
<p>光靠赋值还不够，因为 <code>any</code> 能赋给任何类型，类型退化成 <code>any</code> 了测试照样通过。所以要用精确相等检查，比如自己写一个 <code>Equal&lt;A, B&gt;</code> 工具类型，或者用 Vitest 的 <code>expectTypeOf(x).toEqualTypeOf&lt;T&gt;()</code>。</p>
<p>测试要覆盖边界：联合类型输入、只读输入、空数组、<code>never</code>，还有从包名导入的真实入口。</p>
<p>要注意，类型测试的结果跟 <code>strict</code>、<code>exactOptionalPropertyTypes</code> 和 TypeScript 版本有关，配置要和发布时一致。它也替代不了运行时测试，两者测的是不同的东西。</p>
</blockquote>
<h2>正向测试和负向测试</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> wrap&lt;T&gt;(<span class="hljs-attr">value</span>: T): { <span class="hljs-attr">value</span>: T } {
  <span class="hljs-keyword">return</span> { value };
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">literal</span>: <span class="hljs-string">&#x27;ready&#x27;</span> = <span class="hljs-title function_">wrap</span>(<span class="hljs-string">&#x27;ready&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>).<span class="hljs-property">value</span>;

<span class="hljs-comment">// @ts-expect-error 字符串不能赋给 number</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">impossible</span>: <span class="hljs-built_in">number</span> = <span class="hljs-title function_">wrap</span>(<span class="hljs-string">&#x27;text&#x27;</span>).<span class="hljs-property">value</span>;
</code></pre></div>
<p>第一行是正向测试：结果能赋给 <code>&#x27;ready&#x27;</code>，说明 <code>wrap</code> 保留了字面量类型。第二行是负向测试：字符串不该能赋给 <code>number</code>，所以这里应该报错；哪天 <code>wrap</code> 改坏了、返回了 <code>any</code>，这一行不再报错，<code>@ts-expect-error</code> 自己就会报“未使用的指令”。</p>
<p>可 <code>@ts-expect-error</code> 只能证明“这里有错误”，不能证明是你预期的那个错误。所以注释后面要写清原因，每条只覆盖一个表达式，免得别的错误混进来。</p>
<h2>为什么需要精确相等</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Equal</span>&lt;A, B&gt; =
  (&lt;T&gt;<span class="hljs-function">() =&gt;</span> T <span class="hljs-keyword">extends</span> A ? <span class="hljs-number">1</span> : <span class="hljs-number">2</span>) <span class="hljs-title function_">extends</span> (&lt;T&gt;<span class="hljs-function">() =&gt;</span> T <span class="hljs-keyword">extends</span> B ? <span class="hljs-number">1</span> : <span class="hljs-number">2</span>) ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Expect</span>&lt;T <span class="hljs-keyword">extends</span> <span class="hljs-literal">true</span>&gt; = T;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Cases</span> = [
  <span class="hljs-title class_">Expect</span>&lt;<span class="hljs-title class_">Equal</span>&lt;<span class="hljs-title class_">ReturnType</span>&lt;<span class="hljs-keyword">typeof</span> wrap&lt;<span class="hljs-built_in">number</span>&gt;&gt;, { <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span> }&gt;&gt;,
  <span class="hljs-comment">// @ts-expect-error any 与 number 不相等</span>
  <span class="hljs-title class_">Expect</span>&lt;<span class="hljs-title class_">Equal</span>&lt;<span class="hljs-built_in">any</span>, <span class="hljs-built_in">number</span>&gt;&gt;,
];
</code></pre></div>
<p>普通赋值区分不了 <code>any</code>：<code>any</code> 能赋给 <code>number</code>，<code>number</code> 也能赋给 <code>any</code>，看起来“相等”。<code>Equal</code> 这个写法把 A 和 B 各放进一个泛型函数类型里，再比较这两个函数类型。编译器比较这种类型时要求两边完全相同，<code>any</code> 和 <code>number</code> 就会被判为不相等。<code>Expect</code> 只接受 <code>true</code>，结果是 <code>false</code> 就报错。</p>
<h2>用 Vitest 写类型测试</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// wrap.test-d.ts</span>
<span class="hljs-keyword">import</span> { expectTypeOf, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;
<span class="hljs-keyword">import</span> { wrap } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./wrap&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;wrap 保留输入类型&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">expectTypeOf</span>(<span class="hljs-title function_">wrap</span>(<span class="hljs-number">1</span>)).<span class="hljs-property">toEqualTypeOf</span>&lt;{ <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span> }&gt;();
  <span class="hljs-title function_">expectTypeOf</span>(wrap).<span class="hljs-title function_">parameter</span>(<span class="hljs-number">0</span>).<span class="hljs-title function_">toBeUnknown</span>();
});
</code></pre></div>
<p><code>toEqualTypeOf</code> 做的就是精确相等检查。运行 <code>vitest --typecheck</code> 时，它会对 <code>*.test-d.ts</code> 文件跑 tsc，只做类型检查，不执行代码。检查已发布的包，可以用 tsd 或 <code>@arethetypeswrong/cli</code>。</p>
<h2>重载和联合要单独测</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">number</span>;
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">fromText</span>: <span class="hljs-built_in">number</span> = <span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;42&#x27;</span>);
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>;
<span class="hljs-comment">// @ts-expect-error 没有接受联合的公开签名</span>
<span class="hljs-title function_">parse</span>(input);
</code></pre></div>
<p>重载函数传联合会报错，这正是它的行为，测试把它锁住了。如果业务确实需要接受联合，应该改 API、同时更新测试，而不是直接删掉这条测试。</p>
<h2>和运行时测试怎么分工</h2>
<p>类型测试证明编译器接受或拒绝某些写法；运行时测试证明 JavaScript 真正跑起来是对的。<code>.d.ts</code> 写错了，运行时测试发现不了；<code>JSON.parse</code> 出来的数据合不合法，类型测试也管不了。所以写库的项目两种测试都需要。</p>
<h2>常见追问</h2>
<p><strong>类型测试放在哪里？</strong></p>
<blockquote>
<p>放在单独的 <code>*.test-d.ts</code> 文件或 <code>type-tests/</code> 目录里，并且纳入 CI 的 <code>tsc --noEmit</code> 检查。</p>
</blockquote>
<p><strong>升级 TypeScript 以后类型测试失败了怎么办？</strong></p>
<blockquote>
<p>逐条看新增或消失的报错，判断是新版本修正了以前错误的推断，还是 API 的行为真的变了，再决定改实现还是改测试。</p>
</blockquote>`};export{e as default};