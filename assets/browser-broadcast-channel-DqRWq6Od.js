var e={answerHtml:`<h2>简答</h2>
<ul>
<li>同源上下文用同名 BroadcastChannel 互相发现并广播消息，用完要 close。</li>
<li>消息经结构化克隆传递，接收方拿到的是副本，不是共享对象。</li>
<li>它没有回放，也不保证业务上的恰好一次；后打开的页面收不到之前的消息。</li>
<li>广播只适合发通知，不能解决多个页面同时保存的冲突；频道名和消息字段也不是权限边界。</li>
</ul>
<p>用户同时打开了两个笔记标签页，在其中一个页面修改标题后，希望另一个页面及时刷新列表。两个页面不一定保留彼此的窗口引用，也不适合靠每秒轮询检测本地变化。这时可以让它们加入同名 BroadcastChannel，保存成功后发送一个通知。</p>
<p>BroadcastChannel 适合“有变化了，请重新检查”这样的跨上下文协作。它不保存历史、不自动确认收到，也不替你解决同时修改的数据冲突。</p>
<h2>同名频道如何让页面互相发现</h2>
<p>每个页面分别创建 <code>new BroadcastChannel(&#x27;某个频道名&#x27;)</code>。符合通信边界的其他对象加入同名频道后，可以收到发送的消息，不要求发送方持有它们的引用。</p>
<p>同源是重要条件，但现代浏览器还可能按存储分区隔离通信。例如同一个小组件源分别嵌入两个不同的顶层站点中，即使 iframe 的 origin 相同，也不能假定它们与直接打开的小组件页面互通。应理解为同源且满足相应存储分区条件的上下文之间通信，而不是全浏览器按字符串频道名广播。</p>
<p>页面、iframe 和支持该 API 的 Worker 可以参与。频道名不同，不会互相收到；不同浏览器配置、隐私会话和另一台设备也不是同一个广播空间。</p>
<h2>一个用于通知草稿变化的小封装</h2>
<p>这个示例只传草稿编号，接收者通过自己已有的数据访问层重新读取，不把整份草稿内容当成广播中的权威状态。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createDraftChannel</span>(<span class="hljs-params">onChanged</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> globalThis.<span class="hljs-property">BroadcastChannel</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前环境不支持 BroadcastChannel&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> channel = <span class="hljs-keyword">new</span> <span class="hljs-title class_">BroadcastChannel</span>(<span class="hljs-string">&#x27;frontend-drafts:v1&#x27;</span>);
  <span class="hljs-keyword">let</span> closed = <span class="hljs-literal">false</span>;

  channel.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> data = event.<span class="hljs-property">data</span>;
    <span class="hljs-keyword">if</span> (
      closed ||
      !data ||
      data.<span class="hljs-property">version</span> !== <span class="hljs-number">1</span> ||
      data.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;draft-saved&#x27;</span> ||
      <span class="hljs-keyword">typeof</span> data.<span class="hljs-property">id</span> !== <span class="hljs-string">&#x27;string&#x27;</span> ||
      data.<span class="hljs-property">id</span>.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>
    ) {
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>()
      .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
        <span class="hljs-keyword">if</span> (!closed) <span class="hljs-keyword">return</span> <span class="hljs-title function_">onChanged</span>(data.<span class="hljs-property">id</span>);
      })
      .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(<span class="hljs-string">&#x27;刷新草稿失败&#x27;</span>, error));
  });

  <span class="hljs-keyword">return</span> {
    <span class="hljs-title function_">notifySaved</span>(<span class="hljs-params">id</span>) {
      <span class="hljs-keyword">if</span> (closed) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;频道已关闭&#x27;</span>);
      <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> id !== <span class="hljs-string">&#x27;string&#x27;</span> || id.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;草稿编号不能为空&#x27;</span>);
      }
      channel.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;draft-saved&#x27;</span>, id });
    },
    <span class="hljs-title function_">close</span>(<span class="hljs-params"></span>) {
      closed = <span class="hljs-literal">true</span>;
      channel.<span class="hljs-title function_">close</span>();
    },
  };
}
</code></pre></div>
<p>将真实的重新读取函数传给 onChanged，它可以返回 Promise。示例接住了处理失败，但不负责合并请求、解决旧结果覆盖或实现重试；这些取决于数据层的版本策略。</p>
<p><strong>应在 IndexedDB 事务完成或服务端确认保存成功后，再调用 notifySaved。</strong> 如果刚发起写入就广播，接收页面可能先收到通知，却还读不到新值。</p>
<p>当前页面本身也要更新自己的界面。同一个 BroadcastChannel 对象不会收到自己发送的消息；但同一页面若另建了第二个同名对象，第二个对象可以收到。因此不要把“发送对象不回收自己的消息”误解成“同一个标签页所有对象都不接收”。</p>
<h2>传的是结构化消息，不是共享对象引用</h2>
<p>消息使用结构化克隆，可传普通对象、数组等支持的数据类型，不需要先 JSON.stringify。接收者得到的是相应副本，修改它不会直接改变发送者的对象。</p>
<p>函数、DOM 节点等不能这样发送，可能导致 DataCloneError。BroadcastChannel 的 postMessage 也没有像某些 Worker 通信接口那样的 transfer 列表参数，不应把大 ArrayBuffer 的广播当成零复制转移。</p>
<p>对高频大数据，先考虑只通知 ID 或版本，然后按需要读取。给所有标签不断广播整张大表，会增加克隆、处理和内存成本，即使网络完全没有请求也可能拖慢页面。</p>
<h2>没有回放，也没有业务上的“恰好一次”保证</h2>
<p>新页面加入频道后，不会补收加入之前的历史通知。已关闭、离开页面或不符合交付条件的接收者，也不能被当成可靠消息队列的消费者。</p>
<p>因此页面启动和恢复时应主动读取最新状态，广播只是缩短其他活跃页面发现变化的时间。收到通知也不等于读取成功，更不等于界面已经渲染；需要确认或补偿的业务，应另外设计协议。</p>
<p>单个发送者的消息与多个发送者交错的业务更新，不能简单归并成同一个全局版本顺序。应用的重试、转发或重复订阅还可能造成重复处理，接收端应能去重或安全地重新读取。</p>
<p>只用 Date.now 给消息打时间戳也不能可靠解决所有冲突：多个页面可能同时写入，时钟不提供完整的事务顺序。真正需要判断新旧时，应以持久化层或服务端定义的版本为准。</p>
<h2>“请刷新”并不解决两个页面同时保存</h2>
<p>如果两个页面都读到草稿 v3，各自编辑后写入，一个可能覆盖另一个。事后互相广播“保存了”，只能让它们知道当前状态变化，不能恢复被覆盖的内容。</p>
<p>可以根据场景使用数据库事务、版本比较、冲突提示或服务端协同算法。涉及多个本地步骤的协调时可考虑 Web Locks，但所有参与者必须遵守同一协议。不要把“大家都能收到消息”当成已经有了互斥锁。</p>
<p>重新读取也需要防止异步竞态：旧通知发起的读取结果如果晚于新通知返回，可能覆盖新界面。数据层可以使用版本检查、请求序号或取消过期读取等方式处理，而不是假定回调顺序等于请求完成顺序。</p>
<h2>频道名和消息字段不是权限凭证</h2>
<p>同一通信边界内的其他脚本也可能创建这个频道，知道一个特殊名称不等于经过身份认证。接收端应检查消息结构，敏感操作仍由应用权限和服务端验证负责，不能仅凭 <code>type: &#x27;signed-out&#x27;</code> 就推导服务器会话已经失效。</p>
<p>多账号应用应按账号或工作空间管理频道生命周期，切换后关闭旧频道，防止旧会话通知污染新界面。消息里也不应广播长期密钥或不必要的敏感内容。</p>
<p>组件销毁时调用 close，释放不再需要的连接。它会阻止后续收发，但不会自动取消 onChanged 已经开始的网络请求；这部分还需要数据层的清理逻辑。</p>
<p>不支持时，可以在页面重新获得焦点或可见时刷新，必要时使用 storage 事件等较有限的通知方式。降级应准确保留业务功能，不要假装它们具有完全相同的消息与分区语义。</p>`};export{e as default};