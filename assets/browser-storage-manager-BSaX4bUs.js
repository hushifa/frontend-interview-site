var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>离线应用要下载几百兆数据，下载前得先知道空间够不够。<code>navigator.storage.estimate()</code> 返回 <code>{ usage, quota }</code>，也就是当前网站在 IndexedDB、Cache Storage、OPFS 这些地方的估算用量，以及可用的配额。</p>
<p>默认情况下，浏览器对存储是“尽力而为”的，存储压力大时可能把你的数据清掉。<code>persist()</code> 用来申请持久存储，<code>persisted()</code> 查询是否已经拿到了。</p>
<p>另外 <code>getDirectory()</code> 返回源私有文件系统的根目录，也就是 OPFS，适合存大文件和数据库文件。</p>
<p>要注意，这些数字都是估算值。不同浏览器的配额策略不一样，不能当成精确容量来用。</p>
</blockquote>
<h2>先看怎么查询和申请</h2>
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
<p><code>checkStorage</code> 把用量和配额换算成 MB，顺便查一下是不是已经持久化了。<code>requestPersistence</code> 先看浏览器支不支持，已经拿到了就不再申请。</p>
<h2>估算值为什么不能全信</h2>
<p>下载大量离线数据前，可以先算一下剩余空间 <code>quota - usage</code>，不够就提示用户。可是写入时仍然要处理 <code>QuotaExceededError</code>，因为估算值和实际能写进去的空间可能不一样。</p>
<p><code>quota</code> 也不等于你硬盘的真实剩余空间。浏览器是故意这么做的，防止网站通过它探测用户的磁盘有多大。</p>
<h2>申请持久存储会发生什么</h2>
<p>不同浏览器处理方式不同。Chrome 会根据用户和这个网站的互动程度，自动决定给不给，不会弹窗。Firefox 会弹出提示，问用户同不同意。</p>
<p>拿到持久存储也不是万无一失。用户仍然可以在浏览器设置里手动清除数据，所以重要数据还得在服务端留备份。</p>
<h2>常见追问</h2>
<p><strong>无痕模式下配额会怎样？</strong></p>
<blockquote>
<p>通常会小很多，而且窗口一关，数据就被清除了。</p>
</blockquote>
<p><strong>存储空间是按什么划分的？</strong></p>
<blockquote>
<p>按源划分。在第三方 iframe 里，还会按顶层站点再分区，同一个源嵌在不同网站里，用的是不同的存储。</p>
</blockquote>`};export{e as default};