var e={answerHtml:`<h2>简答</h2>
<ul>
<li>闭包是函数加上它创建时所在的词法环境；外层函数返回后，内层函数仍能访问这些绑定。</li>
<li>变量查找按函数定义位置进行，与在哪里调用无关。</li>
<li>闭包捕获的是绑定本身，读到的是绑定的当前值，不是创建时的快照。</li>
<li>常见用途：私有状态、工厂函数、事件回调和偏函数。</li>
<li>闭包只让被引用的环境保持可达；监听器或定时器不清理时，它们引用的数据才会一直留在内存里。</li>
</ul>
<h2>函数返回后状态为什么还在</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createCounter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">increment</span>(<span class="hljs-params"></span>) {
      count += <span class="hljs-number">1</span>;
      <span class="hljs-keyword">return</span> count;
    },
    <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">return</span> count;
    },
  };
}

<span class="hljs-keyword">const</span> first = <span class="hljs-title function_">createCounter</span>();
<span class="hljs-keyword">const</span> second = <span class="hljs-title function_">createCounter</span>();

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-title function_">increment</span>()); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-title function_">increment</span>()); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-title function_">read</span>());      <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(second.<span class="hljs-title function_">increment</span>()); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>每次调用 <code>createCounter</code> 都会创建新的词法环境。<code>increment</code> 和 <code>read</code> 共享同一个 <code>count</code>，<code>first</code> 与 <code>second</code> 之间互不影响。外部只能通过返回的方法操作 <code>count</code>，这就是用闭包实现私有状态。</p>
<h2>捕获的是绑定，不是值</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> label = <span class="hljs-string">&#x27;旧值&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">read</span> = (<span class="hljs-params"></span>) =&gt; label;
label = <span class="hljs-string">&#x27;新值&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// 新值</span>
</code></pre></div>
<p>React 等框架里的&quot;陈旧闭包&quot;是另一种情况：每次渲染都会创建新的函数和新的 <code>state</code> 常量，旧回调引用的是旧渲染的绑定，所以读到旧值。解决方法是让回调随依赖重新创建，或改用函数式更新、ref 读取最新值。</p>
<p>循环中的闭包问题本质是 <code>var</code> 只有一个函数级绑定，详见《var、let、const 和暂时性死区有什么关系？》。</p>
<h2>常见用途</h2>
<ul>
<li>私有状态：计数器、缓存、一次性初始化（<code>once</code>）。</li>
<li>工厂与配置：<code>createLogger(prefix)</code> 返回带前缀的日志函数。</li>
<li>回调保留上下文：事件处理函数访问创建时的参数。</li>
<li>偏函数与柯里化：<code>const add5 = (x) =&gt; add(5, x)</code>。</li>
</ul>
<h2>闭包与内存</h2>
<p>闭包本身不是内存泄漏。引擎只需保留仍被内层函数引用的环境；只要持有闭包的对象（监听器、定时器、全局缓存）被移除，整个环境就可以被回收。排查泄漏时看的是&quot;谁还引用着这个函数&quot;，而不是&quot;有没有闭包&quot;。</p>
<h2>常见追问</h2>
<ul>
<li>闭包里修改外层变量会影响其他闭包吗？会，共享同一个环境的闭包读写同一个绑定。</li>
<li>模块作用域和闭包是什么关系？ES 模块的顶层绑定也是一个词法环境，导出的函数同样闭包了模块内的私有变量。</li>
</ul>`};export{e as default};