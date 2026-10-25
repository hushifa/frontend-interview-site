var e={answerHtml:`<p>两个标签页同时修改同一份本地状态时，可能都先读到旧值，再各自写回，造成后写覆盖先写。Web Locks 允许它们约定一个锁名：取得锁的参与者先完成一段工作，其他需要同名独占锁的参与者等待。</p>
<p>这个锁不直接锁住 localStorage、文件或网络接口。它协调的是<strong>主动使用同一锁协议的代码</strong>；绕过协议直接写数据的脚本，不会被浏览器神奇拦住。</p>
<h2>命名锁怎样形成互斥</h2>
<p>在支持的安全上下文中，可以调用 <code>navigator.locks.request(name, callback)</code>。默认模式是 exclusive，同一锁管理范围内不会同时授予两把同名独占锁。</p>
<p>通常用同源页面和 Worker 协作来理解，但实际还要满足相应存储分区等边界。它不是全互联网共享的锁，也不会协调不同浏览器配置、不同设备或服务端进程。</p>
<p>锁名应按业务资源划分，例如某个账号的同步任务或某份本地工作区。把所有操作都命名为一个全局锁，会让本来互不影响的事情也排队；把同一资源随意起成不同名字，又失去了互斥。</p>
<h2>把同一工作区的任务串行执行</h2>
<p>下面的函数让同一工作区的参与者轮流执行 work。work 是调用者传入的真实工作函数，可以同步返回，也可以返回 Promise；不同工作区使用不同的锁名，互不强制排队。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">runWithWorkspaceLock</span>(<span class="hljs-params">workspaceId, work, { signal } = {}</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> workspaceId !== <span class="hljs-string">&#x27;string&#x27;</span> || workspaceId.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;工作区编号不能为空&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> work !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;需要传入工作函数&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> navigator.<span class="hljs-property">locks</span>?.<span class="hljs-property">request</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前环境不支持 Web Locks&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> name = <span class="hljs-string">\`frontend-notes:workspace:<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(workspaceId)}</span>\`</span>;
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-property">locks</span>.<span class="hljs-title function_">request</span>(name, { <span class="hljs-attr">mode</span>: <span class="hljs-string">&#x27;exclusive&#x27;</span>, signal }, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">work</span>());
}
</code></pre></div>
<p>可以用两个有限的异步任务观察它的行为：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> timeline = [];
<span class="hljs-keyword">const</span> <span class="hljs-title function_">makeWork</span> = (<span class="hljs-params">label</span>) =&gt; <span class="hljs-title function_">async</span> () =&gt; {
  timeline.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${label}</span>开始\`</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">10</span>));
  timeline.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${label}</span>结束\`</span>);
};

<span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
  <span class="hljs-title function_">runWithWorkspaceLock</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, <span class="hljs-title function_">makeWork</span>(<span class="hljs-string">&#x27;A&#x27;</span>)),
  <span class="hljs-title function_">runWithWorkspaceLock</span>(<span class="hljs-string">&#x27;demo&#x27;</span>, <span class="hljs-title function_">makeWork</span>(<span class="hljs-string">&#x27;B&#x27;</span>)),
]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(timeline.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; → &#x27;</span>));
</code></pre></div>
<p>在支持的浏览器中，按这段代码依次申请时，输出 <code>A开始 → A结束 → B开始 → B结束</code>。等待 A 返回的 Promise 结束之前，B 不会进入同名独占锁。这里的计时器只演示异步期间仍持锁，不是在正式代码里靠等待十毫秒实现互斥。</p>
<p>真实工作中，应在取得锁之后重新读取需要依据的状态。如果在 request 外面先读旧值，进入锁以后只做写入，虽然操作排队了，仍可能依次写回过时结果。退出登录、重置或其他修改路径也应遵守同一套协议。</p>
<p>还要确认底层数据接口本身的可见性保证。Web Locks 只协调回调，不会为 localStorage 或应用内缓存额外提供跨进程的事务和缓存同步语义；不要把 localStorage 计数器读改写包一层锁，就当作可靠的并发数据库。需要原子持久更新时，应使用 IndexedDB 等适合的事务能力。Web Storage 的多代理集群交互限制可查 <a href="https://html.spec.whatwg.org/multipage/webstorage.html">HTML 标准</a>。</p>
<h2>锁持有多久，取决于回调返回了什么</h2>
<p>同步回调返回或抛错后，锁被释放。回调返回 Promise 时，锁会保持到这个 Promise 最终完成；<code>locks.request()</code> 返回的 Promise 则让调用者观察这次受锁保护的工作结果。</p>
<p>所以在 async 回调里 await 真正需要保护的操作很重要。若只是启动一个异步函数却不返回也不 await，锁可能提前释放，后台工作还没完成就有另一个页面进入。</p>
<p>反过来，等待一个永远不结束的 Promise，就可能一直占着锁。不要在锁内等用户输入、打开确认弹窗，或做与共享资源无关的长时间工作。需要经过网络的关键步骤，应有超时和恢复设计，而不是假定持锁者永远在线。</p>
<p>锁释放也不代表业务一定成功：回调抛错会释放，页面终止也会影响持有状态。调用方仍需检查结果，其他参与者取得锁后也应重新读取当前状态。</p>
<h2>signal 取消的是等待，不是已经运行的临界区</h2>
<p>给 request 传入 AbortSignal，可以在尚未取得锁时撤销等待。若等待超时，相关 Promise 会拒绝，必须处理，不能遗留未处理的拒绝。</p>
<p>锁已经授予后，再取消这个信号，不会自动中断回调、释放它仍在等待的 Promise，或撤销之前发出的网络请求。持锁工作需要自己的取消协议，例如把信号继续传给 fetch，并在安全边界检查是否应停止。</p>
<p>因此“等锁最多五秒”和“整个业务最多五秒”是不同需求。只设置锁请求的等待信号，不能当作整段执行的总时限。</p>
<h2>ifAvailable、shared 和 query 各有什么用途</h2>
<p><code>ifAvailable: true</code> 表示只立即尝试，不排队等待；无法立即取得时，回调收到 null。它适合“已有其他页面在做就先跳过”的非关键工作。普通等待型请求则通常在取得 Lock 后才调用回调，不必把 null 当成所有请求的常规结果。</p>
<p><code>mode: &#x27;shared&#x27;</code> 允许多个同名共享锁持有者同时存在，而同名独占锁需要等待这些共享持有者退出。可以用它组织约定好的读写协作，但前提仍是所有访问者都遵循相同协议。</p>
<p><code>navigator.locks.query()</code> 可观察持有与等待的快照，适合诊断。它不是原子检查接口；先 query 看到空闲，再执行操作，不等于已经取得锁，最终仍应通过 request 进入受保护区。</p>
<p>选项也不是任意组合都合法，例如 ifAvailable 或 steal 不能直接和 signal 一起组合。使用前应按当前接口规则检查，不能把所有“看起来有用的选项”一起塞进去。</p>
<h2>不要用 steal 把超时变成并发冲突</h2>
<p>steal 能改变锁管理状态并抢占相应锁，但此前持锁回调的 JavaScript 不会因此被终止。旧代码可能还在等待网络，之后继续修改数据，与新持锁者同时执行。</p>
<p>如果没有额外的版本校验、租约或 fencing 等机制，简单“等太久就偷锁”可能直接破坏原本想要的互斥。浏览器锁并不能强行停止一段已经运行的任意程序。</p>
<p>还要避免嵌套请求同名非重入独占锁：外层回调等内层，内层又在等外层释放，就会形成死锁。需要多把锁时，应有一致的获取顺序，并尽量缩小临界区。</p>
<h2>互斥与事务、服务端一致性是不同层次</h2>
<p>锁能让参与者轮流执行，但不会自动回滚写到一半的数据。IndexedDB 中一组相关读写应优先使用同一事务保证原子性；如果只是数据库支持的事务操作，不需要机械地再加一把 Web Lock。</p>
<p>它也不是服务端分布式锁。持锁页面可能已把请求发到服务器，确认返回之前浏览器就崩溃了；下个页面取得锁并重试，仍可能造成重复业务操作。服务端幂等键、版本比较和恢复查询仍然必要。</p>
<p>浏览器不支持时，BroadcastChannel 可以帮助通知谁在工作，却不能直接等价替代互斥锁。可以根据业务选择服务端协调、数据库事务、限制为单页面操作或明确的降级模式，不应悄悄删除锁后继续声称并发安全。</p>`};export{e as default};