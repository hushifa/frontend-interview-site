var e={answerHtml:`<h2>简答</h2>
<ul>
<li>构造时指定显示语言和 <code>type</code>（<code>language</code>、<code>region</code>、<code>script</code>、<code>currency</code>、<code>calendar</code>、<code>dateTimeField</code>），<code>of(code)</code> 返回名称。</li>
<li>名称来自浏览器或 Node.js 自带的 CLDR 数据，不同版本可能不同。界面显示名称，存储和接口传递代码。</li>
<li>默认 <code>fallback: &#x27;code&#x27;</code>：认不出的代码原样返回代码，格式正确的未知语言标签会返回类似 <code>xx (UNKNOWN)</code> 的结果；设成 <code>&#x27;none&#x27;</code> 时返回 <code>undefined</code>，由应用自己处理。</li>
<li>代码格式不合法（例如地区写成 <code>123x</code>）会抛 <code>RangeError</code>。</li>
<li>同样配置的实例要缓存复用；SSR 时服务端和客户端要用同一个 locale，避免水合不一致。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> region = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> });
<span class="hljs-keyword">const</span> language = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> });
<span class="hljs-keyword">const</span> currency = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;currency&#x27;</span> });

region.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;TW&#x27;</span>); <span class="hljs-comment">// 台湾（Node 22 实测）</span>
language.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;fr&#x27;</span>); <span class="hljs-comment">// 法语</span>
language.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;zh-Hant&#x27;</span>); <span class="hljs-comment">// 繁体中文</span>
currency.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;EUR&#x27;</span>); <span class="hljs-comment">// 欧元</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;JP&#x27;</span>); <span class="hljs-comment">// Japan</span>
</code></pre></div>
<p>地区名称受 CLDR 数据影响。产品对某些名称有特定要求时，用自己的覆盖表优先于 <code>of()</code> 的结果。</p>
<p>代码格式本身不合法时，<code>of()</code> 直接抛错，例如 <code>new Intl.DisplayNames(&#x27;en&#x27;, { type: &#x27;region&#x27; }).of(&#x27;123x&#x27;)</code> 抛 <code>RangeError</code>。</p>
<p>创建实例要加载语言数据，同样的 locale 和 <code>type</code> 应缓存一个实例复用。SSR 时服务端和客户端必须用同一个 locale 创建，否则文字不同会造成水合不一致。</p>
<h2>fallback</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;XX&#x27;</span>); <span class="hljs-comment">// &#x27;XX&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span>, <span class="hljs-attr">fallback</span>: <span class="hljs-string">&#x27;none&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;XX&#x27;</span>); <span class="hljs-comment">// undefined</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;xx-unknown&#x27;</span>); <span class="hljs-comment">// &#x27;xx (UNKNOWN)&#x27;</span>
</code></pre></div>
<p><code>xx-unknown</code> 语法合法，运行时把它解析为&quot;语言 xx 加变体 unknown&quot;（<code>new Intl.Locale(&#x27;xx-unknown&#x27;).region</code> 是 <code>undefined</code>）并拼出名称，并不会走到返回代码那一步。需要判断&quot;是否真的认识这个代码&quot;时，用 <code>fallback: &#x27;none&#x27;</code> 再检查 <code>undefined</code>。</p>
<h2>语言名称的两种风格</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>); <span class="hljs-comment">// British English</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span>, <span class="hljs-attr">languageDisplay</span>: <span class="hljs-string">&#x27;standard&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>);
<span class="hljs-comment">// English (United Kingdom)</span>
</code></pre></div>
<p>语言切换菜单里，通常每个选项用它自己的语言显示（&quot;日本語&quot;&quot;English&quot;），这样不认识当前界面语言的用户也能找到自己的语言。</p>
<h2>生成选项列表</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createLanguageOptions</span>(<span class="hljs-params">codes, uiLocale</span>) {
  <span class="hljs-keyword">const</span> names = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(uiLocale, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span>, <span class="hljs-attr">fallback</span>: <span class="hljs-string">&#x27;none&#x27;</span> });
  <span class="hljs-keyword">return</span> codes
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">code</span>) =&gt;</span> ({ <span class="hljs-attr">value</span>: code, <span class="hljs-attr">label</span>: names.<span class="hljs-title function_">of</span>(code) ?? code }))
    .<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a.<span class="hljs-property">label</span>.<span class="hljs-title function_">localeCompare</span>(b.<span class="hljs-property">label</span>, uiLocale));
}
</code></pre></div>
<p><code>value</code> 是代码，<code>label</code> 只用于显示。</p>
<h2>常见追问</h2>
<ul>
<li><strong>能用显示名称反查代码吗？</strong> 不能。名称不唯一，也会随数据版本变化，选项值要始终保留代码。</li>
<li><strong>阿拉伯语名称怎么显示？</strong> <code>new Intl.DisplayNames(&#x27;ar&#x27;, { type: &#x27;language&#x27; }).of(&#x27;en&#x27;)</code> 返回阿拉伯文，嵌入其他语言的页面时要设置 <code>dir=&quot;auto&quot;</code> 或用 <code>&lt;bdi&gt;</code> 隔离方向。</li>
</ul>`};export{e as default};