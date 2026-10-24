var e={answerHtml:`<p>普通函数的 <code>this</code> 通常由调用方式决定：<code>obj.fn()</code> 指向 <code>obj</code>；<code>call</code>、<code>apply</code> 或 <code>bind</code> 可以指定接收者。严格模式下独立调用函数时，<code>this</code> 是 <code>undefined</code>。</p>
<p>箭头函数没有自己的 <code>this</code>，它从外层词法作用域取得 <code>this</code>，不能通过 <code>call</code>、<code>apply</code>、<code>bind</code> 改变这个绑定，也不能作为构造函数使用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> obj = {
  <span class="hljs-attr">value</span>: <span class="hljs-number">42</span>,
  <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>; }
};
obj.<span class="hljs-title function_">read</span>(); <span class="hljs-comment">// 输出：42</span>
</code></pre></div>
<p>把方法赋给变量后独立调用，会丢失原来的方法调用接收者。需要保留接收者时，可使用 <code>bind</code> 或包装函数。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。可先用一个最小示例验证“this、箭头函数、函数”，再补充空值、异常和兼容性边界。</p>`};export{e as default};