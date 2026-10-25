var e={answerHtml:`<p>描述一个包含姓名和年龄的对象时，interface 与 type 往往都能胜任。它们都参与 TypeScript 的结构类型检查，不会因为名字不同，就让两个相同结构自动变成完全不兼容的类型。</p>
<p>选择时主要看三件事：要表达的是普通对象还是联合等类型关系，是否允许后续声明扩展，以及希望组合发生冲突时怎样暴露问题。</p>
<h3>对象结构和函数契约，两者都能描述</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">User</span> {
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">age</span>?: <span class="hljs-built_in">number</span>;
}

<span class="hljs-keyword">type</span> <span class="hljs-title class_">UserRecord</span> = {
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">age</span>?: <span class="hljs-built_in">number</span>;
};

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">Formatter</span> {
  (<span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span>): <span class="hljs-built_in">string</span>;
}

<span class="hljs-keyword">type</span> <span class="hljs-title class_">FormatFunction</span> = <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>) =&gt;</span> <span class="hljs-built_in">string</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">format</span>: <span class="hljs-title class_">Formatter</span> = <span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> value.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">2</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">format</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 1.00</span>
</code></pre></div>
<p>interface 不只会列普通字段，也能描述调用签名等对象能力。类型别名描述对象同样可以有可选、只读属性和方法，不是只能给已有名字换一个别名。</p>
<p>但是两者都不是运行时构造器。不能通过 new User 创建对象，也不能在运行时用 value instanceof User 检查它；这里的 User 只在类型层存在。</p>
<h3>type 能直接表达联合、元组和原始类型别名</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">UserId</span> = <span class="hljs-built_in">string</span>;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Point</span> = <span class="hljs-keyword">readonly</span> [<span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>];
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Result</span>&lt;T&gt; =
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>; <span class="hljs-attr">value</span>: T }
  | { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>; <span class="hljs-attr">error</span>: <span class="hljs-built_in">string</span> };

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Nullable</span>&lt;T&gt; = T | <span class="hljs-literal">null</span>;
</code></pre></div>
<p>这些类型关系很适合用 type 表达。一个 interface 主要描述对象或可调用对象的结构，不能直接把自身定义成 <code>string | number</code> 这样的联合。</p>
<p>UserId 只是 string 的别名，并不会因此获得运行时包装或自动的名义区分。若用户 ID 与订单 ID 都是字符串，光起两个不同别名不能防止它们混用，必要时需要品牌等额外建模方式。</p>
<h3>interface 可以合并，同名类型别名不能重复打开</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">ReadingOptions</span> {
  <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span> | <span class="hljs-string">&#x27;dark&#x27;</span>;
}

<span class="hljs-keyword">interface</span> <span class="hljs-title class_">ReadingOptions</span> {
  <span class="hljs-attr">fontSize</span>: <span class="hljs-built_in">number</span>;
}

<span class="hljs-keyword">const</span> <span class="hljs-attr">options</span>: <span class="hljs-title class_">ReadingOptions</span> = {
  <span class="hljs-attr">theme</span>: <span class="hljs-string">&#x27;light&#x27;</span>,
  <span class="hljs-attr">fontSize</span>: <span class="hljs-number">16</span>,
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(options.<span class="hljs-property">fontSize</span>); <span class="hljs-comment">// 16</span>
</code></pre></div>
<p>两份同名接口声明在允许合并的同一声明空间中组成一个接口，调用方需要同时满足 theme 与 fontSize。库扩展、模块增补等场景可以利用这种开放性。</p>
<p>合并并不是后声明覆盖前声明。若重复的普通属性类型不兼容，编译器会报错；方法等成员还有各自的重载合并规则。类型别名则不能通过再写一次同名 type 来追加字段。</p>
<p>不希望无意扩展的内部类型可以采用类型别名，但这不代表类型别名描述的对象是“精确封闭对象”，也不会阻止结构兼容的值含有其他运行时字段。声明能否被重新打开，与对象能否携带额外属性，是两种问题。</p>
<h3>extends 与交叉类型遇到冲突时不一样</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">TextValue</span> {
  <span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span>;
}

<span class="hljs-comment">// @ts-expect-error 子接口不能把 value 改成不兼容的 number</span>
<span class="hljs-keyword">interface</span> <span class="hljs-title class_">NumberValue</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_">TextValue</span> {
  <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span>;
}

<span class="hljs-keyword">type</span> <span class="hljs-title class_">ImpossibleValue</span> = <span class="hljs-title class_">TextValue</span> &amp; { <span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span> };

<span class="hljs-comment">// @ts-expect-error value 同时满足 string 和 number，在这里成为 never</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">impossible</span>: <span class="hljs-title class_">ImpossibleValue</span> = { <span class="hljs-attr">value</span>: <span class="hljs-number">1</span> };
</code></pre></div>
<p>接口 extends 会在扩展声明时指出冲突。交叉类型表示同时满足两边的约束，不是右边覆盖左边；这个例子中的 value 需要同时是 string 和 number，所以变成不可能的类型。</p>
<p>有的交叉冲突会让某个属性成为 never，有的涉及判别字段的冲突可能使整个类型缩成 never，不能一概说“冲突时总会选一边”。应该检查真正组合出来的类型是否可构造。</p>
<p>接口也可以扩展结构明确的对象类型别名，类型别名也可以通过交叉组合接口。它们不是两个完全隔离的类型世界。interface 不能随意 extends 一个成员不确定的联合，是因为它需要可明确描述的对象成员。</p>
<h3>class implements 是检查，不是代码生成</h3>
<p>一个类可以 implements 接口，也可以 implements 结构适合的对象类型别名。implements 要求实例满足契约，但不会替类生成字段、方法或自动继承实现。</p>
<p>如果需要复用运行时代码，要使用真正的函数、组合或类继承；如果只是说明对象需要提供哪些能力，类型契约就足够。不要把 interface extends 和 class extends 当成同样的运行时机制。</p>
<h3>项目中怎样形成稳定约定</h3>
<p>对需要生态扩展或声明合并的公共对象契约，interface 通常更合适。对状态联合、元组、条件类型和类型变换，type 更直接。普通内部对象两者都可用，团队保持一致比为了细微语法差异来回改写更重要。</p>
<p>组合非常复杂时，还应关注编译器错误信息和检查成本。给中间类型取清楚的名字、减少不必要的巨大交叉，往往比追求一句“某一种永远更快”有用。</p>
<p>最终两者都只描述静态契约，不会过滤接口返回的数据，也不会在运行时验证字段。使用哪一种声明，不应改变对外部输入仍需检查的事实。</p>`};export{e as default};