var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如先登录、再拿用户信息、再拿订单列表，每一步都要等上一步的结果。用回调写，就是在第一个回调里发第二个请求，在第二个回调里发第三个请求，代码一层层往右缩进，每层还要单独处理失败，这就是回调地狱，也叫“厄运金字塔”。</p>
<p>Promise 的关键在于 <code>then</code> 会立即返回一个新的 Promise。上一步的回调里返回下一个请求的 Promise，下一个 <code>then</code> 就会等它完成再执行。这样嵌套就变成了一条从上往下的链，任何一步失败，都会跳过后面的 <code>then</code>，落到链尾的 <code>catch</code>。</p>
<p><code>then</code> 返回的新 Promise 结果怎么定，看回调做了什么：返回普通值，新 Promise 就以这个值兑现；什么都不返回，就以 <code>undefined</code> 兑现；抛出错误，就以这个错误拒绝；返回一个 Promise 或 thenable，就跟着它的最终结果走。</p>
<p>要注意两点。第一，在 <code>then</code> 里发起了异步操作却忘了 <code>return</code>，下一步就不会等它，拿到的是 <code>undefined</code>。第二，<code>then</code> 的参数不是函数时会被忽略，值会原样传下去，所以 <code>.then(42)</code> 不会把结果变成 42。</p>
</blockquote>
<h2>回调地狱长什么样</h2>
<p>MDN 用的例子是三个异步步骤依次执行，每一步都依赖上一步的结果：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">doSomething</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params">result</span>) {
  <span class="hljs-title function_">doSomethingElse</span>(result, <span class="hljs-keyword">function</span> (<span class="hljs-params">newResult</span>) {
    <span class="hljs-title function_">doThirdThing</span>(newResult, <span class="hljs-keyword">function</span> (<span class="hljs-params">finalResult</span>) {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`Got the final result: <span class="hljs-subst">\${finalResult}</span>\`</span>);
    }, failureCallback);
  }, failureCallback);
}, failureCallback);
</code></pre></div>
<p>问题不只是缩进难看。<code>failureCallback</code> 写了三遍，任何一层忘了传，那一步的错误就没人管了。回调里如果直接 <code>throw</code>，外面的 <code>try/catch</code> 也接不住，因为回调执行时外面的代码早就跑完了。</p>
<p>换成 Promise 链以后是这样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">doSomething</span>()
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> <span class="hljs-title function_">doSomethingElse</span>(result))
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">newResult</span>) =&gt;</span> <span class="hljs-title function_">doThirdThing</span>(newResult))
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">finalResult</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`Got the final result: <span class="hljs-subst">\${finalResult}</span>\`</span>))
  .<span class="hljs-title function_">catch</span>(failureCallback);
</code></pre></div>
<p>步骤还是那三步，但它们是平铺的，错误处理只写一次。MDN 也说明了 <code>catch(failureCallback)</code> 就是 <code>then(null, failureCallback)</code> 的简写。</p>
<h2>then 的返回值规则</h2>
<p>下面这条链把几种情况都走了一遍。注意每一步打印的值是从哪里来的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-number">1</span>)
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value + <span class="hljs-number">1</span>)
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value); <span class="hljs-comment">// 2</span>
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value); <span class="hljs-comment">// undefined</span>
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;等到了&#x27;</span>), <span class="hljs-number">10</span>));
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value); <span class="hljs-comment">// 等到了</span>
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;出错了&#x27;</span>);
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;这一行不会执行&#x27;</span>);
  })
  .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>); <span class="hljs-comment">// 出错了</span>
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;恢复&#x27;</span>;
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value); <span class="hljs-comment">// 恢复</span>
  });
</code></pre></div>
<p>第二个 <code>then</code> 打印了 2，却没有 <code>return</code>，所以第三个 <code>then</code> 收到的是 <code>undefined</code>。第三个 <code>then</code> 返回了一个 10 毫秒后才兑现的 Promise，第四个 <code>then</code> 就会等这 10 毫秒，拿到“等到了”，而不是拿到那个 Promise 对象本身。</p>
<p>第四个 <code>then</code> 抛了错，<code>then</code> 返回的 Promise 就被拒绝，后面那个只传了成功回调的 <code>then</code> 被跳过，错误一路往下找到 <code>catch</code>。<code>catch</code> 本身也返回新的 Promise，它的回调返回了“恢复”，链就回到成功状态，最后一个 <code>then</code> 照常执行。</p>
<p>这些规则在 MDN 的 <code>then()</code> 页面里写得很明确：回调返回值，新 Promise 以该值兑现；没有返回，以 <code>undefined</code> 兑现；抛错，以该错误拒绝；返回已兑现或已拒绝的 Promise，跟随它的值或原因；返回仍在等待的 Promise，等它落定后跟随它的结果。</p>
<h2>参数不是函数、返回 thenable 时会怎样</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;原值&#x27;</span>)
  .<span class="hljs-title function_">then</span>(<span class="hljs-number">42</span>)
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value)); <span class="hljs-comment">// 原值</span>

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;失败&#x27;</span>))
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> value)
  .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>)); <span class="hljs-comment">// 失败</span>

<span class="hljs-keyword">const</span> thenable = { <span class="hljs-title function_">then</span>(<span class="hljs-params">resolve</span>) { <span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;来自 thenable&#x27;</span>); } };
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>()
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> thenable)
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value)); <span class="hljs-comment">// 来自 thenable</span>
</code></pre></div>
<p><code>.then(42)</code> 为什么还是“原值”？MDN 说明，<code>onFulfilled</code> 不是函数时，内部会换成 <code>(x) =&gt; x</code>，把值原样传下去；<code>onRejected</code> 不是函数时，会换成 <code>(x) =&gt; { throw x; }</code>，把错误继续往下抛。第二段里只写了成功回调，拒绝原因就被这个“抛出函数”传给了后面的 <code>catch</code>。</p>
<p>第三段返回的是一个带 <code>then</code> 方法的普通对象，也就是 thenable。Promise 会调用它的 <code>then</code> 来取值，所以下一步拿到的是“来自 thenable”。MDN 的说法是，链上的 thenable 总会被解析，<code>onFulfilled</code> 永远收不到 thenable 本身。</p>
<p>还有一个边界：回调返回的正是 <code>then</code> 自己返回的那个 Promise，它就要等自己，永远等不完。规范规定这种情况以 <code>TypeError</code> 拒绝，在 Node.js 22.23 里运行 <code>const p = Promise.resolve().then(() =&gt; p)</code>，<code>p</code> 会被一个 <code>TypeError</code> 拒绝。</p>
<h2>链上的回调什么时候执行</h2>
<p><code>then</code> 的回调总是异步执行，就算 Promise 早就兑现了也一样，它会作为微任务排队，等当前同步代码跑完才执行。所以链上每一步之间都隔着至少一次微任务。具体顺序见<a href="/questions/js-event-loop/">《事件循环中，任务和微任务按什么顺序执行？》</a>。</p>
<h2>常见追问</h2>
<p><strong>then 和 catch 都返回新的 Promise，为什么不能把同一个 Promise 的 then 写两次当链用？</strong></p>
<blockquote>
<p><code>p.then(a); p.then(b);</code> 是给同一个 <code>p</code> 挂了两个回调，<code>a</code> 和 <code>b</code> 拿到的都是 <code>p</code> 的结果，互相不传值。要让 <code>b</code> 拿到 <code>a</code> 的返回值，必须写成 <code>p.then(a).then(b)</code>，在 <code>a</code> 返回的新 Promise 上继续挂。</p>
</blockquote>
<p><strong>catch 后面还能接 then 吗？</strong></p>
<blockquote>
<p>能。<code>catch</code> 也返回新的 Promise，它的回调正常返回，后面就继续走成功分支；在 <code>catch</code> 里再抛错，就交给更后面的 <code>catch</code>。可以利用这一点在中途兜底，让后续步骤继续执行。</p>
</blockquote>
<p><strong>有了 async/await 还需要懂 then 链吗？</strong></p>
<blockquote>
<p>需要。<code>await</code> 后面的值也按同样的规则解析，<code>async</code> 函数返回的也是 Promise。忘了 <code>return</code>、错误往哪里传这些问题，换成 <code>await</code> 写法依然存在，见<a href="/questions/js-async-await-errors/">《async/await 如何处理异常和并发？》</a>。</p>
</blockquote>`};export{e as default};