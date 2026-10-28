var e={answerHtml:`<h2>简答</h2>
<ul>
<li>只重试可能自行恢复的失败：429、502、503、504 和网络中断。400、401、403、404 和业务校验失败原样重试也不会成功。</li>
<li><code>maxAttempts</code> 包含第一次请求；等待时间的上限每轮翻倍并封顶，实际等待在 0 到上限之间随机取值，避免大量客户端同时重试。</li>
<li>服务端返回 <code>Retry-After</code> 时，等待时间不能短于它；要求的等待超过客户端能接受的上限时，停止重试并把错误交给界面处理。</li>
<li>取消信号在每次请求前后检查，也传给等待函数，用户离开页面后不会再发起下一轮。</li>
<li>超时不代表服务端没有执行。创建订单这类写操作要带幂等键，每次重试沿用同一个键，由服务端去重。</li>
</ul>
<h2>先分类失败</h2>
<p><code>fetch</code> 收到 404 或 503 时仍会正常兑现 Response，需要自己检查 <code>response.ok</code> 和状态码。网络断开、CORS 被拒绝、URL 错误都会表现为 <code>TypeError</code>，只看错误类型无法区分能否恢复，所以重试条件要由调用方按接口约定提供。</p>
<h2>通用重试函数</h2>
<p><code>request</code> 接收本次的尝试序号和取消信号；<code>shouldRetry</code> 同步返回是否重试，默认不重试；<code>getRetryAfter</code> 返回服务端要求的等待毫秒，没有要求时返回 <code>null</code>。</p>
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
<p>几个设计决定：</p>
<ul>
<li><strong>抖动</strong>：<code>delayCap</code> 依次为 200、400、800 毫秒……直到 <code>maxDelayMs</code>，实际等待在 <code>[0, delayCap]</code> 内随机取值。所有客户端在同一时刻失败时，重试被分散开，不会一起冲击刚恢复的服务。</li>
<li><strong>服务端等待是下限</strong>：取随机等待和 <code>Retry-After</code> 中较大的那个。服务端要求的等待超过 <code>maxDelayMs</code> 时直接抛出错误，不擅自缩短。</li>
<li><strong>取消</strong>：等待期间收到取消，会清除计时器、移除监听器，并以 <code>signal.reason</code> 拒绝。请求本身不响应取消时，结束后也会再检查一次，避免把过期结果当作成功。</li>
<li><strong>保留原始错误</strong>：次数用尽时抛出最后一次的实际错误，调用方能看到状态码，而不是一个笼统的&quot;重试失败&quot;。</li>
</ul>
<h2>解析 Retry-After</h2>
<p><code>Retry-After</code> 可以是秒数，也可以是 HTTP 日期：</p>
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
<p>空值和空字符串都表示服务端没有提出要求，交给常规退避。无法识别的非空值返回 <code>Infinity</code>，配合上面的函数会停止重试，不会在服务端明确要求等待时提前发送请求。</p>
<h2>用在一个只读接口上</h2>
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
<ul>
<li>每次重试都重新调用 <code>fetch</code>。带请求体的请求要能重新生成请求体，读过一次的流不能再发送。</li>
<li>失败响应调用 <code>body.cancel()</code> 释放连接。</li>
<li><code>AbortSignal.timeout</code> 限制整个加载过程的总时长，<code>AbortSignal.any</code> 把它和调用方的取消信号合并。</li>
</ul>
<h2>写操作</h2>
<p>客户端超时后，订单可能已经在服务端创建成功，只是响应丢了。安全的做法是：</p>
<ol>
<li>用户点击提交时生成一个幂等键，例如 <code>crypto.randomUUID()</code>。</li>
<li>每次重试都在请求头中带上同一个键。</li>
<li>服务端记录已处理的键，重复请求直接返回第一次的结果。</li>
</ol>
<p>服务端不支持幂等键时，不要自动重试写操作；超时后先查询订单状态，再决定是否重新提交。</p>
<h2>常见追问</h2>
<ul>
<li><strong>前端、网关、SDK 都重试会怎样？</strong> 每层重试 3 次，组合后一个用户操作最多产生 27 次请求。应该约定只有一层负责重试。</li>
<li><strong>浏览器离线时还要重试吗？</strong> 可以监听 <code>online</code> 事件，恢复联网后再发起，而不是在离线期间按退避循环消耗次数。</li>
<li><strong>和防抖、节流有什么关系？</strong> 防抖和节流控制用户触发的频率，重试处理请求失败后的恢复，两者经常一起用在搜索框上。</li>
</ul>`};export{e as default};