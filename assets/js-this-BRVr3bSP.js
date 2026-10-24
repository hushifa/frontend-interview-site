var e={answerHtml:`<p>普通函数的 <code>this</code> 通常由调用方式决定：<code>obj.fn()</code> 指向 <code>obj</code>；<code>call</code>、<code>apply</code> 或 <code>bind</code> 可以指定接收者。严格模式下独立调用函数时，<code>this</code> 是 <code>undefined</code>。</p>
<p>箭头函数没有自己的 <code>this</code>，它从外层词法作用域取得 <code>this</code>，不能通过 <code>call</code>、<code>apply</code>、<code>bind</code> 改变这个绑定，也不能作为构造函数使用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> obj = {
  <span class="hljs-attr">value</span>: <span class="hljs-number">42</span>,
  <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>; }
};
obj.<span class="hljs-title function_">read</span>(); <span class="hljs-comment">// 输出：42</span>
</code></pre></div>
<p>把方法赋给变量后独立调用，会丢失原来的方法调用接收者。需要保留接收者时，可使用 <code>bind</code> 或包装函数。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};