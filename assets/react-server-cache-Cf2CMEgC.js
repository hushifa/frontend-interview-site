var e={answerHtml:`<p>同一份服务器组件树里，标题区域和统计区域可能都要读取同一用户或计算同一结果。如果每个组件分别执行相同工作，就会重复查询或计算。React cache 可以让这些调用在同一 Server Components 请求上下文中复用结果。</p>
<p>这里必须强调 Server Components 上下文。它不是给任意 Node 函数加一个长期 Map，也不能把普通客户端组件或任意 renderToString 调用都默认当成具有相同缓存语义的环境。</p>
<h3>缓存函数在模块中建立，组件共享它</h3>
<p>下面需要在支持 Server Components 的环境中渲染。日志用于观察计算是否重复，不代表真实业务需要在每次读取时输出日志。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { cache } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> getScore = <span class="hljs-title function_">cache</span>(<span class="hljs-function">(<span class="hljs-params">correct, total</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;计算得分&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(correct) || !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(total) ||
      total &lt;= <span class="hljs-number">0</span> || correct &lt; <span class="hljs-number">0</span> || correct &gt; total) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;题目数量不合法&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">percentage</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(correct / total * <span class="hljs-number">100</span>) };
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Score</span>(<span class="hljs-params">{ label }</span>) {
  <span class="hljs-keyword">const</span> result = <span class="hljs-title function_">getScore</span>(<span class="hljs-number">8</span>, <span class="hljs-number">10</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{label}：{result.percentage}%<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Report</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Score</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;顶部摘要&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Score</span> <span class="hljs-attr">label</span>=<span class="hljs-string">&quot;详细统计&quot;</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>同一请求中，两处都使用同一个 getScore，参数也相同，可以复用第一次得到的结果。新的服务器请求拥有新的缓存范围，不应该期待前一个请求的结果永久留下来。</p>
<p>cache(fn) 创建包装函数时不会立即执行 fn。真正调用包装函数时才查找对应记录，未命中再执行原函数。</p>
<h3>被缓存函数的身份需要稳定</h3>
<p>如果每次渲染都创建一个新函数，再传给 cache，例如 cache(() =&gt; calculate())，就不是稳定的同一个被缓存函数。源码看起来相同，不表示函数对象身份相同。通常应在合适的模块边界建立并导出一份明确的缓存入口，让多个读取点复用它。</p>
<p>对同一个原函数重复调用 cache，会得到不同包装引用，但不能据此把它们当成可靠隔离的缓存区。例如 React 19.3.1 的实现按原函数身份组织相应请求内记录，重复包装同一个原函数仍可共享结果。不要依赖这种包装细节设计用户隔离或失效策略，应使用明确的请求范围与业务参数。</p>
<p>这与把实际用户数据放在模块级变量里不是一回事。包装函数可以长期存在，数据缓存仍由 React 的请求上下文管理；如果另外在闭包里保存一个永久全局 Map，那是应用自行引入的另一层生命周期。</p>
<h3>参数不会自动进行业务内容的深度比较</h3>
<p>两次传入分别创建的 <code>{ id: &#x27;user_1&#x27; }</code>，即使内容相同，也不是同一个对象参数，不能假定命中同一条记录。对象与函数参数的引用身份尤其需要稳定。</p>
<p>如果查询天然由 ID、语言、版本等原始值确定，直接传递这些明确参数，往往比每次构造新 options 对象更清楚。确实需要对象参数时，应理解共享的是哪一个对象，以及它是否会被修改。</p>
<p>原地修改对象后继续用同一引用，也可能复用不符合预期的旧结果。缓存函数的输入应准确表达决定结果的条件，不应该偷偷依赖一个会变化、又没有被正确隔离的全局用户或配置变量。</p>
<h3>异步结果可以共享同一个进行中的工作</h3>
<p>缓存函数可以返回 Promise。第一次调用启动异步工作后，同一上下文、同一缓存键的后续调用可以取得同一结果路径，不必等第一次完全完成后才有复用价值。</p>
<p>这适合多个 Server Component 共享一项读取，或者在合适位置预先启动，稍后再 await。预加载不意味着请求永远成功，也不意味着所有读取都应该无条件提前开始，仍需考虑权限、成本和实际使用概率。</p>
<p>从服务器创建并传给客户端读取的 Promise，还受到 React 序列化与框架集成约束。不能把 cache 与任意浏览器 Promise 缓存混为一谈。</p>
<h3>失败也可能在当前范围内被复用</h3>
<p>如果原函数针对某组参数抛错，缓存函数会记住对应失败；同一范围里的再次调用可能重新抛出同一个错误，而不是自动重试一遍。</p>
<p>因此一个组件外面加 try/catch，再立即用相同参数调用同一缓存函数，不一定发起新的工作。需要重试时，应根据框架生命周期或数据层设计真正的新尝试，而不是把 cache 当成“失败不算缓存”的通用约定。</p>
<p>可预期的失败如果被转换为普通结果，那也可能作为结果被复用。返回空对象还是抛错，是数据契约选择，不应为了看起来缓存命中率高而隐藏真实问题。</p>
<h3>请求内复用不等于持久数据缓存</h3>
<p>React 会按服务器请求管理这类缓存范围。它不提供跨用户的永久命中，也没有在这里声明任意 TTL、按标签失效或后台重新验证策略。</p>
<p>HTTP 缓存由响应头和浏览器/CDN等机制决定；框架的数据缓存可能跨请求保存；数据库缓存又有自己的规则。给一个函数加 React cache，不会自动改写这些系统的缓存寿命。</p>
<p>框架中名称相近的缓存指令或封装，也不一定与 React 的 cache() 具有同一生命周期。讨论命中与失效时，应明确究竟是哪一层在复用数据。</p>
<h3>它不能替代事务、授权或取消设计</h3>
<p>同一请求中重复得到同一结果，有助于减少重复读取，但不等于数据库提供了事务一致性。如果读取依赖多个资源，仍然要由数据访问层保证需要的关系。</p>
<p>写入动作通常不应直接套上读取型缓存，避免相同参数时本应执行的变更被跳过。认证授权也必须按服务端当前请求和资源规则检查，而不是因为某次缓存里曾有成功结果就长期放行。</p>
<p>支持环境中可以进一步结合 cacheSignal 等生命周期能力取消不再需要的工作，但这不等于用户操作被回滚，也不能让任意底层 API 自动支持取消。</p>
<h3>验证必须放在正确的运行上下文里</h3>
<p>在普通脚本顶层连续调用两次包装函数，或在客户端环境中测试，可能看不到预期复用，因为没有对应的 Server Components 缓存上下文。不能据此宣布 cache 失效，也不能把自己手写的 Map 测试结果当成 React 行为证明。</p>
<p>有意义的验证应包括：同一请求重复参数只执行一次、新请求重新执行、不同对象参数不误合并、错误是否按预期共享，以及缓存函数没有被每个组件重新创建。把范围和身份说清楚后，cache 才是一个可解释的读取优化工具。</p>`};export{e as default};