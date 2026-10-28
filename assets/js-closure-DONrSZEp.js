var e={answerHtml:`<h2>简答</h2>
<ul>
<li>闭包是函数加上它创建时所在的词法环境，外层函数返回后，内层函数仍能访问这些绑定。</li>
<li>闭包保存的是对绑定的访问，不是变量值的快照。</li>
<li>常见用途有私有状态、工厂函数、回调和柯里化。</li>
<li>陈旧闭包与内存问题的根源，都是旧环境仍被某个函数引用。</li>
</ul>
<p>一个函数执行结束后，里面创建的另一个函数仍然可以访问它的局部变量，这就是理解闭包最常见的入口。</p>
<p>更完整地说，闭包是函数与其创建时的词法环境的组合。函数以后在哪里被调用，不会把它原本的变量查找位置改成调用者的局部作用域。它仍然沿定义位置对应的作用域关系寻找名字。</p>
<h2>函数已经返回，count 为什么还能用</h2>
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
<p>createCounter 第一次执行时创建一个 count 绑定，以及两个能访问它的方法。外层函数返回的是这些函数所组成的对象。只要这些函数仍然可达，它们需要访问的外层状态就必须继续可用，不会仅因 createCounter 的调用栈帧结束而丢失。</p>
<p>first.increment 和 first.read 访问的是同一个 count，所以一个修改后，另一个能读到新值。第二次调用 createCounter 则创建另一份局部环境，second 不会与 first 共用计数。</p>
<p>这里的 count 没有暴露为 <code>first.count</code> 属性，外部只能通过返回的接口操作它。这是一种封装状态的方法；也可以使用类的私有字段等其他机制，选择取决于代码组织需要。</p>
<h2>闭包通常保存访问关系，不是拍一张变量快照</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> message = <span class="hljs-string">&#x27;早上的内容&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">readLive</span> = (<span class="hljs-params"></span>) =&gt; message;

<span class="hljs-keyword">const</span> savedMessage = message;
<span class="hljs-keyword">const</span> <span class="hljs-title function_">readSaved</span> = (<span class="hljs-params"></span>) =&gt; savedMessage;

message = <span class="hljs-string">&#x27;晚上的内容&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readLive</span>());  <span class="hljs-comment">// 晚上的内容</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">readSaved</span>()); <span class="hljs-comment">// 早上的内容</span>
</code></pre></div>
<p>readLive 读取的是 message 这个绑定的当前值，后来赋值会影响结果。readSaved 读取的是另一个绑定 savedMessage，这个绑定保存了当时的字符串值，所以结果不同。</p>
<p>这不是一种闭包“实时”、另一种闭包“不实时”，而是它们引用了不同的绑定。若 savedMessage 保存的是对象引用，那么它也不代表自动获得对象的深拷贝，对象内部属性仍可能被其他代码修改。</p>
<p>函数调用时产生的参数也属于调用的局部环境。把一个值作为参数交给函数，再让返回的回调使用该参数，可以有意识地保存那次调用的上下文，但需要清楚值本身是否还引用可变对象。</p>
<h2>“陈旧闭包”往往是旧环境仍被使用</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createReader</span>(<span class="hljs-params">count</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> count;
}

<span class="hljs-keyword">const</span> oldReader = <span class="hljs-title function_">createReader</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> newReader = <span class="hljs-title function_">createReader</span>(<span class="hljs-number">2</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">oldReader</span>()); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">newReader</span>()); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>两次调用有各自的 count。创建 newReader 并没有修改 oldReader 所在的旧环境，所以旧函数仍返回 1。它没有忘记更新，也不是 JavaScript 随机缓存了一个错误结果。</p>
<p>这有助于理解 React 等代码中的陈旧回调：不同渲染可能创建不同的局部环境，长期保留的回调可能仍引用某次旧渲染中的值。修复方式要根据所需语义选择重新建立订阅、正确维护依赖、使用合适的更新形式或读取受控的最新引用，不能笼统认为“所有闭包都应改成全局变量”。</p>
<h2>为什么回调、工厂函数都经常用到闭包</h2>
<p>事件处理器需要记住某个组件的局部状态，防抖函数需要记住上次定时器，函数工厂需要记住配置，这些都可以通过闭包完成。下面把点击次数绑定到两个实际 DOM 元素，并返回清理函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindCounter</span>(<span class="hljs-params">button, output</span>) {
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onClick</span>(<span class="hljs-params"></span>) {
    count += <span class="hljs-number">1</span>;
    output.<span class="hljs-property">textContent</span> = <span class="hljs-title class_">String</span>(count);
  }

  button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onClick);

  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">dispose</span>(<span class="hljs-params"></span>) {
    button.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, onClick);
  };
}
</code></pre></div>
<p>每次调用 bindCounter 都有自己的一份 count。onClick 记住 output 与 count，dispose 记住 button 与同一个 onClick 引用。正因为保留了正确的函数引用，清理时才能移除原监听器，而不是临时创建一个长得一样但身份不同的函数。</p>
<p>闭包不要求函数一定被返回，也不要求存在异步任务。只要函数按词法作用域使用外层绑定，就涉及这种机制；“返回一个内部函数”只是最容易观察外层调用结束后状态仍被保存的例子。</p>
<h2>循环里读到相同结果，问题在共享绑定</h2>
<p>var 循环变量让所有回调共享一个绑定，for 头里的 let 为每次迭代提供独立绑定。闭包没有失效，只是忠实读取了它捕获的绑定。可运行示例见《var、let、const 和暂时性死区有什么关系？》。</p>
<h2>闭包与内存泄漏有什么关系</h2>
<p>如果一个长期存活的监听器、定时器或订阅引用了某个回调，而回调又访问大型对象或 DOM 节点，这些对象就可能继续可达。组件已经不再需要它们，但引用关系没有清除，才会造成不必要的长期保留。</p>
<p>因此应在生命周期结束时移除监听、取消计时器、解除订阅，并检查缓存和清理函数是否仍被其他地方保存。闭包并不是“函数返回后内存永远无法释放”的机制；相关函数和状态都不再可达时，垃圾回收器仍然可以回收它们。</p>
<p>也不必假定每个闭包都会完整保存外层的所有变量或整份调用栈。具体保留与优化由引擎实现决定，应用能把握的是对象是否仍然可达，以及哪些长期对象持有了这些引用。发现内存持续增长时，应结合堆快照和引用路径找原因，而不是把所有内部函数都删掉。</p>`};export{e as default};