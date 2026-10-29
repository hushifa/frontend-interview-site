var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>zh-Hant-TW</code> 这样的字符串叫语言标签，意思是“中文、繁体字、台湾”。它由几段子标签拼成，<code>Intl.Locale</code> 负责把它拆开，变成 <code>language</code>、<code>script</code>、<code>region</code> 这些属性，还会顺手修正大小写和弃用的写法。</p>
<p>建模时要记住，语言、地区和时区是三件事。一个在日本的英语用户，可能要英文界面、日元和东京时区，所以不要用一个字段去推另外两个。</p>
<p>它还有两个常用方法。<code>maximize()</code> 按数据补全子标签，<code>zh</code> 会变成 <code>zh-Hans-CN</code>；<code>minimize()</code> 反过来去掉能推断的部分。两者都只是补全和精简，不是翻译。选哪份翻译资源要自己写回退链，例如 <code>zh-Hant-HK</code> → <code>zh-Hant</code> → <code>zh</code> → 默认语言。</p>
<p>书写方向可以用 <code>getTextInfo().direction</code> 检测，但 Node 22 只有旧的 <code>textInfo</code> 属性，所以两种都要做能力检测。</p>
</blockquote>
<h2>怎样解析和规范化</h2>
<p>下面把一个标签拆开，再看补全、精简和规范化的效果。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locale = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;zh-Hant-TW&#x27;</span>);
locale.<span class="hljs-property">language</span>; <span class="hljs-comment">// &#x27;zh&#x27;</span>
locale.<span class="hljs-property">script</span>; <span class="hljs-comment">// &#x27;Hant&#x27;</span>
locale.<span class="hljs-property">region</span>; <span class="hljs-comment">// &#x27;TW&#x27;</span>
locale.<span class="hljs-property">baseName</span>; <span class="hljs-comment">// &#x27;zh-Hant-TW&#x27;</span>

<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;zh&#x27;</span>).<span class="hljs-title function_">maximize</span>().<span class="hljs-title function_">toString</span>(); <span class="hljs-comment">// &#x27;zh-Hans-CN&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;zh-Hans-CN&#x27;</span>).<span class="hljs-title function_">minimize</span>().<span class="hljs-title function_">toString</span>(); <span class="hljs-comment">// &#x27;zh&#x27;</span>
<span class="hljs-title class_">Intl</span>.<span class="hljs-title function_">getCanonicalLocales</span>([<span class="hljs-string">&#x27;EN-us&#x27;</span>, <span class="hljs-string">&#x27;zh-cn&#x27;</span>, <span class="hljs-string">&#x27;iw&#x27;</span>]); <span class="hljs-comment">// [&#x27;en-US&#x27;, &#x27;zh-CN&#x27;, &#x27;he&#x27;]</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;not a tag&#x27;</span>); <span class="hljs-comment">// RangeError</span>
</code></pre></div>
<p><code>maximize()</code> 凭什么知道 <code>zh</code> 就是简体、中国？它查的是 likely-subtags 数据，也就是“只说了语言时，最可能是哪种文字和地区”的统计表。所以它只是猜最常见的情况，不代表用户真的在中国。</p>
<p><code>getCanonicalLocales</code> 叫规范化，它会把大小写改对，还会把弃用的代码换掉，比如希伯来语的旧代码 <code>iw</code> 变成 <code>he</code>。保存用户偏好时，存规范化以后的结果，之后比较起来才不会出错。</p>
<h2>地区子标签不等于用户在哪</h2>
<p><code>en-JP</code> 里的 <code>JP</code> 只说明这是一种语言变体，不代表用户在日本，也不决定货币和时区。</p>
<p>所以在日本的英语用户，可能要英文界面、日元和东京时区。这三项要分别保存，不要从语言标签里推出货币，也不要推出时区。</p>
<h2>Unicode 扩展是做什么的</h2>
<p>标签后面还能挂上 <code>-u-</code> 开头的扩展，用来指定日历、数字系统这类偏好。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> thai = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;th-TH&#x27;</span>, { <span class="hljs-attr">calendar</span>: <span class="hljs-string">&#x27;buddhist&#x27;</span>, <span class="hljs-attr">numberingSystem</span>: <span class="hljs-string">&#x27;thai&#x27;</span> });
thai.<span class="hljs-title function_">toString</span>(); <span class="hljs-comment">// &#x27;th-TH-u-ca-buddhist-nu-thai&#x27;</span>
</code></pre></div>
<p><code>ca</code> 表示日历，<code>nu</code> 表示数字系统，<code>hc</code> 表示时制。这些键是规范定义好的，不能自己随便加。把这样的 locale 传给 <code>Intl.DateTimeFormat</code>，就会用佛历和泰文数字来显示日期。</p>
<h2>怎样选翻译资源</h2>
<p><code>Intl.Locale</code> 只负责解析，不知道你手里有哪几份翻译。下面这个函数自己实现了回退链。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">pickLocale</span>(<span class="hljs-params">requested, available, fallback = <span class="hljs-string">&#x27;en&#x27;</span></span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> tag <span class="hljs-keyword">of</span> requested) {
    <span class="hljs-keyword">const</span> current = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(tag).<span class="hljs-title function_">maximize</span>();
    <span class="hljs-keyword">const</span> candidates = [current.<span class="hljs-property">baseName</span>, <span class="hljs-string">\`<span class="hljs-subst">\${current.language}</span>-<span class="hljs-subst">\${current.script}</span>\`</span>, current.<span class="hljs-property">language</span>];
    <span class="hljs-keyword">const</span> hit = candidates.<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">c</span>) =&gt;</span> available.<span class="hljs-title function_">includes</span>(c));
    <span class="hljs-keyword">if</span> (hit) <span class="hljs-keyword">return</span> hit;
  }
  <span class="hljs-keyword">return</span> fallback;
}

<span class="hljs-title function_">pickLocale</span>([<span class="hljs-string">&#x27;zh-HK&#x27;</span>], [<span class="hljs-string">&#x27;zh-Hant&#x27;</span>, <span class="hljs-string">&#x27;zh-Hans&#x27;</span>, <span class="hljs-string">&#x27;en&#x27;</span>]); <span class="hljs-comment">// &#x27;zh-Hant&#x27;</span>
</code></pre></div>
<p>用户要的是 <code>zh-HK</code>，资源里却没有这一份。如果只按语言 <code>zh</code> 去匹配，很可能落到简体上，香港用户会看到简体字。</p>
<p>先 <code>maximize()</code> 一下就不同了。<code>zh-HK</code> 补全成 <code>zh-Hant-HK</code>，候选依次是 <code>zh-Hant-HK</code>、<code>zh-Hant</code>、<code>zh</code>，于是先匹配到繁体资源。</p>
<p>有人会想用 <code>Intl.DateTimeFormat.supportedLocalesOf()</code> 来做这件事。可它只能告诉你运行时支持哪些格式化语言，并不知道你有哪些翻译文件。</p>
<h2>怎样检测书写方向</h2>
<p>新标准用的是 <code>getTextInfo()</code> 方法，旧版本是 <code>textInfo</code> 访问器，所以要两种都检测。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getDirection</span>(<span class="hljs-params">tag</span>) {
  <span class="hljs-keyword">const</span> locale = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(tag);
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> locale.<span class="hljs-property">getTextInfo</span> === <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">return</span> locale.<span class="hljs-title function_">getTextInfo</span>().<span class="hljs-property">direction</span>;
  <span class="hljs-keyword">if</span> (locale.<span class="hljs-property">textInfo</span>) <span class="hljs-keyword">return</span> locale.<span class="hljs-property">textInfo</span>.<span class="hljs-property">direction</span>; <span class="hljs-comment">// 旧版访问器</span>
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>; <span class="hljs-comment">// 不支持时由应用的语言配置决定</span>
}

<span class="hljs-title function_">getDirection</span>(<span class="hljs-string">&#x27;ar&#x27;</span>); <span class="hljs-comment">// &#x27;rtl&#x27;</span>
</code></pre></div>
<p>两种都不支持时返回 <code>null</code>，这时由应用自己的语言配置决定方向。</p>
<h2>常见追问</h2>
<p><strong><code>navigator.language</code> 能直接当界面语言吗？</strong></p>
<blockquote>
<p>可以当默认值，但要允许用户手动切换，并把选择保存下来。<code>navigator.languages</code> 还提供了按偏好排好序的完整列表，可以拿来做回退。</p>
</blockquote>
<p><strong>SSR 时怎样决定语言？</strong></p>
<blockquote>
<p>先看用户保存的设置，其次看 URL 或 <code>Accept-Language</code> 请求头。服务端选定以后，把结果传给客户端，不要两端各自判断，否则可能选出不同的语言。</p>
</blockquote>`};export{e as default};