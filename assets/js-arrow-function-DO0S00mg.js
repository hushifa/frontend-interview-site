var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>面试里问箭头函数，大家先想到 <code>this</code>，规则见<a href="/questions/js-this/">《普通函数和箭头函数的 this 有什么区别？》</a>。这里讲 <code>this</code> 以外的区别。</p>
<p>MDN 的说法是，箭头函数没有自己的 <code>this</code>、<code>arguments</code> 和 <code>super</code> 绑定，也没有 <code>new.target</code>，用到时都去外层找。所以箭头函数里读 <code>arguments</code>，拿到的是外层普通函数的参数；想要自己的参数，用剩余参数 <code>(...args)</code>。</p>
<p>它还不能当构造函数：用 <code>new</code> 调用会抛 <code>TypeError</code>，它也没有 <code>prototype</code> 属性。函数体里不能用 <code>yield</code>，所以也写不成 Generator。</p>
<p>因此箭头函数适合写回调和短小的工具函数，不适合写构造函数和 Generator。写法上它也更紧凑：单个参数可省括号，单个表达式可省花括号并直接返回。</p>
</blockquote>
<h2>先看几个区别</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Normal</span>(<span class="hljs-params"></span>) {}
<span class="hljs-keyword">const</span> <span class="hljs-title function_">Arrow</span> = (<span class="hljs-params"></span>) =&gt; {};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">Normal</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>); <span class="hljs-comment">// object</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Arrow</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>); <span class="hljs-comment">// undefined</span>
<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">new</span> <span class="hljs-title class_">Arrow</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
<span class="hljs-keyword">function</span> <span class="hljs-title function_">outer</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">arrow</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-variable language_">arguments</span>[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">arrow</span>(<span class="hljs-string">&#x27;箭头自己的参数&#x27;</span>);
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">outer</span>(<span class="hljs-string">&#x27;外层参数&#x27;</span>)); <span class="hljs-comment">// 外层参数</span>
<span class="hljs-keyword">const</span> timer = {
  <span class="hljs-attr">seconds</span>: <span class="hljs-number">0</span>,
  <span class="hljs-title function_">start</span>(<span class="hljs-params"></span>) {
    [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>].<span class="hljs-title function_">forEach</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">seconds</span> += <span class="hljs-number">1</span>;
    });
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">seconds</span>;
  },
};
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(timer.<span class="hljs-title function_">start</span>()); <span class="hljs-comment">// 3</span>
</code></pre></div>
<p>前两行说明箭头函数没有 <code>prototype</code>。<code>new</code> 一个函数时要拿它的 <code>prototype</code> 做新对象的原型，箭头函数既没有这个属性，也不允许被 <code>new</code>，所以直接抛 <code>TypeError</code>。</p>
<p>为什么 <code>arrow(&#x27;箭头自己的参数&#x27;)</code> 返回的是外层参数？因为箭头函数没有自己的 <code>arguments</code>，它里面的 <code>arguments</code> 指的是外层 <code>outer</code> 的。想拿箭头函数自己的参数，用剩余参数 <code>(...args) =&gt; args[0]</code>。</p>
<p>最后的 <code>timer.start()</code> 得到 3，这是箭头函数沿用外层 <code>this</code> 的效果，和 <code>arguments</code> 沿用外层是同一个道理：这些绑定箭头函数自己都没有，只能顺着代码位置往外找。</p>
<h2>不能 new，也不能写成 Generator</h2>
<p>构造函数要靠 <code>prototype</code> 给实例提供原型，还可能用 <code>new.target</code> 判断自己是不是被 <code>new</code> 调用的。箭头函数这两样都没有，所以它不能当构造函数，<code>class</code> 和普通 <code>function</code> 才能。</p>
<p>MDN 还写明，箭头函数体里不能使用 <code>yield</code>（除非出现在箭头函数内部嵌套的普通函数里），所以箭头函数不能用作 Generator。需要惰性产出数据时，用 <code>function*</code>。</p>
<p>类字段里写 <code>handle = () =&gt; {}</code> 时，MDN 提醒，类字段定义在实例上而不是原型上，每创建一个实例就会多一个新函数，子类也没法用 <code>super.handle()</code> 调用它。</p>
<h2>写法上的区别</h2>
<p>箭头函数只有一个简单参数（没有默认值、解构或剩余参数）时可以省略括号；函数体只有一个表达式时可以省略花括号，表达式的值就是返回值。要直接返回对象字面量，必须用括号包起来，写成 <code>() =&gt; ({ id: 1 })</code>，否则花括号会被当成函数体。</p>
<p>另外，参数和 <code>=&gt;</code> 之间不能换行，否则是语法错误；换行可以放在 <code>=&gt;</code> 之后。</p>
<h2>常见追问</h2>
<p><strong>箭头函数用 <code>call</code> 传参还有效吗？</strong></p>
<blockquote>
<p>有效。传给 <code>call</code>、<code>apply</code>、<code>bind</code> 的 <code>this</code> 参数会被忽略，但后面的参数照常传入。</p>
</blockquote>
<p><strong>async 箭头函数可以吗？</strong></p>
<blockquote>
<p>可以，<code>async () =&gt; {}</code> 是合法的，里面能用 <code>await</code>，<code>this</code> 同样沿用外层。只是不存在“箭头 Generator”，因为箭头函数体里不能用 <code>yield</code>。</p>
</blockquote>`};export{e as default};