var e={answerHtml:`<p>普通函数里的 <code>this</code> 可以理解成调用时传入的一个隐含参数。<strong>函数写在哪个对象里，不足以决定 this；还要看最后怎样调用它。</strong> 箭头函数则没有自己的 <code>this</code>，会沿着创建位置的词法作用域使用外层的 <code>this</code>。</p>
<p>例如，<code>user.read()</code> 是带接收者的调用，接收者是 <code>user</code>。但 <code>const read = user.read; read()</code> 先取出函数，再直接调用；函数本身没有变化，原来的接收者却没有一起带过来。</p>
<h3>先看一个可以实际运行的例子</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-meta">&#x27;use strict&#x27;</span>;

<span class="hljs-keyword">const</span> obj = {
  <span class="hljs-attr">value</span>: <span class="hljs-number">42</span>,
  <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  },
  <span class="hljs-title function_">later</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  },
};

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(obj.<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 42</span>

<span class="hljs-keyword">const</span> read = obj.<span class="hljs-property">read</span>;
<span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">read</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(read.<span class="hljs-title function_">call</span>({ <span class="hljs-attr">value</span>: <span class="hljs-number">7</span> })); <span class="hljs-comment">// 7</span>

<span class="hljs-keyword">const</span> later = obj.<span class="hljs-title function_">later</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(later.<span class="hljs-title function_">call</span>({ <span class="hljs-attr">value</span>: <span class="hljs-number">7</span> })); <span class="hljs-comment">// 42</span>
obj.<span class="hljs-property">value</span> = <span class="hljs-number">99</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">later</span>()); <span class="hljs-comment">// 99</span>
</code></pre></div>
<p><code>read()</code> 直接调用时，严格模式函数的 <code>this</code> 是 <code>undefined</code>。但是函数体执行的是 <code>this.value</code>，相当于访问 <code>undefined.value</code>，因此会抛出 <code>TypeError</code>。只有函数体直接 <code>return this</code>，才会返回 <code>undefined</code>。这两个结论不能混写。</p>
<p><code>read.call({ value: 7 })</code> 显式提供接收者，所以能读取到 7。<code>obj.later()</code> 的 <code>this</code> 是 <code>obj</code>，里面创建的箭头函数沿用这个 <code>this</code>；以后即使用 <code>call</code> 提供另一个对象，也不会换掉它的接收者。</p>
<p>最后输出 99，是因为箭头函数保留了访问 <code>obj</code> 的方式，并没有把当时的 <code>obj.value</code> 数字复制一份。调用时仍然会读取对象上的当前属性值。</p>
<h3>普通函数有哪些调用方式</h3>
<table><thead><tr><th>调用形式</th><th>对普通、未绑定函数的影响</th></tr></thead><tbody><tr><td><code>obj.fn()</code></td><td>接收者是 <code>obj</code>，即便函数来自原型链</td></tr><tr><td><code>fn()</code></td><td>严格模式下 <code>this</code> 是 <code>undefined</code></td></tr><tr><td><code>fn.call(obj, a, b)</code></td><td>立即调用，以 <code>obj</code> 为 <code>this</code>，参数逐个传入</td></tr><tr><td><code>fn.apply(obj, [a, b])</code></td><td>立即调用，以 <code>obj</code> 为 <code>this</code>，参数由数组或类数组提供</td></tr><tr><td><code>fn.bind(obj)</code></td><td>返回一个绑定函数，以后普通调用时使用绑定的 <code>obj</code></td></tr><tr><td><code>new Fn()</code></td><td>若 <code>Fn</code> 可构造，调用时 <code>this</code> 指向新创建的实例</td></tr></tbody></table>
<p>非严格普通函数还有转换规则：<code>null</code>、<code>undefined</code> 会被替换成全局对象，原始值会被装箱。ES 模块和类中的代码处于严格模式，实际项目不要依赖老式脚本的全局对象兜底。</p>
<p><code>bind</code> 不会修改原函数，而是生成包装后的函数。已绑定的普通函数再次使用 <code>call</code> 或 <code>apply</code>，不能改掉先前绑定的接收者；但若绑定目标可构造，<code>new</code> 调用绑定函数时会使用新实例，忽略绑定的 <code>this</code>，绑定参数仍可生效。箭头函数本身不可构造，给它 <code>bind</code> 也不会获得构造能力。</p>
<h3>为什么对象属性里的箭头函数容易误用</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">makeCounter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-string">&#x27;use strict&#x27;</span>;
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">count</span>: <span class="hljs-number">0</span>,
    <span class="hljs-attr">read</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span>,
  };
}
</code></pre></div>
<p>对象字面量不会创建一个供箭头函数使用的 <code>this</code> 作用域。这里的 <code>read</code> 用的是 <code>makeCounter</code> 执行时的 <code>this</code>，不是返回对象的 <code>this</code>。如果直接调用 <code>makeCounter()</code>，外层 <code>this</code> 是 <code>undefined</code>，之后执行 <code>counter.read()</code> 就会报错。</p>
<p>要读取返回对象本身，可以把 <code>read</code> 写成普通方法 <code>read() { return this.count; }</code>。如果希望无论怎样传递函数都绑定到同一个实例，类字段箭头函数则是另一种合理用法：它在实例初始化上下文中取得实例的 <code>this</code>。代价是每个实例通常有自己的函数对象，而不是共享原型上的方法函数。</p>
<h3>回调会怎样丢失接收者</h3>
<p><code>setTimeout(obj.read, 0)</code>、<code>items.map(obj.read)</code> 都是在传函数值，没有传递原先的 <code>obj.read()</code> 调用表达式。回调最终怎样被调用，取决于接收它的 API。不要一概断言所有回调里的 <code>this</code> 都是 <code>undefined</code>，不同 API 可能提供不同接收者。</p>
<p>需要保留对象时，可以用 <code>const boundRead = obj.read.bind(obj)</code>，或者传 <code>() =&gt; obj.read()</code>。前者固定原函数和接收者；后者到执行时再读取 <code>obj.read</code>，如果方法后来被替换，行为也会不同。</p>
<p>事件监听尤其要留意函数身份：<code>addEventListener</code> 时临时调用一次 <code>bind</code>，移除时再调用一次 <code>bind</code>，得到的是两个不同函数，无法靠第二个函数移除第一个监听器。应保存同一引用用于注册与清理。</p>
<p>箭头函数也没有自己的 <code>arguments</code>，需要参数列表时通常用剩余参数 <code>(...args)</code>。它适合让回调继续使用外层上下文；普通方法适合由调用者提供接收者。选择依据是函数需要哪一种语义，而不是哪一种语法更短。</p>`};export{e as default};