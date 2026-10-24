var e={answerHtml:`<p><code>this</code> 不是在定义函数时固定的普通变量。对普通函数来说，真正决定它的通常是调用表达式：<code>obj.fn()</code> 会把 <code>obj</code> 作为接收者，<code>fn.call(value)</code> 和 <code>fn.apply(value)</code> 会立即指定接收者，<code>fn.bind(value)</code> 则返回一个以后调用时仍使用该接收者的新函数。严格模式下，普通函数被直接调用时 <code>this</code> 是 <code>undefined</code>；非严格脚本还有旧的全局对象转换行为，不能把两种环境混在一起。</p>
<p>箭头函数没有自己的 <code>this</code>，它会从创建位置的词法作用域读取外层 <code>this</code>。因此 <code>call</code>、<code>apply</code> 和 <code>bind</code> 只能改变普通函数的调用方式，不能改写箭头函数已经捕获的值；箭头函数也没有自己的 <code>arguments</code>，不能使用 <code>new</code> 调用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> obj = {
  <span class="hljs-attr">value</span>: <span class="hljs-number">42</span>,
  <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) { <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>; },
  <span class="hljs-title function_">later</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span>;
  }
};
obj.<span class="hljs-title function_">read</span>(); <span class="hljs-comment">// 输出：42</span>
<span class="hljs-keyword">const</span> read = obj.<span class="hljs-property">read</span>;
<span class="hljs-title function_">read</span>(); <span class="hljs-comment">// 严格模式下是 undefined</span>
obj.<span class="hljs-title function_">later</span>()(); <span class="hljs-comment">// 箭头函数沿用 later 调用时的 obj</span>
</code></pre></div>
<p>把方法赋给变量、作为回调传递或从对象中解构出来，都会让原来的方法调用关系消失。需要保留对象时使用 <code>obj.read.bind(obj)</code>，或者在回调里用普通函数外包一层。对象方法适合依赖调用者的 <code>this</code>；对象属性上的箭头函数适合明确使用外层上下文的场景，两者不能只按语法长短选择。</p>
<p>事件监听、定时器和 Promise 回调经常让这个问题变得隐蔽：回调被谁调用，和它写在谁的对象里不是一回事。排查时先把函数单独赋值，再明确它最终由谁调用；如果需要的是组件或实例本身，优先使用稳定的绑定方式，避免在每次渲染或循环中无意创建大量包装函数。</p>`};export{e as default};