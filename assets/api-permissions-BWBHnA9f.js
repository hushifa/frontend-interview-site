var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Permissions.query 只查询权限状态，结果是 granted、denied 或 prompt。</li>
<li>实际申请权限由对应功能 API 的流程触发。</li>
<li>查询失败和权限被拒绝要分开处理，granted 时操作仍可能失败。</li>
<li>状态变化可以通过 change 事件订阅，监听要释放；应在用户真正需要功能时再说明用途。</li>
</ul>
<p>Permissions.query 查询当前上下文对某项能力的权限状态，不是统一的“弹出授权框”方法。真正申请使用能力，通常发生在调用定位、媒体设备等具体 API 时。</p>
<p>可以先查询状态来调整提示，但最终是否成功仍以具体操作结果为准。权限许可与设备可用、文档状态和参数合法性是不同条件。</p>
<h2>三种状态应该怎样理解</h2>
<p>granted 表示当前报告为允许，denied 表示当前受拒绝或限制，prompt 表示使用时可能需要用户作出选择。prompt 不保证一定显示同一种弹窗，denied 也不保证用户刚刚点击过“拒绝”。</p>
<p>Permissions Policy、上下文安全要求、浏览器设置和用户选择都可能参与结果。例如父页面禁止某个 iframe 使用定位，iframe 查询到 denied，并不能靠不断弹提示解决。</p>
<h2>把查询失败与权限拒绝分开</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getLocationPermission</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-property">permissions</span>?.<span class="hljs-property">query</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;unknown&#x27;</span>, <span class="hljs-attr">status</span>: <span class="hljs-literal">null</span> };
  }
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> status = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">permissions</span>.<span class="hljs-title function_">query</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;geolocation&#x27;</span> });
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: status.<span class="hljs-property">state</span>, status };
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;unknown&#x27;</span>, <span class="hljs-attr">status</span>: <span class="hljs-literal">null</span> };
  }
}
</code></pre></div>
<p>这里 unknown 是应用自己定义的状态，不是 PermissionStatus.state 的标准值。它表示无法完成查询，不能伪装成 denied，否则可能错误禁用一个实际可用的功能。</p>
<p>不同浏览器支持的 descriptor 不一致，未知名称可能使 Promise 以 TypeError 拒绝。不能因为 navigator.permissions 存在，就认为所有权限名称都可查询。</p>
<h2>granted 仍然可能操作失败</h2>
<p>定位已允许，但设备无法取得位置；摄像头已允许，但设备被占用或移除；页面状态变化导致 API 不能继续运行——这些都不是简单的权限查询能预先保证的。</p>
<p>业务仍需处理具体 API 的错误和取消，给用户准确下一步：重新尝试、检查设备、选择其他输入方式或查看浏览器设置。不要把任何错误都归类成“请授予权限”。</p>
<p>权限也可能是临时的，用户可以在站点设置中撤销。页面初始化时查一次结果，不能作为整个会话永久成立的授权证明。</p>
<h2>状态变化可以订阅，但监听也要释放</h2>
<p>query 返回的 PermissionStatus 可以监听 change，并在需要时读取新的 state。组件退出或不再使用功能时移除监听，避免重复绑定和更新已销毁界面。</p>
<p>查询本身是异步的：如果组件在等待期间已经卸载，随后才取得 status，应先检查生命周期再安装监听，不能因为还没拿到对象就漏掉清理。</p>
<p>Permissions API 也不是一个通用撤销入口。应用可以停止摄像头轨道、清除自己的数据或结束会话，但浏览器站点权限设置由相应平台机制管理，不能假设所有权限都能通过同一个 revoke 方法重置。</p>
<h2>在用户真正需要功能时解释用途</h2>
<p>页面加载时同时申请定位、通知和麦克风，用户难以判断原因，也容易直接拒绝。应围绕明确任务，比如点击“附近门店”时解释定位用途，再调用相应能力。</p>
<p>若用户拒绝，提供手动选择城市等可行路径。反复立即重试不会把 denied 变成可靠的成功状态，可能只增加打扰。</p>
<p>测试时区分 API 不存在、descriptor 不支持、prompt、denied、granted 以及 granted 后操作失败。权限测试替身只能验证界面分支，真实浏览器的提示、策略继承和持久化行为需要单独验证。</p>`};export{e as default};