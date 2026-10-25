var e={answerHtml:`<p>设计函数类型时，先看调用方式与返回关系。如果不同输入都执行同一种操作、返回同一种结果，联合参数通常足够。若需要保留“返回值与传入类型对应”，考虑泛型；若调用形式确实分成几组，可以用重载把它们分别列出。</p>
<p>不要先写一长串重载，再为了让实现通过检查加入 any。类型签名应当把业务接口讲清楚，而不是让调用者猜应该命中哪一条。</p>
<h3>同一种返回契约，联合参数最直接</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lengthOf</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-keyword">readonly</span> <span class="hljs-built_in">unknown</span>[]</span>): <span class="hljs-built_in">number</span> {
  <span class="hljs-keyword">return</span> value.<span class="hljs-property">length</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOf</span>(<span class="hljs-string">&#x27;HTML&#x27;</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lengthOf</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>])); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>字符串和数组都提供 length，返回值统一是 number，不需要分别维护两条重载。调用方如果手里已经是 string | readonly unknown[]，也能直接传入。</p>
<p>如果不同类型需要不同处理，可以在函数体里收窄。联合并不意味着实现必须用同一段代码，只是公共输入可以用同一个契约清楚表达。</p>
<h3>需要保留输入类型关系，使用泛型</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> wrap&lt;T&gt;(<span class="hljs-attr">value</span>: T): { <span class="hljs-attr">value</span>: T } {
  <span class="hljs-keyword">return</span> { value };
}

<span class="hljs-keyword">const</span> wrapped = <span class="hljs-title function_">wrap</span>(<span class="hljs-number">12</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(wrapped.<span class="hljs-property">value</span>.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 12</span>
</code></pre></div>
<p>泛型说明容器内的值与输入是同一种 T。若把返回类型统一写成 <code>{ value: unknown }</code>，这层关系就丢失，调用方又需要额外检查。</p>
<p>泛型不一定适合表达所有“输入 A 返回 B，输入 C 返回 D”的情况。条件类型与实现签名过于复杂时，少量清楚的重载可能更容易阅读；但接口有很多组合时，也要防止重载数量不断膨胀。</p>
<h3>重载签名面向调用者，实现签名不是额外入口</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">convert</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">number</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">convert</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">convert</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;string&#x27;</span> ? value.<span class="hljs-property">length</span> : <span class="hljs-title class_">String</span>(value);
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">convert</span>(<span class="hljs-string">&#x27;HTML&#x27;</span>).<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">convert</span>(<span class="hljs-number">12</span>).<span class="hljs-title function_">toUpperCase</span>()); <span class="hljs-comment">// 12</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">forward</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span></span>) {
  <span class="hljs-comment">// @ts-expect-error 两条公开重载都不单独接受 string | number</span>
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">convert</span>(value);
}
</code></pre></div>
<p>调用者看到前面两条重载，最后一条宽签名用于检查实现。即使实现能接收联合，调用方也不会自动把它当成第三条公共调用形式。</p>
<p>如果确实要接受联合输入，需要增加相应的公开重载，或改用更合适的联合/泛型接口。这也解释了为什么不应在本来只需统一返回类型时过度使用重载。</p>
<p>实现必须兼容所有公开签名，但宽泛的实现返回联合，不一定让编译器证明每个运行时分支都精确符合你承诺的那条重载。字符串输入是否真的返回数字，仍应通过实现与测试保证。</p>
<h3>参数数量和可选参数要反映实际调用</h3>
<p>有些 API 只允许一参数或三参数形式，重载可以表达这种离散约束；实现里为了共享代码写了两个可选参数，不代表外部就能合法传两个参数。</p>
<p>回调的可选参数也容易写错。如果库保证每次调用都传 index，回调类型应把 index 声明为必需，而不是为了允许调用方只接收 item 就写成 index?:number。JavaScript 函数本来可以忽略多余参数，少写一个形参通常不需要把库的传参保证削弱。</p>
<p>返回 void 的回调契约通常表示调用方不使用返回值，并不等于所有赋进去的函数在运行时都必须返回 undefined。这个规则与函数体显式标注 void 后的返回检查，也需要按具体语境区分。</p>
<h3>回调参数更具体，反而可能不能替换更宽的回调</h3>
<p>以下示例以 strictFunctionTypes 开启为前提：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Animal</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Dog</span> = <span class="hljs-title class_">Animal</span> &amp; { <span class="hljs-title function_">bark</span>(): <span class="hljs-built_in">void</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Handler</span>&lt;T&gt; = <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: T</span>) =&gt;</span> <span class="hljs-built_in">void</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">handleAnimal</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = <span class="hljs-function"><span class="hljs-params">animal</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(animal.<span class="hljs-property">name</span>);
<span class="hljs-keyword">const</span> <span class="hljs-attr">handleDog</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = <span class="hljs-function"><span class="hljs-params">dog</span> =&gt;</span> dog.<span class="hljs-title function_">bark</span>();

<span class="hljs-keyword">const</span> <span class="hljs-attr">usableForDog</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = handleAnimal;

<span class="hljs-comment">// @ts-expect-error 只会处理 Dog 的函数，不能承诺处理任意 Animal</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">unsafeForAnimal</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = handleDog;
</code></pre></div>
<p>需要处理 Dog 的位置，可以使用能处理所有 Animal 的函数，因为 Dog 也有 name。反过来，只会处理 Dog 的函数会调用 bark，若调用方真的传了一个普通 Animal，就会失败。</p>
<p>这就是参数位置常说的逆变方向：替代函数要能接受接口可能交给它的输入，而不是要求更苛刻的输入。返回值方向则通常相反，一个保证返回 Dog 的函数可以满足“返回 Animal”的需求。</p>
<h3>方法语法有兼容性例外，不能据此认定安全</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MethodHandler</span>&lt;T&gt; = {
  <span class="hljs-title function_">handle</span>(<span class="hljs-attr">value</span>: T): <span class="hljs-built_in">void</span>;
};

<span class="hljs-keyword">const</span> <span class="hljs-attr">dogMethods</span>: <span class="hljs-title class_">MethodHandler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = { <span class="hljs-attr">handle</span>: handleDog };
<span class="hljs-keyword">const</span> <span class="hljs-attr">widerMethods</span>: <span class="hljs-title class_">MethodHandler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = dogMethods;
</code></pre></div>
<p>在 TypeScript 的相应规则下，方法与构造器声明并不完全采用普通函数属性相同的严格参数检查，因此这种方法形式可能允许前面函数属性形式拒绝的关系。它是类型系统为兼容现有代码保留的取舍，不是证明 dogMethods 真的能处理任意 Animal。</p>
<p>设计公共回调接口时，要留意 <code>handle(value: T): void</code> 与 <code>handle: (value: T) =&gt; void</code> 的差异。不要为了消掉一个合理报错就切换成更宽松的形式，而不修正真实的输入承诺。</p>
<p>最后，选签名时可以写出三类调用：正常使用、应该被拒绝的输入、已经是联合类型的调用方变量。再用严格配置验证推导结果。这样的接口测试比仅检查实现函数能否编译，更能反映公共 API 是否容易正确使用。</p>
<p>补充参考：<a href="https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html">TypeScript · strictFunctionTypes</a>。</p>`};export{e as default};