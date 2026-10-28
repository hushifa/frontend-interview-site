var e={answerHtml:`<h2>简答</h2>
<ul>
<li>注解 <code>const x: T = value</code>：之后按 <code>T</code> 使用 <code>x</code>，<code>value</code> 中更具体的信息被丢弃。</li>
<li><code>as const</code>：字符串、数字推断为字面量，数组变成只读元组，对象属性变成 <code>readonly</code>。</li>
<li><code>value satisfies T</code>：检查 <code>value</code> 能否赋给 <code>T</code>（拼错的键、缺失的键都会报错），变量类型仍是 <code>value</code> 推断出的具体类型。</li>
<li><code>as const satisfies T</code> 同时得到字面量类型和结构校验，适合固定配置表。</li>
<li><code>as T</code> 是断言，会跳过编译器无法证明的关系，作用与以上三者不同。</li>
</ul>
<h2>注解丢失具体信息</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Color</span> = <span class="hljs-string">&#x27;red&#x27;</span> | <span class="hljs-string">&#x27;green&#x27;</span>;
<span class="hljs-keyword">type</span> <span class="hljs-variable constant_">RGB</span> = <span class="hljs-keyword">readonly</span> [<span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>];

<span class="hljs-keyword">const</span> <span class="hljs-attr">annotated</span>: <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">Color</span>, <span class="hljs-built_in">string</span> | <span class="hljs-variable constant_">RGB</span>&gt; = {
  <span class="hljs-attr">red</span>: [<span class="hljs-number">255</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>],
  <span class="hljs-attr">green</span>: <span class="hljs-string">&#x27;#00ff00&#x27;</span>,
};
<span class="hljs-comment">// annotated.green 是 string | RGB，必须先判断才能调用 toUpperCase</span>
</code></pre></div>
<h2>satisfies 保留具体类型</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> palette = {
  <span class="hljs-attr">red</span>: [<span class="hljs-number">255</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>],
  <span class="hljs-attr">green</span>: <span class="hljs-string">&#x27;#00ff00&#x27;</span>,
} <span class="hljs-keyword">satisfies</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">Color</span>, <span class="hljs-built_in">string</span> | <span class="hljs-variable constant_">RGB</span>&gt;;

palette.<span class="hljs-property">green</span>.<span class="hljs-title function_">toUpperCase</span>(); <span class="hljs-comment">// green 是 string</span>
palette.<span class="hljs-property">red</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>);       <span class="hljs-comment">// red 是 [number, number, number]</span>
</code></pre></div>
<p><code>satisfies</code> 的目标类型会参与上下文推断：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> request = { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> } <span class="hljs-keyword">satisfies</span> { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> | <span class="hljs-string">&#x27;POST&#x27;</span> };
<span class="hljs-comment">// @ts-expect-error method 被推断为 &#x27;GET&#x27;，不能再赋成 &#x27;POST&#x27;</span>
request.<span class="hljs-property">method</span> = <span class="hljs-string">&#x27;POST&#x27;</span>;
</code></pre></div>
<p>需要之后修改为另一个合法值时，用注解。</p>
<h2>as const</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> point = [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;                         <span class="hljs-comment">// readonly [10, 20]</span>
<span class="hljs-keyword">const</span> options = { <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;compact&#x27;</span>, <span class="hljs-attr">enabled</span>: <span class="hljs-literal">true</span> } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
<span class="hljs-comment">// @ts-expect-error 只读</span>
options.<span class="hljs-property">mode</span> = <span class="hljs-string">&#x27;comfortable&#x27;</span>;
</code></pre></div>
<p><code>as const</code> 不调用 <code>Object.freeze</code>，运行时仍可修改。它引用的外部可变对象也不会变成只读：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> values = [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>];
<span class="hljs-keyword">const</span> config = { values } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
config.<span class="hljs-property">values</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">3</span>); <span class="hljs-comment">// values 的类型是 number[]，允许</span>
</code></pre></div>
<h2>组合使用</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Route</span> = { <span class="hljs-attr">path</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> | <span class="hljs-string">&#x27;POST&#x27;</span> };

<span class="hljs-keyword">const</span> routes = [
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/questions&#x27;</span>, <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> },
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/feedback&#x27;</span>, <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span> },
] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span> <span class="hljs-keyword">satisfies</span> <span class="hljs-keyword">readonly</span> <span class="hljs-title class_">Route</span>[];

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Path</span> = (<span class="hljs-keyword">typeof</span> routes)[<span class="hljs-built_in">number</span>][<span class="hljs-string">&#x27;path&#x27;</span>]; <span class="hljs-comment">// &#x27;/questions&#x27; | &#x27;/feedback&#x27;</span>
</code></pre></div>
<p>目标写成 <code>readonly Route[]</code>，因为 <code>as const</code> 产生只读元组，不能赋给可变的 <code>Route[]</code>。</p>
<h2>选择</h2>
<table><thead><tr><th>需求</th><th>写法</th></tr></thead><tbody><tr><td>变量之后会被赋成同一契约的其他值</td><td>类型注解</td></tr><tr><td>固定常量，需要字面量类型</td><td><code>as const</code></td></tr><tr><td>检查结构，同时保留推断</td><td><code>satisfies</code></td></tr><tr><td>固定配置表并提取键或值的类型</td><td><code>as const satisfies</code></td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>用 <code>as const</code> 代替 enum 怎么写？<code>const Status = { Ok: &#x27;ok&#x27;, Fail: &#x27;fail&#x27; } as const; type Status = (typeof Status)[keyof typeof Status];</code>，结果是可擦除语法，适合 Node.js 类型剥离。</li>
<li>satisfies 会做额外属性检查吗？会，对象字面量中写了目标类型中不存在的键会报错。</li>
</ul>`};export{e as default};