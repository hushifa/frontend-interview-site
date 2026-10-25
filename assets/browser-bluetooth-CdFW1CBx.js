var e={answerHtml:`<p>Web Bluetooth 主要让网页在支持的环境中访问蓝牙低功耗设备的 GATT 服务和特征。例如读取传感器数值、设备电量，或者按设备定义的协议写入配置。</p>
<p>它不是访问操作系统全部蓝牙功能的通用接口，不能因为浏览器能使用蓝牙，就认为任意耳机、串口或经典蓝牙协议都可以直接连接。设备、操作系统和浏览器支持必须同时满足。</p>
<h2>第一步是访问许可，不是普通网络请求</h2>
<p>通常要求 HTTPS 等安全上下文，localhost 可以有开发环境的可信例外。页面还受到 Permissions Policy 的 bluetooth 指令控制，跨源 iframe 需要符合嵌入与权限委派规则。</p>
<p>首次申请设备访问时，<code>navigator.bluetooth.requestDevice()</code> 需要短暂用户激活，例如直接由按钮点击调用。若先 await 一个耗时请求，再弹出设备选择，用户激活可能已经失效。不能在页面加载后静默枚举所有附近设备。</p>
<p>用户选择设备表示网站获得了相应访问许可，不等于每次都一定完成了操作系统层面的配对，也不保证设备仍在线。支持时可以用 getDevices 获取之前授权的设备，但那也不是扫描全部设备，后续连接仍可能失败。</p>
<p>能力检测、站点权限、设备可达性是三层不同判断。即使 navigator.bluetooth 存在，用户也可能拒绝、设备蓝牙可能关闭，目标服务也可能不存在。</p>
<h2>服务过滤与服务访问权限需要对应</h2>
<p>GATT 中，服务把一组相关能力组织起来，特征则承载具体的可读、可写或可订阅数据。例如 battery_service 下的 battery_level 表示电量。</p>
<p>使用服务过滤器选择设备时，会同时涉及该服务的访问许可。若按设备名称或名称前缀过滤，却还需要访问电池服务，应在 optionalServices 中声明它；acceptAllDevices 也不是获得所有服务权限的通行证。</p>
<p>设备的广播信息与实际具有的服务还可能不同。按某个服务过滤却看不到设备，不一定说明设备绝对没有该服务，也可能是它没有按预期广播相应信息。要对照设备说明和实际固件，而不是不停扩大权限范围碰运气。</p>
<h2>一个点击后读取一次电量的例子</h2>
<p>下面假定页面已有按钮和状态文本元素，目标设备支持并广播标准电池服务。代码只读取一次，结束后断开，不建立长期通知订阅。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">bindBatteryReader</span>(<span class="hljs-params">button, output</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> navigator.<span class="hljs-property">bluetooth</span>?.<span class="hljs-property">requestDevice</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) {
    button.<span class="hljs-property">disabled</span> = <span class="hljs-literal">true</span>;
    output.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;当前浏览器不支持蓝牙读取。&#x27;</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  }

  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> device;
  <span class="hljs-keyword">let</span> busy = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">readBattery</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (busy || disposed) <span class="hljs-keyword">return</span>;
    busy = <span class="hljs-literal">true</span>;
    button.<span class="hljs-property">disabled</span> = <span class="hljs-literal">true</span>;
    <span class="hljs-keyword">let</span> selected;

    <span class="hljs-keyword">try</span> {
      selected = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">bluetooth</span>.<span class="hljs-title function_">requestDevice</span>({
        <span class="hljs-attr">filters</span>: [{ <span class="hljs-attr">services</span>: [<span class="hljs-string">&#x27;battery_service&#x27;</span>] }],
      });
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">if</span> (!selected.<span class="hljs-property">gatt</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;设备没有可用的 GATT 接口&#x27;</span>);
      device = selected;

      <span class="hljs-keyword">const</span> server = <span class="hljs-keyword">await</span> selected.<span class="hljs-property">gatt</span>.<span class="hljs-title function_">connect</span>();
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> service = <span class="hljs-keyword">await</span> server.<span class="hljs-title function_">getPrimaryService</span>(<span class="hljs-string">&#x27;battery_service&#x27;</span>);
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> characteristic = <span class="hljs-keyword">await</span> service.<span class="hljs-title function_">getCharacteristic</span>(<span class="hljs-string">&#x27;battery_level&#x27;</span>);
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> value = <span class="hljs-keyword">await</span> characteristic.<span class="hljs-title function_">readValue</span>();
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;

      <span class="hljs-keyword">if</span> (value.<span class="hljs-property">byteLength</span> !== <span class="hljs-number">1</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;电量数据长度不正确&#x27;</span>);
      <span class="hljs-keyword">const</span> percent = value.<span class="hljs-title function_">getUint8</span>(<span class="hljs-number">0</span>);
      <span class="hljs-keyword">if</span> (percent &gt; <span class="hljs-number">100</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;电量数据超出有效范围&#x27;</span>);
      output.<span class="hljs-property">textContent</span> = <span class="hljs-string">\`当前电量：<span class="hljs-subst">\${percent}</span>%\`</span>;
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (!disposed) {
        output.<span class="hljs-property">textContent</span> = error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;NotFoundError&#x27;</span>
          ? <span class="hljs-string">&#x27;未选到可访问的设备。&#x27;</span>
          : <span class="hljs-string">&#x27;读取失败，请检查设备连接后重试。&#x27;</span>;
      }
    } <span class="hljs-keyword">finally</span> {
      selected?.<span class="hljs-property">gatt</span>?.<span class="hljs-title function_">disconnect</span>();
      <span class="hljs-keyword">if</span> (device === selected) device = <span class="hljs-literal">undefined</span>;
      busy = <span class="hljs-literal">false</span>;
      <span class="hljs-keyword">if</span> (!disposed) button.<span class="hljs-property">disabled</span> = <span class="hljs-literal">false</span>;
    }
  }

  button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, readBattery, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    disposed = <span class="hljs-literal">true</span>;
    listeners.<span class="hljs-title function_">abort</span>();
    device?.<span class="hljs-property">gatt</span>?.<span class="hljs-title function_">disconnect</span>();
  };
}
</code></pre></div>
<p>这里的 requestDevice 位于点击处理的第一段同步执行路径里，没有先等待其他异步工作。按钮忙碌期间避免重复打开流程，失败后允许重新尝试；组件销毁时解除监听并断开已有连接。</p>
<p>设备选择或底层操作已经进行中时，清理函数不一定能立刻取消每一个系统操作。所以每次 await 后还检查 disposed，防止用户离开后继续建立后续步骤或更新旧界面。若离开后设备选择才返回，finally 也会尝试释放得到的 GATT 连接。</p>
<p>这个例子按标准电量特征校验一个字节和 0 到 100 的范围，不能拿它直接解析任意传感器协议。其他特征的字节序、符号、单位和长度都应按设备定义处理。</p>
<h2>断开和重连不是一个简单布尔值</h2>
<p>持续连接的应用通常需要监听 gattserverdisconnected，区分主动断开、设备断电、超出距离和系统连接变化。发生意外断开后，应更新界面、终止无效的读写流程，并决定是否让用户重连。</p>
<p>重连后可能需要重新取得服务和特征对象、重新开启通知，不能只把界面中的 connected 改回 true。旧请求晚到时也要通过连接代次或状态检查，避免把上一条连接的结果覆盖到新设备上。</p>
<p>GATT 操作还可能需要按设备能力串行安排。高频并发读写、忽略忙碌状态或无限重试，都可能让设备和浏览器连接更不稳定；写配置等操作尤其要明确是否可重复执行。</p>
<h2>通知订阅与轮询是不同流程</h2>
<p>支持通知的特征可以通过 startNotifications 订阅，并监听 characteristicvaluechanged；结束时解除事件监听，并在适当条件下停止通知。</p>
<p>但特征是否支持通知、设备按什么频率发、一次值是否对应完整业务消息，取决于设备协议。长数据可能需要应用自行处理分片、序号和重组，不能把某一次事件直接视为完整文件或可靠事务。</p>
<p>页面隐藏、冻结或浏览器关闭也会影响持续使用，网页不是专用的后台蓝牙守护进程。需要长时间可靠采集时，应先确认目标环境能否满足要求。</p>
<h2>哪些问题必须用真实设备验证</h2>
<p>通过测试替身可以验证代码是否处理拒绝、无效数据、重复点击、连接失败和组件销毁，但不能据此声称蓝牙协议兼容、无线稳定性或设备电量读取已经在真机上通过。</p>
<p>上线前应覆盖实际浏览器与操作系统、权限拒绝、设备离线、服务缺失、断电重连、并发操作和固件版本差异。读取函数在开发机不报语法错误，只能说明很小的一部分。</p>
<p>设备数据也不能因为经过蓝牙连接就无条件信任。长度、数值范围、消息类型和操作权限都需要校验；涉及设备控制或敏感数据时，还要遵循设备本身的认证与安全协议。对于不支持的环境，应提供清楚的替代路径，而不是让用户反复点击一个无法工作的连接按钮。</p>`};export{e as default};