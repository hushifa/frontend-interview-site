var e={answerHtml:`<h2>简答</h2>
<ul>
<li>联合参数：<code>(value: string | unknown[]) =&gt; number</code>，输入不同但返回契约相同。</li>
<li>泛型：<code>&lt;T&gt;(value: T) =&gt; { value: T }</code>，返回类型跟随输入类型。</li>
<li>重载：几条公开签名加一个实现签名，调用方只能看到公开签名，传入 <code>string | number</code> 这样的联合不会匹配任何一条。</li>
<li>函数类型赋值：参数位置要求&quot;能接受更宽的输入&quot;（逆变），返回值要求&quot;产出更窄的结果&quot;（协变）。</li>
<li><code>strictFunctionTypes</code> 只对函数类型属性 <code>handle: (v: T) =&gt; void</code> 生效，方法简写 <code>handle(v: T): void</code> 仍是双变的，以兼容数组等内置类型。</li>
</ul>
<h2>联合参数</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lengthOf</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> | <span class="hljs-keyword">readonly</span> <span class="hljs-built_in">unknown</span>[]</span>): <span class="hljs-built_in">number</span> {
  <span class="hljs-keyword">return</span> value.<span class="hljs-property">length</span>;
}
</code></pre></div>
<h2>泛型</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> wrap&lt;T&gt;(<span class="hljs-attr">value</span>: T): { <span class="hljs-attr">value</span>: T } {
  <span class="hljs-keyword">return</span> { value };
}
<span class="hljs-title function_">wrap</span>(<span class="hljs-number">12</span>).<span class="hljs-property">value</span>.<span class="hljs-title function_">toFixed</span>(<span class="hljs-number">0</span>);
</code></pre></div>
<h2>重载</h2>
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
<p>需要接受联合时再加一条 <code>function convert(value: string | number): string | number;</code>。重载按书写顺序匹配，具体的签名要写在前面。很多场景用条件类型返回值也能表达，但实现内部常需要断言。</p>
<h2>参数逆变</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Animal</span> = { <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Dog</span> = <span class="hljs-title class_">Animal</span> &amp; { <span class="hljs-title function_">bark</span>(): <span class="hljs-built_in">void</span> };
<span class="hljs-keyword">type</span> <span class="hljs-title class_">Handler</span>&lt;T&gt; = <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">value</span>: T</span>) =&gt;</span> <span class="hljs-built_in">void</span>;

<span class="hljs-keyword">const</span> <span class="hljs-attr">handleAnimal</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = <span class="hljs-function">(<span class="hljs-params">animal</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(animal.<span class="hljs-property">name</span>);
<span class="hljs-keyword">const</span> <span class="hljs-attr">handleDog</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = <span class="hljs-function">(<span class="hljs-params">dog</span>) =&gt;</span> dog.<span class="hljs-title function_">bark</span>();

<span class="hljs-keyword">const</span> <span class="hljs-attr">forDog</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = handleAnimal; <span class="hljs-comment">// 能处理任意 Animal，当然能处理 Dog</span>
<span class="hljs-comment">// @ts-expect-error 只会处理 Dog，不能承诺处理任意 Animal</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">forAnimal</span>: <span class="hljs-title class_">Handler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = handleDog;
</code></pre></div>
<h2>方法语法的双变</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">MethodHandler</span>&lt;T&gt; = { <span class="hljs-title function_">handle</span>(<span class="hljs-attr">value</span>: T): <span class="hljs-built_in">void</span> };
<span class="hljs-keyword">const</span> <span class="hljs-attr">dogMethods</span>: <span class="hljs-title class_">MethodHandler</span>&lt;<span class="hljs-title class_">Dog</span>&gt; = { <span class="hljs-attr">handle</span>: handleDog };
<span class="hljs-keyword">const</span> <span class="hljs-attr">widerMethods</span>: <span class="hljs-title class_">MethodHandler</span>&lt;<span class="hljs-title class_">Animal</span>&gt; = dogMethods; <span class="hljs-comment">// 允许，但不安全</span>
</code></pre></div>
<p>设计回调类型时写成属性形式 <code>handle: (value: T) =&gt; void</code>，才能得到严格检查。</p>
<h2>其他赋值规则</h2>
<ul>
<li>参数少的函数可以赋给参数多的类型：<code>[1, 2].map((x) =&gt; x * 2)</code>。</li>
<li>返回 <code>void</code> 的函数类型可以接受有返回值的函数，返回值被忽略。</li>
<li>回调中由调用方保证传入的参数，类型应声明为必需而不是可选。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>TypeScript 4.7 的 <code>in</code>/<code>out</code> 方差注解有什么用？<code>interface Box&lt;out T&gt;</code> 显式声明方差，可以加快复杂泛型的检查，并在实现与声明不符时报错。</li>
<li>箭头函数能写重载吗？不能直接写，可以把函数类型声明为带多个调用签名的接口或类型字面量。</li>
</ul>`};export{e as default};