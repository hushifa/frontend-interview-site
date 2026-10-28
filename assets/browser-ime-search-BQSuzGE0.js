var e={answerHtml:`<h2>简答</h2>
<ul>
<li>用拼音输入&quot;前端&quot;时，组字过程中会产生 <code>q</code>、<code>qian</code>、<code>qian d</code> 等中间值，并触发 <code>input</code> 事件。</li>
<li>组字期间 <code>event.isComposing</code> 为 <code>true</code>，<code>compositionstart</code> 和 <code>compositionend</code> 标出组字的开始和结束。</li>
<li>组字期间跳过搜索，在 <code>compositionend</code> 后按最终值触发一次防抖搜索。</li>
<li>每次发新请求前取消上一个请求，只渲染最后一次请求的结果。</li>
</ul>
<h2>示例</h2>
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
<ul>
<li>同时检查自己维护的 <code>composing</code> 和 <code>event.isComposing</code>，兼容事件顺序不同的浏览器。</li>
<li>有的浏览器在 <code>compositionend</code> 之后还会触发一次 <code>input</code>，防抖会把两次合并成一次请求。</li>
<li><code>search</code> 内部要把 <code>signal</code> 传给 <code>fetch</code>。</li>
</ul>
<h2>回车键</h2>
<p>组字时按回车是确认候选词，不应提交表单：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;keydown&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">key</span> === <span class="hljs-string">&#x27;Enter&#x27;</span> &amp;&amp; !event.<span class="hljs-property">isComposing</span>) <span class="hljs-title function_">submit</span>();
});
</code></pre></div>
<p>Safari 中确认候选词的回车，<code>keydown</code> 的 <code>isComposing</code> 可能为 <code>false</code>，可以再检查 <code>event.keyCode === 229</code> 作为兜底。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不用节流：搜索关心的是用户停下来后的最终输入，防抖更合适。</li>
<li>只用请求序号可以吗：可以丢弃过期结果，但旧请求仍在占用网络；<code>abort()</code> 能真正取消请求。</li>
</ul>`};export{e as default};