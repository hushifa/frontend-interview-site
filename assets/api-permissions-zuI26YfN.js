var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.permissions.query({ name })</code> 返回 <code>PermissionStatus</code>，<code>state</code> 为 <code>granted</code>、<code>denied</code> 或 <code>prompt</code>，不会弹窗。</li>
<li>申请权限要调用功能本身的 API，浏览器在需要时弹出授权框。</li>
<li><code>PermissionStatus</code> 的 <code>change</code> 事件可以监听用户在浏览器设置里修改授权。</li>
<li>各浏览器支持查询的权限名称不同，不支持的名称会让 Promise 以 <code>TypeError</code> reject。</li>
</ul>
<h2>示例：根据状态决定界面</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getCameraPermission</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> status = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">permissions</span>.<span class="hljs-title function_">query</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;camera&#x27;</span> });
    status.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;change&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">updateCameraButton</span>(status.<span class="hljs-property">state</span>));
    <span class="hljs-keyword">return</span> status.<span class="hljs-property">state</span>;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;unknown&#x27;</span>;
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">openCamera</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-property">mediaDevices</span>.<span class="hljs-title function_">getUserMedia</span>({ <span class="hljs-attr">video</span>: <span class="hljs-literal">true</span> });
}
</code></pre></div>
<ul>
<li><code>granted</code>：可以直接调用功能。</li>
<li><code>prompt</code>：先用页面上的说明告诉用户为什么需要，再由用户点击触发 <code>getUserMedia</code>。</li>
<li><code>denied</code>：浏览器不会再弹窗，只能引导用户去浏览器设置里打开。</li>
<li><code>unknown</code>：查询不可用，直接调用功能并处理失败。</li>
</ul>
<h2>申请权限的对应 API</h2>
<table><thead><tr><th>权限</th><th>申请方式</th></tr></thead><tbody><tr><td>摄像头、麦克风</td><td><code>navigator.mediaDevices.getUserMedia()</code></td></tr><tr><td>地理位置</td><td><code>navigator.geolocation.getCurrentPosition()</code></td></tr><tr><td>通知</td><td><code>Notification.requestPermission()</code></td></tr><tr><td>剪贴板读取</td><td><code>navigator.clipboard.readText()</code></td></tr><tr><td>持久存储</td><td><code>navigator.storage.persist()</code></td></tr></tbody></table>
<h2>注意事项</h2>
<ul>
<li>只有在用户执行了相关操作时才申请，页面一打开就弹授权框，用户更可能拒绝，被拒后很难再恢复。</li>
<li>查询结果是 <code>granted</code> 也要处理调用失败：设备可能被其他程序占用，iframe 也可能被 Permissions-Policy 禁止。</li>
</ul>`};export{e as default};