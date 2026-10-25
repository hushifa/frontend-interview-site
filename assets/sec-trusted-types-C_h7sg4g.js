var e={answerHtml:`<p>不会。Trusted Types 负责限制“什么类型的数据可以进入某些危险 DOM 接口”，真正删除危险标签、属性或 URL 的工作，仍由应用选择的净化逻辑完成。</p>
<p>可以把它理解为在入口加一道检查：普通字符串不能随手交给 innerHTML，必须先经过指定策略，得到 TrustedHTML。但策略如果只是给任意字符串盖章，入口检查就失去了安全意义。</p>
<h3>仅仅创建策略，并不会拦住其他代码</h3>
<p>在支持 Trusted Types 的浏览器中，可以创建策略，把处理字符串的逻辑集中起来。要强制受保护的注入入口拒绝普通字符串，还需要 CSP：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: require-trusted-types-for &#x27;script&#x27;; trusted-types article-html dompurify
</code></pre></div>
<p>两个指令分工不同：<code>require-trusted-types-for &#x27;script&#x27;</code> 要求相关注入入口接受相应的可信类型；<code>trusted-types article-html dompurify</code> 限制允许创建的策略名称。这里同时允许文章策略，以及下文 DOMPurify 默认使用的内部策略 dompurify。</p>
<p>这里的 <code>&#x27;script&#x27;</code> 不表示只保护 script 标签。innerHTML 等可能导致脚本注入的 HTML 入口也属于其保护范围。在强制策略生效、且没有 default 策略接管转换时，把普通字符串赋给这些入口会抛出 TypeError。</p>
<h3>策略里面仍需真正净化 HTML</h3>
<p>下面是使用 DOMPurify 的接入示例，假设已经安装该依赖，并在浏览器模块中执行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> <span class="hljs-title class_">DOMPurify</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;dompurify&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">sanitizeArticle</span>(<span class="hljs-params">input</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">DOMPurify</span>.<span class="hljs-title function_">sanitize</span>(input, {
    <span class="hljs-attr">ALLOWED_TAGS</span>: [<span class="hljs-string">&#x27;p&#x27;</span>, <span class="hljs-string">&#x27;strong&#x27;</span>, <span class="hljs-string">&#x27;em&#x27;</span>, <span class="hljs-string">&#x27;ul&#x27;</span>, <span class="hljs-string">&#x27;li&#x27;</span>, <span class="hljs-string">&#x27;br&#x27;</span>],
    <span class="hljs-attr">ALLOWED_ATTR</span>: [],
    <span class="hljs-attr">RETURN_TRUSTED_TYPE</span>: <span class="hljs-literal">false</span>,
  });
}

<span class="hljs-keyword">const</span> articlePolicy = <span class="hljs-variable language_">window</span>.<span class="hljs-property">trustedTypes</span>
  ? <span class="hljs-variable language_">window</span>.<span class="hljs-property">trustedTypes</span>.<span class="hljs-title function_">createPolicy</span>(<span class="hljs-string">&#x27;article-html&#x27;</span>, {
      <span class="hljs-attr">createHTML</span>: sanitizeArticle,
    })
  : <span class="hljs-literal">null</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">renderArticle</span>(<span class="hljs-params">container, source</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> source !== <span class="hljs-string">&#x27;string&#x27;</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;文章内容必须是字符串&#x27;</span>);
  }

  container.<span class="hljs-property">innerHTML</span> = articlePolicy
    ? articlePolicy.<span class="hljs-title function_">createHTML</span>(source)
    : <span class="hljs-title function_">sanitizeArticle</span>(source);
}
</code></pre></div>
<p>这里按简单文章的需求只允许少量标签，不开放属性。DOMPurify 负责净化；策略把净化结果包装为 TrustedHTML。<code>RETURN_TRUSTED_TYPE: false</code> 是让净化库在 createHTML 回调里返回字符串，再由浏览器创建对应的可信对象，避免混淆两层职责。</p>
<p>不支持该 API 的浏览器仍会走净化函数，但没有原生 Trusted Types 的入口强制约束。不要把降级分支改成直接返回原始输入。净化库自身也需要维护和更新；示例为 DOMPurify 默认内部策略保留了名称许可，生产中还要按所用版本核对其 CSP 配置要求。</p>
<p>如果页面只需要显示纯文本，直接使用 textContent 更简单，不必为了使用 Trusted Types 而引入 HTML 解析。</p>
<h3>“可信类型”不等于内容自动可信</h3>
<p>下面这种策略虽然可以生成 TrustedHTML，却没有消除任何危险内容：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> unsafePolicy = trustedTypes.<span class="hljs-title function_">createPolicy</span>(<span class="hljs-string">&#x27;unsafe-example&#x27;</span>, {
  <span class="hljs-attr">createHTML</span>: <span class="hljs-function">(<span class="hljs-params">input</span>) =&gt;</span> input,
});
</code></pre></div>
<p>这是反例，不应加入生产策略白名单。Trusted Types 信任的是开发者提供的转换函数，并不会再次扫描函数返回的字符串是否安全。</p>
<p>同样，TrustedHTML 解决的是 HTML 注入入口的类型要求，不能当成任意上下文的安全通行证。脚本内容、脚本 URL 有各自的类型和规则，服务端渲染的原始 HTML、业务授权等也不因启用该 API 自动得到保护。</p>
<h3>迁移现有项目时要处理真实调用链</h3>
<p>可以先通过 Report-Only 观察违规位置，区分自己的 DOM 操作和第三方组件调用，再逐步迁移到明确的策略或安全 DOM API。对净化后的内容还要避免再次进行不安全的字符串拼接，否则可能绕过原来限定的结构。</p>
<p>名为 default 的策略可以自动接管一些传入字符串的调用，方便过渡，但不能用“原样返回”的 default 策略消除报错。那只是让违规代码继续运行，没有实现预期防护。</p>
<p>最终应同时验证允许的富文本能正常显示、危险输入被净化、绕过策略的写入被阻止，以及目标浏览器的实际兼容性。示例展示的是接入方式，不意味着项目已经安装净化库或启用了这些响应头。</p>`};export{e as default};