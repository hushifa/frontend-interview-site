var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>模型的输出要当成用户输入来对待。它可能复述网页里的恶意内容，也可能在提示词注入下生成钓鱼链接或 HTML。</p>
<p>所以默认关闭原始 HTML，链接只允许 <code>http:</code> 和 <code>https:</code>，外部图片默认不加载。图片看起来无害，可是图片地址里可以带上对话内容，浏览器一加载，数据就发到攻击者的服务器上了。</p>
<p>确实需要 HTML 时，用维护中的净化库处理最终要进入页面的结构，净化之后的插件不能再插入没净化过的内容。</p>
<p>代码块只展示不执行。MDX、Mermaid、代码沙盒这些能力，要单独评估它们需要什么权限。</p>
</blockquote>
<h2>一个受限的渲染组件</h2>
<p>下面用 react-markdown 渲染模型输出。注意看两处：<code>a</code> 链接经过了 <code>safeHref</code> 检查，<code>img</code> 被换成了一段文字。</p>
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
<p>react-markdown 本来就不渲染原始 HTML，也会过滤 <code>javascript:</code> 这类危险协议。那为什么还要自己写 <code>safeHref</code>？因为这些默认行为很容易被改掉。自定义了 <code>urlTransform</code>，或者启用了 <code>rehype-raw</code>，默认的保护就变了。自己在组件里再检查一遍，规则写在明处，不怕后来有人改配置。</p>
<p>还要知道，只允许 <code>http</code> 和 <code>https</code>，只是排除了危险协议，不代表链接本身可信，钓鱼网站也是 https。可以在链接旁边显示域名，或者跳转前提示一下。</p>
<p>图片被换成了文字，是因为前面说的数据外带问题。如果确实要显示图片，可以改成“点击加载”，或者只允许经过自己代理的、在白名单里的域名。</p>
<h2>确实需要 HTML 怎么办</h2>
<p>先列清楚允许哪些标签、哪些属性、哪些 URL 协议，再用 rehype-sanitize、DOMPurify 这类维护中的工具做净化。</p>
<p>顺序很关键。Markdown 渲染一般要经过好几个插件，如果净化之后，后面的插件又加了 HTML 或者属性，前面的净化就白做了。所以净化要放在最后，处理的是最终进入页面的东西。</p>
<p>SVG、iframe、内联样式各有各的攻击方式。不要为了一个样式需求，就把整个 HTML 都放开。</p>
<h2>流式输出时怎么渲染</h2>
<p>模型是一点点输出的，中间会出现半个链接、没闭合的代码块、只有一半的表格。每来一个 token 就重新解析一遍，页面会不停跳动，也有大量重复计算。可以按动画帧把更新合并起来。</p>
<p>没闭合的块，先按纯文本显示，等它结束了再完整渲染。另外要限制总长度、代码块数量和嵌套深度，防止一段超长输出把页面拖垮。</p>
<h2>常见追问</h2>
<p><strong>在提示词里要求“不要输出 HTML”不就够了吗？</strong></p>
<blockquote>
<p>不够。提示词只是让模型尽量遵守，攻击者可以通过注入让它改主意。真正的边界是浏览器端渲染时的限制，那是模型改变不了的。</p>
</blockquote>
<p><strong>用户想运行模型生成的代码怎么办？</strong></p>
<blockquote>
<p>放进隔离的沙盒里运行，比如跨源的 iframe 或者 Worker，限制它能访问的网络和资源，并且要等用户明确点击以后才运行。</p>
</blockquote>`};export{e as default};