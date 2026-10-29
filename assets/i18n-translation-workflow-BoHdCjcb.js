var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件里不要直接写“保存资料”，而是写一个消息键，比如 <code>profile.save</code>，再由翻译目录给出各语言的文字。键表达的是用途，以后改了中文原文，其他语言也不会失去对应关系。</p>
<p>带变量和复数的句子，交给 ICU MessageFormat 这类消息格式处理，不要用字符串拼接，因为各语言的词序和复数规则都不一样。</p>
<p>找不到翻译时怎么办，要统一定义回退链，例如 <code>zh-Hant-TW</code> → <code>zh-Hant</code> → <code>zh</code> → 默认语言。缺失的键在开发和 CI 中直接报错，生产环境回退，但不能显示空字符串。CI 还要检查每种语言的键是否齐全、占位符是否一致、消息语法能否解析。</p>
<p>最后要注意切换语言。语言包是异步加载的，旧请求晚到时不能覆盖用户的新选择；切换后还要同步更新 <code>&lt;html lang&gt;</code> 和 <code>dir</code>。</p>
</blockquote>
<h2>消息目录长什么样</h2>
<p>每种语言一个文件，键相同，值是各自的翻译。</p>
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
<p>同一个 <code>search.resultCount</code>，中文只写了 <code>other</code>，英文写了 <code>one</code> 和 <code>other</code>。这是因为中文只有一个复数类别，每种语言的翻译者按自己语言的规则填分支就行。英文还把“found”挪到了句尾，这种词序调整只有整句交给翻译时才做得到。复数和消息格式的细节见<a href="/questions/i18n-icu-message/">《ICU MessageFormat 为什么适合复杂国际化文案？》</a>和<a href="/questions/i18n-plural-rules/">《Intl.PluralRules 怎样帮助实现国际化复数？》</a>。</p>
<p>反过来看，下面这种写法把词序、空格和复数全写死了，换任何一种语言都得改代码：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 不要这样做：词序、空格和复数都写死了</span>
<span class="hljs-string">\`<span class="hljs-subst">\${userName}</span> 有 <span class="hljs-subst">\${count}</span> 条消息\`</span>;
</code></pre></div>
<h2>找不到翻译时怎么回退</h2>
<p>下面沿着回退链逐个查，查到就返回。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lookup</span>(<span class="hljs-params">key, chain, catalogs</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> locale <span class="hljs-keyword">of</span> chain) {
    <span class="hljs-keyword">const</span> message = catalogs[locale]?.[key];
    <span class="hljs-keyword">if</span> (message !== <span class="hljs-literal">undefined</span>) <span class="hljs-keyword">return</span> message;
  }
  <span class="hljs-title function_">reportMissing</span>(key, chain[<span class="hljs-number">0</span>]); <span class="hljs-comment">// 开发环境直接抛错，生产环境上报</span>
  <span class="hljs-keyword">return</span> catalogs.<span class="hljs-property">en</span>[key] ?? key;
}
</code></pre></div>
<p>全都查不到时，先上报缺失，再用默认语言兜底，最后连默认语言都没有就显示键本身。这样页面上至少不会出现空白。</p>
<p>还有一点，键名不要包含用户输入，也不要动态拼接路径。否则工具没法静态找出哪些键在用，下面的 CI 检查也就失效了。</p>
<h2>CI 里检查什么</h2>
<p>CI 一般做三件事。第一，以默认语言为基准，列出其他语言缺了哪些键、多了哪些键。第二，比对占位符，英文里有 <code>{count}</code>，德文翻译里也必须有。第三，用消息格式库把每条消息解析一遍，语法错误直接让构建失败。</p>
<p>翻译者可以调整句子顺序，但不能删掉业务需要的变量，第二项检查就是为此准备的。</p>
<h2>切换语言时的竞态</h2>
<p>用户连续点两种语言时，先发出的请求可能后返回，把新选择覆盖掉。下面用一个版本号来防止这种情况。</p>
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
<p>每次切换都把版本号加一。请求回来时，如果版本号已经不是最新的，说明用户又切走了，这次结果直接丢掉。生效时顺便更新 <code>lang</code> 和 <code>dir</code>。</p>
<p>SSR 或静态生成时，服务端和客户端要用同一个初始语言和同一份目录，否则水合时文字对不上。另外，语言包会下发到客户端，里面不要放内部备注或密钥。</p>
<p>日期、数字、货币和列表不属于翻译，用 <code>Intl</code> 来格式化，见<a href="/questions/intl-format/">《为什么日期、金额和排序不应该手动拼接格式？》</a>。</p>
<h2>常见追问</h2>
<p><strong>翻译里需要加粗或链接怎么办？</strong></p>
<blockquote>
<p>用消息库提供的富文本标签，比如把 <code>&lt;b&gt;{name}&lt;/b&gt;</code> 映射成组件。不要把翻译当 HTML 直接插进页面。</p>
</blockquote>
<p><strong>怎样提前发现布局问题？</strong></p>
<blockquote>
<p>用伪本地化和多语言测试矩阵，在拿到真实翻译之前就能看到溢出和写死的文字，见<a href="/questions/i18n-locale-testing/">《国际化页面怎样做跨地区测试，避免上线后才发现布局和时间错误？》</a>。</p>
</blockquote>`};export{e as default};