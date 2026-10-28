var e={answerHtml:`<h2>简答</h2>
<ul>
<li>传统 SPA 要分别拦截链接点击、监听 <code>popstate</code>、包装 <code>history.pushState</code>；Navigation API 在 <code>navigation</code> 上用一个 <code>navigate</code> 事件覆盖所有同文档可拦截的导航。</li>
<li>在事件里调用 <code>event.intercept({ handler })</code> 把导航交给前端处理，URL 立即更新，handler 返回的 Promise 决定导航何时完成。</li>
<li>不应拦截的导航要提前放行：<code>canIntercept</code> 为 <code>false</code>、<code>hashChange</code> 为 <code>true</code>、<code>downloadRequest !== null</code>。</li>
<li><code>navigation.navigate()</code> 等方法返回 <code>{ committed, finished }</code> 两个 Promise；导航被中断时，拦截处理函数拿到的 <code>event.signal</code> 会被 abort。</li>
<li>MDN 标为 Baseline 2026（2026 年 1 月起在主流浏览器可用），旧浏览器仍需要回退到 History API。</li>
</ul>
<h2>示例</h2>
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
<ul>
<li><code>formData</code> 不为 <code>null</code> 表示 POST 表单提交。这里交给浏览器处理；如果要在前端处理，应读取 <code>event.formData</code> 自己发 POST 请求。</li>
<li><code>event.signal</code> 在用户又发起新导航或点击停止时触发 abort，旧的请求随之取消。</li>
<li>默认在 handler 完成后恢复滚动位置；调用 <code>event.scroll()</code> 可以在主要内容渲染后提前处理。</li>
</ul>
<h2>比 History API 多了什么</h2>
<table><thead><tr><th>能力</th><th>History API</th><th>Navigation API</th></tr></thead><tbody><tr><td>拦截链接点击</td><td>自己监听 click</td><td><code>navigate</code> 事件统一处理</td></tr><tr><td>前进后退</td><td><code>popstate</code>，拿不到目标前的状态</td><td>同一个 <code>navigate</code> 事件</td></tr><tr><td>导航完成和失败</td><td>无</td><td><code>navigatesuccess</code>、<code>navigateerror</code>、<code>finished</code></td></tr><tr><td>历史条目</td><td>只能拿到当前状态</td><td><code>navigation.entries()</code>、<code>currentEntry</code>、<code>traverseTo(key)</code></td></tr></tbody></table>
<h2>限制</h2>
<ul>
<li><code>navigate</code> 在页面首次加载时不触发，客户端渲染的应用要单独做初始化。</li>
<li>只能看到当前 frame 内同源的历史条目，不能删除或重排历史。</li>
<li><code>preventDefault()</code> 只对 <code>cancelable</code> 为 <code>true</code> 的导航有效，前进后退等导航能否取消看 <code>event.cancelable</code>。</li>
<li>兼容旧浏览器：检测 <code>&#x27;navigation&#x27; in window</code>，不支持时沿用 History API 路由。</li>
</ul>`};export{e as default};