var e={answerHtml:`<p>模型输出应按不可信文本处理。它可能引用网页中的攻击内容，也可能生成看起来合理但危险的链接、HTML 或代码。提示模型“不要输出危险内容”可以表达偏好，不能成为浏览器执行权限的防线。</p>
<p>安全渲染的第一条边界是：展示文字与执行内容分开。代码块里出现 JavaScript，只表示要显示代码，不代表用户已经允许执行。</p>
<h3>从受限 Markdown 开始，而不是默认开放 HTML</h3>
<p>react-markdown 默认提供相应的安全行为，但插件、自定义组件和 URL 转换可以改变边界。不要把模型文本先转换成未经净化的 HTML，再直接交给 dangerouslySetInnerHTML。</p>
<p>下面示例明确忽略原始 HTML，只允许 HTTP/HTTPS 链接，并把图片显示为替代文字，避免自动向第三方图片地址发请求：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> <span class="hljs-title class_">Markdown</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-markdown&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">safeHref</span>(<span class="hljs-params">href</span>) {
  <span class="hljs-keyword">if</span> (!href) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(href, <span class="hljs-string">&#x27;https://app.example.com/&#x27;</span>);
    <span class="hljs-keyword">return</span> [<span class="hljs-string">&#x27;https:&#x27;</span>, <span class="hljs-string">&#x27;http:&#x27;</span>].<span class="hljs-title function_">includes</span>(url.<span class="hljs-property">protocol</span>) ? url.<span class="hljs-property">href</span> : <span class="hljs-literal">null</span>;
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
        img: ({ alt }) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>{alt || &#x27;图片未自动加载&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>,
      }}
    &gt;
      {text}
    <span class="hljs-tag">&lt;/<span class="hljs-name">Markdown</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>相对链接的基地址需要换成应用明确选择的可信来源，而不是模型给出的任意 base。例子只限制协议，不证明 HTTP/HTTPS 目标站点可信；涉及钓鱼风险时还应显示域名、限制来源或提供外链提示。</p>
<p>保留库默认 URL 处理，不用“原样返回所有 URL”的 urlTransform 绕过它。自定义组件也不应该把所有输入属性不加区分地 spread 到危险元素上。</p>
<h3>需要原始 HTML 时，净化顺序很重要</h3>
<p>如果产品确实需要部分 HTML，应明确允许的标签、属性和 URL 协议，使用维护的净化工具处理最终可能进入 DOM 的结构。启用 rehype-raw 等解析步骤后，安全边界已经不同，不能沿用“默认安全”的结论。</p>
<p>净化之后再运行会插入危险标签或属性的插件，可能重新打开漏洞。应审查整个插件链与自定义渲染，而不是只确认依赖列表里出现了 sanitize。</p>
<p>CSS、SVG、iframe、公式和图表都有自己的能力与攻击面，允许某个标签不等于接受它的所有属性。不要为解决一个样式问题开放整个原始 HTML 集合。</p>
<h3>富内容解释器需要独立权限与资源限制</h3>
<p>MDX 可以包含 JSX 与表达式，不能把模型输出当作可信 MDX 直接编译运行。Mermaid、数学公式和代码沙盒也不是纯 Markdown 的同一层能力，需要核对库的安全配置、内容大小和执行隔离。</p>
<p>若用户主动要求运行代码，应采用明确的受限执行环境与确认流程。把代码放进 iframe 并不天然安全，来源、sandbox、网络权限和消息通道仍需设计。</p>
<p>外部图片即使不执行脚本，也可能泄露访问时机和网络信息。允许加载时，可采用用户确认、来源白名单或受控代理，并限制图片体积；不能把“没有 XSS”当作没有其他风险。</p>
<h3>流式半成品不能靠关闭过滤修复</h3>
<p>模型可能先输出半个链接、代码围栏或表格，后续才补齐。逐 token 完整解析还可能造成重复计算和布局跳动。</p>
<p>可以按合理频率批量更新，对未完成块使用保守展示，并在结束后完成渲染。不要为了让半截 HTML 看起来正常，临时允许未净化的内容进入 DOM。</p>
<p>还要限制总输出、代码块与插件处理成本，避免巨大文本或病态结构拖垮页面。安全渲染只保护展示边界，不能替代服务端工具授权、数据权限和提示词注入防御。</p>`};export{e as default};