var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>面试让你手写 <code>MyPick</code>、<code>MyReadonly</code>，其实是在问你会不会“用类型写函数”：输入一个类型，按规则算出另一个类型。常见题目几乎都能归到三个套路里。</p>
<p>第一个套路是映射类型，用 <code>[P in K]</code> 把一组键挨个走一遍，可以加上或去掉 <code>readonly</code>、<code>?</code>，还能用 <code>as</code> 改名或者把键过滤掉，<code>MyPick</code>、<code>MyOmit</code>、<code>MyReadonly</code> 都是这样写的。第二个是索引访问，<code>T[number]</code> 能把数组或元组的元素类型取出来，<code>TupleToUnion</code> 一行就够。第三个是条件类型加 <code>infer</code>，先判断类型长不长某个样子，匹配上了就把其中一块“抠”出来，<code>First</code>、<code>Awaited</code> 用的就是它，需要层层展开时再递归调用自己。</p>
<p>这些套路在业务里也有用，比如从常量数组生成联合类型、给配置对象加深层只读，都比手写一遍类型更不容易出错。</p>
<p>要注意两点。泛型参数要加上约束，比如 <code>K extends keyof T</code>，否则传错的键不会报错。另外写完一定要验证，用 <code>@ts-expect-error</code> 标出“这里应该报错”的行，再用类型相等断言比较结果，光看鼠标悬停提示容易漏掉边界情况。</p>
</blockquote>
<h2>用映射类型写 MyPick、MyOmit、MyReadonly</h2>
<p>映射类型就是“遍历一组键，为每个键生成一个属性”。下面三个工具只有遍历的键和修饰符不同：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MyPick</span>&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt; = {
  [P <span class="hljs-keyword">in</span> K]: T[P];
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyOmit</span>&lt;T, K <span class="hljs-keyword">extends</span> keyof <span class="hljs-built_in">any</span>&gt; = {
  [P <span class="hljs-keyword">in</span> keyof T <span class="hljs-keyword">as</span> P <span class="hljs-keyword">extends</span> K ? <span class="hljs-built_in">never</span> : P]: T[P];
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyReadonly</span>&lt;T&gt; = {
  <span class="hljs-keyword">readonly</span> [P <span class="hljs-keyword">in</span> keyof T]: T[P];
};

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Todo</span> {
  <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">description</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">completed</span>: <span class="hljs-built_in">boolean</span>;
}

<span class="hljs-keyword">type</span> <span class="hljs-title class_">TodoPreview</span> = <span class="hljs-title class_">MyPick</span>&lt;<span class="hljs-title class_">Todo</span>, <span class="hljs-string">&#x27;title&#x27;</span> | <span class="hljs-string">&#x27;completed&#x27;</span>&gt;;
<span class="hljs-keyword">const</span> <span class="hljs-attr">preview</span>: <span class="hljs-title class_">TodoPreview</span> = { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;写周报&#x27;</span>, <span class="hljs-attr">completed</span>: <span class="hljs-literal">false</span> };

<span class="hljs-comment">// @ts-expect-error &#x27;deadline&#x27; 不是 Todo 的键</span>
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Wrong</span> = <span class="hljs-title class_">MyPick</span>&lt;<span class="hljs-title class_">Todo</span>, <span class="hljs-string">&#x27;deadline&#x27;</span>&gt;;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">NoDesc</span> = <span class="hljs-title class_">MyOmit</span>&lt;<span class="hljs-title class_">Todo</span>, <span class="hljs-string">&#x27;description&#x27;</span>&gt;;
<span class="hljs-keyword">const</span> <span class="hljs-attr">noDesc</span>: <span class="hljs-title class_">NoDesc</span> = { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;写周报&#x27;</span>, <span class="hljs-attr">completed</span>: <span class="hljs-literal">true</span> };

<span class="hljs-keyword">const</span> <span class="hljs-attr">locked</span>: <span class="hljs-title class_">MyReadonly</span>&lt;<span class="hljs-title class_">Todo</span>&gt; = { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-attr">description</span>: <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-attr">completed</span>: <span class="hljs-literal">false</span> };
<span class="hljs-comment">// @ts-expect-error 只读属性不能赋值</span>
locked.<span class="hljs-property">title</span> = <span class="hljs-string">&#x27;c&#x27;</span>;
</code></pre></div>
<p>先看 <code>MyPick</code> 的约束 <code>K extends keyof T</code>。为什么非加不可？因为 <code>T[P]</code> 要求 <code>P</code> 一定是 <code>T</code> 的键，不加约束就没法写 <code>T[P]</code>，而且有了约束，传入 <code>&#x27;deadline&#x27;</code> 这种不存在的键会直接报错，上面用 <code>@ts-expect-error</code> 标出的那一行就验证了这一点。</p>
<p><code>MyOmit</code> 换了个思路。它遍历的是 <code>T</code> 的全部键，再用 <code>as</code> 子句给每个键重新算一个名字：要排除的键算成 <code>never</code>，其他键保持原样。Handbook 写明，<code>as</code> 子句算出 <code>never</code> 的键会被丢掉，所以这正是“过滤键”的写法。<code>as</code> 重映射从 TypeScript 4.1 开始支持。<code>K</code> 的约束用 <code>keyof any</code>，也就是 <code>string | number | symbol</code>，这和内置 <code>Omit</code> 一样，允许传入 <code>T</code> 上没有的键。</p>
<p><code>MyReadonly</code> 只是在每个属性前加了 <code>readonly</code>。映射类型的修饰符还能用 <code>-</code> 去掉，比如 <code>-readonly</code> 去掉只读、<code>-?</code> 去掉可选，内置的 <code>Required</code> 就是 <code>-?</code> 的写法。更多内置工具怎样用来建模接口，可以看<a href="/questions/ts-mapped-utility/">《映射类型与 Partial、Pick、Omit 如何用于接口建模？》</a>。</p>
<h2>DeepReadonly 为什么要递归，又为什么要放过函数</h2>
<p><code>MyReadonly</code> 只管第一层，<code>config.server.host</code> 照样能改。要让每一层都只读，就要在属性类型是对象时，再对它套一次自己：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">DeepReadonly</span>&lt;T&gt; = T <span class="hljs-title function_">extends</span> (...<span class="hljs-attr">args</span>: <span class="hljs-built_in">any</span>[]) =&gt; <span class="hljs-built_in">any</span>
  ? T
  : T <span class="hljs-keyword">extends</span> <span class="hljs-built_in">object</span>
    ? { <span class="hljs-keyword">readonly</span> [P <span class="hljs-keyword">in</span> keyof T]: <span class="hljs-title class_">DeepReadonly</span>&lt;T[P]&gt; }
    : T;

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Config</span> {
  <span class="hljs-attr">server</span>: { <span class="hljs-attr">host</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">ports</span>: <span class="hljs-built_in">number</span>[] };
  <span class="hljs-attr">onReady</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">void</span>;
}

<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">config</span>: <span class="hljs-title class_">DeepReadonly</span>&lt;<span class="hljs-title class_">Config</span>&gt;;
<span class="hljs-comment">// @ts-expect-error 深层属性同样只读</span>
config.<span class="hljs-property">server</span>.<span class="hljs-property">host</span> = <span class="hljs-string">&#x27;localhost&#x27;</span>;
<span class="hljs-comment">// @ts-expect-error 数组变成 readonly number[]，没有 push</span>
config.<span class="hljs-property">server</span>.<span class="hljs-property">ports</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">8080</span>);
config.<span class="hljs-title function_">onReady</span>();
</code></pre></div>
<p>读这段代码时会有个疑问：函数也是 <code>object</code>，为什么要先单独判断？如果不先放过函数，函数类型也会被拿去做映射，结果变成一个没有调用签名的对象类型，<code>config.onReady()</code> 就调用不了了。所以判断顺序是：函数原样返回，对象递归映射，其他基本类型直接返回。</p>
<p>数组为什么也跟着变成了只读？TypeScript 3.1 的发布说明写明，<code>[P in keyof T]</code> 这种形式的映射类型作用在数组或元组上时，结果仍是数组或元组，<code>readonly</code> 修饰符让 <code>number[]</code> 变成 <code>readonly number[]</code>，上面 <code>push</code> 那一行报错就是证据。</p>
<h2>用 T[number] 写 TupleToUnion</h2>
<p>索引访问类型和取对象属性一样，只是取的是类型。Handbook 里专门举了用 <code>number</code> 取数组元素类型的例子：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">TupleToUnion</span>&lt;T <span class="hljs-keyword">extends</span> <span class="hljs-keyword">readonly</span> <span class="hljs-built_in">unknown</span>[]&gt; = T[<span class="hljs-built_in">number</span>];

<span class="hljs-keyword">const</span> roles = [<span class="hljs-string">&#x27;admin&#x27;</span>, <span class="hljs-string">&#x27;editor&#x27;</span>, <span class="hljs-string">&#x27;viewer&#x27;</span>] <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Role</span> = <span class="hljs-title class_">TupleToUnion</span>&lt;<span class="hljs-keyword">typeof</span> roles&gt;;

<span class="hljs-keyword">const</span> <span class="hljs-attr">current</span>: <span class="hljs-title class_">Role</span> = <span class="hljs-string">&#x27;editor&#x27;</span>;
<span class="hljs-comment">// @ts-expect-error &#x27;guest&#x27; 不在元组里</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">guest</span>: <span class="hljs-title class_">Role</span> = <span class="hljs-string">&#x27;guest&#x27;</span>;
</code></pre></div>
<p>为什么要写 <code>as const</code>？没有它，<code>roles</code> 会被推断成 <code>string[]</code>，<code>T[number]</code> 取出来就只是 <code>string</code>。加上以后它成了只读元组 <code>readonly [&#x27;admin&#x27;, &#x27;editor&#x27;, &#x27;viewer&#x27;]</code>，每个元素都是字面量类型，取出来才是三个字符串组成的联合类型。也正因为它是只读元组，约束要写成 <code>readonly unknown[]</code>，写成 <code>unknown[]</code> 会拒绝只读元组。</p>
<p>这个写法在业务里很常用：权限、状态这类取值只维护一份常量数组，运行时可以遍历它，类型也从它生成，两边不会对不上。</p>
<h2>用 infer 写 First 和 Awaited</h2>
<p>条件类型就是类型层面的三元表达式。<code>infer</code> 只能写在 <code>extends</code> 右边，意思是“如果匹配上了，这一块是什么类型，就把它叫作某个名字”：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">First</span>&lt;T <span class="hljs-keyword">extends</span> <span class="hljs-keyword">readonly</span> <span class="hljs-built_in">unknown</span>[]&gt; = T <span class="hljs-keyword">extends</span> [infer F, ...<span class="hljs-built_in">unknown</span>[]] ? F : <span class="hljs-built_in">never</span>;

<span class="hljs-keyword">type</span> <span class="hljs-variable constant_">F1</span> = <span class="hljs-title class_">First</span>&lt;[<span class="hljs-number">3</span>, <span class="hljs-number">2</span>, <span class="hljs-number">1</span>]&gt;;
<span class="hljs-keyword">type</span> <span class="hljs-variable constant_">F2</span> = <span class="hljs-title class_">First</span>&lt;[]&gt;;

<span class="hljs-keyword">const</span> <span class="hljs-attr">one</span>: <span class="hljs-variable constant_">F1</span> = <span class="hljs-number">3</span>;
<span class="hljs-keyword">const</span> <span class="hljs-attr">isNever</span>: [<span class="hljs-variable constant_">F2</span>] <span class="hljs-keyword">extends</span> [<span class="hljs-built_in">never</span>] ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span> = <span class="hljs-literal">true</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyAwaited</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PromiseLike</span>&lt;infer V&gt; ? <span class="hljs-title class_">MyAwaited</span>&lt;V&gt; : T;

<span class="hljs-keyword">type</span> <span class="hljs-variable constant_">A1</span> = <span class="hljs-title class_">MyAwaited</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">number</span>&gt;&gt;&gt;;
<span class="hljs-keyword">type</span> <span class="hljs-variable constant_">A2</span> = <span class="hljs-title class_">MyAwaited</span>&lt;<span class="hljs-built_in">boolean</span> | <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">string</span>&gt;&gt;;

<span class="hljs-keyword">const</span> <span class="hljs-attr">a1</span>: <span class="hljs-variable constant_">A1</span> = <span class="hljs-number">1</span>;
<span class="hljs-keyword">const</span> <span class="hljs-attr">a2</span>: <span class="hljs-variable constant_">A2</span>[] = [<span class="hljs-literal">true</span>, <span class="hljs-string">&#x27;ok&#x27;</span>];
<span class="hljs-comment">// @ts-expect-error A1 是 number，不能放 Promise</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">bad</span>: <span class="hljs-variable constant_">A1</span> = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-number">1</span>);
</code></pre></div>
<p><code>First</code> 拿 <code>T</code> 去比“第一个元素是 <code>F</code>、后面随便”的元组。空元组匹配不上，就走到 <code>never</code>。为什么不直接写 <code>T[0]</code>？因为空元组上 <code>T[0]</code> 会报错，而条件类型能把空元组单独处理掉。检查 <code>F2</code> 时把它包进方括号，是因为 <code>never</code> 在条件类型里会被当成空联合类型，直接分发成 <code>never</code>，原因见<a href="/questions/ts-conditional-infer/">《条件类型、infer 和分布式条件类型如何理解？》</a>。</p>
<p><code>MyAwaited</code> 先判断 <code>T</code> 是不是一个“有 <code>then</code> 方法、能取出结果类型”的对象，<code>PromiseLike</code> 就描述了这种形状。匹配上就把结果类型 <code>V</code> 取出来，再对 <code>V</code> 调用自己，所以 <code>Promise&lt;Promise&lt;number&gt;&gt;</code> 会一层层剥到 <code>number</code>。传入联合类型时，条件类型会对每个成员分别计算再合并，所以 <code>boolean | Promise&lt;string&gt;</code> 得到 <code>boolean | string</code>。这和 Handbook 里内置 <code>Awaited</code>（TypeScript 4.5 加入）给出的三个例子结果一致。内置版本比这里更周全，还处理了 <code>null</code>、<code>undefined</code> 和 <code>then</code> 的参数形状，业务代码里直接用内置的 <code>Awaited</code> 就行。</p>
<h2>写完怎样验证</h2>
<p>类型代码不会运行，所以“看起来对”很容易骗过自己。最简单的验证是在应该报错的地方写 <code>// @ts-expect-error</code>：如果那一行不再报错，编译器会反过来报 “Unused &#x27;@ts-expect-error&#x27; directive”，测试就失败了。上面每段代码都按这个方法用 TypeScript 7.0.2 的 <code>tsc --noEmit --strict</code> 编译通过。</p>
<p>判断“结果是不是恰好等于某个类型”，可以用下面这个常见的相等判断写法：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Equal</span>&lt;X, Y&gt; =
  (&lt;T&gt;<span class="hljs-function">() =&gt;</span> T <span class="hljs-keyword">extends</span> X ? <span class="hljs-number">1</span> : <span class="hljs-number">2</span>) <span class="hljs-keyword">extends</span> &lt;T&gt;<span class="hljs-function">() =&gt;</span> T <span class="hljs-keyword">extends</span> Y ? <span class="hljs-number">1</span> : <span class="hljs-number">2</span> ? <span class="hljs-literal">true</span> : <span class="hljs-literal">false</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Expect</span>&lt;T <span class="hljs-keyword">extends</span> <span class="hljs-literal">true</span>&gt; = T;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">MyAwaited</span>&lt;T&gt; = T <span class="hljs-keyword">extends</span> <span class="hljs-title class_">PromiseLike</span>&lt;infer V&gt; ? <span class="hljs-title class_">MyAwaited</span>&lt;V&gt; : T;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Cases</span> = [
  <span class="hljs-title class_">Expect</span>&lt;<span class="hljs-title class_">Equal</span>&lt;<span class="hljs-title class_">MyAwaited</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">number</span>&gt;&gt;&gt;, <span class="hljs-title class_">Awaited</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">number</span>&gt;&gt;&gt;&gt;&gt;,
  <span class="hljs-title class_">Expect</span>&lt;<span class="hljs-title class_">Equal</span>&lt;<span class="hljs-title class_">MyAwaited</span>&lt;<span class="hljs-built_in">boolean</span> | <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">string</span>&gt;&gt;, <span class="hljs-built_in">boolean</span> | <span class="hljs-built_in">string</span>&gt;&gt;,
];
</code></pre></div>
<p>它比 <code>X extends Y</code> 更严格，比如 <code>any</code> 和 <code>string</code> 用 <code>extends</code> 互相都能通过，用它就会判为不相等。项目里系统地做类型测试，可以看<a href="/questions/ts-type-testing/">《TypeScript 复杂类型应该怎样测试？》</a>。</p>
<h2>常见追问</h2>
<p><strong>MyOmit 能不能用 Pick 和 Exclude 写？</strong></p>
<blockquote>
<p>能，写成 <code>Pick&lt;T, Exclude&lt;keyof T, K&gt;&gt;</code>：先用 <code>Exclude</code> 从全部键里去掉要排除的键，再用 <code>Pick</code> 选出剩下的。它和用 <code>as</code> 过滤键的写法结果一样，<code>as</code> 写法不依赖其他工具，适合面试时从零写出来。</p>
</blockquote>
<p><strong>DeepReadonly 处理 Map、Set 吗？</strong></p>
<blockquote>
<p>上面的写法不处理。<code>Map</code> 和 <code>Set</code> 的内容是通过 <code>set</code>、<code>add</code> 这些方法改的，映射属性加 <code>readonly</code> 拦不住方法调用。需要的话要单独判断，把 <code>Map&lt;K, V&gt;</code> 换成 <code>ReadonlyMap&lt;K, V&gt;</code>、<code>Set&lt;T&gt;</code> 换成 <code>ReadonlySet&lt;T&gt;</code>，这两个都是标准库自带的只读接口。</p>
</blockquote>
<p><strong>类型体操写得越复杂越好吗？</strong></p>
<blockquote>
<p>不是。递归和多层条件类型会让类型和报错信息都很难读懂。业务里优先用内置工具类型，只有在能明显减少重复、防止两处定义对不上时才自己写，写了就配上类型测试。</p>
</blockquote>`};export{e as default};