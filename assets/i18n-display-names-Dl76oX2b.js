var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面上要显示“法语”“日本”“欧元”，而数据里存的是 <code>fr</code>、<code>JP</code>、<code>EUR</code> 这样的代码。<code>Intl.DisplayNames</code> 就是干这个的：构造时给出显示语言和 <code>type</code>，再调用 <code>of(code)</code> 拿到名称。<code>type</code> 可以是 <code>language</code>、<code>region</code>、<code>script</code>、<code>currency</code>、<code>calendar</code>、<code>dateTimeField</code>。</p>
<p>这些名称不用自己维护翻译表，因为浏览器和 Node.js 自带了 CLDR 数据。可是数据版本不同，名称也可能不同，所以名称只拿来显示，存储和接口里传的始终是代码。</p>
<p>认不出的代码怎么办，要提前想好。默认 <code>fallback: &#x27;code&#x27;</code>，会原样返回代码；设成 <code>&#x27;none&#x27;</code> 就返回 <code>undefined</code>，交给应用自己处理。代码格式本身不合法，比如地区写成 <code>123x</code>，会直接抛 <code>RangeError</code>。</p>
<p>还有两点要注意。同样配置的实例要缓存复用；SSR 时服务端和客户端要用同一个 locale 创建，否则文字不一样，水合会对不上。</p>
</blockquote>
<h2>先看基本用法</h2>
<p>下面分别取地区、语言和货币的中文名称，最后一行换成英文显示。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> region = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> });
<span class="hljs-keyword">const</span> language = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> });
<span class="hljs-keyword">const</span> currency = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;currency&#x27;</span> });

region.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;TW&#x27;</span>); <span class="hljs-comment">// 台湾（Node 22 实测）</span>
language.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;fr&#x27;</span>); <span class="hljs-comment">// 法语</span>
language.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;zh-Hant&#x27;</span>); <span class="hljs-comment">// 繁体中文</span>
currency.<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;EUR&#x27;</span>); <span class="hljs-comment">// 欧元</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;JP&#x27;</span>); <span class="hljs-comment">// Japan</span>
</code></pre></div>
<p>同一个 <code>of()</code>，传什么代码就翻译什么，显示成哪种语言由构造时的第一个参数决定。</p>
<p>这些名称来自 CLDR，也就是 Unicode 维护的一套各国语言习惯数据。地区名称尤其容易受数据影响。产品对某些名称有特定要求时，准备一张自己的覆盖表，优先用表里的写法，查不到再用 <code>of()</code> 的结果。</p>
<p>代码格式本身不合法时，<code>of()</code> 会直接抛错。比如 <code>new Intl.DisplayNames(&#x27;en&#x27;, { type: &#x27;region&#x27; }).of(&#x27;123x&#x27;)</code> 抛的是 <code>RangeError</code>，调用处要有准备。</p>
<h2>认不出的代码会返回什么</h2>
<p>先看三种情况，结果可能和直觉不一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;XX&#x27;</span>); <span class="hljs-comment">// &#x27;XX&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;region&#x27;</span>, <span class="hljs-attr">fallback</span>: <span class="hljs-string">&#x27;none&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;XX&#x27;</span>); <span class="hljs-comment">// undefined</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;xx-unknown&#x27;</span>); <span class="hljs-comment">// &#x27;xx (UNKNOWN)&#x27;</span>
</code></pre></div>
<p><code>XX</code> 格式合法但没有对应地区。默认设置下它原样返回 <code>&#x27;XX&#x27;</code>，界面上不会报错，但用户看到的是一串代码。改成 <code>fallback: &#x27;none&#x27;</code> 后返回 <code>undefined</code>，应用就能自己决定显示什么。</p>
<p>第三行最容易让人误会。<code>xx-unknown</code> 的语法是合法的，运行时把它解析成“语言 xx 加上变体 unknown”（<code>new Intl.Locale(&#x27;xx-unknown&#x27;).region</code> 是 <code>undefined</code>），然后拼出了一个名称，所以根本没走到“返回代码”那一步。因此，想判断“是不是真的认识这个代码”，要用 <code>fallback: &#x27;none&#x27;</code>，再检查结果是不是 <code>undefined</code>。</p>
<h2>语言名称有两种风格</h2>
<p>同一个 <code>en-GB</code>，有两种说法。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>); <span class="hljs-comment">// British English</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span>, <span class="hljs-attr">languageDisplay</span>: <span class="hljs-string">&#x27;standard&#x27;</span> }).<span class="hljs-title function_">of</span>(<span class="hljs-string">&#x27;en-GB&#x27;</span>);
<span class="hljs-comment">// English (United Kingdom)</span>
</code></pre></div>
<p>默认是方言风格，直接说“British English”。<code>languageDisplay: &#x27;standard&#x27;</code> 改成“语言（地区）”的标准写法。</p>
<p>做语言切换菜单时，通常让每个选项用它自己的语言显示，例如“日本語”“English”。因为来切换语言的人，往往正是看不懂当前界面语言的人，他得能认出自己的语言。</p>
<h2>生成下拉选项</h2>
<p>下面把一组语言代码变成选项列表，并按当前界面语言排序。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createLanguageOptions</span>(<span class="hljs-params">codes, uiLocale</span>) {
  <span class="hljs-keyword">const</span> names = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">DisplayNames</span>(uiLocale, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;language&#x27;</span>, <span class="hljs-attr">fallback</span>: <span class="hljs-string">&#x27;none&#x27;</span> });
  <span class="hljs-keyword">return</span> codes
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">code</span>) =&gt;</span> ({ <span class="hljs-attr">value</span>: code, <span class="hljs-attr">label</span>: names.<span class="hljs-title function_">of</span>(code) ?? code }))
    .<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a.<span class="hljs-property">label</span>.<span class="hljs-title function_">localeCompare</span>(b.<span class="hljs-property">label</span>, uiLocale));
}
</code></pre></div>
<p><code>value</code> 存代码，<code>label</code> 只用于显示。用了 <code>fallback: &#x27;none&#x27;</code>，认不出的代码由 <code>?? code</code> 兜底，这一步是应用自己决定的。</p>
<h2>实例要缓存，SSR 要统一 locale</h2>
<p>创建实例要加载语言数据，所以同样的 locale 和 <code>type</code> 缓存一个实例反复用，不要每次渲染都新建。</p>
<p>SSR 时，服务端和客户端必须用同一个 locale 创建实例。否则服务端渲染出“法语”，客户端算出“French”，文字不同就会造成水合不一致。</p>
<h2>常见追问</h2>
<p><strong>能用显示名称反查代码吗？</strong></p>
<blockquote>
<p>不能。名称不唯一，还会随数据版本变化。所以选项的值要一直保留代码，名称只管显示。</p>
</blockquote>
<p><strong>阿拉伯语的名称怎么显示？</strong></p>
<blockquote>
<p><code>new Intl.DisplayNames(&#x27;ar&#x27;, { type: &#x27;language&#x27; }).of(&#x27;en&#x27;)</code> 返回的是阿拉伯文。把它嵌到其他语言的页面里时，要设置 <code>dir=&quot;auto&quot;</code> 或者用 <code>&lt;bdi&gt;</code> 把方向隔离开，否则会影响周围文字的排列。</p>
</blockquote>`};export{e as default};