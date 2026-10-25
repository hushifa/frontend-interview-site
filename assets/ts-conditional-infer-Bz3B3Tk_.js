var e={answerHtml:`<p>条件类型写成 <code>T extends U ? X : Y</code>，意思是根据 T 能否满足 U 的类型关系，选择 X 或 Y。这里的 extends 不是运行时的 instanceof，也不会在 JavaScript 中生成一个 if。</p>
<p>它适合表达“如果输入类型具有某种结构，就提取其中一部分，否则给出另一个类型”，避免为每种具体类型手工重复声明。</p>
<h3>先看一个读取消息类型的条件</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MessageOf</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> { <span class="hljs-attr">message</span>: <span class="hljs-built_in">unknown</span> } ? T[<span class="hljs-string">&#x27;message&#x27;</span>] : <span class="hljs-built_in">never</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">TextMessage</span> = <span class="hljs-title class_">MessageOf</span>&lt;{ <span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span> }&gt;;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">NoMessage</span> = <span class="hljs-title class_">MessageOf</span>&lt;{ <span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span> }&gt;;

<span class="hljs-keyword">const</span> <span class="hljs-attr">message</span>: <span class="hljs-title class_">TextMessage</span> = <span class="hljs-string">&#x27;加载失败&#x27;</span>;

<span class="hljs-comment">// @ts-expect-error TextMessage 是 string，不接受 number</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">wrongMessage</span>: <span class="hljs-title class_">TextMessage</span> = <span class="hljs-number">123</span>;
</code></pre></div>
<p>当 T 有 message 成员时，结果是该成员的类型。没有相应成员时，这份工具选择 never，表示没有可提取的消息类型；也可以按接口需要设计成其他回退，但要把语义说明白。</p>
<p>条件类型是在处理类型，不会从一个真实对象里取出 message 值。运行时代码如果要安全访问未知输入，仍然需要相应检查。</p>
<h3>infer 在正在匹配的结构中命名一部分类型</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ElementOf</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-title function_">readonly</span> (infer <span class="hljs-title class_">Item</span>)[] ? <span class="hljs-title class_">Item</span> : <span class="hljs-built_in">never</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Numbers</span> = <span class="hljs-title class_">ElementOf</span>&lt;<span class="hljs-built_in">number</span>[]&gt;; <span class="hljs-comment">// number</span>
<span class="hljs-keyword">type</span> <span class="hljs-title class_">TupleValues</span> = <span class="hljs-title class_">ElementOf</span>&lt;<span class="hljs-keyword">readonly</span> [<span class="hljs-string">&#x27;ok&#x27;</span>, <span class="hljs-number">1</span>]&gt;; <span class="hljs-comment">// &#x27;ok&#x27; | 1</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">FunctionResult</span>&lt;T&gt; =
  T <span class="hljs-title function_">extends</span> (...<span class="hljs-attr">args</span>: infer <span class="hljs-title class_">Parameters</span>) =&gt; infer <span class="hljs-title class_">Result</span> ? <span class="hljs-title class_">Result</span> : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">NameResult</span> = <span class="hljs-title class_">FunctionResult</span>&lt;<span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">id</span>: <span class="hljs-built_in">number</span></span>) =&gt;</span> <span class="hljs-built_in">string</span>&gt;; <span class="hljs-comment">// string</span>
</code></pre></div>
<p>Item 是在数组结构匹配成功时推导出的元素类型，不是外部额外传进来的参数。readonly 写在匹配结构里，让普通数组和只读数组都能参与；如果只匹配可变数组，某些只读元组就不符合条件。</p>
<p>函数例子中，infer 同时匹配参数列表与返回部分，这里最终只使用 Result。实际业务可优先使用已有的 ReturnType、Parameters、Awaited 等工具，不必为了展示 infer 再维护一套语义相同的复杂实现。</p>
<p>infer 不是运行时反射，也不会读取一个函数执行后到底返回了什么。它根据已有静态签名推导；签名不准确时，推导结果不会自动变成真实数据的证明。</p>
<h3>裸类型参数会把联合拆开计算</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ToArray</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">unknown</span> ? T[] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Separated</span> = <span class="hljs-title class_">ToArray</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>&gt;; <span class="hljs-comment">// string[] | number[]</span>

<span class="hljs-keyword">const</span> <span class="hljs-attr">onlyText</span>: <span class="hljs-title class_">Separated</span> = [<span class="hljs-string">&#x27;HTML&#x27;</span>];
<span class="hljs-keyword">const</span> <span class="hljs-attr">onlyNumbers</span>: <span class="hljs-title class_">Separated</span> = [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>];

<span class="hljs-comment">// @ts-expect-error 结果要求是其中一种数组，不是任意混合数组</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">mixed</span>: <span class="hljs-title class_">Separated</span> = [<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-number">1</span>];
</code></pre></div>
<p>因为条件左侧直接是类型参数 T，传入 string | number 时会分别计算：先得到 string[]，再得到 number[]，最后把两者联合起来。</p>
<p>这与 <code>(string | number)[]</code> 不同。前者表示数组整体属于字符串数组或数字数组之一，后者允许同一个数组里混合两种值。理解这一步，很多看似古怪的条件类型结果就能展开推导。</p>
<p>“只要类型里出现联合就一定分发”是不准确的。关键在于条件检查位置是否是符合分发规则的裸类型参数。</p>
<h3>用元组包装，改为判断整个联合</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ToArrayTogether</span>&lt;T&gt; = [T] <span class="hljs-keyword">extends</span> [<span class="hljs-built_in">unknown</span>] ? T[] : <span class="hljs-built_in">never</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Together</span> = <span class="hljs-title class_">ToArrayTogether</span>&lt;<span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span>&gt;; <span class="hljs-comment">// (string | number)[]</span>

<span class="hljs-keyword">const</span> <span class="hljs-attr">accepted</span>: <span class="hljs-title class_">Together</span> = [<span class="hljs-string">&#x27;HTML&#x27;</span>, <span class="hljs-number">1</span>];
</code></pre></div>
<p>方括号在这里形成一元素元组类型，使条件检查的左侧不再直接是裸 T。因此整个 string | number 一起通过判断，然后放进同一个数组元素类型中。</p>
<p>常见的 <code>[T] extends [U]</code> 写法不是特殊的括号装饰，而是通过包装类型改变了分发条件。是否应该阻止分发，要根据工具是在逐成员处理，还是在判断整体关系。</p>
<h3>never 为什么经常让结果消失</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">IsNeverDistributed</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">never</span> ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">IsNever</span>&lt;T&gt; = [T] <span class="hljs-keyword">extends</span> [<span class="hljs-built_in">never</span>] ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Lost</span> = <span class="hljs-title class_">IsNeverDistributed</span>&lt;<span class="hljs-built_in">never</span>&gt;; <span class="hljs-comment">// never</span>
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Found</span> = <span class="hljs-title class_">IsNever</span>&lt;<span class="hljs-built_in">never</span>&gt;; <span class="hljs-comment">// true</span>
</code></pre></div>
<p>never 可以理解为没有成员的联合。分布式条件面对它时，没有任何成员可计算，因此结果仍是 never，并不会像普通直觉中的 if 一样得到 true。</p>
<p>元组包装后变成整体判断，才能表达“这个类型是否就是 never”。在 Exclude、Extract 一类按成员筛选的工具里，never 与其他类型联合时消失，恰好可以表示被排除的成员；它不是计算过程出了随机错误。</p>
<h3>any、重载与递归需要额外谨慎</h3>
<p>any 在许多条件类型中会使判断结果包含两侧分支，或者继续传播成更宽泛结果，具体取决于表达式。不能把它当作一个稳定的普通联合成员分析，也不应为了让类型运算通过就随便加入 any。</p>
<p>对重载函数进行返回类型推导，通常依据最后一个相关调用签名，而不是像实际调用表达式一样自动为某组参数挑选重载。例如 ReturnType 不会因为调用者心里想的是某个入参，就只得到那个重载的返回值。</p>
<p>递归条件类型可以展开嵌套结构，但也会增加实例化深度、联合规模和编译成本。内置工具已经覆盖的场景应优先复用；必须自定义时，用普通类型、联合、never、any、只读结构和实际重载分别验证。</p>
<p>好的类型工具应让调用方少写重复关系，同时保留可理解的错误信息。如果一个简单数据结构需要很长的递归条件和多层断言才能使用，通常值得先检查业务模型是否可以简化。</p>`};export{e as default};