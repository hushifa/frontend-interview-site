var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>const [isPending, startTransition] = useTransition()</code>：包在 <code>startTransition</code> 里的状态更新是低优先级的，渲染过程中如果有新的紧急更新，React 会中断它、先处理紧急更新。</li>
<li><code>useDeferredValue(value)</code>：先用旧值渲染，再在后台用新值重新渲染；新值渲染期间又有新输入，React 会放弃这次渲染。</li>
<li>适合&quot;输入框要立即响应，下面的大列表可以晚一点更新&quot;这类场景。</li>
<li>输入框自身的 <code>value</code> 不能放在 Transition 里，否则输入会卡住；只把派生的耗时渲染放进去。</li>
<li>它们中断的是 React 的渲染工作，单个组件内部几百毫秒的同步计算仍会阻塞主线程；也不会自动防抖网络请求。</li>
</ul>
<h2>useDeferredValue：输入和列表分开</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { memo, useDeferredValue, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">SlowList</span> = <span class="hljs-title function_">memo</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">SlowList</span>(<span class="hljs-params">{ query }</span>) {
  <span class="hljs-keyword">const</span> items = <span class="hljs-title function_">filterLargeList</span>(query); <span class="hljs-comment">// 渲染很慢</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>{items.map((i) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{i.id}</span>&gt;</span>{i.title}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>)}<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>;
});

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Search</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [query, setQuery] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> deferredQuery = <span class="hljs-title function_">useDeferredValue</span>(query);
  <span class="hljs-keyword">const</span> stale = query !== deferredQuery;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{query}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setQuery(e.target.value)} /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">opacity:</span> <span class="hljs-attr">stale</span> ? <span class="hljs-attr">0.6</span> <span class="hljs-attr">:</span> <span class="hljs-attr">1</span> }}&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">SlowList</span> <span class="hljs-attr">query</span>=<span class="hljs-string">{deferredQuery}</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p><code>SlowList</code> 必须用 <code>memo</code> 包裹。否则每次 <code>query</code> 变化，父组件重新渲染时也会以旧的 <code>deferredQuery</code> 再渲染一次 <code>SlowList</code>，延迟就没有意义。</p>
<h2>useTransition：切换标签页</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Tabs</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [tab, setTab] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;about&#x27;</span>);
  <span class="hljs-keyword">const</span> [isPending, startTransition] = <span class="hljs-title function_">useTransition</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">select</span>(<span class="hljs-params">next</span>) {
    <span class="hljs-title function_">startTransition</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setTab</span>(next));
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">TabButton</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> select(&#x27;posts&#x27;)}&gt;文章<span class="hljs-tag">&lt;/<span class="hljs-name">TabButton</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">TabButton</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> select(&#x27;contact&#x27;)}&gt;联系<span class="hljs-tag">&lt;/<span class="hljs-name">TabButton</span>&gt;</span>
      {isPending &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">Spinner</span> /&gt;</span>}
      {tab === &#x27;posts&#x27; ? <span class="hljs-tag">&lt;<span class="hljs-name">SlowPosts</span> /&gt;</span> : tab === &#x27;contact&#x27; ? <span class="hljs-tag">&lt;<span class="hljs-name">Contact</span> /&gt;</span> : <span class="hljs-tag">&lt;<span class="hljs-name">About</span> /&gt;</span>}
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>点击&quot;文章&quot;后再快速点&quot;联系&quot;，React 会放弃未完成的&quot;文章&quot;渲染，直接渲染&quot;联系&quot;。</p>
<h2>和 Suspense 配合</h2>
<p>在 Transition 中切换到会挂起的内容时，React 会继续显示当前已有的内容，而不是切回 Suspense 的 fallback。路由跳转通常利用这一点：新页面数据准备好之前，旧页面保持可见。</p>
<h2>多个 Transition 共用一个 isPending</h2>
<p>同一个 <code>useTransition</code> 返回的 <code>isPending</code> 只表示&quot;是否有进行中的 Transition&quot;，分不出是哪一个。需要按条目显示加载状态（例如每行的保存按钮），要自己按 ID 记录状态，或者给每个条目各自调用一次 <code>useTransition</code>。</p>
<h2>和防抖的区别</h2>
<table><thead><tr><th></th><th>防抖 / 节流</th><th>Transition / 延迟值</th></tr></thead><tbody><tr><td>作用对象</td><td>函数调用次数</td><td>渲染优先级</td></tr><tr><td>有固定延迟</td><td>是</td><td>否，设备快就几乎没有延迟</td></tr><tr><td>能减少请求</td><td>能</td><td>不能</td></tr></tbody></table>
<p>搜索请求仍应防抖或用数据请求库去重；Transition 负责让渲染结果不阻塞输入。</p>
<h2>常见追问</h2>
<ul>
<li><code>startTransition</code> 里能 <code>await</code> 吗？React 19 起可以传 async 函数，但 <code>await</code> 之后的 <code>setState</code> 需要再包一层 <code>startTransition</code> 才会被标记为 Transition。</li>
<li>不需要 <code>isPending</code> 时，可以直接从 <code>react</code> 导入 <code>startTransition</code>。</li>
</ul>`};export{e as default};