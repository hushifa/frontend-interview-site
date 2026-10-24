var e={answerHtml:`<p>模型生成的 Markdown 仍然是不可信文本。Markdown 的标题、列表和代码块可以安全地作为展示内容处理，但把它直接转成 HTML 再交给 <code>dangerouslySetInnerHTML</code>，或者把生成的 JSX、MDX 和脚本编译执行，就跨过了展示和执行之间的权限边界。</p>
<p>使用 Markdown 组件时，默认的 HTML 处理和 URL 过滤只是安全起点。添加 rehype/remark 插件、自定义组件、允许原始 HTML 或修改链接转换规则，都可能扩大攻击面。若确实需要原始 HTML，应明确允许的标签、属性和协议，并在输出进入 DOM 前使用经过配置的净化流程；不能因为“用了 Markdown 库”就假设所有插件组合都安全。</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx">&lt;<span class="hljs-title class_">Markdown</span>
  components={{
    <span class="hljs-comment">// 链接统一限制协议和打开方式</span>
    <span class="hljs-attr">a</span>: <span class="hljs-function">(<span class="hljs-params">{ href, children }</span>) =&gt;</span> <span class="hljs-title function_">isSafeUrl</span>(href) &amp;&amp; (
      <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">{href}</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;noreferrer&quot;</span> <span class="hljs-attr">target</span>=<span class="hljs-string">&quot;_blank&quot;</span>&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span></span>
    ),
  }}
&gt;
  {modelText}
&lt;/<span class="hljs-title class_">Markdown</span>&gt;
</code></pre></div>
<p>代码块应该只负责展示，不能因为模型输出了 \`\`\`js 就执行其中的代码。公式、图表、Mermaid、文件预览和代码沙盒都是额外的解释器，需要单独的权限、资源限制和隔离策略。远程图片即使不执行脚本，也会向第三方发送请求，产品还要决定是否允许外链和哪些协议。</p>
<p>流式内容尚未完整时，可以先按纯文本或受限 Markdown 显示，等消息完成后再做完整解析；不要为了“修复”半截标签而临时关闭安全过滤。提示词注入和模型输出安全也不能只靠前端解决，工具权限、密钥和最终校验仍必须留在受控边界。</p>`};export{e as default};