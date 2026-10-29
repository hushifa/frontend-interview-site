var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>输入框下面挂着一个很大的列表，每打一个字列表都要重新渲染，输入就会卡。这两个 API 解决的就是这种卡顿：让输入框先响应，列表晚一点更新。</p>
<p><code>useTransition</code> 返回 <code>[isPending, startTransition]</code>，包在 <code>startTransition</code> 里的状态更新是低优先级的，这种更新叫 Transition。渲染过程中如果来了新的紧急更新，React 会中断它，先处理紧急的。<code>useDeferredValue(value)</code> 从另一个角度做同样的事：它先返回旧值让你渲染，再在后台用新值重新渲染，期间又有新输入就放弃这次渲染。</p>
<p>一般你能控制 setState 的地方用 <code>useTransition</code>，只拿到一个值的地方用 <code>useDeferredValue</code>。注意输入框自己的 <code>value</code> 不能放进 Transition，否则打字会卡住，只把派生的耗时渲染放进去。</p>
<p>它们打断的是 React 的渲染工作。如果某个组件内部有一段几百毫秒的同步计算，照样会卡住主线程。它们也不会自动给网络请求防抖。</p>
</blockquote>
<h2>用 useDeferredValue 把输入和列表分开</h2>
<p>下面的搜索框直接更新 <code>query</code>，列表用的却是延迟版的 <code>deferredQuery</code>：</p>
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
<p>用户打一个字，<code>query</code> 马上变了，输入框立刻显示新字。这时 <code>deferredQuery</code> 还是旧值，<code>SlowList</code> 不用重新渲染。React 随后在后台用新值渲染列表，用户如果又打了一个字，这次后台渲染就被丢掉，换成最新的。</p>
<p><code>query</code> 和 <code>deferredQuery</code> 不相等，说明列表还是旧的，所以用 <code>stale</code> 把它调暗一点，提示用户结果正在更新。</p>
<p>为什么 <code>SlowList</code> 必须包 <code>memo</code>？因为 <code>query</code> 一变，<code>Search</code> 就会重新渲染。没有 <code>memo</code> 的话，<code>SlowList</code> 会跟着用旧的 <code>deferredQuery</code> 再完整渲染一遍，慢的部分一点没省，延迟就白做了。</p>
<h2>用 useTransition 切换标签页</h2>
<p>标签页切换时，新页面渲染得慢，我们希望点击马上有反馈，而且点错了能立刻改：</p>
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
<p>点“文章”后，<code>SlowPosts</code> 开始在后台渲染，<code>isPending</code> 为 <code>true</code>，显示加载图标，页面仍然能点。这时再快速点“联系”，React 会放弃还没做完的“文章”渲染，直接渲染“联系”。如果不用 Transition，用户得等“文章”渲染完，页面才能响应第二次点击。</p>
<h2>和 Suspense 一起用</h2>
<p>在 Transition 里切换到一个会进入等待的内容时，React 会继续显示当前已有的内容，不会退回 Suspense 的 fallback。路由跳转通常就利用这一点：新页面数据准备好之前，旧页面一直可见，而不是闪一下加载中。</p>
<h2>多个 Transition 共用一个 isPending</h2>
<p>同一个 <code>useTransition</code> 返回的 <code>isPending</code> 只表示“有没有正在进行的 Transition”，分不出是哪一个。如果要按条目显示加载状态，比如每一行有自己的保存按钮，就要自己按 ID 记录，或者让每个条目组件各自调用一次 <code>useTransition</code>。</p>
<h2>和防抖有什么不同</h2>
<p>防抖和节流控制的是函数调用的次数，有固定的延迟，能减少请求。Transition 和 <code>useDeferredValue</code> 调整的是渲染优先级，没有固定延迟，设备快时几乎感觉不到延迟，但不会减少请求。</p>
<p>所以搜索请求还是要防抖，或者交给数据请求库去重；Transition 负责让渲染结果不挡住输入。</p>
<h2>常见追问</h2>
<p><strong><code>startTransition</code> 里可以 <code>await</code> 吗？</strong></p>
<blockquote>
<p>React 19 起可以传 async 函数。但 <code>await</code> 之后的 <code>setState</code> 要再包一层 <code>startTransition</code>，才会被算作 Transition。</p>
</blockquote>
<p><strong>不需要 <code>isPending</code> 的时候怎么写？</strong></p>
<blockquote>
<p>可以直接从 <code>react</code> 导入 <code>startTransition</code> 来用，不必调用 Hook。</p>
</blockquote>`};export{e as default};