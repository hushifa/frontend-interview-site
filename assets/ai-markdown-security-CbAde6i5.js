var e={answerHtml:`<h2>先把 Markdown 当成用户输入</h2>
<p>模型可能引用网页中的恶意内容，也可能生成钓鱼链接、HTML、SVG 或代码。提示词要求“不要输出危险内容”只是模型偏好，不是浏览器安全边界。</p>
<p>代码块里的 JavaScript 应该只被显示；生成的 JSX、MDX、模板或脚本不能因为来源是模型就编译执行。展示文字和执行内容必须有清晰的权限分界。</p>
<h2>从受限 Markdown 开始</h2>
<p>默认关闭原始 HTML，只允许明确的链接协议，并对图片采用保守策略：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> <span class="hljs-title class_">Markdown</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-markdown&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">safeHref</span>(<span class="hljs-params">href</span>) {
  <span class="hljs-keyword">if</span> (!href) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(href, <span class="hljs-string">&#x27;https://app.example.com/&#x27;</span>);
    <span class="hljs-keyword">return</span> [<span class="hljs-string">&#x27;http:&#x27;</span>, <span class="hljs-string">&#x27;https:&#x27;</span>].<span class="hljs-title function_">includes</span>(url.<span class="hljs-property">protocol</span>) ? url.<span class="hljs-property">href</span> : <span class="hljs-literal">null</span>;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  }
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Answer</span>(<span class="hljs-params">{ text }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Markdown</span>
      <span class="hljs-attr">skipHtml</span>
      <span class="hljs-attr">components</span>=<span class="hljs-string">{{</span>
        <span class="hljs-attr">a:</span> ({ <span class="hljs-attr">href</span>, <span class="hljs-attr">children</span> }) =&gt;</span> {
          const url = safeHref(href);
          return url
            ? <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">{url}</span> <span class="hljs-attr">target</span>=<span class="hljs-string">&quot;_blank&quot;</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;noopener noreferrer&quot;</span>&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
            : <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>;
        },
        img: ({ alt }) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>{alt || &#x27;图片未加载&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>,
      }}
    &gt;
      {text}
    <span class="hljs-tag">&lt;/<span class="hljs-name">Markdown</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>相对链接的基地址必须是应用明确选择的可信地址，不能使用模型提供的任意 base。允许 HTTP/HTTPS 只说明协议安全边界，不能证明目标站点没有钓鱼风险；可以显示域名、限制来源或在外链前提示用户。</p>
<p>不要用自定义 <code>urlTransform</code> 把所有 URL 原样放行，也不要把未知输入属性全部 spread 到危险元素上。库默认安全行为会被插件和自定义组件改变，必须审查最终 DOM。</p>
<h2>需要 HTML 时必须净化完整插件链</h2>
<p>如果产品确实需要有限 HTML，应先定义允许的标签、属性和 URL 协议，再使用维护的净化工具处理最终进入 DOM 的结构。启用 <code>rehype-raw</code>、SVG、公式、iframe 或图表能力后，安全边界都会变化；不能继续沿用纯 Markdown 的判断。</p>
<p>净化之后如果还有插件会重新插入 HTML、属性或 URL，漏洞可能被重新打开。安全检查要覆盖解析、净化、插件和自定义渲染的整个顺序。CSS、SVG、iframe 和外部资源各自都有新的能力和攻击面，不应为一个样式需求开放完整原始 HTML。</p>
<p>MDX 包含 JSX 和表达式，不能直接把模型输出当成可信 MDX 编译。Mermaid、代码沙盒和公式渲染也需要单独评估内容大小、网络权限和执行隔离。用户主动运行代码时，应使用受限环境、明确确认和资源上限，iframe 也不天然安全。</p>
<p>外部图片即使不执行脚本，也可能泄露访问时机、IP 或引用信息。可以要求用户确认、使用来源白名单或受控代理，并限制尺寸和数量。</p>
<h2>流式输出要保守处理半成品</h2>
<p>模型可能先输出半个链接、未闭合代码围栏或表格。每个 token 都完整解析会重复计算、造成布局跳动，并可能把半成品送进 DOM。可以按合理频率批量更新，对未完成块使用纯文本或保守展示，结束后再进行完整渲染。</p>
<p>不要为了让半截 HTML 看起来正常，临时关闭过滤或把未经净化的字符串插进 DOM。还要限制总输出、代码块数量、嵌套深度和插件处理时间，避免巨大文本拖垮页面。</p>
<p>安全 Markdown 只保护浏览器展示边界，不能替代服务端工具授权、数据权限、提示词注入防御和日志脱敏。模型输出最终仍要按不可信内容处理。</p>`};export{e as default};