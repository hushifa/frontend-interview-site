var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>假设 <code>Dog</code> 是 <code>Animal</code> 的子类型，一只狗可以当成动物用。那么 <code>Dog[]</code> 能不能当 <code>Animal[]</code>、“处理狗的函数”能不能当“处理动物的函数”？协变和逆变讲的就是：类型套进一个泛型以后，子类型关系是保持原方向、反过来，还是两边都不行。</p>
<p>只读出、不写入的位置是协变，比如返回值：<code>() =&gt; Dog</code> 可以赋给 <code>() =&gt; Animal</code>。只写入的位置是逆变，比如函数参数：<code>(a: Animal) =&gt; void</code> 可以赋给 <code>(d: Dog) =&gt; void</code>，方向反过来了。既读又写的位置应该是不变，两边都不能互相赋值。</p>
<p>这套规则的用处是让赋值在运行时不出错。可 TypeScript 为了兼容常见写法，有两处放宽：数组按协变处理，哪怕它可以写入；方法简写的参数按双变处理，两个方向都允许。<code>strictFunctionTypes</code> 只对函数类型语法生效，方法简写不受影响。</p>
<p>写复杂泛型时，可以用 TypeScript 4.7 加的 <code>in</code>、<code>out</code> 显式标注方差，既方便读者，也能让检查器在写错时报错。</p>
</blockquote>
<h2>协变和逆变分别长什么样</h2>
<p>TypeScript 4.7 的发布说明用 <code>Getter</code> 和 <code>Setter</code> 解释这两个词。判断 <code>Getter&lt;Dog&gt;</code> 能否赋给 <code>Getter&lt;Animal&gt;</code>，要看 <code>Dog</code> 能否赋给 <code>Animal</code>，方向一致，所以 <code>Getter</code> 对 <code>T</code> 是协变的。判断 <code>Setter&lt;Dog&gt;</code> 能否赋给 <code>Setter&lt;Animal&gt;</code>，却要看 <code>Animal</code> 能否赋给 <code>Dog</code>，方向翻转了，所以 <code>Setter</code> 对 <code>T</code> 是逆变的。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Animal</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Dog</span> = <span class="hljs-title class_">Animal</span> &amp; { <span class="hljs-title function_">bark</span>(): <span class="hljs-built_in">void</span> };

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Getter</span>&lt;T&gt; = <span class="hljs-function">() =&gt;</span> T;
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Setter</span>&lt;T&gt; = <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: T</span>) =&gt;</span> <span class="hljs-built_in">void</span>;

<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">getDog</span>: <span class="hljs-title class_">Getter</span>&lt;<span class="hljs-title class_">Dog</span>&gt;;
<span class="hljs-keyword">const</span> <span class="hljs-attr">getAnimal</span>: <span class="hljs-title class_">Getter</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = getDog; <span class="hljs-comment">// 协变：能产出狗，当然能产出动物</span>

<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">setAnimal</span>: <span class="hljs-title class_">Setter</span>&lt;<span class="hljs-title class_">Animal</span>&gt;;
<span class="hljs-keyword">const</span> <span class="hljs-attr">setDog</span>: <span class="hljs-title class_">Setter</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = setAnimal; <span class="hljs-comment">// 逆变：能处理任意动物，当然能处理狗</span>
<span class="hljs-comment">// @ts-expect-error 只会处理狗，不能承诺处理任意动物</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">setAny</span>: <span class="hljs-title class_">Setter</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = setDog;
</code></pre></div>
<p>为什么参数要反过来？从调用方想：拿到 <code>Setter&lt;Animal&gt;</code> 的人会传一只猫进去。如果它背后是只会处理狗的函数，就会去调用猫的 <code>bark()</code>。函数重载和函数赋值的更多规则见<a href="/questions/ts-function-variance/">《函数重载、联合参数与泛型怎样选择？函数类型何时可赋值？》</a>。</p>
<h2>数组为什么是协变的，又为什么不安全</h2>
<p>数组既能读又能写，按道理应该是不变的。可 TypeScript 允许 <code>Dog[]</code> 赋给 <code>Animal[]</code>，下面这段代码能通过类型检查，运行时却会出错。把类型擦掉以后在 node 里运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> dogs = [{ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;旺财&#x27;</span>, <span class="hljs-attr">bark</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;汪&#x27;</span> }];
<span class="hljs-keyword">const</span> animals = dogs; <span class="hljs-comment">// TypeScript 允许 Dog[] 赋给 Animal[]</span>
animals.<span class="hljs-title function_">push</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;咪咪&#x27;</span> });
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> dog <span class="hljs-keyword">of</span> dogs) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(dog.<span class="hljs-title function_">bark</span>());
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">constructor</span>.<span class="hljs-property">name</span>, dog.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError 咪咪</span>
  }
}
</code></pre></div>
<p>第一次输出 <code>汪</code>，第二次输出 <code>TypeError 咪咪</code>。<code>animals</code> 和 <code>dogs</code> 是同一个数组，通过 <code>animals</code> 塞进去一只不会叫的猫，<code>dogs</code> 里就混进了非狗元素。TypeScript 选择接受这个风险，是因为把数组当作只读参数传来传去的写法太常见了，如果按不变处理，大量正常代码都会报错。</p>
<p>改法是在只读取的地方声明成 <code>readonly Animal[]</code>。只读数组没有 <code>push</code>，协变就是安全的，函数签名也更清楚地表达了“我不会改你的数组”。</p>
<h2>strictFunctionTypes 管什么，不管什么</h2>
<p>官方 Type Compatibility 文档写道，比较函数参数时，只要源参数能赋给目标参数、或者反过来也行，赋值就成功，这叫参数双变。它不安全，但能兼容很多常见的 JavaScript 写法。</p>
<p><code>strictFunctionTypes</code>（属于 <code>strict</code> 系列）开启后，函数参数改成按逆变检查。可 TSConfig 文档也说明了，它只作用于函数语法写的类型，不作用于方法语法写的类型。原因是开发这个特性时发现了大量本质上不安全的类层次结构，包括 DOM 里的一些。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MethodStyle</span>&lt;T&gt; = { <span class="hljs-title function_">handle</span>(<span class="hljs-attr">value</span>: T): <span class="hljs-built_in">void</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">PropertyStyle</span>&lt;T&gt; = { <span class="hljs-attr">handle</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: T</span>) =&gt;</span> <span class="hljs-built_in">void</span> };

<span class="hljs-keyword">const</span> <span class="hljs-attr">m</span>: <span class="hljs-title class_">MethodStyle</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = { <span class="hljs-attr">handle</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">d</span>: <span class="hljs-title class_">Dog</span></span>) =&gt;</span> d.<span class="hljs-title function_">bark</span>() }; <span class="hljs-comment">// 通过，但不安全</span>
<span class="hljs-comment">// @ts-expect-error 属性写法按逆变检查</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">p</span>: <span class="hljs-title class_">PropertyStyle</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = { <span class="hljs-attr">handle</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">d</span>: <span class="hljs-title class_">Dog</span></span>) =&gt;</span> d.<span class="hljs-title function_">bark</span>() };
</code></pre></div>
<p>上面两段都用 TypeScript 7.0.2 在 <code>--strict</code> 下验证过。把 <code>strictFunctionTypes</code> 关掉以后，前一节的 <code>setAny</code> 和这里的 <code>PropertyStyle</code> 两行都能通过，它们上面的 <code>@ts-expect-error</code> 会变成“未使用”的错误。所以自己定义回调类型时，写成属性形式才能拿到严格检查。</p>
<h2>in 和 out 标注有什么用</h2>
<p>TypeScript 4.7 允许在类型参数前写 <code>out</code>（协变）、<code>in</code>（逆变），两个都写就是不变：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">interface</span> <span class="hljs-title class_">State</span>&lt;in out T&gt; {
  <span class="hljs-attr">get</span>: <span class="hljs-function">() =&gt;</span> T;
  <span class="hljs-attr">set</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: T</span>) =&gt;</span> <span class="hljs-built_in">void</span>;
}

<span class="hljs-keyword">declare</span> <span class="hljs-keyword">const</span> <span class="hljs-attr">dogState</span>: <span class="hljs-title class_">State</span>&lt;<span class="hljs-title class_">Dog</span>&gt;;
<span class="hljs-comment">// @ts-expect-error 不变：State&lt;Dog&gt; 和 State&lt;Animal&gt; 互不兼容</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">animalState</span>: <span class="hljs-title class_">State</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = dogState;
</code></pre></div>
<p>发布说明给了两个理由。一是可读性，复杂类型一眼看不出 <code>T</code> 是被读、被写还是都有。二是准确和速度：TypeScript 本来就会推算方差作为优化，但遇到循环引用时可能推不准，显式标注可以让检查器跳过深层的结构比较。</p>
<p>标注写错了会报错。比如把上面的 <code>State</code> 只写成 <code>out T</code>，<code>set</code> 用到了 <code>T</code> 作为输入，tsc 会提示 <code>Type &#x27;State&lt;sub-T&gt;&#x27; is not assignable to type &#x27;State&lt;super-T&gt;&#x27; as implied by variance annotation</code>。不过要注意，标注不会改变结构类型系统的本质，不需要为了“看起来专业”给每个泛型都加上。</p>
<h2>常见追问</h2>
<p><strong>为什么 TypeScript 不直接让数组不变？</strong></p>
<blockquote>
<p>因为 <code>function printAll(list: Animal[])</code> 接收 <code>Dog[]</code> 这种写法太常见了，大多数函数只读不写。TypeScript 选择了实用性，把安全交给 <code>readonly</code> 数组来表达。</p>
</blockquote>
<p><strong>返回值是 <code>void</code> 的函数类型为什么能接收有返回值的函数？</strong></p>
<blockquote>
<p>这是另一条兼容规则，和方差无关。<code>void</code> 表示调用方不使用返回值，所以 <code>forEach</code> 的回调写成 <code>x =&gt; arr.push(x)</code> 也能通过。</p>
</blockquote>
<p><strong><code>in</code>、<code>out</code> 和 C# 的 <code>in</code>、<code>out</code> 是一回事吗？</strong></p>
<blockquote>
<p>含义相近，都是标注输入、输出位置。但 TypeScript 是结构类型系统，就算不写标注，检查器也会按结构比较或自行推算方差，标注主要用于说明意图和帮助检查器。</p>
</blockquote>`};export{e as default};