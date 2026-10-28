var e={answerHtml:`<h2>简答</h2>
<ul>
<li>模型可能复述网页里的恶意内容，或在注入攻击下生成钓鱼链接和 HTML，所以它的输出按用户输入对待。</li>
<li>默认关闭原始 HTML，链接只允许 <code>http:</code> 和 <code>https:</code>，外部图片默认不加载。</li>
<li>外部图片也是风险：图片 URL 可以把对话里的数据带到攻击者服务器。</li>
<li>需要 HTML 时，用维护中的净化库处理最终进入 DOM 的结构；之后的插件不能再插入未净化的内容。</li>
<li>代码块只展示，不执行；MDX、Mermaid、代码沙盒等能力要单独评估权限。</li>
</ul>
<h2>受限渲染示例</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> <span class="hljs-title class_">Markdown</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-markdown&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">safeHref</span>(<span class="hljs-params">href</span>) {
  <span class="hljs-keyword">if</span> (!href) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-comment">// 基地址由应用指定，不使用模型提供的值</span>
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
          return url ? (
            <span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">{url}</span> <span class="hljs-attr">target</span>=<span class="hljs-string">&quot;_blank&quot;</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;noopener noreferrer&quot;</span>&gt;</span>
              {children}
            <span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
          ) : (
            <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
          );
        },
        img: ({ alt }) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>[图片：{alt || &#x27;未命名&#x27;}]<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>,
      }}
    &gt;
      {text}
    <span class="hljs-tag">&lt;/<span class="hljs-name">Markdown</span>&gt;</span></span>
  );
}
</code></pre></div>
<ul>
<li>react-markdown 默认不渲染原始 HTML，并会过滤 <code>javascript:</code> 等危险协议。自定义 <code>urlTransform</code> 或启用 <code>rehype-raw</code> 会改变这个默认行为。</li>
<li><code>http/https</code> 只排除了危险协议，不代表链接可信。可以在链接旁显示域名，或在跳转前提示。</li>
<li>图片可以改成&quot;点击加载&quot;，或只允许受控代理和白名单域名。</li>
</ul>
<h2>需要 HTML 时</h2>
<p>先列出允许的标签、属性和 URL 协议，再用 rehype-sanitize、DOMPurify 等维护中的工具净化。顺序很重要：净化之后的插件如果又添加了 HTML 或属性，前面的净化就失效了。SVG、iframe、内联样式各自有新的攻击面，不要为了一个样式需求放开全部 HTML。</p>
<h2>流式渲染</h2>
<ul>
<li>模型会先输出半个链接、未闭合的代码围栏或表格。每个 token 都重新解析会导致布局跳动和大量重复计算，可以按动画帧合并更新。</li>
<li>未闭合的块先按纯文本显示，结束后再完整渲染。</li>
<li>限制总长度、代码块数量和嵌套深度，防止超长输出拖垮页面。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>在提示词里要求&quot;不要输出 HTML&quot;不就够了吗？</strong> 不够。那只是让模型尽量遵守，攻击者可以通过注入改变它，浏览器端的限制才是边界。</li>
<li><strong>用户想运行模型生成的代码怎么办？</strong> 放进隔离的沙盒（跨源 iframe 或 Worker），限制网络和资源，并在用户明确点击后才运行。</li>
</ul>`};export{e as default};