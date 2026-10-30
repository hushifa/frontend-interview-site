var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端接一个错误监控平台，以 Sentry 为例，要做四件事：初始化 SDK、上传 Source Map、关联版本、控制采样。</p>
<p>初始化就是在应用最早执行的地方调用 <code>Sentry.init</code>，至少配 <code>dsn</code>，它告诉 SDK 把事件发到哪个项目。再配上 <code>release</code> 和 <code>environment</code>，标明是哪个版本、哪个环境报的错。SDK 默认启用的 <code>globalHandlersIntegration</code> 会捕获未处理的错误和 Promise 拒绝，不用自己写 <code>window.onerror</code>。</p>
<p>线上代码是压缩过的，报错堆栈看不懂，所以构建时要用 Sentry 的打包插件把 Source Map 上传上去，上传完把 <code>.map</code> 文件删掉，不对外公开。插件默认会往产物里注入 Debug ID，用来把压缩文件和对应的 map 对上；同时会创建 release，并把版本号注入到产物里。有了 release，Sentry 才能告诉你某个错误是哪个版本开始出现的、可能是哪次提交引入的。</p>
<p>采样分两类。错误用 <code>sampleRate</code>，默认是 1，也就是全部上报；性能追踪用 <code>tracesSampleRate</code>，或者用 <code>tracesSampler</code> 按页面、接口设置不同比例。官方提醒，降低错误采样率会让你看不到部分错误，量太大时可以优先考虑项目的限流。另外要用 <code>beforeSend</code> 去掉用户隐私，<code>dsn</code> 本身可以公开，它只能用来提交事件，不能读数据。</p>
</blockquote>
<h2>初始化 SDK</h2>
<p>浏览器项目安装 <code>@sentry/browser</code>，React、Vue 等框架有各自的包，初始化方式相同。下面的配置参考 Sentry 文档的快速开始：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> <span class="hljs-title class_">Sentry</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@sentry/browser&#x27;</span>;

<span class="hljs-title class_">Sentry</span>.<span class="hljs-title function_">init</span>({
  <span class="hljs-attr">dsn</span>: <span class="hljs-string">&#x27;https://&lt;public-key&gt;@&lt;host&gt;/&lt;project-id&gt;&#x27;</span>,
  <span class="hljs-attr">release</span>: <span class="hljs-string">&#x27;my-project-name@2.3.12&#x27;</span>,
  <span class="hljs-attr">environment</span>: <span class="hljs-string">&#x27;production&#x27;</span>,
  <span class="hljs-attr">integrations</span>: [<span class="hljs-title class_">Sentry</span>.<span class="hljs-title function_">browserTracingIntegration</span>(), <span class="hljs-title class_">Sentry</span>.<span class="hljs-title function_">replayIntegration</span>()],
  <span class="hljs-attr">sampleRate</span>: <span class="hljs-number">1.0</span>,
  <span class="hljs-attr">tracesSampleRate</span>: <span class="hljs-number">0.1</span>,
  <span class="hljs-attr">replaysSessionSampleRate</span>: <span class="hljs-number">0.1</span>,
  <span class="hljs-attr">replaysOnErrorSampleRate</span>: <span class="hljs-number">1.0</span>,
  <span class="hljs-title function_">beforeSend</span>(<span class="hljs-params">event</span>) {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">request</span>?.<span class="hljs-property">cookies</span>) <span class="hljs-keyword">delete</span> event.<span class="hljs-property">request</span>.<span class="hljs-property">cookies</span>;
    <span class="hljs-keyword">return</span> event;
  },
});
</code></pre></div>
<p><code>dsn</code> 写在前端代码里，会不会被别人看到、拿去乱用？Sentry 的文档说明 DSN 可以公开，它只允许提交新事件，没有读取任何数据的权限。被人滥发事件的风险确实存在，文档说 Sentry 提供了屏蔽 IP 之类的控制，也可以在项目的 Client Keys 设置里轮换或吊销 DSN。</p>
<p><code>release</code> 一般不手写，下一节的打包插件会自动注入。文档还说明，浏览器里的 SDK 会尝试从 <code>window.SENTRY_RELEASE.id</code> 读取版本号。<code>environment</code> 区分生产、预发和开发环境，在 Sentry 里可以按环境筛选错误。</p>
<p><code>integrations</code> 里的 <code>browserTracingIntegration</code> 开启性能追踪，<code>replayIntegration</code> 开启会话回放，不需要可以不加。<code>beforeSend</code> 在每个错误事件发送前调用，可以修改事件，返回 <code>null</code> 就丢弃这个事件，文档举的用途就是发送前手动去掉个人信息。</p>
<p>SDK 默认启用 <code>globalHandlersIntegration</code> 捕获全局的未处理错误和 Promise 拒绝，原理和自己写全局监听一样，见<a href="/questions/monitoring-error-capture/">《前端怎样全局捕获 JS 错误、Promise 拒绝和资源加载失败？》</a>。</p>
<h2>上传 Source Map</h2>
<p>以 Vite 为例，Sentry 提供 <code>sentryVitePlugin</code>。下面的配置来自 Sentry 的 Vite 文档：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vite&#x27;</span>;
<span class="hljs-keyword">import</span> { sentryVitePlugin } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@sentry/bundler-plugins/vite&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">build</span>: {
    <span class="hljs-attr">sourcemap</span>: <span class="hljs-string">&#x27;hidden&#x27;</span>, <span class="hljs-comment">// 必须开启 Source Map 生成</span>
  },
  <span class="hljs-attr">plugins</span>: [
    <span class="hljs-comment">// Sentry 插件放在所有插件之后</span>
    <span class="hljs-title function_">sentryVitePlugin</span>({
      <span class="hljs-attr">org</span>: <span class="hljs-string">&#x27;&lt;org-slug&gt;&#x27;</span>,
      <span class="hljs-attr">project</span>: <span class="hljs-string">&#x27;&lt;project-slug&gt;&#x27;</span>,
      <span class="hljs-attr">authToken</span>: process.<span class="hljs-property">env</span>.<span class="hljs-property">SENTRY_AUTH_TOKEN</span>,
      <span class="hljs-attr">sourcemaps</span>: {
        <span class="hljs-attr">filesToDeleteAfterUpload</span>: [<span class="hljs-string">&#x27;./**/*.map&#x27;</span>],
      },
    }),
  ],
});
</code></pre></div>
<p><code>sourcemap: &#x27;hidden&#x27;</code> 会生成 map 文件，但不在 JS 末尾写 <code>sourceMappingURL</code> 注释，浏览器不会去请求它。<code>filesToDeleteAfterUpload</code> 在上传后删掉 map 文件，所以部署出去的目录里没有它们。文档明确提醒，生成的 Source Map 如果被公开，源码可能泄漏，要么让服务器拒绝访问 <code>.js.map</code>，要么用这个选项删掉。</p>
<p><code>authToken</code> 有项目的写权限，属于敏感信息，文档建议放在 CI 的环境变量里，或者放在 <code>.env.sentry-build-plugin</code> 文件里并加进 <code>.gitignore</code>。插件在开发模式和 watch 模式下不会上传，所以要用生产构建来验证配置。</p>
<p>上传以后，Sentry 怎么知道哪个 map 对应哪个 JS 文件？文档说默认做法是往构建产物里注入 Debug ID，压缩文件和 map 文件带同一个 ID，就能对上，不依赖文件名和路径。为什么 map 不能公开、Source Map 是怎样把位置还原回来的，见<a href="/questions/monitoring-source-map/">《线上报错怎样用 Source Map 还原，又不把 map 文件公开？》</a>。</p>
<h2>release 怎样关联</h2>
<p>release 是代码的一个版本。打包插件的 <code>release</code> 选项默认都是开启的：<code>release.create</code> 在构建时在 Sentry 上创建 release，<code>release.inject</code> 把版本信息注入产物，让 SDK 上报时带上；<code>release.name</code> 不填时，插件会从 CI 环境里自动识别，识别不到就用 git 当前提交的 SHA。<code>release.setCommits</code> 默认 <code>{ auto: true }</code>，把 release 和对应的提交关联起来。</p>
<p>关联上以后能做什么？Sentry 的 release 文档列了这几件事：看出新版本引入了哪些错误和回归；推测是哪次提交导致的问题、谁可能负责；在提交信息里写上问题编号，发版后自动把问题标为已解决。还有 release 健康度：SDK 默认会上报会话，Sentry 据此算出无崩溃会话的比例，看新版本是不是变差了。</p>
<p>关键是一致：SDK 上报事件时带的 release，和上传 Source Map、创建 release 时用的名字要相同。所以最省事的做法是让插件统一生成和注入，不要在 <code>Sentry.init</code> 里另写一个值。</p>
<h2>采样怎样设置</h2>
<p>错误事件用 <code>sampleRate</code>，范围 0 到 1，默认 1.0，表示全部上报；设成 0.1 就随机只发 10%。文档同时提醒，改错误采样率要重新部署，而且会让你看不到一部分错误的来源，错误量大时，在项目上设置限流可能更合适，因为限流只在量高时丢事件。</p>
<p>性能追踪用 <code>tracesSampleRate</code>，表示每条 trace 被发送的概率；要么配它，要么配 <code>tracesSampler</code>，两个都不配就不开启追踪。<code>tracesSampler</code> 是一个函数，可以按名称返回不同的比例，两个都配了，以它为准：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Sentry</span>.<span class="hljs-title function_">init</span>({
  <span class="hljs-attr">tracesSampler</span>: <span class="hljs-function">(<span class="hljs-params">{ name, inheritOrSampleWith }</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (name.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;healthcheck&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-number">0</span>; <span class="hljs-comment">// 健康检查不采样</span>
    <span class="hljs-keyword">if</span> (name.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;auth&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-number">1</span>; <span class="hljs-comment">// 登录相关全采</span>
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">inheritOrSampleWith</span>(<span class="hljs-number">0.5</span>); <span class="hljs-comment">// 其他沿用上游的采样决定，没有时按 0.5</span>
  },
});
</code></pre></div>
<p><code>inheritOrSampleWith</code> 的意思是：如果这条 trace 是从上游服务延续过来的，就沿用上游的采样决定，否则按给定的比例采样。这样前后端同一条链路要么都采、要么都不采，不会只采到一半。</p>
<p>会话回放有两个单独的采样率：<code>replaysSessionSampleRate</code> 是从会话开始就录制的比例，<code>replaysOnErrorSampleRate</code> 是发生错误时录制的比例。快速开始的示例里前者是 0.1，后者是 1.0。</p>
<p>采样之外，监控数据怎样去重、聚合和告警，见<a href="/questions/monitoring-sampling-alert/">《前端监控数据怎样做采样、去重、聚合和告警？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样过滤掉没用的错误，比如浏览器插件报的错？</strong></p>
<blockquote>
<p>用 <code>ignoreErrors</code> 配错误信息的字符串或正则，匹配到的不上报；用 <code>allowUrls</code> 只上报来自自己域名脚本的错误。更细的判断写在 <code>beforeSend</code> 里，返回 <code>null</code> 就丢弃。</p>
</blockquote>
<p><strong>Source Map 上传了，堆栈还是没还原，怎么排查？</strong></p>
<blockquote>
<p>先确认部署出去的代码里有 Debug ID，Sentry 文档的排查建议是重新运行 <code>npx @sentry/wizard@latest -i sourcemaps</code> 并确认用的是生产构建。再确认上传发生在错误出现之前，也就是先上传再部署。</p>
</blockquote>
<p><strong><code>dsn</code> 可以公开，<code>authToken</code> 呢？</strong></p>
<blockquote>
<p>不能公开。<code>authToken</code> 有上传 Source Map、创建 release 的权限，只能放在 CI 的密钥或本地不提交的环境文件里，而且只传给需要它的构建步骤。</p>
</blockquote>`};export{e as default};