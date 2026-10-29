var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>迭代器除了 <code>next()</code>，还可以有一个可选的 <code>return()</code> 方法。它的意思是消费者通知生产者：“我不再读了，请清理资源。”它必须返回一个对象。</p>
<p><code>for...of</code> 因为 <code>break</code>、<code>return</code> 或者循环体抛错提前退出时，会自动调用 <code>return()</code>；数组解构没有取完所有值时也会调用。对生成器来说，<code>return()</code> 会让它从暂停的 <code>yield</code> 处结束，并执行 <code>finally</code>，所以资源释放就写在生成器的 <code>try/finally</code> 里。</p>
<p>有三种情况不会调用 <code>return()</code>：迭代正常结束，<code>next()</code> 自己抛了错，以及手动调用 <code>next()</code> 后把迭代器丢下不管。</p>
<p>还有一个细节：如果循环体已经抛错，<code>return()</code> 里再抛的错会被丢掉，最终保留的是循环体的错误。</p>
</blockquote>
<h2>break 以后为什么还会输出“释放资源”</h2>
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
<p>循环只读了第一个值就 <code>break</code> 了，按理说生成器停在 <code>yield 1</code> 那里，后面的代码都不会执行。可它还是打印了“释放资源”。</p>
<p>因为 <code>for...of</code> 提前退出时，会调用迭代器的 <code>return()</code>。生成器收到 <code>return()</code>，就从暂停的 <code>yield</code> 处结束，结束之前要先执行 <code>finally</code>。所以写在 <code>finally</code> 里的清理代码一定会跑。</p>
<p>只取一部分的数组解构也一样，<code>const [first] = values()</code> 同样会输出“释放资源”。</p>
<h2>哪些情况不会调用 return</h2>
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
<p>循环确实因为错误提前退出了，可 <code>closed</code> 还是 <code>false</code>，<code>return()</code> 没有被调用。</p>
<p>区别在于错误是谁抛的。上一节是循环体自己要走，迭代器还是好的，需要通知它清理。这里是 <code>next()</code> 自己抛了错，规范认为迭代器已经坏了，不再调用它的 <code>return()</code>。所以手写迭代器时，<code>next()</code> 抛错之前要自己先清理。用生成器加 <code>try/finally</code> 就省心得多，正常结束、提前退出、内部出错这三条路径都会执行 <code>finally</code>。</p>
<p>手动调用 <code>next()</code> 的时候，没有 <code>for...of</code> 帮你关闭，要自己负责：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> iterator = <span class="hljs-title function_">values</span>();
<span class="hljs-keyword">try</span> {
  iterator.<span class="hljs-title function_">next</span>();
} <span class="hljs-keyword">finally</span> {
  iterator.<span class="hljs-property">return</span>?.();
}
</code></pre></div>
<p><code>return</code> 是可选方法，所以用 <code>?.()</code> 调用，没有这个方法也不会报错。</p>
<h2>清理也失败时保留哪个错误</h2>
<p>如果 <code>return()</code> 本身也抛错，最终抛出哪个，取决于循环是怎么退出的：</p>
<table><thead><tr><th>退出原因</th><th><code>return()</code> 抛错</th><th>最终抛出</th></tr></thead><tbody><tr><td><code>break</code></td><td>是</td><td><code>return()</code> 的错误</td></tr><tr><td>循环体抛错</td><td>是</td><td>循环体的错误</td></tr></tbody></table>
<p><code>break</code> 时本来没有错误，<code>return()</code> 的错误就是唯一的错误。循环体已经抛错时，那个错误更重要，<code>return()</code> 的错误会被丢掉。</p>
<h2>异步迭代器怎样关闭</h2>
<p><code>for await...of</code> 提前退出时，会调用并 <code>await</code> 异步迭代器的 <code>return()</code>。所以异步生成器的 <code>finally</code> 里可以写 <code>await reader.cancel()</code> 这类异步清理，循环会等它完成。</p>
<p>但如果 <code>next()</code> 一直挂起，比如卡在一个网络请求上，循环体根本执行不到，也就没机会 <code>break</code>，关闭不会发生。这时要用 <code>AbortSignal</code> 从外部取消底层请求。</p>
<h2>常见追问</h2>
<p><strong>生成器的 <code>finally</code> 里再写 <code>yield</code> 会怎样？</strong></p>
<blockquote>
<p><code>return()</code> 会返回 <code>{ done: false }</code>，生成器又停在了这个 <code>yield</code> 上，清理并没有做完。所以不要在 <code>finally</code> 里 <code>yield</code>。</p>
</blockquote>
<p><strong>Iterator helpers（<code>take</code>、<code>find</code> 等）会关闭源迭代器吗？</strong></p>
<blockquote>
<p>会。它们提前结束时，比如 <code>take(3)</code> 取够了 3 个，会调用源迭代器的 <code>return()</code>。</p>
</blockquote>`};export{e as default};