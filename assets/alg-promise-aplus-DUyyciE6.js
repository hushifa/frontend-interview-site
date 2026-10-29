var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>手写 Promise 要抓住三件事。</p>
<p>第一，状态只能变一次。从 pending 变成 fulfilled 或 rejected 以后，就不能再变了。<code>resolve</code>、<code>reject</code> 和执行器抛错共用一个 <code>called</code> 标记，谁先到谁生效，之后的调用全部忽略。</p>
<p>第二，<code>then</code> 返回一个新的 Promise，回调要异步执行。回调不是函数时，直接把当前结果原样传给下一个，这叫值穿透；回调抛错，新 Promise 就失败。就算 Promise 已经完成了，回调也要等当前代码执行完再跑，这里用 <code>queueMicrotask</code> 放进微任务队列，和原生 Promise 一样。</p>
<p>第三，回调的返回值要经过“解决过程”处理。返回的是这个 Promise 自己，就用 <code>TypeError</code> 拒绝；返回的是对象或函数，只读一次它的 <code>then</code>，读的时候报错就拒绝；<code>then</code> 是函数，就当 thenable 处理，它的两个回调和抛错都只认第一次。还要知道，Promises/A+ 只规定了 <code>then</code>，<code>catch</code>、<code>finally</code>、<code>Promise.resolve</code>、<code>Promise.all</code> 都不在这个规范里。</p>
</blockquote>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">PENDING</span> = <span class="hljs-string">&#x27;pending&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">FULFILLED</span> = <span class="hljs-string">&#x27;fulfilled&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">REJECTED</span> = <span class="hljs-string">&#x27;rejected&#x27;</span>;

<span class="hljs-keyword">class</span> <span class="hljs-title class_">MyPromise</span> {
  #state = <span class="hljs-variable constant_">PENDING</span>;
  #value = <span class="hljs-literal">undefined</span>;
  #handlers = [];

  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">executor</span>) {
    <span class="hljs-keyword">let</span> called = <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">resolve</span> = (<span class="hljs-params">value</span>) =&gt; {
      <span class="hljs-keyword">if</span> (!called) {
        called = <span class="hljs-literal">true</span>;
        <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">resolve</span>(value);
      }
    };
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">reject</span> = (<span class="hljs-params">reason</span>) =&gt; {
      <span class="hljs-keyword">if</span> (!called) {
        called = <span class="hljs-literal">true</span>;
        <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">settle</span>(<span class="hljs-variable constant_">REJECTED</span>, reason);
      }
    };
    <span class="hljs-keyword">try</span> {
      <span class="hljs-title function_">executor</span>(resolve, reject);
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-title function_">reject</span>(error); <span class="hljs-comment">// 已经 resolve 过时被 called 挡住</span>
    }
  }

  <span class="hljs-comment">// Promise 解决过程，对应规范 2.3</span>
  #<span class="hljs-title function_">resolve</span>(<span class="hljs-params">x</span>) {
    <span class="hljs-keyword">if</span> (x === <span class="hljs-variable language_">this</span>) {
      <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">settle</span>(<span class="hljs-variable constant_">REJECTED</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;Chaining cycle detected&#x27;</span>));
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">if</span> (x !== <span class="hljs-literal">null</span> &amp;&amp; (<span class="hljs-keyword">typeof</span> x === <span class="hljs-string">&#x27;object&#x27;</span> || <span class="hljs-keyword">typeof</span> x === <span class="hljs-string">&#x27;function&#x27;</span>)) {
      <span class="hljs-keyword">let</span> then;
      <span class="hljs-keyword">try</span> {
        then = x.<span class="hljs-property">then</span>; <span class="hljs-comment">// 只读一次，then 可能是有副作用的 getter</span>
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">settle</span>(<span class="hljs-variable constant_">REJECTED</span>, error);
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> then === <span class="hljs-string">&#x27;function&#x27;</span>) {
        <span class="hljs-keyword">let</span> called = <span class="hljs-literal">false</span>; <span class="hljs-comment">// thenable 可能多次调用回调，只认第一次</span>
        <span class="hljs-keyword">try</span> {
          then.<span class="hljs-title function_">call</span>(
            x,
            <span class="hljs-function">(<span class="hljs-params">y</span>) =&gt;</span> {
              <span class="hljs-keyword">if</span> (!called) {
                called = <span class="hljs-literal">true</span>;
                <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">resolve</span>(y); <span class="hljs-comment">// y 仍可能是 thenable，递归解决</span>
              }
            },
            <span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> {
              <span class="hljs-keyword">if</span> (!called) {
                called = <span class="hljs-literal">true</span>;
                <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">settle</span>(<span class="hljs-variable constant_">REJECTED</span>, r);
              }
            },
          );
        } <span class="hljs-keyword">catch</span> (error) {
          <span class="hljs-keyword">if</span> (!called) {
            called = <span class="hljs-literal">true</span>;
            <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">settle</span>(<span class="hljs-variable constant_">REJECTED</span>, error);
          }
        }
        <span class="hljs-keyword">return</span>;
      }
    }
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">settle</span>(<span class="hljs-variable constant_">FULFILLED</span>, x);
  }

  #<span class="hljs-title function_">settle</span>(<span class="hljs-params">state, value</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.#state !== <span class="hljs-variable constant_">PENDING</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-variable language_">this</span>.#state = state;
    <span class="hljs-variable language_">this</span>.#value = value;
    <span class="hljs-variable language_">this</span>.#handlers.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">handler</span>) =&gt;</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">run</span>(handler));
    <span class="hljs-variable language_">this</span>.#handlers = [];
  }

  #<span class="hljs-title function_">run</span>(<span class="hljs-params">{ onFulfilled, onRejected, resolve, reject }</span>) {
    <span class="hljs-title function_">queueMicrotask</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> callback = <span class="hljs-variable language_">this</span>.#state === <span class="hljs-variable constant_">FULFILLED</span> ? onFulfilled : onRejected;
      <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> callback !== <span class="hljs-string">&#x27;function&#x27;</span>) {
        <span class="hljs-comment">// 值穿透：把结果原样交给下一个 Promise</span>
        (<span class="hljs-variable language_">this</span>.#state === <span class="hljs-variable constant_">FULFILLED</span> ? resolve : reject)(<span class="hljs-variable language_">this</span>.#value);
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-keyword">try</span> {
        <span class="hljs-title function_">resolve</span>(<span class="hljs-title function_">callback</span>(<span class="hljs-variable language_">this</span>.#value));
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-title function_">reject</span>(error);
      }
    });
  }

  <span class="hljs-title function_">then</span>(<span class="hljs-params">onFulfilled, onRejected</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">MyPromise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> handler = { onFulfilled, onRejected, resolve, reject };
      <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.#state === <span class="hljs-variable constant_">PENDING</span>) <span class="hljs-variable language_">this</span>.#handlers.<span class="hljs-title function_">push</span>(handler);
      <span class="hljs-keyword">else</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">run</span>(handler);
    });
  }
}
</code></pre></div>
<p>代码分成三块来看。</p>
<p><code>constructor</code> 负责“只变一次”。<code>resolve</code> 和 <code>reject</code> 共用一个 <code>called</code>，执行器里如果先 <code>resolve</code> 再抛错，抛错走到 <code>catch</code> 里调 <code>reject</code>，会被 <code>called</code> 挡住。</p>
<p><code>then</code> 负责“返回新 Promise”。它把回调和新 Promise 的 <code>resolve</code>、<code>reject</code> 打包成一个 <code>handler</code>。还在 pending 就先存起来，等 <code>#settle</code> 时统一执行；已经完成了就直接交给 <code>#run</code>。<code>#run</code> 里统一用 <code>queueMicrotask</code>，所以回调永远是异步的。</p>
<p><code>#resolve</code> 就是规范里的解决过程。为什么 <code>then</code> 只能读一次，要先存进变量？因为 <code>then</code> 可能是一个 getter，每读一次都会执行一段代码，读两次可能得到不同的结果。为什么 thenable 的回调要用自己的 <code>called</code>？因为别人写的 thenable 可能既调成功回调又调失败回调，或者调好几次，只能认第一次。</p>
<p>还有一处容易看漏：<code>#run</code> 里调用的 <code>resolve</code>，是新 Promise 构造时拿到的那个，它会再走一遍 <code>#resolve</code>。所以回调返回了另一个 Promise 或 thenable 时，新 Promise 会等它、跟着它的结果走。这就是链式调用能“拍平”嵌套 Promise 的原因。</p>
<h2>用规范的测试来验证</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> promisesAplusTests = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;promises-aplus-tests&#x27;</span>);

<span class="hljs-keyword">const</span> adapter = {
  <span class="hljs-title function_">deferred</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">let</span> resolve;
    <span class="hljs-keyword">let</span> reject;
    <span class="hljs-keyword">const</span> promise = <span class="hljs-keyword">new</span> <span class="hljs-title class_">MyPromise</span>(<span class="hljs-function">(<span class="hljs-params">res, rej</span>) =&gt;</span> {
      resolve = res;
      reject = rej;
    });
    <span class="hljs-keyword">return</span> { promise, resolve, reject };
  },
};

<span class="hljs-title function_">promisesAplusTests</span>(adapter, <span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (err) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(err);
});
<span class="hljs-comment">// 本实现在 Node.js 中运行输出：872 passing</span>
</code></pre></div>
<p><code>promises-aplus-tests</code> 是规范官方的测试套件，它只需要一个 <code>deferred</code> 方法，用来创建 Promise 并拿到它的 <code>resolve</code> 和 <code>reject</code>。</p>
<p>因为实现了标准的 <code>then</code>，原生的 <code>Promise.resolve(myPromise)</code> 和 <code>await myPromise</code> 也能把它当成 thenable 来用。</p>
<h2>常见追问</h2>
<p><strong>已经完成的 Promise，为什么不能同步执行回调？</strong></p>
<blockquote>
<p>那样回调有时是同步的、有时是异步的，取决于调用 <code>then</code> 时 Promise 完成没有。调用方的代码执行顺序就会跟着状态变，很难预测。所以规范要求统一等当前执行栈清空后再运行。</p>
</blockquote>
<p><strong>怎么补上 <code>catch</code> 和 <code>finally</code>？</strong></p>
<blockquote>
<p><code>catch(fn)</code> 就是 <code>then(undefined, fn)</code>。<code>finally</code> 的回调不接收结果，执行完以后把原来的结果或者原来的错误继续往下传。</p>
</blockquote>
<p><strong>静态方法怎么实现？</strong></p>
<blockquote>
<p>以 <code>Promise.all</code> 为例，见<a href="/questions/alg-promise-all/">《怎样实现保持输入顺序的 Promise.all 教学版本？》</a>。</p>
</blockquote>`};export{e as default};