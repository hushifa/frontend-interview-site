var e={answerHtml:`<p>Web Serial 让支持的浏览器在用户授权后与串口设备通信，适合开发板调试、仪器读数或本地硬件配置工具。它提供的是字节读写通道，不会自动理解设备命令或把所有 USB 设备都当成串口。</p>
<p>是否可用同时取决于浏览器、安全上下文、系统驱动、设备类型和权限。仅看到 USB 插头，不代表应该用 Web Serial；有些设备需要 WebUSB、HID 或原生工具。</p>
<h3>选择、打开和读取是不同阶段</h3>
<p>requestPort 通常需要用户激活，会让用户选择设备。getPorts 返回当前来源已获访问的端口集合，不是静默列出系统所有硬件。</p>
<p>取得 SerialPort 后还要 open，并按设备协议配置 baudRate、数据位、停止位、校验和流控等参数。参数不匹配可能产生乱码或无法通信，不能用前端文本编码修复错误的串口配置。</p>
<p>端口可能被其他程序占用，设备也可能在选择后拔出。因此拿到句柄不等于打开成功，打开成功也不代表之后永远可读。</p>
<h3>串口字节流不自带业务消息边界</h3>
<p>设备发送一行 <code>TEMP:25\\n</code>，浏览器可能分两次收到，也可能一次收到多行。应用需要按协议保留残片、识别分隔符或长度字段，并验证校验码。</p>
<p>UTF-8 文本要用流式解码，二进制协议则按实际字节解析，不能随意 TextDecoder 后再试图恢复原值。还应限制单帧长度、未完成残片和排队数量，避免错误设备持续发送无终止数据导致内存增长。</p>
<p>writer.write 完成也不表示设备已执行命令。可靠业务协议通常还需要应答、序号、超时和错误码；涉及电机、配置写入等副作用时，重试前要判断重复命令是否安全。</p>
<h3>关闭前必须让读取循环退出并释放锁</h3>
<p>下面只演示从已打开端口读取，不负责选择设备、写入或最终关闭端口：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readSerial</span>(<span class="hljs-params">port, onBytes</span>) {
  <span class="hljs-keyword">if</span> (!port.<span class="hljs-property">readable</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;串口当前不可读&#x27;</span>);
  <span class="hljs-keyword">const</span> reader = port.<span class="hljs-property">readable</span>.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">let</span> finished = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> done = (<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
        <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
        <span class="hljs-keyword">if</span> (done) <span class="hljs-keyword">break</span>;
        <span class="hljs-keyword">await</span> <span class="hljs-title function_">onBytes</span>(value);
      }
    } <span class="hljs-keyword">finally</span> {
      finished = <span class="hljs-literal">true</span>;
      reader.<span class="hljs-title function_">releaseLock</span>();
    }
  })();

  <span class="hljs-keyword">return</span> {
    done,
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">stop</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">if</span> (!finished) <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>();
      } <span class="hljs-keyword">finally</span> {
        <span class="hljs-keyword">await</span> done;
      }
    },
  };
}
</code></pre></div>
<p>调用方要及时处理 done 的拒绝，避免读取错误成为未处理 Promise。结束时调用 stop，等待挂起读取结束并释放锁；若还有 writer，也需要完成或中止相应写入并释放锁，然后再 await port.close。</p>
<p>只把循环条件改成 false，可能仍卡在 reader.read 等待下一个字节。cancel 能让读取退出，但不能强制终止正在执行且不响应取消的 onBytes；回调自身也应有有限工作量和退出策略。</p>
<h3>错误恢复要区分可恢复与断开</h3>
<p>某些非致命读取错误后，端口可能提供新的可读流，需要重新取得 reader；设备断开则可能让 readable 变为 null 或后续操作失败。是否自动恢复取决于协议，不能在任何错误后无限重连并重发最后一条命令。</p>
<p>使用 TextDecoderStream 等管道时，还要处理 pipeTo 的完成与取消传播。只释放最外层 reader，底层端口可能仍被转换管道锁住，因此清理顺序应覆盖整条链。</p>
<p>监听连接变化可帮助更新界面，但仍要处理每次 open/read/write/close 的实际失败。页面关闭时的清理并不保证在系统强杀下完整执行，设备协议也应能容忍客户端突然消失。</p>
<p>权限授予的是通信能力，不是所有硬件数据都可信。应限制命令范围、校验设备身份与输入，并谨慎记录原始数据。浏览器不支持时提供串口工具或其他明确路径，不要把不兼容显示成设备损坏。</p>
<p>测试替身可验证流锁和取消逻辑；真实波特率、驱动、拔插、信号线以及硬件副作用需要实际设备验证。</p>`};export{e as default};