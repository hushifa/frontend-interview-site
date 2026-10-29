var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用 History API 写 SPA 路由，要做三件分散的事：自己拦截链接点击，监听 <code>popstate</code> 处理前进后退，再包一层 <code>history.pushState</code>。Navigation API 把这些合成了一个入口：<code>navigation</code> 上的 <code>navigate</code> 事件，同文档里能拦截的导航都会经过它。</p>
<p>在事件里调用 <code>event.intercept({ handler })</code>，就是告诉浏览器“这次导航我自己处理”。URL 立刻更新，<code>handler</code> 返回的 Promise 结束时，导航才算完成。</p>
<p>它还补上了 History API 没有的东西：<code>navigation.navigate()</code> 返回 <code>committed</code> 和 <code>finished</code> 两个 Promise，能知道导航什么时候完成、有没有失败；导航被打断时，<code>event.signal</code> 会被 abort，旧请求可以跟着取消。</p>
<p>要注意，有些导航不该拦截，要提前放行，比如 <code>canIntercept</code> 为 <code>false</code>、只是改了 hash、或者是下载。MDN 标为 Baseline 2026，也就是 2026 年 1 月起主流浏览器都能用，旧浏览器还得回退到 History API。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面只接管 <code>/articles/</code> 下的导航，其他的交给浏览器：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">navigation.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;navigate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (!event.<span class="hljs-property">canIntercept</span> || event.<span class="hljs-property">hashChange</span> || event.<span class="hljs-property">downloadRequest</span> !== <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">formData</span>) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(event.<span class="hljs-property">destination</span>.<span class="hljs-property">url</span>);
  <span class="hljs-keyword">if</span> (!url.<span class="hljs-property">pathname</span>.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;/articles/&#x27;</span>)) <span class="hljs-keyword">return</span>;

  event.<span class="hljs-title function_">intercept</span>({
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">handler</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">const</span> article = <span class="hljs-keyword">await</span> <span class="hljs-title function_">loadArticle</span>(url.<span class="hljs-property">pathname</span>, { <span class="hljs-attr">signal</span>: event.<span class="hljs-property">signal</span> });
      <span class="hljs-title function_">renderArticle</span>(article);
      event.<span class="hljs-title function_">scroll</span>();
    },
  });
});
</code></pre></div>
<p>开头那几个 <code>return</code> 都是在放行。<code>canIntercept</code> 为 <code>false</code> 说明这次导航没法拦，比如跨源；<code>hashChange</code> 为 <code>true</code> 只是页内锚点跳转；<code>downloadRequest</code> 不为 <code>null</code> 是下载链接。这些都交给浏览器自己处理。</p>
<p><code>formData</code> 不为 <code>null</code> 表示这是一次 POST 表单提交。这里也放行了；如果想在前端处理，就读 <code>event.formData</code> 自己发 POST 请求。</p>
<h2>event.signal 和 event.scroll() 是干什么的</h2>
<p>用户点了一篇文章，还没加载完又点了另一篇。第一次导航被打断，它的 <code>event.signal</code> 就会 abort。把 signal 传给请求，旧请求就跟着取消，不会把旧文章渲染出来。用户点浏览器的停止按钮也一样。</p>
<p>滚动方面，浏览器默认等 <code>handler</code> 完成后再恢复滚动位置。主要内容渲染完就调用 <code>event.scroll()</code>，可以提前处理滚动。</p>
<h2>比 History API 多了什么</h2>
<table><thead><tr><th>能力</th><th>History API</th><th>Navigation API</th></tr></thead><tbody><tr><td>拦截链接点击</td><td>自己监听 click</td><td><code>navigate</code> 事件统一处理</td></tr><tr><td>前进后退</td><td><code>popstate</code>，拿不到目标前的状态</td><td>同一个 <code>navigate</code> 事件</td></tr><tr><td>导航完成和失败</td><td>无</td><td><code>navigatesuccess</code>、<code>navigateerror</code>、<code>finished</code></td></tr><tr><td>历史条目</td><td>只能拿到当前状态</td><td><code>navigation.entries()</code>、<code>currentEntry</code>、<code>traverseTo(key)</code></td></tr></tbody></table>
<p>最实用的是导航状态。以前没办法知道“这次跳转什么时候算完”，现在有 <code>finished</code> Promise，以及 <code>navigatesuccess</code>、<code>navigateerror</code> 事件。历史记录也能看了，<code>navigation.entries()</code> 列出条目，<code>traverseTo(key)</code> 跳到指定的那一条。</p>
<h2>有哪些限制</h2>
<p>页面第一次加载时不会触发 <code>navigate</code>，所以客户端渲染的应用还要单独做初始化。</p>
<p>历史条目只能看到当前 frame 里同源的那部分，也不能删除或者重新排列。</p>
<p><code>preventDefault()</code> 只对 <code>cancelable</code> 为 <code>true</code> 的导航有效。前进后退这类导航能不能取消，要看 <code>event.cancelable</code>。</p>
<p>兼容旧浏览器时，先检测 <code>&#x27;navigation&#x27; in window</code>，不支持就沿用 History API 的路由。</p>
<h2>常见追问</h2>
<p><strong>页面刚打开时会触发 <code>navigate</code> 事件吗？</strong></p>
<blockquote>
<p>不会。<code>navigate</code> 只在页面加载完之后的导航里触发，所以客户端渲染的应用首次进入时，要自己根据当前 URL 渲染一次。</p>
</blockquote>
<p><strong>用户连续点了两个链接，第一个请求怎么办？</strong></p>
<blockquote>
<p>第一次导航被打断时，它的 <code>event.signal</code> 会 abort。只要把这个 signal 传给 <code>fetch</code>，旧请求就会被取消，不会拿旧数据覆盖新页面。</p>
</blockquote>`};export{e as default};