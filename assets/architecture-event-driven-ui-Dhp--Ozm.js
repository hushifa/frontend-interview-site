var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>把代码改成“发事件、收事件”，并不会自动解决状态互相覆盖。如果好几个监听器都能随手改同一份状态，问题反而更难查。</p>
<p>关键是分清三样东西：命令是“我想做什么”，事件是“已经发生了什么”，状态是“现在界面上显示什么”。每份状态只有一个所有者负责更新，别人只能发事件给它。</p>
<p>最常见的覆盖是竞态：旧请求比新请求晚返回，把新结果盖掉了。解决办法是给每次请求一个身份，写入结果前先核对它还是不是最新的那次。取消旧请求能省资源，但过期检查不能省，因为有的数据源根本不理会取消。</p>
<p>还要注意，DOM 的 <code>dispatchEvent</code> 是同步调用监听器的，不会等异步监听器跑完，它也不是一个可靠的业务消息系统。</p>
</blockquote>
<h2>旧结果怎么会盖掉新结果</h2>
<p>用户先搜“React”，紧接着改成“Vue”。Vue 的请求先返回，页面显示 Vue；React 的请求后返回，又把页面改回了 React。</p>
<p>两个请求都成功了，代码也没报错。问题在于，React 的结果返回时，已经不是用户想看的东西了。</p>
<h2>只接受最新结果的控制器</h2>
<p>下面这个控制器负责发起搜索。<code>load</code> 是应用提供的加载函数，接收关键词和 AbortSignal；<code>dispatch</code> 接收事件，交给状态的所有者，比如一个 reducer。阅读时重点看 <code>isCurrent</code> 在哪里被检查。</p>
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
<p>先看最关心的情况：新搜索开始时会取消旧请求。可如果 <code>load</code> 不理会信号，旧结果照样返回了呢？这时 <code>isCurrent()</code> 会发现 <code>requestId</code> 已经不是最新的，直接不派发，界面不受影响。同样，旧请求失败了，也不会把新页面变成错误状态。</p>
<p><code>finally</code> 里只在 <code>active</code> 还属于自己时才清空它。因为新请求可能已经把 <code>active</code> 换成了自己的，旧请求不能误清。</p>
<p><code>cancel</code> 和 <code>dispose</code> 用途不同。<code>cancel</code> 是用户主动取消，会通知状态层回到取消后的状态；<code>dispose</code> 用在组件卸载时，之后不再发送任何事件，再调用 <code>search</code> 会直接报错。</p>
<p>状态层可以配合<a href="/questions/arch-state-machine/">《怎样避免加载、成功和失败状态互相矛盾？》</a>里的 <code>reduceRequest</code>，它同样按 <code>requestId</code> 拒绝过期事件，相当于两边各守一道。</p>
<h2>请求身份不是业务版本</h2>
<p><code>requestId</code> 只在这个控制器内部有意义，用来判断哪次搜索代表用户当前的意图。如果要跨标签页、跨设备同步订单或草稿，就需要实体 ID、服务端版本号这类东西，光靠时间戳没法保证顺序。</p>
<p>重复事件也要分情况看。重复收到“刷新列表”，合并成一次处理就行。重复收到“执行扣款”，就不能只靠前端忽略第二条，必须由服务端用幂等键保证同一笔只扣一次。</p>
<h2>DOM 事件能当消息总线吗</h2>
<p><code>dispatchEvent</code> 的行为和很多人想的不一样，有几点要记住。</p>
<p>它是同步的，会依次调用所有监听器，监听器里做了重活，调用方就会被卡住。如果监听器是 async 函数，它返回的 Promise 不会被等待。<code>dispatchEvent</code> 的返回值只表示这个可取消的事件有没有被 <code>preventDefault()</code>，不代表业务成功了。监听器抛出的异常会被报告到全局错误处理，不会传回给调用 <code>dispatchEvent</code> 的地方。</p>
<p>所以它适合通知“发生了什么”，不适合当可靠的业务消息系统。跨 Web Component 通信用 <code>CustomEvent</code> 时，还要考虑 <code>bubbles</code>、<code>composed</code> 和 <code>detail</code> 的结构。</p>
<h2>怎样让状态写入可追踪</h2>
<p>简单的父子通信，优先用参数和回调。确实需要事件时，要说清楚谁产生事件、谁拥有状态、谁执行副作用。</p>
<p>最要避免的是一个含义模糊的全局 <code>change</code> 事件，被到处监听、到处修改状态。出了问题，你根本不知道是谁改的。</p>
<h2>常见追问</h2>
<p><strong>为什么不直接在 <code>then</code> 里判断输入框的当前值？</strong></p>
<blockquote>
<p>这可以当作简化做法。但如果两次请求关键词相同，比如用户点了刷新，就区分不出哪次是最新的。用请求编号更可靠。</p>
</blockquote>
<p><strong>用 RxJS 的 <code>switchMap</code> 能解决吗？</strong></p>
<blockquote>
<p>可以。它在新值到来时会取消订阅旧的内部 Observable，本质上也是“只保留最新的请求”。</p>
</blockquote>`};export{e as default};