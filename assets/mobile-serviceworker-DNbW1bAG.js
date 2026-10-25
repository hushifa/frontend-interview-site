var e={answerHtml:`<p>Service Worker 是浏览器管理的事件驱动脚本，可以在自己的作用范围内处理请求、缓存和其他受支持事件。它不直接访问 DOM，也不是一个保证永久运行的后台线程；浏览器可以停止它，之后收到事件再启动。</p>
<p>更新困难往往来自三个状态没有分清：注册成功、新脚本激活、某个页面已经受它控制，这三件事不一定同时发生。</p>
<h3>安装完成之后，新版本可能正常等待</h3>
<p>首次注册会尝试获取脚本并进入 install；必要安装工作成功后，可以进入激活流程。已有旧版本控制页面时，新版本通常先等待，避免同一批页面在运行中突然切换处理逻辑。</p>
<p>install 中使用 event.waitUntil 让浏览器等待必要异步准备。如果预缓存失败导致 Promise 拒绝，本次安装可能失败，但这不等于旧的可用版本也应该被删除。</p>
<p>activate 常用于清理过期缓存与迁移，但清理应限定到当前应用拥有的缓存名前缀，不能删除同源下其他功能的所有缓存。</p>
<h3>缓存策略应该限定到明确资源</h3>
<p>下面是放在根路径 /sw.js 的教学示例，只预缓存一个离线页面，并对导航网络失败提供回退。它不是整站离线方案：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CACHE</span> = <span class="hljs-string">&#x27;reader-offline-v1&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">OFFLINE</span> = <span class="hljs-string">&#x27;/offline.html&#x27;</span>;

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;install&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">waitUntil</span>(caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">cache</span>) =&gt;</span> cache.<span class="hljs-title function_">add</span>(<span class="hljs-variable constant_">OFFLINE</span>)));
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">request</span>.<span class="hljs-property">mode</span> !== <span class="hljs-string">&#x27;navigate&#x27;</span>) <span class="hljs-keyword">return</span>;
  event.<span class="hljs-title function_">respondWith</span>((<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(event.<span class="hljs-property">request</span>);
    } <span class="hljs-keyword">catch</span> {
      <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE</span>);
      <span class="hljs-keyword">const</span> fallback = <span class="hljs-keyword">await</span> cache.<span class="hljs-title function_">match</span>(<span class="hljs-variable constant_">OFFLINE</span>);
      <span class="hljs-keyword">return</span> fallback ?? <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-string">&#x27;当前离线，请稍后重试&#x27;</span>, {
        <span class="hljs-attr">status</span>: <span class="hljs-number">503</span>,
        <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;text/plain; charset=utf-8&#x27;</span> },
      });
    }
  })());
});
</code></pre></div>
<p>部署时必须提供 offline.html；该页面最好自包含，或另行准备其所需样式和图片。示例没有缓存所有页面，也没有把任意用户响应写入公共缓存。</p>
<p>fetch 遇到 HTTP 404/500 通常不会拒绝 Promise，所以这里的离线回退只处理网络类失败。如果业务要对特定 HTTP 状态回退，必须显式检查 response.ok 或 status，不能误以为 catch 会处理所有错误。</p>
<p>respondWith 应在事件处理时及时调用；其内部 Promise 可以继续异步工作。额外后台缓存写入则需要正确使用 waitUntil 等生命周期机制，避免响应发出后工作被中断。</p>
<h3>Cache API 不是自动执行 HTTP 缓存策略</h3>
<p>应用通过 Cache API 保存响应后，需要自己决定何时更新和淘汰。不能以为响应带了 Cache-Control，Cache API 就一定按相同方式自动过期。</p>
<p>缓存优先适合版本明确的静态资源，网络优先适合更关注新鲜度的内容，stale-while-revalidate 可以先返回旧内容再刷新。选择应看数据语义；支付状态、登录响应和私有数据不能一概缓存。</p>
<p>一个 Response 的主体流通常只能消费一次，同时缓存和返回时要考虑 clone。还要管理缓存数量与体积，浏览器配额和存储清理不会因为用了 Service Worker 而消失。</p>
<h3>skipWaiting 与 clients.claim 各自改变什么</h3>
<p>skipWaiting 请求新 worker 不再等待旧客户端全部退出，尽快进入激活；clients.claim 则可让已激活的 worker 接管作用范围内符合条件但尚未受控的客户端。它们不是同一个“立即更新”按钮。</p>
<p>强行接管可能让旧 HTML 和旧业务代码配合新请求策略运行，产生资源或数据协议不兼容。应确认版本兼容，或向用户提示更新，保存必要状态后协调重载，而不是默认在每次安装时强制执行两者。</p>
<p>register 的 Promise 完成，也不表示 navigator.serviceWorker.controller 此刻一定存在。可以按需要观察 controllerchange，但监听器与重载逻辑要避免循环触发。</p>
<h3>调试要区分网络、HTTP 缓存与应用缓存</h3>
<p>看到资源仍旧，先查看页面由哪个 worker 控制、是否存在 waiting 版本、请求是否由 worker 返回，以及 Cache Storage 里保存了什么。只禁用普通网络缓存，不一定绕开 Service Worker 的 fetch 逻辑。</p>
<p>注销 registration 也不等于立即清空全部 Cache Storage，已打开页面的控制状态还要结合生命周期判断。开发工具里的强制更新选项方便调试，但不能作为真实用户更新流程的验证结果。</p>
<p>最终要测首次安装、离线启动、安装失败、多标签页、旧页面更新、存储被清理和缓存缺失。可靠更新依赖明确版本与恢复路径，而不是不断给文件名加随机数碰运气。</p>`};export{e as default};