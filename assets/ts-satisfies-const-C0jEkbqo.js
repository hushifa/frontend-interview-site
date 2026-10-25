var e={answerHtml:`<p>配置对象经常同时有两个需求：写错字段时希望编译器报警，又不想把每个字段都推宽成一个难用的大联合。类型注解、as const 与 satisfies 可以分别帮助解决不同部分，但不能互相当成同义写法。</p>
<p>还要区分 const 变量声明与 as const：const 只限制变量绑定重新赋值，普通对象的属性仍可以修改，因此属性类型仍可能被推宽；as const 进一步影响字面量表达式的类型推导。</p>
<h3>类型注解让变量按目标契约使用</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Color</span> = <span class="hljs-string">&#x27;red&#x27;</span> | <span class="hljs-string">&#x27;green&#x27;</span>;
<span class="hljs-keyword">type</span> <span class="hljs-variable constant_">RGB</span> = <span class="hljs-keyword">readonly</span> [<span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>];

<span class="hljs-keyword">const</span> <span class="hljs-attr">annotated</span>: <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">Color</span>, <span class="hljs-built_in">string</span> | <span class="hljs-variable constant_">RGB</span>&gt; = {
  <span class="hljs-attr">red</span>: [<span class="hljs-number">255</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>],
  <span class="hljs-attr">green</span>: <span class="hljs-string">&#x27;#00ff00&#x27;</span>,
};

<span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> annotated.<span class="hljs-property">green</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(annotated.<span class="hljs-property">green</span>.<span class="hljs-title function_">toUpperCase</span>()); <span class="hljs-comment">// #00FF00</span>
}
</code></pre></div>
<p>目标契约允许每个颜色是字符串或 RGB 元组。变量采用这份类型之后，读取 green 时不能只凭初始化时看见字符串就在所有使用位置永久忽略另一种可能，使用字符串方法前需要合适的收窄。</p>
<p>这在希望变量以后接受同一契约中的其他合法值时很合理。但如果配置表是固定的，我们可能更希望保留每个属性实际采用的形态。</p>
<h3>satisfies 检查形状，同时保留更具体的成员类型</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> palette = {
  <span class="hljs-attr">red</span>: [<span class="hljs-number">255</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>],
  <span class="hljs-attr">green</span>: <span class="hljs-string">&#x27;#00ff00&#x27;</span>,
} <span class="hljs-keyword">satisfies</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">Color</span>, <span class="hljs-built_in">string</span> | <span class="hljs-variable constant_">RGB</span>&gt;;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(palette.<span class="hljs-property">green</span>.<span class="hljs-title function_">toUpperCase</span>()); <span class="hljs-comment">// #00FF00</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(palette.<span class="hljs-property">red</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 255,0,0</span>
</code></pre></div>
<p>编译器检查 palette 是否满足指定键和值的约束，同时保留表达式推导出的更具体结构，所以 green 可以直接用字符串方法，red 也仍有数组/元组能力。</p>
<p>对象字面量中拼错键、缺少必需键或提供不符合类型的值，仍然会被发现。satisfies 不是为表达式生成一个“是否通过校验”的布尔值，运行时的 palette 仍然是原来那个对象。</p>
<p>也不能把 satisfies 看成字段白名单过滤。像其他结构兼容检查一样，已有变量携带额外属性的情形与新鲜字面量检查不同，运行时额外字段不会被自动删除。</p>
<h3>它不保证推导与完全没有上下文时一模一样</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> request = {
  <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span>,
} <span class="hljs-keyword">satisfies</span> { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> | <span class="hljs-string">&#x27;POST&#x27;</span> };

<span class="hljs-comment">// @ts-expect-error 此处 method 被保留为具体的 &#x27;GET&#x27;，不能赋成 &#x27;POST&#x27;</span>
request.<span class="hljs-property">method</span> = <span class="hljs-string">&#x27;POST&#x27;</span>;
</code></pre></div>
<p>satisfies 的目标类型可以参与上下文推导。这里 method 得到的是具体字面量 &#x27;GET&#x27;，而不是一个以后可以随意在 GET、POST 间切换的宽联合。</p>
<p>如果业务需要后续修改为两者之一，直接给变量明确的 <code>{ method: &#x27;GET&#x27; | &#x27;POST&#x27; }</code> 注解可能更符合目的。不能把“保留表达式类型”理解成“它绝不对推导上下文产生任何影响”。</p>
<h3>as const 保留字面量，也引入相应只读约束</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> point = [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
<span class="hljs-keyword">const</span> options = { <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;compact&#x27;</span>, <span class="hljs-attr">enabled</span>: <span class="hljs-literal">true</span> } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;

<span class="hljs-comment">// @ts-expect-error point 是只读元组</span>
point[<span class="hljs-number">0</span>] = <span class="hljs-number">30</span>;

<span class="hljs-comment">// @ts-expect-error options.mode 是只读属性</span>
options.<span class="hljs-property">mode</span> = <span class="hljs-string">&#x27;comfortable&#x27;</span>;
</code></pre></div>
<p>point 被推导为 readonly [10,20]，不是普通 number[]；options 中的字面属性也保持具体值并带有只读约束。这有助于构造稳定的字面量联合、路由列表和判别字段。</p>
<p>但 as const 不是执行 Object.freeze。类型约束可以阻止正常 TypeScript 代码这样写，不能让 JavaScript 运行时自动拒绝所有修改。</p>
<h3>外部可变对象不会因被引用就全部冻结</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> values = [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>];
<span class="hljs-keyword">const</span> config = { <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;compact&#x27;</span>, values } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;

config.<span class="hljs-property">values</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">3</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(config.<span class="hljs-property">values</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 1,2,3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">isFrozen</span>(config)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>config.values 这个属性本身受到只读约束，不应被重新指定成另一个数组。但 values 已经是一个外部可变数组，通过这个引用调用 push 仍然允许。把对象放进一个 as const 字面量，不会自动把所有可达数据递归变成不可变对象。</p>
<p>需要只读接口时，应明确用 readonly 类型传递；需要运行时不可变时，还要选择对应的冻结或受控更新策略，并理解它们的深浅边界。</p>
<h3>两者组合，适合固定配置表</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Route</span> = {
  <span class="hljs-attr">path</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> | <span class="hljs-string">&#x27;POST&#x27;</span>;
};

<span class="hljs-keyword">const</span> routes = [
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/questions&#x27;</span>, <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> },
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/feedback&#x27;</span>, <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span> },
] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span> <span class="hljs-keyword">satisfies</span> <span class="hljs-keyword">readonly</span> <span class="hljs-title class_">Route</span>[];

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(routes[<span class="hljs-number">0</span>].<span class="hljs-property">method</span>); <span class="hljs-comment">// GET</span>
</code></pre></div>
<p>as const 保留具体路径、方法与只读元组结构，satisfies 再检查整组配置满足 Route 契约。目标也写成 readonly Route[]，明确允许只读输入，而不是要求这个配置必须是可修改数组。</p>
<p>这类配置可以进一步通过类型索引提取合法路径或方法，但类型工具不会替你注册真实路由，也不会生成服务器接口。</p>
<h3>as 断言解决的是另一种问题</h3>
<p><code>value as SomeType</code> 告诉编译器按某种类型理解值，可能绕过它原本不能证明的关系。satisfies 则要求当前表达式本身满足目标约束，两者不能互相替代。</p>
<p>已经可信、只是推导能力不足的内部代码可以有针对性地使用断言；接口响应或用户输入仍需要真正解析。JSON.parse 返回的 any 即使参与 satisfies 检查，也不会把未知内容变成经过验证的配置，any 反而可能削弱本来期待的检查。</p>
<p>选择时先问：希望变量以后按照一个宽契约变化，就用清楚的注解；希望固定字面信息，就用 as const；希望在保留具体形态时验证契约，就考虑 satisfies。按目标组合，通常比到处叠加断言更容易维护。</p>
<p>补充参考：<a href="https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html">TypeScript · const assertions</a>。</p>`};export{e as default};