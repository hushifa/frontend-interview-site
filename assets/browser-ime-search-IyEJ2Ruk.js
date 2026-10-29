var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用拼音输入“前端”时，没选字之前输入框里会先出现 <code>q</code>、<code>qian</code>、<code>qian d</code> 这些中间值，每一次都会触发 <code>input</code> 事件。如果每次都发搜索请求，就是在拿拼音去搜。</p>
<p>浏览器把这段“还在选字”的过程叫组字（composition）。开始时触发 <code>compositionstart</code>，选完时触发 <code>compositionend</code>，中间的 <code>input</code> 事件 <code>event.isComposing</code> 是 <code>true</code>。</p>
<p>所以做法是：组字期间跳过搜索，等 <code>compositionend</code> 之后按最终的值触发一次防抖搜索。</p>
<p>另外还要处理请求竞态：每次发新请求前把上一个取消掉，只渲染最后一次请求的结果，避免旧结果覆盖新结果。</p>
</blockquote>
<h2>先看完整的写法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindSearch</span>(<span class="hljs-params">input, search</span>) {
  <span class="hljs-keyword">let</span> composing = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">let</span> controller;

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">run</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-title function_">async</span> () =&gt; {
      controller?.<span class="hljs-title function_">abort</span>();
      controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
      <span class="hljs-keyword">const</span> { signal } = controller;
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> results = <span class="hljs-keyword">await</span> <span class="hljs-title function_">search</span>(input.<span class="hljs-property">value</span>.<span class="hljs-title function_">trim</span>(), signal);
        <span class="hljs-keyword">if</span> (!signal.<span class="hljs-property">aborted</span>) <span class="hljs-title function_">render</span>(results);
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-title function_">renderError</span>(error);
      }
    }, <span class="hljs-number">250</span>);
  };

  input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;compositionstart&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    composing = <span class="hljs-literal">true</span>;
  });
  input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;compositionend&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    composing = <span class="hljs-literal">false</span>;
    <span class="hljs-title function_">run</span>();
  });
  input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (composing || event.<span class="hljs-property">isComposing</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-title function_">run</span>();
  });
}
</code></pre></div>
<p>这里有两件事。第一件是组字：<code>input</code> 事件里只要还在组字就直接返回，等 <code>compositionend</code> 再调用 <code>run()</code>。第二件是竞态：<code>run()</code> 里先 <code>abort()</code> 上一个请求，再发新的，结果回来时如果已经被取消就不渲染。</p>
<h2>为什么要同时检查两个标记</h2>
<p>你可能会问，既然有 <code>event.isComposing</code>，为什么还要自己维护一个 <code>composing</code> 变量？因为不同浏览器里这几个事件的先后顺序不完全一样，两个都查一遍更稳。</p>
<p>还有的浏览器在 <code>compositionend</code> 之后又会再触发一次 <code>input</code>。这样 <code>run()</code> 会被调两次，不过有 250 毫秒的防抖，两次会合并成一次请求。</p>
<h2>为什么要取消旧请求</h2>
<p>用户先搜“前”，再搜“前端”，两个请求同时在路上。如果“前”的结果后回来，页面上显示的就是旧结果，这就是请求竞态。</p>
<p><code>abort()</code> 让旧请求直接作废，它的 Promise 以 <code>AbortError</code> 结束，<code>catch</code> 里会忽略这种错误。要让取消真正生效，<code>search</code> 内部得把 <code>signal</code> 传给 <code>fetch</code>。</p>
<h2>回车键也要处理</h2>
<p>组字时按回车，是在确认候选词，不应该提交表单：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;keydown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;Enter&#x27;</span> &amp;&amp; !event.<span class="hljs-property">isComposing</span>) <span class="hljs-title function_">submit</span>();
});
</code></pre></div>
<p>不过 Safari 里确认候选词的那次回车，<code>keydown</code> 的 <code>isComposing</code> 可能是 <code>false</code>。可以再检查 <code>event.keyCode === 229</code> 作为兜底。</p>
<h2>常见追问</h2>
<p><strong>搜索为什么用防抖，不用节流？</strong></p>
<blockquote>
<p>搜索关心的是用户停下来以后的最终输入。节流会在输入过程中按固定间隔发请求，防抖是等停下来再发，所以更合适。</p>
</blockquote>
<p><strong>只用请求序号丢弃旧结果行不行？</strong></p>
<blockquote>
<p>可以避免旧结果覆盖新结果，但旧请求还在占用网络。<code>abort()</code> 能把请求真正取消掉，两者可以一起用。</p>
</blockquote>`};export{e as default};