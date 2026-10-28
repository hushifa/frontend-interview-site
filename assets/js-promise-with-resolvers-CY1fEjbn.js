var e={answerHtml:`<p>有些异步 API 的结果不是由当前函数里的 <code>await</code> 直接产生的，而是由稍后到达的事件、消息或回调完成。例如，组件要等待一次 Worker 响应，或者一个事件适配器要把一次 <code>load</code>/<code>error</code> 回调转换成 Promise。以前常见的写法是先声明变量，再在 Promise 构造器里给它们赋值：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> resolveReady;
<span class="hljs-keyword">let</span> rejectReady;
<span class="hljs-keyword">const</span> ready = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
  resolveReady = resolve;
  rejectReady = reject;
});
</code></pre></div>
<p>这种写法能工作，但变量初始化时机、类型推断和代码阅读都比较别扭。<code>Promise.withResolvers()</code> 返回同一组对象：<code>promise</code>、<code>resolve</code> 和 <code>reject</code>，让“等待结果”和“以后完成结果”的边界更明显。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();

<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;Worker 已准备好&#x27;</span>), <span class="hljs-number">20</span>);
promise.<span class="hljs-title function_">then</span>(<span class="hljs-variable language_">console</span>.<span class="hljs-property">log</span>);
</code></pre></div>
<p>它只改变 Promise 的创建方式，不会创建线程、启动任务或自动监听事件。<code>resolve</code> 和 <code>reject</code> 只是完成这个 Promise 的入口，真正的资源生命周期仍由调用方负责。</p>
<h2>它最适合桥接一次性事件</h2>
<p>下面是一个等待 Worker 首次发送 <code>ready</code> 或 <code>error</code> 的适配器。事件监听器在 Promise 结算后立即移除，避免 Worker 永远存活时保留闭包和调用方对象：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">waitForWorkerReady</span>(<span class="hljs-params">worker, timeout = <span class="hljs-number">5000</span></span>) {
  <span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();
  <span class="hljs-keyword">let</span> timer;

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">cleanup</span> = (<span class="hljs-params"></span>) =&gt; {
    worker.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
    worker.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, onError);
    <span class="hljs-built_in">clearTimeout</span>(timer);
  };

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">finish</span> = (<span class="hljs-params">callback, value</span>) =&gt; {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">callback</span>(value);
  };

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span>?.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;ready&#x27;</span>) {
      <span class="hljs-title function_">finish</span>(resolve, event.<span class="hljs-property">data</span>.<span class="hljs-property">version</span>);
    }
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onError</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-title function_">finish</span>(reject, event.<span class="hljs-property">error</span> ?? <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;Worker 启动失败&#x27;</span>));
  }

  worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
  worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, onError);
  timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">finish</span>(reject, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;等待 Worker 启动超时&#x27;</span>));
  }, timeout);

  <span class="hljs-keyword">return</span> promise;
}
</code></pre></div>
<p>事件可能先后触发多次，但 Promise 只有第一次结算有效；<code>resolve</code> 或 <code>reject</code> 后再次调用不会改变已经观察到的结果。不过不能因此省略清理：后续消息仍会调用监听器，监听器可能触发额外日志、更新状态或持有资源。示例用 <code>cleanup</code> 让“完成 Promise”和“释放观察者”成为同一个结束路径。</p>
<h2>外部完成器不是取消机制</h2>
<p>把 <code>resolve</code> 保存到对象上并不等于可以取消底层工作：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">waitForResult</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> deferred = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();
  <span class="hljs-title function_">longRunningTask</span>(<span class="hljs-function">() =&gt;</span> deferred.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;完成&#x27;</span>));
  <span class="hljs-keyword">return</span> deferred.<span class="hljs-property">promise</span>;
}
</code></pre></div>
<p>调用方即使不再等待返回值，<code>longRunningTask</code> 仍可能继续占用网络、定时器、Worker 或文件资源。若任务需要取消，应同时设计 <code>AbortSignal</code> 或显式 <code>cancel()</code>，并让底层操作真正响应它：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">waitForMessage</span>(<span class="hljs-params">worker, signal</span>) {
  <span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">cleanup</span> = (<span class="hljs-params"></span>) =&gt; {
    worker.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
    worker.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, onError);
    signal.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
  };

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onMessage</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">resolve</span>(event.<span class="hljs-property">data</span>);
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onError</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">reject</span>(event.<span class="hljs-property">error</span> ?? <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;Worker 通信失败&#x27;</span>));
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onAbort</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">cleanup</span>();
    <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span> ?? <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMException</span>(<span class="hljs-string">&#x27;操作已取消&#x27;</span>, <span class="hljs-string">&#x27;AbortError&#x27;</span>));
  }

  <span class="hljs-keyword">if</span> (signal.<span class="hljs-property">aborted</span>) {
    <span class="hljs-title function_">onAbort</span>();
  } <span class="hljs-keyword">else</span> {
    worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, onMessage);
    worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, onError);
    signal.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  }

  <span class="hljs-keyword">return</span> promise;
}
</code></pre></div>
<p>这里的取消只拒绝等待方并移除监听器；Worker 当前正在执行的同步循环仍可能继续。需要停止它时，Worker 任务本身要在检查点读取取消状态，或者在确认可以丢弃任务时调用 <code>terminate()</code>。<code>Promise.withResolvers()</code> 不会改变这些底层语义。</p>
<h2>一个 deferred 只能表示一次结果</h2>
<p><code>Promise.withResolvers()</code> 很容易被写成一个公共的“事件总线”：每次消息到达都调用 <code>resolve</code>，期待下一个调用者继续收到结果。Promise 不是队列，第一次 resolve 后后续值都会被丢弃：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> next = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();
next.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;第一条&#x27;</span>);
next.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;第二条&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> next.<span class="hljs-property">promise</span>); <span class="hljs-comment">// 第一条</span>
</code></pre></div>
<p>如果需要连续消息，应使用 <code>AsyncIterator</code>、<code>ReadableStream</code>、明确的数组队列或事件订阅接口，并定义缓冲上限和背压。一个 Promise 只适合表达“一次准备完成”“一次关闭”“一次请求结果”这类单次信号。</p>
<p>同样，不要把 deferred 当成跨请求全局状态。请求结束后仍保留 <code>resolve</code>，会让请求上下文、用户数据或数据库连接被闭包持有。组件卸载、请求超时、服务器关闭和测试结束时，都应让待处理的 Promise 进入明确的完成、拒绝或取消路径。</p>
<h2>超时要与真正的清理绑定</h2>
<p>给 Promise 套一个 <code>Promise.race</code> 只能让调用方更早得到超时结果，并不会自动结束另一个 Promise 背后的工作：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> timeout = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">_, reject</span>) =&gt;</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;超时&#x27;</span>)), <span class="hljs-number">1000</span>);
});

<span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>([<span class="hljs-title function_">waitForExternalTask</span>(), timeout]);
</code></pre></div>
<p>如果 <code>waitForExternalTask()</code> 仍在监听 socket 或占用 Worker，超时后它还会继续运行。更可靠的设计是让超时触发同一个取消信号，并在 <code>finally</code> 中清理资源：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">withTimeout</span>(<span class="hljs-params">start, milliseconds</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(
    <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务超时&#x27;</span>)),
    milliseconds,
  );

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">start</span>(controller.<span class="hljs-property">signal</span>);
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    controller.<span class="hljs-title function_">abort</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务已结束&#x27;</span>));
  }
}
</code></pre></div>
<p>这个辅助函数要求 <code>start</code> 真正把 signal 传入下游；如果下游不支持取消，仍只能停止等待并在结果返回后检查任务是否已经过期。对于数据库写入、支付和发布消息等副作用，超时也不代表服务端没有成功，结果需要通过幂等键或状态查询确认。</p>
<h2>错误传播和同步异常要保持一致</h2>
<p>事件回调中的同步异常不会自动变成等待 Promise 的拒绝，除非回调适配器显式捕获：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">fromCallback</span>(<span class="hljs-params">register</span>) {
  <span class="hljs-keyword">const</span> { promise, resolve, reject } = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">withResolvers</span>();

  <span class="hljs-keyword">try</span> {
    <span class="hljs-title function_">register</span>(resolve, reject);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-title function_">reject</span>(error);
  }

  <span class="hljs-keyword">return</span> promise;
}
</code></pre></div>
<p>如果 <code>register</code> 在注册过程中抛错，调用者仍然可以通过 <code>await</code> 的 <code>try/catch</code> 统一处理。生产适配器还应处理注册函数返回的清理方法、回调重复触发和参数校验；不能因为 Promise 只结算一次，就忽略重复回调对外部状态的影响。</p>
<h2>兼容性和选型边界</h2>
<p><code>Promise.withResolvers()</code> 是较新的 ECMAScript 能力。项目需要根据目标浏览器、Node.js 版本和构建目标确认支持情况；不支持时可以用 Promise 构造器封装一个等价的工厂，但要保留同样的清理、取消和错误语义。不要仅因为 TypeScript 能找到类型声明，就认为运行时一定存在该方法。</p>
<p>它适合把一次性回调或事件转换成 Promise，改善初始化和完成信号的表达。它不适合替代：</p>
<ul>
<li>多条消息的队列或流；</li>
<li>需要中止底层工作的取消协议；</li>
<li>需要状态转换、重试和幂等的后台任务；</li>
<li>需要等待多个资源并统一排空的生命周期管理。</li>
</ul>
<p>面试中完整的回答应先说清 Promise 的一次性结算性质，再说明 <code>withResolvers</code> 只是把已有的 resolve/reject 暴露方式标准化。真正决定实现是否可靠的，是监听器何时注册和清理、超时是否能停止底层工作、取消是否与副作用语义一致，以及多次事件是否需要改用队列或流。</p>`};export{e as default};