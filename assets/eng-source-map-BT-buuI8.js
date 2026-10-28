var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Source Map 是一个 JSON 文件，记录压缩后代码的每个位置对应源码的哪个文件、哪一行哪一列。</li>
<li>浏览器通过脚本末尾的 <code>//# sourceMappingURL=</code> 注释或 <code>SourceMap</code> 响应头找到它，DevTools 据此显示源码。</li>
<li>映射只有在和对应的产物来自同一次构建时才准确，错误监控平台要按发布版本上传和匹配。</li>
<li>公开的 Source Map 通常包含完整源码（<code>sourcesContent</code>），任何人都能下载，不想公开源码就不要部署到公开地址。</li>
<li>它只改善调试体验，不改变代码的运行行为。</li>
</ul>
<h2>原理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// app.3f9a.js（压缩后）</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">n</span>(<span class="hljs-params">t</span>){<span class="hljs-keyword">return</span> t.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">r</span>=&gt;</span>r*<span class="hljs-number">2</span>)}
<span class="hljs-comment">//# sourceMappingURL=app.3f9a.js.map</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;version&quot;: 3,
  &quot;file&quot;: &quot;app.3f9a.js&quot;,
  &quot;sources&quot;: [&quot;src/math.ts&quot;],
  &quot;sourcesContent&quot;: [&quot;export function double(list: number[]) { ... }&quot;],
  &quot;names&quot;: [&quot;double&quot;, &quot;list&quot;, &quot;item&quot;],
  &quot;mappings&quot;: &quot;AAAA,SAASA,EAAOC,...&quot;
}
</code></pre></div>
<p><code>mappings</code> 用 Base64 VLQ 编码记录&quot;生成位置 → 源文件索引、源码行列、原名称&quot;。报错堆栈里的 <code>app.3f9a.js:1:27</code> 经过查找，就能还原成 <code>src/math.ts:3:12</code>，变量名也能还原为 <code>item</code>。</p>
<h2>部署方式的选择</h2>
<table><thead><tr><th>方式</th><th>效果</th></tr></thead><tbody><tr><td>公开部署 <code>.map</code> 并保留注释</td><td>任何人都能在 DevTools 看到源码</td></tr><tr><td>生成 <code>.map</code> 但不部署，只上传到监控平台</td><td>线上看不到源码，监控平台能还原堆栈</td></tr><tr><td>部署到需要鉴权的内网地址，用 <code>SourceMap</code> 头指向它</td><td>只有能访问内网的开发者能用</td></tr><tr><td>不生成</td><td>线上错误只能看压缩后的位置</td></tr></tbody></table>
<p>Vite 的 <code>build.sourcemap</code> 可选 <code>true</code>、<code>&#x27;inline&#x27;</code>、<code>&#x27;hidden&#x27;</code>。<code>&#x27;hidden&#x27;</code> 生成 <code>.map</code> 文件但不在产物中写入注释，适合&quot;只上传到监控平台&quot;的方案。</p>
<h2>和错误监控配合</h2>
<ol>
<li>构建时生成 Source Map，并给这次构建一个发布版本号（如提交哈希）。</li>
<li>把 <code>.map</code> 文件和版本号一起上传到 Sentry 等平台，然后从公开目录删除。</li>
<li>前端 SDK 上报错误时带上同一个版本号。</li>
<li>平台按版本找到对应的映射文件，还原堆栈。</li>
</ol>
<p>版本对不上时，平台可能用错误的映射还原出看似合理却完全错误的位置，比找不到映射更容易误导排查。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 DevTools 里还原的行号偏了？可能是某个构建插件改写代码时没有生成或传递 Source Map，或者部署的 <code>.map</code> 来自另一次构建。</li>
<li>生产环境开启 Source Map 会影响性能吗？浏览器只在打开 DevTools 时才下载映射文件，普通用户不受影响；构建时间会略有增加。</li>
</ul>`};export{e as default};