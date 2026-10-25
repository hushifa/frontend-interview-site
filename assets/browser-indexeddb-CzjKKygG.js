var e={answerHtml:`<p>只有一个主题设置时，localStorage 很方便。但如果要保存几千份离线草稿，按更新时间查找最近记录，还希望一组修改要么一起成功、要么一起失败，同步字符串键值存储就不太合适了。</p>
<p>IndexedDB 提供异步的结构化存储、索引和事务。它减少了把整个数据集反复 JSON 序列化后整体读写的需要，也能直接保存结构化克隆支持的对象和二进制数据。不过异步不意味着所有操作零成本，查询结果的创建、消息传递和界面处理仍可能占用资源。</p>
<h2>数据库、对象仓库、键和索引分别是什么</h2>
<p>可以把一个数据库理解为当前应用本地数据的管理范围，里面有多个对象仓库，例如 drafts、attachments 和 settings。对象仓库保存记录，通过主键定位。</p>
<p>草稿记录可以是：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> draft = {
  <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;js-closure-note&#x27;</span>,
  <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;闭包使函数能够继续访问其词法环境中的绑定。&#x27;</span>,
  <span class="hljs-attr">updatedAt</span>: <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>(),
};
</code></pre></div>
<p>如果仓库的 keyPath 是 id，浏览器就从记录的 id 字段取得主键。<code>add()</code> 用于新增，遇到已有主键通常失败；<code>put()</code> 可以新增或覆盖同主键记录，不能把两者的冲突行为混为一谈。</p>
<p>索引提供另一种查找顺序，例如按 updatedAt 找最近修改的草稿，而不必每次读出所有记录再排序。它不是关系数据库里的任意 SQL 查询能力，多条件查询要结合索引、复合键、游标或应用逻辑设计。</p>
<p>仓库和索引定义也不等于完整的业务字段校验。例如记录缺少可索引的 updatedAt，并不代表它一定无法写入仓库，而可能只是不会形成相应索引项。正式写入前仍应验证正文、日期和版本等业务字段，不能把数据库接受了对象理解成数据内容一定正确。</p>
<h2>建立数据库与保存一份草稿</h2>
<p>下面使用原生 API 演示两件重要的事：结构变更发生在升级事务中，保存成功以写事务 complete 为准。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">openDraftDatabase</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> request = indexedDB.<span class="hljs-title function_">open</span>(<span class="hljs-string">&#x27;frontend-drafts-demo&#x27;</span>, <span class="hljs-number">1</span>);

    request.<span class="hljs-property">onupgradeneeded</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> db = request.<span class="hljs-property">result</span>;
      <span class="hljs-keyword">if</span> (event.<span class="hljs-property">oldVersion</span> &lt; <span class="hljs-number">1</span>) {
        <span class="hljs-keyword">const</span> store = db.<span class="hljs-title function_">createObjectStore</span>(<span class="hljs-string">&#x27;drafts&#x27;</span>, { <span class="hljs-attr">keyPath</span>: <span class="hljs-string">&#x27;id&#x27;</span> });
        store.<span class="hljs-title function_">createIndex</span>(<span class="hljs-string">&#x27;byUpdatedAt&#x27;</span>, <span class="hljs-string">&#x27;updatedAt&#x27;</span>);
      }
    };

    request.<span class="hljs-property">onblocked</span> = <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">warn</span>(<span class="hljs-string">&#x27;数据库升级仍在等待其他页面关闭旧连接&#x27;</span>);
    };
    request.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(request.<span class="hljs-property">error</span>);
    request.<span class="hljs-property">onsuccess</span> = <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> db = request.<span class="hljs-property">result</span>;
      db.<span class="hljs-property">onversionchange</span> = <span class="hljs-function">() =&gt;</span> {
        db.<span class="hljs-title function_">close</span>();
        <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">info</span>(<span class="hljs-string">&#x27;数据库收到版本变更请求，请重新加载相应功能&#x27;</span>);
      };
      <span class="hljs-title function_">resolve</span>(db);
    };
  });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">saveDraft</span>(<span class="hljs-params">db, draft</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> transaction = db.<span class="hljs-title function_">transaction</span>(<span class="hljs-string">&#x27;drafts&#x27;</span>, <span class="hljs-string">&#x27;readwrite&#x27;</span>);
    <span class="hljs-keyword">let</span> savedKey;
    <span class="hljs-keyword">let</span> synchronousError;

    transaction.<span class="hljs-property">oncomplete</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(savedKey);
    transaction.<span class="hljs-property">onabort</span> = <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">reject</span>(synchronousError ?? transaction.<span class="hljs-property">error</span> ?? <span class="hljs-keyword">new</span> <span class="hljs-title class_">DOMException</span>(<span class="hljs-string">&#x27;保存被取消&#x27;</span>, <span class="hljs-string">&#x27;AbortError&#x27;</span>));
    };

    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> request = transaction.<span class="hljs-title function_">objectStore</span>(<span class="hljs-string">&#x27;drafts&#x27;</span>).<span class="hljs-title function_">put</span>(draft);
      request.<span class="hljs-property">onsuccess</span> = <span class="hljs-function">() =&gt;</span> {
        <span class="hljs-comment">// 单个请求成功只记录结果，整笔保存仍等待事务完成。</span>
        savedKey = request.<span class="hljs-property">result</span>;
      };
    } <span class="hljs-keyword">catch</span> (error) {
      synchronousError = error;
      transaction.<span class="hljs-title function_">abort</span>();
    }
  });
}
</code></pre></div>
<p>调用方先 await 打开数据库，再 await 保存，并处理拒绝；不用连接时调用 <code>db.close()</code>。示例仓库名和版本用于演示，正式项目应集中管理 schema 与迁移，而不是在不同组件中各写一份互不一致的版本定义。</p>
<p>保存的对象必须能被结构化克隆。函数、DOM 节点等不能直接当成记录内容写进去；缺失或不合法的主键也可能同步抛错。示例把这类异常与异步事务中止都转成 Promise 拒绝，不会永远留着一个既不成功也不失败的保存 Promise。</p>
<h2>为什么 request success 还不能宣布全部保存成功</h2>
<p>一个 readwrite 事务可以包含多次请求。前面的 put 已触发 success，后面的请求仍可能因为主键冲突、配额或其他原因失败，导致整个事务中止，前面的修改也回滚。</p>
<p>所以“某条记录请求成功”和“整笔事务已提交”是两层结果。多个仓库需要原子更新时，要把它们放在同一个覆盖相应仓库的事务中，并在 complete 后更新“保存成功”的界面。</p>
<p>未处理的请求错误通常会沿事件路径使事务中止。如果应用主动阻止默认错误行为并尝试继续事务，就必须明确自己承担了哪种恢复语义，不能随意 preventDefault 后忽略失败。</p>
<p>这里的事务成功也不等于数据从此永不丢失。浏览器的持久性模式、操作系统写入和设备故障仍有边界；strict 等 durability 选项也不是跨设备备份或无限持久承诺。</p>
<h2>事务不是可以随意暂停的长会话</h2>
<p>IndexedDB 会在没有待处理请求且满足结束条件时自动提交事务。事务活跃与否还和创建它的任务、相关请求事件回调等时机有关。</p>
<p>因此不要创建一个事务后，先 await 网络请求或等待用户点确认，再继续向旧事务发请求；那时事务可能已经结束，操作会抛出 TransactionInactiveError 等异常。更清楚的流程是先取得外部数据，再创建短事务完成本地读写。</p>
<p>也不能反过来说“任何 await 都一定关闭事务”。某些 Promise 封装围绕 IndexedDB 请求使用微任务，能够保持符合要求的请求时序。关键是底层事务的生命周期，不能只看代码里有没有 async 关键字。</p>
<p>同一数据库中范围重叠的 readwrite 事务会受到协调。比如读取计数器并写回加一后的值，应放在同一个写事务中；先在一个事务读取、结束后再开另一个事务写入，就把竞态窗口重新暴露出来。普通数据库事务内的原子更新，不需要为了“多标签安全”再机械包一层 Web Lock。</p>
<h2>升级被 blocked，不等于升级请求已经失败</h2>
<p>提升数据库版本会触发升级流程。如果其他标签页仍持有旧连接，它们会收到 versionchange 通知，新请求可能进入 blocked 状态，等待旧连接关闭。</p>
<p>示例在每个成功打开的连接上监听 versionchange 并 close，有助于其他页面继续升级。当前页面关闭连接后，也要停止用这个旧连接发起新事务；真实应用可以提示更新、重建数据访问层或刷新页面。</p>
<p>blocked 通知本身不是最终 error。不能收到 blocked 就随手 reject 后完全不再管理打开请求，因为之后它仍可能成功打开连接。需要取消等待或超时时，封装层应有完整的后续处理，避免生成无人管理的连接。</p>
<p>迁移应按 oldVersion 逐步补齐结构，不能每次升级都无条件创建同名仓库。删除仓库再重建会删除里面的数据，真实迁移要先明确旧数据如何保留和转换。</p>
<h2>大型数据还要限制查询和内存</h2>
<p>异步数据库不意味着一次 getAll 取出几十万条就不会影响页面。结果对象仍要进入 JavaScript，后续过滤、排序和 DOM 渲染也有成本。</p>
<p>按主键或索引缩小范围，使用 IDBKeyRange、游标或有边界的分页读取，再把需要的部分交给界面，通常比反复全量读取更合适。索引也有存储和维护成本，应依据真实查询需求建立。</p>
<p>大附件可以使用 Blob 等结构化克隆支持的数据类型，但仍要考虑配额、清理和导出。浏览器存储可能被用户删除或被策略回收，IndexedDB 不能自动替你同步服务器、解决跨设备冲突或保证未备份草稿永久存在。</p>
<p>原生接口以事件和请求对象为核心，项目可以使用成熟的 Promise 封装库减少样板代码，但事务与迁移规则并不会因此消失。选库之后，仍需验证升级阻塞、写入中止、并发修改和离线恢复这些真实场景。</p>`};export{e as default};