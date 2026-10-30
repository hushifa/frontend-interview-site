var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>每调用一个函数，引擎都会为这次调用建一份“运行记录”，记下这段代码执行到哪、变量去哪里找，这份记录叫执行上下文。执行上下文按调用顺序压进一个栈，也就是调用栈，正在执行的永远是栈顶那个，函数返回时它就出栈。</p>
<p>变量放在执行上下文引用的环境记录里。每个环境记录都有一个指向外层环境记录的引用，找不到的变量就顺着这个引用往外找，一直找到全局，这条链就是作用域链。外层是谁，在函数定义时就定下了，跟在哪里调用无关。</p>
<p>规范里执行上下文有两个相关组件：词法环境用来解析代码里的标识符，<code>let</code>、<code>const</code>、<code>class</code> 声明的绑定在这里；变量环境专门放 <code>var</code> 声明的绑定。</p>
<p>要注意，这些是规范描述行为用的模型，引擎内部怎么实现不一定一一对应。面试里能讲清“调用栈管执行顺序，作用域链管变量查找，查找路线由定义位置决定”就够了。</p>
</blockquote>
<h2>调用栈：谁在执行</h2>
<p>MDN 的执行模型把执行上下文也叫栈帧，是最小的执行单位。代码开始运行时先有一个全局的执行上下文；调用函数时，引擎为它创建新的执行上下文压到栈顶，ECMAScript 把栈顶这个叫“正在运行的执行上下文”。函数返回，它出栈，控制权回到下面那个。</p>
<p>所以报错时看到的调用栈，就是当时栈里从上到下的这些执行上下文。递归太深会报栈溢出，也是因为栈里压了太多执行上下文。</p>
<h2>为什么变量按定义位置查找</h2>
<p>下面 <code>inner</code> 在 <code>caller</code> 里被调用，但它定义在 <code>outer</code> 里。看它最后读到哪个 <code>name</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">var</span> name = <span class="hljs-string">&#x27;全局&#x27;</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">outer</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">var</span> name = <span class="hljs-string">&#x27;outer&#x27;</span>;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">inner</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> name;
  }
  <span class="hljs-keyword">return</span> inner;
}
<span class="hljs-keyword">function</span> <span class="hljs-title function_">caller</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">var</span> name = <span class="hljs-string">&#x27;caller&#x27;</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">outer</span>()();
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">caller</span>()); <span class="hljs-comment">// outer</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> hoisted); <span class="hljs-comment">// undefined</span>
<span class="hljs-keyword">var</span> hoisted = <span class="hljs-number">1</span>;
<span class="hljs-keyword">try</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(later);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// ReferenceError</span>
}
<span class="hljs-keyword">let</span> later = <span class="hljs-number">2</span>;
</code></pre></div>
<p>为什么不是 <code>caller</code>？<code>inner</code> 自己的环境记录里没有 <code>name</code>，就沿外层引用去找。这个外层引用指向的是 <code>inner</code> 创建时所在的环境，也就是 <code>outer</code> 那次调用的环境，所以拿到 <code>&#x27;outer&#x27;</code>。调用它的 <code>caller</code> 虽然在调用栈里，却不在 <code>inner</code> 的作用域链上。调用栈和作用域链是两条不同的链，这一点最容易混。</p>
<p>这条“按定义位置决定”的规则就是词法作用域，闭包能读到外层变量也是靠它，见<a href="/questions/js-closure/">《什么是闭包？它有哪些实际应用？》</a>。</p>
<h2>变量环境和词法环境有什么不同</h2>
<p>例子后半段，<code>typeof hoisted</code> 得到 <code>undefined</code> 而不报错，<code>later</code> 却抛出 <code>ReferenceError</code>。原因是代码执行前，引擎会先把声明登记到环境记录里。<code>var hoisted</code> 登记在变量环境，同时初始化为 <code>undefined</code>，所以提前读不报错。<code>let later</code> 登记在词法环境，但在执行到声明那一行之前一直没有初始化，这段时间读它就报错，也就是暂时性死区。细节见<a href="/questions/js-scope-hoisting/">《var、let、const 和暂时性死区有什么关系？》</a>。</p>
<p>ECMAScript 对这两个组件的定义是：词法环境用于解析这段代码里的标识符引用，变量环境保存 <code>VariableStatement</code>（也就是 <code>var</code> 语句）创建的绑定。块级作用域出现后，进入 <code>{}</code> 块时会为 <code>let</code>、<code>const</code> 新建一个环境记录，外层引用指回原来的词法环境；<code>var</code> 不受块影响，仍然放在函数的变量环境里。</p>
<h2>this 和执行上下文</h2>
<p>函数环境记录除了放变量，还提供 <code>this</code> 绑定，不过规范特别说明，箭头函数的函数环境记录不提供 <code>this</code>。所以箭头函数里的 <code>this</code> 和普通变量一样，要顺着外层去找，这就是它“没有自己的 this”的来源。普通函数的 <code>this</code> 由调用方式决定，见<a href="/questions/js-this/">《普通函数和箭头函数的 this 有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>执行上下文和作用域是一回事吗？</strong></p>
<blockquote>
<p>不是。作用域讲的是“变量在哪段代码里能访问”，写代码时就定了。执行上下文是运行时才有的，每次调用都新建一个。同一个函数调用两次，作用域规则一样，执行上下文和环境记录却是两份，所以每次调用的局部变量互不影响。</p>
</blockquote>
<p><strong>Generator 暂停时执行上下文去哪了？</strong></p>
<blockquote>
<p>MDN 的执行模型里提到，调用 Generator 函数会创建一个执行上下文但先挂起，生成器对象把它保存起来。每次调用 <code>next()</code>，这个执行上下文重新压栈运行，遇到 <code>yield</code> 再挂起出栈，所以局部变量能一直保留。</p>
</blockquote>`};export{e as default};