var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>打开文件、拿到锁、建立连接以后，用完必须释放。以前要手写 <code>try/finally</code> 保证释放，现在可以用 <code>using</code> 声明：<code>using x = resource</code>，等这个代码块结束时，不管是正常结束、<code>return</code> 还是抛错，都会自动调用 <code>x[Symbol.dispose]()</code>。</p>
<p>释放是异步的资源，比如要等网络关闭的连接，用 <code>await using</code>，它会调用并等待 <code>x[Symbol.asyncDispose]()</code>。它只能用在 async 函数或模块顶层。</p>
<p>多个资源会按声明的相反顺序释放，后拿到的先释放。如果主逻辑抛错，释放时又抛错，最终会得到一个 <code>SuppressedError</code>，它的 <code>error</code> 是释放时的错误，<code>suppressed</code> 是被压住的主逻辑错误。资源数量不固定时，用 <code>DisposableStack</code>。</p>
<p>要注意兼容性。这个特性在 TC39 列为 2027 版，MDN 标注为非 Baseline，部分浏览器还不支持。它是新语法，不支持的引擎在解析阶段就报错。</p>
</blockquote>
<h2>资源按什么顺序释放</h2>
<p>下面声明两个资源，注意释放的顺序和获取的顺序是反的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">resource</span>(<span class="hljs-params">name</span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`获取<span class="hljs-subst">\${name}</span>\`</span>);
  <span class="hljs-keyword">return</span> {
    [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">dispose</span>]() {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`释放<span class="hljs-subst">\${name}</span>\`</span>);
    },
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">work</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">using</span> first = <span class="hljs-title function_">resource</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
  <span class="hljs-keyword">using</span> second = <span class="hljs-title function_">resource</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;执行工作&#x27;</span>);
}

<span class="hljs-title function_">work</span>();
<span class="hljs-comment">// 输出：获取A → 获取B → 执行工作 → 释放B → 释放A</span>
</code></pre></div>
<p><code>work</code> 结束时，先释放 B 再释放 A。这样安排是因为后拿到的资源可能依赖前面的，比如先建立连接再开事务，那就要先结束事务再关连接。</p>
<p>这段代码的效果，等于自己写两层嵌套的 <code>try/finally</code>。<code>using</code> 只认 <code>Symbol.dispose</code> 这个方法，资源上有一个叫 <code>close</code> 的普通方法，它也不会去调。值是 <code>null</code> 或 <code>undefined</code> 时会跳过，其他没有这个方法的值会直接抛 <code>TypeError</code>。</p>
<h2>await using 里为什么有两个 await</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">work</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">using</span> connection = <span class="hljs-keyword">await</span> <span class="hljs-title function_">openConnection</span>();
  <span class="hljs-keyword">return</span> connection.<span class="hljs-title function_">query</span>(<span class="hljs-string">&#x27;select 1&#x27;</span>);
}
</code></pre></div>
<p>两个 <code>await</code> 管的是不同的事。右边的 <code>await</code> 是等待获取资源，也就是等 <code>openConnection()</code> 完成。左边的 <code>await using</code> 表示退出作用域时，要等待异步释放完成，才算真正离开。</p>
<h2>释放也出错时，得到哪个错误</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fail</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">using</span> resource = {
    [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">dispose</span>]() {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;释放失败&#x27;</span>);
    },
  };
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;工作失败&#x27;</span>);
}

<span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">fail</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// SuppressedError</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">error</span>.<span class="hljs-property">message</span>); <span class="hljs-comment">// 释放失败</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">suppressed</span>.<span class="hljs-property">message</span>); <span class="hljs-comment">// 工作失败</span>
}
</code></pre></div>
<p>主逻辑抛了“工作失败”，释放时又抛了“释放失败”。手写 <code>try/finally</code> 时，<code>finally</code> 里的错误会把原来的错误盖掉，原来的错误就丢了。</p>
<p><code>using</code> 不会丢。它把两个错误包成一个 <code>SuppressedError</code>：<code>error</code> 是后发生的释放错误，<code>suppressed</code> 是被它压住的工作错误，两个都能拿到。另外，一个资源释放失败以后，剩下的资源仍然会继续释放。</p>
<h2>资源数量不固定时怎么办</h2>
<p><code>using</code> 要求一个资源写一行声明。要打开一组数量不定的文件，就用 <code>DisposableStack</code>，它像一个容器，把资源一个个登记进去，最后一起释放。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">openAll</span>(<span class="hljs-params">paths</span>) {
  <span class="hljs-keyword">using</span> stack = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DisposableStack</span>();
  <span class="hljs-keyword">const</span> files = paths.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> stack.<span class="hljs-title function_">use</span>(<span class="hljs-title function_">openFile</span>(path)));
  <span class="hljs-keyword">const</span> owned = stack.<span class="hljs-title function_">move</span>(); <span class="hljs-comment">// 全部成功，转移所有权给调用方</span>
  <span class="hljs-keyword">return</span> { files, [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">dispose</span>]: <span class="hljs-function">() =&gt;</span> owned.<span class="hljs-title function_">dispose</span>() };
}
</code></pre></div>
<p>如果中途某个 <code>openFile</code> 抛错，<code>stack</code> 离开作用域，已经打开的文件会被逆序关闭，不会漏掉。</p>
<p>如果全部成功，这些文件要交给调用方继续用，不能在这里关掉。<code>stack.move()</code> 把登记的资源转移到一个新的栈 <code>owned</code> 上，原来的 <code>stack</code> 变空，退出时就什么都不释放。调用方拿到返回值以后，再自己决定什么时候释放。</p>
<p>还有两个登记方法：<code>stack.adopt(value, fn)</code> 给没有实现释放协议的对象配一个释放函数，<code>stack.defer(fn)</code> 登记任意一个清理回调。</p>
<h2>什么场景不适合用</h2>
<p><code>using</code> 的释放时机是跟着代码块走的，所以资源的生命周期必须和作用域一致。组件、订阅这类创建以后要长期存在的对象，不适合在创建它的函数里用 <code>using</code>，否则函数一返回它就被释放了。</p>
<p>如果代码块里有一个 <code>await</code> 永远不结束，作用域就不会结束，资源也不会释放，这时要配合 <code>AbortSignal</code> 去取消。进程被杀掉、页面被关闭时，清理代码也不保证会执行。</p>
<p>兼容性方面，因为是新语法，不支持的引擎在解析阶段就会报错，没法用 <code>if</code> 判断后降级。TypeScript 5.2 起可以把它编译成 <code>try/finally</code>，但运行时还需要 <code>Symbol.dispose</code> 和 <code>DisposableStack</code> 的 polyfill。</p>
<h2>常见追问</h2>
<p><strong>和 <code>try/finally</code> 比好在哪里？</strong></p>
<blockquote>
<p>释放逻辑写在资源自己身上，调用方只要写 <code>using</code>，就不会忘记释放。多个资源也不用一层套一层地嵌套 <code>try/finally</code>，而且两个错误都能保留下来。</p>
</blockquote>
<p><strong>它和垃圾回收有关系吗？</strong></p>
<blockquote>
<p>没有关系。垃圾回收只管内存，而且什么时候回收不确定。<code>using</code> 是在确定的时间点释放文件句柄、锁这类外部资源。</p>
</blockquote>`};export{e as default};