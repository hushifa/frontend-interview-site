var e={answerHtml:`<h2>简答</h2>
<ul>
<li>改成&quot;发送事件&quot;不会自动避免状态覆盖；多个监听器随意修改同一份状态，问题只会更难追踪。</li>
<li>区分命令（想做什么）、事件（发生了什么）和状态（当前展示什么），每份状态只有一个所有者负责更新。</li>
<li>最常见的竞态是旧请求晚返回覆盖新结果，要给每次请求分配身份，提交结果前核对是否仍是最新请求。</li>
<li>取消旧请求能节省资源，但仍要做过期检查，因为有的数据源不响应取消。</li>
<li>DOM 的 <code>dispatchEvent</code> 同步调用监听器，不等待异步监听器，也不是可靠的业务消息系统。</li>
</ul>
<h2>竞态示例</h2>
<p>用户先搜&quot;React&quot;，紧接着改成&quot;Vue&quot;。Vue 的请求先返回，页面显示 Vue；React 的请求后返回，又把结果改回 React。两个请求都成功，问题在于旧结果已经不符合用户当前的意图。</p>
<h2>只接受最新结果的控制器</h2>
<p><code>load</code> 是应用提供的加载函数，接收关键词和 AbortSignal；<code>dispatch</code> 接收事件并交给状态所有者（如 reducer）。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createSearchController</span>(<span class="hljs-params">load, dispatch</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> load !== <span class="hljs-string">&#x27;function&#x27;</span> || <span class="hljs-keyword">typeof</span> dispatch !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;加载和事件接收器必须是函数&#x27;</span>);
  }
  <span class="hljs-keyword">let</span> sequence = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> active = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">search</span>(<span class="hljs-params">keyword</span>) {
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;搜索控制器已销毁&#x27;</span>);
      active?.<span class="hljs-property">controller</span>.<span class="hljs-title function_">abort</span>();

      <span class="hljs-keyword">const</span> requestId = ++sequence;
      <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
      active = { requestId, controller };
      <span class="hljs-keyword">const</span> <span class="hljs-title function_">isCurrent</span> = (<span class="hljs-params"></span>) =&gt; !disposed &amp;&amp; !controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span> &amp;&amp; requestId === sequence;
      <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;start&#x27;</span>, requestId, keyword });

      <span class="hljs-keyword">let</span> data;
      <span class="hljs-keyword">try</span> {
        controller.<span class="hljs-property">signal</span>.<span class="hljs-title function_">throwIfAborted</span>();
        data = <span class="hljs-keyword">await</span> <span class="hljs-title function_">load</span>(keyword, controller.<span class="hljs-property">signal</span>);
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-keyword">if</span> (<span class="hljs-title function_">isCurrent</span>()) {
          <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;fail&#x27;</span>, requestId, <span class="hljs-attr">message</span>: <span class="hljs-title class_">String</span>(error?.<span class="hljs-property">message</span> ?? error) });
        }
        <span class="hljs-keyword">return</span>;
      } <span class="hljs-keyword">finally</span> {
        <span class="hljs-keyword">if</span> (active?.<span class="hljs-property">requestId</span> === requestId) active = <span class="hljs-literal">null</span>;
      }

      <span class="hljs-keyword">if</span> (<span class="hljs-title function_">isCurrent</span>()) <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;succeed&#x27;</span>, requestId, data });
    },
    <span class="hljs-title function_">cancel</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">if</span> (!active || disposed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> { requestId, controller } = active;
      sequence += <span class="hljs-number">1</span>;
      active = <span class="hljs-literal">null</span>;
      controller.<span class="hljs-title function_">abort</span>();
      <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;cancel&#x27;</span>, requestId });
    },
    <span class="hljs-title function_">dispose</span>(<span class="hljs-params"></span>) {
      disposed = <span class="hljs-literal">true</span>;
      sequence += <span class="hljs-number">1</span>;
      active?.<span class="hljs-property">controller</span>.<span class="hljs-title function_">abort</span>();
      active = <span class="hljs-literal">null</span>;
    },
  };
}
</code></pre></div>
<ul>
<li>新搜索会取消旧请求；即使 <code>load</code> 忽略信号、旧结果照样返回，<code>isCurrent()</code> 也会阻止它更新界面。</li>
<li>旧请求失败不会把新页面变成错误状态。</li>
<li><code>finally</code> 只清理属于自己的 <code>active</code>，不会误清新请求。</li>
<li><code>cancel</code> 用于用户主动取消并通知状态层；<code>dispose</code> 用于组件卸载，之后不再发送任何事件。</li>
<li>状态层可以配合《怎样避免加载、成功和失败状态互相矛盾？》中的 <code>reduceRequest</code>，它同样按 <code>requestId</code> 拒绝过期事件。</li>
</ul>
<h2>请求身份不是业务版本</h2>
<p><code>requestId</code> 只在这个控制器内部有意义，用来判断哪次搜索代表当前意图。跨标签页、跨设备同步订单或草稿时，需要实体 ID、服务端版本号等，时间戳不能独自保证顺序。</p>
<p>重复收到&quot;刷新列表&quot;可以合并处理；重复收到&quot;执行扣款&quot;不能只靠前端忽略第二条，必须由服务端通过幂等键保证。</p>
<h2>DOM 事件的语义</h2>
<ul>
<li><code>dispatchEvent</code> 同步依次调用监听器，重的监听器会阻塞调用方。</li>
<li>async 监听器返回的 Promise 不会被等待。</li>
<li>返回值只表示可取消事件是否被 <code>preventDefault()</code>，不代表业务成功。</li>
<li>监听器抛出的异常会被报告到全局错误处理，不会传回 <code>dispatchEvent</code> 的调用方。</li>
</ul>
<p>跨 Web Component 通信时，<code>CustomEvent</code> 还要考虑 <code>bubbles</code>、<code>composed</code> 和 <code>detail</code> 的结构。</p>
<h2>让状态写入可追踪</h2>
<p>简单的父子通信优先用参数和回调；需要事件时，明确谁产生事件、谁拥有状态、谁执行副作用。避免一个模糊的全局 <code>change</code> 事件被到处监听、到处修改。</p>
<h2>常见追问</h2>
<ul>
<li>为什么不直接在 <code>then</code> 里判断输入框当前值？可以作为简化做法，但关键词相同的两次请求（例如刷新）就无法区分，请求编号更可靠。</li>
<li>用 RxJS 的 <code>switchMap</code> 能解决吗？可以，它在新值到来时取消订阅旧的内部 Observable，本质也是&quot;只保留最新请求&quot;。</li>
</ul>`};export{e as default};