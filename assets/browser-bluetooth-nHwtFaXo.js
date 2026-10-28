var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Web Bluetooth 只支持低功耗蓝牙（BLE），通过 GATT 服务和特征值读写数据，不支持经典蓝牙的音频等设备。</li>
<li>目前只有 Chromium 系浏览器支持，Firefox 和 Safari 不支持，iOS 上的浏览器都不可用。</li>
<li>必须在 HTTPS 页面中，由点击等用户手势调用 <code>navigator.bluetooth.requestDevice()</code>，浏览器弹出选择器，用户选中后网页才能拿到这一台设备。</li>
<li>可以用 Permissions-Policy 的 <code>bluetooth</code> 指令在 iframe 中禁用。</li>
</ul>
<h2>连接流程</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readBattery</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;bluetooth&#x27;</span> <span class="hljs-keyword">in</span> navigator)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前浏览器不支持 Web Bluetooth&#x27;</span>);

  <span class="hljs-keyword">const</span> device = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">bluetooth</span>.<span class="hljs-title function_">requestDevice</span>({
    <span class="hljs-attr">filters</span>: [{ <span class="hljs-attr">services</span>: [<span class="hljs-string">&#x27;battery_service&#x27;</span>] }],
  });
  <span class="hljs-keyword">const</span> server = <span class="hljs-keyword">await</span> device.<span class="hljs-property">gatt</span>.<span class="hljs-title function_">connect</span>();
  <span class="hljs-keyword">const</span> service = <span class="hljs-keyword">await</span> server.<span class="hljs-title function_">getPrimaryService</span>(<span class="hljs-string">&#x27;battery_service&#x27;</span>);
  <span class="hljs-keyword">const</span> characteristic = <span class="hljs-keyword">await</span> service.<span class="hljs-title function_">getCharacteristic</span>(<span class="hljs-string">&#x27;battery_level&#x27;</span>);
  <span class="hljs-keyword">const</span> value = <span class="hljs-keyword">await</span> characteristic.<span class="hljs-title function_">readValue</span>();
  <span class="hljs-keyword">return</span> value.<span class="hljs-title function_">getUint8</span>(<span class="hljs-number">0</span>);
}
</code></pre></div>
<ul>
<li><code>filters</code> 决定选择器里显示哪些设备；只有在 <code>filters</code> 或 <code>optionalServices</code> 中声明的服务，之后才能访问。</li>
<li>订阅设备推送：<code>characteristic.startNotifications()</code>，再监听 <code>characteristicvaluechanged</code>。</li>
<li>监听 <code>device</code> 的 <code>gattserverdisconnected</code> 事件处理断线重连。</li>
</ul>
<h2>安全边界</h2>
<ul>
<li>网页无法扫描附近设备，只能拿到用户在选择器里选中的那一台。</li>
<li>浏览器维护一份 GATT 黑名单，禁止访问可能危害安全的服务（例如 HID 的部分服务）。</li>
<li>写特征值能控制物理设备，应用层仍要校验写入内容。</li>
</ul>
<h2>选型</h2>
<p>只服务 Chromium 桌面和 Android 用户（例如内部工具、设备配置页）时可以使用；面向所有用户的产品，需要提供原生 App 或其他降级方案。</p>`};export{e as default};