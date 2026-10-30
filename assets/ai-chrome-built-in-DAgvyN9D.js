var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>文章页上加一个“生成摘要”按钮，或者评论区加一个“翻译成中文”，以前要调云端接口，现在桌面版 Chrome 可以直接用浏览器自带的模型完成。Chrome 把这类能力做成了几组专用 API：Summarizer 做摘要，Translator 做翻译，Language Detector 识别语言，Prompt API 可以像聊天一样向模型发自然语言请求。</p>
<p>它们的状态不一样。按 Chrome 官方的状态表，Summarizer、Translator 和 Language Detector 从 Chrome 138 起在网页里稳定可用；Prompt API 在 Chrome 扩展里从 138 起可用，网页里在 Chrome 148 列为可用；Writer、Rewriter 和 Proofreader 还在试验阶段。MDN 把这些 API 都标为非 Baseline，Firefox 和 Safari 不支持，Mozilla 和 Apple 对 Prompt API 的标准立场是反对。</p>
<p>用之前分三步检测：先看 <code>&#x27;Summarizer&#x27; in self</code> 这样的全局对象在不在，再调用 <code>availability()</code>，它会返回 <code>unavailable</code>、<code>downloadable</code>、<code>downloading</code> 或 <code>available</code>；状态是要下载时，<code>create()</code> 必须在用户点击之类的操作之后调用，并通过 <code>monitor</code> 显示下载进度。</p>
<p>降级是必须做的。模型只在满足要求的桌面设备上运行，比如基于基础模型的 API 要求至少 22 GB 可用磁盘空间、显存大于 4 GB 或者 16 GB 内存加 4 核 CPU，手机上都不支持。所以任何一步不满足，都要回退到服务端接口或者隐藏这个功能。</p>
</blockquote>
<h2>这些 API 各能做什么</h2>
<p>Chrome 的内置 AI 不是一个大接口，而是按任务拆成几个专用 API，加一个通用的 Prompt API。</p>
<p>Summarizer 把一段长文本变成摘要。创建时可以选 <code>type</code>（<code>key-points</code>、<code>tldr</code>、<code>teaser</code>、<code>headline</code>，默认 <code>key-points</code>）、<code>format</code>（<code>markdown</code> 或 <code>plain-text</code>，默认 <code>markdown</code>）和 <code>length</code>（<code>short</code>、<code>medium</code>、<code>long</code>，默认 <code>short</code>）。Chrome 文档说明，实例创建后这些选项就不能改了，要换设置就重新创建一个。</p>
<p>Translator 在两种语言之间翻译，创建时必须给出 <code>sourceLanguage</code> 和 <code>targetLanguage</code>。翻译按语言包工作，用到哪对语言就下载哪对。Chrome 文档还提到，翻译请求是按顺序处理的，前面一个大请求没完成，后面的都要等着。</p>
<p>Language Detector 识别一段文字是什么语言，返回一组 <code>{ detectedLanguage, confidence }</code>，按可能性从高到低排，<code>confidence</code> 在 0 到 1 之间。Chrome 文档提醒，很短的短语和单个词识别准确率低，置信度太低时应该当作“未知语言”处理。</p>
<p>Prompt API 用 <code>LanguageModel</code> 创建一个会话，然后用 <code>prompt()</code> 拿完整回答，或者用 <code>promptStreaming()</code> 流式拿到结果。会话可以用 <code>initialPrompts</code> 设置系统提示，用完调用 <code>destroy()</code> 释放资源。MDN 说明它只在安全上下文（HTTPS）里可用。</p>
<h2>哪些已经稳定，哪些还在试验</h2>
<p>这部分变化快，下面以 Chrome 官方 Built-in AI APIs 页面的状态表为准：</p>
<table><thead><tr><th>API</th><th>网页</th><th>Chrome 扩展</th></tr></thead><tbody><tr><td>Translator</td><td>Chrome 138</td><td>Chrome 138</td></tr><tr><td>Language Detector</td><td>Chrome 138</td><td>Chrome 138</td></tr><tr><td>Summarizer</td><td>Chrome 138</td><td>Chrome 138</td></tr><tr><td>Prompt</td><td>Chrome 148</td><td>Chrome 138</td></tr><tr><td>Writer、Rewriter</td><td>开发者试用</td><td>开发者试用</td></tr><tr><td>Proofreader</td><td>开发者试用</td><td>开发者试用</td></tr></tbody></table>
<p>Prompt API 的情况要多说一句。它在扩展里从 Chrome 138 起就稳定了；网页里，状态表列为 Chrome 148，但采样参数仍不一样：网页里用 <code>samplingMode</code> 选预设值，这部分还在 origin trial，<code>topK</code>、<code>temperature</code> 和 <code>LanguageModel.params()</code> 只在扩展里可用。</p>
<p>Chrome 之外，Chrome 文档的兼容表显示 Edge 也支持 Summarizer（138 起）和 Translator、Language Detector（148 起）。所以写代码时不能按浏览器品牌判断，只能按能力检测。</p>
<h2>设备要求决定了很多用户用不上</h2>
<p>即使浏览器版本够，设备不满足也用不了。Chrome 文档列出的要求是：</p>
<ul>
<li>系统：Windows 10 或 11、macOS 13 及以上、Linux，或者 Chromebook Plus 上的 ChromeOS。Android、iOS 和其他 ChromeOS 设备不支持，Language Detector 和 Translator 也只在桌面版 Chrome 上工作。</li>
<li>磁盘：Prompt、Summarizer、Writer、Rewriter、Proofreader 这几个依赖基础模型的 API，要求 Chrome 用户数据所在的磁盘至少有 22 GB 可用空间；下载后可用空间低于 10 GB，Chrome 会删掉模型。</li>
<li>显卡或 CPU：显存严格大于 4 GB；或者用 CPU，要 16 GB 以上内存和 4 核以上。</li>
<li>网络：第一次下载模型需要不限流量的网络。</li>
</ul>
<p>所以这是一个“有就用、没有也不影响”的增强功能，不能当作核心路径。</p>
<h2>怎样检测可用性</h2>
<p>检测分三层。先判断全局对象在不在，不在说明浏览器根本没有这个 API；再调用 <code>availability()</code>，它反映的是当前设备和选项能不能用；最后才 <code>create()</code>。</p>
<p><code>availability()</code> 的四个返回值，MDN 和 Chrome 文档的说法一致：</p>
<ul>
<li><code>unavailable</code>：设备或请求的选项不支持。</li>
<li><code>downloadable</code>：支持，但要先下载模型或数据。</li>
<li><code>downloading</code>：正在下载，要等下载完。</li>
<li><code>available</code>：可以直接创建。</li>
</ul>
<p>传给 <code>availability()</code> 的选项要和之后实际使用的一致，比如翻译要带上语言对，Prompt API 要带上 <code>expectedInputs</code> 和 <code>expectedOutputs</code>，因为模型不一定支持所有语言和输入类型。Chrome 文档还提到，出于隐私考虑，Translator 在网站真正创建某个语言对之前，会把所有语言对都报告成 <code>downloadable</code>。</p>
<p>把这套判断写成一个纯函数，可以单独验证它在各种情况下给出的决定：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">planSummary</span>(<span class="hljs-params">{ hasApi, availability, userActivated }</span>) {
  <span class="hljs-keyword">if</span> (!hasApi) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;server&#x27;</span>;
  <span class="hljs-keyword">if</span> (availability === <span class="hljs-string">&#x27;unavailable&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;server&#x27;</span>;
  <span class="hljs-keyword">if</span> (availability === <span class="hljs-string">&#x27;available&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;local&#x27;</span>;
  <span class="hljs-keyword">if</span> (!userActivated) <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;wait-for-click&#x27;</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;local-with-progress&#x27;</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">planSummary</span>({ <span class="hljs-attr">hasApi</span>: <span class="hljs-literal">false</span> })); <span class="hljs-comment">// server</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">planSummary</span>({ <span class="hljs-attr">hasApi</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">availability</span>: <span class="hljs-string">&#x27;unavailable&#x27;</span> })); <span class="hljs-comment">// server</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">planSummary</span>({ <span class="hljs-attr">hasApi</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">availability</span>: <span class="hljs-string">&#x27;available&#x27;</span> })); <span class="hljs-comment">// local</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">planSummary</span>({ <span class="hljs-attr">hasApi</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">availability</span>: <span class="hljs-string">&#x27;downloadable&#x27;</span>, <span class="hljs-attr">userActivated</span>: <span class="hljs-literal">false</span> })); <span class="hljs-comment">// wait-for-click</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">planSummary</span>({ <span class="hljs-attr">hasApi</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">availability</span>: <span class="hljs-string">&#x27;downloading&#x27;</span>, <span class="hljs-attr">userActivated</span>: <span class="hljs-literal">true</span> })); <span class="hljs-comment">// local-with-progress</span>
</code></pre></div>
<p><code>available</code> 时可以直接在本地处理。<code>downloadable</code> 和 <code>downloading</code> 时还要看有没有用户激活，因为 Chrome 文档规定，这两种状态下用户必须先和页面有实际交互（点击、按键、触摸等），代码才能调用 <code>create()</code>；没有的话就先显示一个按钮，等用户点。</p>
<h2>把检测、下载和降级接到按钮上</h2>
<p>下面是浏览器里的完整写法。<code>summarizeOnServer</code> 是假设的服务端回退函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">summaryButton.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;Summarizer&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">self</span>)) {
    output.<span class="hljs-property">textContent</span> = <span class="hljs-keyword">await</span> <span class="hljs-title function_">summarizeOnServer</span>(articleText);
    <span class="hljs-keyword">return</span>;
  }

  <span class="hljs-keyword">const</span> availability = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Summarizer</span>.<span class="hljs-title function_">availability</span>();
  <span class="hljs-keyword">if</span> (availability === <span class="hljs-string">&#x27;unavailable&#x27;</span>) {
    output.<span class="hljs-property">textContent</span> = <span class="hljs-keyword">await</span> <span class="hljs-title function_">summarizeOnServer</span>(articleText);
    <span class="hljs-keyword">return</span>;
  }

  <span class="hljs-keyword">const</span> summarizer = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Summarizer</span>.<span class="hljs-title function_">create</span>({
    <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;tldr&#x27;</span>,
    <span class="hljs-attr">format</span>: <span class="hljs-string">&#x27;plain-text&#x27;</span>,
    <span class="hljs-attr">length</span>: <span class="hljs-string">&#x27;short&#x27;</span>,
    <span class="hljs-title function_">monitor</span>(<span class="hljs-params">m</span>) {
      m.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;downloadprogress&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
        progress.<span class="hljs-property">value</span> = e.<span class="hljs-property">loaded</span>;
      });
    },
  });

  output.<span class="hljs-property">textContent</span> = <span class="hljs-keyword">await</span> summarizer.<span class="hljs-title function_">summarize</span>(articleText);
  summarizer.<span class="hljs-title function_">destroy</span>();
});
</code></pre></div>
<p>为什么把 <code>create()</code> 放在点击回调里？因为它可能触发模型下载，Chrome 文档要求在用户激活之后调用；MDN 也写明，按规范创建 <code>Summarizer</code>、<code>Translator</code>、<code>LanguageModel</code> 对象都需要临时用户激活。<code>downloadprogress</code> 事件里的 <code>e.loaded</code> 是 0 到 1 之间的进度，可以直接给进度条用。</p>
<p>这里用 <code>textContent</code> 显示结果。如果用的是 <code>format: &#x27;markdown&#x27;</code>，要先经过 Markdown 渲染和清洗再插入页面，不能把模型输出直接交给 <code>innerHTML</code>，原因见<a href="/questions/ai-markdown-security/">《AI 生成的 Markdown 应该怎样安全地渲染？》</a>。</p>
<p>用完调用 <code>destroy()</code>。MDN 的建议是，这些实例会占用大量资源，用完就释放。如果想中途取消，可以给 <code>create()</code> 或 <code>summarize()</code> 传一个 <code>AbortController</code> 的 <code>signal</code>。</p>
<h2>Prompt API 的基本用法</h2>
<p>Prompt API 是通用接口，用法接近聊天模型：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> session = <span class="hljs-keyword">await</span> <span class="hljs-title class_">LanguageModel</span>.<span class="hljs-title function_">create</span>({
  <span class="hljs-attr">initialPrompts</span>: [
    { <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;system&#x27;</span>, <span class="hljs-attr">content</span>: <span class="hljs-string">&#x27;你是一个简洁的写作助手。&#x27;</span> },
  ],
});

<span class="hljs-keyword">const</span> answer = <span class="hljs-keyword">await</span> session.<span class="hljs-title function_">prompt</span>(<span class="hljs-string">&#x27;用一句话解释什么是闭包&#x27;</span>);

<span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> session.<span class="hljs-title function_">promptStreaming</span>(<span class="hljs-string">&#x27;再举一个例子&#x27;</span>)) {
  output.<span class="hljs-title function_">append</span>(chunk);
}

session.<span class="hljs-title function_">destroy</span>();
</code></pre></div>
<p>会话有上下文窗口的限制。MDN 列出了 <code>contextWindow</code>（总大小）、<code>contextUsage</code>（已用多少）和 <code>measureContextUsage()</code>（一段输入会占多少），超出时会触发 <code>contextoverflow</code> 事件。会话也可以用 <code>clone()</code> 复制一份，带着已有的上下文继续用。</p>
<h2>权限策略和 iframe</h2>
<p>这些 API 都受 Permissions Policy 控制，对应的指令分别是 <code>summarizer</code>、<code>translator</code>、<code>language-detector</code> 和 <code>language-model</code>。MDN 说明，策略禁止时，<code>Translator</code>、<code>LanguageDetector</code>、<code>LanguageModel</code> 的 <code>availability()</code> 会返回 <code>unavailable</code>，其他方法会抛出 <code>NotAllowedError</code>。所以嵌在 iframe 里的页面拿到 <code>unavailable</code>，不一定是设备不支持，也可能是外层页面没有放行。</p>
<h2>和其他浏览器端推理方案怎么选</h2>
<p>内置 AI 的好处是不用自己下载和管理模型。如果需要跨浏览器，或者要用特定的模型，就要用 ONNX Runtime Web、Transformers.js 这类方案自己加载模型，代价和检测方式见<a href="/questions/ai-browser-inference/">《哪些 AI 能力可以直接在浏览器中运行？》</a>。两者可以组合：先用内置 API，不可用时再回退到自带模型或服务端。</p>
<h2>常见追问</h2>
<p><strong>availability() 返回 downloadable，可以在页面加载时就 create() 吗？</strong></p>
<blockquote>
<p>不可以。Chrome 文档规定，状态是 <code>downloadable</code> 或 <code>downloading</code> 时，用户必须先和页面有实际交互，才能调用 <code>create()</code>。可以用 <code>navigator.userActivation.isActive</code> 判断，一般直接把 <code>create()</code> 放在按钮点击回调里，同时用 <code>monitor</code> 的 <code>downloadprogress</code> 事件告诉用户下载进度。</p>
</blockquote>
<p><strong>为什么检测了全局对象还要调 availability()？</strong></p>
<blockquote>
<p>全局对象在，只说明浏览器实现了这个 API。设备够不够、请求的语言和选项支不支持、模型下没下载、权限策略有没有禁止，都要靠 <code>availability()</code> 判断。比如一台磁盘空间不够的电脑，<code>Summarizer</code> 对象存在，<code>availability()</code> 会返回 <code>unavailable</code>。</p>
</blockquote>
<p><strong>在本地运行就意味着完全不联网吗？</strong></p>
<blockquote>
<p>推理本身在设备上做，Chrome 文档说明使用模型时不会把数据发给 Google 或第三方。但第一次要联网下载模型，翻译还会按语言对下载语言包，Chrome 也可能在磁盘空间不足时删掉模型，之后要重新下载。所以“离线可用”只在模型已经下载好、还没被删的前提下成立。</p>
</blockquote>`};export{e as default};