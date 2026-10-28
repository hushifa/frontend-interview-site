var e={answerHtml:`<h2>简答</h2>
<ul>
<li>组件里写消息键（如 <code>profile.save</code>），不写中文原文。键表达用途，改动原文不会让其他语言失去对应关系。</li>
<li>变量和复数交给 ICU MessageFormat 等消息格式，不用字符串拼接，因为各语言的词序和复数规则不同。</li>
<li>统一定义回退链，例如 <code>zh-Hant-TW</code> → <code>zh-Hant</code> → <code>zh</code> → 默认语言。缺失的键在开发和 CI 中报错，生产环境回退但不显示空字符串。</li>
<li>CI 检查每种语言的键是否齐全、占位符是否一致、消息语法能否解析。</li>
<li>切换语言时异步加载语言包，旧请求晚到不能覆盖新选择；同时更新 <code>&lt;html lang&gt;</code> 和 <code>dir</code>。</li>
</ul>
<h2>消息目录</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// zh-CN.json
{
  &quot;profile.save&quot;: &quot;保存资料&quot;,
  &quot;search.resultCount&quot;: &quot;找到 {count, plural, other {# 条结果}}&quot;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// en.json
{
  &quot;profile.save&quot;: &quot;Save profile&quot;,
  &quot;search.resultCount&quot;: &quot;{count, plural, one {# result} other {# results}} found&quot;
}
</code></pre></div>
<p>中文只有一个复数类别，英文有 <code>one</code> 和 <code>other</code>，每种语言的翻译者按自己语言的规则填写分支。复数和消息格式的细节见<a href="/questions/i18n-icu-message/">《ICU MessageFormat 为什么适合复杂国际化文案？》</a>和<a href="/questions/i18n-plural-rules/">《Intl.PluralRules 怎样帮助实现国际化复数？》</a>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 不要这样做：词序、空格和复数都写死了</span>
<span class="hljs-string">\`<span class="hljs-subst">\${userName}</span> 有 <span class="hljs-subst">\${count}</span> 条消息\`</span>;
</code></pre></div>
<h2>回退和缺失</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lookup</span>(<span class="hljs-params">key, chain, catalogs</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> locale <span class="hljs-keyword">of</span> chain) {
    <span class="hljs-keyword">const</span> message = catalogs[locale]?.[key];
    <span class="hljs-keyword">if</span> (message !== <span class="hljs-literal">undefined</span>) <span class="hljs-keyword">return</span> message;
  }
  <span class="hljs-title function_">reportMissing</span>(key, chain[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 开发环境直接抛错，生产环境上报</span>
  <span class="hljs-keyword">return</span> catalogs.<span class="hljs-property">en</span>[key] ?? key;
}
</code></pre></div>
<p>键名不要包含用户输入或动态拼接的路径，否则无法静态检查哪些键在使用。</p>
<h2>CI 检查</h2>
<ul>
<li>以默认语言为基准，列出其他语言缺失和多余的键。</li>
<li>比对占位符：英文里有 <code>{count}</code>，德文翻译里也必须有。</li>
<li>用消息格式库解析每条消息，语法错误直接让构建失败。</li>
</ul>
<p>翻译者可以调整句子顺序，但不能删掉业务需要的变量。</p>
<h2>异步加载语言包</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> loadVersion = <span class="hljs-number">0</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">switchLocale</span>(<span class="hljs-params">locale</span>) {
  <span class="hljs-keyword">const</span> version = ++loadVersion;
  <span class="hljs-keyword">const</span> catalog = <span class="hljs-keyword">await</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">\`./locales/<span class="hljs-subst">\${locale}</span>.json\`</span>);
  <span class="hljs-keyword">if</span> (version !== loadVersion) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 用户已经切到别的语言</span>
  <span class="hljs-title function_">applyCatalog</span>(locale, catalog.<span class="hljs-property">default</span>);
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">documentElement</span>.<span class="hljs-property">lang</span> = locale;
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">documentElement</span>.<span class="hljs-property">dir</span> = <span class="hljs-title function_">getDirection</span>(locale);
}
</code></pre></div>
<p>SSR 或静态生成时，服务端和客户端要使用同一个初始语言和同一份目录，否则水合时文本不一致。语言包会进入客户端，不要放内部备注或密钥。</p>
<p>日期、数字、货币和列表用 <code>Intl</code> 格式化，见<a href="/questions/intl-format/">《为什么日期、金额和排序不应该手动拼接格式？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li><strong>翻译里需要加粗或链接怎么办？</strong> 用消息库提供的富文本标签（如 <code>&lt;b&gt;{name}&lt;/b&gt;</code> 映射到组件），不要把翻译当 HTML 直接插入。</li>
<li><strong>怎样提前发现布局问题？</strong> 用伪本地化和多语言测试矩阵，见<a href="/questions/i18n-locale-testing/">《国际化页面怎样做跨地区测试，避免上线后才发现布局和时间错误？》</a>。</li>
</ul>`};export{e as default};