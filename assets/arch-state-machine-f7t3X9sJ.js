var e={answerHtml:`<h2>简答</h2>
<ul>
<li>用 <code>loading</code>、<code>success</code>、<code>error</code> 三个独立布尔值会组合出业务不允许的状态，例如同时显示错误和结果。</li>
<li>改为一个 <code>status</code> 字段表示互斥的状态，每个状态只携带自己需要的数据。</li>
<li>状态转换集中在一个纯函数里，只有在合法状态下收到当前请求的事件才改变状态。</li>
<li>按钮是否禁用、是否显示重试这类派生值从状态推导，不要另存一份。</li>
<li>&quot;有旧数据同时正在刷新&quot;是合法组合，应作为单独的维度或嵌套状态表达。</li>
</ul>
<h2>布尔值组合的问题</h2>
<p>常见写法是请求开始时 <code>setLoading(true)</code>，成功后 <code>setSuccess(true)</code>，失败时 <code>setError(e)</code>，最后在 <code>finally</code> 里 <code>setLoading(false)</code>。如果失败分支忘了把 <code>success</code> 清掉，上一次的结果和这次的错误就会同时显示。</p>
<p>三个布尔值有 8 种组合，真正合法的只有 4 种。每条更新路径都要记得同步清理其他标志，遗漏一处就会出现错误提示和成功结果同时显示。</p>
<h2>每个状态带自己的数据</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">{ status: &#x27;idle&#x27; }
{ status: &#x27;loading&#x27;, requestId: 2 }
{ status: &#x27;success&#x27;, data: [...] }
{ status: &#x27;error&#x27;, message: &#x27;网络错误&#x27; }
</code></pre></div>
<p>读取数据前先判断 <code>status</code>，不存在&quot;<code>data</code> 有值但已经失败&quot;的情况。TypeScript 中可以用可辨识联合让编译器检查这些约束。</p>
<h2>状态转换函数</h2>
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
<p>依次发生 <code>start(1)</code>、<code>start(2)</code>、<code>succeed(1)</code>、<code>succeed(2)</code> 时：第三个事件的 <code>requestId</code> 不是当前请求，状态保持不变；第四个事件才进入 success。已经成功后再收到重复的完成事件，也会被忽略。</p>
<p>函数不发请求、不读时钟、不修改传入的对象，可以直接写单元测试。发起请求和取消请求的一侧见《事件驱动 UI 怎样避免状态互相覆盖？》。</p>
<h2>转换表</h2>
<table><thead><tr><th>当前状态</th><th>事件</th><th>结果</th></tr></thead><tbody><tr><td>任意</td><td><code>start</code></td><td>新请求的 loading</td></tr><tr><td>loading</td><td>当前请求 <code>succeed</code></td><td>success</td></tr><tr><td>loading</td><td>当前请求 <code>fail</code></td><td>error</td></tr><tr><td>loading</td><td>当前请求 <code>cancel</code></td><td>idle</td></tr><tr><td>loading</td><td>旧请求的任何事件</td><td>不变</td></tr><tr><td>非 loading</td><td><code>succeed</code> / <code>fail</code> / <code>cancel</code></td><td>不变</td></tr></tbody></table>
<p>这些规则是本例的选择。取消后回到 idle、保留旧结果还是显示&quot;已取消&quot;，要按产品需求决定，重要的是集中写在一处。</p>
<h2>刷新时保留旧数据</h2>
<p>用户已经看到列表，后台刷新正在进行，此时&quot;有数据&quot;和&quot;正在请求&quot;同时成立是合理的。可以拆成两个维度：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">{ <span class="hljs-attr">data</span>: [...], <span class="hljs-attr">refresh</span>: { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span>, <span class="hljs-attr">requestId</span>: <span class="hljs-number">5</span> } }
</code></pre></div>
<p>或者在 success 状态内部再分 idle / refreshing / refreshError。不要为了只保留一个 <code>status</code> 字段，每次刷新都清空列表。</p>
<h2>状态机管不到的事</h2>
<ul>
<li>状态变回 idle 不会终止网络请求，取消要用 AbortController。</li>
<li>支付、提交等写操作，前端显示&quot;已取消&quot;不代表服务端已撤销，需要查询最终状态或依靠幂等设计。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>什么时候需要 XState 这类库？流程有多步、并行区域、超时和守卫条件时，可视化状态图更易维护；单个请求用上面的 reducer 就够了。</li>
<li>React 中怎么用？把 <code>reduceRequest</code> 传给 <code>useReducer</code>，组件根据 <code>state.status</code> 渲染不同界面。</li>
</ul>`};export{e as default};