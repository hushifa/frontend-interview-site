var e={answerHtml:`<h2>简答</h2>
<ul>
<li>estimate 返回已用量和配额的估计值，不是磁盘的真实剩余容量。</li>
<li>persisted 查询当前是否已持久化，persist 请求持久化。</li>
<li>持久化主要改变存储压力下的回收待遇，不代表数据永不丢失。</li>
<li>能否存下最终以实际写入结果为准；离线产品仍要准备数据备份。</li>
</ul>
<p>离线应用准备下载几百 MB 的资料时，需要知道浏览器大致用了多少空间，是否可能接近配额，以及这些数据会不会因存储压力被自动回收。StorageManager 提供相关信息和持久化请求能力，但它不负责替应用保存文件，也不会保证下一次写入一定成功。</p>
<p>在支持的环境中，通过 <code>navigator.storage</code> 使用。相关能力通常要求安全上下文，还会受到浏览器、当前源、存储分区和用户策略影响，使用前应做能力检测并处理失败。</p>
<h2>三个方法回答三个不同的问题</h2>
<table><thead><tr><th>方法</th><th>回答的问题</th></tr></thead><tbody><tr><td><code>estimate()</code></td><td>当前管理范围的使用量与配额大约是多少？</td></tr><tr><td><code>persisted()</code></td><td>当前是否已经处于持久化存储模式？</td></tr><tr><td><code>persist()</code></td><td>是否允许把存储变成持久化模式？</td></tr></tbody></table>
<p>estimate 不会申请额外空间，persisted 只查询状态，persist 才是提出请求。把它们都理解成“检查剩余磁盘”会混淆权限、配额与实际存储。</p>
<h2>estimate 返回的是估计值，不是磁盘的剩余容量</h2>
<p>典型返回值有 usage 和 quota，单位为字节。usage 表示浏览器估计的使用量，quota 是相关配额，而不是用户硬盘还剩多少空间。</p>
<p>实际结果可能经过估算、填充或隐私处理，不同存储后端的计量和更新时机也有差异。有的实现还提供 usageDetails，但不能假定每个浏览器都有同样的细分类别。</p>
<p>下面保留“未知”的状态，而不是把缺失字段都强行当成 0：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">inspectStorage</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> storage = navigator.<span class="hljs-property">storage</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> storage?.<span class="hljs-property">estimate</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;

  <span class="hljs-keyword">const</span> estimate = <span class="hljs-keyword">await</span> storage.<span class="hljs-title function_">estimate</span>();
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">validBytes</span> = (<span class="hljs-params">value</span>) =&gt; (
    <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;number&#x27;</span> &amp;&amp; <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(value) &amp;&amp; value &gt;= <span class="hljs-number">0</span>
      ? value
      : <span class="hljs-literal">null</span>
  );
  <span class="hljs-keyword">const</span> usageBytes = <span class="hljs-title function_">validBytes</span>(estimate.<span class="hljs-property">usage</span>);
  <span class="hljs-keyword">const</span> quotaBytes = <span class="hljs-title function_">validBytes</span>(estimate.<span class="hljs-property">quota</span>);

  <span class="hljs-keyword">return</span> {
    usageBytes,
    quotaBytes,
    <span class="hljs-attr">estimatedRemainingBytes</span>: usageBytes !== <span class="hljs-literal">null</span> &amp;&amp; quotaBytes !== <span class="hljs-literal">null</span>
      ? <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(quotaBytes - usageBytes, <span class="hljs-number">0</span>)
      : <span class="hljs-literal">null</span>,
    <span class="hljs-attr">persistent</span>: <span class="hljs-keyword">typeof</span> storage.<span class="hljs-property">persisted</span> === <span class="hljs-string">&#x27;function&#x27;</span>
      ? <span class="hljs-keyword">await</span> storage.<span class="hljs-title function_">persisted</span>()
      : <span class="hljs-literal">null</span>,
  };
}
</code></pre></div>
<p>调用方要捕获这个异步函数的拒绝，并让界面区分“不支持”“读取失败”“容量未知”和“已读到估计值”。用户禁用存储、不透明源或其他策略限制，都不应被误显示成“磁盘已满”。</p>
<p>返回的 estimatedRemainingBytes 可以用于提前提示风险，但不能当成预留成功的空间。估计之后别的标签页还可能写入，设备空间会变化，索引和元信息也有额外开销。下载文件大小小于估计余量，仍不代表存储一定成功。</p>
<h2>持久化主要改变回收待遇，不是创建永不丢失的硬盘</h2>
<p>浏览器站点数据默认通常采用 best-effort 模式：在配额和策略允许时保留，但存储压力等情况可能触发自动回收。</p>
<p>调用 <code>await navigator.storage.persist()</code>，是请求持久化模式。返回 true 表示请求获准；返回 false 表示未获得。是否出现提示、是否按站点使用情况自动决定，取决于浏览器实现，不能依赖所有浏览器都弹出同一权限框。</p>
<p><strong>获得持久化后，浏览器在常规存储压力回收中通常会跳过这类数据。</strong> 因此不能把 persist 描述成“即使同意了，浏览器照样按普通缓存规则随时自动清掉”，那会抹掉这项能力本身的作用。</p>
<p>但持久化也不等于永久备份：用户可以主动清理站点数据或删除浏览器配置，应用自己也可以删除数据，设备故障或丢失更不在这个 API 的保护范围内。它也不会自动把数据同步到用户的另一台设备。</p>
<h2>什么时候适合请求持久化</h2>
<p>真正依赖本地数据的离线笔记、绘图或离线资料应用，可以在用户开始使用相应功能时解释需求，再请求持久化。可重建的普通网页缓存未必需要申请，更不应在每次页面打开时反复催促。</p>
<p>可以先用 persisted 查询已有状态，获得权限后再把它作为存储策略的一项条件；拒绝时应保留合理的离线能力或导出提示，而不是把用户卡在无法进入应用的循环中。</p>
<p>persist 不代表无限容量，也不是所有存储 API 配额都被统一扩大。IndexedDB、Cache Storage、OPFS 等可能受浏览器整体存储管理影响，Web Storage 又有自己的限制；不能因为 estimate 显示很大配额，就往 localStorage 塞同样大小的字符串。</p>
<h2>最终是否存得下，仍以实际写入结果为准</h2>
<p>写入 IndexedDB、Cache Storage 或文件系统时，可能因配额不足失败。应用需要在实际操作的错误路径中处理 QuotaExceededError 等情况，并区分权限、数据格式和其他失败，不能提前看过一次 estimate 就省略错误处理。</p>
<p>对于 IndexedDB 写事务，还要等待事务完成，不是某个 put 请求成功就显示“全部保存成功”。异步存储接口的异常也不会被外面没有 await 的同步 try/catch 自动捕获。</p>
<p>空间不足时，优先清理可重新获取、归属明确的缓存，而不是随手删除用户尚未同步的草稿或同源其他应用的数据。清理后重试也应有次数和体积上限，避免不断下载、不断失败。</p>
<h2>离线产品应把数据价值与回收策略分开</h2>
<p>可重新下载的封面和资源缓存，可以设置容量上限与淘汰策略；未同步的用户创作，应优先持久化、同步或导出，并明确显示保存状态。升级时的数据迁移、损坏恢复和账号退出后的清理，也需要应用自己处理。</p>
<p>StorageManager 能帮助做容量提示和回收策略，却不能告诉你哪些数据最重要。即使 persisted 返回 true，重要内容仍应有恢复方案；即使返回 false，也不代表数据会立刻消失。界面应准确表达这种区别，不制造“百分之百安全”或“马上丢失”的误导。</p>
<p>配额与回收规则可进一步查看 <a href="https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria">MDN：存储配额与回收条件</a>。</p>`};export{e as default};