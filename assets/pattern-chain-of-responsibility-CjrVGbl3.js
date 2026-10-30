var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>请假审批是最直观的例子：一天以内组长批，五天以内经理批，再长交给总监。申请人不用知道最后谁来批，只要交给第一个人，不归自己管的就往上传。职责链模式就是把多个处理者串成一条链，请求从头往后传，每个处理者自己决定处理、交给下一个，还是直接拦下。</p>
<p>这样做的好处是发送方和处理方解耦了。新增一个处理环节、调整顺序，只要改链的组成，不用改每个处理者内部的代码。</p>
<p>前端最常见的就是中间件和拦截器。Koa 的中间件调用 <code>await next()</code> 把控制权交给下一个，下游执行完再回到自己，可以在前后各做一件事，比如记录耗时；某个中间件不调用 <code>next()</code>，链就在这里断开，比如鉴权失败直接返回 401。axios 的拦截器在请求发出前统一加 token，在响应回来后统一处理错误。</p>
<p>要注意两点。一是顺序很重要，鉴权要放在业务处理之前，日志放在最外层才能统计完整耗时。二是链太长时，一个请求最后落到哪里不容易看出来，出问题要在每一环加日志排查。</p>
</blockquote>
<h2>先写一个最简单的职责链</h2>
<p>审批链里，每个处理者要么返回结果，要么返回 <code>undefined</code> 表示“不归我管”，交给下一个。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 职责链：每个处理者决定自己处理，还是交给下一个</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createChain</span>(<span class="hljs-params">handlers</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handle</span>(<span class="hljs-params">request</span>) {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> handler <span class="hljs-keyword">of</span> handlers) {
      <span class="hljs-keyword">const</span> result = <span class="hljs-title function_">handler</span>(request);
      <span class="hljs-keyword">if</span> (result !== <span class="hljs-literal">undefined</span>) <span class="hljs-keyword">return</span> result;
    }
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;没有人处理&#x27;</span>;
  };
}

<span class="hljs-keyword">const</span> approve = <span class="hljs-title function_">createChain</span>([
  <span class="hljs-function">(<span class="hljs-params">days</span>) =&gt;</span> (days &lt;= <span class="hljs-number">1</span> ? <span class="hljs-string">&#x27;组长审批&#x27;</span> : <span class="hljs-literal">undefined</span>),
  <span class="hljs-function">(<span class="hljs-params">days</span>) =&gt;</span> (days &lt;= <span class="hljs-number">5</span> ? <span class="hljs-string">&#x27;经理审批&#x27;</span> : <span class="hljs-literal">undefined</span>),
  <span class="hljs-function">(<span class="hljs-params">days</span>) =&gt;</span> (days &lt;= <span class="hljs-number">15</span> ? <span class="hljs-string">&#x27;总监审批&#x27;</span> : <span class="hljs-literal">undefined</span>),
]);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">approve</span>(<span class="hljs-number">1</span>));  <span class="hljs-comment">// 组长审批</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">approve</span>(<span class="hljs-number">3</span>));  <span class="hljs-comment">// 经理审批</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">approve</span>(<span class="hljs-number">30</span>)); <span class="hljs-comment">// 没有人处理</span>
</code></pre></div>
<p>请 3 天假，组长那一环判断不归自己，交给经理，经理处理了，链就停在这里。30 天谁都不处理，走到链尾返回兜底结果。</p>
<p>如果以后要在经理和总监之间加一个“部门负责人”，只要往数组里插一项，其他处理者都不用改。</p>
<h2>中间件为什么能在前后都做事</h2>
<p>上面的链是“找到一个处理者就停”。中间件更进一步：每一层拿到一个 <code>next</code> 函数，调用它就进入下一层，下一层执行完再回到当前层继续往下走。所以一层可以在 <code>next()</code> 前做准备，在 <code>next()</code> 后做收尾，这就是 Koa 文档说的先向下游执行、再把控制流交回上游，常被叫作洋葱模型。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 洋葱式中间件：每一层可以在 next() 前后各做一件事</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">compose</span>(<span class="hljs-params">middlewares</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">context</span>) {
    <span class="hljs-keyword">function</span> <span class="hljs-title function_">dispatch</span>(<span class="hljs-params">index</span>) {
      <span class="hljs-keyword">const</span> middleware = middlewares[index];
      <span class="hljs-keyword">if</span> (!middleware) <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>();
      <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-title function_">middleware</span>(context, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">dispatch</span>(index + <span class="hljs-number">1</span>)));
    }
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">dispatch</span>(<span class="hljs-number">0</span>);
  };
}

<span class="hljs-keyword">const</span> logs = [];
<span class="hljs-keyword">const</span> run = <span class="hljs-title function_">compose</span>([
  <span class="hljs-title function_">async</span> (ctx, next) =&gt; {
    logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;日志：开始&#x27;</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">next</span>();
    logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;日志：结束&#x27;</span>);
  },
  <span class="hljs-title function_">async</span> (ctx, next) =&gt; {
    <span class="hljs-keyword">if</span> (!ctx.<span class="hljs-property">token</span>) {
      ctx.<span class="hljs-property">status</span> = <span class="hljs-number">401</span>;
      logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;鉴权：拦截&#x27;</span>);
      <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 不调用 next，后面的中间件都不会执行</span>
    }
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">next</span>();
  },
  <span class="hljs-title function_">async</span> (ctx) =&gt; {
    ctx.<span class="hljs-property">status</span> = <span class="hljs-number">200</span>;
    logs.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;业务：处理请求&#x27;</span>);
  },
]);

<span class="hljs-title function_">run</span>({ <span class="hljs-attr">token</span>: <span class="hljs-string">&#x27;abc&#x27;</span> })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(logs.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &gt; &#x27;</span>)); <span class="hljs-comment">// 日志：开始 &gt; 业务：处理请求 &gt; 日志：结束</span>
    logs.<span class="hljs-property">length</span> = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">run</span>({});
  })
  .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(logs.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; &gt; &#x27;</span>)); <span class="hljs-comment">// 日志：开始 &gt; 鉴权：拦截 &gt; 日志：结束</span>
  });
</code></pre></div>
<p>带 token 时，请求一路走到业务层，再一层层退回来，所以“日志：结束”在最后。没有 token 时，鉴权层不调用 <code>next</code>，业务层根本没执行，可是日志层的“结束”仍然会打印，因为鉴权层返回以后，控制权照样回到了日志层。</p>
<p>这也说明了为什么日志、计时要放在最外层：只有最外层能包住后面所有环节。这个简化版省略了 Koa 的错误处理和防止重复调用 <code>next</code> 的检查，完整实现见<a href="/questions/node-koa-express/">《Koa 和 Express 有什么区别？中间件洋葱模型是怎样实现的？》</a>。</p>
<h2>axios 拦截器也是一条链</h2>
<p>axios 用 <code>interceptors.request.use()</code> 注册请求拦截器，用 <code>interceptors.response.use()</code> 注册响应拦截器，<code>use</code> 返回一个 id，可以传给 <code>eject()</code> 移除。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> api = axios.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">baseURL</span>: <span class="hljs-string">&#x27;/api&#x27;</span> });

api.<span class="hljs-property">interceptors</span>.<span class="hljs-property">request</span>.<span class="hljs-title function_">use</span>(<span class="hljs-function">(<span class="hljs-params">config</span>) =&gt;</span> {
  config.<span class="hljs-property">headers</span>.<span class="hljs-property">Authorization</span> = <span class="hljs-string">\`Bearer <span class="hljs-subst">\${getToken()}</span>\`</span>;
  <span class="hljs-keyword">return</span> config; <span class="hljs-comment">// 必须把 config 返回，下一环才能拿到</span>
});

api.<span class="hljs-property">interceptors</span>.<span class="hljs-property">response</span>.<span class="hljs-title function_">use</span>(
  <span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> response.<span class="hljs-property">data</span>,
  <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">response</span>?.<span class="hljs-property">status</span> === <span class="hljs-number">401</span>) <span class="hljs-title function_">redirectToLogin</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(error); <span class="hljs-comment">// 继续往下传，让调用方也能感知失败</span>
  },
);
</code></pre></div>
<p>顺序上有一个容易记错的地方。axios 文档写明，请求拦截器是后添加的先执行，响应拦截器是先添加的先执行。注册了请求拦截器 1、2、3 和响应拦截器 1、2、3，实际顺序是请求 3、2、1，发出请求，响应 1、2、3。所以要依赖前一个请求拦截器结果的逻辑，应该先注册。</p>
<h2>常见追问</h2>
<p><strong>职责链和装饰器模式有什么区别？</strong></p>
<blockquote>
<p>装饰器是一层包一层地给同一个对象加功能，每一层都会执行。职责链里的处理者可以决定不往下传，请求可能在中途就被处理或拦下。中间件兼有两者的特点：大多数层会调用 <code>next</code> 继续往下，但鉴权这类中间件可以中断。装饰器见<a href="/questions/pattern-decorator/">《装饰器模式是什么？和高阶函数、高阶组件有什么关系？》</a>。</p>
</blockquote>
<p><strong>中间件里忘了 <code>await next()</code> 会怎样？</strong></p>
<blockquote>
<p>在 Koa 里，如果只写 <code>next()</code> 不 <code>await</code>，当前中间件不会等下游执行完就继续往下走，<code>next()</code> 之后的代码可能在业务处理完成之前就执行了，统计的耗时、设置的响应头都会不对。完全不调用 <code>next()</code>，后面的中间件就不会执行。</p>
</blockquote>`};export{e as default};