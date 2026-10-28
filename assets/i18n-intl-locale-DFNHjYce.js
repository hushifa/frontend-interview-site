var e={answerHtml:`<h2>简答</h2>
<ul>
<li>语言标签由语言、文字、地区等子标签组成，例如 <code>zh-Hant-TW</code> 是&quot;中文、繁体字、台湾&quot;。<code>Intl.Locale</code> 把它解析成 <code>language</code>、<code>script</code>、<code>region</code> 等属性。</li>
<li>语言、地区和时区是三件事：在日本的英语用户可能要英文界面、日元、东京时区，不要用一个字段推断另外两个。</li>
<li><code>maximize()</code> 按 likely-subtags 数据补全（<code>zh</code> → <code>zh-Hans-CN</code>），<code>minimize()</code> 去掉可推断的部分，两者都不是翻译。</li>
<li>选择翻译资源要自己写回退链，例如 <code>zh-Hant-HK</code> → <code>zh-Hant</code> → <code>zh</code> → 默认语言，<code>Intl.Locale</code> 只负责解析。</li>
<li>书写方向用 <code>getTextInfo().direction</code> 检测，Node 22 只有旧的 <code>textInfo</code> 属性，两者都要做能力检测。</li>
</ul>
<h2>解析与规范化</h2>
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
<p>规范化会修正大小写，也会把弃用的代码替换掉（<code>iw</code> → <code>he</code>）。存储用户偏好时保存规范化后的结果。</p>
<h2>Unicode 扩展</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> thai = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(<span class="hljs-string">&#x27;th-TH&#x27;</span>, { <span class="hljs-attr">calendar</span>: <span class="hljs-string">&#x27;buddhist&#x27;</span>, <span class="hljs-attr">numberingSystem</span>: <span class="hljs-string">&#x27;thai&#x27;</span> });
thai.<span class="hljs-title function_">toString</span>(); <span class="hljs-comment">// &#x27;th-TH-u-ca-buddhist-nu-thai&#x27;</span>
</code></pre></div>
<p>扩展键（<code>ca</code> 日历、<code>nu</code> 数字系统、<code>hc</code> 时制等）由规范定义，不能随意添加。把这样的 locale 传给 <code>Intl.DateTimeFormat</code>，就会使用对应的日历和数字。</p>
<h2>资源回退</h2>
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
<p><code>zh-HK</code> 补全后是 <code>zh-Hant-HK</code>，于是先匹配到繁体资源，而不是只按语言 <code>zh</code> 匹配到简体。<code>Intl.DateTimeFormat.supportedLocalesOf()</code> 只能告诉你运行时支持哪些格式化语言，不知道你有哪些翻译文件。</p>
<h2>书写方向</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">getDirection</span>(<span class="hljs-params">tag</span>) {
  <span class="hljs-keyword">const</span> locale = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Locale</span>(tag);
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> locale.<span class="hljs-property">getTextInfo</span> === <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">return</span> locale.<span class="hljs-title function_">getTextInfo</span>().<span class="hljs-property">direction</span>;
  <span class="hljs-keyword">if</span> (locale.<span class="hljs-property">textInfo</span>) <span class="hljs-keyword">return</span> locale.<span class="hljs-property">textInfo</span>.<span class="hljs-property">direction</span>; <span class="hljs-comment">// 旧版访问器</span>
  <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>; <span class="hljs-comment">// 不支持时由应用的语言配置决定</span>
}

<span class="hljs-title function_">getDirection</span>(<span class="hljs-string">&#x27;ar&#x27;</span>); <span class="hljs-comment">// &#x27;rtl&#x27;</span>
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li><strong><code>navigator.language</code> 能直接当界面语言吗？</strong> 可以作为默认值，但要允许用户手动切换并保存选择。<code>navigator.languages</code> 提供按偏好排序的完整列表。</li>
<li><strong>SSR 时怎样决定语言？</strong> 优先读取用户保存的设置，其次是 URL 或 <code>Accept-Language</code>，服务端选定后把结果传给客户端，避免两端各自判断。</li>
</ul>`};export{e as default};