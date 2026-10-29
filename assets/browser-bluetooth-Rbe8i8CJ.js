var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Web Bluetooth 能让网页直接连上手环、体重秤这类低功耗蓝牙设备，读电量、改配置。它只支持低功耗蓝牙，也就是 BLE，数据通过 GATT 服务和特征值来读写，蓝牙耳机这类经典蓝牙设备不行。</p>
<p>安全上，网页不能自己扫描附近有哪些设备。必须在 HTTPS 页面里，由用户点击触发 <code>navigator.bluetooth.requestDevice()</code>，浏览器弹出选择器，用户选中哪一台，网页才能拿到哪一台。</p>
<p>兼容性是最大的限制。目前只有 Chromium 系浏览器支持，Firefox 和 Safari 都不支持，iOS 上的浏览器全都用不了。</p>
<p>所以它适合内部工具、设备配置页这种只面向 Chrome 和 Android 用户的场景。面向所有用户的产品，还得准备原生 App 之类的降级方案。</p>
</blockquote>
<h2>连上一台设备要几步</h2>
<p>先说两个名词。GATT 是低功耗蓝牙设备组织数据的方式：设备上有若干“服务”，比如电池服务；每个服务下面有若干“特征值”，比如电量。读写数据就是读写某个特征值。</p>
<p>下面是读取设备电量的完整流程：</p>
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
<p>顺序是：让用户选设备，连上设备的 GATT 服务器，拿到电池服务，拿到电量特征值，读出来。</p>
<p><code>filters</code> 决定选择器里列出哪些设备。还有一点容易漏：之后能访问哪些服务，取决于你在 <code>filters</code> 或 <code>optionalServices</code> 里声明过哪些。没声明的服务，连上了也访问不了。</p>
<p>如果设备会主动推数据，比如心率，就调用 <code>characteristic.startNotifications()</code>，再监听 <code>characteristicvaluechanged</code> 事件。设备断开时，<code>device</code> 上会触发 <code>gattserverdisconnected</code>，在这里处理重连。</p>
<h2>浏览器挡住了哪些风险</h2>
<p>最重要的一条是网页拿不到设备列表。它只能拿到用户在选择器里亲手选的那一台，所以没法偷偷扫描用户身边有什么设备。</p>
<p>浏览器还维护了一份 GATT 黑名单，禁止访问可能危害安全的服务，比如 HID 的部分服务。</p>
<p>可是浏览器只管“能不能连”，不管“写进去的东西对不对”。写特征值能直接控制物理设备，所以应用自己仍然要校验写入的内容。</p>
<p>如果页面嵌了 iframe，不想让它用蓝牙，可以用 Permissions-Policy 的 <code>bluetooth</code> 指令禁用。</p>
<h2>常见追问</h2>
<p><strong>网页能不能自动连上附近的设备？</strong></p>
<blockquote>
<p>不能。必须由用户点击之类的手势触发 <code>requestDevice()</code>，浏览器弹出选择器，用户自己选中设备，网页才拿得到这一台。网页没法扫描或者列出附近的设备。</p>
</blockquote>
<p><strong>蓝牙耳机能用 Web Bluetooth 控制吗？</strong></p>
<blockquote>
<p>一般不行。Web Bluetooth 只支持低功耗蓝牙，通过 GATT 读写数据，不支持经典蓝牙的音频这类设备。</p>
</blockquote>`};export{e as default};