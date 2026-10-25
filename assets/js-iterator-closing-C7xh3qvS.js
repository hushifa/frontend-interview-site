var e={answerHtml:`<p>一个迭代器可能不仅仅是在返回数字，也可能持有文件、数据库游标、流读取器或订阅。消费者只取了第一项就停止时，需要有办法通知生产者：“剩下的我不读了，请处理结束工作。”</p>
<p>迭代器可选的 return() 方法就是这种协议入口。它与写在函数体里的 return 语句有关联但不是同一回事：语言会在适用的提前退出路径中查找并调用这个方法，方法内部再决定如何收尾。</p>
<h3>for...of 提前 break，会通知生成器结束</h3>
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
<p>循环在取得 1 后 break。生成器仍暂停在 yield 处，for...of 的关闭过程调用它的 return，使生成器开始结束，进入 finally。若这里持有真实资源，清理应写在这个受保护范围内。</p>
<p>如果生成器正常遍历到结尾，finally 也会按生成器自身的控制流执行。普通迭代器返回 done:true 时，消费者则不会额外再调用一次 return，生产者应当已经完成正常结束所需的工作。</p>
<h3>哪些路径需要区分</h3>
<table><thead><tr><th>情况</th><th>关键行为</th></tr></thead><tbody><tr><td>循环体 break、退出所在函数或抛错</td><td>for...of 在适用路径上尝试调用迭代器 return</td></tr><tr><td>继续当前循环的 continue</td><td>不结束这次遍历，继续请求后续项</td></tr><tr><td>next 返回 done:true</td><td>正常结束，不额外调用 return</td></tr><tr><td>直接手动 next 后把游标丢在一边</td><td>没有循环负责关闭，需要调用方安排</td></tr><tr><td>生产者 next 自身抛错</td><td>不能假定消费者会再调用 return</td></tr></tbody></table>
<p>带标签的 break 或 continue 要看是否真的离开了当前迭代循环，不能只凭代码里出现了某个关键字判断。数组解构等其他消费者也可能使用关闭协议，例如只取有限项后结束，而完整展开通常会持续消费到 done:true。</p>
<h3>next 自己失败，与循环体失败不同</h3>
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
<p>错误发生在生产者取下一项的过程，循环体还没有拿到值。在这条路径中，不能依赖 for...of 再替它调用 return。自定义迭代器如果 next 中出错会留下资源，应该在生产者自己的错误处理中清理。</p>
<p>Generator 用 try/finally 包住实际资源使用逻辑，通常更容易同时覆盖生产过程中抛错、正常结束和消费者关闭。注意只有执行已经进入那个 try，finally 才有机会按相应路径运行；生成器尚未开始时调用 return，不会凭空执行尚未进入的资源管理代码。</p>
<h3>清理也抛错，最后看到哪个错误</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">failingCleanup</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> {
    [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">iterator</span>]() { <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>; },
    <span class="hljs-title function_">next</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> { <span class="hljs-attr">value</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">done</span>: <span class="hljs-literal">false</span> }; },
    <span class="hljs-keyword">return</span>() { <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;清理失败&#x27;</span>); },
  };
}

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> value <span class="hljs-keyword">of</span> <span class="hljs-title function_">failingCleanup</span>()) <span class="hljs-keyword">break</span>;
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>); <span class="hljs-comment">// 清理失败</span>
}

<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> value <span class="hljs-keyword">of</span> <span class="hljs-title function_">failingCleanup</span>()) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;处理失败&#x27;</span>);
  }
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>); <span class="hljs-comment">// 处理失败</span>
}
</code></pre></div>
<p>break 本身没有一个正在传播的异常，清理失败会成为最后观察到的错误。若循环体已经抛出了异常，IteratorClose 的优先规则会保留原来的抛错，而不是让清理错误把它覆盖。</p>
<p>所以清理代码如果还需要记录自身失败，不能总是假设调用方最终会接收到它。具体系统应设计好诊断与资源状态报告，同时避免在清理中随意制造新的错误。</p>
<p>return 方法还应按协议返回一个对象，常见形式是 <code>{ done: true }</code>。若正常关闭路径返回原始值，会触发相应的协议错误；没有 return 方法的迭代器则没有这一步自定义清理入口。</p>
<h3>Generator 的 finally 里 yield，可能让清理再次暂停</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span>* <span class="hljs-title function_">delayedCleanup</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">yield</span> <span class="hljs-number">1</span>;
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-keyword">yield</span> <span class="hljs-string">&#x27;清理尚未完成&#x27;</span>;
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;最终清理&#x27;</span>);
  }
}

<span class="hljs-keyword">const</span> iterator = <span class="hljs-title function_">delayedCleanup</span>();
iterator.<span class="hljs-title function_">next</span>();
<span class="hljs-keyword">const</span> closing = iterator.<span class="hljs-keyword">return</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(closing.<span class="hljs-property">done</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(closing.<span class="hljs-property">value</span>); <span class="hljs-comment">// 清理尚未完成</span>
iterator.<span class="hljs-title function_">next</span>(); <span class="hljs-comment">// 输出：最终清理</span>
</code></pre></div>
<p>return 开始了结束过程，但 finally 中的 yield 又把生成器暂停了。普通 IteratorClose 主要检查 return 返回的是对象，并不会持续调用 next，直到你所有自定义清理步骤都结束。</p>
<p>因此不应把必需释放资源的动作放在一个还需要消费者额外 next 才能继续的 finally 后半段。清理路径应尽量直接、可重复调用，并明确谁负责真正完成释放。</p>
<h3>异步关闭与业务取消仍是两层问题</h3>
<p>for await...of 的相应关闭过程会等待异步 return 的结果，因此可以在异步生成器 finally 中 await 清理。但如果生产者 next 一直没有完成，外部仅仅“不想等了”并不会自动让该循环立即进入关闭。</p>
<p>底层请求、读取器或服务端任务是否停止，取决于 return/finally 是否真的连接了取消与释放操作。需要与 AbortSignal、reader.cancel、订阅取消函数等协议协作，不能只因为实现了一个名字叫 return 的方法，就认定网络和资源都已释放。</p>
<p>手动控制迭代时应明确资源所有权，按需要在 try/finally 中通知关闭，并处理异步结果。同步迭代协议不会替你等待一个随意放进同步 return 方法里的 Promise；有异步清理需求，就应使用对应的异步协议或显式 await。</p>`};export{e as default};