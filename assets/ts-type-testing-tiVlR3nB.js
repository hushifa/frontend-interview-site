var e={answerHtml:`<h2>简答</h2>
<ul>
<li>正向测试：把结果赋给期望类型的变量，能检查&quot;至少这么精确&quot;，但 <code>any</code> 会让它总是通过。</li>
<li>负向测试：<code>// @ts-expect-error</code> 断言下一行必须有错误，没有错误时它自身报错；<code>@ts-ignore</code> 无条件吞掉错误，不能用于测试。</li>
<li>精确相等：用 <code>Equal&lt;A, B&gt;</code> 工具类型，或 Vitest 的 <code>expectTypeOf(x).toEqualTypeOf&lt;T&gt;()</code>。</li>
<li>测试联合输入、只读输入、空数组、<code>never</code> 等边界，以及从包名导入的真实入口。</li>
<li>类型测试的结果依赖 <code>strict</code>、<code>exactOptionalPropertyTypes</code> 和 TypeScript 版本，配置要与发布时一致。</li>
</ul>
<h2>正向与负向</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> wrap&lt;T&gt;(<span class="hljs-attr">value</span>: T): { <span class="hljs-attr">value</span>: T } {
  <span class="hljs-keyword">return</span> { value };
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">literal</span>: <span class="hljs-string">&#x27;ready&#x27;</span> = <span class="hljs-title function_">wrap</span>(<span class="hljs-string">&#x27;ready&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>).<span class="hljs-property">value</span>;

<span class="hljs-comment">// @ts-expect-error 字符串不能赋给 number</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">impossible</span>: <span class="hljs-built_in">number</span> = <span class="hljs-title function_">wrap</span>(<span class="hljs-string">&#x27;text&#x27;</span>).<span class="hljs-property">value</span>;
</code></pre></div>
<p><code>@ts-expect-error</code> 只证明&quot;有错误&quot;，不证明是预期的那个错误。注释后写清原因，并让每条只覆盖一个表达式。</p>
<h2>精确相等</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Equal</span>&lt;A, B&gt; =
  (&lt;T&gt;<span class="hljs-function">() =&gt;</span> T <span class="hljs-keyword">extends</span> A ? <span class="hljs-number">1</span> : <span class="hljs-number">2</span>) <span class="hljs-title function_">extends</span> (&lt;T&gt;<span class="hljs-function">() =&gt;</span> T <span class="hljs-keyword">extends</span> B ? <span class="hljs-number">1</span> : <span class="hljs-number">2</span>) ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Expect</span>&lt;T <span class="hljs-keyword">extends</span> <span class="hljs-literal">true</span>&gt; = T;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Cases</span> = [
  <span class="hljs-title class_">Expect</span>&lt;<span class="hljs-title class_">Equal</span>&lt;<span class="hljs-title class_">ReturnType</span>&lt;<span class="hljs-keyword">typeof</span> wrap&lt;<span class="hljs-built_in">number</span>&gt;&gt;, { <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span> }&gt;&gt;,
  <span class="hljs-comment">// @ts-expect-error any 与 number 不相等</span>
  <span class="hljs-title class_">Expect</span>&lt;<span class="hljs-title class_">Equal</span>&lt;<span class="hljs-built_in">any</span>, <span class="hljs-built_in">number</span>&gt;&gt;,
];
</code></pre></div>
<p>普通赋值无法区分 <code>any</code>，这个技巧利用了编译器对两个泛型函数类型是否相同的比较。</p>
<h2>用 Vitest</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// wrap.test-d.ts</span>
<span class="hljs-keyword">import</span> { expectTypeOf, test } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;
<span class="hljs-keyword">import</span> { wrap } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./wrap&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;wrap 保留输入类型&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">expectTypeOf</span>(<span class="hljs-title function_">wrap</span>(<span class="hljs-number">1</span>)).<span class="hljs-property">toEqualTypeOf</span>&lt;{ <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span> }&gt;();
  <span class="hljs-title function_">expectTypeOf</span>(wrap).<span class="hljs-title function_">parameter</span>(<span class="hljs-number">0</span>).<span class="hljs-title function_">toBeUnknown</span>();
});
</code></pre></div>
<p><code>vitest --typecheck</code> 会对 <code>*.test-d.ts</code> 运行 tsc，不执行代码。tsd、<code>@arethetypeswrong/cli</code> 适合检查发布后的包。</p>
<h2>重载与联合</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">number</span>;
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">parse</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">fromText</span>: <span class="hljs-built_in">number</span> = <span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;42&#x27;</span>);
<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>;
<span class="hljs-comment">// @ts-expect-error 没有接受联合的公开签名</span>
<span class="hljs-title function_">parse</span>(input);
</code></pre></div>
<p>如果业务需要接受联合，修改 API 并更新测试，而不是删掉测试。</p>
<h2>与运行时测试的分工</h2>
<p>类型测试证明编译器接受或拒绝某些写法；运行时测试证明 JavaScript 行为正确。<code>.d.ts</code> 写错时运行时测试发现不了，<code>JSON.parse</code> 的结果是否合法类型测试也管不了。库项目两者都需要。</p>
<h2>常见追问</h2>
<ul>
<li>类型测试放在哪里？单独的 <code>*.test-d.ts</code> 或 <code>type-tests/</code> 目录，并纳入 CI 的 <code>tsc --noEmit</code>。</li>
<li>升级 TypeScript 后测试失败怎么办？逐条看新增或消失的诊断，判断是修正了旧的错误推断还是 API 真的变了，再决定改实现还是改测试。</li>
</ul>`};export{e as default};