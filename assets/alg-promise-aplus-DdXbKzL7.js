var e={answerHtml:`<h2>简答</h2>
<ul>
<li>状态只能改变一次：<code>resolve</code>、<code>reject</code> 和执行器抛错共用一个 <code>called</code> 标记，先到的生效，之后的调用全部忽略。</li>
<li><code>then</code> 返回新的 Promise。回调不是函数时直接把当前结果传下去（值穿透）；回调抛错时新 Promise 拒绝。</li>
<li>回调必须在当前执行栈清空后才运行，即使 Promise 已经完成。这里用 <code>queueMicrotask</code>，与原生 Promise 一样放入微任务队列。</li>
<li>解决过程：值是 Promise 自身时以 <code>TypeError</code> 拒绝；值是对象或函数时只读取一次 <code>then</code>，读取抛错就拒绝；<code>then</code> 是函数时按 thenable 处理，它的两个回调和抛错只认第一次。</li>
<li>Promises/A+ 只规定 <code>then</code> 的行为，<code>catch</code>、<code>finally</code>、<code>Promise.resolve</code> 和 <code>Promise.all</code> 都不在规范中。</li>
</ul>
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
<p><code>#run</code> 中的 <code>resolve</code> 是新 Promise 构造时拿到的那个，它会再次进入解决过程，所以回调返回另一个 Promise 或 thenable 时，新 Promise 会跟随它的结果。</p>
<h2>用规范测试验证</h2>
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
<p>因为实现了标准的 <code>then</code>，原生 <code>Promise.resolve(myPromise)</code> 和 <code>await myPromise</code> 也能把它当作 thenable 使用。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不能同步执行已完成 Promise 的回调？那样回调有时同步、有时异步，调用方的代码顺序会随状态变化。规范要求统一在执行栈清空后运行。</li>
<li>怎样补上 <code>catch</code> 和 <code>finally</code>？<code>catch(fn)</code> 就是 <code>then(undefined, fn)</code>。<code>finally</code> 的回调不接收结果，执行后把原结果或原错误继续传下去。</li>
<li>静态方法怎样实现？以 <code>Promise.all</code> 为例，见<a href="/questions/alg-promise-all/">《怎样实现保持输入顺序的 Promise.all 教学版本？》</a>。</li>
</ul>`};export{e as default};