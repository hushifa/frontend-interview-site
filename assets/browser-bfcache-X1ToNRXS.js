var e={answerHtml:`<p>从列表点进详情，再按后退，列表的滚动位置和输入内容几乎立即恢复，JavaScript 里的变量也还在。这可能是浏览器恢复了 bfcache 中的页面，而不是重新下载 HTML、重新执行脚本后凑出了相似的界面。</p>
<p>bfcache 是 back/forward cache，服务于符合条件的历史前进与后退导航。它保存的是页面在内存中的状态，包括 DOM、JavaScript 堆等；普通 HTTP 缓存保存的则是请求对应的响应数据。</p>
<h2>缓存 CSS 与恢复正在运行的页面差别很大</h2>
<table><thead><tr><th>方面</th><th>HTTP 缓存</th><th>bfcache</th></tr></thead><tbody><tr><td>保存的主要内容</td><td>HTML、CSS、JS、图片等请求响应</td><td>一份文档及其运行状态的内存快照</td></tr><tr><td>返回页面时</td><td>可能仍需解析、执行脚本和重建界面</td><td>可以恢复已有 DOM 和 JavaScript 状态</td></tr><tr><td>常见用途</td><td>多次获取同一资源时减少传输</td><td>历史前进、后退时快速恢复页面</td></tr><tr><td>决策依据</td><td>Cache-Control、验证器等 HTTP 缓存规则</td><td>浏览器的页面生命周期、兼容性和资源策略</td></tr></tbody></table>
<p>两者可以同时存在。某次后退没有命中 bfcache，重新加载页面时仍可能大量命中 HTTP 缓存；某次命中 bfcache，恢复后的新接口请求又会按自己的网络和缓存规则执行。</p>
<p>所以“Network 没重新下载脚本”和“页面从 bfcache 恢复”不是同一个证据。刷新通常也不是一次 bfcache 恢复，不能靠反复刷新测试它的命中率。</p>
<h2>恢复时要看 pageshow，而不只是首次 load</h2>
<p>初次加载会发生正常的文档初始化。页面从 bfcache 恢复时，已有状态被继续使用，不应假定首次加载事件和整个应用初始化流程都会重新跑一遍。</p>
<p><code>pageshow</code> 的 <code>event.persisted</code> 为 true，可以识别相应的页面缓存恢复。它比“用户点了后退”更准确，因为后退也可能重新加载文档。</p>
<p>离开时的 <code>pagehide</code> 也有 persisted 标志，但它不能保证这个快照一定会保留到用户回来：浏览器随后还可能因内存和策略淘汰它。真正恢复时的 pageshow 才是应用处理本次恢复的重要依据。</p>
<p>pageshow 这个名字也不等于“用户正在看屏幕上的页面”，页面可能在后台标签中恢复或打开；可见性需求仍应结合 Page Visibility API。</p>
<h2>为什么恢复后还需要重新核对数据</h2>
<p>离开前的购物车、登录状态和权限可能已经变了。内存恢复得很完整，恰恰意味着旧值也会一起恢复。页面不能因为回来了就相信会话仍有效，更不能把缓存里的按钮是否显示当成服务端权限判断。</p>
<p>可以保留列表滚动和用户输入等体验状态，同时按业务规则重新验证容易过期的数据。重新核对失败时，要显示清楚状态，不要静默把用户新输入覆盖成服务器旧内容。</p>
<p>下面的辅助函数只负责在缓存恢复时调用 refresh，并在再次离开或销毁绑定时取消相应工作。refresh 由应用传入，接收 AbortSignal：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">refreshOnHistoryRestore</span>(<span class="hljs-params">refresh, onError = (error) =&gt; <span class="hljs-variable language_">console</span>.error(<span class="hljs-string">&#x27;恢复刷新失败&#x27;</span>, error)</span>) {
  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> current;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">stopCurrent</span>(<span class="hljs-params"></span>) {
    current?.<span class="hljs-title function_">abort</span>();
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">onShow</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-keyword">if</span> (!event.<span class="hljs-property">persisted</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-title function_">stopCurrent</span>();
    current = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
    <span class="hljs-keyword">const</span> { signal } = current;

    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>()
      .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
        <span class="hljs-keyword">if</span> (!signal.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">refresh</span>(signal);
      })
      .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
        <span class="hljs-keyword">if</span> (!signal.<span class="hljs-property">aborted</span>) <span class="hljs-title function_">onError</span>(error);
      });
  }

  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pageshow&#x27;</span>, onShow, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pagehide&#x27;</span>, stopCurrent, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    listeners.<span class="hljs-title function_">abort</span>();
    <span class="hljs-title function_">stopCurrent</span>();
  };
}
</code></pre></div>
<p>这个函数不替代首次加载，也不负责读取具体接口。传入的 refresh 应把 signal 传给支持取消的请求，并在提交异步结果前确认它仍有效；不理会信号的操作不会被辅助函数强制停止。</p>
<p>页面离开时这里只停止当前刷新，没有移除 pageshow 监听，因此恢复后仍能收到通知。若把所有恢复监听也在 pagehide 中清掉，再等不存在的初始化流程重新绑定，就可能导致恢复页面失去相应功能。</p>
<h2>连接与资源要能重新建立</h2>
<p>页面进入缓存时，执行通常会暂停；不应让它继续承担其他活跃页面依赖的唯一协调任务。网络连接、数据库连接、锁或其他资源是否影响命中，需要结合具体浏览器和使用状态判断。</p>
<p>可在合适的生命周期时机释放不再需要的连接，恢复时重新订阅并核对状态。比如关闭 WebSocket 后，恢复时不只是重建连接，还要考虑离开期间的消息与业务数据。</p>
<p>不要把离开事件当作“最后一次一定运行的收尾机会”。移动端进程被系统终止时，pagehide、beforeunload 或 unload 都可能来不及执行。重要草稿应在正常使用过程中持续保存。</p>
<h2>为什么不要依赖 unload 或固定的禁用清单</h2>
<p>unload 不可靠，还可能影响浏览器使用 bfcache。需要离开提示时应谨慎、按实际未保存状态管理 beforeunload，而不是在每个页面无条件挂上监听。</p>
<p>不同浏览器和版本会调整 bfcache 的资格判断，某些连接、请求或缓存指令的处理也会变化。不要把“看到 no-store 就永远不可能进入 bfcache”等历史经验当成所有当前浏览器的定律。HTTP 不存储响应与页面能否被暂时保存在历史缓存，属于不同层次的政策。</p>
<p>页面兼容也不意味着一定命中：设备内存、浏览器策略、历史距离和进程变化都可能影响结果。代码应同时支持快照恢复和普通重新加载。</p>
<h2>怎么确认实际发生了什么</h2>
<p>在正常浏览中从 A 导航到 B，再使用前进后退，记录 pageshow.persisted、初始化次数和需要恢复的状态。要测试真实导航，不要用手动 dispatch 一个 PageTransitionEvent 代替浏览器的缓存行为。</p>
<p>支持的浏览器可以通过开发者工具和 Navigation Timing 的 notRestoredReasons 查看未恢复原因，但该接口的支持和可见细节有限，返回 null 也不能一概解释成“肯定命中”。</p>
<p>统计上应把首次加载、普通历史重载和 bfcache 恢复分开。恢复的重点是快速显示既有状态并正确复核过期信息，而不是强行重新跑整套初始化，把 bfcache 的收益全部抵消。</p>`};export{e as default};