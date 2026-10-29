var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>线上代码压缩以后，报错只会告诉你“第 1 行第 27 列”，根本没法看。Source Map 是一个 JSON 文件，记录了压缩后代码的每个位置对应源码的哪个文件、哪一行、哪一列。</p>
<p>浏览器通过脚本末尾的 <code>//# sourceMappingURL=</code> 注释，或者 <code>SourceMap</code> 响应头找到它，DevTools 就能显示源码。错误监控平台也用它把堆栈还原回源码位置。</p>
<p>前提是映射文件和产物来自同一次构建，所以监控平台要按发布版本上传和匹配。</p>
<p>要注意，公开的 Source Map 一般带着完整源码，谁都能下载，不想公开源码就别部署到公开地址。它只改善调试，不改变代码怎样运行。</p>
</blockquote>
<h2>Source Map 是怎样还原位置的</h2>
<p>先看一段压缩后的代码，末尾的注释告诉浏览器去哪里找映射文件。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// app.3f9a.js（压缩后）</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">n</span>(<span class="hljs-params">t</span>){<span class="hljs-keyword">return</span> t.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">r</span>=&gt;</span>r*<span class="hljs-number">2</span>)}
<span class="hljs-comment">//# sourceMappingURL=app.3f9a.js.map</span>
</code></pre></div>
<p>映射文件大致长这样：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;version&quot;: 3,
  &quot;file&quot;: &quot;app.3f9a.js&quot;,
  &quot;sources&quot;: [&quot;src/math.ts&quot;],
  &quot;sourcesContent&quot;: [&quot;export function double(list: number[]) { ... }&quot;],
  &quot;names&quot;: [&quot;double&quot;, &quot;list&quot;, &quot;item&quot;],
  &quot;mappings&quot;: &quot;AAAA,SAASA,EAAOC,...&quot;
}
</code></pre></div>
<p><code>sources</code> 列出源文件，<code>names</code> 列出原来的变量名。<code>mappings</code> 是一串经过 Base64 VLQ 编码的数据，记录“生成代码的某个位置，对应第几个源文件的第几行第几列、原名是什么”。</p>
<p>所以报错堆栈里的 <code>app.3f9a.js:1:27</code>，查一下映射就能还原成 <code>src/math.ts:3:12</code>，压缩后的变量名 <code>r</code> 也能还原成 <code>item</code>。</p>
<p><code>sourcesContent</code> 里放的是源码全文。这就是为什么公开部署 Source Map 等于公开源码。</p>
<h2>部署时怎样选</h2>
<p>公开部署 <code>.map</code> 并保留注释，任何人都能在 DevTools 里看到源码。</p>
<p>生成 <code>.map</code> 但不部署，只上传到监控平台，线上看不到源码，监控平台仍能还原堆栈。</p>
<p>部署到需要鉴权的内网地址，用 <code>SourceMap</code> 响应头指向它，只有能访问内网的开发者能用。</p>
<p>完全不生成的话，线上错误只能看压缩后的位置。</p>
<p>Vite 的 <code>build.sourcemap</code> 可以设成 <code>true</code>、<code>&#x27;inline&#x27;</code> 或 <code>&#x27;hidden&#x27;</code>。<code>&#x27;hidden&#x27;</code> 会生成 <code>.map</code> 文件，但不在产物里写那行注释，正适合“只上传到监控平台”的做法。</p>
<h2>怎样和错误监控配合</h2>
<p>构建时生成 Source Map，同时给这次构建一个发布版本号，比如提交哈希。然后把 <code>.map</code> 文件和版本号一起上传到 Sentry 这类平台，再从公开目录删掉。</p>
<p>前端 SDK 上报错误时带上同一个版本号，平台就能按版本找到对应的映射文件，还原堆栈。</p>
<p>版本对不上是最危险的情况。平台可能用错误的映射还原出一个看起来合理、其实完全不对的位置，这比找不到映射更容易误导排查。</p>
<h2>常见追问</h2>
<p><strong>为什么 DevTools 里还原出来的行号是偏的？</strong></p>
<blockquote>
<p>可能是某个构建插件改写代码时，没有生成或传递 Source Map，中间断了一环。也可能部署的 <code>.map</code> 来自另一次构建，跟产物对不上。</p>
</blockquote>
<p><strong>生产环境开启 Source Map 会影响性能吗？</strong></p>
<blockquote>
<p>浏览器只在打开 DevTools 时才下载映射文件，普通用户不受影响。代价主要是构建时间会略长一点。</p>
</blockquote>`};export{e as default};