var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Base64 编码的对象是字节，不是文字。<code>btoa</code> 接收的是一种“二进制字符串”，每个字符当成一个字节，所以每个字符的码点必须小于 256。直接 <code>btoa(&#x27;中文&#x27;)</code> 会抛出 <code>InvalidCharacterError</code>。</p>
<p>中文要分两步：先用 <code>new TextEncoder().encode(text)</code> 把文字转成 UTF-8 字节，再把字节编码成 Base64。解码时反过来，先得到字节，再用 <code>TextDecoder</code> 还原成文字。</p>
<p><code>Uint8Array.prototype.toBase64()</code> 和 <code>Uint8Array.fromBase64()</code> 就是为这件事准备的，它们直接在 <code>Uint8Array</code> 和 Base64 字符串之间转换，不用先拼一个二进制字符串。它们还能选 <code>base64url</code> 字母表、省略末尾的 <code>=</code>，解码时会忽略空白字符。</p>
<p>要注意兼容性。这两个方法 2025 年 9 月起才在主流浏览器的最新版本里都能用（Baseline 2025），老环境需要 polyfill 或者继续用 <code>TextEncoder</code> 加 <code>btoa</code> 的写法。</p>
</blockquote>
<h2>为什么 btoa 处理不了中文</h2>
<p>先看 <code>btoa</code> 遇到中文时的表现，以及 MDN 推荐的绕法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">btoa</span>(<span class="hljs-string">&#x27;abc&#x27;</span>)); <span class="hljs-comment">// YWJj</span>
<span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">btoa</span>(<span class="hljs-string">&#x27;中文&#x27;</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// InvalidCharacterError</span>
}
<span class="hljs-keyword">const</span> bytes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;中文&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bytes.<span class="hljs-property">length</span>); <span class="hljs-comment">// 6</span>
<span class="hljs-keyword">const</span> binary = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(bytes, <span class="hljs-function">(<span class="hljs-params">byte</span>) =&gt;</span> <span class="hljs-title class_">String</span>.<span class="hljs-title function_">fromCodePoint</span>(byte)).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
<span class="hljs-keyword">const</span> encoded = <span class="hljs-title function_">btoa</span>(binary);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(encoded); <span class="hljs-comment">// 5Lit5paH</span>
<span class="hljs-keyword">const</span> back = <span class="hljs-title class_">Uint8Array</span>.<span class="hljs-title function_">from</span>(<span class="hljs-title function_">atob</span>(encoded), <span class="hljs-function">(<span class="hljs-params">char</span>) =&gt;</span> char.<span class="hljs-title function_">codePointAt</span>(<span class="hljs-number">0</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>().<span class="hljs-title function_">decode</span>(back)); <span class="hljs-comment">// 中文</span>
</code></pre></div>
<p><code>abc</code> 每个字符的码点都小于 256，<code>btoa</code> 可以直接处理。可“中”的码点远大于 255，一个字符放不进一个字节，<code>btoa</code> 不知道该怎么拆，只能抛错。</p>
<p>所以先用 <code>TextEncoder</code> 把文字按 UTF-8 编成字节。两个汉字在 UTF-8 里各占 3 个字节，一共 6 个字节。再把每个字节变成一个码点 0 到 255 的字符，拼成二进制字符串交给 <code>btoa</code>，就能得到 <code>5Lit5paH</code>。</p>
<p>解码时 <code>atob</code> 返回的也是二进制字符串，要先把每个字符的码点取出来变回字节，再用 <code>TextDecoder</code> 按 UTF-8 解成文字。中间拼字符串、拆字符串的两步，就是 <code>btoa</code>/<code>atob</code> 用起来别扭的地方。</p>
<h2>Uint8Array 的新方法省掉了哪一步</h2>
<p>有了 <code>toBase64</code> 和 <code>fromBase64</code>，字节数组可以直接和 Base64 互转：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> encoded = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;中文&#x27;</span>).<span class="hljs-title function_">toBase64</span>(); <span class="hljs-comment">// &#x27;5Lit5paH&#x27;</span>
<span class="hljs-keyword">const</span> text = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>().<span class="hljs-title function_">decode</span>(<span class="hljs-title class_">Uint8Array</span>.<span class="hljs-title function_">fromBase64</span>(encoded)); <span class="hljs-comment">// &#x27;中文&#x27;</span>
</code></pre></div>
<p>和上面的写法相比，中间不再需要“二进制字符串”这个过渡形态。MDN 也建议，手上已经是 <code>Uint8Array</code> 时用 <code>toBase64()</code> 代替 <code>btoa()</code>；解码的数据如果本来就是字节而不是 ASCII 文本，用 <code>fromBase64()</code> 代替 <code>atob()</code>。</p>
<p>这两个方法还多了几个选项。<code>alphabet: &#x27;base64url&#x27;</code> 用 <code>-</code> 和 <code>_</code> 代替 <code>+</code> 和 <code>/</code>，编码结果可以直接放进 URL。<code>toBase64({ omitPadding: true })</code> 去掉末尾的 <code>=</code>。<code>fromBase64</code> 会忽略字符串里的 ASCII 空白，遇到不属于字母表的字符抛 <code>SyntaxError</code>。它的 <code>lastChunkHandling</code> 选项控制最后一组不满 4 个字符时怎么办：默认 <code>loose</code> 允许不带 <code>=</code>，<code>strict</code> 要求必须补齐 <code>=</code>。</p>
<h2>兼容性怎么处理</h2>
<p>MDN 把 <code>toBase64</code> 和 <code>fromBase64</code> 标为 Baseline 2025，2025 年 9 月起在各主流浏览器最新版都可用。具体版本是 Chrome 140、Firefox 133、Safari 18.2。用 Node.js 22.23.3 实测，<code>typeof Uint8Array.fromBase64</code> 是 <code>&#x27;undefined&#x27;</code>，这个版本还没有提供。</p>
<p>所以需要支持旧环境时，可以用 core-js 或 es-arraybuffer-base64 提供的 polyfill，或者继续用前面 <code>TextEncoder</code> 加 <code>btoa</code> 的写法。</p>
<h2>常见追问</h2>
<p><strong>Base64 能用来加密吗？</strong></p>
<blockquote>
<p>不能。Base64 只是把字节换一种字符表示，任何人都能解回去，没有密钥，也不提供保密性。</p>
</blockquote>
<p><strong>图片转 Base64 有什么代价？</strong></p>
<blockquote>
<p>Base64 后的长度大约是原始数据的 4/3。图片预览更推荐 object URL，见<a href="/questions/api-files/">《File、Blob 和 object URL 怎样用于文件预览？》</a>。</p>
</blockquote>
<p><strong>TextEncoder 编出来的字节为什么和字符串 length 对不上？</strong></p>
<blockquote>
<p><code>length</code> 数的是 UTF-16 码元，UTF-8 字节数是另一回事，一个汉字是 1 个码元、3 个字节。字符计数的问题见<a href="/questions/intl-unicode/">《为什么字符串 length 不一定等于用户看到的字符数？》</a>。</p>
</blockquote>`};export{e as default};