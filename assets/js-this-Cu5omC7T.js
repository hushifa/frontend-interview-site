var e={answerHtml:`<h2>简答</h2>
<ul>
<li>普通函数的 <code>this</code> 在调用时确定：<code>obj.fn()</code> 是 <code>obj</code>，直接调用 <code>fn()</code> 在严格模式下是 <code>undefined</code>，<code>new</code> 调用是新实例。</li>
<li><code>call</code>、<code>apply</code> 临时指定 <code>this</code>，<code>bind</code> 返回固定了 <code>this</code> 的新函数；优先级为 <code>new</code> &gt; <code>bind</code> &gt; <code>call/apply</code> &gt; 方法调用 &gt; 直接调用。</li>
<li>箭头函数没有自己的 <code>this</code>，按词法作用域读取定义位置外层的 <code>this</code>，<code>call</code>、<code>bind</code> 都改不了；箭头函数也不能用 <code>new</code> 调用。</li>
<li>方法被单独取出后直接调用会丢失接收者，常见于回调和解构。</li>
</ul>
<h2>示例</h2>
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
<ul>
<li><code>read()</code> 直接调用，严格模式下 <code>this</code> 是 <code>undefined</code>，读取属性抛 <code>TypeError</code>。非严格模式下 <code>this</code> 是全局对象，结果是 <code>undefined</code> 而不是报错。ES 模块和 class 内部默认是严格模式。</li>
<li><code>later()</code> 返回的箭头函数在 <code>later</code> 执行时定义，<code>this</code> 固定为 <code>obj</code>。<code>call</code> 传入的对象被忽略；之后修改 <code>obj.value</code>，箭头函数读到的是新值。</li>
</ul>
<h2>判定规则</h2>
<table><thead><tr><th>调用方式</th><th><code>this</code></th></tr></thead><tbody><tr><td><code>new Fn()</code></td><td>新创建的实例</td></tr><tr><td><code>fn.bind(o)()</code></td><td><code>o</code>（再次 bind 无效）</td></tr><tr><td><code>fn.call(o)</code> / <code>fn.apply(o)</code></td><td><code>o</code></td></tr><tr><td><code>obj.fn()</code></td><td><code>obj</code></td></tr><tr><td><code>fn()</code></td><td>严格模式 <code>undefined</code>，否则全局对象</td></tr><tr><td>箭头函数</td><td>外层作用域的 <code>this</code></td></tr></tbody></table>
<p>DOM 事件监听器用普通函数时，<code>this</code> 是 <code>currentTarget</code>；用箭头函数时是外层的 <code>this</code>。</p>
<h2>回调中丢失 this</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Timer</span> {
  count = <span class="hljs-number">0</span>;
  <span class="hljs-title function_">start</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">setInterval</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">tick</span>, <span class="hljs-number">1000</span>); <span class="hljs-comment">// tick 内 this 为 undefined</span>
  }
  <span class="hljs-title function_">tick</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
  }
}
</code></pre></div>
<p>修复方式：</p>
<ul>
<li>传入箭头函数：<code>setInterval(() =&gt; this.tick(), 1000)</code>。</li>
<li>构造时绑定：<code>this.tick = this.tick.bind(this)</code>。</li>
<li>把方法写成类字段箭头函数：<code>tick = () =&gt; { this.count += 1; }</code>。代价是每个实例都有一份函数，且不在原型上，子类无法通过 <code>super.tick()</code> 调用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>对象字面量里的箭头函数方法 <code>{ fn: () =&gt; this }</code> 的 <code>this</code> 是什么？是对象字面量外层的 <code>this</code>，不是这个对象。</li>
<li>为什么箭头函数不适合作为原型方法？它拿不到调用者，也不能被 <code>new</code> 调用。</li>
</ul>`};export{e as default};