var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给 Arduino 开发板写配置、读传感器数据，以前要装一个桌面程序，现在网页用 Web Serial 就能直接和串口设备通信。用户点击按钮后，<code>navigator.serial.requestPort()</code> 弹出端口选择框，选好以后 <code>port.open({ baudRate })</code> 打开连接。</p>
<p>读写都通过流：<code>port.readable</code> 和 <code>port.writable</code> 是字节流，读写的都是 <code>Uint8Array</code>。用户授权过的端口，下次可以用 <code>navigator.serial.getPorts()</code> 取回，不用每次重新选。</p>
<p>要注意两点。一是串口数据会被拆成任意大小的块，要自己按换行或协议的帧格式拼起来。二是关闭顺序，用了管道以后流是锁着的，顺序不对 <code>close()</code> 会失败。</p>
<p>它只有 Chromium 桌面浏览器支持，Firefox、Safari 不支持，Android 上支持有限。所以适合内部工具，比如给开发板烧录配置、连接 POS 和工业设备。</p>
</blockquote>
<h2>连接、读取和发送</h2>
<p>下面连接一个 Arduino（厂商 ID 是 0x2341），按行读取数据，并能发送文本。</p>
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
<p><code>filters</code> 只让选择框显示这个厂商的设备，用户不容易选错。<code>baudRate</code> 是波特率，要和设备那边的设置一致，否则读到的是乱码。</p>
<p>为什么要自己拼行？设备发了一行“温度 25”，网页可能分两次收到“温”和“度 25”。所以用 <code>buffer</code> 攒着，按换行切开，最后一段可能不完整，留到下一块再拼。</p>
<h2>为什么关闭顺序很重要</h2>
<p><code>pipeTo</code> 把 <code>port.readable</code> 接到解码器上，这时 <code>port.readable</code> 是锁定状态。端口在流被锁住时不能关闭。</p>
<p>所以 <code>port.stop</code> 按三步走：先 <code>reader.cancel()</code> 结束读取；再等 <code>pipeTo</code> 的 Promise 结束，锁随之释放；最后才调用 <code>port.close()</code>。顺序不对，<code>close()</code> 会因为流被锁定而失败。</p>
<h2>设备被拔掉怎么办</h2>
<p>监听 <code>disconnect</code> 事件：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">navigator.<span class="hljs-property">serial</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;disconnect&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">target</span> === currentPort) <span class="hljs-title function_">showDisconnected</span>();
});
</code></pre></div>
<p>设备被拔掉时，读取循环会抛错或者结束。界面要恢复到可以重新连接的状态。</p>
<h2>常见追问</h2>
<p><strong>面向普通用户的产品能用 Web Serial 吗？</strong></p>
<blockquote>
<p>要慎重。它只在 Chromium 桌面浏览器里能用，用 Safari、Firefox 或手机的用户都用不了。面向大众的产品要准备原生客户端或配套程序，并告诉用户需要用哪个浏览器。</p>
</blockquote>
<p><strong>每次打开页面都要重新选择端口吗？</strong></p>
<blockquote>
<p>不用。用户授权过的端口，可以用 <code>navigator.serial.getPorts()</code> 直接取回来，再调用 <code>open()</code> 就能连接。</p>
</blockquote>`};export{e as default};