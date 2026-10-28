var e={answerHtml:`<h2>简答</h2>
<ul>
<li>SharedWorker 可以被多个同源页面共享，每个页面通过自己的 port 连接；Dedicated Worker 只属于创建它的页面。</li>
<li>只有脚本地址、名称和源都匹配的页面才会共享同一个实例。</li>
<li>Worker 要管理多个连接，某个页面离开时只清理它自己的订阅。</li>
<li>共享状态只在 Worker 存活期间存在，需要持久化的数据要另外保存。</li>
</ul>
<p>两个标签页都需要相同的轮询或本地索引时，如果各自创建一个普通 Worker，通常就会各自运行一份逻辑、保留一份内存。SharedWorker 提供另一种方式：符合条件的多个上下文连接到同一个 Worker，通过各自的 MessagePort 与它通信。</p>
<p>Dedicated Worker 通常服务创建它的单个上下文；SharedWorker 则允许多个连接共同使用一个工作上下文。两者都不能直接操作页面 DOM，也都不等于浏览器外部的永久后台服务。</p>
<table><thead><tr><th>对比项</th><th>Dedicated Worker</th><th>SharedWorker</th></tr></thead><tbody><tr><td>创建入口</td><td><code>new Worker(...)</code></td><td><code>new SharedWorker(...)</code></td></tr><tr><td>常见使用关系</td><td>一个创建者使用一份 Worker</td><td>多个符合条件的页面连接同一份 Worker</td></tr><tr><td>页面端消息接口</td><td>Worker 的 postMessage/message</td><td>worker.port 的 postMessage/message</td></tr><tr><td>Worker 收连接</td><td>不需要专门的多连接入口</td><td>通过 connect 事件取得对应端口</td></tr><tr><td>页面停止使用</td><td>可 terminate 自己的 Worker</td><td>通常关闭自己的 port，不应影响其他连接</td></tr></tbody></table>
<p>Dedicated Worker 也可能由 Worker 创建，不能把它严格定义成“只能由页面创建”。这里比较的是连接和所有权模型，而不是把所有后台工作都统一成一个类型。</p>
<h2>同一个脚本地址，不代表任何页面都共享</h2>
<p>连接通常需要精确同源，还受到存储分区等环境边界约束；同一个源嵌在不同顶层站点中，不能假定一定共用同一实例。</p>
<p>脚本 URL、name 和创建选项也参与实例匹配或一致性检查。需要共享时，各页面应使用一致的地址、名称和类型；需要独立版本时，可以有意使用不同名称，但那就会产生不同的实例和内存。</p>
<p>不要让一处按 classic 创建、另一处按 module 创建，却认为只要文件路径一样就自动兼容。已经存在的同名同地址实例，对 type、credentials 等选项有一致性要求，不匹配可能导致错误。</p>
<h2>先看 Worker 文件如何处理多个连接</h2>
<p>下面是独立的 <code>/shared-counter.js</code>，使用一个只存在于 Worker 内存中的计数器。它仅用于演示多个端口共享状态，不是持久业务计数器。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;connect&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> port = event.<span class="hljs-property">ports</span>[<span class="hljs-number">0</span>];

  port.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">messageEvent</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> message = messageEvent.<span class="hljs-property">data</span>;
    <span class="hljs-keyword">if</span> (!message || message.<span class="hljs-property">version</span> !== <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">if</span> (message.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;disconnect&#x27;</span>) {
      port.<span class="hljs-title function_">close</span>();
      <span class="hljs-keyword">return</span>;
    }
    <span class="hljs-keyword">if</span> (message.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;read&#x27;</span> &amp;&amp; message.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;increment&#x27;</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">if</span> (message.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;increment&#x27;</span>) {
      <span class="hljs-keyword">if</span> (count === <span class="hljs-title class_">Number</span>.<span class="hljs-property">MAX_SAFE_INTEGER</span>) {
        port.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;计数器已达到上限&#x27;</span> });
        <span class="hljs-keyword">return</span>;
      }
      count += <span class="hljs-number">1</span>;
    }

    port.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;count&#x27;</span>, count });
  });

  port.<span class="hljs-title function_">start</span>();
});
</code></pre></div>
<p>每次有新页面连接，就收到一次 connect，并为该连接取得一个 port。count 定义在 connect 外面，因此这些端口访问的是同一个 Worker 中的计数。如果把 count 放进 connect 回调，每个连接就会有独立计数，失去这个示例想展示的共享效果。</p>
<p>这里使用 addEventListener 监听端口消息，需要调用 start 开始处理消息；使用 onmessage 属性设置处理器时会隐式启用端口，但显式管理通常更容易看清生命周期。</p>
<h2>页面端建立自己的连接</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">connectSharedCounter</span>(<span class="hljs-params">onCount, onError = (error) =&gt; <span class="hljs-variable language_">console</span>.error(<span class="hljs-string">&#x27;共享计数器错误&#x27;</span>, error)</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> globalThis.<span class="hljs-property">SharedWorker</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前环境不支持 SharedWorker&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">SharedWorker</span>(<span class="hljs-string">&#x27;/shared-counter.js&#x27;</span>, {
    <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span>,
    <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;frontend-shared-counter-v1&#x27;</span>,
  });
  <span class="hljs-keyword">let</span> closed = <span class="hljs-literal">false</span>;

  worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (!closed) <span class="hljs-title function_">onError</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(event.<span class="hljs-property">message</span> || <span class="hljs-string">&#x27;共享 Worker 启动或运行失败&#x27;</span>));
  });
  worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;messageerror&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (!closed) <span class="hljs-title function_">onError</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;无法读取共享 Worker 消息&#x27;</span>));
  });
  worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> data = event.<span class="hljs-property">data</span>;
    <span class="hljs-keyword">if</span> (closed || !data || data.<span class="hljs-property">version</span> !== <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;count&#x27;</span> &amp;&amp; <span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(data.<span class="hljs-property">count</span>) &amp;&amp; data.<span class="hljs-property">count</span> &gt;= <span class="hljs-number">0</span>) {
      <span class="hljs-title function_">onCount</span>(data.<span class="hljs-property">count</span>);
    } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;error&#x27;</span> &amp;&amp; <span class="hljs-keyword">typeof</span> data.<span class="hljs-property">message</span> === <span class="hljs-string">&#x27;string&#x27;</span>) {
      <span class="hljs-title function_">onError</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(data.<span class="hljs-property">message</span>));
    }
  });
  worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">start</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">send</span>(<span class="hljs-params">type</span>) {
    <span class="hljs-keyword">if</span> (closed) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前页面的共享连接已关闭&#x27;</span>);
    worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, type });
  }

  <span class="hljs-title function_">send</span>(<span class="hljs-string">&#x27;read&#x27;</span>);

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">refresh</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">send</span>(<span class="hljs-string">&#x27;read&#x27;</span>),
    <span class="hljs-attr">increment</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">send</span>(<span class="hljs-string">&#x27;increment&#x27;</span>),
    <span class="hljs-title function_">dispose</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">if</span> (closed) <span class="hljs-keyword">return</span>;
      closed = <span class="hljs-literal">true</span>;
      worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">version</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;disconnect&#x27;</span> });
      worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">close</span>();
    },
  };
}
</code></pre></div>
<p>把实际的界面更新函数传入 onCount，即可读取和增加计数。两个标签页使用相同配置时，其中一个增加后，另一个再 refresh 会看到同一份新计数。</p>
<p>注意：本例只回复发出请求的端口，没有自动广播给所有页面。SharedWorker 提供共享执行上下文，不会替你决定通知哪些客户端。要实时同步所有界面，需要另外维护订阅和广播协议。</p>
<p>页面端 constructor 本身也可能因 URL、策略等原因失败，调用者要处理创建阶段的异常；error 和 messageerror 负责后续相应错误，并不是替代所有错误路径的一层万能捕获。</p>
<h2>一个页面离开，不应该关闭所有人的工作</h2>
<p>页面不再使用时，关闭自己的 port 即可。Worker 中的 <code>self.close()</code> 关闭的是共享工作上下文，不能让任意一个页面离开时就无条件调用，否则其他页面也会受影响。</p>
<p>示例发送 disconnect 是清理协议，但页面崩溃、进程结束或导航过快时，不能保证最后一条消息已经处理。若 Worker 保存所有订阅端口或维护共享网络请求，应考虑失联端口、超时、订阅计数和恢复，而不是只靠一次“我要走了”的消息。</p>
<p>也不要把 <code>MessagePort.close()</code> 当成服务端已经取消轮询或任务的确认。端口、Worker 任务和外部服务是不同生命周期，需要分别协调。</p>
<h2>共享内存状态会存在多久</h2>
<p>SharedWorker 只要仍有符合条件的所有者使用，通常可以继续存在；所有使用者离开后，浏览器可以终止它。浏览器可能为了同源导航复用而短暂保留实例，因此不能精确写成“最后一个端口关闭的那一行，内存立刻消失”。</p>
<p>部分实现还提供 extendedLifetime 选项，允许在所有页面离开后短暂延长生命周期，便于有限的清理工作。它的支持和保留时间依实现而定，不是永久保活开关，也不能替代及时保存重要状态。</p>
<p>浏览器重启、进程回收、Worker 错误或其他终止都可能导致内存丢失。新连接遇到新实例时，计数会从初始化值重新开始。需要恢复的数据应写入 IndexedDB 或服务端，页面重新连接时再读取权威状态。</p>
<h2>共享不等于免费，也不等于永远串行安全</h2>
<p>同一个 Worker 的同步消息处理按它的事件循环执行，因此本例的同步加一不会在半条语句中被另一个端口打断。但如果消息处理里 await 网络或数据库，多个逻辑操作仍可能交错，需要明确并发与版本策略。</p>
<p>大数据传输、端口消息序列化、Worker 初始化和共享任务调度也有成本。一个客户端提交巨大同步计算，可能阻塞这个 SharedWorker 为其他客户端服务；共享越多，越需要公平调度和取消策略。</p>
<p>SharedWorker 不负责拦截页面请求，Service Worker 才有对应的事件与生命周期模型；BroadcastChannel 只是通信通道，不提供共享计算上下文。兼容性不足时可以按业务选择单页面 Worker、跨页通知或服务端协调，但必须说明降级后哪些共享能力不再存在。</p>`};export{e as default};