var e={answerHtml:`<h2>简答</h2>
<ul>
<li>只在 HTTPS 等安全上下文中可用，第一次调用时浏览器弹出授权框。</li>
<li><code>getCurrentPosition</code> 获取一次，<code>watchPosition</code> 持续获取，返回的 ID 用 <code>clearWatch</code> 停止。</li>
<li>结果中的 <code>coords.accuracy</code> 是精度半径（米），数值越大越不准，界面上应展示出来或据此判断是否可用。</li>
<li>错误码：<code>1</code> 用户拒绝，<code>2</code> 无法获取位置，<code>3</code> 超时。</li>
<li><code>enableHighAccuracy: true</code> 可能启用 GPS，更准但更慢、更耗电。</li>
</ul>
<h2>示例</h2>
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
<ul>
<li><code>maximumAge: 60000</code> 允许使用一分钟内的缓存位置，返回更快。</li>
<li>在用户点击&quot;使用我的位置&quot;后调用，页面打开就请求定位的话用户更容易拒绝。</li>
</ul>
<h2>隐私</h2>
<ul>
<li>精确位置是敏感数据，只上传业务需要的精度，例如把坐标四舍五入到城市级别。</li>
<li>用户拒绝后浏览器不再弹窗，应提供手动选择城市或输入地址的方式。</li>
<li>iframe 中使用要父页面授权 <code>allow=&quot;geolocation&quot;</code>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么室内定位误差很大：没有 GPS 信号时，浏览器依靠 Wi-Fi 和 IP 估算位置，精度可能是几百米到几公里。</li>
<li>IP 定位和 Geolocation 的区别：IP 定位在服务端完成，不需要授权，只能到城市级别。</li>
</ul>`};export{e as default};