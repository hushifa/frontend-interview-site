var e={answerHtml:`<h2>简答</h2>
<ul>
<li>构建成功只说明命令没报错；发布前还要检查产物是否完整、HTML 引用的资源是否都存在。</li>
<li>文件哈希证明&quot;文件和清单记录的一致&quot;，能发现上传缺失或被篡改，但不能证明代码本身安全，也不能证明它来自可信的构建。</li>
<li>证明来源需要在受控 CI 中构建并生成签名或构建证明（如 GitHub 的 artifact attestation）。</li>
<li>发布要原子切换：先上传所有带哈希的资源，最后再替换 HTML 入口，避免用户拿到新 HTML 却加载不到新资源。</li>
<li>保留上一版完整产物，回滚时整体切回，而不是逐个文件恢复。</li>
</ul>
<h2>混版问题</h2>
<p>静态站点由一个入口 HTML 和一批带哈希的 JS、CSS 组成。如果上传顺序是先覆盖 <code>index.html</code>，资源还没传完，这段时间访问的用户会请求不存在的文件；如果部署时删除了旧资源，停留在旧页面的用户点击懒加载功能也会 404。</p>
<h2>生成和校验清单</h2>
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
<p>部署脚本上传完成后，按清单逐个下载或查询远端文件哈希并比对。再解析 HTML，确认每个 <code>&lt;script src&gt;</code>、<code>&lt;link href&gt;</code> 指向的文件都在清单里。任何一项失败就停止切换入口。</p>
<h2>哈希不能证明什么</h2>
<ul>
<li><strong>代码安全</strong>：如果依赖被投毒，构建产物会忠实包含恶意代码，哈希完全一致。</li>
<li><strong>来源可信</strong>：攻击者可以在自己的机器上构建出产物并生成匹配的清单。</li>
<li><strong>运行正确</strong>：文件都在不代表功能正常，仍需冒烟测试。</li>
</ul>
<p>需要证明来源时，在 CI 中构建并用 <code>actions/attest-build-provenance</code> 等工具为产物生成签名证明，部署前验证签名和构建流水线。</p>
<h2>原子发布和回滚</h2>
<ol>
<li>资源上传到以版本号命名的目录，或依靠内容哈希文件名，与旧资源共存。</li>
<li>校验通过后，最后一步更新 HTML 入口（或切换 CDN 指向的版本目录）。</li>
<li>HTML 设置 <code>Cache-Control: no-cache</code>，带哈希的资源设置长期缓存。</li>
<li>保留至少上一版完整产物，回滚时把入口切回旧版本即可。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>为什么不用 SRI？SRI（<code>integrity</code> 属性）在浏览器端校验第三方或 CDN 资源未被篡改，和部署前校验是两个阶段的保护，可以同时使用。</li>
<li>部署到 GitHub Pages 这类平台怎么保证原子性？平台在一次部署完成后整体切换，可以依赖它；自建对象存储时要自己控制顺序。</li>
</ul>`};export{e as default};