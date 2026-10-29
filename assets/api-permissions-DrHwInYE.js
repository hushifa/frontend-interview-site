var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>是查询。<code>navigator.permissions.query({ name: &#x27;camera&#x27; })</code> 返回一个 <code>PermissionStatus</code>，它的 <code>state</code> 是 <code>granted</code>（已允许）、<code>denied</code>（已拒绝）或 <code>prompt</code>（还没问过），整个过程不会弹窗。</p>
<p>真正申请权限，要调用功能本身的 API。比如摄像头调 <code>getUserMedia()</code>，通知调 <code>Notification.requestPermission()</code>，浏览器在需要时才弹授权框。</p>
<p>查询的用处是提前决定界面怎么显示：已允许就直接用，待询问就先解释为什么需要，已拒绝就引导用户去浏览器设置里打开。<code>PermissionStatus</code> 还有 <code>change</code> 事件，用户在设置里改了授权，页面能收到。</p>
<p>要注意，各浏览器支持查询的权限名不一样，不支持的名称会让 Promise 以 <code>TypeError</code> reject，所以要 <code>catch</code>。查到 <code>granted</code> 也不代表一定能用，调用失败照样要处理。</p>
</blockquote>
<h2>根据权限状态决定界面</h2>
<p>下面先查询摄像头权限，查询失败就返回 <code>unknown</code>。</p>
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
<p>拿到状态以后，界面按四种情况处理。<code>granted</code> 可以直接调用功能。<code>prompt</code> 先在页面上告诉用户为什么需要摄像头，再让用户点击按钮触发 <code>getUserMedia</code>。<code>denied</code> 时浏览器不会再弹窗了，只能引导用户去浏览器设置里打开。<code>unknown</code> 说明查询不可用，就直接调用功能，并处理失败。</p>
<p>为什么 <code>prompt</code> 时不直接弹？因为页面一打开就弹授权框，用户不知道要干什么，更容易拒绝。一旦拒绝，状态就变成 <code>denied</code>，浏览器不再弹窗，很难恢复。</p>
<h2>各种权限怎么申请</h2>
<p>申请都是通过功能本身。摄像头和麦克风用 <code>navigator.mediaDevices.getUserMedia()</code>；地理位置用 <code>navigator.geolocation.getCurrentPosition()</code>；通知用 <code>Notification.requestPermission()</code>；剪贴板读取用 <code>navigator.clipboard.readText()</code>；持久存储用 <code>navigator.storage.persist()</code>。</p>
<h2>为什么查到 granted 还会失败</h2>
<p>权限只是“浏览器允许了”，并不保证功能一定能用。设备可能正被其他程序占用，摄像头打不开；页面在 iframe 里，也可能被 Permissions-Policy 禁止。所以调用时照样要 <code>try/catch</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>query({ name: &#x27;xxx&#x27; })</code> 会抛 <code>TypeError</code>？</strong></p>
<blockquote>
<p>因为这个浏览器不支持查询这种权限名。各浏览器支持的名称列表不一样，所以 <code>query</code> 一定要包在 <code>try/catch</code> 里，失败时退回“直接调用功能并处理错误”。</p>
</blockquote>
<p><strong>用户拒绝以后，还能再弹一次授权框吗？</strong></p>
<blockquote>
<p>一般不能。状态变成 <code>denied</code> 后，浏览器不会再弹窗，页面只能提示用户去浏览器设置里手动打开。所以申请时机很重要，要在用户执行相关操作时再申请。</p>
</blockquote>`};export{e as default};