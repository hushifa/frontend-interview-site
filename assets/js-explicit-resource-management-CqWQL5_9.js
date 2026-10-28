var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>using x = resource</code> 在所在块结束时调用 <code>x[Symbol.dispose]()</code>，无论正常结束、<code>return</code> 还是抛错。</li>
<li><code>await using</code> 在离开作用域时调用并等待 <code>x[Symbol.asyncDispose]()</code>，只能用在 async 函数或模块顶层。</li>
<li>多个资源按声明的相反顺序释放。</li>
<li>主逻辑和释放都抛错时，最终抛出 <code>SuppressedError</code>：<code>error</code> 是释放时的错误，<code>suppressed</code> 是被它压住的错误。</li>
<li>资源数量不固定时用 <code>DisposableStack</code> / <code>AsyncDisposableStack</code>。</li>
</ul>
<h2>释放顺序</h2>
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
<p>等价于嵌套两层 <code>try/finally</code>。<code>using</code> 只认 <code>Symbol.dispose</code>，不会调用名为 <code>close</code> 的普通方法；值为 <code>null</code> 或 <code>undefined</code> 时跳过，其他缺少该方法的值会抛 <code>TypeError</code>。</p>
<h2>await using</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">work</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">using</span> connection = <span class="hljs-keyword">await</span> <span class="hljs-title function_">openConnection</span>();
  <span class="hljs-keyword">return</span> connection.<span class="hljs-title function_">query</span>(<span class="hljs-string">&#x27;select 1&#x27;</span>);
}
</code></pre></div>
<p>右侧的 <code>await</code> 等待获取资源，左侧的 <code>await using</code> 表示退出时等待异步释放。</p>
<h2>错误合并</h2>
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
<p>一个资源释放失败后，剩下的资源仍会继续释放。</p>
<h2>DisposableStack</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">openAll</span>(<span class="hljs-params">paths</span>) {
  <span class="hljs-keyword">using</span> stack = <span class="hljs-keyword">new</span> <span class="hljs-title class_">DisposableStack</span>();
  <span class="hljs-keyword">const</span> files = paths.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> stack.<span class="hljs-title function_">use</span>(<span class="hljs-title function_">openFile</span>(path)));
  <span class="hljs-keyword">const</span> owned = stack.<span class="hljs-title function_">move</span>(); <span class="hljs-comment">// 全部成功，转移所有权给调用方</span>
  <span class="hljs-keyword">return</span> { files, [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">dispose</span>]: <span class="hljs-function">() =&gt;</span> owned.<span class="hljs-title function_">dispose</span>() };
}
</code></pre></div>
<p>中途某个 <code>openFile</code> 抛错时，<code>stack</code> 退出作用域，已打开的文件被逆序关闭。<code>stack.adopt(value, fn)</code> 可以给没有实现协议的对象登记释放函数，<code>stack.defer(fn)</code> 登记任意清理回调。</p>
<h2>使用边界</h2>
<ul>
<li>生命周期必须和词法作用域一致。组件、订阅这类创建后长期存在的对象不适合在创建函数里 <code>using</code>。</li>
<li><code>await</code> 永远挂起时作用域不会结束，资源也不会释放；需要配合 <code>AbortSignal</code>。</li>
<li>进程被杀、页面关闭时清理不保证执行。</li>
<li>兼容性：<code>using</code> 是新语法，不支持的引擎会在解析阶段报错，无法用 <code>if</code> 降级。TypeScript 5.2 起可以把它编译成 <code>try/finally</code>，同时需要 <code>Symbol.dispose</code> 和 <code>DisposableStack</code> 的 polyfill。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 <code>try/finally</code> 比好在哪里？释放逻辑写在资源一侧，调用方不会忘记；多个资源不必层层嵌套。</li>
<li>和垃圾回收的关系？没有关系。GC 回收内存的时间不确定，<code>using</code> 在确定的时间点释放文件句柄、锁等外部资源。</li>
</ul>`};export{e as default};