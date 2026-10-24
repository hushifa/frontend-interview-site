var e={answerHtml:`<p>事件、命令和状态解决的是三件不同的事。事件描述已经发生的事实，例如 <code>cart.itemAdded</code>；命令描述调用方希望系统做什么，例如 <code>cart.addItem</code>；状态描述当前结果，例如购物车里有哪些商品。把三者都写成“字符串 + 任意 payload”，调用方就很难知道谁会处理、处理几次，以及处理结果由谁负责。</p>
<p>异步流程最容易出现过期响应覆盖新状态。比如用户连续输入两个搜索词，第二次请求可能先返回；如果只在回调里直接写入结果，第一次请求随后返回时就会把页面改回旧内容。可以给每次任务分配请求 ID，只有仍属于当前查询的响应才能提交：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> activeRequest = <span class="hljs-number">0</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">search</span>(<span class="hljs-params">keyword</span>) {
  <span class="hljs-keyword">const</span> requestId = ++activeRequest;
  <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchResults</span>(keyword);
  <span class="hljs-keyword">if</span> (requestId !== activeRequest) <span class="hljs-keyword">return</span>;
  <span class="hljs-title function_">renderResults</span>(result);
}
</code></pre></div>
<p>事件处理器还要考虑重复投递、取消和失败重试。能安全重复执行的操作应设计成幂等；不能重复的写操作要由服务端提供幂等键或状态查询。事件对象最好带上实体 ID、发生时间或版本，日志中也要能追踪一次操作经过了哪些模块。</p>
<p>跨组件通信优先使用明确的 props、状态存储或路由契约。<code>CustomEvent</code> 适合 Web Components 或明确的 DOM 边界，但把它当成整个应用的隐形总线，会让依赖关系、测试和错误定位越来越困难。架构选择还要考虑团队边界、回滚、监控和迁移成本。</p>`};export{e as default};