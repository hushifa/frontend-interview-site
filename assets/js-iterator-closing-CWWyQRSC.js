var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>return()</code> 是迭代器的可选方法，用于通知生产者&quot;不再读取，请清理&quot;，它必须返回一个对象。</li>
<li><code>for...of</code> 因 <code>break</code>、<code>return</code> 或循环体抛错提前退出时会调用 <code>return()</code>；数组解构没取完所有值时也会调用。</li>
<li>生成器的 <code>return()</code> 会从暂停的 <code>yield</code> 处结束执行，运行 <code>finally</code>，所以资源释放写在生成器的 <code>try/finally</code> 里。</li>
<li>迭代正常结束（<code>done: true</code>）、<code>next()</code> 自身抛错、手动调用 <code>next()</code> 后丢弃迭代器，这三种情况都不会调用 <code>return()</code>。</li>
<li>循环体已经抛错时，<code>return()</code> 中的错误会被丢弃，保留循环体的错误。</li>
</ul>
<h2>break 触发 finally</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span>* <span class="hljs-title function_">values</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">yield</span> <span class="hljs-number">1</span>;
    <span class="hljs-keyword">yield</span> <span class="hljs-number">2</span>;
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;释放资源&#x27;</span>);
  }
}

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> value <span class="hljs-keyword">of</span> <span class="hljs-title function_">values</span>()) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value); <span class="hljs-comment">// 1</span>
  <span class="hljs-keyword">break</span>;
}
<span class="hljs-comment">// 随后输出：释放资源</span>
</code></pre></div>
<p><code>const [first] = values()</code> 同样会输出&quot;释放资源&quot;。</p>
<h2>不会关闭的情况</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> closed = <span class="hljs-literal">false</span>;
<span class="hljs-keyword">const</span> source = {
  [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">iterator</span>]() {
    <span class="hljs-keyword">return</span> {
      <span class="hljs-title function_">next</span>(<span class="hljs-params"></span>) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;读取失败&#x27;</span>);
      },
      <span class="hljs-keyword">return</span>() {
        closed = <span class="hljs-literal">true</span>;
        <span class="hljs-keyword">return</span> { <span class="hljs-attr">done</span>: <span class="hljs-literal">true</span> };
      },
    };
  },
};

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> value <span class="hljs-keyword">of</span> source) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>); <span class="hljs-comment">// 读取失败</span>
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(closed); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>规范认为 <code>next()</code> 抛错时迭代器已经损坏，不再调用 <code>return()</code>。手写迭代器的 <code>next()</code> 需要在抛错前自己清理；用生成器的 <code>try/finally</code> 可以同时覆盖这三条路径。</p>
<p>手动消费时要自己负责关闭：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> iterator = <span class="hljs-title function_">values</span>();
<span class="hljs-keyword">try</span> {
  iterator.<span class="hljs-title function_">next</span>();
} <span class="hljs-keyword">finally</span> {
  iterator.<span class="hljs-property">return</span>?.();
}
</code></pre></div>
<h2>清理也失败时保留哪个错误</h2>
<table><thead><tr><th>退出原因</th><th><code>return()</code> 抛错</th><th>最终抛出</th></tr></thead><tbody><tr><td><code>break</code></td><td>是</td><td><code>return()</code> 的错误</td></tr><tr><td>循环体抛错</td><td>是</td><td>循环体的错误</td></tr></tbody></table>
<h2>异步迭代器</h2>
<p><code>for await...of</code> 提前退出时会 <code>await</code> 异步迭代器的 <code>return()</code>，所以异步生成器的 <code>finally</code> 中可以 <code>await reader.cancel()</code> 等清理操作。如果 <code>next()</code> 一直挂起，循环无法到达 <code>break</code>，关闭也不会发生；这时需要 <code>AbortSignal</code> 从外部取消底层请求。</p>
<h2>常见追问</h2>
<ul>
<li>生成器 <code>finally</code> 中再 <code>yield</code> 会怎样？<code>return()</code> 返回 <code>{ done: false }</code> 并再次暂停，清理没有完成；不要在 <code>finally</code> 中 <code>yield</code>。</li>
<li>Iterator helpers（<code>take</code>、<code>find</code> 等）会关闭源迭代器吗？会，提前结束时它们调用源迭代器的 <code>return()</code>。</li>
</ul>`};export{e as default};