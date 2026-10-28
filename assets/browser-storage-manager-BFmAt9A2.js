var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.storage.estimate()</code> 返回 <code>{ usage, quota }</code>，是本源 IndexedDB、Cache Storage、OPFS 等的估算用量和可用配额。</li>
<li>默认存储是&quot;尽力而为&quot;的，存储压力大时浏览器可能清除；<code>persist()</code> 申请持久存储，<code>persisted()</code> 查询是否已获得。</li>
<li><code>getDirectory()</code> 返回源私有文件系统（OPFS）的根目录，适合存大文件和数据库文件。</li>
<li>这些数值是估算值，不同浏览器的配额策略不同，不能作为精确容量使用。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">checkStorage</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { usage = <span class="hljs-number">0</span>, quota = <span class="hljs-number">0</span> } = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">storage</span>.<span class="hljs-title function_">estimate</span>();
  <span class="hljs-keyword">const</span> persisted = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">storage</span>.<span class="hljs-title function_">persisted</span>();
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">usedMB</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(usage / <span class="hljs-number">1024</span> / <span class="hljs-number">1024</span>),
    <span class="hljs-attr">quotaMB</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(quota / <span class="hljs-number">1024</span> / <span class="hljs-number">1024</span>),
    persisted,
  };
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">requestPersistence</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-property">storage</span>?.<span class="hljs-property">persist</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">await</span> navigator.<span class="hljs-property">storage</span>.<span class="hljs-title function_">persisted</span>()) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-property">storage</span>.<span class="hljs-title function_">persist</span>();
}
</code></pre></div>
<h2>使用建议</h2>
<ul>
<li>下载大量离线数据前先检查剩余空间（<code>quota - usage</code>），不足时提示用户。</li>
<li>写入时仍要处理 <code>QuotaExceededError</code>，估算值和实际可写入的空间可能不一致。</li>
<li>Chrome 会根据用户与网站的互动程度自动决定是否授予持久存储，Firefox 会弹出提示询问用户。</li>
<li>获得持久存储后，用户仍可在浏览器设置里手动清除数据，重要数据要有服务端备份。</li>
<li>为防止网站探测用户的磁盘大小，浏览器返回的 <code>quota</code> 不等于真实剩余磁盘空间。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>无痕模式下配额会怎样：通常会小很多，窗口关闭后数据被清除。</li>
<li>存储按什么划分：按源划分，并且在第三方 iframe 中按顶层站点分区。</li>
</ul>`};export{e as default};