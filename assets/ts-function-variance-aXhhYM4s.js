var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>选哪种写法，看输入和返回值是什么关系。输入有几种、但返回契约都一样，比如字符串和数组都返回长度，用联合参数就行。返回类型要跟着输入类型走，比如传数字返回装数字的盒子，用泛型。几种固定的调用方式各自返回不同类型，用重载。</p>
<p>重载由几条公开签名加一条实现签名组成，调用方只看得到公开签名。所以传 <code>string | number</code> 这样的联合进去，如果没有一条公开签名接受联合，就会报错。</p>
<p>函数类型能不能互相赋值，也有规律。参数这边要求“能接受更宽的输入”，这叫逆变；返回值这边要求“产出更具体的结果”，这叫协变。</p>
<p>要注意，<code>strictFunctionTypes</code> 只对函数类型严格检查，包括写成属性的 <code>handle: (v: T) =&gt; void</code>。写成方法简写 <code>handle(v: T): void</code> 时，参数仍然是双向都允许的，这是为了兼容数组等内置类型，代价是不够安全。</p>
</blockquote>
<h2>三种写法各自的样子</h2>
<p>输入不同、返回一样，用联合参数：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lengthOf</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-keyword">readonly</span> <span class="hljs-built_in">unknown</span>[]</span>): <span class="hljs-built_in">number</span> {
  <span class="hljs-keyword">return</span> value.<span class="hljs-property">length</span>;
}
</code></pre></div>
<p>返回类型跟着输入走，用泛型：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> wrap&lt;T&gt;(<span class="hljs-attr">value</span>: T): { <span class="hljs-attr">value</span>: T } {
  <span class="hljs-keyword">return</span> { value };
}
<span class="hljs-title function_">wrap</span>(<span class="hljs-number">12</span>).<span class="hljs-property">value</span>.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>);
</code></pre></div>
<p><code>wrap(12)</code> 返回的是 <code>{ value: number }</code>，所以能直接调用 <code>toFixed</code>。如果用 <code>unknown</code> 代替 <code>T</code>，这层关系就丢了。</p>
<h2>重载为什么不接受联合</h2>
<p>传字符串返回数字、传数字返回字符串，这种一一对应的关系适合写重载：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">convert</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span></span>): <span class="hljs-built_in">number</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">convert</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">convert</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span></span>): <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;string&#x27;</span> ? value.<span class="hljs-property">length</span> : <span class="hljs-title class_">String</span>(value);
}

<span class="hljs-title function_">convert</span>(<span class="hljs-string">&#x27;HTML&#x27;</span>).<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>);
<span class="hljs-title function_">convert</span>(<span class="hljs-number">12</span>).<span class="hljs-title function_">toUpperCase</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">forward</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-built_in">number</span></span>) {
  <span class="hljs-comment">// @ts-expect-error 两条公开签名都不接受 string | number</span>
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">convert</span>(value);
}
</code></pre></div>
<p>前两行是公开签名，第三行带函数体的是实现签名。调用方只能看到前两条，所以 <code>convert(&#x27;HTML&#x27;)</code> 精确地得到 <code>number</code>。</p>
<p>可是 <code>forward</code> 里传的是 <code>string | number</code>，它既不是纯 <code>string</code>，也不是纯 <code>number</code>，两条公开签名都匹配不上。实现签名虽然写了联合，但它对调用方是不可见的。要支持联合，就再加一条公开签名 <code>function convert(value: string | number): string | number;</code>。</p>
<p>重载按书写顺序匹配，更具体的签名要写在前面。很多场景用条件类型做返回值也能表达，但函数实现里往往要用断言。</p>
<h2>参数为什么是反着来的</h2>
<p>先看现象：能处理所有动物的函数，可以当作处理狗的函数用；反过来却不行。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Animal</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Dog</span> = <span class="hljs-title class_">Animal</span> &amp; { <span class="hljs-title function_">bark</span>(): <span class="hljs-built_in">void</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Handler</span>&lt;T&gt; = <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: T</span>) =&gt;</span> <span class="hljs-built_in">void</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">handleAnimal</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = <span class="hljs-function">(<span class="hljs-params">animal</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(animal.<span class="hljs-property">name</span>);
<span class="hljs-keyword">const</span> <span class="hljs-attr">handleDog</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = <span class="hljs-function">(<span class="hljs-params">dog</span>) =&gt;</span> dog.<span class="hljs-title function_">bark</span>();

<span class="hljs-keyword">const</span> <span class="hljs-attr">forDog</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = handleAnimal; <span class="hljs-comment">// 能处理任意 Animal，当然能处理 Dog</span>
<span class="hljs-comment">// @ts-expect-error 只会处理 Dog，不能承诺处理任意 Animal</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">forAnimal</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = handleDog;
</code></pre></div>
<p><code>Dog</code> 比 <code>Animal</code> 更具体，可在参数位置上，<code>Handler&lt;Animal&gt;</code> 反而能赋给 <code>Handler&lt;Dog&gt;</code>，方向和平时相反，所以叫逆变。</p>
<p>原因可以从调用方的角度想。拿到 <code>forAnimal</code> 的人会传任意动物进去，比如一只猫。如果它实际是 <code>handleDog</code>，就会去调用猫的 <code>bark()</code>，运行时报错。而 <code>handleAnimal</code> 只读 <code>name</code>，传狗进去完全没问题。</p>
<h2>方法简写为什么不够安全</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MethodHandler</span>&lt;T&gt; = { <span class="hljs-title function_">handle</span>(<span class="hljs-attr">value</span>: T): <span class="hljs-built_in">void</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">dogMethods</span>: <span class="hljs-title class_">MethodHandler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = { <span class="hljs-attr">handle</span>: handleDog };
<span class="hljs-keyword">const</span> <span class="hljs-attr">widerMethods</span>: <span class="hljs-title class_">MethodHandler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = dogMethods; <span class="hljs-comment">// 允许，但不安全</span>
</code></pre></div>
<p>同样的赋值，换成方法简写就不报错了。因为方法语法的参数按双变检查，两个方向都放行。TypeScript 这么做是为了兼容数组这类内置类型的方法。所以自己设计回调类型时，写成属性形式 <code>handle: (value: T) =&gt; void</code>，才能得到严格检查。</p>
<h2>还有哪些赋值规则</h2>
<p>参数少的函数可以赋给参数多的类型，所以 <code>[1, 2].map((x) =&gt; x * 2)</code> 不用写 <code>index</code> 参数。返回类型是 <code>void</code> 的函数类型，也可以接受有返回值的函数，返回值会被忽略。另外，回调里如果参数一定会由调用方传入，就应该声明成必需参数，而不是可选。</p>
<h2>常见追问</h2>
<p><strong>TypeScript 4.7 的 <code>in</code>、<code>out</code> 方差注解有什么用？</strong></p>
<blockquote>
<p>比如 <code>interface Box&lt;out T&gt;</code>，它显式声明类型参数是协变还是逆变。好处是复杂泛型的检查会更快，而且实现和声明不符时会报错。</p>
</blockquote>
<p><strong>箭头函数能写重载吗？</strong></p>
<blockquote>
<p>不能直接写。可以先把函数类型声明成带多个调用签名的接口或类型字面量，再把箭头函数赋给它。</p>
</blockquote>`};export{e as default};