var e={answerHtml:`<h2>简答</h2>
<ul>
<li>改成发送事件不会自动避免状态覆盖。</li>
<li>区分命令（想做什么）、事件（发生了什么）和状态（当前展示什么），并明确状态所有者。</li>
<li>常见竞态是旧请求晚返回覆盖新结果，要用请求身份核对后再提交状态。</li>
<li>取消旧请求能节省资源，但仍需要过期结果检查。</li>
</ul>
<p>把通信改成“发送事件”并不会自动避免覆盖。若多个监听器仍然随意修改同一份状态，变化来源反而可能更难追踪。</p>
<p>先分清三个概念：命令表达想做什么，例如搜索某个词；事件表达发生了什么，例如某次搜索已完成；状态表达当前应展示什么。系统还需要一个明确的状态所有者，决定哪些事件能被接受。</p>
<h2>最常见的竞态来自完成顺序</h2>
<p>用户先搜索“React”，随后改成“Vue”。第二次请求先返回，页面显示 Vue；第一次较慢，之后才返回，又把结果改成 React。</p>
<p>两个请求都可能成功，问题不在网络错误，而在于旧请求的结果已经不适合当前意图。每次发起时分配请求身份，并在提交状态前核对它，可以把“返回了数据”与“允许更新界面”区分开。</p>
<p>取消旧请求有助于节省资源，但不能只依赖取消：某些数据源不支持信号，或者结果已经到达、仍在等待处理，仍需要过期结果检查。</p>
<h2>一个只接受最新搜索结果的控制器</h2>
<p>load 是应用提供的数据加载函数，接收关键词与 AbortSignal；dispatch 接收下列内部事件，再交给状态存储或 reducer。它不是这里隐含调用的某个外部库 API。</p>
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
<p>新搜索会请求取消旧操作，但即使 load 忽略信号、旧结果仍返回，也不会发出可更新当前界面的 succeed。旧请求的失败也不会把新页面变成错误状态。</p>
<p>finally 只清理属于当前实例的活动引用，不会由旧请求无条件清空新请求的状态。cancel 用于用户主动取消并通知状态层；dispose 用于所属组件结束，不再向已销毁界面发送更新。</p>
<p>load 仍要负责检查 HTTP 状态、解析与验证数据。这里不会把 fetch 的 404 自动转换成失败，也不会回滚服务端操作。调用者还应处理自己的 dispatch 或其他编程错误造成的拒绝。</p>
<h2>事件身份和业务版本不是同一件事</h2>
<p>示例中的 requestId 是这个控制器内部的请求身份，用于判断哪个搜索更新了当前意图。它不是跨标签、跨设备的全局版本号，也不证明数据库中的记录比较新。</p>
<p>订单、草稿等实体的同步可能需要实体 ID、服务端版本、操作 ID 和协议版本。时间戳可以帮助日志分析，却不能独自保证所有设备上的更新顺序。</p>
<p>收到重复的“需要刷新列表”通常可以通过合并刷新安全处理；重复的“执行扣款”则不能只靠前端忽略第二条消息保证安全。应把通知事实与发起副作用的命令区分开，并由相应业务层实现幂等。</p>
<h2>不同事件机制的执行语义也不同</h2>
<p>DOM 的 dispatchEvent 会同步调用相应监听器，不是自动把它们放进异步队列。一个很重的监听器仍会阻塞调用过程；async 监听器返回的 Promise 也不会被 dispatchEvent 自动等待。</p>
<p>它的布尔返回值主要反映可取消事件是否被取消，不代表业务任务成功。监听器里抛出的异常也不按普通直接函数调用那样传播回 dispatchEvent 的调用者，所以不能把外层 try/catch 当成所有监听器的错误汇总。</p>
<p>跨 Web Component 边界的 CustomEvent 还需要考虑 bubbles、composed、detail 的结构与监听清理。它适合明确的 DOM 通信边界，但不是一种天然可靠、持久、有顺序保证的业务消息系统。</p>
<h2>让状态写入路径保持可追踪</h2>
<p>组件间简单的父子通信优先使用清楚的参数与回调；跨页面共享数据可以由明确的存储层负责。事件机制有价值时，应说明谁产生事件、谁拥有状态、谁执行副作用、谁负责错误与取消。</p>
<p>不要让任何模块都能监听一个模糊的 change 事件，再各自修改全局对象。可以使用有语义的事件类型、集中的状态转换、必要的操作关联信息和少量边界日志，让一次用户动作的影响能够被解释。</p>
<p>事件驱动不是消除依赖，而是把依赖放到协议和订阅关系中。协议越隐蔽，越需要治理；对于简单流程，直接调用一个明确的函数可能更容易维护。</p>`};export{e as default};