var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>很多人写请求界面，会用 <code>loading</code>、<code>success</code>、<code>error</code> 三个布尔值。问题是它们能组合出业务上不可能的状态，比如页面上同时显示错误提示和上一次的结果。</p>
<p>改法是只用一个 <code>status</code> 字段，取值是互斥的几种状态，每种状态只带自己需要的数据。状态怎么变，集中写在一个纯函数里，只有在合法状态下、收到属于当前请求的事件，才改变状态。</p>
<p>这样按钮要不要禁用、要不要显示重试，都可以直接从状态推出来，不用另外存一份，也就不会不一致。</p>
<p>要注意，“已经有旧数据、同时正在刷新”是合法的组合，应该用单独的维度或嵌套状态来表达，不能为了只留一个字段就把旧数据清掉。</p>
</blockquote>
<h2>几个布尔值为什么会互相矛盾</h2>
<p>常见写法是：请求开始时 <code>setLoading(true)</code>，成功后 <code>setSuccess(true)</code>，失败时 <code>setError(e)</code>，最后在 <code>finally</code> 里 <code>setLoading(false)</code>。</p>
<p>可是如果失败分支忘了把 <code>success</code> 清掉，上一次的结果和这次的错误就会同时出现在页面上。</p>
<p>原因在于，三个布尔值一共有 8 种组合，真正合法的只有 4 种。每条更新路径都得记着去清理别的标志，漏掉一处，就会出现不该存在的组合。</p>
<h2>每个状态只带自己的数据</h2>
<p>换成一个 <code>status</code> 字段，每种状态各带各的数据：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{ status: &#x27;idle&#x27; }
{ status: &#x27;loading&#x27;, requestId: 2 }
{ status: &#x27;success&#x27;, data: [...] }
{ status: &#x27;error&#x27;, message: &#x27;网络错误&#x27; }
</code></pre></div>
<p>读数据之前先看 <code>status</code>。这样根本就不存在“<code>data</code> 有值，但已经失败了”这种情况。用 TypeScript 的话，可以写成可辨识联合，也就是用一个共同的字段区分几种类型，让编译器帮你检查这些约束。</p>
<h2>把状态转换集中写在一个函数里</h2>
<p>下面这个函数接收当前状态和一个事件，返回新状态。注意看它怎样处理旧请求的事件。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">reduceRequest</span>(<span class="hljs-params">state, event</span>) {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;start&#x27;</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span>, <span class="hljs-attr">requestId</span>: event.<span class="hljs-property">requestId</span> };
  }

  <span class="hljs-keyword">if</span> (state.<span class="hljs-property">status</span> !== <span class="hljs-string">&#x27;loading&#x27;</span> || event.<span class="hljs-property">requestId</span> !== state.<span class="hljs-property">requestId</span>) {
    <span class="hljs-keyword">return</span> state;
  }

  <span class="hljs-keyword">switch</span> (event.<span class="hljs-property">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;succeed&#x27;</span>:
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span>, <span class="hljs-attr">data</span>: event.<span class="hljs-property">data</span> };
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;fail&#x27;</span>:
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-attr">message</span>: event.<span class="hljs-property">message</span> };
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;cancel&#x27;</span>:
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;idle&#x27;</span> };
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">return</span> state;
  }
}
</code></pre></div>
<p>假设依次发生 <code>start(1)</code>、<code>start(2)</code>、<code>succeed(1)</code>、<code>succeed(2)</code>。第三个事件来自请求 1，可当前请求已经是 2 了，所以状态保持不变；第四个事件才让状态进入 success。之后要是再收到重复的完成事件，状态已经不是 loading，也会被忽略。</p>
<p>为什么要强调它是纯函数？因为它不发请求、不读时钟、不修改传入的对象，同样的输入永远得到同样的输出，可以直接写单元测试。发请求和取消请求的那一侧，见<a href="/questions/architecture-event-driven-ui/">《事件驱动 UI 怎样避免状态互相覆盖？》</a>。</p>
<h2>转换规则一览</h2>
<table><thead><tr><th>当前状态</th><th>事件</th><th>结果</th></tr></thead><tbody><tr><td>任意</td><td><code>start</code></td><td>新请求的 loading</td></tr><tr><td>loading</td><td>当前请求 <code>succeed</code></td><td>success</td></tr><tr><td>loading</td><td>当前请求 <code>fail</code></td><td>error</td></tr><tr><td>loading</td><td>当前请求 <code>cancel</code></td><td>idle</td></tr><tr><td>loading</td><td>旧请求的任何事件</td><td>不变</td></tr><tr><td>非 loading</td><td><code>succeed</code> / <code>fail</code> / <code>cancel</code></td><td>不变</td></tr></tbody></table>
<p>这些规则是本例的选择，不是唯一答案。取消后是回到 idle、保留旧结果，还是显示“已取消”，要看产品需求。重要的是规则集中写在一处，而不是散在各个回调里。</p>
<h2>刷新时怎样保留旧数据</h2>
<p>用户已经看到了列表，后台又在刷新。这时“有数据”和“正在请求”同时成立，是完全合理的。</p>
<p>可以把它拆成两个维度：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">{ <span class="hljs-attr">data</span>: [...], <span class="hljs-attr">refresh</span>: { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span>, <span class="hljs-attr">requestId</span>: <span class="hljs-number">5</span> } }
</code></pre></div>
<p>也可以在 success 状态里面再分 idle、refreshing、refreshError 三种。不要为了只保留一个 <code>status</code> 字段，每次刷新都把列表清空，那样用户会看到内容闪一下消失。</p>
<h2>状态机管不到的事</h2>
<p>状态变回 idle，并不会终止网络请求。真正取消请求要用 AbortController。</p>
<p>支付、提交这类写操作更要小心。前端显示“已取消”，不代表服务端已经撤销了。需要查询最终状态，或者依靠幂等设计，也就是同一个操作重复提交多次，结果和提交一次一样。</p>
<h2>常见追问</h2>
<p><strong>什么时候需要 XState 这类库？</strong></p>
<blockquote>
<p>流程有多步、有并行区域、有超时和守卫条件时，用可视化的状态图更好维护。只是单个请求的话，上面这个 reducer 就够了。</p>
</blockquote>
<p><strong>在 React 里怎么用？</strong></p>
<blockquote>
<p>把 <code>reduceRequest</code> 传给 <code>useReducer</code>，组件根据 <code>state.status</code> 渲染不同的界面。</p>
</blockquote>`};export{e as default};