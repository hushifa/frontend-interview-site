var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>构建命令没报错，只说明构建成功了。发布前还要检查产物完不完整，HTML 里引用的每个资源是不是都在。</p>
<p>文件哈希能证明“这个文件和清单上记的一样”，所以能发现上传漏了或被篡改。可是它证明不了代码本身是安全的，也证明不了产物来自可信的构建。要证明来源，得在受控的 CI 里构建，并生成签名或构建证明，比如 GitHub 的 artifact attestation。</p>
<p>发布过程还要做到原子切换：先把所有带哈希的资源传上去，最后一步才替换 HTML 入口，避免用户拿到新 HTML 却加载不到新资源。</p>
<p>上一版的完整产物要保留下来。出问题时整体切回旧版，而不是一个文件一个文件地恢复。</p>
</blockquote>
<h2>什么是混版</h2>
<p>静态站点由一个入口 HTML 和一批带哈希的 JS、CSS 组成，HTML 写着要加载哪些资源。所谓混版，就是用户拿到的 HTML 和服务器上的资源不是同一个版本。</p>
<p>它有两种出现方式。一种是上传顺序不对：先覆盖了 <code>index.html</code>，资源还没传完，这段时间访问的用户会去请求还不存在的文件。另一种是部署时把旧资源删了：停留在旧页面的用户点开一个懒加载功能，请求的是旧文件名，结果 404。</p>
<h2>怎样生成和校验清单</h2>
<p>清单就是一份“文件路径 → 哈希”的记录。下面的脚本遍历 <code>dist</code> 目录，给每个文件算 SHA-256：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// scripts/manifest.mjs</span>
<span class="hljs-keyword">import</span> { createHash } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;
<span class="hljs-keyword">import</span> { readFile, readdir, writeFile } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:fs/promises&#x27;</span>;
<span class="hljs-keyword">import</span> { join, relative } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:path&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span>* <span class="hljs-title function_">walk</span>(<span class="hljs-params">dir</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">readdir</span>(dir, { <span class="hljs-attr">withFileTypes</span>: <span class="hljs-literal">true</span> })) {
    <span class="hljs-keyword">const</span> full = <span class="hljs-title function_">join</span>(dir, entry.<span class="hljs-property">name</span>);
    <span class="hljs-keyword">if</span> (entry.<span class="hljs-title function_">isDirectory</span>()) <span class="hljs-keyword">yield</span>* <span class="hljs-title function_">walk</span>(full);
    <span class="hljs-keyword">else</span> <span class="hljs-keyword">yield</span> full;
  }
}

<span class="hljs-keyword">const</span> root = <span class="hljs-string">&#x27;dist&#x27;</span>;
<span class="hljs-keyword">const</span> files = {};
<span class="hljs-keyword">for</span> <span class="hljs-keyword">await</span> (<span class="hljs-keyword">const</span> file <span class="hljs-keyword">of</span> <span class="hljs-title function_">walk</span>(root)) {
  <span class="hljs-keyword">const</span> hash = <span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>).<span class="hljs-title function_">update</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">readFile</span>(file)).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;hex&#x27;</span>);
  files[<span class="hljs-title function_">relative</span>(root, file).<span class="hljs-title function_">replaceAll</span>(<span class="hljs-string">&#x27;\\\\&#x27;</span>, <span class="hljs-string">&#x27;/&#x27;</span>)] = hash;
}
<span class="hljs-keyword">await</span> <span class="hljs-title function_">writeFile</span>(<span class="hljs-string">&#x27;manifest.json&#x27;</span>, <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(files, <span class="hljs-literal">null</span>, <span class="hljs-number">2</span>));
</code></pre></div>
<p>最后一行的 <code>replaceAll(&#x27;\\\\&#x27;, &#x27;/&#x27;)</code> 是为了让 Windows 上生成的路径也用斜杠，和服务器上的路径对得上。</p>
<p>哈希为什么能发现文件问题？因为内容哪怕只差一个字符，算出来的哈希就完全不同：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createHash } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:crypto&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title function_">sha</span> = (<span class="hljs-params">text</span>) =&gt; <span class="hljs-title function_">createHash</span>(<span class="hljs-string">&#x27;sha256&#x27;</span>).<span class="hljs-title function_">update</span>(text).<span class="hljs-title function_">digest</span>(<span class="hljs-string">&#x27;hex&#x27;</span>).<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, <span class="hljs-number">12</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">sha</span>(<span class="hljs-string">&#x27;console.log(1)&#x27;</span>) === <span class="hljs-title function_">sha</span>(<span class="hljs-string">&#x27;console.log(1)&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">sha</span>(<span class="hljs-string">&#x27;console.log(1)&#x27;</span>) === <span class="hljs-title function_">sha</span>(<span class="hljs-string">&#x27;console.log(2)&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>部署脚本上传完以后，按清单逐个下载远端文件或者查询它的哈希，和清单比对。然后再解析 HTML，确认每个 <code>&lt;script src&gt;</code>、<code>&lt;link href&gt;</code> 指向的文件都在清单里。任何一项不对，就停下来，不去切换入口。</p>
<h2>哈希证明不了什么</h2>
<p>哈希只能说明文件没变样，下面三件事它都管不了。</p>
<p>第一是代码安全。如果某个依赖被投了毒，构建产物会原样带上恶意代码，哈希和清单完全一致。</p>
<p>第二是来源可信。攻击者在自己的机器上也能构建出一份产物，再生成一份匹配的清单。</p>
<p>第三是运行正确。文件都在，不代表功能正常，还需要冒烟测试。</p>
<p>需要证明来源时，要在 CI 里构建，用 <code>actions/attest-build-provenance</code> 这类工具给产物生成签名证明，部署前验证签名和构建它的流水线。</p>
<h2>怎样做到原子发布和快速回滚</h2>
<ol>
<li>资源上传到以版本号命名的目录，或者靠内容哈希文件名，和旧资源共存。</li>
<li>校验通过后，最后一步才更新 HTML 入口，或者切换 CDN 指向的版本目录。</li>
<li>HTML 设置 <code>Cache-Control: no-cache</code>，带哈希的资源设置长期缓存。</li>
<li>至少保留上一版的完整产物，回滚时把入口切回旧版本就行。</li>
</ol>
<p>这几步的关键是：资源先到位，入口最后换。入口一换，用户就整体拿到新版本；回滚时入口一换回，又整体回到旧版本，中间不会出现半新半旧。</p>
<h2>常见追问</h2>
<p><strong>为什么不用 SRI？</strong></p>
<blockquote>
<p>SRI 是给 <code>&lt;script&gt;</code>、<code>&lt;link&gt;</code> 加 <code>integrity</code> 属性，让浏览器加载时校验第三方或 CDN 上的资源没被篡改。它管的是浏览器加载那一刻，部署前校验管的是发布之前，两个阶段的保护可以同时用。</p>
</blockquote>
<p><strong>部署到 GitHub Pages 这类平台，怎么保证原子性？</strong></p>
<blockquote>
<p>平台会在一次部署完成后整体切换，可以依赖它。如果是自己搭的对象存储，上传顺序就要自己控制。</p>
</blockquote>`};export{e as default};