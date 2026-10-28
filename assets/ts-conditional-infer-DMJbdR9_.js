var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>T extends U ? X : Y</code>：T 能赋值给 U 时得到 X，否则得到 Y。这里的 <code>extends</code> 是可赋值判断，不是继承。</li>
<li><code>infer R</code> 在匹配成功时推断出某一部分类型，内置的 <code>ReturnType</code>、<code>Parameters</code>、<code>Awaited</code> 都基于它。</li>
<li>条件左侧是裸类型参数 <code>T</code> 时，传入 <code>A | B</code> 会分别计算再合并结果，这叫分布式条件类型；<code>Exclude</code>、<code>Extract</code>、<code>NonNullable</code> 依赖它。</li>
<li>写成 <code>[T] extends [U]</code> 不再分布，把联合作为整体判断。</li>
<li><code>never</code> 被视为空联合，分布式条件类型对它的结果是 <code>never</code>；判断是否为 never 要用 <code>[T] extends [never]</code>。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MessageOf</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">message</span>: <span class="hljs-built_in">unknown</span> } ? T[<span class="hljs-string">&#x27;message&#x27;</span>] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> A = <span class="hljs-title class_">MessageOf</span>&lt;{ <span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span> }&gt;; <span class="hljs-comment">// string</span>
<span class="hljs-keyword">type</span> B = <span class="hljs-title class_">MessageOf</span>&lt;{ <span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span> }&gt;;      <span class="hljs-comment">// never</span>
</code></pre></div>
<h2>infer</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ElementOf</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-title function_">readonly</span> (infer <span class="hljs-title class_">Item</span>)[] ? <span class="hljs-title class_">Item</span> : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> C = <span class="hljs-title class_">ElementOf</span>&lt;<span class="hljs-built_in">number</span>[]&gt;;              <span class="hljs-comment">// number</span>
<span class="hljs-keyword">type</span> D = <span class="hljs-title class_">ElementOf</span>&lt;<span class="hljs-keyword">readonly</span> [<span class="hljs-string">&#x27;ok&#x27;</span>, <span class="hljs-number">1</span>]&gt;;    <span class="hljs-comment">// &#x27;ok&#x27; | 1</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyReturnType</span>&lt;T&gt; = T <span class="hljs-title function_">extends</span> (...<span class="hljs-attr">args</span>: <span class="hljs-built_in">any</span>[]) =&gt; infer R ? R : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> E = <span class="hljs-title class_">MyReturnType</span>&lt;<span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span></span>) =&gt;</span> <span class="hljs-built_in">string</span>&gt;; <span class="hljs-comment">// string</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">UnwrapPromise</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-title class_">Promise</span>&lt;infer V&gt; ? <span class="hljs-title class_">UnwrapPromise</span>&lt;V&gt; : T;
<span class="hljs-keyword">type</span> F = <span class="hljs-title class_">UnwrapPromise</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">number</span>&gt;&gt;&gt;; <span class="hljs-comment">// number</span>
</code></pre></div>
<p><code>infer</code> 可以加约束：<code>T extends [infer H extends string, ...unknown[]] ? H : never</code>。对重载函数使用 <code>ReturnType</code> 时，取的是最后一个重载签名。</p>
<h2>分布式</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ToArray</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span> ? T[] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> G = <span class="hljs-title class_">ToArray</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>&gt;; <span class="hljs-comment">// string[] | number[]</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">ToArrayTogether</span>&lt;T&gt; = [T] <span class="hljs-keyword">extends</span> [<span class="hljs-built_in">unknown</span>] ? T[] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> H = <span class="hljs-title class_">ToArrayTogether</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>&gt;; <span class="hljs-comment">// (string | number)[]</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyExclude</span>&lt;T, U&gt; = T <span class="hljs-keyword">extends</span> U ? <span class="hljs-built_in">never</span> : T;
<span class="hljs-keyword">type</span> I = <span class="hljs-title class_">MyExclude</span>&lt;<span class="hljs-string">&#x27;a&#x27;</span> | <span class="hljs-string">&#x27;b&#x27;</span> | <span class="hljs-string">&#x27;c&#x27;</span>, <span class="hljs-string">&#x27;a&#x27;</span>&gt;; <span class="hljs-comment">// &#x27;b&#x27; | &#x27;c&#x27;</span>
</code></pre></div>
<p>只有&quot;条件左侧直接是被实例化的类型参数&quot;才会分布，<code>T[] extends ...</code> 或 <code>[T] extends ...</code> 都不会。</p>
<h2>never 与 any</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">IsNeverWrong</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">never</span> ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">IsNever</span>&lt;T&gt; = [T] <span class="hljs-keyword">extends</span> [<span class="hljs-built_in">never</span>] ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> J = <span class="hljs-title class_">IsNeverWrong</span>&lt;<span class="hljs-built_in">never</span>&gt;; <span class="hljs-comment">// never</span>
<span class="hljs-keyword">type</span> K = <span class="hljs-title class_">IsNever</span>&lt;<span class="hljs-built_in">never</span>&gt;;      <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>any</code> 作为被检查类型时，结果是两个分支的联合：<code>any extends string ? 1 : 2</code> 得到 <code>1 | 2</code>。</p>
<h2>使用建议</h2>
<p>递归条件类型能处理嵌套结构（如深层 <code>Readonly</code>），但会拖慢类型检查、让错误信息难以阅读。内置工具类型能满足时优先使用；业务代码中一个简单的重载或联合往往比复杂的类型体操更好维护。</p>
<h2>常见追问</h2>
<ul>
<li>怎样把联合转成交叉？利用函数参数位置的逆变推断：<code>(U extends any ? (x: U) =&gt; void : never) extends (x: infer I) =&gt; void ? I : never</code>。</li>
<li>模板字面量能 infer 吗？能：<code>T extends </code>\${infer Head}/\${infer Rest}<code> ? Head : T</code> 可以拆分路径。</li>
</ul>`};export{e as default};