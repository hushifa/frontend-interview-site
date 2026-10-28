var e={answerHtml:`<h2>简答</h2>
<ul>
<li>只重试临时性失败，例如 429、502、503、504；400 和权限错误不应重试。</li>
<li>用指数退避加随机抖动，并限制最大次数、单次等待时间和总时长。</li>
<li>服务端返回的 Retry-After 要遵守，不能擅自缩短。</li>
<li>写操作重试需要服务端用幂等键防止重复执行。</li>
</ul>
<p>一次请求失败后，再试一次可能恢复，也可能让问题更严重。比如临时服务不可用值得稍后重试，密码错误通常不值得原样重复；创建订单超时则更复杂，客户端没拿到结果，不代表服务器没有创建成功。</p>
<p>因此重试的第一步不是写循环，而是确定哪些失败可重试、最多尝试多少次、等待多久，以及重复执行是否安全。</p>
<h2>失败类型决定策略，不能只看 catch</h2>
<p>fetch 收到 HTTP 404、429 或 503 时，通常仍会兑现为 Response，需要检查状态码后按业务分类。网络断开、CORS、取消、JSON 解析失败和业务错误，也不是同一种原因。</p>
<p>例如某个只读接口可以约定重试 429、502、503、504，但这不意味着所有接口、所有 5xx 都应重复发送。400、权限拒绝和确定的业务校验失败通常需要修改输入或身份状态；用户主动取消更不应被当成下一次重试的理由。</p>
<p>浏览器抛出的 TypeError 也可能来自错误 URL、CORS 或其他不可恢复情况，不能仅凭错误类名就判断一定是临时网络波动。</p>
<h2>次数、退避与总预算分别限制什么</h2>
<p>maxAttempts=3 表示包含第一次在内最多三次，不是失败后再加三次。指数退避让等待上限逐步变长，随机抖动让不同客户端不至于在同一个时刻一起重试。</p>
<p>还要有最大单次等待和整体等待预算。次数有限并不代表总时间有限：某一次请求本身如果永远不结束，循环仍然可能挂住。</p>
<p>下面先实现一个通用框架：request 接收 attempt 和 signal，shouldRetry 必须同步返回布尔值，默认不重试；getRetryAfter 返回服务端要求的等待毫秒，或者 null 表示没有要求。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">waitForRetry</span>(<span class="hljs-params">ms, signal</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (signal?.<span class="hljs-property">aborted</span>) {
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      <span class="hljs-title function_">resolve</span>();
    }, ms);

    <span class="hljs-keyword">function</span> <span class="hljs-title function_">onAbort</span>(<span class="hljs-params"></span>) {
      <span class="hljs-built_in">clearTimeout</span>(timer);
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
    }

    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  });
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">requestWithRetry</span>(<span class="hljs-params">request, {
  maxAttempts = <span class="hljs-number">3</span>,
  baseDelayMs = <span class="hljs-number">200</span>,
  maxDelayMs = <span class="hljs-number">5000</span>,
  shouldRetry = () =&gt; <span class="hljs-literal">false</span>,
  getRetryAfter = () =&gt; <span class="hljs-literal">null</span>,
  signal,
} = {}</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> request !== <span class="hljs-string">&#x27;function&#x27;</span> || <span class="hljs-keyword">typeof</span> shouldRetry !== <span class="hljs-string">&#x27;function&#x27;</span> || <span class="hljs-keyword">typeof</span> getRetryAfter !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;请求和重试策略必须是函数&#x27;</span>);
  }
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(maxAttempts) || maxAttempts &lt; <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;尝试次数必须为正整数&#x27;</span>);
  }
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> delay <span class="hljs-keyword">of</span> [baseDelayMs, maxDelayMs]) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(delay) || delay &lt; <span class="hljs-number">0</span> || delay &gt; <span class="hljs-number">2_147_483_647</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;等待参数必须是计时器范围内的非负整数&#x27;</span>);
    }
  }

  <span class="hljs-keyword">let</span> delayCap = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(baseDelayMs, maxDelayMs);

  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> attempt = <span class="hljs-number">1</span>; attempt &lt;= maxAttempts; attempt += <span class="hljs-number">1</span>) {
    signal?.<span class="hljs-title function_">throwIfAborted</span>();
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> result = <span class="hljs-keyword">await</span> <span class="hljs-title function_">request</span>({ attempt, signal });
      signal?.<span class="hljs-title function_">throwIfAborted</span>();
      <span class="hljs-keyword">return</span> result;
    } <span class="hljs-keyword">catch</span> (error) {
      signal?.<span class="hljs-title function_">throwIfAborted</span>();
      <span class="hljs-keyword">if</span> (attempt === maxAttempts) <span class="hljs-keyword">throw</span> error;

      <span class="hljs-keyword">const</span> retryable = <span class="hljs-title function_">shouldRetry</span>(error, attempt);
      <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> retryable !== <span class="hljs-string">&#x27;boolean&#x27;</span>) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;shouldRetry 必须同步返回布尔值&#x27;</span>);
      }
      <span class="hljs-keyword">if</span> (!retryable) <span class="hljs-keyword">throw</span> error;

      <span class="hljs-keyword">const</span> retryAfterMs = <span class="hljs-title function_">getRetryAfter</span>(error, attempt);
      <span class="hljs-keyword">if</span> (retryAfterMs !== <span class="hljs-literal">null</span> &amp;&amp; (<span class="hljs-keyword">typeof</span> retryAfterMs !== <span class="hljs-string">&#x27;number&#x27;</span> || <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isNaN</span>(retryAfterMs) || retryAfterMs &lt; <span class="hljs-number">0</span>)) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;服务端等待时间必须为非负毫秒或 null&#x27;</span>);
      }
      <span class="hljs-keyword">if</span> (retryAfterMs !== <span class="hljs-literal">null</span> &amp;&amp; retryAfterMs &gt; maxDelayMs) <span class="hljs-keyword">throw</span> error;

      <span class="hljs-keyword">const</span> jitter = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>() * (delayCap + <span class="hljs-number">1</span>));
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">waitForRetry</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(jitter, <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(retryAfterMs ?? <span class="hljs-number">0</span>)), signal);
      delayCap = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(maxDelayMs, delayCap * <span class="hljs-number">2</span>);
    }
  }
}
</code></pre></div>
<p>抖动在当前上限内选择等待，而不是所有客户端都等完全相同的数值。上限逐轮倍增并截到 maxDelayMs，避免无边界扩大；baseDelayMs=0 时也不会产生指数计算溢出后变成 NaN 的问题。</p>
<p>取消信号既检查在请求前后，也传给等待函数。等待期间取消会清掉计时器并拒绝，不会在用户取消后又自动开始下一轮。拒绝沿用 signal.reason，不能假定所有取消原因都是固定名称的 Error。</p>
<h2>Retry-After 不是随便截短到客户端上限</h2>
<p>服务器可能要求等待若干秒，或者等待到某个 HTTP 日期。如果它要求一分钟，而客户端只愿意等五秒，不能直接取最小值五秒后就重发。示例选择停止自动重试，把错误交给调用者，让界面决定是否提示稍后再试。</p>
<p>可以用下面的解析器接入常见的秒数和标准 IMF-fixdate 日期格式。无法识别的非空要求返回 Infinity，表示本示例不擅自提前重试；它不是一个穷尽所有历史日期格式的 HTTP 解析库。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">retryAfterMilliseconds</span>(<span class="hljs-params">value, now = <span class="hljs-built_in">Date</span>.now()</span>) {
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> text = value.<span class="hljs-title function_">trim</span>();
  <span class="hljs-comment">// 空头视为服务端没有提出等待要求，交给常规退避</span>
  <span class="hljs-keyword">if</span> (text === <span class="hljs-string">&#x27;&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-regexp">/^\\d+$/</span>.<span class="hljs-title function_">test</span>(text)) <span class="hljs-keyword">return</span> <span class="hljs-title class_">Number</span>(text) * <span class="hljs-number">1000</span>;

  <span class="hljs-keyword">const</span> timestamp = <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">parse</span>(text);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(timestamp) || <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(timestamp).<span class="hljs-title function_">toUTCString</span>() !== text) {
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Infinity</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, timestamp - now);
}
</code></pre></div>
<p>日期形式受客户端时钟偏差影响，不能把本机时间当成无误差的服务端时钟。更复杂的客户端可以结合响应 Date 和网络时间设计换算；对于不确定的要求，保守停止比擅自缩短等待更明确。</p>
<p>跨源响应的 Retry-After 还需要正确暴露给脚本读取，开发者工具能看到头不代表 JavaScript 一定能访问它。</p>
<h2>把策略用于一个约定可重试的 GET 接口</h2>
<p>下面假设 <code>/api/catalog</code> 是只读目录接口，并约定可在状态下重新获取。HttpResponseError 是这里定义的应用错误类型，不是浏览器自动生成的 HTTP 异常。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">HttpResponseError</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">Error</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">status, retryAfter</span>) {
    <span class="hljs-variable language_">super</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${status}</span>\`</span>);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">name</span> = <span class="hljs-string">&#x27;HttpResponseError&#x27;</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">status</span> = status;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">retryAfter</span> = retryAfter;
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadCatalog</span>(<span class="hljs-params">signal</span>) {
  <span class="hljs-keyword">const</span> timeout = <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">10_000</span>);
  <span class="hljs-keyword">const</span> combined = signal ? <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([signal, timeout]) : timeout;

  <span class="hljs-keyword">return</span> <span class="hljs-title function_">requestWithRetry</span>(<span class="hljs-title function_">async</span> ({ signal }) =&gt; {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/catalog&#x27;</span>, { signal });
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) {
      <span class="hljs-keyword">const</span> error = <span class="hljs-keyword">new</span> <span class="hljs-title class_">HttpResponseError</span>(response.<span class="hljs-property">status</span>, response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Retry-After&#x27;</span>));
      <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>?.<span class="hljs-title function_">cancel</span>();
      <span class="hljs-keyword">throw</span> error;
    }
    <span class="hljs-keyword">return</span> response.<span class="hljs-title function_">json</span>();
  }, {
    <span class="hljs-attr">signal</span>: combined,
    <span class="hljs-attr">maxAttempts</span>: <span class="hljs-number">3</span>,
    <span class="hljs-attr">shouldRetry</span>: <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> error <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">HttpResponseError</span> &amp;&amp; [<span class="hljs-number">429</span>, <span class="hljs-number">502</span>, <span class="hljs-number">503</span>, <span class="hljs-number">504</span>].<span class="hljs-title function_">includes</span>(error.<span class="hljs-property">status</span>),
    <span class="hljs-attr">getRetryAfter</span>: <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-title function_">retryAfterMilliseconds</span>(error.<span class="hljs-property">retryAfter</span>),
  });
}
</code></pre></div>
<p>调用者应捕获 loadCatalog 的拒绝，并按取消、超时或最终 HTTP 错误显示状态。这里明确不自动重试任意网络 TypeError 或 JSON 解析失败，项目若有可靠的错误分类，可以另行扩展策略。</p>
<p>同一个超时信号覆盖这轮获取与退避，底层 fetch 真正使用它。AbortSignal.timeout/any 需要对应环境支持，timeout 也受浏览器活跃时间等规则影响，不是跨冻结或休眠的严格墙上时间保证。</p>
<p>对于通用 request 函数，若它根本不配合 signal，框架不能强行停止其内部工作；甚至一直不结束的 Promise 仍可能让等待无法完成。需要额外停止外层等待时可以设计竞速，但“调用方不再等待”和“内部任务已经取消”仍是两件事。</p>
<h2>每轮要重新创建可发送的请求</h2>
<p>重试应调用请求工厂，而不是把同一个已经消耗的 Request body 或流反复发送。普通 GET 比较简单，上传流和一次性请求体则需要确认可重放，不能只在 catch 里原样再 fetch 一次。</p>
<p>失败响应也要按需要消费或取消响应体，避免大量失败重试浪费连接和内存。最终错误应保留有用的状态和原因，而不是一律改成“网络错误”，否则用户和日志都无法判断下一步。</p>
<h2>写操作的安全性最终由业务保证</h2>
<p>超时发生时，服务器可能已经写入成功，只是响应丢失。再次提交订单或支付，会不会产生第二次操作，需要服务端幂等键、状态查询和事务保证。</p>
<p>幂等键应标识同一次用户操作，重试沿用同一个键，而不是每一轮都生成新键。取消客户端也不等于撤销服务器操作，必要时还需要查询最终结果或执行业务补偿。</p>
<p>重试还会增加总流量。前端、网关和 SDK 如果各自重试三次，组合后的请求量可能远大于三次。应明确哪一层负责重试、怎样限制并发与总预算，并记录尝试次数和最终原因；不要把重试当成掩盖所有错误的默认动作。</p>`};export{e as default};