var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>三种写法都在回答“这个值的类型是什么”，只是取舍不同。类型注解 <code>const x: T = value</code>，之后 <code>x</code> 就按 <code>T</code> 来用，<code>value</code> 里更具体的信息被丢掉了。<code>as const</code> 让值推断得最窄：字符串、数字变成字面量，数组变成只读元组，对象属性变成 <code>readonly</code>。</p>
<p><code>satisfies</code>（4.9）是两者之间的折中。<code>value satisfies T</code> 检查 <code>value</code> 能不能赋给 <code>T</code>，拼错的键、缺失的键都会报错，但变量的类型仍然是 <code>value</code> 自己推断出来的具体类型。</p>
<p>固定的配置表常写成 <code>as const satisfies T</code>，既拿到字面量类型，又有结构检查。另外 <code>as T</code> 是断言，会跳过编译器证明不了的关系，作用和这三者都不同。</p>
<p>要注意，这三个都只在编译期起作用。<code>as const</code> 不会冻结对象，<code>satisfies</code> 也不会校验运行时的数据。</p>
</blockquote>
<h2>注解会丢掉什么</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Color</span> = <span class="hljs-string">&#x27;red&#x27;</span> | <span class="hljs-string">&#x27;green&#x27;</span>;
<span class="hljs-keyword">type</span> <span class="hljs-variable constant_">RGB</span> = <span class="hljs-keyword">readonly</span> [<span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>];

<span class="hljs-keyword">const</span> <span class="hljs-attr">annotated</span>: <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">Color</span>, <span class="hljs-built_in">string</span> | <span class="hljs-variable constant_">RGB</span>&gt; = {
  <span class="hljs-attr">red</span>: [<span class="hljs-number">255</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>],
  <span class="hljs-attr">green</span>: <span class="hljs-string">&#x27;#00ff00&#x27;</span>,
};
<span class="hljs-comment">// annotated.green 是 string | RGB，必须先判断才能调用 toUpperCase</span>
</code></pre></div>
<p>我们明明写的是 <code>green: &#x27;#00ff00&#x27;</code>，一个字符串。可因为注解了 <code>Record&lt;Color, string | RGB&gt;</code>，之后编译器只认这个注解，<code>annotated.green</code> 的类型是 <code>string | RGB</code>，直接调用 <code>toUpperCase</code> 会报错。</p>
<h2>satisfies 怎样两头都要</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> palette = {
  <span class="hljs-attr">red</span>: [<span class="hljs-number">255</span>, <span class="hljs-number">0</span>, <span class="hljs-number">0</span>],
  <span class="hljs-attr">green</span>: <span class="hljs-string">&#x27;#00ff00&#x27;</span>,
} <span class="hljs-keyword">satisfies</span> <span class="hljs-title class_">Record</span>&lt;<span class="hljs-title class_">Color</span>, <span class="hljs-built_in">string</span> | <span class="hljs-variable constant_">RGB</span>&gt;;

palette.<span class="hljs-property">green</span>.<span class="hljs-title function_">toUpperCase</span>(); <span class="hljs-comment">// green 是 string</span>
palette.<span class="hljs-property">red</span>.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>);       <span class="hljs-comment">// red 是 [number, number, number]</span>
</code></pre></div>
<p>同样的值换成 <code>satisfies</code>，结构照样被检查：少写一个颜色、键名拼错都会报错。可 <code>palette</code> 本身的类型没被改写，<code>green</code> 就是 <code>string</code>，<code>red</code> 就是元组，都能直接用。</p>
<p><code>satisfies</code> 的目标类型还会参与推断，这一点容易让人意外：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> request = { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> } <span class="hljs-keyword">satisfies</span> { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> | <span class="hljs-string">&#x27;POST&#x27;</span> };
<span class="hljs-comment">// @ts-expect-error method 被推断为 &#x27;GET&#x27;，不能再赋成 &#x27;POST&#x27;</span>
request.<span class="hljs-property">method</span> = <span class="hljs-string">&#x27;POST&#x27;</span>;
</code></pre></div>
<p>因为目标里 <code>method</code> 是字面量联合，编译器把 <code>&#x27;GET&#x27;</code> 推断成了字面量类型 <code>&#x27;GET&#x27;</code>，而不是 <code>string</code>，所以之后不能改成 <code>&#x27;POST&#x27;</code>。如果这个变量之后要换成另一个合法值，就该用类型注解。</p>
<h2>as const 做了什么，没做什么</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> point = [<span class="hljs-number">10</span>, <span class="hljs-number">20</span>] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;                         <span class="hljs-comment">// readonly [10, 20]</span>
<span class="hljs-keyword">const</span> options = { <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;compact&#x27;</span>, <span class="hljs-attr">enabled</span>: <span class="hljs-literal">true</span> } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
<span class="hljs-comment">// @ts-expect-error 只读</span>
options.<span class="hljs-property">mode</span> = <span class="hljs-string">&#x27;comfortable&#x27;</span>;
</code></pre></div>
<p>加了 <code>as const</code>，<code>point</code> 不再是 <code>number[]</code>，而是只读元组 <code>readonly [10, 20]</code>；<code>options.mode</code> 是 <code>&#x27;compact&#x27;</code>，而且只读，赋值就报错。</p>
<p>可是 <code>as const</code> 只是类型上的只读，它不会调用 <code>Object.freeze</code>，运行时照样能改。它引用的外部可变对象也不会跟着变成只读：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> values = [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>];
<span class="hljs-keyword">const</span> config = { values } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
config.<span class="hljs-property">values</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">3</span>); <span class="hljs-comment">// values 的类型是 number[]，允许</span>
</code></pre></div>
<p><code>as const</code> 只作用于写在它前面的那个字面量。<code>values</code> 是另一个变量，早就推断成了 <code>number[]</code>，所以 <code>push</code> 不报错。</p>
<h2>组合使用</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Route</span> = { <span class="hljs-attr">path</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> | <span class="hljs-string">&#x27;POST&#x27;</span> };

<span class="hljs-keyword">const</span> routes = [
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/questions&#x27;</span>, <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span> },
  { <span class="hljs-attr">path</span>: <span class="hljs-string">&#x27;/feedback&#x27;</span>, <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span> },
] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span> <span class="hljs-keyword">satisfies</span> <span class="hljs-keyword">readonly</span> <span class="hljs-title class_">Route</span>[];

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Path</span> = (<span class="hljs-keyword">typeof</span> routes)[<span class="hljs-built_in">number</span>][<span class="hljs-string">&#x27;path&#x27;</span>]; <span class="hljs-comment">// &#x27;/questions&#x27; | &#x27;/feedback&#x27;</span>
</code></pre></div>
<p><code>as const</code> 保留了每个 <code>path</code> 的字面量，<code>satisfies</code> 保证每一项都符合 <code>Route</code>，最后能从里面提取出所有路径的联合类型。目标要写成 <code>readonly Route[]</code>，因为 <code>as const</code> 产生的是只读元组，赋不给可变的 <code>Route[]</code>。</p>
<h2>怎么选</h2>
<table><thead><tr><th>需求</th><th>写法</th></tr></thead><tbody><tr><td>变量之后会被赋成同一契约的其他值</td><td>类型注解</td></tr><tr><td>固定常量，需要字面量类型</td><td><code>as const</code></td></tr><tr><td>检查结构，同时保留推断</td><td><code>satisfies</code></td></tr><tr><td>固定配置表并提取键或值的类型</td><td><code>as const satisfies</code></td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>怎样用 <code>as const</code> 代替 enum？</strong></p>
<blockquote>
<p>写成 <code>const Status = { Ok: &#x27;ok&#x27;, Fail: &#x27;fail&#x27; } as const; type Status = (typeof Status)[keyof typeof Status];</code>。它是普通对象加类型，编译时类型能直接擦掉，适合 Node.js 的类型剥离。</p>
</blockquote>
<p><strong>satisfies 会做额外属性检查吗？</strong></p>
<blockquote>
<p>会。对象字面量里写了目标类型中没有的键，同样会报错。</p>
</blockquote>`};export{e as default};