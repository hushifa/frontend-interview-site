var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写回调时，<code>[1, 2, 3].forEach(() =&gt; this.count++)</code> 里的 <code>this</code> 还是外面方法的 <code>this</code>，换成普通函数就丢了。这是箭头函数最常被用到的区别。</p>
<p>MDN 的说法是，箭头函数没有自己的 <code>this</code>、<code>arguments</code> 和 <code>super</code> 绑定，用到时会去外层找。所以 <code>call</code>、<code>apply</code>、<code>bind</code> 也改不了它的 <code>this</code>。</p>
<p>它还不能当构造函数：用 <code>new</code> 调用会抛 <code>TypeError</code>，它也没有 <code>prototype</code> 属性。函数体里不能用 <code>yield</code>，所以也写不成 Generator。</p>
<p>因此箭头函数适合写回调和短小的工具函数，不适合写对象方法、原型方法、构造函数，以及事件监听里需要 <code>this</code> 指向当前元素的场景。</p>
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
<p>最后的 <code>timer.start()</code> 得到 3，因为 <code>forEach</code> 的回调是箭头函数，<code>this</code> 沿用 <code>start</code> 方法的 <code>this</code>，也就是 <code>timer</code>。换成普通函数，回调的 <code>this</code> 在非严格模式下是全局对象，严格模式下是 <code>undefined</code>，计数就加不到 <code>timer</code> 上了。</p>
<h2>什么时候不要用箭头函数</h2>
<p>正因为 <code>this</code> 来自外层，把箭头函数直接写成对象字面量的方法时，<code>this</code> 不指向这个对象，而是对象外面那层的 <code>this</code>。同理，<code>addEventListener</code> 的回调如果要用 <code>this</code> 拿到当前元素，也要用普通函数，或者改用 <code>event.currentTarget</code>。这些场景的具体分析见<a href="/questions/js-this/">《普通函数和箭头函数的 this 有什么区别？》</a>。</p>
<p>类字段里写 <code>handle = () =&gt; {}</code> 是另一回事。它能保证 <code>this</code> 永远是实例，常用来传回调。但 MDN 提醒，类字段定义在实例上而不是原型上，每创建一个实例就会多一个新函数。</p>
<h2>写法上的区别</h2>
<p>箭头函数只有一个简单参数（没有默认值、解构或剩余参数）时可以省略括号；函数体只有一个表达式时可以省略花括号，表达式的值就是返回值。要直接返回对象字面量，必须用括号包起来，写成 <code>() =&gt; ({ id: 1 })</code>，否则花括号会被当成函数体。</p>
<h2>常见追问</h2>
<p><strong>箭头函数能用 call 或 bind 改 this 吗？</strong></p>
<blockquote>
<p>不能。传给 <code>call</code>、<code>apply</code>、<code>bind</code> 的 <code>this</code> 参数会被忽略，参数照常传入。它的 <code>this</code> 只取决于定义时外层的 <code>this</code>。</p>
</blockquote>
<p><strong>async 箭头函数可以吗？</strong></p>
<blockquote>
<p>可以，<code>async () =&gt; {}</code> 是合法的，里面能用 <code>await</code>，<code>this</code> 同样沿用外层。只是不存在“箭头 Generator”，因为箭头函数体里不能用 <code>yield</code>。</p>
</blockquote>`};export{e as default};