var e={answerHtml:`<p>系统剪贴板可能保存用户刚从其他应用复制的密码、地址或私人内容，网页不能把它当成普通的本地变量随时读写。异步 Clipboard API 因而受到安全上下文、文档状态、用户激活、权限和浏览器策略约束。</p>
<p>复制在开发环境成功、线上 iframe 里失败，可能不是文本有问题，而是调用上下文不同。</p>
<h3>纯文本复制应直接由用户操作触发</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">copyText</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">window</span>.<span class="hljs-property">isSecureContext</span> || !navigator.<span class="hljs-property">clipboard</span>?.<span class="hljs-property">writeText</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;unavailable&#x27;</span> };
  }
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">clipboard</span>.<span class="hljs-title function_">writeText</span>(text);
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span> };
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">reason</span>: <span class="hljs-string">&#x27;rejected&#x27;</span> };
  }
}
</code></pre></div>
<p>调用方应在复制按钮的点击处理中使用，并仅在 ok 为 true 后显示“已复制”。rejected 代表当前调用未获成功，不应一律显示“你拒绝了权限”，因为原因也可能是焦点、激活、策略或平台限制。</p>
<p>最好提前准备要复制的文字。点击后先等待很慢的网络请求，再调用 writeText，可能已经失去临时用户激活。需要异步准备内容时，可以先加载好，再让用户点击实际复制按钮。</p>
<h3>读取与写入的要求不完全相同</h3>
<p>writeText 把指定文字交给剪贴板，readText 读取当前文字。读取通常有更明显的隐私风险，浏览器可能要求额外授权或提供自己的粘贴交互。</p>
<p>某些浏览器支持通过 Permissions API 查询 clipboard-read 或 clipboard-write，另一些并不支持这些 permission descriptor。不能以查询抛错为由认定整个 Clipboard API 都不能用，也不能以查询 granted 为由忽略实际调用失败。</p>
<p>嵌入 iframe 时还可能受相应 Permissions Policy 限制。处理方式是核对真实上下文与平台要求，不是试图绕过用户选择。</p>
<h3>read/write 处理的是数据表示，不是任意文件通道</h3>
<p>ClipboardItem 可以为同一内容提供多种 MIME 表示，例如 HTML 和纯文本，让粘贴目标选择它支持的形式。但浏览器与操作系统支持的类型、项目数量和数据大小存在差异。</p>
<p>需要图片或其他格式时应检测相应能力并处理失败，不能因为 writeText 成功就认为所有 ClipboardItem 都可用。可提供纯文本替代，但替代内容应仍然有意义，而不是悄悄丢失用户以为已经复制的数据。</p>
<p>粘贴的 HTML 或文本来自外部，仍需按使用上下文校验和安全渲染。直接把 HTML 写入 innerHTML，会把剪贴板来源变成注入入口。</p>
<h3>粘贴事件与主动读取不同</h3>
<p>用户在输入区域执行粘贴时，可以在 paste 事件里读取 event.clipboardData 提供的数据。这是围绕一次用户粘贴操作的事件接口，不等于页面可以据此持续后台读取系统剪贴板。</p>
<p>如果浏览器的原生粘贴已经能满足输入需求，通常不必额外添加主动 readText 按钮。自定义处理也应保留合理的键盘行为与文本输入体验。</p>
<h3>降级让用户仍可完成复制</h3>
<p>不支持或调用失败时，可以展示可选中的文本和手动复制说明。不要反复弹权限请求，也不要无条件显示成功。已弃用的 document.execCommand(&#x27;copy&#x27;) 不适合当作所有浏览器的长期通用方案。</p>
<p>复制链接前还应清理不应分享的令牌或私人查询参数；复制后不能保证剪贴板永久保持该值，其他应用可能立即覆盖它。自动化 Mock 只能验证成功与失败提示，真实权限和系统交互仍需目标浏览器测试。</p>`};export{e as default};