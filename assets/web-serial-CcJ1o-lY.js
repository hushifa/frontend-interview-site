var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.serial.requestPort()</code> 在用户手势中弹出端口选择器，<code>port.open({ baudRate })</code> 打开连接。</li>
<li><code>port.readable</code> 和 <code>port.writable</code> 是字节流，读写的都是 <code>Uint8Array</code>。</li>
<li>只有 Chromium 桌面浏览器支持，Firefox、Safari 不支持；Android 上的支持情况有限。</li>
<li>用户授权过的端口可以用 <code>navigator.serial.getPorts()</code> 取回，不必每次重新选择。</li>
<li>适合：给开发板烧录配置、读取传感器数据、连接 POS 和工业设备的内部工具。</li>
</ul>
<h2>读写示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">connect</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> port = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">serial</span>.<span class="hljs-title function_">requestPort</span>({ <span class="hljs-attr">filters</span>: [{ <span class="hljs-attr">usbVendorId</span>: <span class="hljs-number">0x2341</span> }] });
  <span class="hljs-keyword">await</span> port.<span class="hljs-title function_">open</span>({ <span class="hljs-attr">baudRate</span>: <span class="hljs-number">115200</span> });
  <span class="hljs-keyword">return</span> port;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readLines</span>(<span class="hljs-params">port, onLine</span>) {
  <span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoderStream</span>();
  <span class="hljs-comment">// pipeTo 会锁住 port.readable，关闭时要等这个 Promise 结束</span>
  <span class="hljs-keyword">const</span> piped = port.<span class="hljs-property">readable</span>.<span class="hljs-title function_">pipeTo</span>(decoder.<span class="hljs-property">writable</span>).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> {});
  <span class="hljs-keyword">const</span> reader = decoder.<span class="hljs-property">readable</span>.<span class="hljs-title function_">getReader</span>();
  port.<span class="hljs-property">stop</span> = <span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>();
    <span class="hljs-keyword">await</span> piped;
    <span class="hljs-keyword">await</span> port.<span class="hljs-title function_">close</span>();
  };
  <span class="hljs-keyword">let</span> buffer = <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">break</span>;
      buffer += value;
      <span class="hljs-keyword">const</span> lines = buffer.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;\\n&#x27;</span>);
      buffer = lines.<span class="hljs-title function_">pop</span>();
      lines.<span class="hljs-title function_">forEach</span>(onLine);
    }
  } <span class="hljs-keyword">finally</span> {
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">send</span>(<span class="hljs-params">port, text</span>) {
  <span class="hljs-keyword">const</span> writer = port.<span class="hljs-property">writable</span>.<span class="hljs-title function_">getWriter</span>();
  <span class="hljs-keyword">await</span> writer.<span class="hljs-title function_">write</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(text));
  writer.<span class="hljs-title function_">releaseLock</span>();
}
</code></pre></div>
<ul>
<li>串口数据会被拆成任意大小的块，必须自己按换行或协议的帧格式拼接。</li>
<li>用了管道后 <code>port.readable</code> 处于锁定状态。关闭顺序是：<code>reader.cancel()</code> 结束读取，等待 <code>pipeTo</code> 的 Promise 结束（锁随之释放），再调用 <code>port.close()</code>；顺序不对时 <code>close()</code> 会因流被锁定而失败。</li>
</ul>
<h2>断开处理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">navigator.<span class="hljs-property">serial</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;disconnect&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">target</span> === currentPort) <span class="hljs-title function_">showDisconnected</span>();
});
</code></pre></div>
<p>设备被拔掉时，读取循环会抛错或结束，界面要恢复到可以重新连接的状态。</p>
<h2>选型</h2>
<p>只服务 Chromium 桌面用户的内部工具可以直接使用。面向大众的产品需要准备原生客户端或配套程序，并告知用户需要使用的浏览器。</p>`};export{e as default};