var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做“附近的门店”时，用 <code>navigator.geolocation</code> 拿用户位置。它只在 HTTPS 等安全上下文里可用，第一次调用时浏览器会弹授权框。</p>
<p>有两个方法：<code>getCurrentPosition</code> 获取一次；<code>watchPosition</code> 持续获取，会返回一个 ID，不用时用 <code>clearWatch</code> 停掉。</p>
<p>结果里除了经纬度，还有 <code>coords.accuracy</code>，它是误差半径，单位是米，数字越大越不准。失败有三种错误码：<code>1</code> 用户拒绝，<code>2</code> 获取不到位置，<code>3</code> 超时。<code>enableHighAccuracy: true</code> 可能会启用 GPS，更准，但更慢、更耗电。</p>
<p>要注意时机和隐私。在用户点了“使用我的位置”之后再请求，用户拒绝了要给手动选城市的办法；上传时只传业务需要的精度。</p>
</blockquote>
<h2>封装一个定位函数</h2>
<p>下面把回调式的 API 包成 Promise，并把错误码翻译成用户能看懂的话。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">locate</span>(<span class="hljs-params">{ timeout = <span class="hljs-number">10000</span> } = {}</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;geolocation&#x27;</span> <span class="hljs-keyword">in</span> navigator)) {
      <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前浏览器不支持定位&#x27;</span>));
      <span class="hljs-keyword">return</span>;
    }
    navigator.<span class="hljs-property">geolocation</span>.<span class="hljs-title function_">getCurrentPosition</span>(
      <span class="hljs-function">(<span class="hljs-params">{ coords }</span>) =&gt;</span> <span class="hljs-title function_">resolve</span>({ <span class="hljs-attr">lat</span>: coords.<span class="hljs-property">latitude</span>, <span class="hljs-attr">lng</span>: coords.<span class="hljs-property">longitude</span>, <span class="hljs-attr">accuracy</span>: coords.<span class="hljs-property">accuracy</span> }),
      <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
        <span class="hljs-keyword">const</span> messages = { <span class="hljs-number">1</span>: <span class="hljs-string">&#x27;你拒绝了定位权限&#x27;</span>, <span class="hljs-number">2</span>: <span class="hljs-string">&#x27;暂时无法获取位置&#x27;</span>, <span class="hljs-number">3</span>: <span class="hljs-string">&#x27;定位超时&#x27;</span> };
        <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(messages[error.<span class="hljs-property">code</span>] ?? error.<span class="hljs-property">message</span>));
      },
      { <span class="hljs-attr">enableHighAccuracy</span>: <span class="hljs-literal">false</span>, timeout, <span class="hljs-attr">maximumAge</span>: <span class="hljs-number">60000</span> },
    );
  });
}
</code></pre></div>
<p>第三个参数是定位选项。<code>timeout</code> 是最多等多久。<code>maximumAge: 60000</code> 表示一分钟内的缓存位置也可以用，这样返回更快，适合“附近门店”这种不需要很精确的场景。</p>
<p>为什么要把 <code>accuracy</code> 也返回出去？因为定位可能误差很大。界面上可以把它展示出来，或者据此判断这个位置能不能用，比如误差上千米就提示用户手动选择。</p>
<h2>为什么室内定位不准</h2>
<p>没有 GPS 信号时，浏览器会根据 Wi-Fi 和 IP 来估算位置，误差可能是几百米到几公里。这时 <code>accuracy</code> 会很大，所以一定要看它。</p>
<h2>隐私方面要注意什么</h2>
<p>精确位置是敏感数据。只上传业务需要的精度，比如只需要城市，就把坐标四舍五入到城市级别再传。</p>
<p>用户拒绝以后，浏览器不会再弹窗了，页面要提供手动选择城市或输入地址的方式。所以也不要页面一打开就请求定位，用户不知道为什么，更容易拒绝。</p>
<p>在 iframe 里使用，还要父页面用 <code>allow=&quot;geolocation&quot;</code> 授权。</p>
<h2>常见追问</h2>
<p><strong>IP 定位和 Geolocation 有什么区别？</strong></p>
<blockquote>
<p>IP 定位在服务端完成，根据请求的 IP 地址查，不需要用户授权，但一般只能到城市级别。Geolocation 在浏览器里，要用户授权，有 GPS 或 Wi-Fi 时能精确得多。</p>
</blockquote>
<p><strong><code>watchPosition</code> 用完不停会怎样？</strong></p>
<blockquote>
<p>会一直定位，持续耗电。离开页面或不再需要时，要用它返回的 ID 调用 <code>clearWatch</code> 停掉。</p>
</blockquote>`};export{e as default};