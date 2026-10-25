var e={answerHtml:`<p>假设一个页面嵌入了视频会议组件和广告 iframe。会议组件需要摄像头，广告不需要。Permissions Policy 可以让页面明确声明：哪些文档有资格调用摄像头等能力，哪些文档即使想申请也应被策略拒绝。</p>
<p>它控制的是“文档是否被允许使用这项能力”，不是代替用户点击授权，也不是给某个来源自动授予摄像头权限。</p>
<h3>响应头描述页面的能力范围</h3>
<p>例如完全禁用定位和麦克风，只允许自身与指定会议来源使用摄像头：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Permissions-Policy: geolocation=(), microphone=(), camera=(self &quot;https://meet.example.com&quot;)
</code></pre></div>
<p>空括号表示不允许任何来源。self 表示当前文档自己的源；具体来源需要按响应头语法写在引号里。<code>camera=*</code> 则表示宽泛允许，不应在只需开放一个合作方时使用。</p>
<p>这份配置只是示例：真实会议通常也需要麦克风，业务若需要，就应为 microphone 单独配置适当范围。不同能力有各自的默认允许列表，省略一项不代表所有 iframe 都默认可以使用它。</p>
<h3>iframe 还需要合适的能力委托</h3>
<p>父页面嵌入会议组件时，可以明确写出容器策略：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">iframe</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;https://meet.example.com/room/42&quot;</span>
  <span class="hljs-attr">title</span>=<span class="hljs-string">&quot;视频会议&quot;</span>
  <span class="hljs-attr">allow</span>=<span class="hljs-string">&quot;camera https://meet.example.com&quot;</span>
&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>
</code></pre></div>
<p>响应头和 allow 属性使用不同语法：响应头用等号和括号，allow 属性按功能列出来源，多个功能之间用分号分隔。不要把一整段响应头原样复制进 allow。</p>
<p>allow 不能推翻上层已经禁止的能力。如果父页面发送 <code>camera=()</code>，子 iframe 再写 <code>allow=&quot;camera *&quot;</code> 也不能重新获得摄像头。嵌套多层时，每一层的继承和委托都可能进一步收紧权限；子页面自身的响应头也可以限制能力。</p>
<p>因此，看到子页面写了 allow 并不能证明配置完整。应检查顶层响应头、中间 iframe 容器策略、来源是否匹配，以及子文档自身策略。</p>
<h3>策略许可之后仍有其他条件</h3>
<p>即使策略允许，摄像头调用还要满足安全上下文、浏览器支持、用户授权和设备可用性等要求。某些 API 还要求用户激活；具体条件取决于 API，不能统一说成“所有设备能力都要点击后调用”。</p>
<p>反过来，用户以前点过允许，也不能覆盖当前文档的策略禁用。策略禁止时，浏览器可能直接拒绝调用，不再弹权限提示。</p>
<p>Permissions API 查询用户权限状态与 Permissions Policy 是相关但不同的机制。某些查询结果会反映策略限制，不能把 denied 一律解释为“用户刚刚点击了拒绝”。也不是每种能力都支持相同的查询方式。</p>
<h3>如何排查“摄像头打不开”</h3>
<p>先确认页面是否处于 HTTPS 等安全上下文，随后检查实际响应头和 iframe allow，特别是协议、域名、端口是否与配置一致。若 iframe 发生了跨来源导航，原有来源许可可能不再匹配。</p>
<p>再查看控制台中的策略违规信息和 API 返回的错误。比如 getUserMedia 的 NotAllowedError 可能涉及用户拒绝、策略或上下文限制，不能仅根据错误名就展示“你拒绝了权限”。应用可以提示用户检查浏览器设置，同时给管理员提供配置排查线索。</p>
<p>测试要区分两类：策略是否允许调用，可以通过浏览器环境验证；真实麦克风、摄像头是否工作，还需要设备与权限流程验证，模拟调用不能证明硬件体验正常。</p>
<p>最后，Permissions Policy 的整体和各项指令支持度并不完全一致。部署时应核对目标浏览器和具体能力；未知或未支持指令可能被忽略。它适合作为减少页面能力的防线，但不能替代业务授权、沙箱隔离或对第三方代码的审查。</p>`};export{e as default};