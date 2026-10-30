var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如 <code>document.getElementById(&#x27;main_canvas&#x27;)</code> 只能推断出 <code>HTMLElement | null</code>，可你知道页面上那个元素一定是画布，就可以写 <code>as HTMLCanvasElement</code>，让编译器按画布的类型来检查后面的代码。这就是类型断言：你比编译器多知道一点信息，直接告诉它。</p>
<p>断言只影响编译期，编译后会被删掉，运行时没有任何检查，断言错了也不会抛错或者变成 <code>null</code>。所以 TypeScript 给断言设了一道限制：只能把类型转成更具体或更宽泛的版本，<code>&#x27;hello&#x27; as number</code> 这种两边毫无关系的会报错。非空断言 <code>x!</code> 是一种特殊的断言，表示“这个值不是 <code>null</code> 也不是 <code>undefined</code>”，同样没有运行时检查。</p>
<p>如果确实要在两个没关系的类型之间转，可以先转成 <code>unknown</code> 或 <code>any</code> 再转成目标类型，也就是 <code>as unknown as T</code>。因为任何类型都能转成 <code>unknown</code>，<code>unknown</code> 也能转成任何类型，这道限制就被绕过去了。它等于完全放弃了检查，只适合测试替身这类明确知道在做什么的场合。</p>
<p><code>satisfies</code> 和它们方向相反。<code>value satisfies T</code> 不改变值的类型，只检查 <code>value</code> 能不能赋给 <code>T</code>，少写必填属性、拼错键名都会报错。所以想“确认值符合某个类型”时用 <code>satisfies</code> 或类型注解，不要用 <code>as</code>。</p>
</blockquote>
<h2>断言改的是编译器的看法</h2>
<p>下面这段代码能通过 <code>tsc --strict</code>（用 TypeScript 7.0.2 验证）。看每一处断言，编译器检查了什么、没检查什么。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">User</span> = { <span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> };

<span class="hljs-keyword">const</span> <span class="hljs-attr">raw</span>: <span class="hljs-built_in">unknown</span> = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{&quot;id&quot;:1,&quot;name&quot;:&quot;Ada&quot;}&#x27;</span>);
<span class="hljs-keyword">const</span> user = raw <span class="hljs-keyword">as</span> <span class="hljs-title class_">User</span>;
user.<span class="hljs-property">name</span>.<span class="hljs-title function_">toUpperCase</span>();

<span class="hljs-comment">// @ts-expect-error 2352：string 和 number 没有足够的重叠</span>
<span class="hljs-keyword">const</span> n = <span class="hljs-string">&#x27;hello&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-built_in">number</span>;

<span class="hljs-keyword">const</span> forced = <span class="hljs-string">&#x27;hello&#x27;</span> <span class="hljs-keyword">as</span> <span class="hljs-built_in">unknown</span> <span class="hljs-keyword">as</span> <span class="hljs-built_in">number</span>;

<span class="hljs-keyword">const</span> partial = {} <span class="hljs-keyword">as</span> <span class="hljs-title class_">User</span>;
</code></pre></div>
<p><code>raw as User</code> 能通过，是因为 <code>unknown</code> 可以转成任何类型。可编译器并没有检查 JSON 里真的有 <code>name</code>，如果接口返回的数据少了这个字段，<code>user.name.toUpperCase()</code> 会在运行时报错。外部数据要在运行时校验，见<a href="/questions/ts-runtime-schema/">《为什么 TypeScript 不能替代接口数据校验？》</a>。</p>
<p><code>&#x27;hello&#x27; as number</code> 报的是 TS2352，错误信息说两个类型“没有足够的重叠”，建议先转成 <code>unknown</code>。这就是 Handbook 里说的规则：断言只允许转成更具体或更宽泛的版本，用来拦住明显不可能的转换。</p>
<p><code>as unknown as number</code> 照着错误信息的建议做了，于是不再报错。可 <code>forced</code> 运行时仍然是字符串，调用 <code>toFixed</code> 就会出错。</p>
<p><code>{} as User</code> 也能通过，因为 <code>User</code> 比 <code>{}</code> 更具体，属于允许的方向。可这个对象既没有 <code>id</code> 也没有 <code>name</code>，编译器不会提醒。这是断言最常见的误用：本来想表达“这个对象是 User”，结果把必填属性的检查也跳过了。</p>
<h2>非空断言 x!</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">len</span>(<span class="hljs-params"><span class="hljs-attr">text</span>?: <span class="hljs-built_in">string</span> | <span class="hljs-literal">null</span></span>) {
  <span class="hljs-keyword">return</span> text!.<span class="hljs-property">length</span>;
}
</code></pre></div>
<p><code>text</code> 的类型是 <code>string | null | undefined</code>，直接读 <code>.length</code> 会报错。加上 <code>!</code> 以后，编译器把它当成 <code>string</code>。Handbook 说明，<code>!</code> 和其他断言一样不改变运行时行为，所以只有确定值不可能是 <code>null</code> 或 <code>undefined</code> 时才该用。调用 <code>len()</code> 不传参数，运行时照样会报错。</p>
<p>能用判断代替时，优先用判断或可选链，比如 <code>text?.length ?? 0</code>。判断之后编译器会自动缩小类型，见<a href="/questions/ts-narrowing/">《TypeScript 怎样通过控制流缩小类型？》</a>。</p>
<h2>satisfies 检查而不改写</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Config</span> = { <span class="hljs-attr">port</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">host</span>?: <span class="hljs-built_in">string</span> };

<span class="hljs-keyword">const</span> config = { <span class="hljs-attr">port</span>: <span class="hljs-number">3000</span> } <span class="hljs-keyword">satisfies</span> <span class="hljs-title class_">Config</span>;
config.<span class="hljs-property">port</span>.<span class="hljs-title function_">toFixed</span>();

<span class="hljs-comment">// @ts-expect-error 拼错的键会被 satisfies 拦下</span>
<span class="hljs-keyword">const</span> bad = { <span class="hljs-attr">prot</span>: <span class="hljs-number">3000</span> } <span class="hljs-keyword">satisfies</span> <span class="hljs-title class_">Config</span>;

<span class="hljs-keyword">const</span> asserted = { <span class="hljs-attr">host</span>: <span class="hljs-string">&#x27;localhost&#x27;</span> } <span class="hljs-keyword">as</span> <span class="hljs-title class_">Config</span>;
asserted.<span class="hljs-property">port</span>.<span class="hljs-title function_">toFixed</span>();
</code></pre></div>
<p><code>satisfies</code> 把 <code>prot</code> 拼错的对象拦了下来。换成 <code>as Config</code>，缺少 <code>port</code> 的对象照样能通过，<code>asserted.port</code> 的类型是 <code>number</code>，可运行时它是 <code>undefined</code>。</p>
<p>所以两者的方向不同：<code>as</code> 是“我说它是这个类型，你别管”，<code>satisfies</code> 是“请帮我检查它符合这个类型”。<code>satisfies</code> 和类型注解、<code>as const</code> 的更多对比见<a href="/questions/ts-satisfies-const/">《as const、类型注解和 satisfies 有什么不同？》</a>。</p>
<h2>常见追问</h2>
<p><strong>尖括号写法 <code>&lt;T&gt;value</code> 和 <code>value as T</code> 有区别吗？</strong></p>
<blockquote>
<p>两者等价。但尖括号在 <code>.tsx</code> 文件里会和 JSX 冲突，所以不能用，日常统一写 <code>as</code> 更省事。</p>
</blockquote>
<p><strong>什么时候用断言是合理的？</strong></p>
<blockquote>
<p>编译器确实缺信息、而你能保证正确的时候。比如通过 ID 拿到一个确定是画布的 DOM 元素，或者在单元测试里构造一个只实现了部分方法的替身对象。接口返回的数据、用户输入这类没法保证的值，应该做运行时校验，而不是断言。</p>
</blockquote>
<p><strong><code>any</code> 和 <code>as unknown as</code> 有什么不同？</strong></p>
<blockquote>
<p><code>as unknown as T</code> 只在这一处放弃检查，结果是一个确定的类型 <code>T</code>，后面的代码照常检查。<code>any</code> 会一路传染，从它取出的属性、调用的返回值也都是 <code>any</code>，检查一直被关掉。两者都应少用，详见<a href="/questions/ts-unknown/">《any、unknown 和 never 分别适合什么场景？》</a>。</p>
</blockquote>`};export{e as default};