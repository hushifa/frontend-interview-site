var e={answerHtml:`<h2>简答</h2>
<ul>
<li>三个布尔值 <code>isLoading</code>、<code>isSuccess</code>、<code>isError</code> 有 8 种组合，大部分是非法状态；联合只列出合法的几种。</li>
<li>每个分支有字面量类型的判别字段，并带上该状态必需的数据，例如 <code>success</code> 分支必有 <code>data</code>。</li>
<li>按判别字段 <code>switch</code> 或 <code>if</code> 后，TypeScript 把整个对象收窄到对应分支。</li>
<li><code>default</code> 中把值传给参数类型为 <code>never</code> 的函数，新增分支后漏处理的地方会编译报错。</li>
<li>联合不限制状态如何迁移，旧请求结果覆盖新请求这类竞态需要请求 ID 或取消来解决。</li>
</ul>
<h2>示例</h2>
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
<p>对比 <code>{ status: ...; data?: T; error?: Error }</code>：后者在 <code>success</code> 分支中 <code>data</code> 仍是可选的，到处需要 <code>data!</code>。</p>
<h2>构造非法对象会报错</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// @ts-expect-error success 分支必须提供 data</span>
<span class="hljs-keyword">const</span> <span class="hljs-attr">missingData</span>: <span class="hljs-title class_">RequestState</span>&lt;<span class="hljs-built_in">string</span>&gt; = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;success&#x27;</span> };
</code></pre></div>
<p>如果业务确实需要&quot;刷新时显示旧数据&quot;，就新增一个分支 <code>{ status: &#x27;refreshing&#x27;; data: T }</code>，而不是把 <code>loading</code> 断言成 <code>success</code>。新增后所有 <code>switch</code> 中的 <code>assertNever</code> 会提示需要更新的位置。</p>
<h2>保留判别关系</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">const</span> state = { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;loading&#x27;</span> } <span class="hljs-keyword">as</span> <span class="hljs-keyword">const</span>;
</code></pre></div>
<p>不加 <code>as const</code> 或类型标注时，<code>status</code> 会被推断成 <code>string</code>，不再能赋给联合。TypeScript 4.6 起，对 <code>const { status, data } = state</code> 解构出的变量判断 <code>status</code> 也能收窄 <code>data</code>，但解构成 <code>let</code> 时不行。</p>
<h2>联合不等于状态机</h2>
<ul>
<li>连续搜索 A、B，A 的慢响应后到时，两个结果都是合法的 <code>success</code>，但界面显示了旧结果。需要在请求发起时记录 ID，或用 <code>AbortController</code> 取消旧请求。</li>
<li>加载状态、编辑状态、在线状态是独立维度，不要强行塞进一个联合。</li>
<li>外部 JSON 中的 <code>status: &#x27;success&#x27;</code> 不会自动带上 <code>data</code>，要先校验。<code>Error</code> 对象经过 JSON 序列化会丢失，跨网络传错误码和消息。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>判别字段必须叫 <code>type</code> 或 <code>kind</code> 吗？任何名字都行，只要每个分支是不同的字面量类型。</li>
<li>React 中怎样用？<code>useReducer</code> 的 state 和 action 都适合用可辨识联合，reducer 的 <code>switch</code> 自动收窄 action 的 payload。</li>
</ul>`};export{e as default};