var e={answerHtml:`<p>假设一个函数把传入的值原样返回。写成 <code>(value: any) =&gt; any</code>，虽然能接收任何输入，却丢掉了“返回值与输入是同一种类型”的关系；写成 unknown 则要求调用方重新检查返回值。</p>
<p>泛型可以把这个关系保留下来：调用时确定 T，参数与返回值共同使用这一份 T。它主要是在描述类型之间的关联，不是让函数在运行时获得一个可以随意检查的“类型对象”。</p>
<h3>最简单的关系是输入什么，返回什么</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> identity&lt;T&gt;(<span class="hljs-attr">value</span>: T): T {
  <span class="hljs-keyword">return</span> value;
}

<span class="hljs-keyword">const</span> source = [<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;CSS&#x27;</span>];
<span class="hljs-keyword">const</span> result = <span class="hljs-title function_">identity</span>(source);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result === source); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// HTML,CSS</span>
</code></pre></div>
<p>这里 T 从输入推导为字符串数组，返回值保留对应数组能力。identity 没有复制数组，也没有把它变成另一种表示；泛型只描述这个调用的类型关系。</p>
<p>大多数使用场景应让编译器从参数推导类型，不必每次都手写类型实参。显式指定类型可以用于推导不足或需要明确契约的情况，但不能借此声称运行时数据已经符合该类型。</p>
<h3>约束说明实现最低可以依赖什么</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> longer&lt;T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">length</span>: <span class="hljs-built_in">number</span> }&gt;(<span class="hljs-attr">first</span>: T, <span class="hljs-attr">second</span>: T): T {
  <span class="hljs-keyword">return</span> first.<span class="hljs-property">length</span> &gt;= second.<span class="hljs-property">length</span> ? first : second;
}

<span class="hljs-keyword">const</span> selected = <span class="hljs-title function_">longer</span>(<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-string">&#x27;TypeScript&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(selected); <span class="hljs-comment">// TypeScript</span>
</code></pre></div>
<p>T extends { length:number } 表示传入类型必须具备所需的 length 能力，函数实现因此可以访问 length。它不表示 T 必须在运行时继承某个类，也不表示只允许字符串。</p>
<p>约束仍保留调用时的具体类型。返回的是传入的其中一个值，调用方可以继续获得相应的具体类型信息，而不是只得到一个孤立的 <code>{ length:number }</code>。</p>
<p>不同参数能否共同推导出一个 T，还取决于实际输入和推导规则，不能假定编译器总会自动拼出任意联合。若业务本就允许不同输入类型并返回联合，应把这个关系明确建模。</p>
<h3>满足约束，不代表一个新对象一定就是 T</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> ensureLength&lt;T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">length</span>: <span class="hljs-built_in">number</span> }&gt;(<span class="hljs-attr">value</span>: T, <span class="hljs-attr">minimum</span>: <span class="hljs-built_in">number</span>): T {
  <span class="hljs-keyword">if</span> (value.<span class="hljs-property">length</span> &gt;= minimum) <span class="hljs-keyword">return</span> value;

  <span class="hljs-comment">// @ts-expect-error 仅有 length 的对象不一定满足调用方选择的完整 T</span>
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">length</span>: minimum };
}
</code></pre></div>
<p>调用方可能把 T 选为带额外字段的对象、字符串或数组。新建 <code>{ length: minimum }</code> 只满足约束，不满足所有可能的具体 T。因此编译器拒绝这条 return 是合理的，不应该用 <code>as T</code> 随意压掉。</p>
<p>修复应回到真实契约：如果只需要保证 length，就把返回类型也定义为那个较宽结构；如果必须返回完整 T，可以要求调用方提供构造 T 的工厂，或者只允许返回已有 T。不能让泛型函数凭空知道怎样构造未知的具体类型。</p>
<h3>让键和返回属性类型建立关联</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> getProperty&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt;(<span class="hljs-attr">object</span>: T, <span class="hljs-attr">key</span>: K): T[K] {
  <span class="hljs-keyword">return</span> <span class="hljs-built_in">object</span>[key];
}

<span class="hljs-keyword">const</span> user = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;Lin&#x27;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">24</span> };
<span class="hljs-keyword">const</span> age = <span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&#x27;age&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(age.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 24</span>

<span class="hljs-comment">// @ts-expect-error missing 不属于 user 的已知键</span>
<span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&#x27;missing&#x27;</span>);
</code></pre></div>
<p>K 必须来自 T 的键集合，T[K] 则表示选中那个键对应的属性类型。传 age 时，返回类型是 number；传 name 时，返回类型是 string。</p>
<p>若把 key 写成任意 string，函数就无法保证键一定存在，也很难准确表达返回值与这个键的关联。索引签名、可选属性和联合类型会进一步影响结果，应按实际模型处理，而不是把每次索引都断言成一定成功。</p>
<h3>泛型返回值也需要考虑空输入</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> first&lt;T&gt;(<span class="hljs-attr">items</span>: <span class="hljs-keyword">readonly</span> T[]): T | <span class="hljs-literal">undefined</span> {
  <span class="hljs-keyword">return</span> items[<span class="hljs-number">0</span>];
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">first</span>([<span class="hljs-number">10</span>, <span class="hljs-number">20</span>])); <span class="hljs-comment">// 10</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">first</span>([])); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>传入 T[] 并不说明数组一定有第一项。明确返回 T | undefined，比依赖某个编译选项恰好没有报错更符合运行时事实。</p>
<p>如果函数只接受非空输入，可以把参数设计成非空元组等结构，再相应地承诺返回 T。readonly 参数则允许函数接收只读数组，也表达它不需要通过参数修改数组内容，但不会自动深度冻结元素对象。</p>
<h3>泛型不能把未知 JSON 自动变成领域对象</h3>
<p>调用一个返回 Promise 的请求封装，并指定 T 为 User，只是在建立编译期的使用预期。网络响应不会因为 <code>&lt;User&gt;</code> 就接受 User 校验。</p>
<p>可以把真正的解析函数作为参数，让泛型连接解析器输出与函数返回：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> parseJson&lt;T&gt;(<span class="hljs-attr">text</span>: <span class="hljs-built_in">string</span>, <span class="hljs-attr">parse</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span></span>) =&gt;</span> T): T {
  <span class="hljs-keyword">const</span> <span class="hljs-attr">input</span>: <span class="hljs-built_in">unknown</span> = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(text);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">parse</span>(input);
}
</code></pre></div>
<p>这里 parse 必须用真实检查建立 T，或由符合契约的 schema 解析器完成。泛型的作用是保留 parse 已经表达的返回类型，而不是替 parse 实现验证。</p>
<h3>类型参数越多不代表设计越好</h3>
<p>一个类型参数只出现一次、没有建立输入输出或参数之间的实际关系时，可能只是让调用方多填一个名字。可以检查它是否能改成具体类型、unknown、普通联合或更简单的回调签名。</p>
<p>也不要把所有分支关系都塞进复杂条件类型。简单重载、明确的联合返回值或拆分函数，有时能提供更清楚的错误信息。好的泛型应该让调用方保留需要的信息，并让实现真的能兑现承诺，而不是依靠大量断言维持表面上的精确类型。</p>`};export{e as default};