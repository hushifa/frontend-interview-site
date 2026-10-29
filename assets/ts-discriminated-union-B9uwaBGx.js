var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>拿请求状态举例，很多人会写三个布尔值 <code>isLoading</code>、<code>isSuccess</code>、<code>isError</code>。三个布尔值有 8 种组合，可合法的只有几种，比如“加载中同时又成功”就说不通。可辨识联合的做法是把合法的状态一个个列出来，其他组合根本写不出来。</p>
<p>具体是给每个分支一个字面量类型的标签字段，比如 <code>status: &#x27;success&#x27;</code>，这个字段叫判别字段。每个分支只带自己需要的数据，<code>success</code> 分支一定有 <code>data</code>，<code>error</code> 分支一定有 <code>error</code>。</p>
<p>好处是按判别字段 <code>switch</code> 或 <code>if</code> 以后，TypeScript 会把整个对象缩小到对应分支，不用再写 <code>data!</code>。在 <code>default</code> 里把值传给参数类型是 <code>never</code> 的函数，以后新增分支却漏处理了，编译就会报错。</p>
<p>要注意的是，联合只描述“哪些形态合法”，不管状态怎么切换。比如旧请求的结果覆盖了新请求，这种竞态还得靠请求 ID 或取消请求来解决。</p>
</blockquote>
<h2>用联合描述请求状态</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">RequestState</span>&lt;T&gt; =
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;idle&#x27;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span> }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span>; <span class="hljs-attr">data</span>: T }
  | { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;error&#x27;</span>; <span class="hljs-attr">error</span>: <span class="hljs-title class_">Error</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">assertNever</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">never</span></span>): <span class="hljs-built_in">never</span> {
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未处理的状态：<span class="hljs-subst">\${<span class="hljs-built_in">JSON</span>.stringify(value)}</span>\`</span>);
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">describe</span>(<span class="hljs-params"><span class="hljs-attr">state</span>: <span class="hljs-title class_">RequestState</span>&lt;<span class="hljs-keyword">readonly</span> <span class="hljs-built_in">string</span>[]&gt;</span>): <span class="hljs-built_in">string</span> {
  <span class="hljs-keyword">switch</span> (state.<span class="hljs-property">status</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;idle&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;尚未加载&#x27;</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;loading&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;加载中&#x27;</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;success&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${state.data.length}</span> 项\`</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;error&#x27;</span>:
      <span class="hljs-keyword">return</span> state.<span class="hljs-property">error</span>.<span class="hljs-property">message</span>;
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-title function_">assertNever</span>(state);
  }
}
</code></pre></div>
<p>在 <code>case &#x27;success&#x27;</code> 里可以直接写 <code>state.data</code>，不用判断它存不存在。因为 <code>status</code> 是 <code>&#x27;success&#x27;</code> 的分支只有一个，TypeScript 根据这个标签就把 <code>state</code> 缩小成了 <code>{ status: &#x27;success&#x27;; data: T }</code>。</p>
<p><code>default</code> 里的 <code>assertNever</code> 是穷尽检查。四个分支都处理完以后，<code>state</code> 已经没有可能的类型了，也就是 <code>never</code>，所以能传给 <code>assertNever</code>。哪天新增了一个分支却忘了写 <code>case</code>，<code>state</code> 在这里就不是 <code>never</code> 了，编译直接报错，提醒你补上。</p>
<p>对比一下另一种常见写法 <code>{ status: ...; data?: T; error?: Error }</code>。在这种写法里，即使判断了 <code>status === &#x27;success&#x27;</code>，<code>data</code> 仍然是可选的，到处都得写 <code>data!</code>。</p>
<h2>非法的对象会在构造时报错</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// @ts-expect-error success 分支必须提供 data</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">missingData</span>: <span class="hljs-title class_">RequestState</span>&lt;<span class="hljs-built_in">string</span>&gt; = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span> };
</code></pre></div>
<p>说是成功了却没给数据，编译器直接拦下。如果业务确实需要“刷新时还显示旧数据”，正确做法是新增一个分支 <code>{ status: &#x27;refreshing&#x27;; data: T }</code>，而不是把 <code>loading</code> 硬断言成 <code>success</code>。加完以后，所有用了 <code>assertNever</code> 的 <code>switch</code> 都会报错，正好列出需要更新的地方。</p>
<h2>为什么判别关系有时会丢</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> state = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span> } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
</code></pre></div>
<p>如果不加 <code>as const</code> 也不写类型标注，<code>status</code> 会被推断成 <code>string</code>，而不是 <code>&#x27;loading&#x27;</code>。<code>string</code> 对不上任何一个分支的标签，这个对象就赋不进联合了。</p>
<p>解构也会影响缩小。TypeScript 4.6 起，<code>const { status, data } = state</code> 解构出来的变量，判断 <code>status</code> 以后 <code>data</code> 也能跟着缩小；但解构成 <code>let</code> 时不行，因为 <code>let</code> 变量之后可能被改掉。</p>
<h2>联合不等于状态机</h2>
<p>先看一个现象：连续搜索 A 和 B，A 的响应慢，后到了。两个结果都是合法的 <code>success</code>，类型上挑不出毛病，可界面显示的是旧的 A。所以要在发请求时记下请求 ID，回来时比对，或者用 <code>AbortController</code> 取消旧请求。</p>
<p>另外，加载状态、编辑状态、在线状态是互不相关的几件事，不要硬塞进同一个联合。外部 JSON 里的 <code>status: &#x27;success&#x27;</code> 也不会自动带上 <code>data</code>，进来时要先校验。<code>Error</code> 对象经过 JSON 序列化会丢失信息，跨网络传错误时应该传错误码和消息。</p>
<h2>常见追问</h2>
<p><strong>判别字段必须叫 <code>type</code> 或 <code>kind</code> 吗？</strong></p>
<blockquote>
<p>不必，叫什么名字都行。只要每个分支在这个字段上是不同的字面量类型，TypeScript 就能靠它区分分支。</p>
</blockquote>
<p><strong>React 里怎么用？</strong></p>
<blockquote>
<p><code>useReducer</code> 的 state 和 action 都很适合写成可辨识联合。reducer 里按 <code>action.type</code> 去 <code>switch</code>，每个分支里 action 的 payload 会自动缩小成对应的类型。</p>
</blockquote>`};export{e as default};