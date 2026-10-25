var e={answerHtml:`<p>Geolocation API 返回的是设备推算的位置，不是绝对精确的地理事实。浏览器可能利用卫星定位、Wi-Fi、基站等信息，结果的速度、精度和可用性都受设备与环境影响。</p>
<p>应用应先明确用途：查附近门店可能只需大致位置，导航需要持续更新，账号风控则不能仅凭网页返回的坐标作出可信身份判断。</p>
<h3>一次查询与持续观察的生命周期不同</h3>
<p>getCurrentPosition 请求一次位置，通过成功或错误回调返回，不直接返回 Promise。watchPosition 会持续报告位置变化，并返回 watch ID，结束时要调用 clearWatch。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">watchLocation</span>(<span class="hljs-params">onPosition, onError</span>) {
  <span class="hljs-keyword">if</span> (!navigator.<span class="hljs-property">geolocation</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前环境不支持定位&#x27;</span>);
  <span class="hljs-keyword">let</span> active = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">const</span> id = navigator.<span class="hljs-property">geolocation</span>.<span class="hljs-title function_">watchPosition</span>(
    <span class="hljs-function">(<span class="hljs-params">position</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (active) <span class="hljs-title function_">onPosition</span>(position);
    },
    <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (active) <span class="hljs-title function_">onError</span>(error);
    },
    { <span class="hljs-attr">enableHighAccuracy</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">timeout</span>: <span class="hljs-number">10000</span>, <span class="hljs-attr">maximumAge</span>: <span class="hljs-number">30000</span> },
  );
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    active = <span class="hljs-literal">false</span>;
    navigator.<span class="hljs-property">geolocation</span>.<span class="hljs-title function_">clearWatch</span>(id);
  };
}
</code></pre></div>
<p>示例适合允许短时间缓存的大致位置场景，不是导航推荐配置。active 防止关闭后仍提交迟到结果；真正停止观察仍靠 clearWatch，不能只丢弃回调而保留持续工作。</p>
<p>getCurrentPosition 没有通用的 AbortSignal 参数。包装成 Promise 不会增加真正的底层取消能力；若组件退出，可忽略迟到结果，或按需要采用可停止的观察流程。</p>
<h3>三个选项分别影响什么</h3>
<p>enableHighAccuracy 表示希望尽可能获得较好精度，不保证一定启用 GPS，也不保证最终更准。可能增加等待和电量消耗，应按任务需要选择。</p>
<p>timeout 控制定位过程允许的等待，不能把它理解成所有权限提示与页面生命周期条件下的绝对墙钟截止。若产品要求用户不能一直停留在加载状态，应额外设计取消或稍后重试入口。</p>
<p>maximumAge 表示可以接受多旧的缓存结果，单位是毫秒。允许缓存可以更快，但必须结合 position.timestamp 判断它是否仍符合业务。设置为 0 要求尝试新位置，也不等于结果没有误差。</p>
<h3>精度字段比小数位数更有意义</h3>
<p>coords.latitude 和 longitude 是坐标，accuracy 以米表达水平精度信息。坐标显示很多小数位，不代表定位精确到厘米。海拔、速度或方向等附加值可能不可用，不能直接当成正常数值计算。</p>
<p>界面可以显示定位范围或“位置可能不够精确”，而不是始终把地图上的一个点当成确定位置。连续结果也可能抖动，应根据场景做过滤或采用地图匹配，不能简单认为每次位置变化都代表用户真的移动。</p>
<h3>失败原因要对应可行恢复路径</h3>
<p>常见错误包括权限被拒绝、位置不可用和超时。权限受安全上下文、浏览器设置与 Permissions Policy 等约束；定位不可用则可能是设备或环境问题，两者不应统一提示“请开启权限”。</p>
<p>用户拒绝时提供手动输入城市或地址；超时可允许再次尝试；页面不需要实时位置时及时停止观察。不要为了提高成功率持续后台请求高精度位置。</p>
<p>位置属于敏感数据，应只采集完成任务所需精度和持续时间，明确是否上传与保存。服务端不能把浏览器坐标作为不可伪造的凭证，涉及配送范围或高风险操作时仍要执行自身规则。</p>
<p>测试替身可以检查成功、超时和清理分支，但定位精度、系统提示、室内外差异与电量影响需要真实设备验证。</p>`};export{e as default};