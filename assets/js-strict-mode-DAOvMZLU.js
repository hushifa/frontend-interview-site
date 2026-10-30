var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在函数里不小心写了 <code>totle = 1</code>，拼错了变量名，非严格模式下会悄悄创建一个全局变量，严格模式下直接抛 <code>ReferenceError</code>。这就是严格模式的主要作用：把原来静默失败的写法变成报错，让问题早点暴露。</p>
<p>它改变的行为大致有三类。第一类是把静默失败变成抛错，比如给冻结对象的属性赋值会抛 <code>TypeError</code>。第二类是 <code>this</code>：普通函数直接调用时 <code>this</code> 是 <code>undefined</code>，用 <code>call</code> 传入原始值也不会被包装成对象。第三类是去掉一些难以优化的写法，<code>with</code> 被禁用，<code>eval</code> 不再往外层作用域加变量，<code>arguments</code> 也不再和参数同步。</p>
<p>开启方式是在脚本或函数体开头写 <code>&#x27;use strict&#x27;</code>。ES 模块和 <code>class</code> 的内部自动就是严格模式，不用再写，所以现代工程代码大多已经在严格模式下运行了。</p>
<p>要注意，参数用了默认值、解构或剩余参数的函数，函数体里不能写 <code>&#x27;use strict&#x27;</code>，会报语法错误。</p>
</blockquote>
<h2>运行时行为的变化</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">sloppyThis</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> <span class="hljs-variable language_">this</span>;
}
<span class="hljs-keyword">function</span> <span class="hljs-title function_">strictThis</span>(<span class="hljs-params"></span>) {
  <span class="hljs-string">&#x27;use strict&#x27;</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>;
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(sloppyThis.<span class="hljs-title function_">call</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// object</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(strictThis.<span class="hljs-title function_">call</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">strictThis</span>()); <span class="hljs-comment">// undefined</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">strictAssign</span>(<span class="hljs-params"></span>) {
  <span class="hljs-string">&#x27;use strict&#x27;</span>;
  <span class="hljs-keyword">const</span> frozen = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> });
  <span class="hljs-keyword">try</span> {
    frozen.<span class="hljs-property">count</span> = <span class="hljs-number">1</span>;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
  }
  <span class="hljs-keyword">try</span> {
    undeclared = <span class="hljs-number">1</span>;
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// ReferenceError</span>
  }
}
<span class="hljs-title function_">strictAssign</span>();
<span class="hljs-keyword">function</span> <span class="hljs-title function_">sloppyArgs</span>(<span class="hljs-params">a</span>) {
  a = <span class="hljs-number">2</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-variable language_">arguments</span>[<span class="hljs-number">0</span>];
}
<span class="hljs-keyword">function</span> <span class="hljs-title function_">strictArgs</span>(<span class="hljs-params">a</span>) {
  <span class="hljs-string">&#x27;use strict&#x27;</span>;
  a = <span class="hljs-number">2</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-variable language_">arguments</span>[<span class="hljs-number">0</span>];
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">sloppyArgs</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">strictArgs</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>前三行看 <code>this</code>。非严格模式下，MDN 说函数里的 <code>this</code> 总是对象：传入原始值会被包装成对象，所以 <code>typeof</code> 得到 <code>&#x27;object&#x27;</code>；传入 <code>undefined</code> 或 <code>null</code> 会换成全局对象。严格模式下传什么就是什么，<code>call(1)</code> 得到 1，直接调用得到 <code>undefined</code>。所以严格模式下方法被单独拿出来调用，访问 <code>this.xxx</code> 会马上报错，而不是悄悄改到全局对象上。</p>
<p>中间两个 <code>try</code> 是静默失败变成抛错。非严格模式下给冻结对象赋值什么也不发生，代码继续跑，很难发现；给未声明的变量赋值会创建全局变量。严格模式下这两种都抛错。</p>
<p>最后两行是 <code>arguments</code>。非严格模式下 <code>arguments[0]</code> 和参数 <code>a</code> 是联动的，改 <code>a</code> 会同步改 <code>arguments[0]</code>。严格模式下 <code>arguments</code> 只保存调用时传入的值，互不影响。严格模式还禁止访问 <code>arguments.callee</code>。</p>
<h2>语法上的限制</h2>
<p>有些写法在严格模式下直接是语法错误，代码一行都不会执行。<code>with</code> 语句被禁用，因为它让变量到底来自哪个对象在运行前无法确定。以 0 开头的八进制字面量如 <code>0644</code> 被禁止，要写成 <code>0o644</code>。函数参数不能重名。<code>delete</code> 一个普通变量名也是语法错误。</p>
<p><code>eval</code> 的行为也收紧了。非严格模式下 <code>eval(&#x27;var x&#x27;)</code> 会在外层函数或全局里加一个变量 <code>x</code>；严格模式下 <code>eval</code> 里声明的变量只留在 <code>eval</code> 自己的作用域里。</p>
<h2>怎样开启，作用范围多大</h2>
<p><code>&#x27;use strict&#x27;</code> 必须写在脚本或函数体的最前面，前面只能有注释或其他指令，否则就是一个普通字符串，不起作用。写在脚本开头会让整个脚本都是严格模式；写在函数开头只影响这个函数。</p>
<p>ES 模块的全部内容、<code>class</code> 的全部内容都自动是严格模式。<code>this</code> 在不同调用方式下的取值，见<a href="/questions/js-this/">《普通函数和箭头函数的 this 有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么带默认参数的函数不能写 &#x27;use strict&#x27;？</strong></p>
<blockquote>
<p>这是语言的规定：MDN 写明 <code>&#x27;use strict&#x27;</code> 只能用在参数是简单参数列表的函数体里，参数带默认值、剩余参数或解构时写它就是语法错误。需要的话，把严格模式写到外层脚本或函数上。</p>
</blockquote>
<p><strong>严格模式会让代码更快吗？</strong></p>
<blockquote>
<p>不能一概而论。MDN 的说法是严格模式代码“有时”能比相同的非严格代码跑得更快，因为它去掉了 <code>with</code>、<code>eval</code> 改外层变量、<code>arguments.callee</code> 这类妨碍引擎优化的行为。但具体快不快取决于引擎和代码，不能把它当成性能开关。</p>
</blockquote>`};export{e as default};